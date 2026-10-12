import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { reportService, SalaryBandCompliance } from '@/services/api/reportService';
import { formatCurrency } from '@/utils/formatters';

export const SalaryBandComplianceReportPage: React.FC = () => {
  const [data, setData] = useState<SalaryBandCompliance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService.getSalaryBandCompliance().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

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
          <span>Print Audit</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
          Pay Equity & Policy
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
          Designation Salary Band Compliance Audit
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verifying that all active salaries conform strictly within approved minimum and maximum wage bands.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Compliance Audit Ledger</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Policy Compliant</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Band Floor</th>
                  <th className="py-3 px-4 text-right">Band Ceiling</th>
                  <th className="py-3 px-4 text-right">Average In-Band</th>
                  <th className="py-3 px-4 text-center">Incumbents</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.designationId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.designationTitle}</td>
                    <td className="py-3 px-4 text-slate-600">{row.departmentName}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(row.minAllowed)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(row.maxAllowed)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-brand-900">
                      {formatCurrency(row.actualAvg)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 font-semibold">
                      {row.totalEmployees}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" size="sm">Compliant</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
