import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { PaginatedResponse, PaginationParams, Payroll, PayrollStatus } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface PayrollFilterParams extends PaginationParams {
  period?: string;
  status?: PayrollStatus;
  departmentName?: string;
  employeeId?: string;
}

export const payrollService = {
  async getPayrolls(params?: PayrollFilterParams): Promise<PaginatedResponse<Payroll>> {
    if (config.enableMockApi) {
      await delay(200);
      let list = [...mockDb.getPayroll()];

      if (params?.period) {
        list = list.filter((p) => p.payrollPeriod === params.period);
      }
      if (params?.status) {
        list = list.filter((p) => p.status === params.status);
      }
      if (params?.departmentName) {
        list = list.filter((p) => p.departmentName === params.departmentName);
      }
      if (params?.employeeId) {
        list = list.filter((p) => p.employeeId === params.employeeId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.employeeName.toLowerCase().includes(q) ||
            p.employeeCode.toLowerCase().includes(q) ||
            p.departmentName.toLowerCase().includes(q)
        );
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<Payroll>>('/payroll', params as Record<string, string | number>);
  },

  async getPayrollById(id: string): Promise<Payroll> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getPayroll();
      const p = list.find((item) => item.id === id);
      if (!p) throw { statusCode: 404, message: `Payroll record ${id} not found.` };
      return p;
    }
    return apiClient.get<Payroll>(`/payroll/${id}`);
  },

  async approvePayroll(id: string): Promise<Payroll> {
    if (config.enableMockApi) {
      await delay(250);
      const list = mockDb.getPayroll();
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Payroll not found.' };

      const updated: Payroll = {
        ...list[index],
        status: 'Approved',
        approvedAt: new Date().toISOString(),
      };
      list[index] = updated;
      mockDb.savePayroll(list);

      mockDb.addAuditLog({
        tableName: 'Monthly_Payroll',
        operation: 'UPDATE',
        recordId: id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'Payroll Officer',
        ipAddress: '127.0.0.1',
        oldValues: { status: list[index].status },
        newValues: { status: 'Approved' },
        description: `Approved payroll for ${updated.employeeName} (${updated.payrollPeriod})`,
      });

      return updated;
    }

    return apiClient.post<Payroll>(`/payroll/${id}/approve`);
  },

  async disbursePayroll(id: string): Promise<Payroll> {
    if (config.enableMockApi) {
      await delay(300);
      const list = mockDb.getPayroll();
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Payroll not found.' };

      const target = list[index];
      const txnRef = `TXN-${target.payrollPeriod.replace('-', '')}-${String(Date.now()).slice(-4)}`;

      const updated: Payroll = {
        ...target,
        status: 'Disbursed',
        disbursementReference: txnRef,
      };
      list[index] = updated;
      mockDb.savePayroll(list);

      // Create Disbursement Record
      const disbursements = mockDb.getDisbursements();
      disbursements.unshift({
        id: `disb-${Date.now()}`,
        payrollId: target.id,
        employeeId: target.employeeId,
        employeeName: target.employeeName,
        departmentName: target.departmentName,
        amount: target.netSalary,
        period: target.payrollPeriod,
        paymentMethod: 'BEFTN',
        bankName: 'Eastern Bank PLC',
        maskedAccountNumber: target.bankAccountMasked,
        transactionReference: txnRef,
        disbursementDate: new Date().toISOString(),
        status: 'Successful',
      });
      mockDb.saveDisbursements(disbursements);

      mockDb.addAuditLog({
        tableName: 'Monthly_Payroll',
        operation: 'UPDATE',
        recordId: id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'Payroll Officer',
        ipAddress: '127.0.0.1',
        oldValues: { status: target.status },
        newValues: { status: 'Disbursed', disbursementReference: txnRef },
        description: `Disbursed ${target.netSalary} BDT to ${target.employeeName} via BEFTN`,
      });

      return updated;
    }

    return apiClient.post<Payroll>(`/payroll/${id}/disburse`);
  },
};
