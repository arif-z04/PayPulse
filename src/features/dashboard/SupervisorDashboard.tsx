import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/services/api/employeeService';
import { attendanceService } from '@/services/api/attendanceService';
import { leaveService } from '@/services/api/leaveService';
import { AttendanceRecord, Employee, LeaveRequest } from '@/types';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [teamEmployees, setTeamEmployees] = useState<Employee[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [empRes, attRes, leaveRes] = await Promise.all([
          employeeService.getEmployees({ departmentId: user?.departmentId, pageSize: 50 }),
          attendanceService.getAttendance({ departmentName: user?.departmentName || 'Software Engineering' }),
          leaveService.getLeaveRequests({ status: 'Pending' }),
        ]);
        setTeamEmployees(empRes.items);
        setTeamAttendance(attRes.items);
        setPendingLeaves(leaveRes.items.filter((l) => l.departmentName === (user?.departmentName || 'Software Engineering')));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

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

  const presentCount = teamAttendance.filter((a) => a.status === 'Present').length;
  const lateCount = teamAttendance.filter((a) => a.status === 'Late').length;
  const absentCount = teamAttendance.filter((a) => a.status === 'Absent').length;
  const totalOvertime = teamAttendance.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Department Operations
            </span>
            <Badge variant="purple">Supervisor: {user?.fullName}</Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {user?.departmentName || 'Software Engineering'} Team Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shift attendance, roster check-ins and subordinate leave requests
          </p>
        </div>
        <Link
          to="/leave/requests"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Review Team Leaves ({pendingLeaves.length})</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Staff Strength"
          value={teamEmployees.length || 6}
          subtitle="Engineers & Specialists"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Present Today"
          value={presentCount}
          subtitle="Punctual on duty"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Late / Incomplete Shifts"
          value={lateCount}
          subtitle={`${absentCount} absent staff`}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Logged Overtime"
          value={`${totalOvertime.toFixed(1)} hrs`}
          subtitle="Cumulative department overtime"
          icon={<UserX className="w-5 h-5" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Roster Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Today&apos;s Team Attendance Log</h3>
            <Link to="/attendance" className="text-xs font-semibold text-brand-600">
              Full Timesheet
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {teamAttendance.slice(0, 6).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.employeeName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    In: {item.checkInTime || '—'} • Out: {item.checkOutTime || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={item.status === 'Present' ? 'success' : item.status === 'Late' ? 'warning' : 'danger'} size="sm">
                    {item.status}
                  </Badge>
                  {item.overtimeHours > 0 && (
                    <p className="text-[10px] text-brand-600 font-medium mt-0.5">+{item.overtimeHours}h OT</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Subordinate Leaves */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h3>
              <Link to="/leave/requests" className="text-xs font-semibold text-brand-600">
                Action Center
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingLeaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No pending leave applications for your team.</div>
              ) : (
                pendingLeaves.map((l) => (
                  <div key={l.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{l.employeeName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{l.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{l.startDate} to {l.endDate}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="warning" size="sm">{l.totalDays} Days</Badge>
                      <Link
                        to="/leave/requests"
                        className="block mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Approve / Reject
                      </Link>
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
