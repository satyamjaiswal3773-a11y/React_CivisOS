import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { isAuthenticated, hasAnyRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles?.length && !hasAnyRole(...roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/** Guard routes by permission code(s). Any matching code is enough. */
export function RequirePermission({ permission }: { permission: string | string[] }) {
  const { isAuthenticated, hasPermission, accessLoading } = useAuth()
  const location = useLocation()
  const codes = Array.isArray(permission) ? permission : [permission]

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (accessLoading) {
    return (
      <div className="page">
        <p className="muted">Loading access…</p>
      </div>
    )
  }

  if (!hasPermission(...codes)) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname, permission: codes[0] }} />
  }

  return <Outlet />
}
