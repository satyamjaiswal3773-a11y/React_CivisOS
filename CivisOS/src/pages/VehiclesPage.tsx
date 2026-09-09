import { useEffect, useState, type FormEvent } from 'react'
import { employeesApi, vehiclesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, Stat, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { CreateVehicleRequest, EmployeeDto, VehicleDto, VehicleLocationDto, VehicleStatus, VehicleSummaryDto, VehicleTypeDto } from '../types/api'
import { ROLES } from '../types/api'

const statuses: VehicleStatus[] = ['Available', 'Active', 'Workshop', 'NonOperational']

export function VehiclesPage() {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor)
  const [items, setItems] = useState<VehicleDto[]>([])
  const [types, setTypes] = useState<VehicleTypeDto[]>([])
  const [summary, setSummary] = useState<VehicleSummaryDto | null>(null)
  const [live, setLive] = useState<VehicleLocationDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateVehicleRequest>({
    number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    status: 'Available',
    department: '',
    vehicleTypeId: '',
  })

  async function load() {
    try {
      const [list, typeList, sum, liveLocs] = await Promise.all([
        vehiclesApi.list({ pageNumber: 1, pageSize: 50 }),
        vehiclesApi.types(),
        vehiclesApi.summary(),
        vehiclesApi.live(),
      ])
      setItems(list.items)
      setTypes(typeList)
      setSummary(sum)
      setLive(liveLocs)
      if (canManage) {
        const emps = await employeesApi.list({ pageNumber: 1, pageSize: 100 })
        setEmployees(emps.items)
      }
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    const id = window.setInterval(() => {
      void vehiclesApi.live().then(setLive).catch(() => undefined)
    }, 15000)
    return () => window.clearInterval(id)
  }, [canManage])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await vehiclesApi.create({
        ...form,
        color: form.color || null,
        department: form.department || null,
      })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function assignDriver(vehicleId: string, employeeId: string) {
    if (!employeeId) return
    try {
      await vehiclesApi.assignDriver(vehicleId, employeeId)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Vehicles"
        subtitle="Fleet inventory and live locations"
        actions={canManage ? <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'Add vehicle'}</Button> : undefined}
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="stat-grid">
        <Stat label="Total" value={summary?.total ?? '—'} />
        <Stat label="Available" value={summary?.available ?? '—'} />
        <Stat label="Active" value={summary?.active ?? '—'} />
        <Stat label="Workshop" value={summary?.workshop ?? '—'} />
      </div>

      {showForm ? (
        <Card>
          <form className="form-grid" onSubmit={onCreate}>
            <Input placeholder="Number plate" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
            <Input placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
            <Input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            <Input type="number" placeholder="Year" value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            <Input placeholder="Color" value={form.color ?? ''} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input placeholder="Department" value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={form.vehicleTypeId} onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })} required>
              <option value="">Vehicle type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Button type="submit">Create</Button>
          </form>
        </Card>
      ) : null}

      <div className="grid-2">
        <Card>
          <h2>Fleet</h2>
          {items.length === 0 ? (
            <EmptyState message="No vehicles yet." />
          ) : (
            <Table headers={['Number', 'Vehicle', 'Type', 'Status', 'Driver']}>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>{v.number}</td>
                  <td>
                    {v.make} {v.model}
                  </td>
                  <td>{v.vehicleTypeName}</td>
                  <td>
                    <Badge tone={v.status === 'Active' ? 'ok' : v.status === 'Workshop' ? 'warn' : 'neutral'}>{v.status}</Badge>
                  </td>
                  <td>
                    {canManage ? (
                      <Select
                        defaultValue={v.driverEmployeeId ?? ''}
                        onChange={(e) => void assignDriver(v.id, e.target.value)}
                      >
                        <option value="">Assign driver</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      v.driverEmployeeId || '—'
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <h2>Live locations</h2>
          {live.length === 0 ? (
            <EmptyState message="No live GPS updates yet." />
          ) : (
            <Table headers={['Vehicle', 'Lat', 'Lng', 'Speed', 'Updated']}>
              {live.map((loc) => (
                <tr key={loc.vehicleId}>
                  <td>{loc.vehicleNumber}</td>
                  <td>{loc.latitude.toFixed(5)}</td>
                  <td>{loc.longitude.toFixed(5)}</td>
                  <td>{loc.speedKmh ?? '—'} km/h</td>
                  <td>{formatDate(loc.updatedAtUtc || loc.recordedAtUtc)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
