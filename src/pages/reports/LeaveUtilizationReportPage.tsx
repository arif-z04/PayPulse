import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
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
import { reportService, LeaveUtilization } from '@/services/api/reportService';

export const LeaveUtilizationReportPage: React.FC = () => {
  const [data, setData] = useState<LeaveUtilization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService.getLeaveUtilization().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  const chartData = data.map((d) => ({
    name: d.departmentName.split(' ')[0],
    fullName: d.departmentName,
    Casual: d.casualUsed,
    Medical: d.medicalUsed,
    Earned: d.earnedUsed,
  }));

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
          <span>Print Report</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
          Workforce Compliance
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
          Annual Leave Utilization Statement
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cumulative breakdown of Casual, Medical and Earned annual quota consumption across departments.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Leave Types Consumed by Department (Days)
            </h3>
            <p className="text-xs text-slate-500 mb-6">Comparison of leave categories utilized</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    labelFormatter={(code) => chartData.find((d) => d.name === code)?.fullName || code}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Casual" fill="#38a9f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Medical" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Earned" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Department Leave Quota Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Casual Used</th>
                    <th className="py-3 px-4 text-center">Medical Used</th>
                    <th className="py-3 px-4 text-center">Earned Used</th>
                    <th className="py-3 px-4 text-center">Allocated Quota</th>
                    <th className="py-3 px-4 text-right">Quota Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => (
                    <tr key={row.departmentName} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.departmentName}</td>
                      <td className="py-3 px-4 text-center text-slate-700">{row.casualUsed} d</td>
                      <td className="py-3 px-4 text-center text-slate-700">{row.medicalUsed} d</td>
                      <td className="py-3 px-4 text-center text-slate-700">{row.earnedUsed} d</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{row.totalAllocated} d</td>
                      <td className="py-3 px-4 text-right font-bold text-brand-700">{row.utilizationRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
