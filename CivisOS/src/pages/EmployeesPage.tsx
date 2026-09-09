import { useEffect, useState, type FormEvent } from 'react'
import { employeesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { CreateEmployeeRequest, DepartmentDto, DesignationDto, EmployeeDto, WorkShift } from '../types/api'
import { ROLES } from '../types/api'

const shifts: WorkShift[] = ['Morning', 'Afternoon', 'Night', 'General']

const emptyForm: CreateEmployeeRequest = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  joiningDate: new Date().toISOString(),
  shift: 'General',
  departmentId: '',
  designationId: '',
  supervisorId: null,
  userId: null,
  isActive: true,
}

export function EmployeesPage() {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor)
  const [items, setItems] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [designations, setDesignations] = useState<DesignationDto[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateEmployeeRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [emps, deps, desigs] = await Promise.all([
        employeesApi.list({ pageNumber: 1, pageSize: 50, search: search || undefined }),
        employeesApi.departments(),
        employeesApi.designations(),
      ])
      setItems(emps.items)
      setDepartments(deps)
      setDesignations(desigs)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await employeesApi.create({
        ...form,
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        joiningDate: new Date(form.joiningDate).toISOString(),
      })
      setShowForm(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Employees"
        subtitle="Workforce directory and org structure"
        actions={
          canManage ? (
            <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'Add employee'}</Button>
          ) : undefined
        }
      />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="toolbar">
          <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="secondary" onClick={() => void load()}>
            Search
          </Button>
        </div>

        {showForm ? (
          <form className="form-grid" onSubmit={onCreate}>
            <Input placeholder="Employee code" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} required />
            <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <Input placeholder="Email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phoneNumber ?? ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            <Input type="date" value={form.joiningDate.slice(0, 10)} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} required />
            <Select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as WorkShift })}>
              {shifts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
              <option value="">Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })} required>
              <option value="">Designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </form>
        ) : null}

        {items.length === 0 ? (
          <EmptyState message="No employees found." />
        ) : (
          <Table headers={['Code', 'Name', 'Department', 'Designation', 'Shift', 'Status', 'Joined']}>
            {items.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.employeeCode}</td>
                <td>
                  {emp.firstName} {emp.lastName}
                </td>
                <td>{emp.departmentName}</td>
                <td>{emp.designationName}</td>
                <td>{emp.shift}</td>
                <td>
                  <Badge tone={emp.isActive ? 'ok' : 'neutral'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td>{formatDate(emp.joiningDate)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
