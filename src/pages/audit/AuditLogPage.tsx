import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FilterX } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { auditService } from '@/services/api/auditService';
import { formatDateTime } from '@/utils/formatters';
import { AuditLog, AuditOperation } from '@/types';

export const AuditLogPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [operationFilter, setOperationFilter] = useState<AuditOperation | ''>('');
  const [tableFilter, setTableFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        operation: operationFilter || undefined,
        tableName: tableFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 10,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      toastError('Failed to load system audit trails.');
    } finally {
      setIsLoading(false);
    }
  }, [operationFilter, tableFilter, search, page, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      width: '160px',
      render: (log) => (
        <span className="font-mono text-xs text-slate-700">{formatDateTime(log.timestamp)}</span>
      ),
    },
    {
      key: 'operation',
      header: 'Operation',
      sortable: true,
      width: '100px',
      render: (log) => (
        <Badge
          variant={
            log.operation === 'INSERT'
              ? 'success'
              : log.operation === 'UPDATE'
              ? 'brand'
              : 'danger'
          }
          size="sm"
        >
          {log.operation}
        </Badge>
      ),
    },
    {
      key: 'tableName',
      header: 'Entity Table',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {log.tableName}
        </span>
      ),
    },
    {
      key: 'recordId',
      header: 'Record Key',
      render: (log) => (
        <span className="font-mono text-[11px] text-slate-500">{log.recordId}</span>
      ),
    },
    {
      key: 'userName',
      header: 'Operator & Role',
      render: (log) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{log.userName}</span>
          <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Audit Summary',
      render: (log) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-sm">{log.description}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Diff',
      align: 'right',
      width: '80px',
      render: (log) => (
        <button
          type="button"
          onClick={() => setSelectedLog(log)}
          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Inspect Mutation Values"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
            <Badge variant="brand">Immutable Trail</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed timeline of entity mutations, salary grade edits, and authorization events.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={operationFilter}
          onChange={(e) => {
            setOperationFilter(e.target.value as AuditOperation);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Operations</option>
          <option value="INSERT">INSERT (Create)</option>
          <option value="UPDATE">UPDATE (Modify)</option>
          <option value="DELETE">DELETE (Remove)</option>
        </select>

        <select
          value={tableFilter}
          onChange={(e) => {
            setTableFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Domain Tables</option>
          <option value="Employee">Employee</option>
          <option value="Monthly_Payroll">Monthly_Payroll</option>
          <option value="Salary_Structure">Salary_Structure</option>
          <option value="Leave_Request">Leave_Request</option>
          <option value="Disbursement_Record">Disbursement_Record</option>
          <option value="User_Account">User_Account</option>
        </select>

        {(operationFilter || tableFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setOperationFilter('');
              setTableFilter('');
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
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
          placeholder: 'Search audit events by operator, table, or keywords...',
        }}
        emptyTitle="No Audit Logs"
        emptyDescription="No database audit logs found matching your filter selection."
      />

      {/* Audit Detail Diff Inspection Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Mutation Inspection"
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Action & Entity</span>
                <span className="font-semibold text-slate-900">
                  {selectedLog.operation} ON {selectedLog.tableName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Record Identifier</span>
                <span className="font-mono text-slate-800">{selectedLog.recordId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Operator</span>
                <span className="font-medium text-slate-900">
                  {selectedLog.userName} ({selectedLog.userRole})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp & IP</span>
                <span className="font-mono text-slate-700">
                  {formatDateTime(selectedLog.timestamp)} ({selectedLog.ipAddress})
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              Summary: {selectedLog.description}
            </p>

            {/* Before vs After JSON Diffs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-rose-700 block mb-1">
                  Previous Values (Pre-Mutation):
                </span>
                <pre className="bg-slate-900 text-rose-300 text-[11px] p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                  {selectedLog.oldValues
                    ? JSON.stringify(selectedLog.oldValues, null, 2)
                    : '// No prior record (INSERT)'}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 block mb-1">
                  Committed Values (Post-Mutation):
                </span>
                <pre className="bg-slate-900 text-emerald-300 text-[11px] p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                  {selectedLog.newValues
                    ? JSON.stringify(selectedLog.newValues, null, 2)
                    : '// Record removed (DELETE)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
