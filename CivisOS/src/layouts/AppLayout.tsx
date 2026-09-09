import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ADMIN_ROLES, ROLES } from '../types/api'
import { Button } from '../components/ui'
import appLogo from '../assets/App_logo.jpg'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/employees', label: 'Employees', roles: ADMIN_ROLES },
  { to: '/attendance', label: 'Attendance' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/geofences', label: 'Geo-fences', roles: ADMIN_ROLES },
  { to: '/cleaning', label: 'Cleaning' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/chat', label: 'Chat' },
  { to: '/reports', label: 'Reports', roles: ADMIN_ROLES },
  { to: '/ai', label: 'AI', roles: ADMIN_ROLES },
]

export function AppLayout() {
  const { user, logout, hasAnyRole } = useAuth()
  const navigate = useNavigate()

  const visible = navItems.filter((item) => !item.roles || hasAnyRole(...item.roles))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={appLogo} alt="CivisOS" />
          <div>
            <strong>CivisOS</strong>
            <span>Smart Society</span>
          </div>
        </div>
        <nav>
          {visible.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <span>{user?.roles?.join(', ') || ROLES.Employee}</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
