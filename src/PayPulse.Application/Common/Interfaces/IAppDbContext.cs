using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PayPulse.Domain.Entities;

namespace PayPulse.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<UserAccount> Users { get; }
    DbSet<Department> Departments { get; }
    DbSet<Designation> Designations { get; }
    DbSet<Employee> Employees { get; }
    DbSet<SalaryStructure> SalaryStructures { get; }
    DbSet<AttendanceLog> AttendanceLogs { get; }
    DbSet<LeaveType> LeaveTypes { get; }
    DbSet<LeaveAllocation> LeaveAllocations { get; }
    DbSet<LeaveRequest> LeaveRequests { get; }
    DbSet<MonthlyPayroll> MonthlyPayrolls { get; }
    DbSet<PayrollComponentDetail> PayrollComponentDetails { get; }
    DbSet<DisbursementRecord> DisbursementRecords { get; }
    DbSet<SystemAuditLog> SystemAuditLogs { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
