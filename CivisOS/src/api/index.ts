import { http, unwrap } from '../lib/http'
import type {
  ApiResponse,
  AttendanceDto,
  AttendanceReportDto,
  AttendanceStatus,
  AuthResponse,
  AiAlertDto,
  AiAlertStatus,
  AiAssistantAnswerDto,
  CleaningAreaDto,
  CleaningFrequency,
  CleaningLogDto,
  CleaningReportDto,
  CleaningScheduleDto,
  ConversationDto,
  ConversationType,
  CreateEmployeeRequest,
  CreateVehicleRequest,
  DepartmentDto,
  DesignationDto,
  EmployeeDto,
  GeoFenceDto,
  GeoFenceStatus,
  LoginRequest,
  MessageDto,
  NotificationDto,
  PagedResult,
  TaskReportDto,
  UserDto,
  VehicleDto,
  VehicleLocationDto,
  VehicleReportDto,
  VehicleStatus,
  VehicleSummaryDto,
  VehicleTypeDto,
  WorkTaskDto,
  WorkTaskPriority,
  WorkTaskStatus,
} from '../types/api'

export const authApi = {
  login: (body: LoginRequest) =>
    unwrap(http.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', body)),
  me: () => unwrap(http.get<ApiResponse<UserDto>>('/api/v1/auth/me')),
}

export const employeesApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<EmployeeDto>>>('/api/v1/employees', { params })),
  create: (body: CreateEmployeeRequest) =>
    unwrap(http.post<ApiResponse<EmployeeDto>>('/api/v1/employees', body)),
  remove: (id: string) => unwrap(http.delete<ApiResponse<object>>(`/api/v1/employees/${id}`)),
  departments: () =>
    unwrap(http.get<ApiResponse<DepartmentDto[]>>('/api/v1/departments')),
  designations: () =>
    unwrap(http.get<ApiResponse<DesignationDto[]>>('/api/v1/designations')),
  createDepartment: (name: string, description?: string) =>
    unwrap(http.post<ApiResponse<DepartmentDto>>('/api/v1/departments', { name, description })),
  createDesignation: (name: string, description?: string) =>
    unwrap(http.post<ApiResponse<DesignationDto>>('/api/v1/designations', { name, description })),
}

export const attendanceApi = {
  my: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/v1/attendance/my', { params })),
  list: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/v1/attendance', { params })),
  checkIn: (body: { latitude: number; longitude: number; geoFenceId: string }) =>
    unwrap(http.post<ApiResponse<AttendanceDto>>('/api/v1/attendance/check-in', body)),
  checkOut: (body: { latitude: number; longitude: number }) =>
    unwrap(http.post<ApiResponse<AttendanceDto>>('/api/v1/attendance/check-out', body)),
}

export const geoFencesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<GeoFenceDto>>>('/api/v1/geofences', { params })),
  create: (body: {
    name: string
    description?: string
    centerLatitude: number
    centerLongitude: number
    radiusMeters: number
    status?: GeoFenceStatus
  }) => unwrap(http.post<ApiResponse<GeoFenceDto>>('/api/v1/geofences', body)),
}

export const vehiclesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<VehicleDto>>>('/api/v1/vehicles', { params })),
  summary: () => unwrap(http.get<ApiResponse<VehicleSummaryDto>>('/api/v1/vehicles/summary')),
  live: () => unwrap(http.get<ApiResponse<VehicleLocationDto[]>>('/api/v1/vehicles/live')),
  types: () => unwrap(http.get<ApiResponse<VehicleTypeDto[]>>('/api/v1/vehicles/types')),
  create: (body: CreateVehicleRequest) =>
    unwrap(http.post<ApiResponse<VehicleDto>>('/api/v1/vehicles', body)),
  remove: (id: string) => unwrap(http.delete<ApiResponse<object>>(`/api/v1/vehicles/${id}`)),
  assignDriver: (id: string, employeeId: string) =>
    unwrap(http.put<ApiResponse<VehicleDto>>(`/api/v1/vehicles/${id}/driver`, { employeeId })),
}

export const cleaningApi = {
  areas: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<CleaningAreaDto>>>('/api/v1/cleaning/areas', { params })),
  createArea: (body: {
    name: string
    description?: string
    geoFenceId?: string | null
    frequency: CleaningFrequency
    assignedEmployeeId?: string | null
  }) => unwrap(http.post<ApiResponse<CleaningAreaDto>>('/api/v1/cleaning/areas', body)),
  schedules: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<CleaningScheduleDto>>>('/api/v1/cleaning/schedules', { params })),
  createSchedule: (body: {
    cleaningAreaId: string
    frequency: CleaningFrequency
    preferredTimeLocal: string
    assignedEmployeeId?: string | null
    notes?: string
  }) => unwrap(http.post<ApiResponse<CleaningScheduleDto>>('/api/v1/cleaning/schedules', body)),
  logs: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<CleaningLogDto>>>('/api/v1/cleaning/logs', { params })),
  createLog: (body: {
    cleaningAreaId: string
    notes?: string
    latitude?: number
    longitude?: number
  }) => unwrap(http.post<ApiResponse<CleaningLogDto>>('/api/v1/cleaning/logs', body)),
  completeLog: (id: string, notes?: string) =>
    unwrap(http.post<ApiResponse<CleaningLogDto>>(`/api/v1/cleaning/logs/${id}/complete`, { notes })),
}

export const tasksApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<WorkTaskDto>>>('/api/v1/tasks', { params })),
  my: (params?: Record<string, string | number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<WorkTaskDto>>>('/api/v1/tasks/my', { params })),
  create: (body: {
    title: string
    description?: string
    priority: WorkTaskPriority
    deadlineUtc?: string | null
    assigneeEmployeeId?: string | null
    geoFenceId?: string | null
    cleaningAreaId?: string | null
  }) => unwrap(http.post<ApiResponse<WorkTaskDto>>('/api/v1/tasks', body)),
  assign: (id: string, assigneeEmployeeId: string) =>
    unwrap(http.post<ApiResponse<WorkTaskDto>>(`/api/v1/tasks/${id}/assign`, { assigneeEmployeeId })),
  updateStatus: (id: string, status: WorkTaskStatus, notes?: string) =>
    unwrap(http.patch<ApiResponse<WorkTaskDto>>(`/api/v1/tasks/${id}/status`, { status, notes })),
  start: (id: string, latitude: number, longitude: number) =>
    unwrap(http.post<ApiResponse<WorkTaskDto>>(`/api/v1/tasks/${id}/start`, { latitude, longitude })),
  approve: (id: string) =>
    unwrap(http.post<ApiResponse<WorkTaskDto>>(`/api/v1/tasks/${id}/approve`)),
}

export const notificationsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<NotificationDto>>>('/api/v1/notifications', { params })),
  markRead: (id: string) =>
    unwrap(http.patch<ApiResponse<NotificationDto>>(`/api/v1/notifications/${id}/read`)),
}

export const conversationsApi = {
  list: (params?: Record<string, number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<ConversationDto>>>('/api/v1/conversations', { params })),
  create: (body: { title: string; type: ConversationType; memberUserIds: string[] }) =>
    unwrap(http.post<ApiResponse<ConversationDto>>('/api/v1/conversations', body)),
  messages: (id: string, params?: Record<string, number | undefined>) =>
    unwrap(http.get<ApiResponse<PagedResult<MessageDto>>>(`/api/v1/conversations/${id}/messages`, { params })),
  send: (id: string, body: string) =>
    unwrap(http.post<ApiResponse<MessageDto>>(`/api/v1/conversations/${id}/messages`, { body })),
}

export const reportsApi = {
  vehicles: (params?: { from?: string; to?: string }) =>
    unwrap(http.get<ApiResponse<VehicleReportDto>>('/api/v1/reports/vehicles', { params })),
  attendance: (params?: { from?: string; to?: string }) =>
    unwrap(http.get<ApiResponse<AttendanceReportDto>>('/api/v1/reports/attendance', { params })),
  cleaning: (params?: { from?: string; to?: string }) =>
    unwrap(http.get<ApiResponse<CleaningReportDto>>('/api/v1/reports/cleaning', { params })),
  tasks: (params?: { from?: string; to?: string }) =>
    unwrap(http.get<ApiResponse<TaskReportDto>>('/api/v1/reports/tasks', { params })),
}

export const aiApi = {
  alerts: (params?: { pageNumber?: number; pageSize?: number; status?: AiAlertStatus }) =>
    unwrap(http.get<ApiResponse<PagedResult<AiAlertDto>>>('/api/v1/ai/alerts', { params })),
  ack: (id: string) => unwrap(http.patch<ApiResponse<AiAlertDto>>(`/api/v1/ai/alerts/${id}/ack`)),
  ask: (question: string) =>
    unwrap(http.post<ApiResponse<AiAssistantAnswerDto>>('/api/v1/ai/assistant/ask', { question })),
}

export type { AttendanceStatus, VehicleStatus }
