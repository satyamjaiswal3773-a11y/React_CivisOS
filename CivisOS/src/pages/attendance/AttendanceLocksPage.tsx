import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { attendanceApi } from '../../api'
import { useAuth } from '../../auth/AuthContext'
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
  TextArea,
  formatDate,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { AttendanceLockDto, AttendanceLockStatus } from '../../types/attendance'
import { ROLES } from '../../types/api'

function lockTone(status: AttendanceLockStatus): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
  if (status === 'Locked') return 'danger'
  if (status === 'Finalized') return 'warn'
  if (status === 'Open') return 'ok'
  return 'neutral'
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type PendingAction = 'finalize' | 'lock' | 'unlock' | 'process' | null

export function AttendanceLocksPage() {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [locks, setLocks] = useState<AttendanceLockDto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [selected, setSelected] = useState<AttendanceLockDto | null>(null)
  const [action, setAction] = useState<PendingAction>(null)
  const [remarks, setRemarks] = useState('')
  const [unlockReason, setUnlockReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [processFrom, setProcessFrom] = useState('')
  const [processTo, setProcessTo] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await attendanceApi.locks({ year })
      setLocks(data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      setLocks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canManage) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, canManage])

  function startAction(lock: AttendanceLockDto, kind: PendingAction) {
    setSelected(lock)
    setAction(kind)
    setRemarks('')
    setUnlockReason('')
    if (kind === 'process') {
      const m = String(lock.month).padStart(2, '0')
      const last = new Date(lock.year, lock.month, 0).getDate()
      setProcessFrom(`${lock.year}-${m}-01`)
      setProcessTo(`${lock.year}-${m}-${String(last).padStart(2, '0')}`)
    }
    setConfirmOpen(false)
  }

  async function confirmAction() {
    if (!selected || !action) return
    if (action === 'unlock' && !unlockReason.trim()) {
      setError('Unlock reason is required.')
      setConfirmOpen(false)
      return
    }
    setBusy(true)
    try {
      if (action === 'process') {
        await attendanceApi.process({ from: processFrom, to: processTo })
      } else if (action === 'finalize') {
        await attendanceApi.finalize({
          year: selected.year,
          month: selected.month,
          remarks: remarks.trim() || null,
        })
      } else if (action === 'lock') {
        await attendanceApi.lock({
          year: selected.year,
          month: selected.month,
          remarks: remarks.trim() || null,
        })
      } else if (action === 'unlock') {
        await attendanceApi.unlock({
          year: selected.year,
          month: selected.month,
          reason: unlockReason.trim(),
        })
      }
      setConfirmOpen(false)
      setAction(null)
      setSelected(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!canManage) return <Navigate to="/attendance" replace />

  const actionTitle =
    action === 'finalize'
      ? 'Finalize month'
      : action === 'lock'
        ? 'Lock month'
        : action === 'unlock'
          ? 'Unlock month'
          : action === 'process'
            ? 'Process attendance'
            : ''

  return (
    <>
      <PageHeader title="Attendance Locks" subtitle="Finalize and lock monthly attendance periods" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Year
            <Input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <div className="toolbar">
            <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : locks.length === 0 ? (
        <EmptyState message="No lock records for this year." />
      ) : (
        <div className="att-stat-grid">
          {locks.map((lock) => (
            <Card key={lock.id}>
              <h2>
                {MONTH_NAMES[lock.month - 1] ?? lock.month} {lock.year}
              </h2>
              <p>
                <Badge tone={lockTone(lock.status)}>{lock.status}</Badge>
              </p>
              <dl>
                <div>
                  <dt className="muted">Finalized</dt>
                  <dd>{lock.finalizedAtUtc ? formatDate(lock.finalizedAtUtc) : '—'}</dd>
                </div>
                <div>
                  <dt className="muted">Locked</dt>
                  <dd>{lock.lockedAtUtc ? formatDate(lock.lockedAtUtc) : '—'}</dd>
                </div>
                <div>
                  <dt className="muted">Unlocked</dt>
                  <dd>
                    {lock.unlockedAtUtc ? formatDate(lock.unlockedAtUtc) : '—'}
                    {lock.unlockReason ? ` (${lock.unlockReason})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="muted">Remarks</dt>
                  <dd>{lock.remarks || '—'}</dd>
                </div>
              </dl>
              <div className="toolbar">
                {lock.status === 'Open' ? (
                  <>
                    <Button type="button" variant="secondary" onClick={() => startAction(lock, 'process')}>
                      Process
                    </Button>
                    <Button type="button" onClick={() => startAction(lock, 'finalize')}>
                      Finalize
                    </Button>
                  </>
                ) : null}
                {lock.status === 'Finalized' ? (
                  <Button type="button" variant="danger" onClick={() => startAction(lock, 'lock')}>
                    Lock
                  </Button>
                ) : null}
                {lock.status === 'Locked' ? (
                  <Button type="button" variant="ghost" onClick={() => startAction(lock, 'unlock')}>
                    Unlock
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {action && selected ? (
        <Card>
          <h2>
            {actionTitle} — {MONTH_NAMES[selected.month - 1]} {selected.year}
          </h2>
          {action === 'process' ? (
            <div className="filter-panel">
              <label>
                From
                <Input type="date" value={processFrom} onChange={(e) => setProcessFrom(e.target.value)} />
              </label>
              <label>
                To
                <Input type="date" value={processTo} onChange={(e) => setProcessTo(e.target.value)} />
              </label>
            </div>
          ) : null}
          {action === 'unlock' ? (
            <label>
              Reason *
              <TextArea value={unlockReason} onChange={(e) => setUnlockReason(e.target.value)} rows={3} required />
            </label>
          ) : action !== 'process' ? (
            <label>
              Remarks
              <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
            </label>
          ) : null}
          <div className="toolbar">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAction(null)
                setSelected(null)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={action === 'lock' || action === 'finalize' ? 'danger' : 'primary'}
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
            >
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={actionTitle}
        message={
          action === 'finalize' || action === 'lock'
            ? `Warning: ${action} will restrict further changes for ${MONTH_NAMES[(selected?.month ?? 1) - 1]} ${selected?.year}. Continue?`
            : action === 'unlock'
              ? `Unlock ${MONTH_NAMES[(selected?.month ?? 1) - 1]} ${selected?.year}?`
              : `Process attendance for ${processFrom} to ${processTo}?`
        }
        confirmLabel="Confirm"
        danger={action === 'finalize' || action === 'lock'}
        busy={busy}
        onConfirm={() => void confirmAction()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
