import { config } from '@/app/config/env';

export function formatCurrency(amount: number | null | undefined, customSymbol?: string): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }
  const symbol = customSymbol || config.currencySymbol;
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return '—';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateTimeString;
  }
}

export function formatMonthPeriod(periodString: string): string {
  // e.g. "2026-09" -> "September 2026"
  if (!periodString || !periodString.includes('-')) return periodString;
  const [year, month] = periodString.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'brand';

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'present':
    case 'approved':
    case 'disbursed':
    case 'successful':
      return 'success';
    case 'late':
    case 'pending':
    case 'processing':
    case 'half-day':
    case 'probation':
      return 'warning';
    case 'absent':
    case 'rejected':
    case 'failed':
    case 'terminated':
    case 'suspended':
      return 'danger';
    case 'on leave':
    case 'contract':
    case 'draft':
      return 'info';
    default:
      return 'neutral';
  }
}

