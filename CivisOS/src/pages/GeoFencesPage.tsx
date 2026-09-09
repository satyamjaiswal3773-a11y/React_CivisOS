import { useEffect, useState, type FormEvent } from 'react'
import { geoFencesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { GeoFenceDto } from '../types/api'
import { ROLES } from '../types/api'

export function GeoFencesPage() {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor)
  const [items, setItems] = useState<GeoFenceDto[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    centerLatitude: 17.4485,
    centerLongitude: 78.3908,
    radiusMeters: 50,
  })

  async function load() {
    try {
      const result = await geoFencesApi.list({ pageNumber: 1, pageSize: 50 })
      setItems(result.items)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await geoFencesApi.create({
        ...form,
        description: form.description || undefined,
        status: 'Active',
      })
      setShowForm(false)
      setForm({ name: '', description: '', centerLatitude: 17.4485, centerLongitude: 78.3908, radiusMeters: 50 })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Geo-fences"
        subtitle="Attendance and vehicle boundary zones"
        actions={canManage ? <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'Add fence'}</Button> : undefined}
      />
      {error ? <ErrorBanner message={error} /> : null}

      {showForm ? (
        <Card>
          <form className="form-grid" onSubmit={onCreate}>
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input
              type="number"
              step="any"
              placeholder="Latitude"
              value={form.centerLatitude}
              onChange={(e) => setForm({ ...form, centerLatitude: Number(e.target.value) })}
              required
            />
            <Input
              type="number"
              step="any"
              placeholder="Longitude"
              value={form.centerLongitude}
              onChange={(e) => setForm({ ...form, centerLongitude: Number(e.target.value) })}
              required
            />
            <Input
              type="number"
              placeholder="Radius (m)"
              value={form.radiusMeters}
              onChange={(e) => setForm({ ...form, radiusMeters: Number(e.target.value) })}
              required
            />
            <Button type="submit">Create</Button>
          </form>
        </Card>
      ) : null}

      <Card>
        {items.length === 0 ? (
          <EmptyState message="No geo-fences configured." />
        ) : (
          <Table headers={['Name', 'Center', 'Radius', 'Status', 'Created']}>
            {items.map((f) => (
              <tr key={f.id}>
                <td>
                  <strong>{f.name}</strong>
                  {f.description ? <div className="muted tiny">{f.description}</div> : null}
                </td>
                <td>
                  {f.centerLatitude.toFixed(5)}, {f.centerLongitude.toFixed(5)}
                </td>
                <td>{f.radiusMeters} m</td>
                <td>
                  <Badge tone={f.status === 'Active' ? 'ok' : 'neutral'}>{f.status}</Badge>
                </td>
                <td>{formatDate(f.createdAtUtc)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
