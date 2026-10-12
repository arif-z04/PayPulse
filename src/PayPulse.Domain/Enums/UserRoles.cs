namespace PayPulse.Domain.Enums;

public static class UserRoles
{
    public const string SystemAdministrator = "System Administrator";
    public const string HrManager = "HR Manager";
    public const string PayrollOfficer = "Payroll Officer";
    public const string DepartmentSupervisor = "Department Supervisor";
    public const string Employee = "Employee";

    public static readonly string[] All =
    [
        SystemAdministrator,
        HrManager,
        PayrollOfficer,
        DepartmentSupervisor,
        Employee
    ];
}
