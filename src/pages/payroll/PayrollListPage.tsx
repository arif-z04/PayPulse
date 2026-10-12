import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Eye,
  Calendar,
  FilterX,
  Printer,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { payrollService } from '@/services/api/payrollService';
import { formatCurrency, getStatusBadgeVariant } from '@/utils/formatters';
import { Payroll, PayrollStatus } from '@/types';

export const PayrollListPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId?: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('2026-09');
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayrolls = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await payrollService.getPayrolls({
        period: periodFilter || undefined,
        status: statusFilter || undefined,
        employeeId: employeeId || (user?.role === 'Employee' ? user.employeeId : undefined),
        search: search || undefined,
        page,
        pageSize: 10,
      });
      setPayrolls(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      toastError('Failed to load monthly payroll ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [periodFilter, statusFilter, employeeId, user, search, page, toastError]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await payrollService.approvePayroll(id);
      success(`Payroll statement for ${name} marked as Approved.`);
      fetchPayrolls();
    } catch {
      toastError('Failed to approve payroll.');
    }
  };

  const handleDisburse = async (id: string, name: string) => {
    try {
      await payrollService.disbursePayroll(id);
      success(`Payroll for ${name} disbursed via BEFTN.`);
      fetchPayrolls();
    } catch {
      toastError('Failed to disburse payroll.');
    }
  };

  const columns: ColumnDef<Payroll>[] = [
    {
      key: 'payrollPeriod',
      header: 'Cycle Period',
      sortable: true,
      width: '110px',
      render: (p) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {p.payrollPeriod}
        </span>
      ),
    },
    {
      key: 'employeeName',
      header: 'Employee Name & Code',
      sortable: true,
      render: (p) => (
        <div>
          <Link
            to={`/payroll/${p.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600 block truncate"
          >
            {p.employeeName}
          </Link>
          <span className="text-[11px] text-slate-400 block">
            {p.employeeCode} • {p.departmentName}
          </span>
        </div>
      ),
    },
    {
      key: 'attendanceSummary',
      header: 'Work / Present Days',
      align: 'center',
      render: (p) => (
        <span className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{p.presentDays}</span> / {p.workingDays}d
        </span>
      ),
    },
    {
      key: 'grossSalary',
      header: 'Gross Salary',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-semibold text-slate-800">{formatCurrency(p.grossSalary)}</span>
      ),
    },
    {
      key: 'deductionsTotal',
      header: 'Deductions',
      render: (p) => (
        <span className="text-xs text-rose-600 font-medium">- {formatCurrency(p.deductionsTotal)}</span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Payable',
      sortable: true,
      render: (p) => (
        <span className="font-bold text-xs text-brand-900 bg-brand-50/80 px-2 py-0.5 rounded">
          {formatCurrency(p.netSalary)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      render: (p) => (
        <Badge variant={getStatusBadgeVariant(p.status)} size="sm">
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => {
        const canManage = user?.role === 'System Administrator' || user?.role === 'Payroll Officer';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              to={`/payroll/${p.id}/payslip`}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Print Official Payslip"
            >
              <Printer className="w-4 h-4" />
            </Link>
            <Link
              to={`/payroll/${p.id}`}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="View Itemized Breakdown"
            >
              <Eye className="w-4 h-4" />
            </Link>

            {canManage && p.status === 'Processing' && (
              <button
                type="button"
                onClick={() => handleApprove(p.id, p.employeeName)}
                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
              >
                Approve
              </button>
            )}

            {canManage && p.status === 'Approved' && (
              <button
                type="button"
                onClick={() => handleDisburse(p.id, p.employeeName)}
                className="px-2 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded transition-colors"
              >
                Disburse
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {employeeId ? 'My Salary Payslips' : 'Monthly Payroll Administration'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified monthly ledger, statutory tax/PF calculations, and settlement status.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Payroll Cycles</option>
            <option value="2026-10">October 2026 (In Processing)</option>
            <option value="2026-09">September 2026 (Finalized)</option>
            <option value="2026-08">August 2026 (Historical)</option>
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PayrollStatus);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Processing">Processing</option>
          <option value="Approved">Approved</option>
          <option value="Disbursed">Disbursed</option>
        </select>

        {(statusFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
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
        data={payrolls}
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
          placeholder: 'Search employee name or payroll code...',
        }}
        emptyTitle="No Payroll Records"
        emptyDescription="No payroll records found for the selected period."
      />
    </div>
  );
};
