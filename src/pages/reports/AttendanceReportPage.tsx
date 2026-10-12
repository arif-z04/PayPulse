import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/common/Skeleton';
import { reportService, AttendanceAnalytics } from '@/services/api/reportService';

export const AttendanceReportPage: React.FC = () => {
  const [data, setData] = useState<AttendanceAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService.getAttendanceTrend().then((res) => {
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
          <span>Print Report</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
          Workforce Analytics
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
          Monthly Attendance & Absenteeism Audit
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Shift fulfillment trends, chronic tardiness patterns and unscheduled absences.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Daily Workforce Attendance Trend</h3>
            <p className="text-xs text-slate-500 mb-6">Present, Late, Half-Day and Absent staff headcount</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="#d1fae5" />
                  <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" fill="#fef3c7" />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" fill="#ffe4e6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Timesheet Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                    <th className="py-3 px-4">Shift Date</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Late</th>
                    <th className="py-3 px-4 text-center">Half-Day</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-right">Fulfillment Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => {
                    const total = row.present + row.late + row.halfDay + row.absent;
                    const rate = total > 0 ? (((row.present + row.late + row.halfDay * 0.5) / total) * 100).toFixed(0) : '0';
                    return (
                      <tr key={row.date} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.date}</td>
                        <td className="py-3 px-4 text-center text-emerald-700 font-bold">{row.present}</td>
                        <td className="py-3 px-4 text-center text-amber-700 font-medium">{row.late}</td>
                        <td className="py-3 px-4 text-center text-sky-700 font-medium">{row.halfDay}</td>
                        <td className="py-3 px-4 text-center text-rose-700 font-medium">{row.absent}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
