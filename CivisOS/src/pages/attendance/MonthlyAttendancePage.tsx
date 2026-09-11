import { useEffect, useMemo, useState } from 'react'
import { attendanceApi, employeesApi, shiftsApi } from '../../api'
import { statusCellClass, todayIsoDate } from '../../components/attendance'
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { DayAttendanceStatus, MonthlyAttendanceEmployeeDto, ShiftDto } from '../../types/attendance'
import type { DepartmentDto, EmployeeDto } from '../../types/api'

const STATUSES: DayAttendanceStatus[] = [
  'Present',
  'Absent',
  'Leave',
  'HalfDay',
  'Holiday',
  'WeeklyOff',
  'Wfh',
  'OnDuty',
  'MissingPunch',
  'Late',
  'EarlyLeaving',
]

function statusShort(status: DayAttendanceStatus) {
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

export function MonthlyAttendancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [employeeId, setEmployeeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [items, setItems] = useState<MonthlyAttendanceEmployeeDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([])
  const [shifts, setShifts] = useState<ShiftDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const dayHeaders = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth])

  async function loadLookups() {
    try {
      const [emps, deps, desigs, shiftPage] = await Promise.all([
        employeesApi.list({ pageNumber: 1, pageSize: 200 }),
        employeesApi.departments(),
        employeesApi.designations(),
        shiftsApi.list({ pageNumber: 1, pageSize: 100 }),
      ])
      setEmployees(emps.items)
      setDepartments(deps)
      setDesignations(desigs)
      setShifts(shiftPage.items)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.monthly({
        year,
        month,
        pageNumber,
        pageSize: 20,
        employeeId: employeeId || undefined,
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        shiftId: shiftId || undefined,
        status: status || undefined,
      })
      setItems(page.items)
      setTotalPages(page.totalPages)
      setTotalCount(page.totalCount)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLookups()
  }, [])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, pageNumber, employeeId, departmentId, designationId, shiftId, status])

  return (
    <>
      <PageHeader title="Monthly Attendance" subtitle={`Calendar grid for ${month}/${year}`} />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Month
            <Input
              type="month"
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                setPageNumber(1)
                setYear(y)
                setMonth(m)
              }}
              max={`${todayIsoDate().slice(0, 7)}`}
            />
          </label>
          <label>
            Employee
            <Select value={employeeId} onChange={(e) => { setPageNumber(1); setEmployeeId(e.target.value) }}>
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Department
            <Select value={departmentId} onChange={(e) => { setPageNumber(1); setDepartmentId(e.target.value) }}>
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Designation
            <Select value={designationId} onChange={(e) => { setPageNumber(1); setDesignationId(e.target.value) }}>
              <option value="">All</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Shift
            <Select value={shiftId} onChange={(e) => { setPageNumber(1); setShiftId(e.target.value) }}>
              <option value="">All</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Status filter
            <Select value={status} onChange={(e) => { setPageNumber(1); setStatus(e.target.value) }}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No monthly attendance data." />
        ) : (
          <>
            <div className="monthly-grid-wrap">
              <table className="monthly-grid">
                <thead>
                  <tr>
                    <th className="sticky-col">Employee</th>
                    {dayHeaders.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                    <th>P</th>
                    <th>A</th>
                    <th>L</th>
                    <th>HD</th>
                    <th>OT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const byDay = new Map((row.days ?? []).map((c) => [Number(c.date.slice(-2)), c]))
                    return (
                      <tr key={row.employeeId}>
                        <td className="sticky-col">
                          <strong>{row.employeeName}</strong>
                          <div className="muted">{row.employeeCode}</div>
                        </td>
                        {dayHeaders.map((d) => {
                          const cell = byDay.get(d)
                          if (!cell) return <td key={d}>—</td>
                          return (
                            <td
                              key={d}
                              className={statusCellClass(cell.status)}
                              title={`${cell.date}: ${cell.status}${cell.isLate ? ' (late)' : ''}${cell.hasOt ? ' (OT)' : ''}`}
                            >
                              <span aria-label={cell.status}>{statusShort(cell.status)}</span>
                            </td>
                          )
                        })}
                        <td>{row.summary.presentDays}</td>
                        <td>{row.summary.absentDays}</td>
                        <td>{row.summary.leaveDays}</td>
                        <td>{row.summary.halfDays}</td>
                        <td>{Math.round(row.summary.totalOvertimeMinutes / 60)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              pageNumber={pageNumber}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPageNumber}
              disabled={loading}
            />
          </>
        )}
      </Card>
    </>
  )
}
