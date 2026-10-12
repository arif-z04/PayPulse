import { describe, it, expect, beforeEach } from 'vitest';
import { payrollService } from '@/services/api/payrollService';
import { mockDb } from '@/mocks/mockDb';

describe('payrollService', () => {
  beforeEach(() => {
    mockDb.resetAll();
  });

  it('fetches monthly payroll list with pagination', async () => {
    const res = await payrollService.getPayrolls({ page: 1, pageSize: 5 });
    expect(res.items.length).toBe(5);
    expect(res.page).toBe(1);
    expect(res.totalCount).toBeGreaterThanOrEqual(7);
  });

  it('filters payroll by period and status', async () => {
    const res = await payrollService.getPayrolls({
      period: '2026-09',
      status: 'Approved',
    });
    expect(res.items.every((p) => p.payrollPeriod === '2026-09' && p.status === 'Approved')).toBe(true);
  });

  it('fetches detailed payroll by ID with earnings and deductions breakdown', async () => {
    const payroll = await payrollService.getPayrollById('pay-2026-09-emp-1');
    expect(payroll).toBeDefined();
    expect(payroll.id).toBe('pay-2026-09-emp-1');
    expect(payroll.basicSalary).toBeGreaterThan(0);
    expect(payroll.netSalary).toBeGreaterThan(0);
    expect(payroll.components.length).toBeGreaterThan(0);

    // Verify presence of earnings and deductions
    const earnings = payroll.components.filter((c) => c.type === 'Earning');
    const deductions = payroll.components.filter((c) => c.type === 'Deduction');
    expect(earnings.length).toBeGreaterThan(0);
    expect(deductions.length).toBeGreaterThan(0);
  });

  it('approves a pending payroll record', async () => {
    const updated = await payrollService.approvePayroll('pay-2026-10-emp-5');
    expect(updated.status).toBe('Approved');
    expect(updated.approvedAt).toBeDefined();

    const refetched = await payrollService.getPayrollById('pay-2026-10-emp-5');
    expect(refetched.status).toBe('Approved');
  });

  it('disburses a payroll record and creates a disbursement item', async () => {
    const disbursed = await payrollService.disbursePayroll('pay-2026-09-emp-2');
    expect(disbursed.status).toBe('Disbursed');
    expect(disbursed.disbursementReference).toContain('TXN-');

    const disbursements = mockDb.getDisbursements();
    const createdRecord = disbursements.find((d) => d.payrollId === 'pay-2026-09-emp-2');
    expect(createdRecord).toBeDefined();
    expect(createdRecord?.status).toBe('Successful');
  });
});
