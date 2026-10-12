using System.Reflection;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Domain.Entities;

namespace PayPulse.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveAllocation> LeaveAllocations => Set<LeaveAllocation>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<MonthlyPayroll> MonthlyPayrolls => Set<MonthlyPayroll>();
    public DbSet<PayrollComponentDetail> PayrollComponentDetails => Set<PayrollComponentDetail>();
    public DbSet<DisbursementRecord> DisbursementRecords => Set<DisbursementRecord>();
    public DbSet<SystemAuditLog> SystemAuditLogs => Set<SystemAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
