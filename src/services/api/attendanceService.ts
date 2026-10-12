import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { AttendanceRecord, AttendanceStatus, PaginatedResponse, PaginationParams } from '@/types';
import { mockDb, paginateArray, delay } from '@/mocks/mockDb';

export interface AttendanceFilterParams extends PaginationParams {
  date?: string;
  employeeId?: string;
  departmentName?: string;
  status?: AttendanceStatus;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  attendanceRate: number; // percentage
}

export const attendanceService = {
  async getAttendance(params?: AttendanceFilterParams): Promise<PaginatedResponse<AttendanceRecord>> {
    if (config.enableMockApi) {
      await delay(200);
      let list = [...mockDb.getAttendance()];

      if (params?.date) {
        list = list.filter((a) => a.date === params.date);
      }
      if (params?.employeeId) {
        list = list.filter((a) => a.employeeId === params.employeeId);
      }
      if (params?.departmentName) {
        list = list.filter((a) => a.departmentName === params.departmentName);
      }
      if (params?.status) {
        list = list.filter((a) => a.status === params.status);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((a) => a.employeeName.toLowerCase().includes(q) || a.employeeCode.toLowerCase().includes(q));
      }

      return paginateArray(list, params?.page || 1, params?.pageSize || 10);
    }

    return apiClient.get<PaginatedResponse<AttendanceRecord>>('/attendance', params as Record<string, string | number>);
  },

  async getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
    if (config.enableMockApi) {
      await delay(150);
      const queryDate = date || '2026-10-06';
      const all = mockDb.getAttendance().filter((a) => a.date === queryDate);
      const total = all.length || 12;
      const present = all.filter((a) => a.status === 'Present').length;
      const late = all.filter((a) => a.status === 'Late').length;
      const halfDay = all.filter((a) => a.status === 'Half-Day').length;
      const absent = all.filter((a) => a.status === 'Absent').length;
      const attendanceRate = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 0;

      return { total, present, late, halfDay, absent, attendanceRate };
    }

    return apiClient.get<AttendanceSummary>('/attendance/summary', { date });
  },

  async checkIn(employeeId: string): Promise<AttendanceRecord> {
    if (config.enableMockApi) {
      await delay(250);
      const list = mockDb.getAttendance();
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = list.findIndex((a) => a.employeeId === employeeId && a.date === today);

      const employees = mockDb.getEmployees();
      const emp = employees.find((e) => e.id === employeeId);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeCode: emp?.employeeCode || 'EMP-1001',
        employeeName: emp?.fullName || 'Current User',
        departmentName: emp?.departmentName || 'Engineering',
        date: today,
        checkInTime: timeStr,
        checkOutTime: null,
        workingHours: 0,
        overtimeHours: 0,
        status: now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15) ? 'Late' : 'Present',
        remarks: 'Self web portal punch-in',
      };

      if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], checkInTime: timeStr, status: newRecord.status };
      } else {
        list.unshift(newRecord);
      }

      mockDb.saveAttendance(list);
      return existingIndex >= 0 ? list[existingIndex] : newRecord;
    }

    return apiClient.post<AttendanceRecord>('/attendance/check-in', { employeeId });
  },

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    if (config.enableMockApi) {
      await delay(250);
      const list = mockDb.getAttendance();
      const today = new Date().toISOString().split('T')[0];
      const index = list.findIndex((a) => a.employeeId === employeeId && a.date === today);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (index >= 0) {
        list[index] = {
          ...list[index],
          checkOutTime: timeStr,
          workingHours: 8.5,
          overtimeHours: 0.5,
        };
        mockDb.saveAttendance(list);
        return list[index];
      }

      throw { statusCode: 400, message: 'Must check-in before check-out.' };
    }

    return apiClient.post<AttendanceRecord>('/attendance/check-out', { employeeId });
  },
};
