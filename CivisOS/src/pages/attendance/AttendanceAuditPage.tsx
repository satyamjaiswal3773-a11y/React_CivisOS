import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { attendanceApi, employeesApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { todayIsoDate } from '../../components/attendance'
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
  formatDate,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { AttendanceAuditAction, AuditLogDto } from '../../types/attendance'
import type { EmployeeDto } from '../../types/api'
import { ROLES } from '../../types/api'

const ACTIONS: AttendanceAuditAction[] = [
  'PunchCreated',
  'AttendanceProcessed',
  'AttendanceCorrected',
  'RegularizationSubmitted',
  'RegularizationApproved',
  'RegularizationRejected',
  'RegularizationSentBack',
  'ShiftAssigned',
  'ShiftChanged',
  'OvertimeSubmitted',
  'OvertimeApproved',
  'OvertimeRejected',
  'ExceptionResolved',
  'MonthFinalized',
  'MonthLocked',
  'MonthUnlocked',
  'ImportConfirmed',
  'ManualAttendance',
]

export function AttendanceAuditPage() {
  const { hasAnyRole } = useAuth()
  const canView = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin)

  const [employeeId, setEmployeeId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(todayIsoDate())
  const [employees, setEmployees] = useState<EmployeeDto[]>([])

  const [items, setItems] = useState<AuditLogDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.audit({
        pageNumber,
        pageSize: 25,
        employeeId: employeeId || undefined,
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
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
    if (!canView) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, employeeId, action, from, to, canView])

  if (!canView) return <Navigate to="/attendance" replace />

  return (
    <>
      <PageHeader title="Attendance Audit" subtitle="Immutable log of attendance-related actions" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Employee
            <Select
              value={employeeId}
              onChange={(e) => {
                setPageNumber(1)
                setEmployeeId(e.target.value)
              }}
            >
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeCode} — {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Action
            <Select
              value={action}
              onChange={(e) => {
                setPageNumber(1)
                setAction(e.target.value)
              }}
            >
              <option value="">All</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </label>
          <label>
            From
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setPageNumber(1)
                setFrom(e.target.value)
              }}
            />
          </label>
          <label>
            To
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setPageNumber(1)
                setTo(e.target.value)
              }}
            />
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
          <EmptyState message="No audit entries for the selected filters." />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                headers={[
                  'Date',
                  'User',
                  'Employee',
                  'Action',
                  'Old Value',
                  'New Value',
                  'Reason',
                  'IP',
                  'Created Date',
                ]}
              >
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.attendanceDate || '—'}</td>
                    <td>{row.userId || '—'}</td>
                    <td>{row.employeeId || '—'}</td>
                    <td>{row.action}</td>
                    <td>
                      <code className="muted">{row.oldValue || '—'}</code>
                    </td>
                    <td>
                      <code className="muted">{row.newValue || '—'}</code>
                    </td>
                    <td>{row.reason || '—'}</td>
                    <td>{row.ipAddress || '—'}</td>
                    <td>{formatDate(row.createdAtUtc)}</td>
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
