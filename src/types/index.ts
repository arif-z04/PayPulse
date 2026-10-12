export type UserRole =
  | 'System Administrator'
  | 'HR Manager'
  | 'Payroll Officer'
  | 'Department Supervisor'
  | 'Employee';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  departmentId?: string;
  departmentName?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  location: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  employeeCount: number;
  description?: string;
  createdAt: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
  description?: string;
}

export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated' | 'Suspended';
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Probation';

export interface BankAccountDetails {
  bankName: string;
  branchName: string;
  accountNumber: string; // Stored securely; masked for display
  routingNumber: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. "EMP-1001"
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  nid: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  supervisorId?: string;
  supervisorName?: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  bankDetails: BankAccountDetails;
  emergencyContact: EmergencyContact;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  specialAllowance: number;
  taxDeductionRate: number; // percentage, e.g. 10%
  providentFundRate: number; // percentage, e.g. 7.5%
  grossSalary: number;
  estimatedNetSalary: number;
  effectiveDate: string;
  status: 'Active' | 'Archived';
  revisionNote?: string;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Half-Day' | 'Absent';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // e.g. "09:05 AM"
  checkOutTime: string | null; // e.g. "05:30 PM"
  workingHours: number; // decimal hours
  overtimeHours: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: 'Casual' | 'Medical' | 'Earned';
  annualQuota: number;
  isPaid: boolean;
  description: string;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBySupervisorDate?: string;
  approvedByHrDate?: string;
  supervisorComment?: string;
  hrComment?: string;
}

export type PayrollStatus = 'Draft' | 'Processing' | 'Approved' | 'Disbursed';

export interface PayrollComponentDetail {
  id: string;
  name: string;
  type: 'Earning' | 'Deduction';
  amount: number;
  isTaxable: boolean;
}

export interface Payroll {
  id: string;
  payrollPeriod: string; // e.g. "2026-09"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationTitle: string;
  bankAccountMasked: string;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  basicSalary: number;
  allowancesTotal: number;
  grossSalary: number;
  deductionsTotal: number;
  taxDeducted: number;
  providentFundDeducted: number;
  netSalary: number;
  components: PayrollComponentDetail[];
  status: PayrollStatus;
  processedAt: string;
  approvedAt?: string;
  disbursementReference?: string;
}

export type DisbursementStatus = 'Pending' | 'Processing' | 'Successful' | 'Failed';

export interface Disbursement {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  amount: number;
  period: string; // e.g. "2026-09"
  paymentMethod: 'Bank Transfer' | 'BEFTN' | 'Cheque' | 'Cash';
  bankName: string;
  maskedAccountNumber: string;
  transactionReference: string;
  disbursementDate: string;
  status: DisbursementStatus;
  failureReason?: string;
}

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  tableName: string;
  operation: AuditOperation;
  recordId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  ipAddress: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  description: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: 'payroll' | 'leave' | 'attendance' | 'security' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Pagination & API Response Contracts
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}
