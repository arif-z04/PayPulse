import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  new: 'Create New',
  edit: 'Edit Details',
  departments: 'Departments',
  designations: 'Designations',
  attendance: 'Attendance',
  leave: 'Leave Management',
  requests: 'Leave Requests',
  types: 'Leave Types',
  allocations: 'Allocations',
  salary: 'Salary Structures',
  payroll: 'Payroll',
  payslip: 'Payslip',
  disbursements: 'Disbursements',
  reports: 'Reports',
  overtime: 'Overtime Analysis',
  tax: 'Tax & Provident Fund',
  audit: 'System Audit Logs',
  settings: 'System Settings',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-5" aria-label="Breadcrumb">
      <Link to="/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[value] || (value.startsWith('emp-') || value.startsWith('pay-') ? `#${value}` : value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 capitalize">{label}</span>
            ) : (
              <Link to={to} className="hover:text-slate-700 transition-colors capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
