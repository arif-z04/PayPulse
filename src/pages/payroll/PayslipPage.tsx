import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { config } from '@/app/config/env';
import { payrollService } from '@/services/api/payrollService';
import { employeeService } from '@/services/api/employeeService';
import { formatCurrency, formatDate, formatMonthPeriod } from '@/utils/formatters';
import { Employee, Payroll } from '@/types';

export const PayslipPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const p = await payrollService.getPayrollById(id);
        setPayroll(p);
        const emp = await employeeService.getEmployeeById(p.employeeId);
        setEmployee(emp);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  if (isError || !payroll) {
    return (
      <ErrorState
        title="Payslip Generation Error"
        message="Could not retrieve the official payslip document for this record."
      />
    );
  }

  const earnings = payroll.components.filter((c) => c.type === 'Earning');
  const deductions = payroll.components.filter((c) => c.type === 'Deduction');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar - Hidden during print */}
      <div className="flex items-center justify-between no-print">
        <Link
          to={`/payroll/${payroll.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Payroll Details</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Payslip</span>
          </button>
        </div>
      </div>

      {/* Official Payslip Printable Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 payslip-sheet print:p-0 print:border-none print:shadow-none text-slate-900">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center font-bold text-sm">
                PP
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                {config.company.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500">{config.company.address}</p>
            <p className="text-[11px] text-slate-400 font-mono">Corporate Tax TIN: {config.company.taxId}</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded">
              Confidential Salary Advice
            </span>
            <p className="text-sm font-bold text-slate-900 mt-2">
              Payslip for: {formatMonthPeriod(payroll.payrollPeriod)}
            </p>
            <p className="text-xs text-slate-500">
              Generated: {formatDate(payroll.processedAt)}
            </p>
          </div>
        </div>

        {/* Employee & Bank Info Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name</span>
            <span className="font-bold text-slate-900">{payroll.employeeName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Code</span>
            <span className="font-mono font-semibold text-slate-800">{payroll.employeeCode}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
            <span className="font-medium text-slate-800">{payroll.departmentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Job Title</span>
            <span className="font-medium text-slate-800">{payroll.designationTitle}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Name</span>
            <span className="font-medium text-slate-800">
              {employee?.bankDetails?.bankName || 'Eastern Bank PLC'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Account</span>
            <span className="font-mono font-medium text-slate-800">{payroll.bankAccountMasked}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Present / Work Days</span>
            <span className="font-semibold text-slate-800">
              {payroll.presentDays} / {payroll.workingDays} days
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Disbursement Status</span>
            <Badge variant="success" size="sm">
              {payroll.status}
            </Badge>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-slate-200">
          {/* Earnings */}
          <div>
            <div className="flex justify-between items-center pb-2 border-b-2 border-slate-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Earnings Components</span>
              <span className="text-xs font-bold text-slate-900">Amount (BDT)</span>
            </div>
            <div className="space-y-2.5 text-xs">
              {earnings.map((e) => (
                <div key={e.id} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{e.name}</span>
                  <span className="font-mono font-medium text-slate-900">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t border-slate-300 text-xs font-bold text-slate-900">
              <span>Gross Earnings:</span>
              <span className="font-mono">{formatCurrency(payroll.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="flex justify-between items-center pb-2 border-b-2 border-slate-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Deductions</span>
              <span className="text-xs font-bold text-slate-900">Amount (BDT)</span>
            </div>
            <div className="space-y-2.5 text-xs">
              {deductions.map((d) => (
                <div key={d.id} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-medium text-rose-700">- {formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t border-slate-300 text-xs font-bold text-slate-900">
              <span>Total Deductions:</span>
              <span className="font-mono text-rose-700">- {formatCurrency(payroll.deductionsTotal)}</span>
            </div>
          </div>
        </div>

        {/* Net Take-Home Box */}
        <div className="py-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-6 rounded-xl my-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Net Payable Take-Home Salary
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight block mt-1">
              {formatCurrency(payroll.netSalary)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Settled via Electronic Funds Transfer (BEFTN)
            </span>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction Reference</span>
            <span className="font-mono font-semibold text-slate-900">
              {payroll.disbursementReference || 'TXN-202609-001'}
            </span>
          </div>
        </div>

        {/* Legal Disclaimer & Signatures */}
        <div className="pt-6 space-y-8">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            This payslip document is system-generated by PayPulse Enterprise and has been authenticated with the company treasury and tax withholding ledger. If you discover any discrepancy, please notify the Corporate Payroll Department within 5 working days.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
            <div>
              <div className="w-40 border-b border-slate-400 mx-auto mb-2" />
              <span className="text-slate-500 block">Prepared By</span>
              <span className="font-semibold text-slate-800">Payroll Officer</span>
            </div>
            <div>
              <div className="w-40 border-b border-slate-400 mx-auto mb-2" />
              <span className="text-slate-500 block">Authorized Signature</span>
              <span className="font-semibold text-slate-800">Head of Finance & Treasury</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
