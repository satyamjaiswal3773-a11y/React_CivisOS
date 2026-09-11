import { useEffect, useState, type FormEvent } from 'react'
import { attendanceApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalStatusBadge, todayIsoDate } from '../../components/attendance'
import {
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
  formatTime,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { AttendanceApprovalStatus, OvertimeRequestDto } from '../../types/attendance'
import { ADMIN_ROLES } from '../../types/api'

const STATUSES: AttendanceApprovalStatus[] = ['Pending', 'Approved', 'Rejected', 'SentBack', 'Cancelled']

type ActionKind = 'approve' | 'reject'

export function OvertimePage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)

  const [overtimeDate, setOvertimeDate] = useState(todayIsoDate())
  const [requestedHours, setRequestedHours] = useState(1)
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const [status, setStatus] = useState('')
  const [items, setItems] = useState<OvertimeRequestDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [actionRow, setActionRow] = useState<OvertimeRequestDto | null>(null)
  const [action, setAction] = useState<ActionKind | null>(null)
  const [approvedHours, setApprovedHours] = useState(0)
  const [isPayable, setIsPayable] = useState(true)
  const [actionRemarks, setActionRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const page = await attendanceApi.overtime({
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
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, status])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!overtimeDate) {
      setFormError('Overtime date is required.')
      return
    }
    if (!requestedHours || requestedHours <= 0) {
      setFormError('Requested hours must be greater than zero.')
      return
    }
    setBusy(true)
    setFormError('')
    try {
      await attendanceApi.createOvertime({
        overtimeDate,
        requestedHours: Number(requestedHours),
        reason: reason.trim() || null,
        remarks: remarks.trim() || null,
      })
      setReason('')
      setRemarks('')
      setRequestedHours(1)
      setPageNumber(1)
      await load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function startAction(row: OvertimeRequestDto, kind: ActionKind) {
    setActionRow(row)
    setAction(kind)
    setApprovedHours(row.requestedHours)
    setIsPayable(true)
    setActionRemarks('')
    setConfirmOpen(false)
  }

  async function confirmAction() {
    if (!actionRow || !action) return
    setBusy(true)
    try {
      if (action === 'approve') {
        await attendanceApi.approveOvertime(actionRow.id, {
          approvedHours: Number(approvedHours),
          isPayable,
          remarks: actionRemarks.trim() || null,
        })
      } else {
        await attendanceApi.rejectOvertime(actionRow.id, { remarks: actionRemarks.trim() || null })
      }
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

  return (
    <>
      <PageHeader title="Overtime" subtitle="Request and review overtime hours" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <h2>New overtime request</h2>
        {formError ? <ErrorBanner message={formError} /> : null}
        <form className="filter-panel" onSubmit={onSubmit}>
          <label>
            Overtime date *
            <Input type="date" value={overtimeDate} onChange={(e) => setOvertimeDate(e.target.value)} required />
          </label>
          <label>
            Requested hours *
            <Input
              type="number"
              min={0.25}
              step={0.25}
              value={requestedHours}
              onChange={(e) => setRequestedHours(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Reason
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label>
            Remarks
            <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </label>
          <div className="toolbar">
            <Button type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2>Requests</h2>
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
          <EmptyState message="No overtime requests." />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                headers={[
                  'Employee',
                  'Date',
                  'Requested',
                  'Approved',
                  'Payable',
                  'Reason',
                  'Status',
                  'Created',
                  ...(isAdmin ? ['Actions'] : []),
                ]}
              >
                {items.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.employeeName} ({o.employeeCode})
                    </td>
                    <td>{o.overtimeDate}</td>
                    <td>{o.requestedHours}</td>
                    <td>{o.approvedHours ?? '—'}</td>
                    <td>{o.isPayable ? 'Yes' : 'No'}</td>
                    <td>{o.reason || '—'}</td>
                    <td>
                      <ApprovalStatusBadge status={o.status} />
                    </td>
                    <td>{formatTime(o.createdAtUtc)}</td>
                    {isAdmin ? (
                      <td>
                        {o.status === 'Pending' ? (
                          <div className="actions">
                            <Button type="button" onClick={() => startAction(o, 'approve')}>
                              Approve
                            </Button>
                            <Button type="button" variant="danger" onClick={() => startAction(o, 'reject')}>
                              Reject
                            </Button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    ) : null}
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

      {isAdmin && action && actionRow ? (
        <Card>
          <h2>
            {action === 'approve' ? 'Approve' : 'Reject'} overtime — {actionRow.employeeName}
          </h2>
          {action === 'approve' ? (
            <>
              <label>
                Approved hours
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={approvedHours}
                  onChange={(e) => setApprovedHours(Number(e.target.value))}
                />
              </label>
              <label>
                Payable
                <Select value={isPayable ? 'yes' : 'no'} onChange={(e) => setIsPayable(e.target.value === 'yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </label>
            </>
          ) : null}
          <label>
            Remarks
            <TextArea value={actionRemarks} onChange={(e) => setActionRemarks(e.target.value)} rows={3} />
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
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={action === 'approve' ? 'Approve overtime' : 'Reject overtime'}
        message={`Confirm ${action === 'approve' ? 'approval' : 'rejection'} for ${actionRow?.employeeName ?? ''} on ${actionRow?.overtimeDate ?? ''}?`}
        confirmLabel={action === 'approve' ? 'Approve' : 'Reject'}
        danger={action === 'reject'}
        busy={busy}
        onConfirm={() => void confirmAction()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
