import { Link } from 'react-router-dom'
import { IconShield, IconUserPlus, IconUsers } from '../../components/icons'
import { Card, PageHeader } from '../../components/ui'

export function PermissionsHubPage() {
  return (
    <div className="page">
      <PageHeader
        title="Permissions"
        subtitle="Manage role access and per-user permission overrides"
      />
      <div className="grid-2">
        <Link to="/permissions/roles" className="perm-hub-card">
          <Card>
            <div className="perm-hub-icon">
              <IconShield size={22} />
            </div>
            <h2>Role Permissions</h2>
            <p className="muted">Choose which features each role can access.</p>
          </Card>
        </Link>
        <Link to="/users" className="perm-hub-card">
          <Card>
            <div className="perm-hub-icon">
              <IconUsers size={22} />
            </div>
            <h2>User Overrides</h2>
            <p className="muted">
              Open a user from Users, then click Permissions to grant or deny specific codes.
            </p>
          </Card>
        </Link>
        <Link to="/users" className="perm-hub-card">
          <Card>
            <div className="perm-hub-icon">
              <IconUserPlus size={22} />
            </div>
            <h2>Users</h2>
            <p className="muted">Create accounts, then tune their effective permissions.</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
