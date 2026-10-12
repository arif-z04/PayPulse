import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Award } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { departmentService } from '@/services/api/departmentService';
import { designationService } from '@/services/api/designationService';
import { employeeService } from '@/services/api/employeeService';
import { Department, Designation, Employee } from '@/types';

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const dept = await departmentService.getDepartmentById(id);
        setDepartment(dept);

        const [desRes, empRes] = await Promise.all([
          designationService.getDesignations(id),
          employeeService.getEmployees({ departmentId: id, pageSize: 50 }),
        ]);
        setDesignations(desRes);
        setEmployees(empRes.items);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !department) {
    return (
      <ErrorState
        title="Department Not Found"
        message="The requested department profile could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/departments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Departments</span>
      </Link>

      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 rounded">
              {department.code}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{department.name}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">{department.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {department.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-slate-900">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              {employees.length} Active Staff Members
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Designations */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Assigned Job Designations</h3>
            </div>
            <Badge variant="neutral">{designations.length} Titles</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {designations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No designations mapped to this department yet.</p>
            ) : (
              designations.map((des) => (
                <div key={des.id} className="py-2.5 text-xs">
                  <p className="font-semibold text-slate-800">{des.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Band: ৳{des.minSalary.toLocaleString()} - ৳{des.maxSalary.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Member roster */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Department Team Members</h3>
            <Link to="/employees" className="text-xs font-semibold text-brand-600">
              Manage in Directory
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No employees currently assigned.</p>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                      {emp.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 truncate block"
                      >
                        {emp.fullName}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate">{emp.designationTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={emp.status === 'Active' ? 'success' : 'neutral'} size="sm">
                      {emp.status}
                    </Badge>
                    <Link
                      to={`/employees/${emp.id}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
