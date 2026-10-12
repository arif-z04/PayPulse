import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  FilterX,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/contexts/ToastContext';
import { disbursementService } from '@/services/api/disbursementService';
import { formatCurrency, formatDateTime, getStatusBadgeVariant } from '@/utils/formatters';
import { maskAccountNumber } from '@/utils/security';
import { Disbursement, DisbursementStatus } from '@/types';

export const DisbursementListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DisbursementStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDisbursements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await disbursementService.getDisbursements({
        status: statusFilter || undefined,
        period: periodFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 10,
      });
      setDisbursements(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      toastError('Failed to load banking disbursement records.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, periodFilter, search, page, toastError]);

  useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

  const handleRetry = async (id: string, name: string) => {
    try {
      await disbursementService.retryDisbursement(id);
      success(`Re-dispatched disbursement batch for ${name}.`);
      fetchDisbursements();
    } catch {
      toastError('Failed to re-dispatch transaction.');
    }
  };

  const columns: ColumnDef<Disbursement>[] = [
    {
      key: 'transactionReference',
      header: 'Reference ID',
      sortable: true,
      width: '180px',
      render: (d) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {d.transactionReference}
        </span>
      ),
    },
    {
      key: 'employeeName',
      header: 'Beneficiary Employee',
      sortable: true,
      render: (d) => (
        <div>
          <Link
            to={`/employees/${d.employeeId}`}
            className="font-semibold text-slate-900 hover:text-brand-600 block"
          >
            {d.employeeName}
          </Link>
          <span className="text-[11px] text-slate-400 block">{d.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period Cycle',
      sortable: true,
      render: (d) => <span className="font-mono text-xs text-slate-600">{d.period}</span>,
    },
    {
      key: 'amount',
      header: 'Disbursement Amount',
      sortable: true,
      render: (d) => (
        <span className="font-bold text-xs text-brand-900">{formatCurrency(d.amount)}</span>
      ),
    },
    {
      key: 'bankingMethod',
      header: 'Method & Bank (Masked)',
      render: (d) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">
            {d.paymentMethod} • {d.bankName}
          </span>
          <span className="font-mono text-[11px] text-slate-400 block">
            {maskAccountNumber(d.maskedAccountNumber)}
          </span>
        </div>
      ),
    },
    {
      key: 'disbursementDate',
      header: 'Settlement Timestamp',
      sortable: true,
      render: (d) => (
        <span className="text-xs text-slate-600">{formatDateTime(d.disbursementDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      render: (d) => (
        <Badge variant={getStatusBadgeVariant(d.status)} size="sm">
          {d.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => {
        if (d.status === 'Failed') {
          return (
            <button
              type="button"
              onClick={() => handleRetry(d.id, d.employeeName)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          );
        }
        return <span className="text-xs text-slate-400 italic">Settled</span>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bank Disbursement Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BEFTN bank transfers, transaction audit references, payment settlements and failures.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DisbursementStatus);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="Successful">Successful</option>
          <option value="Processing">Processing</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={periodFilter}
          onChange={(e) => {
            setPeriodFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Periods</option>
          <option value="2026-10">October 2026</option>
          <option value="2026-09">September 2026</option>
        </select>

        {(statusFilter || periodFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setPeriodFilter('');
              setSearch('');
              setPage(1);
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 ml-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={disbursements}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
        search={{
          value: search,
          onChange: (val) => {
            setSearch(val);
            setPage(1);
          },
          placeholder: 'Search employee name, bank, or transaction ref...',
        }}
        emptyTitle="No Disbursement Records"
        emptyDescription="No disbursement transactions found matching your filter criteria."
      />
    </div>
  );
};
