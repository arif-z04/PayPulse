import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  FileSpreadsheet,
  Clock,
  CalendarCheck2,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { attendanceService } from '@/services/api/attendanceService';
import { leaveService } from '@/services/api/leaveService';
import { payrollService } from '@/services/api/payrollService';
import { formatCurrency } from '@/utils/formatters';
import { AttendanceRecord, LeaveAllocation, LeaveRequest, Payroll } from '@/types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocation[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [latestPayroll, setLatestPayroll] = useState<Payroll | null>(null);
  const [isPunching, setIsPunching] = useState(false);

  const empId = user?.employeeId || 'emp-5';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, allocRes, leaveRes, payRes] = await Promise.all([
        attendanceService.getAttendance({ employeeId: empId, pageSize: 5 }),
        leaveService.getLeaveAllocations(empId),
        leaveService.getLeaveRequests({ employeeId: empId }),
        payrollService.getPayrolls({ employeeId: empId }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attRes.items.find((a) => a.date === today) || attRes.items[0] || null;
      setTodayAttendance(todayRecord);
      setLeaveAllocations(allocRes);
      setMyLeaves(leaveRes.items);
      setLatestPayroll(payRes.items[0] || null);
    } finally {
      setIsLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePunchIn = async () => {
    setIsPunching(true);
    try {
      const res = await attendanceService.checkIn(empId);
      setTodayAttendance(res);
      success(`Punch-in recorded at ${res.checkInTime}`);
    } catch {
      error('Failed to register check-in.');
    } finally {
      setIsPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setIsPunching(true);
    try {
      const res = await attendanceService.checkOut(empId);
      setTodayAttendance(res);
      success(`Punch-out recorded at ${res.checkOutTime}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to register check-out.';
      error(msg);
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalLeaveRemaining = leaveAllocations.reduce((sum, a) => sum + a.remainingDays, 0);

  return (
    <div className="space-y-6">
      {/* Employee Greeting & Web Check-in Card */}
      <div className="bg-gradient-to-r from-brand-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Employee Self-Service Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Department: {user?.departmentName || 'Software Engineering'} • Role: {user?.role}
          </p>
        </div>

        {/* Biometric / Web punch controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-semibold">Today&apos;s Status</p>
            <p className="text-xs font-bold text-white">
              {todayAttendance?.checkInTime ? `In at ${todayAttendance.checkInTime}` : 'Not checked in'}
            </p>
          </div>
          {!todayAttendance?.checkInTime ? (
            <button
              type="button"
              onClick={handlePunchIn}
              disabled={isPunching}
              className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isPunching ? 'Punching...' : 'Web Check-In'}
            </button>
          ) : !todayAttendance?.checkOutTime ? (
            <button
              type="button"
              onClick={handlePunchOut}
              disabled={isPunching}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isPunching ? 'Punching...' : 'Check-Out'}
            </button>
          ) : (
            <Badge variant="success">Completed ({todayAttendance.workingHours}h)</Badge>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value="96.2%"
          subtitle="21 of 22 standard shifts logged"
          icon={<CalendarCheck2 className="w-5 h-5" />}
        />
        <StatCard
          title="Leave Days Balance"
          value={`${totalLeaveRemaining} Days`}
          subtitle="Annual quota remaining"
          icon={<CalendarDays className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Latest Net Salary"
          value={formatCurrency(latestPayroll?.netSalary || 107315)}
          subtitle={`${latestPayroll?.payrollPeriod || '2026-09'} cycle`}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Active Requests"
          value={myLeaves.filter((l) => l.status === 'Pending').length}
          subtitle="Submitted applications"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Two Column Layout: Leave Quotas & Recent Payslip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balances Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Annual Leave Quota Status</h3>
              <Link to="/leave" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Apply for Leave
              </Link>
            </div>
            <div className="space-y-3">
              {leaveAllocations.map((alloc) => {
                const pct = Math.round((alloc.usedDays / alloc.totalDays) * 100);
                return (
                  <div key={alloc.id} className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800">{alloc.leaveTypeName} Leave</span>
                      <span className="text-slate-500">
                        {alloc.usedDays} used / <span className="font-semibold text-slate-800">{alloc.remainingDays} remaining</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fiscal year: 2026</span>
            <Link to="/leave" className="font-semibold text-brand-600 flex items-center gap-1">
              <span>View full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Latest Payslip Quick Overview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Latest Salary Advice</h3>
              <Badge variant="success">Settled via BEFTN</Badge>
            </div>
            {latestPayroll ? (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-brand-50/50 border border-brand-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Net Disbursed Take-Home</span>
                    <span className="text-lg font-bold text-brand-900">
                      {formatCurrency(latestPayroll.netSalary)}
                    </span>
                  </div>
                  <Link
                    to={`/payroll/${latestPayroll.id}/payslip`}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                  >
                    View Official Payslip
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Gross Salary</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(latestPayroll.grossSalary)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Total Deductions</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(latestPayroll.deductionsTotal)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Payment Reference: <span className="font-mono text-slate-600">{latestPayroll.disbursementReference || 'TXN-202609-005'}</span>
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No payroll records generated yet.</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Confidential employee document</span>
            <Link to="/attendance" className="font-semibold text-brand-600 flex items-center gap-1">
              <span>My attendance log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
