import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ADMIN_ROLES, ROLES } from '../types/api'
import { Badge } from './ui'
import type { AttendanceApprovalStatus, DayAttendanceStatus } from '../types/attendance'

export type AttendanceNavItem = {
  to: string
  label: string
  end?: boolean
  roles?: readonly string[]
}

export const ATTENDANCE_NAV: AttendanceNavItem[] = [
  { to: '/attendance', label: 'Dashboard', end: true, roles: ADMIN_ROLES },
  { to: '/attendance/check-in', label: 'Check-in' },
  { to: '/attendance/daily', label: 'Daily', roles: ADMIN_ROLES },
  { to: '/attendance/monthly', label: 'Monthly', roles: ADMIN_ROLES },
  { to: '/attendance/employee', label: 'Employee' },
  { to: '/attendance/shifts', label: 'Shifts', roles: ADMIN_ROLES },
  { to: '/attendance/shift-assignments', label: 'Assignments', roles: ADMIN_ROLES },
  { to: '/attendance/regularization', label: 'Regularization' },
  { to: '/attendance/regularization/approvals', label: 'Reg. Approvals', roles: ADMIN_ROLES },
  { to: '/attendance/overtime', label: 'Overtime' },
  { to: '/attendance/exceptions', label: 'Exceptions', roles: ADMIN_ROLES },
  { to: '/attendance/import', label: 'Import', roles: [ROLES.SuperAdmin, ROLES.SocietyAdmin] },
  { to: '/attendance/reports', label: 'Reports', roles: ADMIN_ROLES },
  { to: '/attendance/locks', label: 'Locks', roles: [ROLES.SuperAdmin, ROLES.SocietyAdmin] },
  { to: '/attendance/audit', label: 'Audit', roles: [ROLES.SuperAdmin, ROLES.SocietyAdmin] },
]

export function AttendanceLayout() {
  const { hasAnyRole } = useAuth()
  const visible = ATTENDANCE_NAV.filter((item) => !item.roles || hasAnyRole(...item.roles))

  return (
    <div className="page attendance-module">
      <nav className="attendance-subnav" aria-label="Attendance sections">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'att-nav-link active' : 'att-nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export function dayStatusTone(status: DayAttendanceStatus): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'Present':
    case 'Wfh':
    case 'OnDuty':
      return 'ok'
    case 'HalfDay':
    case 'Late':
    case 'EarlyLeaving':
    case 'Holiday':
    case 'WeeklyOff':
      return 'warn'
    case 'Absent':
    case 'MissingPunch':
      return 'danger'
    case 'Leave':
      return 'info'
    default:
      return 'neutral'
  }
}

export function approvalTone(status: AttendanceApprovalStatus): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'Approved':
      return 'ok'
    case 'Pending':
      return 'warn'
    case 'Rejected':
      return 'danger'
    case 'SentBack':
      return 'info'
    default:
      return 'neutral'
  }
}

export function DayStatusBadge({ status }: { status: DayAttendanceStatus }) {
  return <Badge tone={dayStatusTone(status)}>{status}</Badge>
}

export function ApprovalStatusBadge({ status }: { status: AttendanceApprovalStatus }) {
  return <Badge tone={approvalTone(status)}>{status}</Badge>
}

export function statusCellClass(status: DayAttendanceStatus) {
  return `att-cell att-cell-${status.toLowerCase()}`
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function monthStartIso(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toLocalDateTimeInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalDateTimeInput(value: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
