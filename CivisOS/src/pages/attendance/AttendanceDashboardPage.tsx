import { useEffect, useMemo, useState } from 'react'
import { attendanceApi, employeesApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { todayIsoDate } from '../../components/attendance'
import { Button, Card, EmptyState, ErrorBanner, LoadingState, PageHeader, Select, Input } from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { AttendanceDashboardDto, TrendPointDto } from '../../types/attendance'
import type { DepartmentDto } from '../../types/api'
import { ADMIN_ROLES } from '../../types/api'
import { Navigate } from 'react-router-dom'

type Period = 'today' | 'week' | 'month' | 'custom'

function periodDate(period: Period, custom: string): string {
  const now = new Date()
  if (period === 'custom' && custom) return custom
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  }
  if (period === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  return todayIsoDate()
}

function TrendChart({ title, points }: { title: string; points?: TrendPointDto[] | null }) {
  const data = points ?? []
  const max = Math.max(1, ...data.map((p) => p.count || p.value || 0))
  if (data.length === 0) return (
    <Card>
      <h2>{title}</h2>
      <EmptyState message="No trend data for this period." />
    </Card>
  )
  return (
    <Card>
      <h2>{title}</h2>
      <div className="att-chart">
        <div className="att-chart-bars" role="img" aria-label={title}>
          {data.map((p) => {
            const v = p.count || p.value || 0
            return (
              <div
                key={p.date}
                className="att-chart-bar"
                style={{ height: `${(v / max) * 100}%` }}
                title={`${p.date}: ${v}`}
              />
            )
          })}
        </div>
        <div className="att-chart-labels">
          {data.map((p) => (
            <span key={p.date}>{p.date.slice(5)}</span>
          ))}
        </div>
      </div>
    </Card>
  )
}

const CARD_DEFS: { key: keyof AttendanceDashboardDto; label: string }[] = [
  { key: 'totalEmployees', label: 'Total Employees' },
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'leave', label: 'Leave' },
  { key: 'halfDay', label: 'Half Day' },
  { key: 'weeklyOff', label: 'Weekly Off' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'wfh', label: 'WFH' },
  { key: 'onDuty', label: 'On Duty' },
  { key: 'late', label: 'Late' },
  { key: 'earlyLeaving', label: 'Early Leaving' },
  { key: 'missingPunch', label: 'Missing Punch' },
  { key: 'overtime', label: 'Overtime' },
  { key: 'pendingRegularization', label: 'Pending Regularization' },
  { key: 'pendingApproval', label: 'Pending Approval' },
]

export function AttendanceDashboardPage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)
  const [period, setPeriod] = useState<Period>('today')
  const [customDate, setCustomDate] = useState(todayIsoDate())
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [data, setData] = useState<AttendanceDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const date = useMemo(() => periodDate(period, customDate), [period, customDate])

  async function load() {
    setLoading(true)
    try {
      const [dash, deps] = await Promise.all([
        attendanceApi.dashboard({ date, departmentId: departmentId || undefined }),
        departments.length ? Promise.resolve(departments) : employeesApi.departments(),
      ])
      setData(dash)
      if (!departments.length) setDepartments(deps)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, departmentId, isAdmin])

  if (!isAdmin) return <Navigate to="/attendance/check-in" replace />

  return (
    <>
      <PageHeader title="Attendance Dashboard" subtitle="Workforce presence snapshot from the attendance engine" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="toolbar">
          <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label="Period">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date</option>
          </Select>
          {period === 'custom' ? (
            <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} aria-label="Custom date" />
          ) : (
            <Input type="date" value={date} readOnly aria-label="Effective date" />
          )}
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {loading && !data ? (
        <LoadingState message="Loading dashboard…" />
      ) : data ? (
        <>
          <div className="att-stat-grid">
            {CARD_DEFS.map((c) => (
              <div key={c.key} className="att-stat">
                <div className="stat-value">{(data[c.key] as number) ?? 0}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <TrendChart title="Attendance trend" points={data.attendanceTrend} />
            <TrendChart title="Late trend" points={data.lateTrend} />
            <TrendChart title="Overtime trend" points={data.overtimeTrend} />
            <Card>
              <h2>Department-wise attendance</h2>
              {(data.departmentWiseAttendance?.length ?? 0) === 0 ? (
                <EmptyState message="No department breakdown available." />
              ) : (
                data.departmentWiseAttendance!.map((d) => {
                  const pct = d.total ? Math.round((d.present / d.total) * 100) : 0
                  return (
                    <div key={d.departmentId} className="att-dept-row">
                      <span title={d.departmentName ?? ''}>{d.departmentName || '—'}</span>
                      <div className="att-dept-track" aria-hidden>
                        <div className="att-dept-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span>
                        {d.present}/{d.total}
                      </span>
                    </div>
                  )
                })
              )}
            </Card>
            <Card>
              <h2>Leave utilization</h2>
              {(data.leaveUtilization?.length ?? 0) === 0 ? (
                <EmptyState message="No leave utilization data." />
              ) : (
                <div className="att-stat-grid">
                  {data.leaveUtilization!.map((l) => (
                    <div key={l.leaveTypeName ?? 'x'} className="att-stat">
                      <div className="stat-value">{l.days}</div>
                      <div className="stat-label">{l.leaveTypeName || 'Leave'}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </>
  )
}
