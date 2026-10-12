import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { Employee, PaginatedResponse, PaginationParams } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface EmployeeFilterParams extends PaginationParams {
  departmentId?: string;
  designationId?: string;
  status?: string;
  employmentType?: string;
}

export const employeeService = {
  async getEmployees(params?: EmployeeFilterParams): Promise<PaginatedResponse<Employee>> {
    if (config.enableMockApi) {
      await delay(200);
      let list = [...mockDb.getEmployees()];

      if (params?.search) {
        const query = params.search.toLowerCase().trim();
        list = list.filter(
          (e) =>
            e.fullName.toLowerCase().includes(query) ||
            e.employeeCode.toLowerCase().includes(query) ||
            e.email.toLowerCase().includes(query) ||
            e.departmentName.toLowerCase().includes(query) ||
            e.designationTitle.toLowerCase().includes(query)
        );
      }

      if (params?.departmentId) {
        list = list.filter((e) => e.departmentId === params.departmentId);
      }

      if (params?.designationId) {
        list = list.filter((e) => e.designationId === params.designationId);
      }

      if (params?.status) {
        list = list.filter((e) => e.status === params.status);
      }

      if (params?.employmentType) {
        list = list.filter((e) => e.employmentType === params.employmentType);
      }

      if (params?.sortBy) {
        const key = params.sortBy as keyof Employee;
        const order = params.sortOrder === 'desc' ? -1 : 1;
        list.sort((a, b) => {
          const valA = a[key] ?? '';
          const valB = b[key] ?? '';
          return valA > valB ? order : valA < valB ? -order : 0;
        });
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<Employee>>('/employees', params as Record<string, string | number>);
  },

  async getEmployeeById(id: string): Promise<Employee> {
    if (config.enableMockApi) {
      await delay(150);
      const employees = mockDb.getEmployees();
      const emp = employees.find((e) => e.id === id);
      if (!emp) {
        throw { statusCode: 404, message: `Employee with ID ${id} not found.` };
      }
      return emp;
    }

    return apiClient.get<Employee>(`/employees/${id}`);
  },

  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    if (config.enableMockApi) {
      await delay(300);
      const employees = mockDb.getEmployees();
      const newId = `emp-${Date.now()}`;
      const now = new Date().toISOString();

      const newEmp: Employee = {
        ...data,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      employees.unshift(newEmp);
      mockDb.saveEmployees(employees);

      mockDb.addAuditLog({
        tableName: 'Employee',
        operation: 'INSERT',
        recordId: newId,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'HR Manager',
        ipAddress: '127.0.0.1',
        oldValues: null,
        newValues: { employeeCode: newEmp.employeeCode, fullName: newEmp.fullName },
        description: `Created new employee record for ${newEmp.fullName} (${newEmp.employeeCode})`,
      });

      return newEmp;
    }

    return apiClient.post<Employee>('/employees', data);
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    if (config.enableMockApi) {
      await delay(250);
      const employees = mockDb.getEmployees();
      const index = employees.findIndex((e) => e.id === id);
      if (index === -1) {
        throw { statusCode: 404, message: `Employee with ID ${id} not found.` };
      }

      const existing = employees[index];
      const updated: Employee = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      employees[index] = updated;
      mockDb.saveEmployees(employees);

      mockDb.addAuditLog({
        tableName: 'Employee',
        operation: 'UPDATE',
        recordId: id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'HR Manager',
        ipAddress: '127.0.0.1',
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: updated as unknown as Record<string, unknown>,
        description: `Updated profile details for employee ${updated.fullName}`,
      });

      return updated;
    }

    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  async deleteEmployee(id: string): Promise<void> {
    if (config.enableMockApi) {
      await delay(250);
      let employees = mockDb.getEmployees();
      const emp = employees.find((e) => e.id === id);
      employees = employees.filter((e) => e.id !== id);
      mockDb.saveEmployees(employees);

      if (emp) {
        mockDb.addAuditLog({
          tableName: 'Employee',
          operation: 'DELETE',
          recordId: id,
          userId: 'usr-current',
          userName: 'Current Operator',
          userRole: 'HR Manager',
          ipAddress: '127.0.0.1',
          oldValues: { employeeCode: emp.employeeCode, fullName: emp.fullName },
          newValues: null,
          description: `Archived/deleted employee ${emp.fullName}`,
        });
      }
      return;
    }

    return apiClient.delete(`/employees/${id}`);
  },
};
