import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface SortingConfig {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  pagination?: PaginationConfig;
  search?: SearchConfig;
  sorting?: SortingConfig;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: React.ReactNode;
  rowKey?: (item: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  onRetry,
  pagination,
  search,
  sorting,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  actions,
  rowKey,
}: DataTableProps<T>) {
  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      {(search || actions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          {search && (
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Search records...'}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
        </div>
      )}

      {/* Main Table Area */}
      {isLoading ? (
        <TableSkeleton rows={pagination?.pageSize || 5} cols={columns.length} />
      ) : data.length === 0 ? (
        <div className="p-8">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {columns.map((col) => {
                  const isSorted = sorting?.sortBy === col.key;
                  const alignClass = {
                    left: 'text-left',
                    center: 'text-center',
                    right: 'text-right',
                  }[col.align || 'left'];

                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-4 py-3.5 ${alignClass} ${
                        col.sortable ? 'cursor-pointer select-none hover:bg-slate-100/80 transition-colors' : ''
                      }`}
                      onClick={() => {
                        if (col.sortable && sorting?.onSort) {
                          sorting.onSort(col.key);
                        }
                      }}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-400">
                            {isSorted ? (
                              sorting.sortOrder === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-brand-600" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-brand-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => {
                const key = rowKey ? rowKey(row, idx) : (row as unknown as { id?: string }).id || String(idx);
                return (
                  <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col) => {
                      const alignClass = {
                        left: 'text-left',
                        center: 'text-center',
                        right: 'text-right',
                      }[col.align || 'left'];

                      return (
                        <td key={col.key} className={`px-4 py-3.5 text-slate-700 ${alignClass}`}>
                          {col.render
                            ? col.render(row, idx)
                            : String((row as unknown as Record<string, unknown>)[col.key] ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && !isLoading && data.length > 0 && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalCount)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{pagination.totalCount}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
