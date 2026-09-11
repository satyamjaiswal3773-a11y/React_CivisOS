import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { attendanceApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalStatusBadge, DayStatusBadge } from '../../components/attendance'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
  TextArea,
  formatTime,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type {
  AttendanceApprovalStatus,
  EmployeeAttendanceDayDto,
  RegularizationDto,
} from '../../types/attendance'
import { ADMIN_ROLES } from '../../types/api'

const STATUSES: AttendanceApprovalStatus[] = ['Pending', 'Approved', 'Rejected', 'SentBack', 'Cancelled']

type ActionKind = 'approve' | 'reject' | 'sendBack'

export function RegularizationApprovalPage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)

  const [status, setStatus] = useState<string>('Pending')
  const [items, setItems] = useState<RegularizationDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [dayRow, setDayRow] = useState<RegularizationDto | null>(null)
  const [dayDetail, setDayDetail] = useState<EmployeeAttendanceDayDto | null>(null)
  const [actionRow, setActionRow] = useState<RegularizationDto | null>(null)
  const [action, setAction] = useState<ActionKind | null>(null)
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.regularizations({
        pageNumber,
        pageSize: 20,
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
    if (!isAdmin) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, status, isAdmin])

  async function openDay(row: RegularizationDto) {
    setDayRow(row)
    setDayDetail(null)
    try {
      const day = await attendanceApi.dayDetail(row.employeeId, row.attendanceDate)
      setDayDetail(day)
    } catch {
      setDayDetail(null)
    }
  }

  function startAction(row: RegularizationDto, kind: ActionKind) {
    setActionRow(row)
    setAction(kind)
    setRemarks('')
    setConfirmOpen(false)
  }

  function requestConfirm() {
    setConfirmOpen(true)
  }

  async function confirmAction() {
    if (!actionRow || !action) return
    setBusy(true)
    try {
      const body = { remarks: remarks.trim() || null }
      if (action === 'approve') await attendanceApi.approveRegularization(actionRow.id, body)
      else if (action === 'reject') await attendanceApi.rejectRegularization(actionRow.id, body)
      else await attendanceApi.sendBackRegularization(actionRow.id, body)
      setConfirmOpen(false)
      setAction(null)
      setActionRow(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) return <Navigate to="/attendance/regularization" replace />

  const actionLabel = action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Send back'

  return (
    <>
      <PageHeader title="Regularization Approvals" subtitle="Review and act on attendance regularization requests" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
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
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No regularization requests for this filter." />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                headers={[
                  'Employee',
                  'Date',
                  'Requested In',
                  'Requested Out',
                  'Reason',
                  'Remarks',
                  'Status',
                  'Actions',
                ]}
              >
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.employeeName} ({r.employeeCode})
                    </td>
                    <td>{r.attendanceDate}</td>
                    <td>{formatTime(r.requestedInUtc)}</td>
                    <td>{formatTime(r.requestedOutUtc)}</td>
                    <td>{r.reason || '—'}</td>
                    <td>{r.remarks || '—'}</td>
                    <td>
                      <ApprovalStatusBadge status={r.status} />
                    </td>
                    <td>
                      <div className="actions">
                        <Button type="button" variant="secondary" onClick={() => void openDay(r)}>
                          Day
                        </Button>
                        {r.status === 'Pending' || r.status === 'SentBack' ? (
                          <>
                            <Button type="button" onClick={() => startAction(r, 'approve')}>
                              Approve
                            </Button>
                            <Button type="button" variant="danger" onClick={() => startAction(r, 'reject')}>
                              Reject
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => startAction(r, 'sendBack')}>
                              Send back
                            </Button>
                          </>
                        ) : null}
                      </div>
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

      {dayRow ? (
        <Card>
          <h2>
            Day detail — {dayRow.employeeName} ({dayRow.attendanceDate})
          </h2>
          {!dayDetail ? (
            <EmptyState message="Original day record not available." />
          ) : (
            <dl className="filter-panel">
              <div>
                <dt className="muted">Status</dt>
                <dd>
                  <DayStatusBadge status={dayDetail.status} />
                </dd>
              </div>
              <div>
                <dt className="muted">First in / Last out</dt>
                <dd>
                  {formatTime(dayDetail.firstInUtc)} / {formatTime(dayDetail.lastOutUtc)}
                </dd>
              </div>
              <div>
                <dt className="muted">Shift</dt>
                <dd>{dayDetail.shiftName || '—'}</dd>
              </div>
              <div>
                <dt className="muted">Remarks</dt>
                <dd>{dayDetail.remarks || '—'}</dd>
              </div>
            </dl>
          )}
          <Button type="button" variant="ghost" onClick={() => { setDayRow(null); setDayDetail(null) }}>
            Close
          </Button>
        </Card>
      ) : null}

      {action && actionRow ? (
        <Card>
          <h2>
            {actionLabel} — {actionRow.employeeName} ({actionRow.attendanceDate})
          </h2>
          <label>
            Remarks
            <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </label>
          <div className="toolbar">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAction(null)
                setActionRow(null)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={action === 'reject' ? 'danger' : 'primary'}
              onClick={requestConfirm}
              disabled={busy}
            >
              {actionLabel}
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={`${actionLabel} regularization`}
        message={`Confirm ${actionLabel.toLowerCase()} for ${actionRow?.employeeName ?? ''} on ${actionRow?.attendanceDate ?? ''}?`}
        confirmLabel={actionLabel}
        danger={action === 'reject'}
        busy={busy}
        onConfirm={() => void confirmAction()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
