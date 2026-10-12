# Database Integration & Entity Framework Core Mapping Reference

This document details the database integration architecture between the ASP.NET Core backend and the authoritative **MySQL 8.4 LTS** relational database created in Phase 1.

---

## 1. Authoritative Schema Principle

As mandated by system requirements, the **Phase 1 MySQL schema is authoritative**.
The backend does not execute destructive automated schema migrations against the production database. Instead, Entity Framework Core models and configurations are mapped to match the actual database tables, columns, indexes, and constraints.

---

## 2. Technology & Provider Configuration

- **ORM**: Entity Framework Core 10.0 / Pomelo.EntityFrameworkCore.MySql 9.0.0.
- **Connection String**: Configured in `appsettings.json` under `ConnectionStrings:DefaultConnection`.
- **Character Encoding**: `utf8mb4` with collation `utf8mb4_unicode_ci`.
- **Connection Resiliency**: Configured with Pomelo's `EnableRetryOnFailure` to automatically retry transient database connection drops up to 5 times.

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });
});
```

---

## 3. Entity-to-Table Mapping Catalog (13 Core Tables)

All mappings are defined explicitly via EF Core Fluent API in `PayPulse.Infrastructure/Persistence/Configurations/EntityConfigurations.cs`.

### 1. `User_Account`
- **Table Name**: `User_Account`
- **Primary Key**: `User_ID` (Auto-increment)
- **Columns**: `User_ID`, `Username` (Unique), `Password_Hash`, `Role`, `Is_Active`, `Created_At`, `Updated_At`.
- **Delete Behavior**: Protected from cascading delete by child entity foreign keys.

### 2. `Department`
- **Table Name**: `Department`
- **Primary Key**: `Department_ID` (Auto-increment)
- **Columns**: `Department_ID`, `Department_Name` (Unique), `Department_Code` (Unique), `Office_Location`, `Head_Of_Department_ID` (FK to `Employee`, Nullable), `Description`, `Is_Active`, `Created_At`, `Updated_At`.

### 3. `Designation`
- **Table Name**: `Designation`
- **Primary Key**: `Designation_ID` (Auto-increment)
- **Columns**: `Designation_ID`, `Department_ID` (FK to `Department`), `Title` (mapped from `DesignationTitle`), `Base_Salary_Min` (mapped from `MinSalary`), `Base_Salary_Max` (mapped from `MaxSalary`), `Description`, `Is_Active`, `Created_At`, `Updated_At`.
- **Unique Index**: Composite `(Department_ID, Title)`.

### 4. `Employee`
- **Table Name**: `Employee`
- **Primary Key**: `Employee_ID` (Auto-increment)
- **Columns**: `Employee_ID`, `Employee_Code` (Unique), `User_ID` (Unique, FK to `User_Account`), `Department_ID` (FK to `Department`), `Designation_ID` (FK to `Designation`), `Manager_ID` (FK to `Employee`, Nullable), `First_Name`, `Last_Name`, `Email` (mapped from `OfficialEmail`), `Phone` (mapped from `PhoneNumber`), `NID` (mapped from `NidNumber`), `Date_Of_Birth`, `Gender`, `Address` (mapped from `ResidentialAddress`), `Hire_Date` (mapped from `DateOfJoining`), `Bank_Account_No`, `Bank_Name`, `Bank_Branch`, `Bank_Routing_No`, `Employment_Status`, `Created_At`, `Updated_At`.
- **Ignored non-DB properties**: `EmploymentType`, `EmergencyContactName`, `EmergencyContactRelation`, `EmergencyContactPhone`, `ProfilePictureUrl`.

### 5. `Salary_Structure`
- **Table Name**: `Salary_Structure`
- **Primary Key**: `Structure_ID` (Auto-increment)
- **Columns**: `Structure_ID`, `Employee_ID` (FK to `Employee`), `Basic_Salary`, `House_Rent_Allowance`, `Medical_Allowance`, `Conveyance_Allowance`, `Tax_Deduction_Rate`, `Provident_Fund_Rate`, `Effective_From`, `Effective_To` (Nullable), `Is_Active`, `Created_At`, `Updated_At`.
- **Precision**: `decimal(12,2)` on allowances and basic salary; `decimal(5,2)` on tax and provident fund rates.
- **Ignored non-DB properties**: `SpecialAllowance`, `RevisionNotes`.

### 6. `Attendance_Log`
- **Table Name**: `Attendance_Log`
- **Primary Key**: `Log_ID` (Auto-increment)
- **Columns**: `Log_ID`, `Employee_ID` (FK to `Employee`), `Work_Date`, `Check_In_Time`, `Check_Out_Time`, `Working_Hours` (mapped from `TotalHoursWorked`), `Overtime_Hours`, `Attendance_Status`, `Remarks`, `Created_At`.
- **Unique Index**: Composite `(Employee_ID, Work_Date)` prevents duplicate daily attendance entries.

### 7. `Leave_Type`
- **Table Name**: `Leave_Type`
- **Primary Key**: `Leave_Type_ID` (Auto-increment)
- **Columns**: `Leave_Type_ID`, `Type_Name` (Unique), `Max_Days_Per_Year` (mapped from `AnnualQuota`), `Is_Carry_Forward`, `Is_Paid`, `Description`, `Created_At`.
- **Ignored non-DB properties**: `TypeCode`, `IsActive`.

### 8. `Leave_Allocation`
- **Table Name**: `Leave_Allocation`
- **Primary Key**: `Allocation_ID` (Auto-increment)
- **Columns**: `Allocation_ID`, `Employee_ID` (FK to `Employee`), `Leave_Type_ID` (FK to `Leave_Type`), `Calendar_Year`, `Total_Allocated` (mapped from `TotalAllocatedDays`), `Days_Used`, `Days_Remaining`, `Created_At`, `Updated_At`.
- **Unique Index**: Composite `(Employee_ID, Leave_Type_ID, Calendar_Year)`.

### 9. `Leave_Request`
- **Table Name**: `Leave_Request`
- **Primary Key**: `Request_ID` (Auto-increment)
- **Columns**: `Request_ID`, `Employee_ID` (FK to `Employee`), `Leave_Type_ID` (FK to `Leave_Type`), `Approved_By_User_ID` (FK to `User_Account`, Nullable), `Start_Date`, `End_Date`, `Total_Days` (mapped from `TotalDaysRequested`), `Reason`, `Status` (mapped from `ApplicationStatus`), `Applied_Date`, `Approval_Remarks` (mapped from `SupervisorComments`), `Approved_At` (mapped from `ApprovalDate`).

### 10. `Monthly_Payroll`
- **Table Name**: `Monthly_Payroll`
- **Primary Key**: `Payroll_ID` (Auto-increment)
- **Columns**: `Payroll_ID`, `Employee_ID` (FK to `Employee`), `Payroll_Month`, `Payroll_Year`, `Working_Days` (mapped from `WorkingDaysInMonth`), `Present_Days`, `Paid_Leave_Days`, `Unpaid_Leave_Days`, `Basic_Salary` (mapped from `BasicSalarySnapshot`), `Total_Allowances`, `Gross_Salary`, `Total_Deductions`, `Net_Salary`, `Generation_Date` (mapped from `ProcessedDate`), `Finalized_Date`, `Payroll_Status`, `Generated_By_User_ID` (mapped from `ProcessedByUserId`), `Updated_At`.
- **Unique Index**: Composite `(Employee_ID, Payroll_Year, Payroll_Month)` guarantees that an employee cannot have duplicate payroll runs in the same period.
- **Delete Behavior**: `DeleteBehavior.Restrict` on `Employee` and `User_Account` to preserve immutable financial audit records.

### 11. `Payroll_Component_Detail`
- **Table Name**: `Payroll_Component_Detail`
- **Primary Key**: `Detail_ID` (Auto-increment)
- **Columns**: `Detail_ID`, `Payroll_ID` (FK to `Monthly_Payroll`), `Component_Name`, `Component_Type`, `Amount`, `Remarks`.
- **Delete Behavior**: `DeleteBehavior.Cascade` from parent `Monthly_Payroll`.

### 12. `Disbursement_Record`
- **Table Name**: `Disbursement_Record`
- **Primary Key**: `Disbursement_ID` (Auto-increment)
- **Columns**: `Disbursement_ID`, `Payroll_ID` (Unique, FK to `Monthly_Payroll`), `Payment_Method` (mapped from `DisbursementMethod`), `Transaction_Reference` (Unique), `Disbursement_Date`, `Disbursement_Status`, `Disbursed_Amount`, `Remarks`, `Disbursed_By_User_ID` (mapped from `AuthorizedByUserId`), `Created_At`, `Updated_At`.
- **Delete Behavior**: `DeleteBehavior.Restrict`.

### 13. `System_Audit_Log`
- **Table Name**: `System_Audit_Log`
- **Primary Key**: `Audit_ID` (Auto-increment BigInt)
- **Columns**: `Audit_ID`, `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User` (mapped from `UserId`, FK to `User_Account`), `Action_Timestamp` (mapped from `LoggedAt`), `Old_Values` (JSON), `New_Values` (JSON), `Description`.

---

## 4. Financial Decimal Precisions & Temporal Handling

- **Monetary Currency (`BDT`)**: Mapped to `DECIMAL(12, 2)` across `Basic_Salary`, allowances, `Gross_Salary`, `Total_Deductions`, `Net_Salary`, and `Disbursed_Amount`.
- **Percentage Rates**: Mapped to `DECIMAL(5, 2)` for `Tax_Deduction_Rate` and `Provident_Fund_Rate`.
- **Hourly Quantities**: Mapped to `DECIMAL(4, 2)` for `Working_Hours` and `Overtime_Hours`.
- **Dates**:
  - `DateOnly` in C# maps to MySQL `DATE` (e.g., `Work_Date`, `Date_Of_Birth`, `Hire_Date`, `Effective_From`).
  - `DateTime` in C# maps to MySQL `DATETIME` (UTC standard).
