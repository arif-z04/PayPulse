import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatMonthPeriod,
  getStatusBadgeVariant,
} from '@/utils/formatters';
import { maskAccountNumber, maskNID, hasRole } from '@/utils/security';

describe('Formatters', () => {
  it('formats currency correctly in BDT format', () => {
    expect(formatCurrency(85000)).toBe('৳ 85,000.00');
    expect(formatCurrency(0)).toBe('৳ 0.00');
    expect(formatCurrency(125000.5)).toBe('৳ 125,000.50');
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('supports custom currency symbols', () => {
    expect(formatCurrency(1500, '$')).toBe('$ 1,500.00');
  });

  it('formats numbers with comma separators', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(null)).toBe('0');
  });

  it('formats standard dates', () => {
    expect(formatDate('2026-09-01')).toContain('Sep');
    expect(formatDate('2026-09-01')).toContain('2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats date and time with 12-hour clock', () => {
    expect(formatDateTime('2026-09-01T14:30:00Z')).toContain('Sep');
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('formats month period', () => {
    expect(formatMonthPeriod('2026-09')).toBe('September 2026');
    expect(formatMonthPeriod('2026-01')).toBe('January 2026');
  });

  it('maps entity statuses to badge color variants', () => {
    expect(getStatusBadgeVariant('Active')).toBe('success');
    expect(getStatusBadgeVariant('Approved')).toBe('success');
    expect(getStatusBadgeVariant('Disbursed')).toBe('success');
    expect(getStatusBadgeVariant('Pending')).toBe('warning');
    expect(getStatusBadgeVariant('Late')).toBe('warning');
    expect(getStatusBadgeVariant('Absent')).toBe('danger');
    expect(getStatusBadgeVariant('Rejected')).toBe('danger');
    expect(getStatusBadgeVariant('Terminated')).toBe('danger');
    expect(getStatusBadgeVariant('Draft')).toBe('info');
    expect(getStatusBadgeVariant('Unknown')).toBe('neutral');
  });
});

describe('Security Utilities', () => {
  it('masks bank account numbers properly', () => {
    expect(maskAccountNumber('2050123456789012')).toBe('•••• •••• 9012');
    expect(maskAccountNumber('1234')).toBe('1234');
    expect(maskAccountNumber('')).toBe('•••• •••• ••••');
  });

  it('masks national ID numbers properly', () => {
    expect(maskNID('19902692512345678')).toBe('••••-••••-5678');
    expect(maskNID('1234')).toBe('1234');
    expect(maskNID('')).toBe('•••• •••• ••••');
  });

  it('evaluates user role permissions correctly', () => {
    expect(hasRole('System Administrator', ['System Administrator', 'HR Manager'])).toBe(true);
    expect(hasRole('Employee', ['Payroll Officer'])).toBe(false);
    expect(hasRole(undefined, ['Employee'])).toBe(false);
  });
});
