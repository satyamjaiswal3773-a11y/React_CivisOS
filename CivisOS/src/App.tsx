import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute, RequirePermission } from './auth/ProtectedRoute'
import { AttendanceLayout } from './components/attendance'
import { AppLayout } from './layouts/AppLayout'
import { AiPage } from './pages/AiPage'
import {
  AttendanceAuditPage,
  AttendanceCheckInPage,
  AttendanceDashboardPage,
  AttendanceExceptionsPage,
  AttendanceImportPage,
  AttendanceLocksPage,
  AttendanceReportsPage,
  DailyAttendancePage,
  EmployeeAttendancePage,
  MonthlyAttendancePage,
  OvertimePage,
  RegularizationApprovalPage,
  RegularizationPage,
  ShiftAssignmentPage,
  ShiftManagementPage,
} from './pages/attendance'
import { ChatPage } from './pages/ChatPage'
import { CleaningPage } from './pages/CleaningPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { GeoFencesPage } from './pages/GeoFencesPage'
import { LoginPage } from './pages/LoginPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PermissionsHubPage, RolePermissionsPage, UserPermissionsPage } from './pages/permissions'
import { ReportsPage } from './pages/ReportsPage'
import { TasksPage } from './pages/TasksPage'
import { UsersPage } from './pages/UsersPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { ADMIN_ROLES, PERMISSIONS, ROLES } from './types/api'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="forbidden" element={<ForbiddenPage />} />

              <Route element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="geofences" element={<GeoFencesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="ai" element={<AiPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={[ROLES.SuperAdmin, ROLES.SocietyAdmin]} />}>
                <Route path="users" element={<UsersPage />} />
              </Route>

              <Route element={<RequirePermission permission={PERMISSIONS.Manage} />}>
                <Route path="permissions" element={<PermissionsHubPage />} />
                <Route path="permissions/roles" element={<RolePermissionsPage />} />
                <Route path="permissions/users/:userId" element={<UserPermissionsPage />} />
              </Route>

              <Route path="attendance" element={<AttendanceLayout />}>
                <Route index element={<AttendanceDashboardPage />} />
                <Route path="check-in" element={<AttendanceCheckInPage />} />
                <Route path="daily" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<DailyAttendancePage />} />
                </Route>
                <Route path="monthly" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<MonthlyAttendancePage />} />
                </Route>
                <Route path="employee" element={<EmployeeAttendancePage />} />
                <Route path="shifts" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<ShiftManagementPage />} />
                </Route>
                <Route path="shift-assignments" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<ShiftAssignmentPage />} />
                </Route>
                <Route path="regularization" element={<RegularizationPage />} />
                <Route path="regularization/approvals" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<RegularizationApprovalPage />} />
                </Route>
                <Route path="overtime" element={<OvertimePage />} />
                <Route path="exceptions" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<AttendanceExceptionsPage />} />
                </Route>
                <Route
                  path="import"
                  element={<ProtectedRoute roles={[ROLES.SuperAdmin, ROLES.SocietyAdmin]} />}
                >
                  <Route index element={<AttendanceImportPage />} />
                </Route>
                <Route path="reports" element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                  <Route index element={<AttendanceReportsPage />} />
                </Route>
                <Route
                  path="locks"
                  element={<ProtectedRoute roles={[ROLES.SuperAdmin, ROLES.SocietyAdmin]} />}
                >
                  <Route index element={<AttendanceLocksPage />} />
                </Route>
                <Route
                  path="audit"
                  element={<ProtectedRoute roles={[ROLES.SuperAdmin, ROLES.SocietyAdmin]} />}
                >
                  <Route index element={<AttendanceAuditPage />} />
                </Route>
              </Route>

              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="cleaning" element={<CleaningPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
