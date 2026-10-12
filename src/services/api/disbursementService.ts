import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { Disbursement, DisbursementStatus, PaginatedResponse, PaginationParams } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface DisbursementFilterParams extends PaginationParams {
  period?: string;
  status?: DisbursementStatus;
  paymentMethod?: string;
}

export const disbursementService = {
  async getDisbursements(params?: DisbursementFilterParams): Promise<PaginatedResponse<Disbursement>> {
    if (config.enableMockApi) {
      await delay(200);
      let list = [...mockDb.getDisbursements()];

      if (params?.period) {
        list = list.filter((d) => d.period === params.period);
      }
      if (params?.status) {
        list = list.filter((d) => d.status === params.status);
      }
      if (params?.paymentMethod) {
        list = list.filter((d) => d.paymentMethod === params.paymentMethod);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.employeeName.toLowerCase().includes(q) ||
            d.transactionReference.toLowerCase().includes(q) ||
            d.bankName.toLowerCase().includes(q)
        );
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<Disbursement>>('/disbursements', params as Record<string, string | number>);
  },

  async getDisbursementById(id: string): Promise<Disbursement> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getDisbursements();
      const item = list.find((d) => d.id === id);
      if (!item) throw { statusCode: 404, message: `Disbursement record ${id} not found.` };
      return item;
    }
    return apiClient.get<Disbursement>(`/disbursements/${id}`);
  },

  async retryDisbursement(id: string): Promise<Disbursement> {
    if (config.enableMockApi) {
      await delay(300);
      const list = mockDb.getDisbursements();
      const index = list.findIndex((d) => d.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Record not found.' };

      const updated: Disbursement = {
        ...list[index],
        status: 'Successful',
        failureReason: undefined,
        transactionReference: `TXN-RETRY-${String(Date.now()).slice(-4)}`,
      };
      list[index] = updated;
      mockDb.saveDisbursements(list);
      return updated;
    }
    return apiClient.post<Disbursement>(`/disbursements/${id}/retry`);
  },
};
