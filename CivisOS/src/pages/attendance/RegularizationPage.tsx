import { useEffect, useState, type FormEvent } from 'react'
import { attendanceApi } from '../../api'
import {
  ApprovalStatusBadge,
  fromLocalDateTimeInput,
  todayIsoDate,
  toLocalDateTimeInput,
} from '../../components/attendance'
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
  TextArea,
  formatTime,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { AttendanceApprovalStatus, RegularizationDto } from '../../types/attendance'

const STATUSES: AttendanceApprovalStatus[] = ['Pending', 'Approved', 'Rejected', 'SentBack', 'Cancelled']

export function RegularizationPage() {
  const [attendanceDate, setAttendanceDate] = useState(todayIsoDate())
  const [requestedIn, setRequestedIn] = useState('')
  const [requestedOut, setRequestedOut] = useState('')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [attachmentReference, setAttachmentReference] = useState('')

  const [status, setStatus] = useState('')
  const [items, setItems] = useState<RegularizationDto[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

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
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, status])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!attendanceDate) {
      setFormError('Attendance date is required.')
      return
    }
    if (!reason.trim()) {
      setFormError('Reason is required.')
      return
    }
    setBusy(true)
    setFormError('')
    try {
      await attendanceApi.createRegularization({
        attendanceDate,
        requestedInUtc: fromLocalDateTimeInput(requestedIn),
        requestedOutUtc: fromLocalDateTimeInput(requestedOut),
        reason: reason.trim(),
        remarks: remarks.trim() || null,
        attachmentReference: attachmentReference.trim() || null,
      })
      setRequestedIn('')
      setRequestedOut('')
      setReason('')
      setRemarks('')
      setAttachmentReference('')
      setPageNumber(1)
      await load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Attendance Regularization" subtitle="Request corrections for missing or incorrect punches" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <h2>New request</h2>
        {formError ? <ErrorBanner message={formError} /> : null}
        <form className="filter-panel" onSubmit={onSubmit}>
          <label>
            Attendance date *
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />
          </label>
          <label>
            Requested in
            <Input
              type="datetime-local"
              value={requestedIn}
              onChange={(e) => setRequestedIn(e.target.value)}
            />
          </label>
          <label>
            Requested out
            <Input
              type="datetime-local"
              value={requestedOut}
              onChange={(e) => setRequestedOut(e.target.value)}
            />
          </label>
          <label>
            Reason *
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
          <label>
            Remarks
            <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </label>
          <label>
            Attachment reference
            <Input
              value={attachmentReference}
              onChange={(e) => setAttachmentReference(e.target.value)}
              placeholder="File id or URL"
            />
          </label>
          <div className="toolbar">
            <Button type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2>History</h2>
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
          <EmptyState message="No regularization requests." />
        ) : (
          <>
            <div className="table-wrap">
              <Table headers={['Date', 'Requested In', 'Requested Out', 'Reason', 'Remarks', 'Status', 'Created']}>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.attendanceDate}</td>
                    <td>{formatTime(r.requestedInUtc) || toLocalDateTimeInput(r.requestedInUtc) || '—'}</td>
                    <td>{formatTime(r.requestedOutUtc) || toLocalDateTimeInput(r.requestedOutUtc) || '—'}</td>
                    <td>{r.reason || '—'}</td>
                    <td>{r.remarks || '—'}</td>
                    <td>
                      <ApprovalStatusBadge status={r.status} />
                    </td>
                    <td>{formatTime(r.createdAtUtc)}</td>
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
