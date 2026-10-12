import React, { useEffect, useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  CalendarDays,
  Send,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { employeeService } from '@/services/api/employeeService';
import { departmentService } from '@/services/api/departmentService';
import { payrollService } from '@/services/api/payrollService';
import { leaveService } from '@/services/api/leaveService';
import { auditService } from '@/services/api/auditService';
import { disbursementService } from '@/services/api/disbursementService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { AuditLog, Department, Employee, LeaveRequest, Payroll } from '@/types';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingDisbursementsCount, setPendingDisbursementsCount] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [empRes, deptRes, payRes, leaveRes, auditRes, disbRes] = await Promise.all([
          employeeService.getEmployees({ pageSize: 50 }),
          departmentService.getDepartments(),
          payrollService.getPayrolls({ pageSize: 50 }),
          leaveService.getLeaveRequests({ status: 'Pending' }),
          auditService.getAuditLogs({ pageSize: 6 }),
          disbursementService.getDisbursements({ status: 'Pending' }),
        ]);

        setEmployees(empRes.items);
        setDepartments(deptRes);
        setPayrolls(payRes.items);
        setPendingLeaves(leaveRes.items);
        setAuditLogs(auditRes.items);
        setPendingDisbursementsCount(disbRes.totalCount);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const latestPeriod = payrolls.length > 0 ? payrolls[0].payrollPeriod : '2026-08';
  const recentPayroll = payrolls.filter((p) => p.payrollPeriod === latestPeriod);
  const totalMonthlyExpense = recentPayroll.reduce((acc, p) => acc + p.netSalary, 0);

  // Department distribution chart data
  const deptChartData = departments.map((d) => ({
    name: d.code,
    fullName: d.name,
    employees: d.employeeCount,
  }));

  // Payroll Trend mock data
  const trendData = [
    { month: 'May 26', expense: 710000, employees: 10 },
    { month: 'Jun 26', expense: 710000, employees: 10 },
    { month: 'Jul 26', expense: 780000, employees: 11 },
    { month: 'Aug 26', expense: 780000, employees: 11 },
    { month: 'Sep 26', expense: totalMonthlyExpense || 820000, employees: employees.length },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            System Administration Overview
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">PayPulse Enterprise Controller</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live system telemetry across 5 organizational departments, compensation runs, biometric attendance, and security audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/payroll"
            className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Process Payroll</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={employees.length}
          subtitle={`${activeEmployees} active on duty`}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+9.1% headcount', isPositive: true }}
        />
        <StatCard
          title="Monthly Payroll Expense"
          value={formatCurrency(totalMonthlyExpense || 785400)}
          subtitle="September 2026 cycle"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Leave Applications"
          value={pendingLeaves.length}
          subtitle="Awaiting supervisor / HR review"
          icon={<CalendarDays className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Pending Disbursements"
          value={pendingDisbursementsCount}
          subtitle="Awaiting BEFTN banking batch"
          icon={<Send className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Expense Trend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payroll Expenditure Trend</h3>
              <p className="text-xs text-slate-500">Historical net disbursement over preceding cycles</p>
            </div>
            <Badge variant="brand">2026 Financial Year</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8ce6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0e8ce6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatCurrency(Number(val)), 'Net Payroll']}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#0270c5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount by Department */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Workforce Distribution</h3>
              <p className="text-xs text-slate-500">Allocated headcount per organizational unit</p>
            </div>
            <Link to="/departments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [`${val} Members`, 'Staff Count']}
                  labelFormatter={(code) => deptChartData.find((d) => d.name === code)?.fullName || code}
                />
                <Bar dataKey="employees" fill="#03599f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent System Audit Activity & Pending Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Audit Trail */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent System Audit Log</h3>
              </div>
              <Link to="/audit" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View Full Audit
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{log.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {log.userName} ({log.userRole}) • {log.tableName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={log.operation === 'INSERT' ? 'success' : log.operation === 'UPDATE' ? 'info' : 'danger'} size="sm">
                      {log.operation}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h3>
              </div>
              <Link to="/leave/requests" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Leave Desk
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingLeaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">All leave requests processed!</div>
              ) : (
                pendingLeaves.map((lr) => (
                  <div key={lr.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{lr.employeeName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{lr.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="warning" size="sm">{lr.totalDays} Days ({lr.leaveTypeName})</Badge>
                      <p className="text-[10px] text-slate-400 mt-1">{lr.startDate} to {lr.endDate}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
