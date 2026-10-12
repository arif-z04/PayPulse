import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { salaryService } from '@/services/api/salaryService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { SalaryStructure } from '@/types';

export const SalaryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSalaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await salaryService.getSalaries({ search, pageSize: 50 });
      setSalaries(res.items);
    } catch {
      toastError('Failed to load salary structures.');
    } finally {
      setIsLoading(false);
    }
  }, [search, toastError]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const columns: ColumnDef<SalaryStructure>[] = [
    {
      key: 'employeeName',
      header: 'Employee Name',
      sortable: true,
      render: (s) => (
        <div>
          <Link
            to={`/employees/${s.employeeId}`}
            className="font-semibold text-slate-900 hover:text-brand-600 block"
          >
            {s.employeeName}
          </Link>
          <span className="text-[11px] text-slate-400 block">ID: {s.employeeId}</span>
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      sortable: true,
      render: (s) => (
        <span className="font-semibold text-xs text-slate-800">{formatCurrency(s.basicSalary)}</span>
      ),
    },
    {
      key: 'allowances',
      header: 'Allowances Total',
      render: (s) => {
        const total = s.houseRentAllowance + s.medicalAllowance + s.conveyanceAllowance + s.specialAllowance;
        return <span className="text-xs text-slate-600">{formatCurrency(total)}</span>;
      },
    },
    {
      key: 'grossSalary',
      header: 'Gross Monthly',
      sortable: true,
      render: (s) => (
        <span className="font-bold text-xs text-slate-900">{formatCurrency(s.grossSalary)}</span>
      ),
    },
    {
      key: 'rates',
      header: 'Tax / PF Rates',
      render: (s) => (
        <span className="text-xs text-slate-500">
          Tax {s.taxDeductionRate}% • PF {s.providentFundRate}%
        </span>
      ),
    },
    {
      key: 'estimatedNetSalary',
      header: 'Estimated Net',
      sortable: true,
      render: (s) => (
        <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
          {formatCurrency(s.estimatedNetSalary)}
        </span>
      ),
    },
    {
      key: 'effectiveDate',
      header: 'Effective Date',
      sortable: true,
      render: (s) => <span className="text-xs text-slate-600">{formatDate(s.effectiveDate)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '100px',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/salary/${s.employeeId}/edit`)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Adjust Salary Structure"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Salary Structures</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Base pay scales, house rent, medical, conveyance allowances and statutory withholdings.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={salaries}
        isLoading={isLoading}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search employee salary structures...',
        }}
        emptyTitle="No Salary Records"
        emptyDescription="No employee salary configurations found."
      />
    </div>
  );
};
