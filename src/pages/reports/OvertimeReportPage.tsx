import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export const OvertimeReportPage: React.FC = () => {
  const [period, setPeriod] = useState('2026-09');

  const overtimeData = [
    { employee: 'Tanvir Ahmed', department: 'Software Engineering', hours: 8.5, rate: 1200, total: 10200 },
    { employee: 'Kabir Hossain', department: 'Operations & Logistics', hours: 14.0, rate: 850, total: 11900 },
    { employee: 'Rafiqul Islam', department: 'Finance & Accounts', hours: 6.5, rate: 950, total: 6175 },
    { employee: 'Tariq Manzoor', department: 'Software Engineering', hours: 11.0, rate: 750, total: 8250 },
    { employee: 'Mahbubur Rahman', department: 'Software Engineering', hours: 7.0, rate: 900, total: 6300 },
    { employee: 'Sharmin Sultana', department: 'Quality Assurance & Security', hours: 5.0, rate: 850, total: 4250 },
  ];

  const totalHours = overtimeData.reduce((acc, d) => acc + d.hours, 0);
  const totalPayout = overtimeData.reduce((acc, d) => acc + d.total, 0);

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
          <span>Print Statement</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
            Operational Compensation
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Shift Overtime Hours & Liability Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of extended shift hours, overtime multiplier rates and financial liabilities.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Overtime Logged
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalHours.toFixed(1)} Cumulative Hours
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Approved by Department Supervisors</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Overtime Financial Liability
          </span>
          <span className="text-2xl font-bold text-brand-700 mt-1 block">
            {formatCurrency(totalPayout)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Included in monthly payroll component details</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Itemized Overtime Register</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Approved Hours</th>
                <th className="py-3 px-4 text-right">Hourly Rate</th>
                <th className="py-3 px-4 text-right">Compensation Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overtimeData.map((row) => (
                <tr key={row.employee} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.employee}</td>
                  <td className="py-3 px-4 text-slate-600">{row.department}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{row.hours} hrs</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(row.rate)}/hr</td>
                  <td className="py-3 px-4 text-right font-bold text-brand-900">{formatCurrency(row.total)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td className="py-3 px-4" colSpan={2}>Grand Total Liability</td>
                <td className="py-3 px-4 text-center">{totalHours.toFixed(1)} hrs</td>
                <td className="py-3 px-4 text-right">—</td>
                <td className="py-3 px-4 text-right text-brand-900 text-sm">{formatCurrency(totalPayout)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
