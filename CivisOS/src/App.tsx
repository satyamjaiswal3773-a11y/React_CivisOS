import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { AiPage } from './pages/AiPage'
import { AttendancePage } from './pages/AttendancePage'
import { ChatPage } from './pages/ChatPage'
import { CleaningPage } from './pages/CleaningPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { GeoFencesPage } from './pages/GeoFencesPage'
import { LoginPage } from './pages/LoginPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ReportsPage } from './pages/ReportsPage'
import { TasksPage } from './pages/TasksPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { ADMIN_ROLES } from './types/api'
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
              <Route element={<ProtectedRoute roles={[...ADMIN_ROLES]} />}>
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="geofences" element={<GeoFencesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="ai" element={<AiPage />} />
              </Route>
              <Route path="attendance" element={<AttendancePage />} />
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
