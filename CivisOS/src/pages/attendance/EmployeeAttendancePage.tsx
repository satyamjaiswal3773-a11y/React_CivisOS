import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { attendanceApi, employeesApi } from '../../api'
import {
  ApprovalStatusBadge,
  DayStatusBadge,
  statusCellClass,
  todayIsoDate,
} from '../../components/attendance'
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Table,
  formatMinutes,
  formatTime,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type {
  AttendancePunchDto,
  AttendanceSummaryDto,
  DayStatusCellDto,
  EmployeeAttendanceDayDto,
  OvertimeRequestDto,
  RegularizationDto,
} from '../../types/attendance'
import type { EmployeeDto } from '../../types/api'

type Tab = 'daily' | 'monthly' | 'punches' | 'regularization' | 'overtime'

function monthBounds(isoDate: string): { from: string; to: string } {
  const d = isoDate || todayIsoDate()
  const [y, m] = d.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(y, m, 0).getDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

function statusShort(status: string) {
  switch (status) {
    case 'Present':
      return 'P'
    case 'Absent':
      return 'A'
    case 'Leave':
      return 'L'
    case 'HalfDay':
      return 'HD'
    case 'Holiday':
      return 'H'
    case 'WeeklyOff':
      return 'WO'
    case 'Wfh':
      return 'WFH'
    case 'OnDuty':
      return 'OD'
    case 'MissingPunch':
      return 'MP'
    case 'Late':
      return 'LT'
    case 'EarlyLeaving':
      return 'EL'
    default:
      return '?'
  }
}

export function EmployeeAttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramEmployeeId = searchParams.get('employeeId') ?? ''
  const paramDate = searchParams.get('date') ?? todayIsoDate()

  const [employeeId, setEmployeeId] = useState(paramEmployeeId)
  const [from, setFrom] = useState(() => monthBounds(paramDate).from)
  const [to, setTo] = useState(() => monthBounds(paramDate).to)
  const [punchDate, setPunchDate] = useState(paramDate)
  const [tab, setTab] = useState<Tab>('daily')

  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null)
  const [daily, setDaily] = useState<EmployeeAttendanceDayDto[]>([])
  const [monthlyCells, setMonthlyCells] = useState<DayStatusCellDto[]>([])
  const [punches, setPunches] = useState<AttendancePunchDto[]>([])
  const [regs, setRegs] = useState<RegularizationDto[]>([])
  const [ots, setOts] = useState<OvertimeRequestDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const yearMonth = useMemo(() => {
    const d = from || todayIsoDate()
    return { year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) }
  }, [from])

  useEffect(() => {
    void (async () => {
      try {
        const page = await employeesApi.list({ pageNumber: 1, pageSize: 200 })
        setEmployees(page.items)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    })()
  }, [])

  useEffect(() => {
    if (paramEmployeeId) setEmployeeId(paramEmployeeId)
    if (paramDate) {
      const bounds = monthBounds(paramDate)
      setFrom(bounds.from)
      setTo(bounds.to)
      setPunchDate(paramDate)
    }
  }, [paramEmployeeId, paramDate])

  async function loadAll() {
    if (!employeeId) {
      setSummary(null)
      setDaily([])
      setMonthlyCells([])
      setPunches([])
      setRegs([])
      setOts([])
      return
    }
    setLoading(true)
    try {
      const [sum, dayPage, monthPage, punchList, regPage, otPage] = await Promise.all([
        attendanceApi.summary({ employeeId, from, to }),
        attendanceApi.daily({ employeeId, from, to, pageNumber: 1, pageSize: 100 }),
        attendanceApi.monthly({
          employeeId,
          year: yearMonth.year,
          month: yearMonth.month,
          pageNumber: 1,
          pageSize: 1,
        }),
        attendanceApi.punchesDay({ employeeId, date: punchDate }),
        attendanceApi.regularizations({ employeeId, pageNumber: 1, pageSize: 50 }),
        attendanceApi.overtime({ employeeId, pageNumber: 1, pageSize: 50 }),
      ])
      setSummary(sum)
      setDaily(dayPage.items)
      setMonthlyCells(monthPage.items[0]?.days ?? [])
      setPunches(punchList)
      setRegs(regPage.items)
      setOts(otPage.items)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, from, to, punchDate, yearMonth.year, yearMonth.month])

  function applyEmployee(id: string) {
    setEmployeeId(id)
    const next = new URLSearchParams(searchParams)
    if (id) next.set('employeeId', id)
    else next.delete('employeeId')
    setSearchParams(next)
  }

  return (
    <>
      <PageHeader title="Employee Attendance" subtitle="Summary, daily records, punches, and request history" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Employee
            <Select value={employeeId} onChange={(e) => applyEmployee(e.target.value)} required>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeCode} — {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            Punch date
            <Input type="date" value={punchDate} onChange={(e) => setPunchDate(e.target.value)} />
          </label>
        </div>
        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void loadAll()} disabled={loading || !employeeId}>
            Refresh
          </Button>
        </div>
      </Card>

      {!employeeId ? (
        <EmptyState message="Select an employee to view attendance." />
      ) : loading && !summary ? (
        <LoadingState />
      ) : (
        <>
          {summary ? (
            <div className="att-stat-grid">
              <div className="att-stat">
                <div className="stat-value">{summary.presentDays}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{summary.absentDays}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{summary.leaveDays}</div>
                <div className="stat-label">Leave</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{summary.halfDays}</div>
                <div className="stat-label">Half Day</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{summary.lateCount}</div>
                <div className="stat-label">Late</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{summary.missingPunchCount}</div>
                <div className="stat-label">Missing Punch</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{formatMinutes(summary.totalWorkingMinutes)}</div>
                <div className="stat-label">Working Hours</div>
              </div>
              <div className="att-stat">
                <div className="stat-value">{formatMinutes(summary.totalOvertimeMinutes)}</div>
                <div className="stat-label">Overtime</div>
              </div>
            </div>
          ) : null}

          <Card>
            <div className="toolbar" role="tablist" aria-label="Employee attendance sections">
              {(
                [
                  ['daily', 'Daily'],
                  ['monthly', 'Monthly'],
                  ['punches', 'Punches'],
                  ['regularization', 'Regularization'],
                  ['overtime', 'Overtime'],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={tab === id ? 'primary' : 'secondary'}
                  onClick={() => setTab(id)}
                  aria-selected={tab === id}
                >
                  {label}
                </Button>
              ))}
            </div>

            {loading ? <LoadingState /> : null}

            {!loading && tab === 'daily' ? (
              daily.length === 0 ? (
                <EmptyState message="No daily records for this range." />
              ) : (
                <div className="table-wrap">
                  <Table
                    headers={['Date', 'Shift', 'First In', 'Last Out', 'Working', 'Late', 'OT', 'Status']}
                  >
                    {daily.map((row) => (
                      <tr key={row.id}>
                        <td>{row.attendanceDate}</td>
                        <td>{row.shiftName || '—'}</td>
                        <td>{formatTime(row.firstInUtc)}</td>
                        <td>{formatTime(row.lastOutUtc)}</td>
                        <td>{formatMinutes(row.workingMinutes)}</td>
                        <td>{row.lateMinutes}</td>
                        <td>{formatMinutes(row.overtimeMinutes)}</td>
                        <td>
                          <DayStatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )
            ) : null}

            {!loading && tab === 'monthly' ? (
              monthlyCells.length === 0 ? (
                <EmptyState message="No monthly cells for this month." />
              ) : (
                <div className="monthly-grid-wrap">
                  <table className="monthly-grid">
                    <thead>
                      <tr>
                        {monthlyCells.map((c) => (
                          <th key={c.date}>{Number(c.date.slice(-2))}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {monthlyCells.map((c) => (
                          <td
                            key={c.date}
                            className={statusCellClass(c.status)}
                            title={`${c.date}: ${c.status}`}
                          >
                            {statusShort(c.status)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            ) : null}

            {!loading && tab === 'punches' ? (
              punches.length === 0 ? (
                <EmptyState message="No punches for the selected date." />
              ) : (
                <div className="table-wrap">
                  <Table headers={['Time', 'Type', 'Source', 'Device', 'Location', 'IP', 'Remarks']}>
                    {punches.map((p) => (
                      <tr key={p.id}>
                        <td>{formatTime(p.punchDateTimeUtc)}</td>
                        <td>{p.punchType}</td>
                        <td>{p.source}</td>
                        <td>{p.deviceId || '—'}</td>
                        <td>
                          {p.latitude != null && p.longitude != null
                            ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                            : '—'}
                        </td>
                        <td>{p.ipAddress || '—'}</td>
                        <td>{p.remarks || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )
            ) : null}

            {!loading && tab === 'regularization' ? (
              regs.length === 0 ? (
                <EmptyState message="No regularization history." />
              ) : (
                <div className="table-wrap">
                  <Table headers={['Date', 'Requested In', 'Requested Out', 'Reason', 'Status']}>
                    {regs.map((r) => (
                      <tr key={r.id}>
                        <td>{r.attendanceDate}</td>
                        <td>{formatTime(r.requestedInUtc)}</td>
                        <td>{formatTime(r.requestedOutUtc)}</td>
                        <td>{r.reason || '—'}</td>
                        <td>
                          <ApprovalStatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )
            ) : null}

            {!loading && tab === 'overtime' ? (
              ots.length === 0 ? (
                <EmptyState message="No overtime history." />
              ) : (
                <div className="table-wrap">
                  <Table headers={['Date', 'Requested Hours', 'Approved Hours', 'Payable', 'Status']}>
                    {ots.map((o) => (
                      <tr key={o.id}>
                        <td>{o.overtimeDate}</td>
                        <td>{o.requestedHours}</td>
                        <td>{o.approvedHours ?? '—'}</td>
                        <td>{o.isPayable ? 'Yes' : 'No'}</td>
                        <td>
                          <ApprovalStatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )
            ) : null}
          </Card>
        </>
      )}
    </>
  )
}
