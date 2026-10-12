import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { reportService, TaxProvidentSummary } from '@/services/api/reportService';
import { formatCurrency, formatMonthPeriod } from '@/utils/formatters';

export const TaxProvidentReportPage: React.FC = () => {
  const [period, setPeriod] = useState('2026-09');
  const [data, setData] = useState<TaxProvidentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    reportService.getTaxProvidentSummary(period).then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reporting Center</span>
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Statutory Statement</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
            Statutory & Tax Compliance
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Tax Withholding & Provident Fund Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official government tax filings and corporate provident fund treasury balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Income Tax Withheld
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">
                {formatCurrency(data.taxWithheldTotal)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">NBR Corporate Treasury Challan</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Employee PF Deduction
              </span>
              <span className="text-2xl font-bold text-brand-700 mt-1 block">
                {formatCurrency(data.providentFundEmployeeTotal)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">Payroll Withholding (7.5% avg)</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Employer Matching PF
              </span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                {formatCurrency(data.providentFundEmployerTotal)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">100% Corporate Trust Contribution</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Statutory Deposition Summary: {formatMonthPeriod(period)}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Monthly Corporate Gross Salary Base</span>
                <span className="font-semibold text-slate-900">{formatCurrency(data.grossSalaryTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Income Tax Deducted at Source (Section 50, ITO 1984)</span>
                <span className="font-semibold text-rose-700">{formatCurrency(data.taxWithheldTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Employee Contribution to Recognized Provident Fund</span>
                <span className="font-semibold text-slate-900">{formatCurrency(data.providentFundEmployeeTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">PayPulse Employer Matching Contribution</span>
                <span className="font-semibold text-slate-900">{formatCurrency(data.providentFundEmployerTotal)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-300 text-sm font-bold text-slate-950">
                <span>Total Statutory Deposition Obligation:</span>
                <span className="text-brand-900">{formatCurrency(data.totalStatutoryDeposit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
