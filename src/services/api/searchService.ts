import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { mockDb, delay } from '@/mocks/mockDb';

export interface GlobalSearchResult {
  type: 'employee' | 'department' | 'payroll' | 'leave' | 'report';
  title: string;
  subtitle: string;
  url: string;
}

export const searchService = {
  async searchGlobal(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    if (config.enableMockApi) {
      await delay(120);
      const q = query.toLowerCase().trim();
      const results: GlobalSearchResult[] = [];

      // Employees
      const employees = mockDb.getEmployees();
      employees.forEach((emp) => {
        if (
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeCode.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'employee',
            title: emp.fullName,
            subtitle: `${emp.employeeCode} • ${emp.designationTitle} (${emp.departmentName})`,
            url: `/employees/${emp.id}`,
          });
        }
      });

      // Departments
      const depts = mockDb.getDepartments();
      depts.forEach((d) => {
        if (d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) {
          results.push({
            type: 'department',
            title: d.name,
            subtitle: `Code: ${d.code} • ${d.employeeCount} team members`,
            url: `/departments/${d.id}`,
          });
        }
      });

      // Payroll
      const payrolls = mockDb.getPayroll();
      payrolls.forEach((p) => {
        if (p.employeeName.toLowerCase().includes(q) || p.payrollPeriod.includes(q)) {
          results.push({
            type: 'payroll',
            title: `Payroll ${p.payrollPeriod} - ${p.employeeName}`,
            subtitle: `Net: ৳${p.netSalary.toLocaleString()} • Status: ${p.status}`,
            url: `/payroll/${p.id}`,
          });
        }
      });

      // Reports matching
      if ('payroll cost tax attendance leave'.includes(q)) {
        results.push({
          type: 'report',
          title: 'Departmental Payroll Cost Report',
          subtitle: 'Analytics & Financial statements',
          url: '/reports/payroll',
        });
      }

      return results.slice(0, 8);
    }

    return apiClient.get<GlobalSearchResult[]>('/search', { q: query });
  },
};
