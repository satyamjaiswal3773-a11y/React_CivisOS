import { useEffect, useMemo, useState, type ComponentType } from 'react'
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
  IconShield,
  IconSparkle,
  IconUserPlus,
  IconUsers,
} from '../components/icons'
import { ADMIN_ROLES, PERMISSIONS, ROLES, type AppPageDto } from '../types/api'
import appLogo from '../assets/App_logo.jpg'

type IconComp = ComponentType<{ size?: number }>

type NavItem = {
  to: string
  label: string
  end?: boolean
  icon: IconComp
  roles?: string[]
  permission?: string
  badgeKey?: 'notifications'
}

const fallbackNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard },
  { to: '/employees', label: 'Employees', roles: ADMIN_ROLES, icon: IconUsers },
  { to: '/users', label: 'Users', roles: [ROLES.SuperAdmin, ROLES.SocietyAdmin], icon: IconUserPlus },
  { to: '/permissions', label: 'Permissions', permission: PERMISSIONS.Manage, icon: IconShield },
  { to: '/attendance', label: 'Attendance', icon: IconClock },
  { to: '/vehicles', label: 'Vehicles', icon: IconCar },
  { to: '/geofences', label: 'Geo-fences', roles: ADMIN_ROLES, icon: IconMap },
  { to: '/cleaning', label: 'Cleaning', icon: IconSparkle },
  { to: '/tasks', label: 'Tasks', icon: IconClipboard },
  { to: '/notifications', label: 'Notifications', icon: IconBell, badgeKey: 'notifications' },
  { to: '/chat', label: 'Chat', icon: IconChat },
  { to: '/reports', label: 'Reports', roles: ADMIN_ROLES, icon: IconChart },
  { to: '/ai', label: 'AI', roles: ADMIN_ROLES, icon: IconBot },
]

function resolveIcon(name?: string | null): IconComp {
  const key = (name || '').toLowerCase()
  if (key.includes('user') && key.includes('plus')) return IconUserPlus
  if (key.includes('user') || key.includes('employee')) return IconUsers
  if (key.includes('shield') || key.includes('permission') || key.includes('lock')) return IconShield
  if (key.includes('clock') || key.includes('attendance')) return IconClock
  if (key.includes('car') || key.includes('vehicle')) return IconCar
  if (key.includes('map') || key.includes('geo') || key.includes('fence')) return IconMap
  if (key.includes('clean') || key.includes('spark')) return IconSparkle
  if (key.includes('task') || key.includes('clipboard')) return IconClipboard
  if (key.includes('bell') || key.includes('notif')) return IconBell
  if (key.includes('chat') || key.includes('message')) return IconChat
  if (key.includes('chart') || key.includes('report')) return IconChart
  if (key.includes('bot') || key.includes('ai')) return IconBot
  if (key.includes('dash')) return IconDashboard
  return IconDashboard
}

function flattenPages(pages: AppPageDto[]): AppPageDto[] {
  const out: AppPageDto[] = []
  const walk = (list: AppPageDto[]) => {
    for (const page of [...list].sort((a, b) => a.sortOrder - b.sortOrder)) {
      out.push(page)
      if (page.children?.length) walk(page.children)
    }
  }
  walk(pages)
  return out
}

function normalizePath(path?: string | null) {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function AppLayout() {
  const { user, logout, hasAnyRole, hasPermission, pages, accessLoading } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const visible = useMemo(() => {
    if (pages.length > 0) {
      const fromApi: NavItem[] = flattenPages(pages)
        .filter((p) => !p.requiredPermissionCode || hasPermission(p.requiredPermissionCode))
        .map((p) => ({
          to: normalizePath(p.routePath),
          label: p.title || p.pageKey,
          end: normalizePath(p.routePath) === '/',
          icon: resolveIcon(p.icon || p.pageKey),
          badgeKey: normalizePath(p.routePath).includes('notification') ? ('notifications' as const) : undefined,
        }))

      if (hasPermission(PERMISSIONS.Manage) && !fromApi.some((i) => i.to.startsWith('/permissions'))) {
        fromApi.push({
          to: '/permissions',
          label: 'Permissions',
          icon: IconShield,
          permission: PERMISSIONS.Manage,
        })
      }
      return fromApi
    }

    return fallbackNavItems.filter((item) => {
      if (item.permission) return hasPermission(item.permission)
      if (item.roles) return hasAnyRole(...item.roles)
      return true
    })
  }, [pages, hasAnyRole, hasPermission])

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
          {accessLoading && pages.length === 0 ? (
            <span className="nav-link muted" style={{ opacity: 0.7 }}>
              Loading menu…
            </span>
          ) : null}
          {visible.map((item) => {
            const Icon = item.icon
            const showBadge = item.badgeKey === 'notifications' && unread > 0
            return (
              <NavLink
                key={`${item.to}-${item.label}`}
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
