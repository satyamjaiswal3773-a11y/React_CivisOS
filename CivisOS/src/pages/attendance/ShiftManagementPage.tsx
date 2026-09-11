import { useEffect, useState, type FormEvent } from 'react'
import { shiftsApi } from '../../api'
import {
  Badge,
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
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { CreateShiftRequest, ShiftDto, UpdateShiftRequest } from '../../types/attendance'

function toApiTime(value: string) {
  if (!value) return value
  return value.length === 5 ? `${value}:00` : value
}

function fromApiTime(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}

const emptyForm = {
  shiftCode: '',
  shiftName: '',
  startTime: '09:00',
  endTime: '18:00',
  gracePeriodMinutes: 0,
  minimumWorkingMinutes: 480,
  allowedBreakMinutes: 60,
  lateAfterMinutes: 15,
  earlyLeavingAfterMinutes: 15,
  overtimeAllowed: true,
  overtimeAfterMinutes: 0,
  isNightShift: false,
  isCrossMidnight: false,
  isActive: true,
  description: '',
}

export function ShiftManagementPage() {
  const [items, setItems] = useState<ShiftDto[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ShiftDto | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const page = await shiftsApi.list({
        pageNumber,
        pageSize: 20,
        search: search || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
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
  }, [pageNumber, activeFilter])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowForm(true)
    setViewing(null)
  }

  function openEdit(shift: ShiftDto) {
    setEditingId(shift.id)
    setForm({
      shiftCode: shift.shiftCode ?? '',
      shiftName: shift.shiftName ?? '',
      startTime: fromApiTime(shift.startTime),
      endTime: fromApiTime(shift.endTime),
      gracePeriodMinutes: shift.gracePeriodMinutes,
      minimumWorkingMinutes: shift.minimumWorkingMinutes,
      allowedBreakMinutes: shift.allowedBreakMinutes,
      lateAfterMinutes: shift.lateAfterMinutes,
      earlyLeavingAfterMinutes: shift.earlyLeavingAfterMinutes,
      overtimeAllowed: shift.overtimeAllowed,
      overtimeAfterMinutes: shift.overtimeAfterMinutes,
      isNightShift: shift.isNightShift,
      isCrossMidnight: shift.isCrossMidnight,
      isActive: shift.isActive,
      description: shift.description ?? '',
    })
    setFormError('')
    setShowForm(true)
    setViewing(null)
  }

  function validate(): string | null {
    if (!form.shiftName.trim()) return 'Shift name is required.'
    if (!form.startTime) return 'Start time is required.'
    if (!form.endTime) return 'End time is required.'
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setFormError(v)
      return
    }
    setBusy(true)
    setFormError('')
    try {
      if (editingId) {
        const body: UpdateShiftRequest = {
          shiftName: form.shiftName.trim(),
          startTime: toApiTime(form.startTime),
          endTime: toApiTime(form.endTime),
          gracePeriodMinutes: Number(form.gracePeriodMinutes),
          minimumWorkingMinutes: Number(form.minimumWorkingMinutes),
          allowedBreakMinutes: Number(form.allowedBreakMinutes),
          lateAfterMinutes: Number(form.lateAfterMinutes),
          earlyLeavingAfterMinutes: Number(form.earlyLeavingAfterMinutes),
          overtimeAllowed: form.overtimeAllowed,
          overtimeAfterMinutes: Number(form.overtimeAfterMinutes),
          isNightShift: form.isNightShift,
          isCrossMidnight: form.isCrossMidnight,
          isActive: form.isActive,
          description: form.description.trim() || null,
        }
        await shiftsApi.update(editingId, body)
      } else {
        const body: CreateShiftRequest = {
          shiftCode: form.shiftCode.trim() || null,
          shiftName: form.shiftName.trim(),
          startTime: toApiTime(form.startTime),
          endTime: toApiTime(form.endTime),
          gracePeriodMinutes: Number(form.gracePeriodMinutes),
          minimumWorkingMinutes: Number(form.minimumWorkingMinutes),
          allowedBreakMinutes: Number(form.allowedBreakMinutes),
          lateAfterMinutes: Number(form.lateAfterMinutes),
          earlyLeavingAfterMinutes: Number(form.earlyLeavingAfterMinutes),
          overtimeAllowed: form.overtimeAllowed,
          overtimeAfterMinutes: Number(form.overtimeAfterMinutes),
          isNightShift: form.isNightShift,
          isCrossMidnight: form.isCrossMidnight,
          description: form.description.trim() || null,
        }
        await shiftsApi.create(body)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(shift: ShiftDto) {
    setBusy(true)
    try {
      const body: UpdateShiftRequest = {
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMinutes: shift.gracePeriodMinutes,
        minimumWorkingMinutes: shift.minimumWorkingMinutes,
        allowedBreakMinutes: shift.allowedBreakMinutes,
        lateAfterMinutes: shift.lateAfterMinutes,
        earlyLeavingAfterMinutes: shift.earlyLeavingAfterMinutes,
        overtimeAllowed: shift.overtimeAllowed,
        overtimeAfterMinutes: shift.overtimeAfterMinutes,
        isNightShift: shift.isNightShift,
        isCrossMidnight: shift.isCrossMidnight,
        isActive: !shift.isActive,
        description: shift.description,
      }
      await shiftsApi.update(shift.id, body)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function viewDetails(id: string) {
    setBusy(true)
    try {
      const shift = await shiftsApi.get(id)
      setViewing(shift)
      setShowForm(false)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Shift Management" subtitle="Create and maintain work shifts" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <div className="filter-panel">
          <label>
            Search
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Shift name or code…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPageNumber(1)
                  void load()
                }
              }}
            />
          </label>
          <label>
            Status
            <Select
              value={activeFilter}
              onChange={(e) => {
                setPageNumber(1)
                setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </label>
        </div>
        <div className="toolbar">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPageNumber(1)
              void load()
            }}
            disabled={loading}
          >
            Apply
          </Button>
          <Button type="button" onClick={openCreate}>
            Add shift
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No shifts found." />
        ) : (
          <>
            <div className="table-wrap">
              <Table headers={['Code', 'Name', 'Start', 'End', 'Night', 'Active', 'Actions']}>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.shiftCode || '—'}</td>
                    <td>{s.shiftName}</td>
                    <td>{fromApiTime(s.startTime)}</td>
                    <td>{fromApiTime(s.endTime)}</td>
                    <td>{s.isNightShift ? 'Yes' : 'No'}</td>
                    <td>
                      <Badge tone={s.isActive ? 'ok' : 'neutral'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td>
                      <div className="actions">
                        <Button type="button" variant="secondary" onClick={() => void viewDetails(s.id)}>
                          View
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void toggleActive(s)}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
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

      {showForm ? (
        <Card>
          <h2>{editingId ? 'Edit shift' : 'Add shift'}</h2>
          {formError ? <ErrorBanner message={formError} /> : null}
          <form className="filter-panel" onSubmit={onSubmit}>
            {!editingId ? (
              <label>
                Shift code
                <Input
                  value={form.shiftCode}
                  onChange={(e) => setForm((f) => ({ ...f, shiftCode: e.target.value }))}
                />
              </label>
            ) : null}
            <label>
              Shift name *
              <Input
                value={form.shiftName}
                onChange={(e) => setForm((f) => ({ ...f, shiftName: e.target.value }))}
                required
              />
            </label>
            <label>
              Start time *
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
              />
            </label>
            <label>
              End time *
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                required
              />
            </label>
            <label>
              Grace period (min)
              <Input
                type="number"
                min={0}
                value={form.gracePeriodMinutes}
                onChange={(e) => setForm((f) => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))}
              />
            </label>
            <label>
              Minimum working (min)
              <Input
                type="number"
                min={0}
                value={form.minimumWorkingMinutes}
                onChange={(e) => setForm((f) => ({ ...f, minimumWorkingMinutes: Number(e.target.value) }))}
              />
            </label>
            <label>
              Allowed break (min)
              <Input
                type="number"
                min={0}
                value={form.allowedBreakMinutes}
                onChange={(e) => setForm((f) => ({ ...f, allowedBreakMinutes: Number(e.target.value) }))}
              />
            </label>
            <label>
              Late after (min)
              <Input
                type="number"
                min={0}
                value={form.lateAfterMinutes}
                onChange={(e) => setForm((f) => ({ ...f, lateAfterMinutes: Number(e.target.value) }))}
              />
            </label>
            <label>
              Early leaving after (min)
              <Input
                type="number"
                min={0}
                value={form.earlyLeavingAfterMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, earlyLeavingAfterMinutes: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              Overtime after (min)
              <Input
                type="number"
                min={0}
                value={form.overtimeAfterMinutes}
                onChange={(e) => setForm((f) => ({ ...f, overtimeAfterMinutes: Number(e.target.value) }))}
              />
            </label>
            <label>
              Overtime allowed
              <Select
                value={form.overtimeAllowed ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, overtimeAllowed: e.target.value === 'yes' }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </label>
            <label>
              Night shift
              <Select
                value={form.isNightShift ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, isNightShift: e.target.value === 'yes' }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </label>
            <label>
              Cross midnight
              <Select
                value={form.isCrossMidnight ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, isCrossMidnight: e.target.value === 'yes' }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </label>
            {editingId ? (
              <label>
                Active
                <Select
                  value={form.isActive ? 'yes' : 'no'}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'yes' }))}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </label>
            ) : null}
            <label>
              Description
              <TextArea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </label>
            <div className="toolbar">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {viewing ? (
        <Card>
          <h2>Shift details</h2>
          <dl className="filter-panel">
            <div>
              <dt className="muted">Code</dt>
              <dd>{viewing.shiftCode || '—'}</dd>
            </div>
            <div>
              <dt className="muted">Name</dt>
              <dd>{viewing.shiftName}</dd>
            </div>
            <div>
              <dt className="muted">Time</dt>
              <dd>
                {fromApiTime(viewing.startTime)} – {fromApiTime(viewing.endTime)}
              </dd>
            </div>
            <div>
              <dt className="muted">Grace / Min working / Break</dt>
              <dd>
                {viewing.gracePeriodMinutes} / {viewing.minimumWorkingMinutes} / {viewing.allowedBreakMinutes} min
              </dd>
            </div>
            <div>
              <dt className="muted">Late / Early leaving</dt>
              <dd>
                {viewing.lateAfterMinutes} / {viewing.earlyLeavingAfterMinutes} min
              </dd>
            </div>
            <div>
              <dt className="muted">Overtime</dt>
              <dd>
                {viewing.overtimeAllowed ? `Allowed after ${viewing.overtimeAfterMinutes} min` : 'Not allowed'}
              </dd>
            </div>
            <div>
              <dt className="muted">Flags</dt>
              <dd>
                Night: {viewing.isNightShift ? 'Yes' : 'No'}; Cross midnight:{' '}
                {viewing.isCrossMidnight ? 'Yes' : 'No'}; Active: {viewing.isActive ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="muted">Description</dt>
              <dd>{viewing.description || '—'}</dd>
            </div>
          </dl>
          <Button type="button" variant="ghost" onClick={() => setViewing(null)}>
            Close
          </Button>
        </Card>
      ) : null}
    </>
  )
}
