import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { PaginatedResponse, PaginationParams, SalaryStructure } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export const salaryService = {
  async getSalaries(params?: PaginationParams): Promise<PaginatedResponse<SalaryStructure>> {
    if (config.enableMockApi) {
      await delay(150);
      let list = [...mockDb.getSalaries()];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((s) => s.employeeName.toLowerCase().includes(q));
      }
      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }
    return apiClient.get<PaginatedResponse<SalaryStructure>>('/salaries', params as Record<string, string | number>);
  },

  async getSalaryByEmployeeId(employeeId: string): Promise<SalaryStructure> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getSalaries();
      const current = list.find((s) => s.employeeId === employeeId && s.status === 'Active');
      if (!current) {
        throw { statusCode: 404, message: `Salary structure for employee ${employeeId} not found.` };
      }
      return current;
    }
    return apiClient.get<SalaryStructure>(`/salaries/employee/${employeeId}`);
  },

  async updateSalaryStructure(
    employeeId: string,
    data: Partial<SalaryStructure>
  ): Promise<SalaryStructure> {
    if (config.enableMockApi) {
      await delay(300);
      const list = mockDb.getSalaries();
      const index = list.findIndex((s) => s.employeeId === employeeId && s.status === 'Active');

      if (index === -1) {
        throw { statusCode: 404, message: 'Salary structure not found.' };
      }

      const existing = list[index];
      // Compute gross & estimated net for preview UI
      const basic = data.basicSalary ?? existing.basicSalary;
      const houseRent = data.houseRentAllowance ?? existing.houseRentAllowance;
      const medical = data.medicalAllowance ?? existing.medicalAllowance;
      const conveyance = data.conveyanceAllowance ?? existing.conveyanceAllowance;
      const special = data.specialAllowance ?? existing.specialAllowance;
      const taxRate = data.taxDeductionRate ?? existing.taxDeductionRate;
      const pfRate = data.providentFundRate ?? existing.providentFundRate;

      const gross = basic + houseRent + medical + conveyance + special;
      const tax = (gross * taxRate) / 100;
      const pf = (gross * pfRate) / 100;
      const estimatedNet = gross - tax - pf;

      const updated: SalaryStructure = {
        ...existing,
        ...data,
        basicSalary: basic,
        houseRentAllowance: houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: conveyance,
        specialAllowance: special,
        taxDeductionRate: taxRate,
        providentFundRate: pfRate,
        grossSalary: gross,
        estimatedNetSalary: estimatedNet,
        effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
      };

      list[index] = updated;
      mockDb.saveSalaries(list);

      mockDb.addAuditLog({
        tableName: 'Salary_Structure',
        operation: 'UPDATE',
        recordId: updated.id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'Payroll Officer',
        ipAddress: '127.0.0.1',
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: updated as unknown as Record<string, unknown>,
        description: `Modified salary structure for ${updated.employeeName}: Gross ${gross} BDT`,
      });

      return updated;
    }

    return apiClient.put<SalaryStructure>(`/salaries/employee/${employeeId}`, data);
  },
};
