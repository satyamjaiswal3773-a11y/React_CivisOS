import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { attendanceApi, employeesApi, shiftsApi } from '../../api'
import { DayStatusBadge, todayIsoDate } from '../../components/attendance'
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
import type { DayAttendanceStatus, EmployeeAttendanceDayDto, PunchSource, ShiftDto } from '../../types/attendance'
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

const SOURCES: PunchSource[] = ['Biometric', 'Web', 'Mobile', 'Qr', 'Admin', 'Import', 'Api', 'GeoFence']

export function DailyAttendancePage() {
  const [date, setDate] = useState(todayIsoDate())
  const [employeeId, setEmployeeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [items, setItems] = useState<EmployeeAttendanceDayDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([])
  const [shifts, setShifts] = useState<ShiftDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLookups() {
    try {
      const [emps, deps, desigs, shiftPage] = await Promise.all([
        employeesApi.list({ pageNumber: 1, pageSize: 200 }),
        employeesApi.departments(),
        employeesApi.designations(),
        shiftsApi.list({ pageNumber: 1, pageSize: 100, isActive: true }),
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
      const page = await attendanceApi.daily({
        pageNumber,
        pageSize,
        date,
        employeeId: employeeId || undefined,
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        shiftId: shiftId || undefined,
        status: status || undefined,
        source: source || undefined,
      })
      const filtered = search
        ? page.items.filter(
            (r) =>
              (r.employeeName ?? '').toLowerCase().includes(search.toLowerCase()) ||
              (r.employeeCode ?? '').toLowerCase().includes(search.toLowerCase()),
          )
        : page.items
      setItems(filtered)
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
  }, [pageNumber, date, employeeId, departmentId, designationId, shiftId, status, source])

  return (
    <>
      <PageHeader title="Daily Attendance" subtitle="Processed day records from the attendance engine" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Date
            <Input type="date" value={date} onChange={(e) => { setPageNumber(1); setDate(e.target.value) }} />
          </label>
          <label>
            Employee
            <Select value={employeeId} onChange={(e) => { setPageNumber(1); setEmployeeId(e.target.value) }}>
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
            Status
            <Select value={status} onChange={(e) => { setPageNumber(1); setStatus(e.target.value) }}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Source
            <Select value={source} onChange={(e) => { setPageNumber(1); setSource(e.target.value) }}>
              <option value="">All</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Search
            <Input
              placeholder="Name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load()
              }}
            />
          </label>
        </div>
        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            Apply
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No attendance records for the selected filters." />
        ) : (
          <>
            <div className="table-wrap att-table">
              <Table
                headers={[
                  'S.No',
                  'Employee Code',
                  'Employee Name',
                  'Department',
                  'Designation',
                  'Shift',
                  'Date',
                  'First In',
                  'Last Out',
                  'Working Hours',
                  'Break Hours',
                  'Late Minutes',
                  'Early Out',
                  'OT Hours',
                  'Status',
                  'Source',
                  'Action',
                ]}
              >
                {items.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(pageNumber - 1) * pageSize + idx + 1}</td>
                    <td>{row.employeeCode}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.departmentName}</td>
                    <td>{row.designationName}</td>
                    <td>{row.shiftName || '—'}</td>
                    <td>{row.attendanceDate}</td>
                    <td>{formatTime(row.firstInUtc)}</td>
                    <td>{formatTime(row.lastOutUtc)}</td>
                    <td>{formatMinutes(row.workingMinutes)}</td>
                    <td>{formatMinutes(row.breakMinutes)}</td>
                    <td>{row.lateMinutes}</td>
                    <td>{row.earlyOutMinutes}</td>
                    <td>{formatMinutes(row.overtimeMinutes)}</td>
                    <td>
                      <DayStatusBadge status={row.status} />
                    </td>
                    <td>{row.attendanceSource}</td>
                    <td>
                      <Link className="btn btn-secondary" to={`/attendance/employee?employeeId=${row.employeeId}&date=${row.attendanceDate}`}>
                        View
                      </Link>
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
