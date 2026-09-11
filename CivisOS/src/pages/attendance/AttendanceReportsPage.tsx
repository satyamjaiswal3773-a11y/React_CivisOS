import { useEffect, useState } from 'react'
import { attendanceApi, employeesApi, shiftsApi } from '../../api'
import { DayStatusBadge, downloadBlob, todayIsoDate } from '../../components/attendance'
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
  Table,
  formatMinutes,
  formatTime,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type {
  AttendanceReportType,
  DayAttendanceStatus,
  EmployeeAttendanceDayDto,
  ShiftDto,
} from '../../types/attendance'
import { ATTENDANCE_REPORT_TYPES } from '../../types/attendance'
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

export function AttendanceReportsPage() {
  const [reportType, setReportType] = useState<AttendanceReportType>('daily')
  const [from, setFrom] = useState(todayIsoDate())
  const [to, setTo] = useState(todayIsoDate())
  const [employeeId, setEmployeeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('attendanceDate')

  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([])
  const [shifts, setShifts] = useState<ShiftDto[]>([])

  const [items, setItems] = useState<EmployeeAttendanceDayDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
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
    })()
  }, [])

  function queryParams() {
    return {
      pageNumber,
      pageSize: 25,
      from: from || undefined,
      to: to || undefined,
      employeeId: employeeId || undefined,
      departmentId: departmentId || undefined,
      designationId: designationId || undefined,
      shiftId: shiftId || undefined,
      status: status || undefined,
      sort: sort || undefined,
    }
  }

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.report(reportType, queryParams())
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
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, reportType])

  async function exportReport(format: 'excel' | 'csv' | 'pdf') {
    setBusy(true)
    try {
      const blob = await attendanceApi.exportReport(reportType, {
        ...queryParams(),
        format,
      })
      const ext = format === 'excel' ? 'xlsx' : format
      downloadBlob(blob, `attendance-${reportType}-${from || 'export'}.${ext}`)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Attendance Reports" subtitle="Generate and export attendance reports" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card className="print-filters">
        <div className="filter-panel">
          <label>
            Report type
            <Select
              value={reportType}
              onChange={(e) => {
                setPageNumber(1)
                setReportType(e.target.value as AttendanceReportType)
              }}
            >
              {ATTENDANCE_REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
            Employee
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeCode} — {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Department
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
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
            <Select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
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
            <Select value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              <option value="">All</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Status
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Sort
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="attendanceDate">Date</option>
              <option value="employeeName">Employee</option>
              <option value="departmentName">Department</option>
              <option value="status">Status</option>
            </Select>
          </label>
        </div>
        <div className="toolbar">
          <Button
            type="button"
            onClick={() => {
              setPageNumber(1)
              void load()
            }}
            disabled={loading}
          >
            Run report
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void exportReport('excel')}>
            Excel
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void exportReport('csv')}>
            CSV
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void exportReport('pdf')}>
            PDF
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No report rows for the selected filters." />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                headers={[
                  'Employee',
                  'Department',
                  'Date',
                  'Shift',
                  'First In',
                  'Last Out',
                  'Working',
                  'Status',
                ]}
              >
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.employeeName} ({row.employeeCode})
                    </td>
                    <td>{row.departmentName || '—'}</td>
                    <td>{row.attendanceDate}</td>
                    <td>{row.shiftName || '—'}</td>
                    <td>{formatTime(row.firstInUtc)}</td>
                    <td>{formatTime(row.lastOutUtc)}</td>
                    <td>{formatMinutes(row.workingMinutes)}</td>
                    <td>
                      <DayStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </Table>
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
