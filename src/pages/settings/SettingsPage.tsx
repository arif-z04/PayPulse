import React, { useState } from 'react';
import { Building2, Coins, RotateCcw, Save } from 'lucide-react';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { config } from '@/app/config/env';
import { mockDb } from '@/mocks/mockDb';

export const SettingsPage: React.FC = () => {
  const { success, info } = useToast();
  const [companyName, setCompanyName] = useState(config.company.name);
  const [address, setAddress] = useState(config.company.address);
  const [taxId, setTaxId] = useState(config.company.taxId);
  const [email, setEmail] = useState(config.company.email);
  const [phone, setPhone] = useState(config.company.phone);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);
  const [cutoffDay, setCutoffDay] = useState(25);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('System configuration parameters saved.');
    }, 300);
  };

  const handleResetData = () => {
    mockDb.resetAll();
    setIsResetDialogOpen(false);
    info('Mock database reset to default seed state.');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Corporate entity metadata, statutory defaults, and data environment controls.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">Corporate Entity Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Legal Registered Name" required>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </FormField>

            <FormField label="Tax Identification (TIN / BIN)" required>
              <Input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Headquarter Physical Address" required>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Official Payroll Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Direct Hotline / Telephone" required>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Payroll Policy Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Coins className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">Payroll Cycle Configuration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Display Currency Symbol" required>
              <Select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                options={[
                  { value: '৳', label: '৳ (BDT - Bangladeshi Taka)' },
                  { value: '$', label: '$ (USD - US Dollar)' },
                  { value: '€', label: '€ (EUR - Euro)' },
                ]}
              />
            </FormField>

            <FormField label="Monthly Cutoff Day (1-31)" required hint="Attendance lock cutoff date">
              <Input
                type="number"
                min={1}
                max={31}
                value={cutoffDay}
                onChange={(e) => setCutoffDay(Number(e.target.value))}
              />
            </FormField>

            <FormField label="BEFTN Clearing Routing">
              <Input type="text" value="095261728" disabled />
            </FormField>
          </div>
        </div>

        {/* Data Store Reset Action */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Restore Default Mock Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reset all in-browser employees, payroll records, leave allocations, and audit logs to original factory seeds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Mock Database</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetData}
        title="Reset Entire Mock Database"
        message="This will reset all modified employee records, submitted leave requests, and payroll entries back to the original initial seed data. Are you sure?"
        confirmText="Reset to Defaults"
        variant="danger"
      />
    </div>
  );
};
