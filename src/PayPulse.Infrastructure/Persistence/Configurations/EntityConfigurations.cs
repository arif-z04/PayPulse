using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PayPulse.Domain.Entities;

namespace PayPulse.Infrastructure.Persistence.Configurations;

public class UserAccountConfiguration : IEntityTypeConfiguration<UserAccount>
{
    public void Configure(EntityTypeBuilder<UserAccount> builder)
    {
        builder.ToTable("User_Account");
        builder.HasKey(e => e.UserId);
        builder.Property(e => e.UserId).HasColumnName("User_ID");
        builder.Property(e => e.Username).HasColumnName("Username").HasMaxLength(50).IsRequired();
        builder.Property(e => e.PasswordHash).HasColumnName("Password_Hash").HasMaxLength(255).IsRequired();
        builder.Property(e => e.Role).HasColumnName("Role").HasMaxLength(50).IsRequired();
        builder.Property(e => e.IsActive).HasColumnName("Is_Active").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        builder.HasIndex(e => e.Username).IsUnique();
    }
}

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("Department");
        builder.HasKey(e => e.DepartmentId);
        builder.Property(e => e.DepartmentId).HasColumnName("Department_ID");
        builder.Property(e => e.DepartmentName).HasColumnName("Department_Name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.DepartmentCode).HasColumnName("Department_Code").HasMaxLength(10).IsRequired();
        builder.Property(e => e.OfficeLocation).HasColumnName("Office_Location").HasMaxLength(255).IsRequired();
        builder.Property(e => e.HeadOfDepartmentId).HasColumnName("Head_Of_Department_ID");
        builder.Property(e => e.Description).HasColumnName("Description");
        builder.Property(e => e.IsActive).HasColumnName("Is_Active").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        builder.HasIndex(e => e.DepartmentName).IsUnique();
        builder.HasIndex(e => e.DepartmentCode).IsUnique();

        builder.HasOne(e => e.HeadOfDepartment)
            .WithMany()
            .HasForeignKey(e => e.HeadOfDepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class DesignationConfiguration : IEntityTypeConfiguration<Designation>
{
    public void Configure(EntityTypeBuilder<Designation> builder)
    {
        builder.ToTable("Designation");
        builder.HasKey(e => e.DesignationId);
        builder.Property(e => e.DesignationId).HasColumnName("Designation_ID");
        builder.Property(e => e.DepartmentId).HasColumnName("Department_ID").IsRequired();
        builder.Property(e => e.DesignationTitle).HasColumnName("Title").HasMaxLength(100).IsRequired();
        builder.Property(e => e.MinSalary).HasColumnName("Base_Salary_Min").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.MaxSalary).HasColumnName("Base_Salary_Max").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.Description).HasColumnName("Description");
        builder.Property(e => e.IsActive).HasColumnName("Is_Active").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        builder.HasIndex(e => new { e.DepartmentId, e.DesignationTitle }).IsUnique();

        builder.HasOne(e => e.Department)
            .WithMany(d => d.Designations)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employee");
        builder.HasKey(e => e.EmployeeId);
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID");
        builder.Property(e => e.UserId).HasColumnName("User_ID").IsRequired();
        builder.Property(e => e.EmployeeCode).HasColumnName("Employee_Code").HasMaxLength(20).IsRequired();
        builder.Property(e => e.FirstName).HasColumnName("First_Name").HasMaxLength(50).IsRequired();
        builder.Property(e => e.LastName).HasColumnName("Last_Name").HasMaxLength(50).IsRequired();
        builder.Property(e => e.OfficialEmail).HasColumnName("Email").HasMaxLength(100).IsRequired();
        builder.Property(e => e.PhoneNumber).HasColumnName("Phone").HasMaxLength(20).IsRequired();
        builder.Property(e => e.NidNumber).HasColumnName("NID").HasMaxLength(25).IsRequired();
        builder.Property(e => e.DateOfBirth).HasColumnName("Date_Of_Birth").IsRequired();
        builder.Property(e => e.Gender).HasColumnName("Gender").HasMaxLength(10).IsRequired();
        builder.Property(e => e.ResidentialAddress).HasColumnName("Address").HasMaxLength(255).IsRequired();
        builder.Property(e => e.DepartmentId).HasColumnName("Department_ID").IsRequired();
        builder.Property(e => e.DesignationId).HasColumnName("Designation_ID").IsRequired();
        builder.Property(e => e.ManagerId).HasColumnName("Manager_ID");
        builder.Property(e => e.DateOfJoining).HasColumnName("Hire_Date").IsRequired();
        builder.Property(e => e.EmploymentStatus).HasColumnName("Employment_Status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.BankName).HasColumnName("Bank_Name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.BankBranch).HasColumnName("Bank_Branch").HasMaxLength(100).IsRequired();
        builder.Property(e => e.BankAccountNumber).HasColumnName("Bank_Account_No").HasMaxLength(50).IsRequired();
        builder.Property(e => e.RoutingNumber).HasColumnName("Bank_Routing_No").HasMaxLength(20).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.EmploymentType);
        builder.Ignore(e => e.EmergencyContactName);
        builder.Ignore(e => e.EmergencyContactRelation);
        builder.Ignore(e => e.EmergencyContactPhone);
        builder.Ignore(e => e.ProfilePictureUrl);

        builder.HasIndex(e => e.UserId).IsUnique();
        builder.HasIndex(e => e.EmployeeCode).IsUnique();
        builder.HasIndex(e => e.OfficialEmail).IsUnique();
        builder.HasIndex(e => e.NidNumber).IsUnique();

        builder.HasOne(e => e.UserAccount)
            .WithOne(u => u.Employee)
            .HasForeignKey<Employee>(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Designation)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DesignationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Manager)
            .WithMany(m => m.DirectReports)
            .HasForeignKey(e => e.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class SalaryStructureConfiguration : IEntityTypeConfiguration<SalaryStructure>
{
    public void Configure(EntityTypeBuilder<SalaryStructure> builder)
    {
        builder.ToTable("Salary_Structure");
        builder.HasKey(e => e.StructureId);
        builder.Property(e => e.StructureId).HasColumnName("Structure_ID");
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID").IsRequired();
        builder.Property(e => e.BasicSalary).HasColumnName("Basic_Salary").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.HouseRentAllowance).HasColumnName("House_Rent_Allowance").HasPrecision(12, 2).HasDefaultValue(0);
        builder.Property(e => e.MedicalAllowance).HasColumnName("Medical_Allowance").HasPrecision(12, 2).HasDefaultValue(0);
        builder.Property(e => e.ConveyanceAllowance).HasColumnName("Conveyance_Allowance").HasPrecision(12, 2).HasDefaultValue(0);
        builder.Property(e => e.TaxDeductionRate).HasColumnName("Tax_Deduction_Rate").HasPrecision(5, 2).HasDefaultValue(0);
        builder.Property(e => e.ProvidentFundRate).HasColumnName("Provident_Fund_Rate").HasPrecision(5, 2).HasDefaultValue(0);
        builder.Property(e => e.EffectiveFrom).HasColumnName("Effective_From").IsRequired();
        builder.Property(e => e.EffectiveTo).HasColumnName("Effective_To");
        builder.Property(e => e.IsActive).HasColumnName("Is_Active").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.SpecialAllowance);
        builder.Ignore(e => e.RevisionNotes);

        builder.HasOne(e => e.Employee)
            .WithMany(emp => emp.SalaryStructures)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AttendanceLogConfiguration : IEntityTypeConfiguration<AttendanceLog>
{
    public void Configure(EntityTypeBuilder<AttendanceLog> builder)
    {
        builder.ToTable("Attendance_Log");
        builder.HasKey(e => e.LogId);
        builder.Property(e => e.LogId).HasColumnName("Log_ID");
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID").IsRequired();
        builder.Property(e => e.WorkDate).HasColumnName("Work_Date").IsRequired();
        builder.Property(e => e.CheckInTime).HasColumnName("Check_In_Time");
        builder.Property(e => e.CheckOutTime).HasColumnName("Check_Out_Time");
        builder.Property(e => e.TotalHoursWorked).HasColumnName("Working_Hours").HasPrecision(4, 2).HasDefaultValue(0);
        builder.Property(e => e.OvertimeHours).HasColumnName("Overtime_Hours").HasPrecision(4, 2).HasDefaultValue(0);
        builder.Property(e => e.AttendanceStatus).HasColumnName("Attendance_Status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.Remarks).HasColumnName("Remarks").HasMaxLength(255);
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.UpdatedAt);

        builder.HasIndex(e => new { e.EmployeeId, e.WorkDate }).IsUnique();

        builder.HasOne(e => e.Employee)
            .WithMany(emp => emp.AttendanceLogs)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LeaveTypeConfiguration : IEntityTypeConfiguration<LeaveType>
{
    public void Configure(EntityTypeBuilder<LeaveType> builder)
    {
        builder.ToTable("Leave_Type");
        builder.HasKey(e => e.LeaveTypeId);
        builder.Property(e => e.LeaveTypeId).HasColumnName("Leave_Type_ID");
        builder.Property(e => e.TypeName).HasColumnName("Type_Name").HasMaxLength(50).IsRequired();
        builder.Property(e => e.AnnualQuota).HasColumnName("Max_Days_Per_Year").IsRequired();
        builder.Property(e => e.IsPaid).HasColumnName("Is_Paid").HasDefaultValue(true);
        builder.Property(e => e.Description).HasColumnName("Description");
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.TypeCode);
        builder.Ignore(e => e.IsActive);

        builder.HasIndex(e => e.TypeName).IsUnique();
    }
}

public class LeaveAllocationConfiguration : IEntityTypeConfiguration<LeaveAllocation>
{
    public void Configure(EntityTypeBuilder<LeaveAllocation> builder)
    {
        builder.ToTable("Leave_Allocation");
        builder.HasKey(e => e.AllocationId);
        builder.Property(e => e.AllocationId).HasColumnName("Allocation_ID");
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID").IsRequired();
        builder.Property(e => e.LeaveTypeId).HasColumnName("Leave_Type_ID").IsRequired();
        builder.Property(e => e.CalendarYear).HasColumnName("Calendar_Year").IsRequired();
        builder.Property(e => e.TotalAllocatedDays).HasColumnName("Total_Allocated").IsRequired();
        builder.Property(e => e.DaysUsed).HasColumnName("Days_Used").HasDefaultValue(0);
        builder.Property(e => e.DaysRemaining).HasColumnName("Days_Remaining").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        builder.HasIndex(e => new { e.EmployeeId, e.LeaveTypeId, e.CalendarYear }).IsUnique();

        builder.HasOne(e => e.Employee)
            .WithMany(emp => emp.LeaveAllocations)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.LeaveType)
            .WithMany(lt => lt.LeaveAllocations)
            .HasForeignKey(e => e.LeaveTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.ToTable("Leave_Request");
        builder.HasKey(e => e.RequestId);
        builder.Property(e => e.RequestId).HasColumnName("Request_ID");
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID").IsRequired();
        builder.Property(e => e.LeaveTypeId).HasColumnName("Leave_Type_ID").IsRequired();
        builder.Property(e => e.StartDate).HasColumnName("Start_Date").IsRequired();
        builder.Property(e => e.EndDate).HasColumnName("End_Date").IsRequired();
        builder.Property(e => e.TotalDaysRequested).HasColumnName("Total_Days").IsRequired();
        builder.Property(e => e.Reason).HasColumnName("Reason").HasMaxLength(500).IsRequired();
        builder.Property(e => e.ApplicationStatus).HasColumnName("Status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.AppliedDate).HasColumnName("Applied_Date");
        builder.Property(e => e.ApprovedByUserId).HasColumnName("Approved_By_User_ID");
        builder.Property(e => e.ApprovalDate).HasColumnName("Approved_At");
        builder.Property(e => e.SupervisorComments).HasColumnName("Approval_Remarks").HasMaxLength(255);

        // Ignored non-DB properties
        builder.Ignore(e => e.CreatedAt);
        builder.Ignore(e => e.UpdatedAt);

        builder.HasOne(e => e.Employee)
            .WithMany(emp => emp.LeaveRequests)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.LeaveType)
            .WithMany(lt => lt.LeaveRequests)
            .HasForeignKey(e => e.LeaveTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ApprovedByUser)
            .WithMany(u => u.ApprovedLeaveRequests)
            .HasForeignKey(e => e.ApprovedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class MonthlyPayrollConfiguration : IEntityTypeConfiguration<MonthlyPayroll>
{
    public void Configure(EntityTypeBuilder<MonthlyPayroll> builder)
    {
        builder.ToTable("Monthly_Payroll");
        builder.HasKey(e => e.PayrollId);
        builder.Property(e => e.PayrollId).HasColumnName("Payroll_ID");
        builder.Property(e => e.EmployeeId).HasColumnName("Employee_ID").IsRequired();
        builder.Property(e => e.PayrollYear).HasColumnName("Payroll_Year").IsRequired();
        builder.Property(e => e.PayrollMonth).HasColumnName("Payroll_Month").IsRequired();
        builder.Property(e => e.WorkingDaysInMonth).HasColumnName("Working_Days").IsRequired();
        builder.Property(e => e.PresentDays).HasColumnName("Present_Days").IsRequired();
        builder.Property(e => e.PaidLeaveDays).HasColumnName("Paid_Leave_Days").HasDefaultValue(0);
        builder.Property(e => e.UnpaidLeaveDays).HasColumnName("Unpaid_Leave_Days").HasDefaultValue(0);
        builder.Property(e => e.BasicSalarySnapshot).HasColumnName("Basic_Salary").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.TotalAllowances).HasColumnName("Total_Allowances").HasPrecision(12, 2).HasDefaultValue(0);
        builder.Property(e => e.GrossSalary).HasColumnName("Gross_Salary").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.TotalDeductions).HasColumnName("Total_Deductions").HasPrecision(12, 2).HasDefaultValue(0);
        builder.Property(e => e.NetSalary).HasColumnName("Net_Salary").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.PayrollStatus).HasColumnName("Payroll_Status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.ProcessedByUserId).HasColumnName("Generated_By_User_ID");
        builder.Property(e => e.ProcessedDate).HasColumnName("Generation_Date");
        builder.Property(e => e.FinalizedDate).HasColumnName("Finalized_Date");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.TaxDeducted);
        builder.Ignore(e => e.ProvidentFundDeducted);
        builder.Ignore(e => e.OvertimePay);
        builder.Ignore(e => e.CreatedAt);

        builder.HasIndex(e => new { e.EmployeeId, e.PayrollYear, e.PayrollMonth }).IsUnique();

        builder.HasOne(e => e.Employee)
            .WithMany(emp => emp.MonthlyPayrolls)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ProcessedByUser)
            .WithMany(u => u.ProcessedPayrolls)
            .HasForeignKey(e => e.ProcessedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PayrollComponentDetailConfiguration : IEntityTypeConfiguration<PayrollComponentDetail>
{
    public void Configure(EntityTypeBuilder<PayrollComponentDetail> builder)
    {
        builder.ToTable("Payroll_Component_Detail");
        builder.HasKey(e => e.DetailId);
        builder.Property(e => e.DetailId).HasColumnName("Detail_ID");
        builder.Property(e => e.PayrollId).HasColumnName("Payroll_ID").IsRequired();
        builder.Property(e => e.ComponentName).HasColumnName("Component_Name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.ComponentType).HasColumnName("Component_Type").HasMaxLength(20).IsRequired();
        builder.Property(e => e.Amount).HasColumnName("Amount").HasPrecision(12, 2).IsRequired();

        // Ignored non-DB properties
        builder.Ignore(e => e.IsTaxable);
        builder.Ignore(e => e.CreatedAt);

        builder.HasOne(e => e.MonthlyPayroll)
            .WithMany(p => p.Components)
            .HasForeignKey(e => e.PayrollId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DisbursementRecordConfiguration : IEntityTypeConfiguration<DisbursementRecord>
{
    public void Configure(EntityTypeBuilder<DisbursementRecord> builder)
    {
        builder.ToTable("Disbursement_Record");
        builder.HasKey(e => e.DisbursementId);
        builder.Property(e => e.DisbursementId).HasColumnName("Disbursement_ID");
        builder.Property(e => e.PayrollId).HasColumnName("Payroll_ID").IsRequired();
        builder.Property(e => e.TransactionReference).HasColumnName("Transaction_Reference").HasMaxLength(100).IsRequired();
        builder.Property(e => e.DisbursementDate).HasColumnName("Disbursement_Date");
        builder.Property(e => e.DisbursementMethod).HasColumnName("Payment_Method").HasMaxLength(30).IsRequired();
        builder.Property(e => e.DisbursedAmount).HasColumnName("Disbursed_Amount").HasPrecision(12, 2).IsRequired();
        builder.Property(e => e.DisbursementStatus).HasColumnName("Disbursement_Status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.AuthorizedByUserId).HasColumnName("Disbursed_By_User_ID");
        builder.Property(e => e.CreatedAt).HasColumnName("Created_At");
        builder.Property(e => e.UpdatedAt).HasColumnName("Updated_At");

        // Ignored non-DB properties
        builder.Ignore(e => e.TargetBankName);
        builder.Ignore(e => e.TargetAccountMasked);
        builder.Ignore(e => e.FailureReason);

        builder.HasIndex(e => e.PayrollId).IsUnique();
        builder.HasIndex(e => e.TransactionReference).IsUnique();

        builder.HasOne(e => e.MonthlyPayroll)
            .WithOne(p => p.Disbursement)
            .HasForeignKey<DisbursementRecord>(e => e.PayrollId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.AuthorizedByUser)
            .WithMany(u => u.AuthorizedDisbursements)
            .HasForeignKey(e => e.AuthorizedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SystemAuditLogConfiguration : IEntityTypeConfiguration<SystemAuditLog>
{
    public void Configure(EntityTypeBuilder<SystemAuditLog> builder)
    {
        builder.ToTable("System_Audit_Log");
        builder.HasKey(e => e.AuditId);
        builder.Property(e => e.AuditId).HasColumnName("Audit_ID");
        builder.Property(e => e.TableName).HasColumnName("Table_Name").HasMaxLength(64).IsRequired();
        builder.Property(e => e.OperationType).HasColumnName("Operation_Type").HasMaxLength(10).IsRequired();
        builder.Property(e => e.RecordId).HasColumnName("Record_ID").HasMaxLength(64).IsRequired();
        builder.Property(e => e.UserId).HasColumnName("Changed_By_User");
        builder.Property(e => e.OldValues).HasColumnName("Old_Values");
        builder.Property(e => e.NewValues).HasColumnName("New_Values");
        builder.Property(e => e.Description).HasColumnName("Description").HasMaxLength(500);
        builder.Property(e => e.LoggedAt).HasColumnName("Action_Timestamp");

        // Ignored non-DB properties
        builder.Ignore(e => e.IpAddress);

        builder.HasOne(e => e.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
