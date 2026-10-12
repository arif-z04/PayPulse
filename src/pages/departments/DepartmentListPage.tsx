import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, MapPin, Eye, Edit2 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Modal } from '@/components/common/Modal';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { departmentService } from '@/services/api/departmentService';
import { Department } from '@/types';

export const DepartmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', location: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch {
      toastError('Failed to retrieve department directory.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDepts();
  }, [fetchDepts]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedDept(null);
    setDeptForm({ code: '', name: '', location: 'Dhaka Tower', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Department) => {
    setModalMode('edit');
    setSelectedDept(d);
    setDeptForm({ code: d.code, name: d.name, location: d.location, description: d.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'edit' && selectedDept) {
        await departmentService.updateDepartment(selectedDept.id, deptForm);
        success('Department details updated.');
      } else {
        await departmentService.createDepartment(deptForm);
        success('New corporate department established.');
      }
      setIsModalOpen(false);
      fetchDepts();
    } catch {
      toastError('Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      width: '100px',
      render: (d) => (
        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
          {d.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      render: (d) => (
        <div>
          <Link
            to={`/departments/${d.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block"
          >
            {d.name}
          </Link>
          <span className="text-[11px] text-slate-400 block line-clamp-1">{d.description}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Office Facility Location',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{d.location}</span>
        </div>
      ),
    },
    {
      key: 'headOfDepartmentName',
      header: 'Head of Department',
      render: (d) => (
        <span className="text-xs font-medium text-slate-800">
          {d.headOfDepartmentName || 'Pending Appointment'}
        </span>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Personnel',
      sortable: true,
      align: 'center',
      render: (d) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
          <Users className="w-3 h-3 text-slate-500" />
          {d.employeeCount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '100px',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/departments/${d.id}`)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(d)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Department"
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Department Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational divisions, cost centers, locations and department heads.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search departments by name, code, location...',
        }}
        emptyTitle="No Departments"
        emptyDescription="No departments found matching your search."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? 'Edit Department' : 'Establish New Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department Code" required>
              <Input
                type="text"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ENG"
                maxLength={6}
              />
            </FormField>
            <FormField label="Department Name" required>
              <Input
                type="text"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Software Engineering"
              />
            </FormField>
          </div>

          <FormField label="Office Facility Location" required>
            <Input
              type="text"
              value={deptForm.location}
              onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
              placeholder="e.g. Dhaka Tower, 11th Floor"
            />
          </FormField>

          <FormField label="Operational Description">
            <Input
              type="text"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Primary mission and responsibilities"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Establish Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
