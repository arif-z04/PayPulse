import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { LeaveAllocation, LeaveRequest, LeaveType, PaginatedResponse, PaginationParams } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface LeaveRequestFilterParams extends PaginationParams {
  status?: string;
  employeeId?: string;
  departmentName?: string;
}

export const leaveService = {
  async getLeaveTypes(): Promise<LeaveType[]> {
    if (config.enableMockApi) {
      await delay(100);
      return mockDb.getLeaveTypes();
    }
    return apiClient.get<LeaveType[]>('/leave/types');
  },

  async getLeaveAllocations(employeeId?: string): Promise<LeaveAllocation[]> {
    if (config.enableMockApi) {
      await delay(150);
      const list = mockDb.getLeaveAllocations();
      return employeeId ? list.filter((a) => a.employeeId === employeeId) : list;
    }
    return apiClient.get<LeaveAllocation[]>('/leave/allocations', { employeeId });
  },

  async getLeaveRequests(params?: LeaveRequestFilterParams): Promise<PaginatedResponse<LeaveRequest>> {
    if (config.enableMockApi) {
      await delay(200);
      let list = [...mockDb.getLeaveRequests()];

      if (params?.status) {
        list = list.filter((r) => r.status === params.status);
      }
      if (params?.employeeId) {
        list = list.filter((r) => r.employeeId === params.employeeId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((r) => r.employeeName.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<LeaveRequest>>('/leave/requests', params as Record<string, string | number>);
  },

  async submitLeaveRequest(
    data: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate' | 'approvedBySupervisorDate' | 'approvedByHrDate'>
  ): Promise<LeaveRequest> {
    if (config.enableMockApi) {
      await delay(300);
      const requests = mockDb.getLeaveRequests();
      const newRequest: LeaveRequest = {
        ...data,
        id: `lr-${Date.now()}`,
        status: 'Pending',
        appliedDate: new Date().toISOString(),
      };
      requests.unshift(newRequest);
      mockDb.saveLeaveRequests(requests);

      // Create notification
      const notifs = mockDb.getNotifications();
      notifs.unshift({
        id: `notif-${Date.now()}`,
        title: 'New Leave Application',
        message: `${newRequest.employeeName} applied for ${newRequest.totalDays} day(s) of ${newRequest.leaveTypeName} leave.`,
        category: 'leave',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/leave/requests',
      });
      mockDb.saveNotifications(notifs);

      return newRequest;
    }

    return apiClient.post<LeaveRequest>('/leave/requests', data);
  },

  async approveLeaveRequest(id: string, comment?: string, role: string = 'Supervisor'): Promise<LeaveRequest> {
    if (config.enableMockApi) {
      await delay(250);
      const requests = mockDb.getLeaveRequests();
      const index = requests.findIndex((r) => r.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Leave request not found.' };

      const now = new Date().toISOString();
      const updated: LeaveRequest = {
        ...requests[index],
        status: 'Approved',
        ...(role === 'HR Manager'
          ? { approvedByHrDate: now, hrComment: comment || 'Approved by HR' }
          : { approvedBySupervisorDate: now, supervisorComment: comment || 'Approved by Supervisor' }),
      };

      requests[index] = updated;
      mockDb.saveLeaveRequests(requests);

      mockDb.addAuditLog({
        tableName: 'Leave_Request',
        operation: 'UPDATE',
        recordId: id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'HR Manager',
        ipAddress: '127.0.0.1',
        oldValues: { status: 'Pending' },
        newValues: { status: 'Approved', comment },
        description: `Approved ${updated.leaveTypeName} leave for ${updated.employeeName}`,
      });

      return updated;
    }

    return apiClient.post<LeaveRequest>(`/leave/requests/${id}/approve`, { comment, role });
  },

  async rejectLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    if (config.enableMockApi) {
      await delay(250);
      const requests = mockDb.getLeaveRequests();
      const index = requests.findIndex((r) => r.id === id);
      if (index === -1) throw { statusCode: 404, message: 'Leave request not found.' };

      const updated: LeaveRequest = {
        ...requests[index],
        status: 'Rejected',
        supervisorComment: comment,
      };

      requests[index] = updated;
      mockDb.saveLeaveRequests(requests);

      mockDb.addAuditLog({
        tableName: 'Leave_Request',
        operation: 'UPDATE',
        recordId: id,
        userId: 'usr-current',
        userName: 'Current Operator',
        userRole: 'HR Manager',
        ipAddress: '127.0.0.1',
        oldValues: { status: 'Pending' },
        newValues: { status: 'Rejected', comment },
        description: `Rejected ${updated.leaveTypeName} leave for ${updated.employeeName}: ${comment}`,
      });

      return updated;
    }

    return apiClient.post<LeaveRequest>(`/leave/requests/${id}/reject`, { comment });
  },
};
