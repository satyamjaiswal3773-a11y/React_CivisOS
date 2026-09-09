import { useEffect, useState, type FormEvent } from 'react'
import { attendanceApi, geoFencesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Select, Table, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { AttendanceDto, GeoFenceDto } from '../types/api'
import { ADMIN_ROLES } from '../types/api'

async function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
  })
}

export function AttendancePage() {
  const { hasAnyRole } = useAuth()
  const isAdmin = hasAnyRole(...ADMIN_ROLES)
  const [myItems, setMyItems] = useState<AttendanceDto[]>([])
  const [adminItems, setAdminItems] = useState<AttendanceDto[]>([])
  const [fences, setFences] = useState<GeoFenceDto[]>([])
  const [geoFenceId, setGeoFenceId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const [mine, fencePage] = await Promise.all([
        attendanceApi.my({ pageNumber: 1, pageSize: 20 }),
        geoFencesApi.list({ pageNumber: 1, pageSize: 50 }),
      ])
      setMyItems(mine.items)
      setFences(fencePage.items.filter((f) => f.status === 'Active'))
      if (!geoFenceId && fencePage.items[0]) setGeoFenceId(fencePage.items[0].id)
      if (isAdmin) {
        const all = await attendanceApi.list({ pageNumber: 1, pageSize: 30 })
        setAdminItems(all.items)
      }
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [isAdmin])

  async function checkIn(e: FormEvent) {
    e.preventDefault()
    if (!geoFenceId) {
      setError('Select a geo-fence.')
      return
    }
    setBusy(true)
    try {
      const pos = await getPosition()
      await attendanceApi.checkIn({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        geoFenceId,
      })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function checkOut() {
    setBusy(true)
    try {
      const pos = await getPosition()
      await attendanceApi.checkOut({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Attendance" subtitle="Geo-fenced check-in and check-out" />
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <h2>Quick actions</h2>
        <form className="toolbar" onSubmit={checkIn}>
          <Select value={geoFenceId} onChange={(e) => setGeoFenceId(e.target.value)} required>
            <option value="">Select geo-fence</option>
            {fences.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={busy}>
            Check in
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void checkOut()}>
            Check out
          </Button>
        </form>
      </Card>

      <Card>
        <h2>My attendance</h2>
        {myItems.length === 0 ? (
          <EmptyState message="No attendance records yet." />
        ) : (
          <Table headers={['Date', 'Fence', 'Check-in', 'Check-out', 'Status']}>
            {myItems.map((a) => (
              <tr key={a.id}>
                <td>{a.attendanceDate}</td>
                <td>{a.geoFenceName}</td>
                <td>{formatDate(a.checkInAtUtc)}</td>
                <td>{formatDate(a.checkOutAtUtc)}</td>
                <td>
                  <Badge tone={a.status === 'Rejected' ? 'danger' : a.status === 'CheckedOut' ? 'ok' : 'info'}>{a.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {isAdmin ? (
        <Card>
          <h2>All attendance</h2>
          {adminItems.length === 0 ? (
            <EmptyState message="No team attendance yet." />
          ) : (
            <Table headers={['Employee', 'Date', 'Fence', 'Status', 'Distance (m)']}>
              {adminItems.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.employeeName} ({a.employeeCode})
                  </td>
                  <td>{a.attendanceDate}</td>
                  <td>{a.geoFenceName}</td>
                  <td>
                    <Badge tone={a.status === 'Rejected' ? 'danger' : 'ok'}>{a.status}</Badge>
                  </td>
                  <td>{a.checkInDistanceMeters.toFixed(1)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : null}
    </div>
  )
}
