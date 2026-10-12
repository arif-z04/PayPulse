import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/common/Skeleton';
import { reportService, DepartmentPayrollCost } from '@/services/api/reportService';
import { formatCurrency, formatMonthPeriod } from '@/utils/formatters';

export const PayrollCostReportPage: React.FC = () => {
  const [period, setPeriod] = useState('2026-09');
  const [data, setData] = useState<DepartmentPayrollCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const res = await reportService.getDepartmentPayrollCost(period);
        setData(res);
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [period]);

  const totalCorporateNet = data.reduce((sum, d) => sum + d.netPayroll, 0);
  const totalCorporateGross = data.reduce((sum, d) => sum + d.grossPayroll, 0);

  const chartData = data.map((d) => ({
    name: d.departmentName.split(' ')[0],
    fullName: d.departmentName,
    Gross: d.grossPayroll,
    Net: d.netPayroll,
    Allowances: d.allowances,
    Deductions: d.deductions,
  }));

  const handlePrint = () => {
    window.print();
  };

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
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Statement</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
            Financial Analysis Report
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Departmental Monthly Payroll Cost
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit review of net salary obligations and tax withholdings across business units.
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
            <option value="2026-07">July 2026</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Comparative Gross vs Net Payouts ({formatMonthPeriod(period)})
            </h3>
            <p className="text-xs text-slate-500 mb-6">Values in Bangladesh Taka (BDT)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val)), 'Amount']}
                    labelFormatter={(code) => chartData.find((d) => d.name === code)?.fullName || code}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Gross" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net" fill="#03599f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Departmental Expenditure Summary Ledger
              </h3>
              <span className="text-xs text-slate-500">
                Total Net Obligation: <strong className="text-slate-900">{formatCurrency(totalCorporateNet)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80 font-semibold">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Headcount</th>
                    <th className="py-3 px-4 text-right">Gross Payroll</th>
                    <th className="py-3 px-4 text-right">Allowances</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4 text-right">% of Corporate Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => {
                    const pct = totalCorporateNet > 0 ? ((row.netPayroll / totalCorporateNet) * 100).toFixed(1) : '0';
                    return (
                      <tr key={row.departmentId} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.departmentName}</td>
                        <td className="py-3 px-4 text-center text-slate-600">{row.headCount} members</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800">
                          {formatCurrency(row.grossPayroll)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(row.allowances)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-medium">
                          - {formatCurrency(row.deductions)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-brand-900">
                          {formatCurrency(row.netPayroll)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">{pct}%</td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="py-3 px-4 text-slate-950">Grand Corporate Total</td>
                    <td className="py-3 px-4 text-center">
                      {data.reduce((sum, d) => sum + d.headCount, 0)} staff
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(totalCorporateGross)}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(data.reduce((sum, d) => sum + d.allowances, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-700">
                      - {formatCurrency(data.reduce((sum, d) => sum + d.deductions, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-brand-900 text-sm">
                      {formatCurrency(totalCorporateNet)}
                    </td>
                    <td className="py-3 px-4 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
