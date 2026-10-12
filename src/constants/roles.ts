import { UserRole } from '@/types';

export const USER_ROLES: Record<string, UserRole> = {
  ADMIN: 'System Administrator',
  HR: 'HR Manager',
  PAYROLL: 'Payroll Officer',
  SUPERVISOR: 'Department Supervisor',
  EMPLOYEE: 'Employee',
};

export const ALL_ROLES: UserRole[] = [
  'System Administrator',
  'HR Manager',
  'Payroll Officer',
  'Department Supervisor',
  'Employee',
];

export const ROLE_PERMISSIONS = {
  CAN_MANAGE_USERS: ['System Administrator'] as UserRole[],
  CAN_VIEW_AUDIT_LOGS: ['System Administrator'] as UserRole[],
  CAN_MANAGE_EMPLOYEES: ['System Administrator', 'HR Manager'] as UserRole[],
  CAN_MANAGE_ORGANIZATION: ['System Administrator', 'HR Manager'] as UserRole[],
  CAN_VIEW_ALL_ATTENDANCE: ['System Administrator', 'HR Manager', 'Department Supervisor'] as UserRole[],
  CAN_MANAGE_LEAVE: ['System Administrator', 'HR Manager', 'Department Supervisor'] as UserRole[],
  CAN_APPROVE_LEAVE: ['System Administrator', 'HR Manager', 'Department Supervisor'] as UserRole[],
  CAN_MANAGE_SALARY: ['System Administrator', 'Payroll Officer', 'HR Manager'] as UserRole[],
  CAN_MANAGE_PAYROLL: ['System Administrator', 'Payroll Officer'] as UserRole[],
  CAN_MANAGE_DISBURSEMENTS: ['System Administrator', 'Payroll Officer'] as UserRole[],
  CAN_VIEW_REPORTS: ['System Administrator', 'HR Manager', 'Payroll Officer', 'Department Supervisor'] as UserRole[],
  CAN_VIEW_SETTINGS: ['System Administrator'] as UserRole[],
};
