import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { attendanceApi, employeesApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { todayIsoDate } from '../../components/attendance'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
  TextArea,
  formatDate,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type {
  AttendanceExceptionDto,
  AttendanceExceptionStatus,
  AttendanceExceptionType,
} from '../../types/attendance'
import type { EmployeeDto } from '../../types/api'
import { ADMIN_ROLES } from '../../types/api'

const EXCEPTION_TYPES: AttendanceExceptionType[] = [
  'MissingIn',
  'MissingOut',
  'DuplicatePunch',
  'InvalidPunchSequence',
  'LateArrival',
  'EarlyLeaving',
  'ExcessBreak',
  'InvalidShift',
  'UnprocessedAttendance',
  'UnapprovedOvertime',
]

const STATUSES: AttendanceExceptionStatus[] = ['Open', 'Resolved', 'Ignored']

function exceptionTone(status: AttendanceExceptionStatus): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (status === 'Resolved') return 'ok'
  if (status === 'Open') return 'warn'
  if (status === 'Ignored') return 'neutral'
  return 'neutral'
}

export function AttendanceExceptionsPage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)

  const [employeeId, setEmployeeId] = useState('')
  const [exceptionType, setExceptionType] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [employees, setEmployees] = useState<EmployeeDto[]>([])

  const [items, setItems] = useState<AttendanceExceptionDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [openCount, setOpenCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState<AttendanceExceptionDto | null>(null)
  const [resolveStatus, setResolveStatus] = useState<AttendanceExceptionStatus>('Resolved')
  const [resolveRemarks, setResolveRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  async function loadCounts() {
    try {
      const [all, open, resolved] = await Promise.all([
        attendanceApi.exceptions({ pageNumber: 1, pageSize: 1 }),
        attendanceApi.exceptions({ pageNumber: 1, pageSize: 1, status: 'Open' }),
        attendanceApi.exceptions({ pageNumber: 1, pageSize: 1, status: 'Resolved' }),
      ])
      setOpenCount(open.totalCount)
      setResolvedCount(resolved.totalCount)
      if (!status) {
        // keep total from filtered load; all.totalCount used as overall total display when no status filter
        void all
      }
    } catch {
      /* non-fatal for cards */
    }
  }

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.exceptions({
        pageNumber,
        pageSize: 20,
        employeeId: employeeId || undefined,
        exceptionType: exceptionType || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      setItems(page.items)
      setTotalPages(page.totalPages)
      setTotalCount(page.totalCount)
      setError('')
      await loadCounts()
    } catch (err) {
      setError(getErrorMessage(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, employeeId, exceptionType, status, from, to, isAdmin])

  async function openDetail(id: string) {
    setBusy(true)
    try {
      const ex = await attendanceApi.exception(id)
      setDetail(ex)
      setResolveStatus('Resolved')
      setResolveRemarks('')
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmResolve() {
    if (!detail) return
    setBusy(true)
    try {
      await attendanceApi.resolveException(detail.id, {
        status: resolveStatus,
        remarks: resolveRemarks.trim() || null,
      })
      setConfirmOpen(false)
      setDetail(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) return <Navigate to="/attendance" replace />

  return (
    <>
      <PageHeader title="Attendance Exceptions" subtitle="Review and resolve attendance exceptions" />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="att-stat-grid">
        <div className="att-stat">
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">Total (current filter)</div>
        </div>
        <div className="att-stat">
          <div className="stat-value">{openCount}</div>
          <div className="stat-label">Pending (Open)</div>
        </div>
        <div className="att-stat">
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

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
            Type
            <Select
              value={exceptionType}
              onChange={(e) => {
                setPageNumber(1)
                setExceptionType(e.target.value)
              }}
            >
              <option value="">All</option>
              {EXCEPTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Status
            <Select
              value={status}
              onChange={(e) => {
                setPageNumber(1)
                setStatus(e.target.value)
              }}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label>
            From
            <Input
              type="date"
              value={from}
              max={todayIsoDate()}
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

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No exceptions found." />
        ) : (
          <>
            <div className="table-wrap">
              <Table headers={['Employee', 'Date', 'Type', 'Status', 'Message', 'Created', 'Actions']}>
                {items.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      {ex.employeeName} ({ex.employeeCode})
                    </td>
                    <td>{ex.attendanceDate}</td>
                    <td>{ex.exceptionType}</td>
                    <td>
                      <Badge tone={exceptionTone(ex.status)}>{ex.status}</Badge>
                    </td>
                    <td>{ex.message || '—'}</td>
                    <td>{formatDate(ex.createdAtUtc)}</td>
                    <td>
                      <Button type="button" variant="secondary" onClick={() => void openDetail(ex.id)}>
                        View
                      </Button>
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

      {detail ? (
        <Card>
          <h2>Exception details</h2>
          <dl className="filter-panel">
            <div>
              <dt className="muted">Employee</dt>
              <dd>
                {detail.employeeName} ({detail.employeeCode})
              </dd>
            </div>
            <div>
              <dt className="muted">Date</dt>
              <dd>{detail.attendanceDate}</dd>
            </div>
            <div>
              <dt className="muted">Type</dt>
              <dd>{detail.exceptionType}</dd>
            </div>
            <div>
              <dt className="muted">Status</dt>
              <dd>
                <Badge tone={exceptionTone(detail.status)}>{detail.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="muted">Message</dt>
              <dd>{detail.message || '—'}</dd>
            </div>
            <div>
              <dt className="muted">Remarks</dt>
              <dd>{detail.remarks || '—'}</dd>
            </div>
          </dl>

          {detail.status === 'Open' ? (
            <>
              <label>
                Resolve as
                <Select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as AttendanceExceptionStatus)}
                >
                  <option value="Resolved">Resolved</option>
                  <option value="Ignored">Ignored</option>
                </Select>
              </label>
              <label>
                Remarks
                <TextArea value={resolveRemarks} onChange={(e) => setResolveRemarks(e.target.value)} rows={3} />
              </label>
              <div className="toolbar">
                <Button type="button" variant="ghost" onClick={() => setDetail(null)} disabled={busy}>
                  Close
                </Button>
                <Button type="button" onClick={() => setConfirmOpen(true)} disabled={busy}>
                  Resolve
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          )}
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Resolve exception"
        message={`Mark this exception as ${resolveStatus}?`}
        confirmLabel="Confirm"
        busy={busy}
        onConfirm={() => void confirmResolve()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
