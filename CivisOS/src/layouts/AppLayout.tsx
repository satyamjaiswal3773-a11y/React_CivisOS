import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import {
  IconBell,
  IconBot,
  IconCar,
  IconChart,
  IconChat,
  IconClipboard,
  IconClock,
  IconDashboard,
  IconLogout,
  IconMap,
  IconMenu,
  IconSparkle,
  IconUsers,
} from '../components/icons'
import { ADMIN_ROLES, ROLES } from '../types/api'
import appLogo from '../assets/App_logo.jpg'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard },
  { to: '/employees', label: 'Employees', roles: ADMIN_ROLES, icon: IconUsers },
  { to: '/attendance', label: 'Attendance', icon: IconClock },
  { to: '/vehicles', label: 'Vehicles', icon: IconCar },
  { to: '/geofences', label: 'Geo-fences', roles: ADMIN_ROLES, icon: IconMap },
  { to: '/cleaning', label: 'Cleaning', icon: IconSparkle },
  { to: '/tasks', label: 'Tasks', icon: IconClipboard },
  { to: '/notifications', label: 'Notifications', icon: IconBell, badgeKey: 'notifications' as const },
  { to: '/chat', label: 'Chat', icon: IconChat },
  { to: '/reports', label: 'Reports', roles: ADMIN_ROLES, icon: IconChart },
  { to: '/ai', label: 'AI', roles: ADMIN_ROLES, icon: IconBot },
]

export function AppLayout() {
  const { user, logout, hasAnyRole } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const visible = navItems.filter((item) => !item.roles || hasAnyRole(...item.roles))
  const primaryRole = user?.roles?.[0] || ROLES.Employee
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'

  useEffect(() => {
    let cancelled = false
    async function loadUnread() {
      try {
        const notes = await notificationsApi.list({ pageNumber: 1, pageSize: 1, unreadOnly: true })
        if (!cancelled) setUnread(notes.totalCount ?? notes.items.length)
      } catch {
        if (!cancelled) setUnread(0)
      }
    }
    void loadUnread()
    const id = window.setInterval(() => void loadUnread(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src={appLogo} alt="CivisOS" />
          <div className="brand-text">
            <strong>CivisOS</strong>
            <span>Smart Society</span>
          </div>
          <button
            type="button"
            className="sidebar-menu-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
          >
            <IconMenu size={18} />
          </button>
        </div>
        <nav>
          {visible.map((item) => {
            const Icon = item.icon
            const showBadge = item.badgeKey === 'notifications' && unread > 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')}
                title={item.label}
              >
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
                {showBadge ? <span className="nav-badge">{unread > 9 ? '9+' : unread}</span> : null}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar" aria-hidden>
              {(user?.firstName?.[0] || 'S').toUpperCase()}
            </div>
            <div className="user-chip-text">
              <strong>{displayName}</strong>
              <span>{primaryRole}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-signout"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <IconLogout size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
