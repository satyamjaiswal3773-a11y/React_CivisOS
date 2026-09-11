import { useEffect, useState, type FormEvent } from 'react'
import { employeesApi, shiftsApi } from '../../api'
import { todayIsoDate } from '../../components/attendance'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Table,
  TextArea,
  formatDateOnly,
} from '../../components/ui'
import { getErrorMessage } from '../../lib/http'
import type { EmployeeShiftDto, ShiftDto } from '../../types/attendance'
import type { EmployeeDto } from '../../types/api'

export function ShiftAssignmentPage() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [shifts, setShifts] = useState<ShiftDto[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [shiftId, setShiftId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate())
  const [effectiveTo, setEffectiveTo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [current, setCurrent] = useState<EmployeeShiftDto | null>(null)
  const [history, setHistory] = useState<EmployeeShiftDto[]>([])
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [emps, shiftPage] = await Promise.all([
          employeesApi.list({ pageNumber: 1, pageSize: 300 }),
          shiftsApi.list({ pageNumber: 1, pageSize: 100, isActive: true }),
        ])
        setEmployees(emps.items)
        setShifts(shiftPage.items)
        if (shiftPage.items[0]) setShiftId(shiftPage.items[0].id)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    })()
  }, [])

  async function loadEmployeeData(id: string) {
    if (!id) {
      setCurrent(null)
      setHistory([])
      return
    }
    setLoading(true)
    try {
      const [cur, hist] = await Promise.all([
        shiftsApi.current(id, todayIsoDate()).catch(() => null),
        shiftsApi.history(id, { pageNumber: 1, pageSize: 50 }),
      ])
      setCurrent(cur)
      setHistory(hist.items)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'single') void loadEmployeeData(employeeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, mode])

  async function onAssign(e: FormEvent) {
    e.preventDefault()
    if (!shiftId || !effectiveFrom) {
      setError('Shift and effective from are required.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      if (mode === 'bulk') {
        if (selectedIds.length === 0) {
          setError('Select at least one employee.')
          setLoading(false)
          return
        }
        const count = await shiftsApi.bulkAssign({
          employeeIds: selectedIds,
          shiftId,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          remarks: remarks || null,
        })
        setMessage(`Assigned shift to ${count} employee(s). Historical assignments are preserved.`)
      } else {
        if (!employeeId) {
          setError('Select an employee.')
          setLoading(false)
          return
        }
        await shiftsApi.assign({
          employeeId,
          shiftId,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          remarks: remarks || null,
        })
        setMessage('Shift assigned. Previous assignments remain in history.')
        await loadEmployeeData(employeeId)
      }
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <PageHeader title="Shift Assignment" subtitle="Assign shifts without destroying historical records" />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <div className="empty" role="status">{message}</div> : null}

      <Card>
        <div className="toolbar">
          <Button type="button" variant={mode === 'single' ? 'primary' : 'secondary'} onClick={() => setMode('single')}>
            Single
          </Button>
          <Button type="button" variant={mode === 'bulk' ? 'primary' : 'secondary'} onClick={() => setMode('bulk')}>
            Bulk
          </Button>
        </div>

        <form className="form-grid" onSubmit={onAssign}>
          {mode === 'single' ? (
            <label>
              Employee
              <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                <option value="">Select…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeCode} — {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Select employees ({selectedIds.length})</strong>
              <div className="table-wrap" style={{ maxHeight: 220, marginTop: 8 }}>
                <Table headers={['', 'Code', 'Name', 'Department']}>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => toggleSelected(e.id)}
                          aria-label={`Select ${e.employeeCode}`}
                        />
                      </td>
                      <td>{e.employeeCode}</td>
                      <td>
                        {e.firstName} {e.lastName}
                      </td>
                      <td>{e.departmentName}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          )}
          <label>
            Shift
            <Select value={shiftId} onChange={(e) => setShiftId(e.target.value)} required>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Effective from
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
          </label>
          <label>
            Effective to
            <Input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Remarks
            <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </label>
          <Button type="submit" disabled={loading}>
            {mode === 'bulk' ? 'Bulk assign' : 'Assign shift'}
          </Button>
        </form>
      </Card>

      {mode === 'single' ? (
        <>
          <Card>
            <h2>Current shift</h2>
            {loading ? (
              <LoadingState />
            ) : !current ? (
              <EmptyState message="No current shift for this employee." />
            ) : (
              <div className="stat-grid">
                <div className="stat">
                  <div className="stat-value">{current.shiftName}</div>
                  <div className="stat-label">Shift</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{formatDateOnly(current.effectiveFrom)}</div>
                  <div className="stat-label">From</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{formatDateOnly(current.effectiveTo)}</div>
                  <div className="stat-label">To</div>
                </div>
                <div className="stat">
                  <div className="stat-value">
                    <Badge tone={current.isActive ? 'ok' : 'neutral'}>{current.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="stat-label">Status</div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2>Shift history</h2>
            {history.length === 0 ? (
              <EmptyState message="No assignment history." />
            ) : (
              <Table headers={['Shift', 'From', 'To', 'Active', 'Remarks']}>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.shiftName}</td>
                    <td>{formatDateOnly(h.effectiveFrom)}</td>
                    <td>{formatDateOnly(h.effectiveTo)}</td>
                    <td>
                      <Badge tone={h.isActive ? 'ok' : 'neutral'}>{h.isActive ? 'Active' : 'Ended'}</Badge>
                    </td>
                    <td>{h.remarks || '—'}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      ) : null}
    </>
  )
}
