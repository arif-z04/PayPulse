import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User, CreditCard, ShieldAlert } from 'lucide-react';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { employeeService } from '@/services/api/employeeService';
import { departmentService } from '@/services/api/departmentService';
import { designationService } from '@/services/api/designationService';
import { Department, Designation, Employee, EmploymentStatus, EmploymentType, ApiError } from '@/types';

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  // Form Fields
  const [formData, setFormData] = useState(() => ({
    employeeCode: 'EMP-10' + Math.floor(10 + Math.random() * 90),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nid: '',
    dateOfBirth: '1995-01-01',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    departmentId: '',
    departmentName: '',
    designationId: '',
    designationTitle: '',
    supervisorName: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time' as EmploymentType,
    status: 'Active' as EmploymentStatus,
    bankName: 'Eastern Bank PLC',
    branchName: 'Principal Branch, Dhaka',
    accountNumber: '',
    routingNumber: '095261728',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  }));

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [depts, desigs] = await Promise.all([
          departmentService.getDepartments(),
          designationService.getDesignations(),
        ]);
        setDepartments(depts);
        setDesignations(desigs);

        if (isEditMode && id) {
          const emp = await employeeService.getEmployeeById(id);
          setFormData({
            employeeCode: emp.employeeCode,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            nid: emp.nid,
            dateOfBirth: emp.dateOfBirth,
            gender: emp.gender,
            address: emp.address,
            departmentId: emp.departmentId,
            departmentName: emp.departmentName,
            designationId: emp.designationId,
            designationTitle: emp.designationTitle,
            supervisorName: emp.supervisorName || '',
            dateOfJoining: emp.dateOfJoining,
            employmentType: emp.employmentType,
            status: emp.status,
            bankName: emp.bankDetails?.bankName || 'Eastern Bank PLC',
            branchName: emp.bankDetails?.branchName || '',
            accountNumber: emp.bankDetails?.accountNumber || '',
            routingNumber: emp.bankDetails?.routingNumber || '095261728',
            emergencyName: emp.emergencyContact?.name || '',
            emergencyRelation: emp.emergencyContact?.relation || '',
            emergencyPhone: emp.emergencyContact?.phone || '',
          });
        }
      } catch {
        toastError('Failed to initialize form metadata.');
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [id, isEditMode, toastError]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Corporate email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid corporate email format.';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone contact is required.';
    if (!formData.nid.trim()) errors.nid = 'National ID is required for compliance.';
    if (!formData.departmentId) errors.departmentId = 'Department selection is mandatory.';
    if (!formData.designationId) errors.designationId = 'Designation selection is mandatory.';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Bank account number is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDepartmentChange = (deptId: string) => {
    const selectedDept = departments.find((d) => d.id === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentName: selectedDept ? selectedDept.name : '',
    }));
    if (fieldErrors.departmentId) setFieldErrors((prev) => ({ ...prev, departmentId: '' }));
  };

  const handleDesignationChange = (desigId: string) => {
    const selectedDesig = designations.find((d) => d.id === desigId);
    setFormData((prev) => ({
      ...prev,
      designationId: desigId,
      designationTitle: selectedDesig ? selectedDesig.title : '',
    }));
    if (fieldErrors.designationId) setFieldErrors((prev) => ({ ...prev, designationId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeCode: formData.employeeCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        nid: formData.nid,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        departmentId: formData.departmentId,
        departmentName: formData.departmentName,
        designationId: formData.designationId,
        designationTitle: formData.designationTitle,
        supervisorName: formData.supervisorName || undefined,
        dateOfJoining: formData.dateOfJoining,
        employmentType: formData.employmentType,
        status: formData.status,
        bankDetails: {
          bankName: formData.bankName,
          branchName: formData.branchName,
          accountNumber: formData.accountNumber,
          routingNumber: formData.routingNumber,
        },
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
      };

      if (isEditMode && id) {
        await employeeService.updateEmployee(id, payload);
        success('Employee details updated successfully.');
        navigate(`/employees/${id}`);
      } else {
        const created = await employeeService.createEmployee(payload);
        success('New employee record registered successfully.');
        navigate(`/employees/${created.id}`);
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.message || 'Operation failed. Check server connection.');
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, msgs]) => {
          mapped[k] = msgs[0];
        });
        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee List</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {isEditMode ? `Edit Profile: ${formData.firstName} ${formData.lastName}` : 'Onboard New Employee'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter official human resources, job grade, and banking settlement credentials.
        </p>
      </div>

      {generalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: IDENTITY & PERSONAL */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">1. Personal & Identity Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Employee Code" required>
              <Input
                type="text"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                disabled={isEditMode}
              />
            </FormField>
            <FormField label="First Name" required error={fieldErrors.firstName}>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                hasError={!!fieldErrors.firstName}
              />
            </FormField>
            <FormField label="Last Name" required error={fieldErrors.lastName}>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                hasError={!!fieldErrors.lastName}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Corporate Work Email" required error={fieldErrors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                hasError={!!fieldErrors.email}
              />
            </FormField>
            <FormField label="Phone Number" required error={fieldErrors.phone}>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                hasError={!!fieldErrors.phone}
              />
            </FormField>
            <FormField label="National ID (NID)" required error={fieldErrors.nid}>
              <Input
                type="text"
                value={formData.nid}
                onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                hasError={!!fieldErrors.nid}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date of Birth" required>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </FormField>
            <FormField label="Gender" required>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Residential Address" required>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House, Road, Area, City"
            />
          </FormField>
        </div>

        {/* SECTION 2: ORGANIZATIONAL ROLE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">2. Organization & Employment</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Department" required error={fieldErrors.departmentId}>
              <Select
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                placeholder="Select Department"
                options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                hasError={!!fieldErrors.departmentId}
              />
            </FormField>

            <FormField label="Designation" required error={fieldErrors.designationId}>
              <Select
                value={formData.designationId}
                onChange={(e) => handleDesignationChange(e.target.value)}
                placeholder="Select Designation"
                options={designations.map((d) => ({ value: d.id, label: `${d.title} - ${d.departmentName}` }))}
                hasError={!!fieldErrors.designationId}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Employment Type" required>
              <Select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                options={[
                  { value: 'Full-Time', label: 'Full-Time' },
                  { value: 'Part-Time', label: 'Part-Time' },
                  { value: 'Contract', label: 'Contract' },
                  { value: 'Probation', label: 'Probation' },
                ]}
              />
            </FormField>

            <FormField label="Date of Joining" required>
              <Input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
              />
            </FormField>

            <FormField label="Employment Status" required>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'On Leave', label: 'On Leave' },
                  { value: 'Terminated', label: 'Terminated' },
                  { value: 'Suspended', label: 'Suspended' },
                ]}
              />
            </FormField>
          </div>
        </div>

        {/* SECTION 3: BANKING DETAILS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">3. Bank Account & Settlement</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bank Name" required>
              <Input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </FormField>
            <FormField label="Branch Name" required>
              <Input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                placeholder="Branch name"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Account Number" required error={fieldErrors.accountNumber}>
              <Input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g. 1041060938472"
                hasError={!!fieldErrors.accountNumber}
              />
            </FormField>
            <FormField label="Routing Number" required>
              <Input
                type="text"
                value={formData.routingNumber}
                onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              />
            </FormField>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving changes...' : isEditMode ? 'Update Employee Record' : 'Register Employee'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
