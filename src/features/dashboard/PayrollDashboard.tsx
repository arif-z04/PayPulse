import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Coins,
  Send,
  CheckCircle2,
  Clock,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { payrollService } from '@/services/api/payrollService';
import { disbursementService } from '@/services/api/disbursementService';
import { reportService, DepartmentPayrollCost } from '@/services/api/reportService';
import { formatCurrency } from '@/utils/formatters';
import { Disbursement, Payroll } from '@/types';

export const PayrollDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [deptCosts, setDeptCosts] = useState<DepartmentPayrollCost[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [payRes, disbRes, costRes] = await Promise.all([
          payrollService.getPayrolls({ pageSize: 50 }),
          disbursementService.getDisbursements({ pageSize: 50 }),
          reportService.getDepartmentPayrollCost('2026-08'),
        ]);
        setPayrolls(payRes.items);
        setDisbursements(disbRes.items);
        setDeptCosts(costRes);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const sepPayrolls = payrolls.filter((p) => p.payrollPeriod === '2026-09');
  const grossTotal = sepPayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
  const deductionsTotal = sepPayrolls.reduce((sum, p) => sum + p.deductionsTotal, 0);
  const netTotal = sepPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

  const pendingDisbursements = disbursements.filter((d) => d.status === 'Pending').length;
  const completedDisbursements = disbursements.filter((d) => d.status === 'Successful').length;

  const chartData = deptCosts.map((d) => ({
    name: d.departmentName.split(' ')[0],
    fullName: d.departmentName,
    net: d.netPayroll,
    gross: d.grossPayroll,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Payroll Financial Center</h1>
            <Badge variant="brand">Period: September 2026</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Salary disbursements, statutory withholdings and banking files</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/payroll"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Review Payroll Batch</span>
          </Link>
          <Link
            to="/disbursements"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Disbursements</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Payroll (Sep 2026)"
          value={formatCurrency(grossTotal)}
          subtitle="Pre-tax total salary liability"
          icon={<Coins className="w-5 h-5" />}
        />
        <StatCard
          title="Statutory Deductions"
          value={formatCurrency(deductionsTotal)}
          subtitle="Tax withholdings & PF"
          icon={<TrendingDown className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Net Disbursed"
          value={formatCurrency(netTotal)}
          subtitle="Direct deposit settlement"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending BEFTN Transfers"
          value={pendingDisbursements}
          subtitle={`${completedDisbursements} settlements finalized`}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Net vs Gross Expenditure</h3>
              <p className="text-xs text-slate-500">Breakdown of gross vs net corporate payouts</p>
            </div>
            <Link to="/reports/payroll" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Detailed Statement
            </Link>
          </div>
          <div className="h-64">
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
                <Bar dataKey="gross" name="Gross" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#03599f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Disbursements</h3>
              <Link to="/disbursements" className="text-xs font-semibold text-brand-600">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {disbursements.slice(0, 5).map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{d.employeeName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {d.paymentMethod} • {d.maskedAccountNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-800">{formatCurrency(d.amount)}</p>
                    <Badge variant={d.status === 'Successful' ? 'success' : 'warning'} size="sm" className="mt-0.5">
                      {d.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
