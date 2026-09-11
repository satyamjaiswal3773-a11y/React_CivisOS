import { useState, type FormEvent } from 'react'
import { attendanceApi } from '../../api'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Table,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { ImportBatchDto, ImportConfirmResultDto } from '../../types/attendance'

export function AttendanceImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [batch, setBatch] = useState<ImportBatchDto | null>(null)
  const [confirmResult, setConfirmResult] = useState<ImportConfirmResultDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onUpload(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Select a file to upload.')
      return
    }
    setBusy(true)
    setConfirmResult(null)
    try {
      const uploaded = await attendanceApi.uploadImport(file)
      const refreshed = await attendanceApi.importBatch(uploaded.id)
      setBatch(refreshed)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      setBatch(null)
    } finally {
      setBusy(false)
    }
  }

  async function refreshBatch() {
    if (!batch) return
    setBusy(true)
    try {
      const refreshed = await attendanceApi.importBatch(batch.id)
      setBatch(refreshed)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onConfirm() {
    if (!batch) return
    setBusy(true)
    try {
      const result = await attendanceApi.confirmImport(batch.id)
      setConfirmResult(result)
      const refreshed = await attendanceApi.importBatch(batch.id)
      setBatch(refreshed)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Attendance Import" subtitle="Upload punch files, validate, then confirm import" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <h2>1. Select file</h2>
        <form className="toolbar" onSubmit={onUpload}>
          <label>
            File
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </Card>

      {busy && !batch ? <LoadingState message="Uploading and validating…" /> : null}

      {batch ? (
        <Card>
          <h2>2. Validation results</h2>
          <div className="att-stat-grid">
            <div className="att-stat">
              <div className="stat-value">{batch.totalRecords}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{batch.validRecords}</div>
              <div className="stat-label">Valid</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{batch.invalidRecords}</div>
              <div className="stat-label">Invalid</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{batch.duplicateRecords}</div>
              <div className="stat-label">Duplicate</div>
            </div>
          </div>
          <p>
            Batch: <strong>{batch.fileName || batch.id}</strong>{' '}
            <Badge tone={batch.status === 'Validated' ? 'ok' : batch.status === 'Failed' ? 'danger' : 'info'}>
              {batch.status}
            </Badge>
          </p>
          <div className="toolbar">
            <Button type="button" variant="secondary" onClick={() => void refreshBatch()} disabled={busy}>
              Refresh batch
            </Button>
          </div>

          {(batch.errors?.length ?? 0) === 0 ? (
            <EmptyState message="No row errors reported." />
          ) : (
            <div className="table-wrap">
              <Table headers={['Row', 'Raw data', 'Error']}>
                {batch.errors!.map((err) => (
                  <tr key={`${err.rowNumber}-${err.errorMessage}`}>
                    <td>{err.rowNumber}</td>
                    <td>{err.rawData || '—'}</td>
                    <td>{err.errorMessage || '—'}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      ) : null}

      {batch && (batch.status === 'Validated' || batch.status === 'Uploaded') ? (
        <Card>
          <h2>3. Confirm import</h2>
          <p className="muted">
            Confirming will insert valid punches and process attendance days for this batch.
          </p>
          <Button type="button" onClick={() => void onConfirm()} disabled={busy || batch.validRecords === 0}>
            {busy ? 'Confirming…' : 'Confirm import'}
          </Button>
        </Card>
      ) : null}

      {confirmResult ? (
        <Card>
          <h2>Import confirmed</h2>
          <div className="att-stat-grid">
            <div className="att-stat">
              <div className="stat-value">{confirmResult.punchesInserted}</div>
              <div className="stat-label">Punches inserted</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{confirmResult.daysProcessed}</div>
              <div className="stat-label">Days processed</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{confirmResult.validRecords}</div>
              <div className="stat-label">Valid</div>
            </div>
            <div className="att-stat">
              <div className="stat-value">{confirmResult.invalidRecords}</div>
              <div className="stat-label">Invalid</div>
            </div>
          </div>
        </Card>
      ) : null}
    </>
  )
}
