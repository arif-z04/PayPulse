import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  FilterX,
  Play,
  Square,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { getStatusBadgeVariant } from '@/utils/formatters';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, AttendanceSummary } from '@/services/api/attendanceService';
import { departmentService } from '@/services/api/departmentService';
import { AttendanceRecord, AttendanceStatus, Department } from '@/types';

export const AttendancePage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId?: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('2026-10-06');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, sumRes, deptRes] = await Promise.all([
        attendanceService.getAttendance({
          date: employeeId ? undefined : selectedDate || undefined,
          employeeId: employeeId || (user?.role === 'Employee' ? user.employeeId : undefined),
          departmentName: selectedDept || undefined,
          status: selectedStatus || undefined,
          search: search || undefined,
          page,
          pageSize: 10,
        }),
        attendanceService.getAttendanceSummary(selectedDate),
        departmentService.getDepartments(),
      ]);

      setRecords(attRes.items);
      setTotalPages(attRes.totalPages);
      setTotalCount(attRes.totalCount);
      setSummary(sumRes);
      setDepartments(deptRes);
    } catch {
      toastError('Failed to load attendance logs.');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, selectedDate, user, selectedDept, selectedStatus, search, page, toastError]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePunchIn = async () => {
    const targetId = user?.employeeId || 'emp-5';
    try {
      await attendanceService.checkIn(targetId);
      success('Check-in logged successfully.');
      fetchAttendance();
    } catch {
      toastError('Failed to record check-in.');
    }
  };

  const handlePunchOut = async () => {
    const targetId = user?.employeeId || 'emp-5';
    try {
      await attendanceService.checkOut(targetId);
      success('Check-out logged successfully.');
      fetchAttendance();
    } catch {
      toastError('Failed to record check-out.');
    }
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Shift Date',
      sortable: true,
      width: '120px',
      render: (r) => <span className="font-medium text-slate-800 text-xs">{r.date}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee Name & Code',
      sortable: true,
      render: (r) => (
        <div>
          <Link
            to={`/employees/${r.employeeId}`}
            className="font-semibold text-slate-900 hover:text-brand-600 block truncate"
          >
            {r.employeeName}
          </Link>
          <span className="font-mono text-[11px] text-slate-400 block">{r.employeeCode}</span>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-slate-600 truncate">{r.departmentName}</span>
      ),
    },
    {
      key: 'checkInTime',
      header: 'Check-In',
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">
          {r.checkInTime || <span className="text-slate-300">—</span>}
        </span>
      ),
    },
    {
      key: 'checkOutTime',
      header: 'Check-Out',
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">
          {r.checkOutTime || <span className="text-slate-300">—</span>}
        </span>
      ),
    },
    {
      key: 'workingHours',
      header: 'Hours',
      align: 'center',
      render: (r) => (
        <span className="text-xs font-semibold text-slate-800">
          {r.workingHours > 0 ? `${r.workingHours} hrs` : '—'}
        </span>
      ),
    },
    {
      key: 'overtimeHours',
      header: 'Overtime',
      align: 'center',
      render: (r) =>
        r.overtimeHours > 0 ? (
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
            +{r.overtimeHours} hrs
          </span>
        ) : (
          <span className="text-slate-300 text-xs">0</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      render: (r) => (
        <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'remarks',
      header: 'Audit Note',
      render: (r) => (
        <span className="text-[11px] text-slate-500 truncate block max-w-xs">{r.remarks || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {employeeId ? 'Personal Attendance History' : 'Attendance & Shift Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Biometric logs, daily shift tracking, punctuality ratios and overtime hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePunchIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Web Punch-In</span>
          </button>
          <button
            type="button"
            onClick={handlePunchOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Punch-Out</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Scheduled"
            value={summary.total}
            icon={<CalendarCheck2 className="w-4 h-4" />}
          />
          <StatCard
            title="Present"
            value={summary.present}
            icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
            iconBgColor="bg-emerald-50"
          />
          <StatCard
            title="Late Arrival"
            value={summary.late}
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            iconBgColor="bg-amber-50"
          />
          <StatCard
            title="Half-Day"
            value={summary.halfDay}
            icon={<Clock className="w-4 h-4 text-sky-600" />}
            iconBgColor="bg-sky-50"
          />
          <StatCard
            title="Absent"
            value={summary.absent}
            icon={<UserX className="w-4 h-4 text-rose-600" />}
            iconBgColor="bg-rose-50"
          />
          <StatCard
            title="Punctuality"
            value={`${summary.attendanceRate}%`}
            iconBgColor="bg-brand-50"
            iconColor="text-brand-600"
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as AttendanceStatus);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Half-Day">Half-Day</option>
          <option value="Absent">Absent</option>
        </select>

        {(selectedDept || selectedStatus || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedDept('');
              setSelectedStatus('');
              setSearch('');
              setPage(1);
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 ml-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
        search={{
          value: search,
          onChange: (val) => {
            setSearch(val);
            setPage(1);
          },
          placeholder: 'Search employee name or code...',
        }}
        emptyTitle="No Attendance Records"
        emptyDescription="No attendance punch logs found for the selected date and filters."
      />
    </div>
  );
};
