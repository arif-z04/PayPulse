import { config } from '@/app/config/env';
import { apiClient } from './apiClient';
import { mockDb, delay } from '@/mocks/mockDb';

export interface DepartmentPayrollCost {
  departmentId: string;
  departmentName: string;
  headCount: number;
  grossPayroll: number;
  allowances: number;
  deductions: number;
  netPayroll: number;
}

export interface AttendanceAnalytics {
  date: string;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
}

export interface LeaveUtilization {
  departmentName: string;
  casualUsed: number;
  medicalUsed: number;
  earnedUsed: number;
  totalAllocated: number;
  totalUsed: number;
  utilizationRate: number; // percentage
}

export interface TaxProvidentSummary {
  period: string;
  grossSalaryTotal: number;
  taxWithheldTotal: number;
  providentFundEmployeeTotal: number;
  providentFundEmployerTotal: number;
  totalStatutoryDeposit: number;
}

export interface SalaryBandCompliance {
  designationId: string;
  designationTitle: string;
  departmentName: string;
  minAllowed: number;
  maxAllowed: number;
  actualMin: number;
  actualMax: number;
  actualAvg: number;
  compliantCount: number;
  totalEmployees: number;
  isCompliant: boolean;
}

export const reportService = {
  async getDepartmentPayrollCost(period: string = '2026-08'): Promise<DepartmentPayrollCost[]> {
    if (config.enableMockApi) {
      await delay(200);
      return [
        {
          departmentId: 'dept-1',
          departmentName: 'Software Engineering',
          headCount: 6,
          grossPayroll: 683000,
          allowances: 231000,
          deductions: 89555,
          netPayroll: 593445,
        },
        {
          departmentId: 'dept-2',
          departmentName: 'Human Resources & Talent',
          headCount: 2,
          grossPayroll: 248000,
          allowances: 96000,
          deductions: 39000,
          netPayroll: 209000,
        },
        {
          departmentId: 'dept-3',
          departmentName: 'Finance & Accounts',
          headCount: 2,
          grossPayroll: 262000,
          allowances: 104500,
          deductions: 42170,
          netPayroll: 219830,
        },
        {
          departmentId: 'dept-4',
          departmentName: 'Operations & Logistics',
          headCount: 1,
          grossPayroll: 152000,
          allowances: 62000,
          deductions: 26600,
          netPayroll: 125400,
        },
        {
          departmentId: 'dept-5',
          departmentName: 'Quality Assurance & Security',
          headCount: 2,
          grossPayroll: 205000,
          allowances: 83000,
          deductions: 31225,
          netPayroll: 173775,
        },
      ];
    }
    return apiClient.get<DepartmentPayrollCost[]>('/reports/payroll-cost', { period });
  },

  async getAttendanceTrend(): Promise<AttendanceAnalytics[]> {
    if (config.enableMockApi) {
      await delay(150);
      return [
        { date: '2026-10-01', present: 11, late: 1, halfDay: 0, absent: 0 },
        { date: '2026-10-02', present: 12, late: 0, halfDay: 0, absent: 0 },
        { date: '2026-10-03', present: 10, late: 1, halfDay: 1, absent: 0 },
        { date: '2026-10-04', present: 11, late: 0, halfDay: 0, absent: 1 },
        { date: '2026-10-05', present: 9, late: 2, halfDay: 1, absent: 0 },
        { date: '2026-10-06', present: 8, late: 2, halfDay: 1, absent: 1 },
      ];
    }
    return apiClient.get<AttendanceAnalytics[]>('/reports/attendance-trend');
  },

  async getLeaveUtilization(): Promise<LeaveUtilization[]> {
    if (config.enableMockApi) {
      await delay(150);
      return [
        {
          departmentName: 'Software Engineering',
          casualUsed: 11,
          medicalUsed: 6,
          earnedUsed: 19,
          totalAllocated: 288,
          totalUsed: 36,
          utilizationRate: 12.5,
        },
        {
          departmentName: 'Human Resources & Talent',
          casualUsed: 4,
          medicalUsed: 2,
          earnedUsed: 7,
          totalAllocated: 96,
          totalUsed: 13,
          utilizationRate: 13.5,
        },
        {
          departmentName: 'Finance & Accounts',
          casualUsed: 5,
          medicalUsed: 3,
          earnedUsed: 6,
          totalAllocated: 96,
          totalUsed: 14,
          utilizationRate: 14.6,
        },
        {
          departmentName: 'Operations & Logistics',
          casualUsed: 3,
          medicalUsed: 1,
          earnedUsed: 4,
          totalAllocated: 48,
          totalUsed: 8,
          utilizationRate: 16.7,
        },
        {
          departmentName: 'Quality Assurance & Security',
          casualUsed: 4,
          medicalUsed: 4,
          earnedUsed: 5,
          totalAllocated: 96,
          totalUsed: 13,
          utilizationRate: 13.5,
        },
      ];
    }
    return apiClient.get<LeaveUtilization[]>('/reports/leave-utilization');
  },

  async getTaxProvidentSummary(period: string = '2026-08'): Promise<TaxProvidentSummary> {
    if (config.enableMockApi) {
      await delay(150);
      return {
        period,
        grossSalaryTotal: 1550000,
        taxWithheldTotal: 136200,
        providentFundEmployeeTotal: 116250,
        providentFundEmployerTotal: 116250,
        totalStatutoryDeposit: 368700,
      };
    }
    return apiClient.get<TaxProvidentSummary>('/reports/tax-provident', { period });
  },

  async getSalaryBandCompliance(): Promise<SalaryBandCompliance[]> {
    if (config.enableMockApi) {
      await delay(150);
      const designations = mockDb.getDesignations();
      return designations.map((d) => ({
        designationId: d.id,
        designationTitle: d.title,
        departmentName: d.departmentName,
        minAllowed: d.minSalary,
        maxAllowed: d.maxSalary,
        actualMin: d.minSalary + 5000,
        actualMax: d.maxSalary - 5000,
        actualAvg: Math.round((d.minSalary + d.maxSalary) / 2),
        compliantCount: d.employeeCount,
        totalEmployees: d.employeeCount,
        isCompliant: true,
      }));
    }
    return apiClient.get<SalaryBandCompliance[]>('/reports/salary-band-compliance');
  },
};
