/** Attendance module DTOs — aligned with CivisOS API Swagger schemas. */

export type DayAttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Leave'
  | 'HalfDay'
  | 'Holiday'
  | 'WeeklyOff'
  | 'Wfh'
  | 'OnDuty'
  | 'MissingPunch'
  | 'Late'
  | 'EarlyLeaving'

export type PunchType = 'In' | 'Out'

export type PunchSource = 'Biometric' | 'Web' | 'Mobile' | 'Qr' | 'Admin' | 'Import' | 'Api' | 'GeoFence'

export type AttendanceApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'SentBack' | 'Cancelled'

export type AttendanceExceptionType =
  | 'MissingIn'
  | 'MissingOut'
  | 'DuplicatePunch'
  | 'InvalidPunchSequence'
  | 'LateArrival'
  | 'EarlyLeaving'
  | 'ExcessBreak'
  | 'InvalidShift'
  | 'UnprocessedAttendance'
  | 'UnapprovedOvertime'

export type AttendanceExceptionStatus = 'Open' | 'Resolved' | 'Ignored'

export type AttendanceImportBatchStatus = 'Uploaded' | 'Validated' | 'Confirmed' | 'Failed' | 'Cancelled'

export type AttendanceLockStatus = 'Open' | 'Finalized' | 'Locked'

export type AttendanceAuditAction =
  | 'PunchCreated'
  | 'AttendanceProcessed'
  | 'AttendanceCorrected'
  | 'RegularizationSubmitted'
  | 'RegularizationApproved'
  | 'RegularizationRejected'
  | 'RegularizationSentBack'
  | 'ShiftAssigned'
  | 'ShiftChanged'
  | 'OvertimeSubmitted'
  | 'OvertimeApproved'
  | 'OvertimeRejected'
  | 'ExceptionResolved'
  | 'MonthFinalized'
  | 'MonthLocked'
  | 'MonthUnlocked'
  | 'ImportConfirmed'
  | 'ManualAttendance'

export type WeeklyOffPattern = 'FixedDays' | 'SecondAndFourthSaturday' | 'Rotational'

/** Report path segments accepted by GET /api/v1/attendance/reports/{reportType} */
export type AttendanceReportType =
  | 'daily'
  | 'monthly'
  | 'employee'
  | 'department'
  | 'late'
  | 'early-leaving'
  | 'absent'
  | 'half-day'
  | 'missing-punch'
  | 'overtime'
  | 'regularization'
  | 'exceptions'
  | 'shift-wise'
  | 'holiday'
  | 'weekly-off'
  | 'summary'
  | 'absenteeism'
  | 'leave-vs-attendance'

export const ATTENDANCE_REPORT_TYPES: { value: AttendanceReportType; label: string }[] = [
  { value: 'daily', label: 'Daily Attendance' },
  { value: 'monthly', label: 'Monthly Attendance' },
  { value: 'employee', label: 'Employee Attendance' },
  { value: 'department', label: 'Department Attendance' },
  { value: 'late', label: 'Late Coming' },
  { value: 'early-leaving', label: 'Early Leaving' },
  { value: 'absent', label: 'Absent' },
  { value: 'half-day', label: 'Half Day' },
  { value: 'missing-punch', label: 'Missing Punch' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'regularization', label: 'Regularization' },
  { value: 'exceptions', label: 'Exceptions' },
  { value: 'shift-wise', label: 'Shift-wise Attendance' },
  { value: 'holiday', label: 'Holiday Attendance' },
  { value: 'weekly-off', label: 'Weekly-Off Attendance' },
  { value: 'summary', label: 'Attendance Summary' },
  { value: 'absenteeism', label: 'Absenteeism' },
  { value: 'leave-vs-attendance', label: 'Leave vs Attendance' },
]

export type TrendPointDto = {
  date: string
  count: number
  value?: number | null
}

export type DepartmentAttendanceDto = {
  departmentId: string
  departmentName?: string | null
  present: number
  absent: number
  leave: number
  total: number
}

export type LeaveUtilizationDto = {
  leaveTypeName?: string | null
  days: number
}

export type AttendanceDashboardDto = {
  totalEmployees: number
  present: number
  absent: number
  leave: number
  halfDay: number
  weeklyOff: number
  holiday: number
  wfh: number
  onDuty: number
  late: number
  earlyLeaving: number
  missingPunch: number
  overtime: number
  pendingRegularization: number
  pendingApproval: number
  attendanceTrend?: TrendPointDto[] | null
  departmentWiseAttendance?: DepartmentAttendanceDto[] | null
  lateTrend?: TrendPointDto[] | null
  overtimeTrend?: TrendPointDto[] | null
  leaveUtilization?: LeaveUtilizationDto[] | null
}

export type AttendanceSummaryDto = {
  presentDays: number
  absentDays: number
  leaveDays: number
  halfDays: number
  weeklyOffDays: number
  holidayDays: number
  lateCount: number
  earlyLeavingCount: number
  missingPunchCount: number
  totalWorkingMinutes: number
  totalBreakMinutes: number
  totalOvertimeMinutes: number
  wfhDays: number
  onDutyDays: number
}

export type EmployeeAttendanceDayDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  designationId?: string | null
  designationName?: string | null
  attendanceDate: string
  shiftId?: string | null
  shiftName?: string | null
  firstInUtc?: string | null
  lastOutUtc?: string | null
  totalPunches: number
  breakMinutes: number
  workingMinutes: number
  lateMinutes: number
  earlyOutMinutes: number
  overtimeMinutes: number
  excessBreakMinutes: number
  status: DayAttendanceStatus
  attendanceSource: PunchSource
  isLate: boolean
  isEarlyLeaving: boolean
  hasMissingPunch: boolean
  isFinalized: boolean
  isManualOverride: boolean
  remarks?: string | null
}

export type DayStatusCellDto = {
  date: string
  status: DayAttendanceStatus
  workingMinutes: number
  lateMinutes: number
  overtimeMinutes: number
  isLate: boolean
  hasOt: boolean
}

export type MonthlyAttendanceEmployeeDto = {
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  days?: DayStatusCellDto[] | null
  summary: AttendanceSummaryDto
}

export type AttendancePunchDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  punchDateTimeUtc: string
  punchType: PunchType
  source: PunchSource
  deviceId?: string | null
  ipAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  accuracyMeters?: number | null
  remarks?: string | null
  createdAtUtc: string
}

export type ShiftDto = {
  id: string
  shiftCode?: string | null
  shiftName?: string | null
  startTime: string
  endTime: string
  gracePeriodMinutes: number
  minimumWorkingMinutes: number
  allowedBreakMinutes: number
  lateAfterMinutes: number
  earlyLeavingAfterMinutes: number
  overtimeAllowed: boolean
  overtimeAfterMinutes: number
  isNightShift: boolean
  isCrossMidnight: boolean
  isActive: boolean
  description?: string | null
  createdAtUtc: string
}

export type CreateShiftRequest = {
  shiftCode?: string | null
  shiftName?: string | null
  startTime: string
  endTime: string
  gracePeriodMinutes: number
  minimumWorkingMinutes: number
  allowedBreakMinutes: number
  lateAfterMinutes: number
  earlyLeavingAfterMinutes: number
  overtimeAllowed: boolean
  overtimeAfterMinutes: number
  isNightShift: boolean
  isCrossMidnight: boolean
  description?: string | null
}

export type UpdateShiftRequest = {
  shiftName?: string | null
  startTime: string
  endTime: string
  gracePeriodMinutes: number
  minimumWorkingMinutes: number
  allowedBreakMinutes: number
  lateAfterMinutes: number
  earlyLeavingAfterMinutes: number
  overtimeAllowed: boolean
  overtimeAfterMinutes: number
  isNightShift: boolean
  isCrossMidnight: boolean
  isActive: boolean
  description?: string | null
}

export type EmployeeShiftDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  shiftId: string
  shiftName?: string | null
  effectiveFrom: string
  effectiveTo?: string | null
  isActive: boolean
  remarks?: string | null
}

export type AssignShiftRequest = {
  employeeId: string
  shiftId: string
  effectiveFrom: string
  effectiveTo?: string | null
  departmentId?: string | null
  remarks?: string | null
}

export type BulkAssignShiftRequest = {
  employeeIds?: string[] | null
  shiftId: string
  effectiveFrom: string
  effectiveTo?: string | null
  remarks?: string | null
}

export type RegularizationDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  attendanceDate: string
  requestedInUtc?: string | null
  requestedOutUtc?: string | null
  reason?: string | null
  remarks?: string | null
  attachmentReference?: string | null
  status: AttendanceApprovalStatus
  requestedByUserId?: string | null
  approvedByUserId?: string | null
  approvedAtUtc?: string | null
  rejectedByUserId?: string | null
  rejectedAtUtc?: string | null
  approverRemarks?: string | null
  createdAtUtc: string
}

export type CreateRegularizationRequest = {
  employeeId?: string | null
  attendanceDate: string
  requestedInUtc?: string | null
  requestedOutUtc?: string | null
  reason?: string | null
  remarks?: string | null
  attachmentReference?: string | null
}

export type ApprovalActionRequest = {
  remarks?: string | null
}

export type OvertimeRequestDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  overtimeDate: string
  requestedHours: number
  approvedHours?: number | null
  reason?: string | null
  remarks?: string | null
  status: AttendanceApprovalStatus
  isPayable: boolean
  requestedByUserId?: string | null
  approvedByUserId?: string | null
  approvedAtUtc?: string | null
  approverRemarks?: string | null
  createdAtUtc: string
}

export type CreateOvertimeRequest = {
  employeeId?: string | null
  overtimeDate: string
  requestedHours: number
  reason?: string | null
  remarks?: string | null
}

export type ApproveOvertimeRequest = {
  approvedHours?: number | null
  remarks?: string | null
  isPayable: boolean
}

export type AttendanceExceptionDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  attendanceDate: string
  exceptionType: AttendanceExceptionType
  status: AttendanceExceptionStatus
  message?: string | null
  remarks?: string | null
  resolvedByUserId?: string | null
  resolvedAtUtc?: string | null
  createdAtUtc: string
}

export type ResolveExceptionRequest = {
  remarks?: string | null
  status: AttendanceExceptionStatus
}

export type ImportErrorDto = {
  rowNumber: number
  rawData?: string | null
  errorMessage?: string | null
}

export type ImportBatchDto = {
  id: string
  fileName?: string | null
  contentType?: string | null
  status: AttendanceImportBatchStatus
  uploadedByUserId?: string | null
  totalRecords: number
  validRecords: number
  invalidRecords: number
  duplicateRecords: number
  confirmedAtUtc?: string | null
  remarks?: string | null
  createdAtUtc: string
  errors?: ImportErrorDto[] | null
}

export type ImportConfirmResultDto = {
  batchId: string
  totalRecords: number
  validRecords: number
  invalidRecords: number
  duplicateRecords: number
  punchesInserted: number
  daysProcessed: number
}

export type AttendanceLockDto = {
  id: string
  year: number
  month: number
  status: AttendanceLockStatus
  finalizedByUserId?: string | null
  finalizedAtUtc?: string | null
  lockedByUserId?: string | null
  lockedAtUtc?: string | null
  unlockedByUserId?: string | null
  unlockedAtUtc?: string | null
  unlockReason?: string | null
  remarks?: string | null
}

export type MonthActionRequest = {
  year: number
  month: number
  remarks?: string | null
}

export type UnlockMonthRequest = {
  year: number
  month: number
  reason: string
}

export type AuditLogDto = {
  id: string
  userId?: string | null
  employeeId?: string | null
  attendanceDate?: string | null
  action: AttendanceAuditAction
  oldValue?: string | null
  newValue?: string | null
  reason?: string | null
  ipAddress?: string | null
  createdAtUtc: string
}

export type PayrollAttendanceDto = {
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  year: number
  month: number
  presentDays: number
  absentDays: number
  leaveDays: number
  lopDays: number
  halfDays: number
  lateDeductionMinutes: number
  approvedOvertimeHours: number
  holidayWorkDays: number
  weeklyOffWorkDays: number
  totalWorkingMinutes: number
}

export type ProcessAttendanceRequest = {
  from?: string | null
  to?: string | null
  employeeId?: string | null
  departmentId?: string | null
}

export type ManualAttendanceCorrectionRequest = {
  employeeId: string
  attendanceDate: string
  firstInUtc?: string | null
  lastOutUtc?: string | null
  status: DayAttendanceStatus
  reason?: string | null
  workingMinutes?: number | null
  lateMinutes?: number | null
  earlyOutMinutes?: number | null
  overtimeMinutes?: number | null
  remarks?: string | null
}

export type CreatePunchRequest = {
  employeeId: string
  punchDateTimeUtc: string
  punchType: PunchType
  source: PunchSource
  deviceId?: string | null
  ipAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  accuracyMeters?: number | null
  remarks?: string | null
}

export type SelfPunchRequest = {
  punchType: PunchType
  source: PunchSource
  deviceId?: string | null
  latitude?: number | null
  longitude?: number | null
  accuracyMeters?: number | null
  remarks?: string | null
}

export type HolidayDto = {
  id: string
  name?: string | null
  holidayDate: string
  isOptional: boolean
  isActive: boolean
  description?: string | null
  departmentId?: string | null
  departmentName?: string | null
}

export type CreateHolidayRequest = {
  name?: string | null
  holidayDate: string
  isOptional: boolean
  description?: string | null
  departmentId?: string | null
}

export type UpdateHolidayRequest = {
  name?: string | null
  holidayDate: string
  isOptional: boolean
  isActive: boolean
  description?: string | null
  departmentId?: string | null
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type LeaveTypeDto = {
  id: string
  code?: string | null
  name?: string | null
  isPaid: boolean
  isActive: boolean
  description?: string | null
}

export type LeaveRequestDto = {
  id: string
  employeeId: string
  employeeCode?: string | null
  employeeName?: string | null
  leaveTypeId: string
  leaveTypeName?: string | null
  fromDate: string
  toDate: string
  totalDays: number
  isHalfDay: boolean
  reason?: string | null
  status: LeaveRequestStatus
  approverRemarks?: string | null
  createdAtUtc: string
}

export type WeeklyOffRuleDto = {
  id: string
  name?: string | null
  pattern: WeeklyOffPattern
  fixedDaysCsv?: string | null
  departmentId?: string | null
  departmentName?: string | null
  employeeId?: string | null
  employeeName?: string | null
  effectiveFrom: string
  effectiveTo?: string | null
  isActive: boolean
  remarks?: string | null
}
