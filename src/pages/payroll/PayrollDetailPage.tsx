import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2, Send } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { payrollService } from '@/services/api/payrollService';
import { formatCurrency, formatMonthPeriod, getStatusBadgeVariant } from '@/utils/formatters';
import { Payroll } from '@/types';

export const PayrollDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadPayroll = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await payrollService.getPayrollById(id);
      setPayroll(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const handleApprove = async () => {
    if (!payroll) return;
    try {
      const updated = await payrollService.approvePayroll(payroll.id);
      setPayroll(updated);
      success('Payroll batch item approved.');
    } catch {
      toastError('Failed to approve payroll.');
    }
  };

  const handleDisburse = async () => {
    if (!payroll) return;
    try {
      const updated = await payrollService.disbursePayroll(payroll.id);
      setPayroll(updated);
      success('Payment instructions dispatched via BEFTN.');
    } catch {
      toastError('Failed to disburse payroll.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !payroll) {
    return (
      <ErrorState
        title="Payroll Record Not Found"
        message="The requested monthly payroll record could not be retrieved from the financial ledger."
      />
    );
  }

  const earnings = payroll.components.filter((c) => c.type === 'Earning');
  const deductions = payroll.components.filter((c) => c.type === 'Deduction');
  const canManage = user?.role === 'System Administrator' || user?.role === 'Payroll Officer';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/payroll"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Payroll Ledger</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={`/payroll/${payroll.id}/payslip`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Payslip Document</span>
          </Link>
        </div>
      </div>

      {/* Header Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              Salary Advice: {payroll.employeeName}
            </h1>
            <Badge variant={getStatusBadgeVariant(payroll.status)}>
              {payroll.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Period: <span className="font-semibold text-slate-700">{formatMonthPeriod(payroll.payrollPeriod)}</span> • {payroll.designationTitle} ({payroll.departmentName})
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span>Working Days: <strong className="text-slate-800">{payroll.workingDays}</strong></span>
            <span>•</span>
            <span>Present Days: <strong className="text-slate-800">{payroll.presentDays}</strong></span>
            <span>•</span>
            <span>Paid Leaves: <strong className="text-slate-800">{payroll.paidLeaveDays}</strong></span>
          </div>
        </div>

        {/* Action Buttons for Payroll Officers */}
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            {payroll.status === 'Processing' && (
              <button
                type="button"
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Payroll</span>
              </button>
            )}
            {payroll.status === 'Approved' && (
              <button
                type="button"
                onClick={handleDisburse}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Execute BEFTN Disbursement</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Gross Salary
          </span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(payroll.grossSalary)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Basic + Allowances
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Deductions
          </span>
          <span className="text-xl font-bold text-rose-600 mt-1 block">
            - {formatCurrency(payroll.deductionsTotal)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Tax withheld & PF
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/40">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Net Payable Take-Home
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {formatCurrency(payroll.netSalary)}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            Direct bank deposit
          </span>
        </div>
      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Itemized Earnings</span>
            <span className="text-brand-600">Credit (+)</span>
          </h3>
          <div className="space-y-3 text-xs">
            {earnings.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">{item.name}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
            <span>Gross Earnings Total:</span>
            <span>{formatCurrency(payroll.grossSalary)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Statutory Deductions</span>
            <span className="text-rose-600">Debit (-)</span>
          </h3>
          <div className="space-y-3 text-xs">
            {deductions.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">{item.name}</span>
                <span className="font-semibold text-rose-600">- {formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs font-bold text-rose-700">
            <span>Total Deductions:</span>
            <span>- {formatCurrency(payroll.deductionsTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
