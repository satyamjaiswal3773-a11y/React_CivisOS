import { http, unwrap, unwrapResult } from '../lib/http'
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
  MyAccessDto,
  NotificationDto,
  PagedResult,
  PermissionDto,
  RegisterRequest,
  RolePermissionMatrixDto,
  SetRolePermissionsRequest,
  SetUserPermissionsRequest,
  TaskReportDto,
  UserDto,
  UserPermissionMatrixDto,
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
import type {
  ApprovalActionRequest,
  ApproveOvertimeRequest,
  AssignShiftRequest,
  AttendanceDashboardDto,
  AttendanceExceptionDto,
  AttendanceLockDto,
  AttendancePunchDto,
  AttendanceReportType,
  AttendanceSummaryDto,
  AuditLogDto,
  BulkAssignShiftRequest,
  CreateOvertimeRequest,
  CreatePunchRequest,
  CreateRegularizationRequest,
  CreateShiftRequest,
  EmployeeAttendanceDayDto,
  EmployeeShiftDto,
  ImportBatchDto,
  ImportConfirmResultDto,
  ManualAttendanceCorrectionRequest,
  MonthActionRequest,
  MonthlyAttendanceEmployeeDto,
  OvertimeRequestDto,
  PayrollAttendanceDto,
  ProcessAttendanceRequest,
  RegularizationDto,
  ResolveExceptionRequest,
  SelfPunchRequest,
  ShiftDto,
  UnlockMonthRequest,
  UpdateShiftRequest,
} from '../types/attendance'

type QueryParams = Record<string, string | number | boolean | undefined | null>

export const authApi = {
  login: (body: LoginRequest) =>
    unwrap(http.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', body)),
  /** Creates a login account. Returns tokens for the new user — do not replace the admin session. */
  register: (body: RegisterRequest) =>
    unwrap(http.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', body)),
  me: () => unwrap(http.get<ApiResponse<UserDto>>('/api/v1/auth/me')),
  myAccess: () => unwrap(http.get<ApiResponse<MyAccessDto>>('/api/v1/auth/me/access')),
}

export const permissionsApi = {
  list: () => unwrap(http.get<ApiResponse<PermissionDto[]>>('/api/v1/permissions')),
  roleMatrix: (roleName: string) =>
    unwrap(http.get<ApiResponse<RolePermissionMatrixDto>>(`/api/v1/permissions/roles/${encodeURIComponent(roleName)}`)),
  setRolePermissions: (roleName: string, body: SetRolePermissionsRequest) =>
    unwrapResult(http.put<ApiResponse<RolePermissionMatrixDto>>(`/api/v1/permissions/roles/${encodeURIComponent(roleName)}`, body)),
  userMatrix: (userId: string) =>
    unwrap(http.get<ApiResponse<UserPermissionMatrixDto>>(`/api/v1/permissions/users/${encodeURIComponent(userId)}`)),
  setUserPermissions: (userId: string, body: SetUserPermissionsRequest) =>
    unwrapResult(http.put<ApiResponse<UserPermissionMatrixDto>>(`/api/v1/permissions/users/${encodeURIComponent(userId)}`, body)),
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

function cleanParams(params?: QueryParams) {
  if (!params) return undefined
  const next: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    next[key] = value
  }
  return next
}

export const attendanceApi = {
  my: (params?: QueryParams) =>
    unwrap(http.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/v1/attendance/my', { params: cleanParams(params) })),
  list: (params?: QueryParams) =>
    unwrap(http.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/v1/attendance', { params: cleanParams(params) })),
  checkIn: (body: { latitude: number; longitude: number; geoFenceId: string }) =>
    unwrap(http.post<ApiResponse<AttendanceDto>>('/api/v1/attendance/check-in', body)),
  checkOut: (body: { latitude: number; longitude: number }) =>
    unwrap(http.post<ApiResponse<AttendanceDto>>('/api/v1/attendance/check-out', body)),

  dashboard: (params?: { date?: string; departmentId?: string }) =>
    unwrap(
      http.get<ApiResponse<AttendanceDashboardDto>>('/api/v1/attendance/dashboard', {
        params: cleanParams(params),
      }),
    ),

  daily: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<EmployeeAttendanceDayDto>>>('/api/v1/attendance/days/daily', {
        params: cleanParams(params),
      }),
    ),
  monthly: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<MonthlyAttendanceEmployeeDto>>>('/api/v1/attendance/days/monthly', {
        params: cleanParams(params),
      }),
    ),
  dayDetail: (employeeId: string, date: string) =>
    unwrap(
      http.get<ApiResponse<EmployeeAttendanceDayDto>>(
        `/api/v1/attendance/days/employee/${employeeId}/date/${date}`,
      ),
    ),
  summary: (params?: { employeeId?: string; from?: string; to?: string }) =>
    unwrap(
      http.get<ApiResponse<AttendanceSummaryDto>>('/api/v1/attendance/days/summary', {
        params: cleanParams(params),
      }),
    ),
  process: (body: ProcessAttendanceRequest) =>
    unwrap(http.post<ApiResponse<number>>('/api/v1/attendance/days/process', body)),
  correct: (body: ManualAttendanceCorrectionRequest) =>
    unwrap(http.post<ApiResponse<EmployeeAttendanceDayDto>>('/api/v1/attendance/days/correct', body)),

  punches: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<AttendancePunchDto>>>('/api/v1/attendance/punches', {
        params: cleanParams(params),
      }),
    ),
  punchesDay: (params: { employeeId?: string; date?: string }) =>
    unwrap(
      http.get<ApiResponse<AttendancePunchDto[]>>('/api/v1/attendance/punches/day', {
        params: cleanParams(params),
      }),
    ),
  createPunch: (body: CreatePunchRequest) =>
    unwrap(http.post<ApiResponse<AttendancePunchDto>>('/api/v1/attendance/punches', body)),
  selfPunch: (body: SelfPunchRequest) =>
    unwrap(http.post<ApiResponse<AttendancePunchDto>>('/api/v1/attendance/punches/self', body)),

  regularizations: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<RegularizationDto>>>('/api/v1/attendance/regularizations', {
        params: cleanParams(params),
      }),
    ),
  regularization: (id: string) =>
    unwrap(http.get<ApiResponse<RegularizationDto>>(`/api/v1/attendance/regularizations/${id}`)),
  createRegularization: (body: CreateRegularizationRequest) =>
    unwrap(http.post<ApiResponse<RegularizationDto>>('/api/v1/attendance/regularizations', body)),
  approveRegularization: (id: string, body?: ApprovalActionRequest) =>
    unwrap(http.post<ApiResponse<RegularizationDto>>(`/api/v1/attendance/regularizations/${id}/approve`, body ?? {})),
  rejectRegularization: (id: string, body?: ApprovalActionRequest) =>
    unwrap(http.post<ApiResponse<RegularizationDto>>(`/api/v1/attendance/regularizations/${id}/reject`, body ?? {})),
  sendBackRegularization: (id: string, body?: ApprovalActionRequest) =>
    unwrap(http.post<ApiResponse<RegularizationDto>>(`/api/v1/attendance/regularizations/${id}/send-back`, body ?? {})),

  overtime: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<OvertimeRequestDto>>>('/api/v1/attendance/overtime', {
        params: cleanParams(params),
      }),
    ),
  createOvertime: (body: CreateOvertimeRequest) =>
    unwrap(http.post<ApiResponse<OvertimeRequestDto>>('/api/v1/attendance/overtime', body)),
  approveOvertime: (id: string, body: ApproveOvertimeRequest) =>
    unwrap(http.post<ApiResponse<OvertimeRequestDto>>(`/api/v1/attendance/overtime/${id}/approve`, body)),
  rejectOvertime: (id: string, body?: ApprovalActionRequest) =>
    unwrap(http.post<ApiResponse<OvertimeRequestDto>>(`/api/v1/attendance/overtime/${id}/reject`, body ?? {})),

  exceptions: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<AttendanceExceptionDto>>>('/api/v1/attendance/exceptions', {
        params: cleanParams(params),
      }),
    ),
  exception: (id: string) =>
    unwrap(http.get<ApiResponse<AttendanceExceptionDto>>(`/api/v1/attendance/exceptions/${id}`)),
  resolveException: (id: string, body: ResolveExceptionRequest) =>
    unwrap(http.post<ApiResponse<AttendanceExceptionDto>>(`/api/v1/attendance/exceptions/${id}/resolve`, body)),

  uploadImport: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap(
      http.post<ApiResponse<ImportBatchDto>>('/api/v1/attendance/import/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },
  importBatch: (batchId: string) =>
    unwrap(http.get<ApiResponse<ImportBatchDto>>(`/api/v1/attendance/import/${batchId}`)),
  confirmImport: (batchId: string) =>
    unwrap(http.post<ApiResponse<ImportConfirmResultDto>>(`/api/v1/attendance/import/${batchId}/confirm`)),

  locks: (params?: { year?: number }) =>
    unwrap(
      http.get<ApiResponse<AttendanceLockDto[]>>('/api/v1/attendance/locks', {
        params: cleanParams(params),
      }),
    ),
  finalize: (body: MonthActionRequest) =>
    unwrap(http.post<ApiResponse<AttendanceLockDto>>('/api/v1/attendance/locks/finalize', body)),
  lock: (body: MonthActionRequest) =>
    unwrap(http.post<ApiResponse<AttendanceLockDto>>('/api/v1/attendance/locks/lock', body)),
  unlock: (body: UnlockMonthRequest) =>
    unwrap(http.post<ApiResponse<AttendanceLockDto>>('/api/v1/attendance/locks/unlock', body)),

  audit: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<AuditLogDto>>>('/api/v1/attendance/audit', {
        params: cleanParams(params),
      }),
    ),

  payroll: (params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PayrollAttendanceDto[]>>('/api/v1/attendance/payroll', {
        params: cleanParams(params),
      }),
    ),

  report: (reportType: AttendanceReportType | string, params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<EmployeeAttendanceDayDto>>>(`/api/v1/attendance/reports/${reportType}`, {
        params: cleanParams(params),
      }),
    ),
  exportReport: async (reportType: AttendanceReportType | string, params?: QueryParams) => {
    const response = await http.get<Blob>(`/api/v1/attendance/reports/${reportType}/export`, {
      params: cleanParams(params),
      responseType: 'blob',
    })
    return response.data
  },
}

export const shiftsApi = {
  list: (params?: QueryParams) =>
    unwrap(http.get<ApiResponse<PagedResult<ShiftDto>>>('/api/v1/shifts', { params: cleanParams(params) })),
  get: (id: string) => unwrap(http.get<ApiResponse<ShiftDto>>(`/api/v1/shifts/${id}`)),
  create: (body: CreateShiftRequest) => unwrap(http.post<ApiResponse<ShiftDto>>('/api/v1/shifts', body)),
  update: (id: string, body: UpdateShiftRequest) =>
    unwrap(http.put<ApiResponse<ShiftDto>>(`/api/v1/shifts/${id}`, body)),
  remove: (id: string) => unwrap(http.delete<ApiResponse<object>>(`/api/v1/shifts/${id}`)),
  assign: (body: AssignShiftRequest) =>
    unwrap(http.post<ApiResponse<EmployeeShiftDto>>('/api/v1/shifts/assign', body)),
  bulkAssign: (body: BulkAssignShiftRequest) =>
    unwrap(http.post<ApiResponse<number>>('/api/v1/shifts/bulk-assign', body)),
  current: (employeeId: string, asOf?: string) =>
    unwrap(
      http.get<ApiResponse<EmployeeShiftDto>>(`/api/v1/shifts/employee/${employeeId}`, {
        params: cleanParams({ asOf }),
      }),
    ),
  history: (employeeId: string, params?: QueryParams) =>
    unwrap(
      http.get<ApiResponse<PagedResult<EmployeeShiftDto>>>(`/api/v1/shifts/employee/${employeeId}/history`, {
        params: cleanParams(params),
      }),
    ),
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
