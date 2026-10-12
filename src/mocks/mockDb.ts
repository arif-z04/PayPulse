import {
  Department,
  Designation,
  Employee,
  SalaryStructure,
  AttendanceRecord,
  LeaveType,
  LeaveAllocation,
  LeaveRequest,
  Payroll,
  Disbursement,
  AuditLog,
  User,
  SystemNotification,
  PaginatedResponse,
} from '@/types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_LEAVE_TYPES,
  INITIAL_LEAVE_ALLOCATIONS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_DISBURSEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'paypulse_users',
  DEPARTMENTS: 'paypulse_departments',
  DESIGNATIONS: 'paypulse_designations',
  EMPLOYEES: 'paypulse_employees',
  SALARIES: 'paypulse_salaries',
  ATTENDANCE: 'paypulse_attendance',
  LEAVE_TYPES: 'paypulse_leave_types',
  LEAVE_ALLOCATIONS: 'paypulse_leave_allocations',
  LEAVE_REQUESTS: 'paypulse_leave_requests',
  PAYROLL: 'paypulse_payroll',
  DISBURSEMENTS: 'paypulse_disbursements',
  AUDIT_LOGS: 'paypulse_audit_logs',
  NOTIFICATIONS: 'paypulse_notifications',
};

// Simulate asynchronous network roundtrip
export const delay = (ms: number = 150): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getStored<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore local storage quota exceptions in restricted modes
  }
}

export const mockDb = {
  // Reset all data to initial defaults
  resetAll: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.DESIGNATIONS, JSON.stringify(INITIAL_DESIGNATIONS));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify(INITIAL_SALARY_STRUCTURES));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.LEAVE_TYPES, JSON.stringify(INITIAL_LEAVE_TYPES));
    localStorage.setItem(STORAGE_KEYS.LEAVE_ALLOCATIONS, JSON.stringify(INITIAL_LEAVE_ALLOCATIONS));
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(INITIAL_LEAVE_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(INITIAL_PAYROLL));
    localStorage.setItem(STORAGE_KEYS.DISBURSEMENTS, JSON.stringify(INITIAL_DISBURSEMENTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  },

  // Users
  getUsers: (): User[] => getStored<User>(STORAGE_KEYS.USERS, INITIAL_USERS),

  // Departments
  getDepartments: (): Department[] =>
    getStored<Department>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS),
  saveDepartments: (data: Department[]) => setStored(STORAGE_KEYS.DEPARTMENTS, data),

  // Designations
  getDesignations: (): Designation[] =>
    getStored<Designation>(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS),
  saveDesignations: (data: Designation[]) => setStored(STORAGE_KEYS.DESIGNATIONS, data),

  // Employees
  getEmployees: (): Employee[] =>
    getStored<Employee>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
  saveEmployees: (data: Employee[]) => setStored(STORAGE_KEYS.EMPLOYEES, data),

  // Salaries
  getSalaries: (): SalaryStructure[] =>
    getStored<SalaryStructure>(STORAGE_KEYS.SALARIES, INITIAL_SALARY_STRUCTURES),
  saveSalaries: (data: SalaryStructure[]) => setStored(STORAGE_KEYS.SALARIES, data),

  // Attendance
  getAttendance: (): AttendanceRecord[] =>
    getStored<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  saveAttendance: (data: AttendanceRecord[]) => setStored(STORAGE_KEYS.ATTENDANCE, data),

  // Leave
  getLeaveTypes: (): LeaveType[] =>
    getStored<LeaveType>(STORAGE_KEYS.LEAVE_TYPES, INITIAL_LEAVE_TYPES),
  getLeaveAllocations: (): LeaveAllocation[] =>
    getStored<LeaveAllocation>(STORAGE_KEYS.LEAVE_ALLOCATIONS, INITIAL_LEAVE_ALLOCATIONS),
  saveLeaveAllocations: (data: LeaveAllocation[]) => setStored(STORAGE_KEYS.LEAVE_ALLOCATIONS, data),
  getLeaveRequests: (): LeaveRequest[] =>
    getStored<LeaveRequest>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS),
  saveLeaveRequests: (data: LeaveRequest[]) => setStored(STORAGE_KEYS.LEAVE_REQUESTS, data),

  // Payroll
  getPayroll: (): Payroll[] =>
    getStored<Payroll>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL),
  savePayroll: (data: Payroll[]) => setStored(STORAGE_KEYS.PAYROLL, data),

  // Disbursements
  getDisbursements: (): Disbursement[] =>
    getStored<Disbursement>(STORAGE_KEYS.DISBURSEMENTS, INITIAL_DISBURSEMENTS),
  saveDisbursements: (data: Disbursement[]) => setStored(STORAGE_KEYS.DISBURSEMENTS, data),

  // Audit Logs
  getAuditLogs: (): AuditLog[] =>
    getStored<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = getStored<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  },

  // Notifications
  getNotifications: (): SystemNotification[] =>
    getStored<SystemNotification>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (data: SystemNotification[]) => setStored(STORAGE_KEYS.NOTIFICATIONS, data),
};

// Paginate helper
export function paginateArray<T>(items: T[], page: number = 1, pageSize: number = 10): PaginatedResponse<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: pageItems,
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}
