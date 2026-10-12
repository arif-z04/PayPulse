import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { HrDashboard } from '@/features/dashboard/HrDashboard';
import { PayrollDashboard } from '@/features/dashboard/PayrollDashboard';
import { SupervisorDashboard } from '@/features/dashboard/SupervisorDashboard';
import { EmployeeDashboard } from '@/features/dashboard/EmployeeDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'System Administrator':
      return <AdminDashboard />;
    case 'HR Manager':
      return <HrDashboard />;
    case 'Payroll Officer':
      return <PayrollDashboard />;
    case 'Department Supervisor':
      return <SupervisorDashboard />;
    case 'Employee':
      return <EmployeeDashboard />;
    default:
      return <AdminDashboard />;
  }
};
