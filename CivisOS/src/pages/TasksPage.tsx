import { useEffect, useState, type FormEvent } from 'react'
import { employeesApi, tasksApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, Table, TextArea, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { EmployeeDto, WorkTaskDto, WorkTaskPriority, WorkTaskStatus } from '../types/api'
import { ADMIN_ROLES, ROLES } from '../types/api'

const priorities: WorkTaskPriority[] = ['Low', 'Medium', 'High', 'Critical']

export function TasksPage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)
  const canStart = hasAnyRole(...ADMIN_ROLES, ROLES.Employee)
  const [items, setItems] = useState<WorkTaskDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as WorkTaskPriority,
    deadlineUtc: '',
    assigneeEmployeeId: '',
  })

  async function load() {
    try {
      const result = isAdmin
        ? await tasksApi.list({ pageNumber: 1, pageSize: 50 })
        : await tasksApi.my({ pageNumber: 1, pageSize: 50 })
      setItems(result.items)
      if (isAdmin) {
        const emps = await employeesApi.list({ pageNumber: 1, pageSize: 100 })
        setEmployees(emps.items)
      }
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [isAdmin])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await tasksApi.create({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        deadlineUtc: form.deadlineUtc ? new Date(form.deadlineUtc).toISOString() : null,
        assigneeEmployeeId: form.assigneeEmployeeId || null,
      })
      setShowForm(false)
      setForm({ title: '', description: '', priority: 'Medium', deadlineUtc: '', assigneeEmployeeId: '' })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function startTask(id: string) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
      })
      await tasksApi.start(id, pos.coords.latitude, pos.coords.longitude)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function setStatus(id: string, status: WorkTaskStatus) {
    try {
      await tasksApi.updateStatus(id, status)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function approve(id: string) {
    try {
      await tasksApi.approve(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Tasks"
        subtitle={isAdmin ? 'Assign and track work across teams' : 'Your assigned work'}
        actions={isAdmin ? <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'New task'}</Button> : undefined}
      />
      {error ? <ErrorBanner message={error} /> : null}

      {showForm ? (
        <Card>
          <form className="form-grid" onSubmit={onCreate}>
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextArea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WorkTaskPriority })}>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Input type="datetime-local" value={form.deadlineUtc} onChange={(e) => setForm({ ...form, deadlineUtc: e.target.value })} />
            <Select value={form.assigneeEmployeeId} onChange={(e) => setForm({ ...form, assigneeEmployeeId: e.target.value })}>
              <option value="">Assignee (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
            <Button type="submit">Create task</Button>
          </form>
        </Card>
      ) : null}

      <Card>
        {items.length === 0 ? (
          <EmptyState message="No tasks found." />
        ) : (
          <Table headers={['Title', 'Assignee', 'Priority', 'Status', 'Deadline', 'Actions']}>
            {items.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.title}</strong>
                  {t.description ? <div className="muted tiny">{t.description}</div> : null}
                </td>
                <td>{t.assigneeEmployeeName || '—'}</td>
                <td>
                  <Badge tone={t.priority === 'Critical' || t.priority === 'High' ? 'danger' : 'info'}>{t.priority}</Badge>
                </td>
                <td>
                  <Badge tone={t.status === 'Completed' ? 'ok' : t.status === 'Overdue' ? 'danger' : 'neutral'}>{t.status}</Badge>
                </td>
                <td>{formatDate(t.deadlineUtc)}</td>
                <td className="actions">
                  {canStart && t.status === 'Pending' ? (
                    <Button variant="secondary" onClick={() => void startTask(t.id)}>
                      Start
                    </Button>
                  ) : null}
                  {isAdmin && t.status === 'InProgress' ? (
                    <Button variant="secondary" onClick={() => void setStatus(t.id, 'Completed')}>
                      Complete
                    </Button>
                  ) : null}
                  {isAdmin && t.status === 'Completed' && !t.approvedAtUtc ? (
                    <Button onClick={() => void approve(t.id)}>Approve</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
