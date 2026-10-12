import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { EmployeeFormPage } from '@/pages/employees/EmployeeFormPage';
import { DepartmentListPage } from '@/pages/departments/DepartmentListPage';
import { DepartmentDetailPage } from '@/pages/departments/DepartmentDetailPage';
import { DesignationListPage } from '@/pages/designations/DesignationListPage';
import { AttendancePage } from '@/pages/attendance/AttendancePage';
import { LeavePage } from '@/pages/leave/LeavePage';
import { SalaryListPage } from '@/pages/salary/SalaryListPage';
import { SalaryEditPage } from '@/pages/salary/SalaryEditPage';
import { PayrollListPage } from '@/pages/payroll/PayrollListPage';
import { PayrollDetailPage } from '@/pages/payroll/PayrollDetailPage';
import { PayslipPage } from '@/pages/payroll/PayslipPage';
import { DisbursementListPage } from '@/pages/disbursements/DisbursementListPage';
import { ReportsHubPage } from '@/pages/reports/ReportsHubPage';
import { PayrollCostReportPage } from '@/pages/reports/PayrollCostReportPage';
import { AttendanceReportPage } from '@/pages/reports/AttendanceReportPage';
import { LeaveUtilizationReportPage } from '@/pages/reports/LeaveUtilizationReportPage';
import { OvertimeReportPage } from '@/pages/reports/OvertimeReportPage';
import { TaxProvidentReportPage } from '@/pages/reports/TaxProvidentReportPage';
import { SalaryBandComplianceReportPage } from '@/pages/reports/SalaryBandComplianceReportPage';
import { AuditLogPage } from '@/pages/audit/AuditLogPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ROLE_PERMISSIONS } from '@/constants/roles';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },

      // Employees
      {
        path: 'employees',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_EMPLOYEES}>
            <EmployeeListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees/new',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_EMPLOYEES}>
            <EmployeeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees/:id',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'employees/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_EMPLOYEES}>
            <EmployeeFormPage />
          </ProtectedRoute>
        ),
      },

      // Organization
      {
        path: 'departments',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_ORGANIZATION}>
            <DepartmentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'departments/:id',
        element: <DepartmentDetailPage />,
      },
      {
        path: 'designations',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_ORGANIZATION}>
            <DesignationListPage />
          </ProtectedRoute>
        ),
      },

      // Attendance
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'attendance/:employeeId',
        element: <AttendancePage />,
      },

      // Leave
      {
        path: 'leave',
        element: <LeavePage />,
      },
      {
        path: 'leave/requests',
        element: <LeavePage />,
      },
      {
        path: 'leave/types',
        element: <LeavePage />,
      },
      {
        path: 'leave/allocations',
        element: <LeavePage />,
      },

      // Compensation
      {
        path: 'salary',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_SALARY}>
            <SalaryListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'salary/:employeeId',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_SALARY}>
            <SalaryListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'salary/:employeeId/edit',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_SALARY}>
            <SalaryEditPage />
          </ProtectedRoute>
        ),
      },

      // Payroll
      {
        path: 'payroll',
        element: <PayrollListPage />,
      },
      {
        path: 'payroll/employee/:employeeId',
        element: <PayrollListPage />,
      },
      {
        path: 'payroll/:id',
        element: <PayrollDetailPage />,
      },
      {
        path: 'payroll/:id/payslip',
        element: <PayslipPage />,
      },

      // Disbursements
      {
        path: 'disbursements',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_MANAGE_DISBURSEMENTS}>
            <DisbursementListPage />
          </ProtectedRoute>
        ),
      },

      // Reports
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <ReportsHubPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/payroll',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <PayrollCostReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/attendance',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <AttendanceReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/leave',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <LeaveUtilizationReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/overtime',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <OvertimeReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/tax',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <TaxProvidentReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/disbursement',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <DisbursementListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/audit',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_REPORTS}>
            <SalaryBandComplianceReportPage />
          </ProtectedRoute>
        ),
      },

      // System Admin Only
      {
        path: 'audit',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_AUDIT_LOGS}>
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={ROLE_PERMISSIONS.CAN_VIEW_SETTINGS}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
