import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { permissionsApi } from '../../api'
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Select } from '../../components/ui'
import { getErrorMessage, isForbiddenError } from '../../lib/http'
import { ROLES, type PermissionDto, type UserPermissionOverrideDto } from '../../types/api'

type OverrideMode = 'none' | 'grant' | 'deny'

function groupByModule(items: PermissionDto[]) {
  const map = new Map<string, PermissionDto[]>()
  for (const p of items) {
    const key = p.module || 'General'
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function modeFromOverrides(overrides: UserPermissionOverrideDto[], code: string): OverrideMode {
  const hit = overrides.find((o) => o.permissionCode === code)
  if (!hit) return 'none'
  return hit.isGranted ? 'grant' : 'deny'
}

export function UserPermissionsPage() {
  const { userId = '' } = useParams()
  const [catalog, setCatalog] = useState<PermissionDto[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [effective, setEffective] = useState<string[]>([])
  const [modes, setModes] = useState<Record<string, OverrideMode>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isSuperAdminTarget = roles.includes(ROLES.SuperAdmin)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [matrix, all] = await Promise.all([permissionsApi.userMatrix(userId), permissionsApi.list()])
      setEmail(matrix.email)
      setFullName(matrix.fullName)
      setRoles(matrix.roles ?? [])
      setEffective(matrix.effectivePermissionCodes ?? [])
      setCatalog(all.filter((p) => p.isActive !== false))
      const next: Record<string, OverrideMode> = {}
      for (const p of all) {
        next[p.code] = modeFromOverrides(matrix.overrides ?? [], p.code)
      }
      setModes(next)
    } catch (err) {
      setError(
        isForbiddenError(err)
          ? 'Forbidden: you need permissions.manage to view user permissions.'
          : getErrorMessage(err, 'Failed to load user permissions.'),
      )
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const modules = useMemo(() => groupByModule(catalog), [catalog])

  async function onSave() {
    if (isSuperAdminTarget) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const overrides: UserPermissionOverrideDto[] = Object.entries(modes)
        .filter(([, mode]) => mode !== 'none')
        .map(([permissionCode, mode]) => ({
          permissionCode,
          isGranted: mode === 'grant',
        }))
      const result = await permissionsApi.setUserPermissions(userId, { overrides })
      if (result.data) {
        setEffective(result.data.effectivePermissionCodes ?? [])
        setRoles(result.data.roles ?? roles)
        setEmail(result.data.email || email)
        setFullName(result.data.fullName || fullName)
        const next: Record<string, OverrideMode> = {}
        for (const p of catalog) {
          next[p.code] = modeFromOverrides(result.data.overrides ?? [], p.code)
        }
        setModes(next)
      }
      setSuccess(result.message || 'User permission overrides saved.')
    } catch (err) {
      setError(
        isForbiddenError(err)
          ? 'Forbidden: you need permissions.manage to save user overrides.'
          : getErrorMessage(err, 'Failed to save user overrides.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="User Permissions"
        subtitle="Grant or deny overrides on top of role permissions"
        actions={
          <>
            <Link className="btn btn-secondary" to="/users">
              Back to Users
            </Link>
            <Button onClick={() => void onSave()} disabled={saving || loading || isSuperAdminTarget}>
              {saving ? 'Saving…' : 'Save overrides'}
            </Button>
          </>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <Card>
        {loading ? (
          <EmptyState message="Loading user permission matrix…" />
        ) : (
          <>
            <div className="card-title-row">
              <div>
                <h2>{fullName || 'User'}</h2>
                <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                  {email}
                </p>
              </div>
              <div className="chip-row" style={{ marginTop: 0 }}>
                {roles.map((r) => (
                  <Badge key={r} tone={r === ROLES.SuperAdmin ? 'ok' : 'info'}>
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="muted">
              Deny overrides role. Grant adds permission. SuperAdmin cannot be overridden.
            </p>
            {isSuperAdminTarget ? (
              <ErrorBanner message="This user is SuperAdmin — overrides are not allowed." />
            ) : null}
          </>
        )}
      </Card>

      {!loading ? (
        <>
          <Card>
            <div className="card-title-row">
              <h2>Effective permissions</h2>
              <span className="tiny muted">{effective.length} codes</span>
            </div>
            {effective.length === 0 ? (
              <EmptyState message="No effective permissions." />
            ) : (
              <div className="chip-row">
                {effective.map((code) => (
                  <span key={code} className="chip">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="card-title-row">
              <h2>Overrides editor</h2>
            </div>
            {modules.length === 0 ? (
              <EmptyState message="Permission catalog is empty." />
            ) : (
              <div className="perm-modules">
                {modules.map(([moduleName, perms]) => (
                  <section key={moduleName} className="perm-module">
                    <header className="perm-module-header">
                      <strong>{moduleName}</strong>
                    </header>
                    <ul className="perm-list user-perm-list">
                      {perms.map((p) => {
                        const inherited = effective.includes(p.code) && modes[p.code] === 'none'
                        return (
                          <li key={p.id || p.code}>
                            <div className="user-perm-row">
                              <div>
                                <strong>{p.name}</strong>
                                <code className="perm-code">{p.code}</code>
                                {p.description ? <span className="muted">{p.description}</span> : null}
                                <div className="tiny muted">
                                  {modes[p.code] === 'grant'
                                    ? 'Override: Grant'
                                    : modes[p.code] === 'deny'
                                      ? 'Override: Deny'
                                      : inherited
                                        ? 'Inherited from role (effective)'
                                        : 'Not granted by role'}
                                </div>
                              </div>
                              <Select
                                value={modes[p.code] || 'none'}
                                disabled={isSuperAdminTarget}
                                onChange={(e) =>
                                  setModes((prev) => ({
                                    ...prev,
                                    [p.code]: e.target.value as OverrideMode,
                                  }))
                                }
                              >
                                <option value="none">None</option>
                                <option value="grant">Grant</option>
                                <option value="deny">Deny</option>
                              </Select>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}
