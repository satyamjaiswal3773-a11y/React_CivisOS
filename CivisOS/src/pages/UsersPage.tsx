import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, Table } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import { PERMISSIONS, ROLES, type RegisterRequest, type UserDto } from '../types/api'

const roleOptions = Object.values(ROLES)

const emptyForm: RegisterRequest & { confirmPassword: string } = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  role: ROLES.Employee,
}

export function UsersPage() {
  const { hasAnyRole, hasPermission } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin)
  const canManagePermissions = hasPermission(PERMISSIONS.Manage)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [created, setCreated] = useState<UserDto[]>([])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSaving(true)
    try {
      const result = await authApi.register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber?.trim() || null,
        role: form.role,
      })
      setCreated((prev) => [result.user, ...prev.filter((u) => u.id !== result.user.id)])
      setSuccess(`User ${result.user.email} created successfully.`)
      setForm({ ...emptyForm, role: form.role })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create user.'))
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div className="page">
        <PageHeader title="Users" subtitle="Create login accounts for society staff" />
        <ErrorBanner message="Only Super Admin or Society Admin can add users." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle="Create login accounts with email, password, and role"
        actions={
          canManagePermissions ? (
            <Link className="btn btn-secondary" to="/permissions">
              Permissions hub
            </Link>
          ) : undefined
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <Card>
        <div className="card-title-row">
          <h2>Add user</h2>
        </div>
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            First name
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              autoComplete="off"
            />
          </label>
          <label>
            Last name
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              autoComplete="off"
            />
          </label>
          <label>
            Email
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="off"
            />
          </label>
          <label>
            Phone
            <Input
              type="tel"
              value={form.phoneNumber ?? ''}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label>
            Password
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="card-title-row">
          <h2>Created this session</h2>
        </div>
        {created.length === 0 ? (
          <EmptyState message="New users you create will appear here until you refresh." />
        ) : (
          <Table headers={['Name', 'Email', 'Phone', 'Roles', 'Actions']}>
            {created.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>{u.phoneNumber || '—'}</td>
                <td>
                  <div className="chip-row" style={{ marginTop: 0 }}>
                    {(u.roles?.length ? u.roles : ['—']).map((r) => (
                      <Badge key={r} tone={r === ROLES.SuperAdmin || r === ROLES.SocietyAdmin ? 'ok' : 'info'}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td>
                  {canManagePermissions ? (
                    <Link className="btn btn-secondary" to={`/permissions/users/${u.id}`}>
                      Permissions
                    </Link>
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
