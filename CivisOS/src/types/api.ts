export type ApiResponse<T> = {
  success: boolean
  message?: string | null
  data?: T | null
  errors?: string[] | null
}

export type PagedResult<T> = {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type UserDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  roles: string[]
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
  user: UserDto
}

export type LoginRequest = { email: string; password: string }

export type RegisterRequest = {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  role: string
}

export type DepartmentDto = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

export type DesignationDto = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

export type WorkShift = 'Morning' | 'Afternoon' | 'Night' | 'General'

export type EmployeeDto = {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email?: string | null
  phoneNumber?: string | null
  joiningDate: string
  shift: WorkShift
  isActive: boolean
  departmentId: string
  departmentName: string
  designationId: string
  designationName: string
  supervisorId?: string | null
  supervisorName?: string | null
  userId?: string | null
  createdAtUtc: string
}

export type CreateEmployeeRequest = {
  employeeCode: string
  firstName: string
  lastName: string
  email?: string | null
  phoneNumber?: string | null
  joiningDate: string
  shift: WorkShift
  departmentId: string
  designationId: string
  supervisorId?: string | null
  userId?: string | null
  isActive?: boolean
}

export type AttendanceStatus = 'Present' | 'Rejected' | 'CheckedOut'

export type AttendanceDto = {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  geoFenceId: string
  geoFenceName: string
  attendanceDate: string
  checkInAtUtc?: string | null
  checkOutAtUtc?: string | null
  checkInLatitude: number
  checkInLongitude: number
  checkInDistanceMeters: number
  checkOutLatitude?: number | null
  checkOutLongitude?: number | null
  checkOutDistanceMeters?: number | null
  status: AttendanceStatus
  rejectionReason?: string | null
  createdAtUtc: string
}

export type GeoFenceStatus = 'Active' | 'Inactive'

export type GeoFenceDto = {
  id: string
  name: string
  description?: string | null
  centerLatitude: number
  centerLongitude: number
  radiusMeters: number
  status: GeoFenceStatus
  createdAtUtc: string
  updatedAtUtc?: string | null
}

export type VehicleStatus = 'Available' | 'Active' | 'Workshop' | 'NonOperational'

export type VehicleDocumentDto = {
  id: string
  vehicleId: string
  documentType: string
  title: string
  documentNumber?: string | null
  issuedOn?: string | null
  expiresOn?: string | null
  filePath?: string | null
  notes?: string | null
}

export type VehicleDto = {
  id: string
  number: string
  make: string
  model: string
  year?: number | null
  color?: string | null
  status: VehicleStatus
  department?: string | null
  vehicleTypeId: string
  vehicleTypeName: string
  fuelType?: string | null
  fuelCapacityLiters?: number | null
  currentFuelLevelLiters?: number | null
  averageMileageKmPerLiter?: number | null
  lastServiceDate?: string | null
  nextServiceDueDate?: string | null
  odometerKm?: number | null
  maintenanceNotes?: string | null
  driverEmployeeId?: string | null
  createdAtUtc: string
  documents: VehicleDocumentDto[]
}

export type VehicleTypeDto = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

export type VehicleSummaryDto = {
  total: number
  available: number
  active: number
  workshop: number
  nonOperational: number
  documentsExpiringSoon: number
}

export type VehicleLocationDto = {
  vehicleId: string
  vehicleNumber: string
  latitude: number
  longitude: number
  speedKmh?: number | null
  recordedAtUtc: string
  updatedAtUtc?: string | null
}

export type CreateVehicleRequest = {
  number: string
  make: string
  model: string
  year?: number | null
  color?: string | null
  status: VehicleStatus
  department?: string | null
  vehicleTypeId: string
  fuelType?: string | null
  fuelCapacityLiters?: number | null
  currentFuelLevelLiters?: number | null
  averageMileageKmPerLiter?: number | null
  lastServiceDate?: string | null
  nextServiceDueDate?: string | null
  odometerKm?: number | null
  maintenanceNotes?: string | null
}

export type CleaningAreaStatus = 'Active' | 'Inactive'
export type CleaningFrequency = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly'
export type CleaningLogStatus = 'Started' | 'Completed' | 'Inspected'

export type CleaningAreaDto = {
  id: string
  name: string
  description?: string | null
  geoFenceId?: string | null
  geoFenceName?: string | null
  frequency: CleaningFrequency
  assignedEmployeeId?: string | null
  assignedEmployeeName?: string | null
  lastCleanedAtUtc?: string | null
  nextCleanDueAtUtc?: string | null
  status: CleaningAreaStatus
  createdAtUtc: string
}

export type CleaningScheduleDto = {
  id: string
  cleaningAreaId: string
  cleaningAreaName: string
  frequency: CleaningFrequency
  preferredTimeLocal: string
  assignedEmployeeId?: string | null
  assignedEmployeeName?: string | null
  isActive: boolean
  notes?: string | null
  createdAtUtc: string
}

export type CleaningPhotoDto = {
  id: string
  photoType: string
  filePath: string
  caption?: string | null
  aiConfidenceScore?: number | null
  createdAtUtc: string
}

export type CleaningLogDto = {
  id: string
  cleaningAreaId: string
  cleaningAreaName: string
  employeeId: string
  employeeName: string
  startedAtUtc: string
  completedAtUtc?: string | null
  status: CleaningLogStatus
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  inspectionScore?: number | null
  inspectionNotes?: string | null
  photos: CleaningPhotoDto[]
  createdAtUtc: string
}

export type WorkTaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type WorkTaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Overdue' | 'Cancelled'

export type WorkTaskDto = {
  id: string
  title: string
  description?: string | null
  priority: WorkTaskPriority
  status: WorkTaskStatus
  deadlineUtc?: string | null
  assigneeEmployeeId?: string | null
  assigneeEmployeeName?: string | null
  assignedByEmployeeId?: string | null
  assignedByEmployeeName?: string | null
  geoFenceId?: string | null
  geoFenceName?: string | null
  cleaningAreaId?: string | null
  cleaningAreaName?: string | null
  startedAtUtc?: string | null
  completedAtUtc?: string | null
  approvedAtUtc?: string | null
  statusNotes?: string | null
  createdAtUtc: string
}

export type NotificationDto = {
  id: string
  title: string
  body: string
  type: string
  relatedEntityId?: string | null
  relatedEntityType?: string | null
  isRead: boolean
  readAtUtc?: string | null
  createdAtUtc: string
}

export type ConversationType = 'Private' | 'Group'

export type ConversationDto = {
  id: string
  title: string
  type: ConversationType
  createdByUserId?: string | null
  memberUserIds: string[]
  lastMessageAtUtc?: string | null
  lastMessagePreview?: string | null
  createdAtUtc: string
}

export type MessageDto = {
  id: string
  conversationId: string
  senderUserId: string
  body: string
  sentAtUtc: string
}

export type ReportSummaryItem = { key: string; count: number }

export type VehicleReportDto = {
  fromUtc: string
  toUtc: string
  statusCounts: ReportSummaryItem[]
  activeVehicles: number
  locationUpdates: number
  fenceEvents: number
  items: Array<{
    vehicleId: string
    number: string
    make: string
    model: string
    status: VehicleStatus
    lastLocationAtUtc?: string | null
    fenceEventCount: number
  }>
}

export type AttendanceReportDto = {
  fromUtc: string
  toUtc: string
  statusCounts: ReportSummaryItem[]
  totalRecords: number
  presentCount: number
  rejectedCount: number
  items: Array<{
    attendanceId: string
    employeeId: string
    employeeName: string
    attendanceDate: string
    status: AttendanceStatus
    geoFenceName: string
  }>
}

export type CleaningReportDto = {
  fromUtc: string
  toUtc: string
  statusCounts: ReportSummaryItem[]
  areasCount: number
  logsCount: number
  completedLogs: number
  items: Array<{
    logId: string
    cleaningAreaId: string
    cleaningAreaName: string
    employeeName: string
    status: CleaningLogStatus
    startedAtUtc: string
    completedAtUtc?: string | null
    photoCount: number
  }>
}

export type TaskReportDto = {
  fromUtc: string
  toUtc: string
  statusCounts: ReportSummaryItem[]
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  items: Array<{
    taskId: string
    title: string
    priority: WorkTaskPriority
    status: WorkTaskStatus
    assigneeName?: string | null
    deadlineUtc?: string | null
    createdAtUtc: string
  }>
}

export type AiAlertStatus = 'Open' | 'Acknowledged' | 'Resolved'
export type AiAlertSeverity = 'Info' | 'Warning' | 'Critical'

export type AiAlertDto = {
  id: string
  alertType: string
  severity: AiAlertSeverity
  status: AiAlertStatus
  title: string
  message: string
  relatedEntityId?: string | null
  relatedEntityType?: string | null
  detectedAtUtc: string
  acknowledgedAtUtc?: string | null
  acknowledgedByUserId?: string | null
  createdAtUtc: string
}

export type AiAssistantAnswerDto = {
  question: string
  answer: string
  sourcesUsed: string[]
}

export type AppPageDto = {
  id: string
  pageKey: string
  title: string
  routePath: string
  icon?: string | null
  requiredPermissionCode?: string | null
  parentPageId?: string | null
  sortOrder: number
  children: AppPageDto[]
}

export type MyAccessDto = {
  userId: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  permissions: string[]
  pages: AppPageDto[]
}

export type PermissionDto = {
  id: string
  code: string
  name: string
  module: string
  description?: string | null
  isActive: boolean
}

export type RolePermissionMatrixDto = {
  roleName: string
  allPermissions: PermissionDto[]
  grantedPermissionCodes: string[]
}

export type UserPermissionOverrideDto = {
  permissionCode: string
  isGranted: boolean
}

export type UserPermissionMatrixDto = {
  userId: string
  email: string
  fullName: string
  roles: string[]
  effectivePermissionCodes: string[]
  overrides: UserPermissionOverrideDto[]
}

export type SetRolePermissionsRequest = {
  permissionCodes: string[]
}

export type SetUserPermissionsRequest = {
  overrides: UserPermissionOverrideDto[]
}

export const PERMISSIONS = {
  Manage: 'permissions.manage',
} as const

export const ROLES = {
  SuperAdmin: 'SuperAdmin',
  SocietyAdmin: 'SocietyAdmin',
  Supervisor: 'Supervisor',
  Employee: 'Employee',
  Driver: 'Driver',
  Security: 'Security',
  Resident: 'Resident',
} as const

export const ADMIN_ROLES = [ROLES.SuperAdmin, ROLES.SocietyAdmin, ROLES.Supervisor]

export const EDITABLE_ROLES = [
  ROLES.SocietyAdmin,
  ROLES.Supervisor,
  ROLES.Employee,
  ROLES.Driver,
  ROLES.Security,
  ROLES.Resident,
] as const

