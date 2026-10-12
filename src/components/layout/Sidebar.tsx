import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  CalendarCheck2,
  CalendarDays,
  FileSpreadsheet,
  Coins,
  Send,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: string[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationGroups: NavGroup[] = [
    {
      group: 'Core',
      items: [
        {
          name: 'Dashboard',
          href: ROUTES.DASHBOARD,
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Organization',
      items: [
        {
          name: 'Employees',
          href: ROUTES.EMPLOYEES,
          icon: <Users className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'HR Manager'],
        },
        {
          name: 'Departments',
          href: ROUTES.DEPARTMENTS,
          icon: <Building2 className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'HR Manager', 'Department Supervisor'],
        },
        {
          name: 'Designations',
          href: ROUTES.DESIGNATIONS,
          icon: <Award className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'HR Manager'],
        },
      ],
    },
    {
      group: 'Workforce',
      items: [
        {
          name: 'Attendance',
          href: ROUTES.ATTENDANCE,
          icon: <CalendarCheck2 className="w-4 h-4" />,
        },
        {
          name: 'Leave Management',
          href: ROUTES.LEAVE,
          icon: <CalendarDays className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Compensation',
      items: [
        {
          name: 'Salary Structures',
          href: ROUTES.SALARY,
          icon: <Coins className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'HR Manager', 'Payroll Officer'],
        },
        {
          name: 'Payroll Processing',
          href: ROUTES.PAYROLL,
          icon: <FileSpreadsheet className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'Payroll Officer'],
        },
        {
          name: 'My Payslips',
          href: user?.employeeId ? ROUTES.PAYROLL_EMPLOYEE(user.employeeId) : ROUTES.PAYROLL,
          icon: <CreditCard className="w-4 h-4" />,
          allowedRoles: ['Employee', 'Department Supervisor'],
        },
        {
          name: 'Disbursements',
          href: ROUTES.DISBURSEMENTS,
          icon: <Send className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'Payroll Officer'],
        },
      ],
    },
    {
      group: 'Analytics & Compliance',
      items: [
        {
          name: 'Reports & Analytics',
          href: ROUTES.REPORTS,
          icon: <BarChart3 className="w-4 h-4" />,
          allowedRoles: ['System Administrator', 'HR Manager', 'Payroll Officer', 'Department Supervisor'],
        },
        {
          name: 'System Audit Logs',
          href: ROUTES.AUDIT,
          icon: <ShieldCheck className="w-4 h-4" />,
          allowedRoles: ['System Administrator'],
        },
        {
          name: 'System Settings',
          href: ROUTES.SETTINGS,
          icon: <Settings className="w-4 h-4" />,
          allowedRoles: ['System Administrator'],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wide">
              PP
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">PayPulse</span>
              <span className="text-[10px] block text-brand-400 font-semibold tracking-wider uppercase -mt-0.5">
                Enterprise
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.allowedRoles) return true;
              return user && item.allowedRoles.includes(user.role);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group}>
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.group}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      item.href === ROUTES.DASHBOARD
                        ? location.pathname === ROUTES.DASHBOARD
                        : location.pathname.startsWith(item.href);

                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Current Role Footer Banner */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/80 rounded-lg p-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-700/60 text-brand-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-brand-400 font-medium truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
