import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { notificationsApi, reportsApi, tasksApi, vehiclesApi } from '../api'
import heroBg from '../assets/logo.jpg'
import { useAuth } from '../auth/AuthContext'
import {
  IconActivity,
  IconBell,
  IconCar,
  IconChart,
  IconCheck,
  IconChevron,
  IconClipboard,
  IconClock,
  IconFile,
  IconInfo,
  IconPlus,
  IconShield,
  IconSparkle,
  IconUserPlus,
  IconUsers,
  IconWrench,
} from '../components/icons'
import { Badge, EmptyState, ErrorBanner, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import { ADMIN_ROLES, ROLES } from '../types/api'
import type {
  AttendanceReportDto,
  CleaningReportDto,
  NotificationDto,
  TaskReportDto,
  VehicleReportDto,
  VehicleSummaryDto,
  WorkTaskDto,
  WorkTaskStatus,
} from '../types/api'

function formatClock(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusTone(status: WorkTaskStatus): 'warn' | 'info' | 'ok' | 'danger' | 'neutral' {
  if (status === 'Completed') return 'ok'
  if (status === 'InProgress') return 'info'
  if (status === 'Pending') return 'warn'
  if (status === 'Overdue') return 'danger'
  return 'neutral'
}

function statusLabel(status: WorkTaskStatus) {
  if (status === 'InProgress') return 'Ongoing'
  return status
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string
  value: string | number
  hint: string
  icon: ReactNode
  tone: string
}) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-hint">{hint}</div>
    </div>
  )
}

function BarChart({
  categories,
}: {
  categories: Array<{ label: string; today: number; week: number }>
}) {
  const max = Math.max(1, ...categories.flatMap((c) => [c.today, c.week]))
  return (
    <div className="ops-chart">
      <div className="ops-chart-plot">
        {categories.map((c) => (
          <div key={c.label} className="ops-bar-group">
            <div className="ops-bars">
              <div className="ops-bar today" style={{ height: `${(c.today / max) * 100}%` }} title={`Today: ${c.today}`} />
              <div className="ops-bar week" style={{ height: `${(c.week / max) * 100}%` }} title={`Last 7 days: ${c.week}`} />
            </div>
            <span className="ops-bar-label">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="ops-legend">
        <span>
          <i className="dot today" /> Today
        </span>
        <span>
          <i className="dot week" /> Last 7 Days
        </span>
      </div>
    </div>
  )
}

function DonutChart({
  total,
  segments,
}: {
  total: number
  segments: Array<{ label: string; value: number; color: string }>
}) {
  const sum = Math.max(1, segments.reduce((acc, s) => acc + s.value, 0))
  const r = 54
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="donut-wrap">
      <div className="donut-visual">
        <svg viewBox="0 0 140 140" className="donut-svg" aria-hidden>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f0" strokeWidth="16" />
          {segments.map((s) => {
            const len = (s.value / sum) * c
            const dash = `${len} ${c - len}`
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            )
            offset += len
            return el
          })}
        </svg>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>Total Vehicles</span>
        </div>
      </div>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function notificationIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('vehicle') || t.includes('fleet')) return <IconCar size={16} />
  if (t.includes('task')) return <IconClipboard size={16} />
  if (t.includes('employee') || t.includes('user')) return <IconUsers size={16} />
  if (t.includes('attendance')) return <IconClock size={16} />
  return <IconInfo size={16} />
}

export function DashboardPage() {
  const { user, hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)
  const isSuperAdmin = hasAnyRole(ROLES.SuperAdmin)
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState('')
  const [vehicleSummary, setVehicleSummary] = useState<VehicleSummaryDto | null>(null)
  const [vehicleReport, setVehicleReport] = useState<VehicleReportDto | null>(null)
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportDto | null>(null)
  const [cleaningReport, setCleaningReport] = useState<CleaningReportDto | null>(null)
  const [taskReport, setTaskReport] = useState<TaskReportDto | null>(null)
  const [myTasks, setMyTasks] = useState<WorkTaskDto[]>([])
  const [notifications, setNotifications] = useState<NotificationDto[]>([])

  const displayName = user?.firstName || user?.roles?.[0] || 'there'
  const roleLabel = isSuperAdmin ? 'Super Admin' : user?.roles?.[0] || 'Member'

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [summary, notes, mine] = await Promise.all([
          vehiclesApi.summary(),
          notificationsApi.list({ pageNumber: 1, pageSize: 6, unreadOnly: true }),
          tasksApi.my({ pageNumber: 1, pageSize: 6 }),
        ])
        if (cancelled) return
        setVehicleSummary(summary)
        setNotifications(notes.items)
        setMyTasks(mine.items)

        if (isAdmin) {
          const [vr, ar, cr, tr] = await Promise.all([
            reportsApi.vehicles(),
            reportsApi.attendance(),
            reportsApi.cleaning(),
            reportsApi.tasks(),
          ])
          if (cancelled) return
          setVehicleReport(vr)
          setAttendanceReport(ar)
          setCleaningReport(cr)
          setTaskReport(tr)
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const taskCompletionPct = useMemo(() => {
    const total = taskReport?.totalTasks ?? 0
    const done = taskReport?.completedTasks ?? 0
    if (!total) return '0% this week'
    return `${Math.round((done / total) * 100)}% this week`
  }, [taskReport])

  const opsCategories = useMemo(() => {
    const vehiclesToday = vehicleSummary?.active ?? 0
    const attendanceToday = attendanceReport?.presentCount ?? 0
    const cleaningToday = cleaningReport?.completedLogs ?? 0
    const tasksToday = taskReport?.completedTasks ?? 0
    const fenceToday = vehicleReport?.fenceEvents ?? 0

    return [
      { label: 'Vehicles', today: vehiclesToday, week: Math.max(vehiclesToday, vehicleReport?.activeVehicles ?? vehiclesToday) },
      { label: 'Attendance', today: attendanceToday, week: Math.max(attendanceToday, attendanceReport?.totalRecords ?? 0) },
      { label: 'Cleaning', today: cleaningToday, week: Math.max(cleaningToday, cleaningReport?.logsCount ?? 0) },
      { label: 'Tasks', today: tasksToday, week: Math.max(tasksToday, taskReport?.totalTasks ?? 0) },
      {
        label: 'CCTV/Geo-fence',
        today: fenceToday,
        week: Math.max(fenceToday, vehicleReport?.locationUpdates ?? 0),
      },
    ]
  }, [vehicleSummary, vehicleReport, attendanceReport, cleaningReport, taskReport])

  const donutSegments = useMemo(() => {
    const colors: Record<string, string> = {
      Active: '#10b981',
      Available: '#34d399',
      'Under Repair': '#f59e0b',
      Workshop: '#a855f7',
      Breakdown: '#ef4444',
      'In Service': '#3b82f6',
      Deactivated: '#94a3b8',
      NonOperational: '#64748b',
    }
    const fromReport = vehicleReport?.statusCounts ?? []
    if (fromReport.length) {
      return fromReport.map((s, i) => ({
        label: s.key,
        value: s.count,
        color: colors[s.key] || ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#94a3b8'][i % 5],
      }))
    }
    return [
      { label: 'Active', value: vehicleSummary?.active ?? 0, color: '#10b981' },
      { label: 'Available', value: vehicleSummary?.available ?? 0, color: '#34d399' },
      { label: 'Workshop', value: vehicleSummary?.workshop ?? 0, color: '#a855f7' },
      { label: 'Non-operational', value: vehicleSummary?.nonOperational ?? 0, color: '#94a3b8' },
    ]
  }, [vehicleReport, vehicleSummary])

  const recentActivity = useMemo(() => {
    const fromTasks = myTasks.slice(0, 3).map((t) => ({
      id: `task-${t.id}`,
      title: t.status === 'Completed' ? 'Task completed' : 'Task updated',
      detail: t.title,
      at: t.completedAtUtc || t.startedAtUtc || t.createdAtUtc,
      icon: <IconCheck size={14} />,
    }))
    const fromNotes = notifications.slice(0, 3).map((n) => ({
      id: `note-${n.id}`,
      title: n.title,
      detail: n.body,
      at: n.createdAtUtc,
      icon: notificationIcon(n.type || n.title),
    }))
    return [...fromTasks, ...fromNotes]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  }, [myTasks, notifications])

  return (
    <div className="page dash-page">
      <header className="dash-topbar">
        <div className="super-admin-pill">
          <IconShield size={14} />
          {roleLabel}
        </div>
        <div className="dash-topbar-right">
          <span className="dash-datetime">{formatClock(now)}</span>
          <Link className="btn btn-checkin" to="/attendance">
            Check-in
          </Link>
          <div className="dash-user-chip">
            <div className="user-avatar sm" aria-hidden>
              {(user?.firstName?.[0] || 'S').toUpperCase()}
            </div>
            <span>{isSuperAdmin ? 'SuperAdmin' : displayName}</span>
            <IconChevron size={16} />
          </div>
        </div>
      </header>

      <section className="dash-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="dash-hero-copy">
          <h1>
            Welcome, {isSuperAdmin ? 'SuperAdmin' : displayName} <span aria-hidden>👋</span>
          </h1>
          <p>Here&apos;s what&apos;s happening in your society today.</p>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="metric-grid">
        <MetricCard
          label="Vehicles"
          value={vehicleSummary?.total ?? '—'}
          hint="+ updates this month"
          icon={<IconCar size={18} />}
          tone="blue"
        />
        <MetricCard
          label="Active fleet"
          value={vehicleSummary?.active ?? '—'}
          hint={vehicleSummary?.active ? 'On road' : 'No change'}
          icon={<IconUsers size={18} />}
          tone="green"
        />
        <MetricCard
          label="Workshop"
          value={vehicleSummary?.workshop ?? '—'}
          hint={vehicleSummary?.workshop ? 'In service' : 'No change'}
          icon={<IconWrench size={18} />}
          tone="purple"
        />
        <MetricCard
          label="Docs expiring"
          value={vehicleSummary?.documentsExpiringSoon ?? '—'}
          hint={vehicleSummary?.documentsExpiringSoon ? 'Needs attention' : 'No change'}
          icon={<IconFile size={18} />}
          tone="orange"
        />
        {isAdmin ? (
          <>
            <MetricCard
              label="Attendance present"
              value={attendanceReport?.presentCount ?? '—'}
              hint={attendanceReport?.presentCount ? '+ today' : 'No change'}
              icon={<IconUsers size={18} />}
              tone="teal"
            />
            <MetricCard
              label="Cleaning done"
              value={cleaningReport?.completedLogs ?? '—'}
              hint={cleaningReport?.completedLogs ? '+ today' : 'No change'}
              icon={<IconSparkle size={18} />}
              tone="pink"
            />
            <MetricCard
              label="Tasks completed"
              value={taskReport?.completedTasks ?? '—'}
              hint={taskCompletionPct}
              icon={<IconClipboard size={18} />}
              tone="slate"
            />
          </>
        ) : null}
      </div>

      <div className="dash-mid">
        <div className="card dash-ops-card">
          <div className="card-title-row">
            <h2>Operations Overview</h2>
          </div>
          <div className="dash-ops-body">
            <BarChart categories={opsCategories} />
            <DonutChart total={vehicleSummary?.total ?? 0} segments={donutSegments} />
          </div>
        </div>

        <div className="dash-quote-card" style={{ backgroundImage: `url(${heroBg})` }}>
          <p>&ldquo;A well-managed society builds a better tomorrow.&rdquo;</p>
        </div>

        <div className="card dash-actions-card">
          <div className="card-title-row">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            {isAdmin ? (
              <Link to="/employees" className="quick-action">
                <IconUserPlus size={16} /> Add Employee
              </Link>
            ) : null}
            <Link to="/vehicles" className="quick-action">
              <IconCar size={16} /> Register Vehicle
            </Link>
            <Link to="/tasks" className="quick-action">
              <IconPlus size={16} /> Create Task
            </Link>
            <Link to="/notifications" className="quick-action">
              <IconBell size={16} /> Send Notification
            </Link>
            {isAdmin ? (
              <Link to="/reports" className="quick-action">
                <IconChart size={16} /> View Reports
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="dash-bottom">
        <div className="card">
          <div className="card-title-row">
            <h2>My Tasks</h2>
            <Link to="/tasks">View all</Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState message="No assigned tasks." />
          ) : (
            <div className="table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Location</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.title}</strong>
                      </td>
                      <td>{t.geoFenceName || t.cleaningAreaName || '—'}</td>
                      <td>{formatDate(t.deadlineUtc)}</td>
                      <td>
                        <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title-row">
            <h2>Unread Notifications</h2>
            <Link to="/notifications">Inbox</Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState message="You're all caught up." />
          ) : (
            <ul className="notif-feed">
              {notifications.map((n) => (
                <li key={n.id} className={!n.isRead ? 'unread' : undefined}>
                  <div className="notif-icon">{notificationIcon(n.type || n.title)}</div>
                  <div className="notif-body">
                    <strong>{n.title}</strong>
                    <p>{n.body}</p>
                    <span className="tiny">{formatDate(n.createdAtUtc)}</span>
                  </div>
                  {!n.isRead ? <span className="unread-dot" aria-label="Unread" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title-row">
            <h2>Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState message="No recent activity yet." />
          ) : (
            <ul className="activity-feed">
              {recentActivity.map((a) => (
                <li key={a.id}>
                  <div className="activity-icon">{a.icon || <IconActivity size={14} />}</div>
                  <div>
                    <strong>{a.title}</strong>
                    <p className="muted">{a.detail}</p>
                    <span className="tiny">
                      {new Date(a.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
