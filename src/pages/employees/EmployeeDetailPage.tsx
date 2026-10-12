import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  User,
  CalendarCheck2,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import { Tabs, TabItem } from '@/components/common/Tabs';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { employeeService } from '@/services/api/employeeService';
import { salaryService } from '@/services/api/salaryService';
import { attendanceService } from '@/services/api/attendanceService';
import { leaveService } from '@/services/api/leaveService';
import { payrollService } from '@/services/api/payrollService';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '@/utils/formatters';
import { maskAccountNumber, maskNID } from '@/utils/security';
import {
  Employee,
  SalaryStructure,
  AttendanceRecord,
  LeaveAllocation,
  LeaveRequest,
  Payroll,
} from '@/types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<SalaryStructure | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocation[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const emp = await employeeService.getEmployeeById(id);
        setEmployee(emp);

        // Sub-data loads
        const [salRes, attRes, allocRes, reqRes, payRes] = await Promise.allSettled([
          salaryService.getSalaryByEmployeeId(id),
          attendanceService.getAttendance({ employeeId: id, pageSize: 15 }),
          leaveService.getLeaveAllocations(id),
          leaveService.getLeaveRequests({ employeeId: id }),
          payrollService.getPayrolls({ employeeId: id }),
        ]);

        if (salRes.status === 'fulfilled') setSalary(salRes.value);
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.items);
        if (allocRes.status === 'fulfilled') setLeaveAllocations(allocRes.value);
        if (reqRes.status === 'fulfilled') setLeaveRequests(reqRes.value.items);
        if (payRes.status === 'fulfilled') setPayrolls(payRes.value.items);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <ErrorState
        title="Employee Record Not Found"
        message="The requested employee record could not be retrieved from the directory."
        onRetry={() => navigate('/employees')}
      />
    );
  }

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'employment', label: 'Employment Details' },
    { id: 'organization', label: 'Organization & Hierarchy', icon: <Building2 className="w-4 h-4" /> },
    { id: 'salary', label: 'Compensation & Salary', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance Records', count: attendance.length, icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'leave', label: 'Leave & Balances', count: leaveRequests.length, icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'payroll', label: 'Historical Payslips', count: payrolls.length, icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl shadow-inner shrink-0">
            {employee.firstName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {employee.fullName}
              </h1>
              <Badge variant={getStatusBadgeVariant(employee.status)}>
                {employee.status}
              </Badge>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                {employee.employeeCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-700">{employee.designationTitle}</span>
              <span>•</span>
              <span className="text-slate-600">{employee.departmentName}</span>
              <span>•</span>
              <span className="text-slate-400">Joined {formatDate(employee.dateOfJoining)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Link
            to={`/employees/${employee.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 pt-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Personal Information
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Official Work Email</dt>
                    <dd className="font-medium text-slate-900 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {employee.email}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Direct Contact Phone</dt>
                    <dd className="font-medium text-slate-900 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {employee.phone}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">National ID (NID)</dt>
                    <dd className="font-mono text-slate-700">{maskNID(employee.nid)}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Date of Birth</dt>
                    <dd className="text-slate-800">{formatDate(employee.dateOfBirth)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Gender</dt>
                    <dd className="text-slate-800">{employee.gender}</dd>
                  </div>
                </dl>
              </div>

              {/* Residential & Emergency Contact */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Address & Emergency Contact
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500 mb-1">Residential Address</dt>
                    <dd className="font-medium text-slate-900 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{employee.address}</span>
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Emergency Contact</dt>
                    <dd className="font-semibold text-slate-900">{employee.emergencyContact?.name}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Relationship</dt>
                    <dd className="text-slate-800">{employee.emergencyContact?.relation}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Emergency Contact Phone</dt>
                    <dd className="font-medium text-slate-900">{employee.emergencyContact?.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT */}
          {activeTab === 'employment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Employment Terms
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Date of Joining</dt>
                    <dd className="font-medium text-slate-900">{formatDate(employee.dateOfJoining)}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Employment Type</dt>
                    <dd className="font-semibold text-brand-700">{employee.employmentType}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Current Status</dt>
                    <dd>
                      <Badge variant={getStatusBadgeVariant(employee.status)} size="sm">
                        {employee.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">System Creation Date</dt>
                    <dd className="text-slate-500">{formatDate(employee.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              {/* Bank Details with Masking & Toggle */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bank Account Details (Financial)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showFullAccount ? 'Mask Account' : 'Reveal Account'}</span>
                  </button>
                </div>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Bank Name</dt>
                    <dd className="font-semibold text-slate-900">{employee.bankDetails?.bankName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Branch Name</dt>
                    <dd className="text-slate-800">{employee.bankDetails?.branchName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Account Number</dt>
                    <dd className="font-mono text-slate-900 font-bold">
                      {showFullAccount
                        ? employee.bankDetails?.accountNumber
                        : maskAccountNumber(employee.bankDetails?.accountNumber)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Routing Number</dt>
                    <dd className="font-mono text-slate-700">{employee.bankDetails?.routingNumber}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* TAB 3: ORGANIZATION */}
          {activeTab === 'organization' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Department & Role
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Department</dt>
                    <dd className="font-semibold text-slate-900">{employee.departmentName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <dt className="text-slate-500">Designation Title</dt>
                    <dd className="font-semibold text-slate-900">{employee.designationTitle}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Direct Supervisor</dt>
                    <dd className="font-medium text-brand-700">
                      {employee.supervisorName || 'Executive Management (Direct)'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              {salary ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Current Salary Grade Structure</h3>
                      <p className="text-xs text-slate-500">
                        Effective from {formatDate(salary.effectiveDate)}
                      </p>
                    </div>
                    <Link
                      to={`/salary/${employee.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Adjust Structure</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500">Gross Monthly Salary</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {formatCurrency(salary.grossSalary)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500">Basic Salary</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {formatCurrency(salary.basicSalary)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] font-medium text-emerald-800">Estimated Net Payout</span>
                      <p className="text-xl font-bold text-emerald-900 mt-0.5">
                        {formatCurrency(salary.estimatedNetSalary)}
                      </p>
                    </div>
                  </div>

                  {/* Component breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                        Allowances Breakdown
                      </h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">House Rent Allowance</dt>
                          <dd className="font-medium text-slate-800">{formatCurrency(salary.houseRentAllowance)}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">Medical Allowance</dt>
                          <dd className="font-medium text-slate-800">{formatCurrency(salary.medicalAllowance)}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">Conveyance Allowance</dt>
                          <dd className="font-medium text-slate-800">{formatCurrency(salary.conveyanceAllowance)}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">Special Allowance</dt>
                          <dd className="font-medium text-slate-800">{formatCurrency(salary.specialAllowance)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                        Statutory Deductions
                      </h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">Income Tax Rate</dt>
                          <dd className="font-medium text-slate-800">{salary.taxDeductionRate}%</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">Provident Fund Contribution</dt>
                          <dd className="font-medium text-slate-800">{salary.providentFundRate}%</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No salary structure recorded for this employee.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
                <Link to="/attendance" className="text-xs font-semibold text-brand-600">
                  Full Timesheet
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Working Hours</th>
                      <th className="py-2.5 px-3">Overtime</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{att.date}</td>
                        <td className="py-2.5 px-3 text-slate-600">{att.checkInTime || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{att.checkOutTime || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{att.workingHours} hrs</td>
                        <td className="py-2.5 px-3 text-slate-700">{att.overtimeHours} hrs</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={att.status === 'Present' ? 'success' : att.status === 'Late' ? 'warning' : 'danger'} size="sm">
                            {att.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LEAVE */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              {/* Allocations */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Annual Leave Quotas (2026)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leaveAllocations.map((alloc) => (
                    <div key={alloc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">{alloc.leaveTypeName} Leave</p>
                      <div className="mt-2 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Remaining</span>
                        <span className="text-base font-bold text-brand-700">{alloc.remainingDays} Days</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>Used: {alloc.usedDays}d</span>
                        <span>Total: {alloc.totalDays}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Requests */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Leave History</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {leaveRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No leave requests found.</div>
                  ) : (
                    leaveRequests.map((req) => (
                      <div key={req.id} className="p-3.5 flex items-center justify-between text-xs gap-3 hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{req.leaveTypeName} Leave</span>
                            <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Pending' ? 'warning' : 'danger'} size="sm">
                              {req.status}
                            </Badge>
                          </div>
                          <p className="text-slate-500 mt-0.5">{req.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {req.startDate} to {req.endDate} ({req.totalDays} days)
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PAYROLL */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Historical Monthly Payroll Statements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Gross Salary</th>
                      <th className="py-2.5 px-3">Deductions</th>
                      <th className="py-2.5 px-3">Net Disbursed</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrolls.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{p.payrollPeriod}</td>
                        <td className="py-2.5 px-3 text-slate-700">{formatCurrency(p.grossSalary)}</td>
                        <td className="py-2.5 px-3 text-slate-700">{formatCurrency(p.deductionsTotal)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(p.netSalary)}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={p.status === 'Disbursed' ? 'success' : 'warning'} size="sm">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to={`/payroll/${p.id}/payslip`}
                            className="font-semibold text-brand-600 hover:text-brand-700"
                          >
                            View Payslip
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
