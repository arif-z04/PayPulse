import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  FilterX,
  Building2,
  Filter,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { departmentService } from '@/services/api/departmentService';
import { maskAccountNumber } from '@/utils/security';
import { getStatusBadgeVariant } from '@/utils/formatters';

import { Department, Employee } from '@/types';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { employees, pagination, params, isLoading, isError, refetch, updateFilters, deleteEmployee } =
    useEmployees();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    updateFilters({
      search: '',
      departmentId: undefined,
      status: undefined,
      employmentType: undefined,
    });
  };

  const columns: ColumnDef<Employee>[] = [
    {
      key: 'employeeCode',
      header: 'Code',
      sortable: true,
      width: '110px',
      render: (emp) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {emp.employeeCode}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Employee Name',
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
            {emp.firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <Link
              to={`/employees/${emp.id}`}
              className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block truncate"
            >
              {emp.fullName}
            </Link>
            <span className="text-[11px] text-slate-400 block truncate">{emp.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{emp.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'designationTitle',
      header: 'Designation',
      sortable: true,
      render: (emp) => <span className="text-xs text-slate-600 truncate">{emp.designationTitle}</span>,
    },
    {
      key: 'employmentType',
      header: 'Type',
      sortable: true,
      render: (emp) => <span className="text-xs text-slate-500">{emp.employmentType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (emp) => (
        <Badge variant={getStatusBadgeVariant(emp.status)} size="sm">
          {emp.status}
        </Badge>
      ),
    },
    {
      key: 'bankDetails',
      header: 'Bank Account (Masked)',
      render: (emp) => (
        <span className="font-mono text-xs text-slate-500">
          {maskAccountNumber(emp.bankDetails?.accountNumber)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '120px',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/employees/${emp.id}`)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/employees/${emp.id}/edit`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(emp)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, profiles, job titles, and sensitive financial records.
          </p>
        </div>
        <Link
          to="/employees/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by:</span>
        </div>

        {/* Department select */}
        <select
          value={params.departmentId || ''}
          onChange={(e) => updateFilters({ departmentId: e.target.value || undefined })}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Employment Status select */}
        <select
          value={params.status || ''}
          onChange={(e) => updateFilters({ status: e.target.value || undefined })}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
          <option value="Suspended">Suspended</option>
        </select>

        {/* Employment Type select */}
        <select
          value={params.employmentType || ''}
          onChange={(e) => updateFilters({ employmentType: e.target.value || undefined })}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700"
        >
          <option value="">All Employment Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Contract">Contract</option>
          <option value="Probation">Probation</option>
        </select>

        {(params.departmentId || params.status || params.employmentType || params.search) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 ml-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        pagination={pagination}
        search={{
          value: params.search || '',
          onChange: (val) => updateFilters({ search: val }),
          placeholder: 'Search by employee name, code, email, title...',
        }}
        sorting={{
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          onSort: (col) => {
            const nextOrder = params.sortBy === col && params.sortOrder === 'asc' ? 'desc' : 'asc';
            updateFilters({ sortBy: col, sortOrder: nextOrder });
          },
        }}
        emptyTitle="No Employees Found"
        emptyDescription="No employee records matched your filter criteria. Try adjusting the search term or clear filters."
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Employee Deletion"
        message={`Are you certain you want to archive or remove employee ${deleteTarget?.fullName} (${deleteTarget?.employeeCode})? This action will generate an immutable audit log.`}
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
