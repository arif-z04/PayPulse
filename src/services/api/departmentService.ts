import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { Department } from '@/types';
import { mockDb, delay } from '@/mocks/mockDb';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    if (config.enableMockApi) {
      await delay(150);
      return mockDb.getDepartments();
    }
    return apiClient.get<Department[]>('/departments');
  },

  async getDepartmentById(id: string): Promise<Department> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getDepartments();
      const item = list.find((d) => d.id === id);
      if (!item) throw { statusCode: 404, message: `Department ${id} not found.` };
      return item;
    }
    return apiClient.get<Department>(`/departments/${id}`);
  },

  async createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'employeeCount'>): Promise<Department> {
    if (config.enableMockApi) {
      await delay(250);
      const list = mockDb.getDepartments();
      const newDept: Department = {
        ...data,
        id: `dept-${Date.now()}`,
        employeeCount: 0,
        createdAt: new Date().toISOString(),
      };
      list.push(newDept);
      mockDb.saveDepartments(list);
      return newDept;
    }
    return apiClient.post<Department>('/departments', data);
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    if (config.enableMockApi) {
      await delay(200);
      const list = mockDb.getDepartments();
      const index = list.findIndex((d) => d.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Department not found.' };
      const updated = { ...list[index], ...data };
      list[index] = updated;
      mockDb.saveDepartments(list);
      return updated;
    }
    return apiClient.put<Department>(`/departments/${id}`, data);
  },
};
