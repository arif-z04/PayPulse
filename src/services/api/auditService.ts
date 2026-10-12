import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { AuditLog, AuditOperation, PaginatedResponse, PaginationParams } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface AuditFilterParams extends PaginationParams {
  tableName?: string;
  operation?: AuditOperation;
  userName?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  async getAuditLogs(params?: AuditFilterParams): Promise<PaginatedResponse<AuditLog>> {
    if (config.enableMockApi) {
      await delay(150);
      let list = [...mockDb.getAuditLogs()];

      if (params?.tableName) {
        list = list.filter((a) => a.tableName === params.tableName);
      }
      if (params?.operation) {
        list = list.filter((a) => a.operation === params.operation);
      }
      if (params?.userName) {
        const u = params.userName.toLowerCase();
        list = list.filter((a) => a.userName.toLowerCase().includes(u));
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.tableName.toLowerCase().includes(q) ||
            a.userName.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.recordId.toLowerCase().includes(q)
        );
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<AuditLog>>('/audit', params as Record<string, string | number>);
  },

  async getAuditLogById(id: string): Promise<AuditLog> {
    if (config.enableMockApi) {
      await delay(100);
      const list = mockDb.getAuditLogs();
      const item = list.find((a) => a.id === id);
      if (!item) throw { statusCode: 404, message: `Audit log ${id} not found.` };
      return item;
    }
    return apiClient.get<AuditLog>(`/audit/${id}`);
  },
};
