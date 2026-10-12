import { useState, useEffect, useCallback } from 'react';
import { Employee, PaginatedResponse } from '@/types';
import { employeeService, EmployeeFilterParams } from '@/services/api/employeeService';
import { useToast } from '@/contexts/ToastContext';

export function useEmployees(initialParams?: EmployeeFilterParams) {
  const [data, setData] = useState<PaginatedResponse<Employee>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [params, setParams] = useState<EmployeeFilterParams>(initialParams || { page: 1, pageSize: 10 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await employeeService.getEmployees(params);
      setData(response);
    } catch {
      setIsError(true);
      toastError('Failed to retrieve employee directory.');
    } finally {
      setIsLoading(false);
    }
  }, [params, toastError]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateFilters = (newFilters: Partial<EmployeeFilterParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      toastSuccess('Employee record removed successfully.');
      fetchEmployees();
    } catch {
      toastError('Failed to remove employee record.');
    }
  };

  return {
    employees: data.items,
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      onPageChange: setPage,
    },
    params,
    isLoading,
    isError,
    refetch: fetchEmployees,
    updateFilters,
    deleteEmployee,
  };
}
