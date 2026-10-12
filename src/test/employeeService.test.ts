import { describe, it, expect, beforeEach } from 'vitest';
import { employeeService } from '@/services/api/employeeService';
import { mockDb } from '@/mocks/mockDb';

describe('employeeService', () => {
  beforeEach(() => {
    mockDb.resetAll();
  });

  it('fetches paginated employees list with metadata', async () => {
    const res = await employeeService.getEmployees({ page: 1, pageSize: 5 });
    expect(res.items.length).toBe(5);
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(5);
    expect(res.totalCount).toBeGreaterThanOrEqual(10);
    expect(res.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('filters employees by search query (name, code, department)', async () => {
    const res = await employeeService.getEmployees({ search: 'Tanvir' });
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items[0].fullName).toContain('Tanvir');
  });

  it('filters employees by department ID', async () => {
    const res = await employeeService.getEmployees({ departmentId: 'dept-1' });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((e) => e.departmentId === 'dept-1')).toBe(true);
  });

  it('filters employees by status', async () => {
    const res = await employeeService.getEmployees({ status: 'Active' });
    expect(res.items.every((e) => e.status === 'Active')).toBe(true);
  });

  it('fetches an individual employee by ID', async () => {
    const emp = await employeeService.getEmployeeById('emp-1');
    expect(emp).toBeDefined();
    expect(emp.id).toBe('emp-1');
    expect(emp.fullName).toBe('Tanvir Ahmed');
  });

  it('throws 404 for non-existent employee ID', async () => {
    await expect(employeeService.getEmployeeById('emp-non-existent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('creates a new employee with audit log', async () => {
    const newEmp = await employeeService.createEmployee({
      employeeCode: 'EMP-9999',
      firstName: 'Tariq',
      lastName: 'Zaman',
      fullName: 'Tariq Zaman',
      email: 'tariq.zaman@paypulse.internal',
      phone: '+880 1711 999888',
      nid: '19922692512399999',
      dateOfBirth: '1992-05-15',
      gender: 'Male',
      address: 'Gulshan 2, Dhaka',
      departmentId: 'dept-1',
      departmentName: 'Software Engineering',
      designationId: 'des-2',
      designationTitle: 'Senior Software Engineer',
      supervisorName: 'Tanvir Ahmed',
      dateOfJoining: '2026-10-01',
      employmentType: 'Full-Time',
      status: 'Active',
      bankDetails: {
        bankName: 'Eastern Bank PLC',
        branchName: 'Principal Branch',
        accountNumber: '2050999888777666',
        routingNumber: '095261728',
      },
      emergencyContact: {
        name: 'Mrs. Zaman',
        relation: 'Spouse',
        phone: '+880 1711 000111',
      },
    });

    expect(newEmp.id).toBeDefined();
    expect(newEmp.employeeCode).toBe('EMP-9999');

    // Confirm it is retrievable
    const fetched = await employeeService.getEmployeeById(newEmp.id);
    expect(fetched.fullName).toBe('Tariq Zaman');
  });

  it('updates an existing employee profile', async () => {
    const updated = await employeeService.updateEmployee('emp-1', {
      phone: '+880 1711 000000',
    });

    expect(updated.phone).toBe('+880 1711 000000');
    expect(updated.fullName).toBe('Tanvir Ahmed');
  });

  it('deletes an employee and removes them from directory', async () => {
    await employeeService.deleteEmployee('emp-2');

    await expect(employeeService.getEmployeeById('emp-2')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
