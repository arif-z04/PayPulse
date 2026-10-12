import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  PlaneTakeoff,
  CalendarDays,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
import { leaveService } from '@/services/api/leaveService';
import { attendanceService } from '@/services/api/attendanceService';
import { Department, Employee, LeaveRequest } from '@/types';

export const HrDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [empRes, deptRes, leaveRes, attSum] = await Promise.all([
          employeeService.getEmployees({ pageSize: 50 }),
          departmentService.getDepartments(),
          leaveService.getLeaveRequests({ status: 'Pending' }),
          attendanceService.getAttendanceSummary(),
        ]);
        setEmployees(empRes.items);
        setDepartments(deptRes);
        setPendingLeaves(leaveRes.items);
        setAttendanceRate(attSum.attendanceRate);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const onLeaveEmployees = employees.filter((e) => e.status === 'On Leave').length;
  const newHires = employees.filter((e) => e.dateOfJoining.startsWith('2024') || e.dateOfJoining.startsWith('2025')).length;

  const statusDistribution = [
    { name: 'Active', value: employees.filter((e) => e.status === 'Active').length, color: '#10b981' },
    { name: 'On Leave', value: onLeaveEmployees, color: '#0ea5e9' },
    { name: 'Probation', value: employees.filter((e) => e.employmentType === 'Probation').length || 1, color: '#f59e0b' },
  ];

  const deptData = departments.map((d) => ({
    name: d.code,
    fullName: d.name,
    count: d.employeeCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HR & Talent Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Workforce distribution, leaves, and talent metrics</p>
        </div>
        <Link
          to="/employees/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Employee Onboarding</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Headcount"
          value={employees.length}
          subtitle="Across 5 corporate departments"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Recent Onboardings"
          value={newHires}
          subtitle="Probation & new staff"
          icon={<UserCheck className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Staff On Leave"
          value={onLeaveEmployees}
          subtitle="Approved leave leaves"
          icon={<PlaneTakeoff className="w-5 h-5" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <StatCard
          title="Pending Leave Approvals"
          value={pendingLeaves.length}
          subtitle="Action required by HR"
          icon={<CalendarDays className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Workforce Distribution</h3>
              <p className="text-xs text-slate-500">Active personnel by business team</p>
            </div>
            <Badge variant="brand">Attendance: {attendanceRate}% Today</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [`${val} Members`, 'Headcount']}
                  labelFormatter={(code) => deptData.find((d) => d.name === code)?.fullName || code}
                />
                <Bar dataKey="count" fill="#0270c5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Employment Status Ratio</h3>
            <p className="text-xs text-slate-500 mb-4">Active vs On-Leave distribution</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
