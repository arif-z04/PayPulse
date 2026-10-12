import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { Designation } from '@/types';
import { mockDb, delay } from '@/mocks/mockDb';

export const designationService = {
  async getDesignations(departmentId?: string): Promise<Designation[]> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getDesignations();
      return departmentId ? list.filter((d) => d.departmentId === departmentId) : list;
    }
    return apiClient.get<Designation[]>('/designations', { departmentId });
  },

  async createDesignation(data: Omit<Designation, 'id' | 'employeeCount'>): Promise<Designation> {
    if (config.enableMockApi) {
      await delay(250);
      const list = mockDb.getDesignations();
      const newDes: Designation = {
        ...data,
        id: `des-${Date.now()}`,
        employeeCount: 0,
      };
      list.push(newDes);
      mockDb.saveDesignations(list);
      return newDes;
    }
    return apiClient.post<Designation>('/designations', data);
  },

  async updateDesignation(id: string, data: Partial<Designation>): Promise<Designation> {
    if (config.enableMockApi) {
      await delay(200);
      const list = mockDb.getDesignations();
      const index = list.findIndex((d) => d.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Designation not found.' };
      const updated = { ...list[index], ...data };
      list[index] = updated;
      mockDb.saveDesignations(list);
      return updated;
    }
    return apiClient.put<Designation>(`/designations/${id}`, data);
  },
};
