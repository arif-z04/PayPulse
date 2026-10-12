import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { getStatusBadgeVariant } from '@/utils/formatters';
import { Tabs, TabItem } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/api/leaveService';
import { LeaveAllocation, LeaveRequest, LeaveType } from '@/types';

export const LeavePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Determine active sub-tab from path
  const getInitialTab = () => {
    if (location.pathname.includes('/requests')) return 'requests';
    if (location.pathname.includes('/types')) return 'types';
    if (location.pathname.includes('/allocations')) return 'allocations';
    return 'requests';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Data states
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status Filter for requests
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: 'lt-1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, typeRes, allocRes] = await Promise.all([
        leaveService.getLeaveRequests({
          status: statusFilter || undefined,
          search: search || undefined,
          pageSize: 50,
        }),
        leaveService.getLeaveTypes(),
        leaveService.getLeaveAllocations(user?.role === 'Employee' ? user?.employeeId : undefined),
      ]);
      setRequests(reqRes.items);
      setTypes(typeRes);
      setAllocations(allocRes);
    } catch {
      toastError('Failed to load leave records.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, user, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'requests') navigate('/leave/requests');
    else if (tabId === 'types') navigate('/leave/types');
    else if (tabId === 'allocations') navigate('/leave/allocations');
  };

  const handleOpenActionModal = (req: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(type);
    setActionComment('');
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'approve') {
        await leaveService.approveLeaveRequest(selectedRequest.id, actionComment, user?.role || 'Supervisor');
        success(`Leave request for ${selectedRequest.employeeName} approved.`);
      } else {
        if (!actionComment.trim()) {
          toastError('Please provide a reason for rejecting the leave request.');
          setIsSubmitting(false);
          return;
        }
        await leaveService.rejectLeaveRequest(selectedRequest.id, actionComment);
        success(`Leave request for ${selectedRequest.employeeName} rejected.`);
      }
      setIsActionModalOpen(false);
      loadData();
    } catch {
      toastError('Failed to process leave action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      toastError('Please describe the purpose of the leave.');
      return;
    }
    const chosenType = types.find((t) => t.id === applyForm.leaveTypeId);
    setIsSubmitting(true);
    try {
      await leaveService.submitLeaveRequest({
        employeeId: user?.employeeId || 'emp-5',
        employeeName: user?.fullName || 'Current User',
        departmentName: user?.departmentName || 'Software Engineering',
        leaveTypeId: applyForm.leaveTypeId,
        leaveTypeName: chosenType?.name || 'Casual',
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        totalDays: Number(applyForm.totalDays),
        reason: applyForm.reason,
      });
      success('Leave request submitted for review.');
      setIsApplyModalOpen(false);
      setApplyForm({
        leaveTypeId: 'lt-1',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalDays: 1,
        reason: '',
      });
      loadData();
    } catch {
      toastError('Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: TabItem[] = [
    { id: 'requests', label: 'Leave Applications', count: requests.length, icon: <Clock className="w-4 h-4" /> },
    { id: 'allocations', label: 'Employee Quotas & Balances', count: allocations.length, icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'types', label: 'Statutory Leave Types', count: types.length, icon: <CalendarDays className="w-4 h-4" /> },
  ];

  const requestColumns: ColumnDef<LeaveRequest>[] = [
    {
      key: 'employeeName',
      header: 'Employee Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 block truncate">{r.employeeName}</span>
          <span className="text-[11px] text-slate-400 block">{r.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'leaveTypeName',
      header: 'Leave Category',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
          {r.leaveTypeName}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration & Dates',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.totalDays} Day(s)</span>
          <span className="text-[11px] text-slate-400 block">
            {r.startDate} to {r.endDate}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Justification',
      render: (r) => <span className="text-xs text-slate-600 line-clamp-2 max-w-xs">{r.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (r) => (
        <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Review Actions',
      align: 'right',
      render: (r) => {
        const canApprove =
          user?.role === 'System Administrator' ||
          user?.role === 'HR Manager' ||
          user?.role === 'Department Supervisor';

        if (r.status === 'Pending' && canApprove) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenActionModal(r, 'approve')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenActionModal(r, 'reject')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          );
        }
        return (
          <span className="text-[11px] text-slate-400 italic">
            {r.status === 'Approved' ? 'Reviewed' : 'Closed'}
          </span>
        );
      },
    },
  ];

  const allocColumns: ColumnDef<LeaveAllocation>[] = [
    {
      key: 'employeeName',
      header: 'Employee Name',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900 block">{a.employeeName}</span>
          <span className="text-[11px] text-slate-400 block">{a.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'leaveTypeName',
      header: 'Leave Type',
      sortable: true,
      render: (a) => <span className="font-medium text-xs text-slate-700">{a.leaveTypeName}</span>,
    },
    {
      key: 'totalDays',
      header: 'Total Quota',
      align: 'center',
      render: (a) => <span className="text-xs text-slate-600">{a.totalDays} days</span>,
    },
    {
      key: 'usedDays',
      header: 'Days Used',
      align: 'center',
      render: (a) => <span className="text-xs text-slate-600 font-semibold">{a.usedDays} days</span>,
    },
    {
      key: 'remainingDays',
      header: 'Balance Remaining',
      align: 'center',
      render: (a) => (
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
          {a.remainingDays} days
        </span>
      ),
    },
  ];

  const typeColumns: ColumnDef<LeaveType>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (t) => <span className="font-mono text-xs font-bold text-slate-700">{t.code}</span>,
    },
    {
      key: 'name',
      header: 'Leave Name',
      render: (t) => <span className="font-semibold text-slate-900 text-xs">{t.name} Leave</span>,
    },
    {
      key: 'annualQuota',
      header: 'Annual Allocation',
      align: 'center',
      render: (t) => (
        <span className="font-bold text-xs text-slate-800">{t.annualQuota} Days / Year</span>
      ),
    },
    {
      key: 'isPaid',
      header: 'Compensation Basis',
      align: 'center',
      render: (t) => (
        <Badge variant={t.isPaid ? 'success' : 'neutral'} size="sm">
          {t.isPaid ? 'Fully Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Policy Guidelines',
      render: (t) => <span className="text-xs text-slate-500">{t.description}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Leave quotas, submission workflows, multi-stage approvals and policy compliance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 pt-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        </div>

        <div className="p-6">
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <DataTable
                columns={requestColumns}
                data={requests}
                isLoading={isLoading}
                search={{
                  value: search,
                  onChange: setSearch,
                  placeholder: 'Search by employee or reason...',
                }}
                emptyTitle="No Leave Requests"
                emptyDescription="No leave applications found matching your criteria."
              />
            </div>
          )}

          {activeTab === 'allocations' && (
            <DataTable
              columns={allocColumns}
              data={allocations}
              isLoading={isLoading}
              emptyTitle="No Allocations Recorded"
              emptyDescription="No leave quotas assigned."
            />
          )}

          {activeTab === 'types' && (
            <DataTable
              columns={typeColumns}
              data={types}
              isLoading={isLoading}
              emptyTitle="No Leave Types"
              emptyDescription="No leave types configured."
            />
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <FormField label="Leave Category" required>
            <Select
              value={applyForm.leaveTypeId}
              onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
              options={types.map((t) => ({ value: t.id, label: `${t.name} Leave (${t.annualQuota}d quota)` }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date" required>
              <Input
                type="date"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Total Days" required>
            <Input
              type="number"
              min={1}
              max={30}
              value={applyForm.totalDays}
              onChange={(e) => setApplyForm({ ...applyForm, totalDays: Number(e.target.value) })}
            />
          </FormField>

          <FormField label="Reason & Description" required>
            <Input
              type="text"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="State reason for absence"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approval / Rejection Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={actionType === 'approve' ? 'Approve Leave Application' : 'Reject Leave Application'}
        maxWidth="sm"
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirming decision for <span className="font-semibold text-slate-900">{selectedRequest?.employeeName}</span> ({selectedRequest?.totalDays} days of {selectedRequest?.leaveTypeName} leave).
          </p>

          <FormField
            label={actionType === 'approve' ? 'Review Comments (Optional)' : 'Rejection Reason'}
            required={actionType === 'reject'}
          >
            <Input
              type="text"
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={actionType === 'approve' ? 'e.g. Approved. Task delegated.' : 'e.g. Incompatible with team deadline.'}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
