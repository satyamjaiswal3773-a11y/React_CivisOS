import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { permissionsApi } from '../../api'
import { Button, Card, EmptyState, ErrorBanner, PageHeader, Select } from '../../components/ui'
import { getErrorMessage, isForbiddenError } from '../../lib/http'
import { EDITABLE_ROLES, ROLES, type PermissionDto } from '../../types/api'

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

export function RolePermissionsPage() {
  const [roleName, setRoleName] = useState<string>(ROLES.SocietyAdmin)
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [baseline, setBaseline] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isSuperAdminRole = roleName === ROLES.SuperAdmin
  const dirty = useMemo(() => {
    const current = [...selected].sort().join('|')
    return current !== baseline
  }, [selected, baseline])

  const blocker = useBlocker(dirty && !saving)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    const leave = window.confirm('You have unsaved permission changes. Leave this page anyway?')
    if (leave) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  const load = useCallback(async (role: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const matrix = await permissionsApi.roleMatrix(role)
      const granted = new Set(matrix.grantedPermissionCodes ?? [])
      setAllPermissions(matrix.allPermissions ?? [])
      setSelected(granted)
      setBaseline([...granted].sort().join('|'))
    } catch (err) {
      setAllPermissions([])
      setSelected(new Set())
      setBaseline('')
      setError(
        isForbiddenError(err)
          ? 'Forbidden: you need permissions.manage to view role permissions.'
          : getErrorMessage(err, 'Failed to load role permissions.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(roleName)
  }, [roleName, load])

  function toggle(code: string) {
    if (isSuperAdminRole) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setSuccess('')
  }

  function toggleModule(modulePerms: PermissionDto[], checked: boolean) {
    if (isSuperAdminRole) return
    setSelected((prev) => {
      const next = new Set(prev)
      for (const p of modulePerms) {
        if (checked) next.add(p.code)
        else next.delete(p.code)
      }
      return next
    })
    setSuccess('')
  }

  async function onSave() {
    if (isSuperAdminRole) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await permissionsApi.setRolePermissions(roleName, {
        permissionCodes: [...selected],
      })
      const granted = new Set(result.data?.grantedPermissionCodes ?? [...selected])
      if (result.data?.allPermissions?.length) setAllPermissions(result.data.allPermissions)
      setSelected(granted)
      setBaseline([...granted].sort().join('|'))
      setSuccess(result.message || `Saved permissions for ${roleName}.`)
    } catch (err) {
      setError(
        isForbiddenError(err)
          ? 'Forbidden: you need permissions.manage to save role permissions.'
          : getErrorMessage(err, 'Failed to save role permissions.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const modules = useMemo(() => groupByModule(allPermissions.filter((p) => p.isActive !== false)), [allPermissions])

  return (
    <div className="page">
      <PageHeader
        title="Role Permissions"
        subtitle="Select which permissions each role receives"
        actions={
          <Button onClick={() => void onSave()} disabled={saving || loading || isSuperAdminRole || !dirty}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <div className="success-banner">{success}</div> : null}
      {dirty && !isSuperAdminRole ? <p className="tiny warn-text">You have unsaved changes.</p> : null}

      <Card>
        <div className="toolbar">
          <label className="inline-field">
            Role
            <Select
              value={roleName}
              onChange={(e) => {
                if (dirty && !window.confirm('Discard unsaved changes for this role?')) return
                setRoleName(e.target.value)
              }}
            >
              <option value={ROLES.SuperAdmin}>SuperAdmin (read-only)</option>
              {EDITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
          {isSuperAdminRole ? (
            <p className="muted" style={{ margin: 0 }}>
              SuperAdmin permissions cannot be edited.
            </p>
          ) : null}
        </div>

        {loading ? (
          <EmptyState message="Loading permission matrix…" />
        ) : modules.length === 0 ? (
          <EmptyState message="No permissions returned for this role." />
        ) : (
          <div className="perm-modules">
            {modules.map(([moduleName, perms]) => {
              const allChecked = perms.every((p) => selected.has(p.code))
              const someChecked = perms.some((p) => selected.has(p.code))
              return (
                <section key={moduleName} className="perm-module">
                  <header className="perm-module-header">
                    <label className="perm-check">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = !allChecked && someChecked
                        }}
                        disabled={isSuperAdminRole}
                        onChange={(e) => toggleModule(perms, e.target.checked)}
                      />
                      <strong>{moduleName}</strong>
                    </label>
                    <span className="tiny muted">
                      {perms.filter((p) => selected.has(p.code)).length}/{perms.length}
                    </span>
                  </header>
                  <ul className="perm-list">
                    {perms.map((p) => (
                      <li key={p.id || p.code}>
                        <label className="perm-check">
                          <input
                            type="checkbox"
                            checked={selected.has(p.code)}
                            disabled={isSuperAdminRole}
                            onChange={() => toggle(p.code)}
                          />
                          <span>
                            <strong>{p.name}</strong>
                            <code className="perm-code">{p.code}</code>
                            {p.description ? <span className="muted">{p.description}</span> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
