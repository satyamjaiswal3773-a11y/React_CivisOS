import { useEffect, useState, type FormEvent } from 'react'
import { cleaningApi, employeesApi, geoFencesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { CleaningAreaDto, CleaningFrequency, CleaningLogDto, CleaningScheduleDto, EmployeeDto, GeoFenceDto } from '../types/api'
import { ROLES } from '../types/api'

const frequencies: CleaningFrequency[] = ['Daily', 'Weekly', 'BiWeekly', 'Monthly']

export function CleaningPage() {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor)
  const canLog = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor, ROLES.Employee)
  const [areas, setAreas] = useState<CleaningAreaDto[]>([])
  const [schedules, setSchedules] = useState<CleaningScheduleDto[]>([])
  const [logs, setLogs] = useState<CleaningLogDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [fences, setFences] = useState<GeoFenceDto[]>([])
  const [error, setError] = useState('')
  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    geoFenceId: '',
    frequency: 'Daily' as CleaningFrequency,
    assignedEmployeeId: '',
  })
  const [logAreaId, setLogAreaId] = useState('')

  async function load() {
    try {
      const [a, s, l] = await Promise.all([
        cleaningApi.areas({ pageNumber: 1, pageSize: 50 }),
        cleaningApi.schedules({ pageNumber: 1, pageSize: 50 }),
        cleaningApi.logs({ pageNumber: 1, pageSize: 30 }),
      ])
      setAreas(a.items)
      setSchedules(s.items)
      setLogs(l.items)
      if (canManage) {
        const [emps, fencePage] = await Promise.all([
          employeesApi.list({ pageNumber: 1, pageSize: 100 }),
          geoFencesApi.list({ pageNumber: 1, pageSize: 50 }),
        ])
        setEmployees(emps.items)
        setFences(fencePage.items)
      }
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [canManage])

  async function createArea(e: FormEvent) {
    e.preventDefault()
    try {
      await cleaningApi.createArea({
        name: areaForm.name,
        description: areaForm.description || undefined,
        geoFenceId: areaForm.geoFenceId || null,
        frequency: areaForm.frequency,
        assignedEmployeeId: areaForm.assignedEmployeeId || null,
      })
      setAreaForm({ name: '', description: '', geoFenceId: '', frequency: 'Daily', assignedEmployeeId: '' })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function startLog() {
    if (!logAreaId) return
    try {
      await cleaningApi.createLog({ cleaningAreaId: logAreaId })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function completeLog(id: string) {
    try {
      await cleaningApi.completeLog(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <PageHeader title="Cleaning" subtitle="Areas, schedules, and cleaning logs" />
      {error ? <ErrorBanner message={error} /> : null}

      {canManage ? (
        <Card>
          <h2>Add cleaning area</h2>
          <form className="form-grid" onSubmit={createArea}>
            <Input placeholder="Area name" value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} required />
            <Input placeholder="Description" value={areaForm.description} onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })} />
            <Select value={areaForm.frequency} onChange={(e) => setAreaForm({ ...areaForm, frequency: e.target.value as CleaningFrequency })}>
              {frequencies.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            <Select value={areaForm.geoFenceId} onChange={(e) => setAreaForm({ ...areaForm, geoFenceId: e.target.value })}>
              <option value="">Geo-fence (optional)</option>
              {fences.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
            <Select value={areaForm.assignedEmployeeId} onChange={(e) => setAreaForm({ ...areaForm, assignedEmployeeId: e.target.value })}>
              <option value="">Assignee (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
            <Button type="submit">Create area</Button>
          </form>
        </Card>
      ) : null}

      {canLog ? (
        <Card>
          <h2>Start cleaning log</h2>
          <div className="toolbar">
            <Select value={logAreaId} onChange={(e) => setLogAreaId(e.target.value)}>
              <option value="">Select area</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Button onClick={() => void startLog()}>Start</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid-2">
        <Card>
          <h2>Areas</h2>
          {areas.length === 0 ? (
            <EmptyState message="No cleaning areas." />
          ) : (
            <Table headers={['Name', 'Frequency', 'Assignee', 'Status', 'Next due']}>
              {areas.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.frequency}</td>
                  <td>{a.assignedEmployeeName || '—'}</td>
                  <td>
                    <Badge tone={a.status === 'Active' ? 'ok' : 'neutral'}>{a.status}</Badge>
                  </td>
                  <td>{formatDate(a.nextCleanDueAtUtc)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2>Schedules</h2>
          {schedules.length === 0 ? (
            <EmptyState message="No schedules." />
          ) : (
            <Table headers={['Area', 'Frequency', 'Time', 'Assignee']}>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td>{s.cleaningAreaName}</td>
                  <td>{s.frequency}</td>
                  <td>{s.preferredTimeLocal}</td>
                  <td>{s.assignedEmployeeName || '—'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Card>
        <h2>Recent logs</h2>
        {logs.length === 0 ? (
          <EmptyState message="No cleaning logs yet." />
        ) : (
          <Table headers={['Area', 'Employee', 'Started', 'Status', '']}>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.cleaningAreaName}</td>
                <td>{log.employeeName}</td>
                <td>{formatDate(log.startedAtUtc)}</td>
                <td>
                  <Badge tone={log.status === 'Completed' || log.status === 'Inspected' ? 'ok' : 'info'}>{log.status}</Badge>
                </td>
                <td>
                  {log.status === 'Started' && canLog ? (
                    <Button variant="secondary" onClick={() => void completeLog(log.id)}>
                      Complete
                    </Button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
