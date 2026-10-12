import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  CalendarCheck2,
  CalendarDays,
  Clock,
  Coins,
  Send,
  ShieldCheck,
  Award,
  ArrowRight,
} from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  category: string;
  badge?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  to,
  icon,
  category,
  badge,
}) => (
  <Link
    to={to}
    className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
  >
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {badge}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
    </div>

    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
      <span>Generate Analysis</span>
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

export const ReportsHubPage: React.FC = () => {
  const reports = [
    {
      title: 'Departmental Monthly Payroll Cost',
      description: 'Itemized net vs gross corporate payroll expenditure grouped by organizational business units.',
      to: '/reports/payroll',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      category: 'Financial',
      badge: 'Audited',
    },
    {
      title: 'Monthly Attendance & Absenteeism',
      description: 'Trend analysis of daily worker attendance, half-days, absenteeism and punctuality patterns.',
      to: '/reports/attendance',
      icon: <CalendarCheck2 className="w-5 h-5" />,
      category: 'Workforce',
    },
    {
      title: 'Annual Leave Utilization Ratio',
      description: 'Departmental exhaustion of Casual, Medical, and Earned statutory leave allowances.',
      to: '/reports/leave',
      icon: <CalendarDays className="w-5 h-5" />,
      category: 'Workforce',
    },
    {
      title: 'Overtime & Extended Shift Analysis',
      description: 'Shift overtime hours across engineering, operations and support divisions.',
      to: '/reports/overtime',
      icon: <Clock className="w-5 h-5" />,
      category: 'Operations',
    },
    {
      title: 'Tax & Provident Fund Statement',
      description: 'Statutory income tax withholdings and employer/employee matching provident fund totals.',
      to: '/reports/tax',
      icon: <Coins className="w-5 h-5" />,
      category: 'Compliance',
      badge: 'Statutory',
    },
    {
      title: 'Designation Salary Band Compliance',
      description: 'Pay equity verification against minimum and maximum approved designation salary grades.',
      to: '/reports/audit',
      icon: <Award className="w-5 h-5" />,
      category: 'Compensation',
    },
    {
      title: 'Bank Disbursement Reconciliation',
      description: 'Audit tracking of electronic BEFTN batches, confirmed settlements and failed transactions.',
      to: '/reports/disbursement',
      icon: <Send className="w-5 h-5" />,
      category: 'Banking',
    },
    {
      title: 'Security & Salary Audit Trails',
      description: 'Chronological timeline of all database mutations, salary adjustments, and user actions.',
      to: '/audit',
      icon: <ShieldCheck className="w-5 h-5" />,
      category: 'Governance',
      badge: 'Immutable',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Executive Reports & Analytics Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Pre-compiled statutory statements, financial payroll distributions, workforce attendance analytics, and internal audit compliance records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => (
          <ReportCard key={report.title} {...report} />
        ))}
      </div>
    </div>
  );
};
