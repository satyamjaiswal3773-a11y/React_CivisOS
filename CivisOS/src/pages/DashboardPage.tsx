import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notificationsApi, reportsApi, tasksApi, vehiclesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Card, EmptyState, ErrorBanner, PageHeader, Stat, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import { ADMIN_ROLES } from '../types/api'
import type {
  AttendanceReportDto,
  CleaningReportDto,
  NotificationDto,
  TaskReportDto,
  VehicleReportDto,
  VehicleSummaryDto,
  WorkTaskDto,
} from '../types/api'

export function DashboardPage() {
  const { user, hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)
  const [error, setError] = useState('')
  const [vehicleSummary, setVehicleSummary] = useState<VehicleSummaryDto | null>(null)
  const [vehicleReport, setVehicleReport] = useState<VehicleReportDto | null>(null)
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportDto | null>(null)
  const [cleaningReport, setCleaningReport] = useState<CleaningReportDto | null>(null)
  const [taskReport, setTaskReport] = useState<TaskReportDto | null>(null)
  const [myTasks, setMyTasks] = useState<WorkTaskDto[]>([])
  const [notifications, setNotifications] = useState<NotificationDto[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [summary, notes, mine] = await Promise.all([
          vehiclesApi.summary(),
          notificationsApi.list({ pageNumber: 1, pageSize: 5, unreadOnly: true }),
          tasksApi.my({ pageNumber: 1, pageSize: 5 }),
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

  return (
    <div className="page">
      <PageHeader
        title={`Welcome, ${user?.firstName ?? 'there'}`}
        subtitle="Society operations overview"
        actions={
          <Link className="btn btn-secondary" to="/attendance">
            Check in
          </Link>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="stat-grid">
        <Stat label="Vehicles" value={vehicleSummary?.total ?? '—'} />
        <Stat label="Active fleet" value={vehicleSummary?.active ?? '—'} />
        <Stat label="Workshop" value={vehicleSummary?.workshop ?? '—'} />
        <Stat label="Docs expiring" value={vehicleSummary?.documentsExpiringSoon ?? '—'} />
        {isAdmin ? (
          <>
            <Stat label="Attendance present" value={attendanceReport?.presentCount ?? '—'} />
            <Stat label="Cleaning done" value={cleaningReport?.completedLogs ?? '—'} />
            <Stat label="Tasks completed" value={taskReport?.completedTasks ?? '—'} />
            <Stat label="Tasks overdue" value={taskReport?.overdueTasks ?? '—'} />
          </>
        ) : null}
      </div>

      <div className="grid-2">
        <Card>
          <div className="card-title-row">
            <h2>My tasks</h2>
            <Link to="/tasks">View all</Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState message="No assigned tasks." />
          ) : (
            <Table headers={['Title', 'Priority', 'Status', 'Deadline']}>
              {myTasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <Badge tone={t.priority === 'Critical' || t.priority === 'High' ? 'danger' : 'info'}>{t.priority}</Badge>
                  </td>
                  <td>
                    <Badge tone={t.status === 'Completed' ? 'ok' : t.status === 'Overdue' ? 'danger' : 'neutral'}>{t.status}</Badge>
                  </td>
                  <td>{formatDate(t.deadlineUtc)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <div className="card-title-row">
            <h2>Unread notifications</h2>
            <Link to="/notifications">Inbox</Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState message="You're all caught up." />
          ) : (
            <ul className="list">
              {notifications.map((n) => (
                <li key={n.id}>
                  <strong>{n.title}</strong>
                  <p className="muted">{n.body}</p>
                  <span className="tiny">{formatDate(n.createdAtUtc)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isAdmin && vehicleReport ? (
        <Card>
          <h2>Fleet pulse</h2>
          <p className="muted">
            {vehicleReport.activeVehicles} active · {vehicleReport.locationUpdates} location updates · {vehicleReport.fenceEvents} fence
            events
          </p>
          <div className="chip-row">
            {vehicleReport.statusCounts.map((s) => (
              <span key={s.key} className="chip">
                {s.key}: {s.count}
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
