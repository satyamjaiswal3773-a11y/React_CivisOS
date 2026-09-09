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
