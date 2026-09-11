import { Link, useLocation } from 'react-router-dom'
import { Card, PageHeader } from '../components/ui'

export function ForbiddenPage() {
  const location = useLocation()
  const from = (location.state as { from?: string; permission?: string } | null)?.from
  const permission = (location.state as { permission?: string } | null)?.permission

  return (
    <div className="page">
      <PageHeader title="Forbidden" subtitle="You do not have permission to view this page." />
      <Card>
        <p className="muted">
          {permission
            ? `Missing permission: ${permission}`
            : 'Your account is not allowed to access this resource.'}
        </p>
        {from ? <p className="tiny muted">Attempted path: {from}</p> : null}
        <div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
          <Link className="btn btn-primary" to="/">
            Go to dashboard
          </Link>
          <Link className="btn btn-secondary" to="/">
            Back home
          </Link>
        </div>
      </Card>
    </div>
  )
}
