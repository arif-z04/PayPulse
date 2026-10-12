export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',

  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_NEW: '/employees/new',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}`,
  EMPLOYEE_EDIT: (id: string) => `/employees/${id}/edit`,

  // Organization
  DEPARTMENTS: '/departments',
  DEPARTMENT_DETAIL: (id: string) => `/departments/${id}`,
  DESIGNATIONS: '/designations',

  // Workforce
  ATTENDANCE: '/attendance',
  ATTENDANCE_EMPLOYEE: (employeeId: string) => `/attendance/${employeeId}`,
  LEAVE: '/leave',
  LEAVE_REQUESTS: '/leave/requests',
  LEAVE_TYPES: '/leave/types',
  LEAVE_ALLOCATIONS: '/leave/allocations',

  // Compensation
  SALARY: '/salary',
  SALARY_EMPLOYEE: (employeeId: string) => `/salary/${employeeId}`,
  SALARY_EDIT: (employeeId: string) => `/salary/${employeeId}/edit`,
  PAYROLL: '/payroll',
  PAYROLL_DETAIL: (id: string) => `/payroll/${id}`,
  PAYROLL_PAYSLIP: (id: string) => `/payroll/${id}/payslip`,
  PAYROLL_EMPLOYEE: (employeeId: string) => `/payroll/employee/${employeeId}`,
  DISBURSEMENTS: '/disbursements',
  DISBURSEMENT_DETAIL: (id: string) => `/disbursements/${id}`,

  // Reporting
  REPORTS: '/reports',
  REPORTS_PAYROLL: '/reports/payroll',
  REPORTS_ATTENDANCE: '/reports/attendance',
  REPORTS_LEAVE: '/reports/leave',
  REPORTS_OVERTIME: '/reports/overtime',
  REPORTS_TAX: '/reports/tax',
  REPORTS_DISBURSEMENT: '/reports/disbursement',
  REPORTS_AUDIT: '/reports/audit',

  // Administration
  AUDIT: '/audit',
  AUDIT_DETAIL: (id: string) => `/audit/${id}`,
  SETTINGS: '/settings',
  UNAUTHORIZED: '/unauthorized',
} as const;
