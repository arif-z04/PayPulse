import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { salaryService } from '@/services/api/salaryService';
import { employeeService } from '@/services/api/employeeService';
import { formatCurrency } from '@/utils/formatters';
import { Employee, SalaryStructure } from '@/types';

export const SalaryEditPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentSalary, setCurrentSalary] = useState<SalaryStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [houseRentAllowance, setHouseRentAllowance] = useState<number>(0);
  const [medicalAllowance, setMedicalAllowance] = useState<number>(0);
  const [conveyanceAllowance, setConveyanceAllowance] = useState<number>(0);
  const [specialAllowance, setSpecialAllowance] = useState<number>(0);
  const [taxDeductionRate, setTaxDeductionRate] = useState<number>(10);
  const [providentFundRate, setProvidentFundRate] = useState<number>(7.5);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [revisionNote, setRevisionNote] = useState<string>('');

  useEffect(() => {
    if (!employeeId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [emp, sal] = await Promise.all([
          employeeService.getEmployeeById(employeeId),
          salaryService.getSalaryByEmployeeId(employeeId),
        ]);
        setEmployee(emp);
        setCurrentSalary(sal);

        setBasicSalary(sal.basicSalary);
        setHouseRentAllowance(sal.houseRentAllowance);
        setMedicalAllowance(sal.medicalAllowance);
        setConveyanceAllowance(sal.conveyanceAllowance);
        setSpecialAllowance(sal.specialAllowance);
        setTaxDeductionRate(sal.taxDeductionRate);
        setProvidentFundRate(sal.providentFundRate);
        setEffectiveDate(sal.effectiveDate);
      } catch {
        toastError('Failed to load salary structure details.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [employeeId, toastError]);

  // Live Computed values
  const grossSalary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + specialAllowance;
  const taxDeduction = (grossSalary * taxDeductionRate) / 100;
  const pfDeduction = (grossSalary * providentFundRate) / 100;
  const estimatedNetSalary = grossSalary - taxDeduction - pfDeduction;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    if (basicSalary <= 0) {
      toastError('Basic salary must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await salaryService.updateSalaryStructure(employeeId, {
        basicSalary,
        houseRentAllowance,
        medicalAllowance,
        conveyanceAllowance,
        specialAllowance,
        taxDeductionRate,
        providentFundRate,
        effectiveDate,
        revisionNote: revisionNote || 'Routine compensation grade adjustment',
      });
      success(`Salary structure updated for ${employee?.fullName}.`);
      navigate(`/employees/${employeeId}`);
    } catch {
      toastError('Failed to record salary structure revision.');
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
      <Link
        to={`/employees/${employeeId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Employee Profile</span>
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Adjust Salary Structure: {employee?.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {employee?.designationTitle} • {employee?.departmentName} ({employee?.employeeCode})
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Previous Gross
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {formatCurrency(currentSalary?.grossSalary)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Earnings Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Earnings & Allowances (Monthly BDT)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Basic Salary (BDT)" required>
                <Input
                  type="number"
                  min={0}
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                />
              </FormField>

              <FormField label="House Rent Allowance (BDT)" required>
                <Input
                  type="number"
                  min={0}
                  value={houseRentAllowance}
                  onChange={(e) => setHouseRentAllowance(Number(e.target.value))}
                />
              </FormField>

              <FormField label="Medical Allowance (BDT)" required>
                <Input
                  type="number"
                  min={0}
                  value={medicalAllowance}
                  onChange={(e) => setMedicalAllowance(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Conveyance Allowance (BDT)" required>
                <Input
                  type="number"
                  min={0}
                  value={conveyanceAllowance}
                  onChange={(e) => setConveyanceAllowance(Number(e.target.value))}
                />
              </FormField>

              <FormField label="Special / Executive Allowance (BDT)">
                <Input
                  type="number"
                  min={0}
                  value={specialAllowance}
                  onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                />
              </FormField>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Statutory Withholding Rates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Income Tax Rate (%)" required hint="Statutory withholding tax percentage">
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  max={50}
                  value={taxDeductionRate}
                  onChange={(e) => setTaxDeductionRate(Number(e.target.value))}
                />
              </FormField>

              <FormField label="Provident Fund Contribution (%)" required hint="Employee portion matching rate">
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  max={25}
                  value={providentFundRate}
                  onChange={(e) => setProvidentFundRate(Number(e.target.value))}
                />
              </FormField>
            </div>
          </div>

          {/* Effective Date & Revision Note */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Effective Date" required>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormField>

            <FormField label="Audit Revision Note" required hint="Recorded in immutable system audit log">
              <Input
                type="text"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="e.g. Annual compensation grade increment"
              />
            </FormField>
          </div>

          {/* Live Preview Card */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calculator className="w-4 h-4 text-brand-600" />
              <span>Projected Payroll Impact Summary</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-500 block">Computed Gross Salary:</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(grossSalary)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Statutory Deductions (Tax + PF):</span>
                <span className="text-base font-semibold text-rose-600">
                  - {formatCurrency(taxDeduction + pfDeduction)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Net Take-Home:</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(estimatedNetSalary)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate(`/employees/${employeeId}`)}
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
              <span>{isSubmitting ? 'Recording revision...' : 'Commit Salary Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
