import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Edit2 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Modal } from '@/components/common/Modal';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { designationService } from '@/services/api/designationService';
import { departmentService } from '@/services/api/departmentService';
import { formatCurrency } from '@/utils/formatters';
import { Department, Designation } from '@/types';

export const DesignationListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDesig, setSelectedDesig] = useState<Designation | null>(null);
  const [desigForm, setDesigForm] = useState({
    title: '',
    departmentId: '',
    departmentName: '',
    minSalary: 50000,
    maxSalary: 100000,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [desList, deptList] = await Promise.all([
        designationService.getDesignations(),
        departmentService.getDepartments(),
      ]);
      setDesignations(desList);
      setDepartments(deptList);
    } catch {
      toastError('Failed to load designations.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedDesig(null);
    setDesigForm({
      title: '',
      departmentId: departments[0]?.id || '',
      departmentName: departments[0]?.name || '',
      minSalary: 60000,
      maxSalary: 120000,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Designation) => {
    setModalMode('edit');
    setSelectedDesig(d);
    setDesigForm({
      title: d.title,
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      minSalary: d.minSalary,
      maxSalary: d.maxSalary,
      description: d.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigForm.title || !desigForm.departmentId) return;

    const dept = departments.find((d) => d.id === desigForm.departmentId);
    const payload = {
      ...desigForm,
      departmentName: dept ? dept.name : desigForm.departmentName,
      minSalary: Number(desigForm.minSalary),
      maxSalary: Number(desigForm.maxSalary),
    };

    setIsSubmitting(true);
    try {
      if (modalMode === 'edit' && selectedDesig) {
        await designationService.updateDesignation(selectedDesig.id, payload);
        success('Designation updated successfully.');
      } else {
        await designationService.createDesignation(payload);
        success('New designation grade established.');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch {
      toastError('Failed to save designation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = designations.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<Designation>[] = [
    {
      key: 'title',
      header: 'Job Designation Title',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-900 block">{d.title}</span>
          <span className="text-[11px] text-slate-400 block line-clamp-1">{d.description}</span>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{d.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'salaryBand',
      header: 'Salary Grade Band (Min - Max)',
      render: (d) => {
        const spread = d.maxSalary - d.minSalary;
        return (
          <div className="space-y-1 max-w-xs">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>{formatCurrency(d.minSalary)}</span>
              <span>{formatCurrency(d.maxSalary)}</span>
            </div>
            {/* Visual salary band range bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-brand-500 h-1.5 w-full rounded-full" />
            </div>
            <div className="text-[10px] text-slate-400 text-right">Spread: ৳{spread.toLocaleString()}</div>
          </div>
        );
      },
    },
    {
      key: 'employeeCount',
      header: 'Active Staff',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (d) => (
        <span className="font-semibold text-xs text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {d.employeeCount} staff
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '80px',
      render: (d) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(d)}
          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Edit Designation"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Designations & Salary Bands</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal job hierarchies, minimum-maximum compensation bounds and pay scales.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Designation</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search designations by title or department...',
        }}
        emptyTitle="No Designations"
        emptyDescription="No designations found matching your search."
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? 'Edit Job Designation' : 'Create Job Designation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Designation Title" required>
            <Input
              type="text"
              value={desigForm.title}
              onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
            />
          </FormField>

          <FormField label="Assigned Department" required>
            <Select
              value={desigForm.departmentId}
              onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimum Salary (BDT)" required>
              <Input
                type="number"
                value={desigForm.minSalary}
                onChange={(e) => setDesigForm({ ...desigForm, minSalary: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Maximum Salary (BDT)" required>
              <Input
                type="number"
                value={desigForm.maxSalary}
                onChange={(e) => setDesigForm({ ...desigForm, maxSalary: Number(e.target.value) })}
              />
            </FormField>
          </div>

          <FormField label="Job Scope Description">
            <Input
              type="text"
              value={desigForm.description}
              onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })}
              placeholder="Responsibilities and prerequisite competencies"
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
              {isSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Establish Title'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
