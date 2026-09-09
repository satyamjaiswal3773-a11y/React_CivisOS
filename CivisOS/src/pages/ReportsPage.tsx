import { useEffect, useState } from 'react'
import { reportsApi } from '../api'
import { Card, EmptyState, ErrorBanner, PageHeader, Stat, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { AttendanceReportDto, CleaningReportDto, TaskReportDto, VehicleReportDto } from '../types/api'

export function ReportsPage() {
  const [error, setError] = useState('')
  const [vehicles, setVehicles] = useState<VehicleReportDto | null>(null)
  const [attendance, setAttendance] = useState<AttendanceReportDto | null>(null)
  const [cleaning, setCleaning] = useState<CleaningReportDto | null>(null)
  const [tasks, setTasks] = useState<TaskReportDto | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [v, a, c, t] = await Promise.all([
          reportsApi.vehicles(),
          reportsApi.attendance(),
          reportsApi.cleaning(),
          reportsApi.tasks(),
        ])
        if (cancelled) return
        setVehicles(v)
        setAttendance(a)
        setCleaning(c)
        setTasks(t)
        setError('')
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <PageHeader title="Reports" subtitle="Operational summaries across modules" />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="stat-grid">
        <Stat label="Active vehicles" value={vehicles?.activeVehicles ?? '—'} />
        <Stat label="Attendance present" value={attendance?.presentCount ?? '—'} />
        <Stat label="Cleaning completed" value={cleaning?.completedLogs ?? '—'} />
        <Stat label="Tasks overdue" value={tasks?.overdueTasks ?? '—'} />
      </div>

      <div className="grid-2">
        <Card>
          <h2>Vehicles</h2>
          {!vehicles ? (
            <EmptyState message="Loading…" />
          ) : (
            <Table headers={['Number', 'Vehicle', 'Status', 'Fence events', 'Last location']}>
              {vehicles.items.map((row) => (
                <tr key={row.vehicleId}>
                  <td>{row.number}</td>
                  <td>
                    {row.make} {row.model}
                  </td>
                  <td>{row.status}</td>
                  <td>{row.fenceEventCount}</td>
                  <td>{formatDate(row.lastLocationAtUtc)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2>Attendance</h2>
          {!attendance ? (
            <EmptyState message="Loading…" />
          ) : (
            <Table headers={['Employee', 'Date', 'Fence', 'Status']}>
              {attendance.items.map((row) => (
                <tr key={row.attendanceId}>
                  <td>{row.employeeName}</td>
                  <td>{row.attendanceDate}</td>
                  <td>{row.geoFenceName}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2>Cleaning</h2>
          {!cleaning ? (
            <EmptyState message="Loading…" />
          ) : (
            <Table headers={['Area', 'Employee', 'Status', 'Photos']}>
              {cleaning.items.map((row) => (
                <tr key={row.logId}>
                  <td>{row.cleaningAreaName}</td>
                  <td>{row.employeeName}</td>
                  <td>{row.status}</td>
                  <td>{row.photoCount}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2>Tasks</h2>
          {!tasks ? (
            <EmptyState message="Loading…" />
          ) : (
            <Table headers={['Title', 'Assignee', 'Priority', 'Status']}>
              {tasks.items.map((row) => (
                <tr key={row.taskId}>
                  <td>{row.title}</td>
                  <td>{row.assigneeName || '—'}</td>
                  <td>{row.priority}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
