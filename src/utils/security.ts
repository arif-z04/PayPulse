import { UserRole } from '@/types';

export function maskAccountNumber(acc: string | null | undefined): string {
  if (!acc) return '•••• •••• ••••';
  const clean = acc.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const visible = clean.slice(-4);
  return `•••• •••• ${visible}`;
}

export function maskNID(nid: string | null | undefined): string {
  if (!nid) return '•••• •••• ••••';
  if (nid.length <= 4) return nid;
  const visible = nid.slice(-4);
  return `••••-••••-${visible}`;
}

export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
