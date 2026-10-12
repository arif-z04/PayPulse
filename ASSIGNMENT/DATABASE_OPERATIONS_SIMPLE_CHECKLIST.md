# PayPulse Database Operations — Simple Checklist

This checklist provides a clear, high-level inventory of all database operations implemented in the **PayPulse** enterprise system.

---

## 1. Data Definition Language (DDL) Operations

### Database & Schema
- [x] Create Database (`paypulse_db`)
- [x] Configure Character Set (`utf8mb4`) & Collation (`utf8mb4_unicode_ci`)
- [x] Foreign Key Checks Toggling (`FOREIGN_KEY_CHECKS`)

### Table Definitions (13 Core Relational Tables)
- [x] Create Table: `User_Account`
- [x] Create Table: `Department`
- [x] Create Table: `Designation`
- [x] Create Table: `Employee`
- [x] Create Table: `Salary_Structure`
- [x] Create Table: `Attendance_Log`
- [x] Create Table: `Leave_Type`
- [x] Create Table: `Leave_Allocation`
- [x] Create Table: `Leave_Request`
- [x] Create Table: `Monthly_Payroll`
- [x] Create Table: `Payroll_Component_Detail`
- [x] Create Table: `Disbursement_Record`
- [x] Create Table: `System_Audit_Log`

### Primary Key Constraints (13 PKs)
- [x] Primary Key: `User_Account(User_ID)`
- [x] Primary Key: `Department(Department_ID)`
- [x] Primary Key: `Designation(Designation_ID)`
- [x] Primary Key: `Employee(Employee_ID)`
- [x] Primary Key: `Salary_Structure(Structure_ID)`
- [x] Primary Key: `Attendance_Log(Log_ID)`
- [x] Primary Key: `Leave_Type(Leave_Type_ID)`
- [x] Primary Key: `Leave_Allocation(Allocation_ID)`
- [x] Primary Key: `Leave_Request(Request_ID)`
- [x] Primary Key: `Monthly_Payroll(Payroll_ID)`
- [x] Primary Key: `Payroll_Component_Detail(Detail_ID)`
- [x] Primary Key: `Disbursement_Record(Disbursement_ID)`
- [x] Primary Key: `System_Audit_Log(Audit_ID)`

### Foreign Key Constraints (19 FKs)
- [x] Foreign Key: `fk_designation_department` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_employee_department` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_employee_designation` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_employee_user` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_employee_manager` (`ON DELETE SET NULL`)
- [x] Foreign Key: `fk_department_head` (`ON DELETE SET NULL`)
- [x] Foreign Key: `fk_salary_structure_employee` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_attendance_employee` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_leave_allocation_employee` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_leave_allocation_type` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_leave_request_employee` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_leave_request_type` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_leave_request_approver` (`ON DELETE SET NULL`)
- [x] Foreign Key: `fk_monthly_payroll_employee` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_monthly_payroll_user` (`ON DELETE SET NULL`)
- [x] Foreign Key: `fk_payroll_component_payroll` (`ON DELETE CASCADE`)
- [x] Foreign Key: `fk_disbursement_payroll` (`ON DELETE RESTRICT`)
- [x] Foreign Key: `fk_disbursement_user` (`ON DELETE SET NULL`)
- [x] Foreign Key: `fk_audit_user` (`ON DELETE SET NULL`)

### Unique / Candidate Key Constraints (14 Keys)
- [x] Unique Key: `uq_user_username`
- [x] Unique Key: `uq_dept_name`
- [x] Unique Key: `uq_dept_code`
- [x] Composite Unique Key: `uq_dept_designation_title`
- [x] Unique Key: `uq_emp_code`
- [x] Unique Key: `uq_emp_user_id`
- [x] Unique Key: `uq_emp_email`
- [x] Unique Key: `uq_emp_nid`
- [x] Composite Unique Key: `uq_emp_work_date`
- [x] Unique Key: `uq_leave_type_name`
- [x] Composite Unique Key: `uq_emp_leave_year`
- [x] Composite Unique Key: `uq_emp_payroll_period`
- [x] Unique Key: `uq_disb_payroll_id`
- [x] Unique Key: `uq_disb_txref`

### Domain CHECK Constraints (31 Rules)
- [x] Check: `chk_user_username_minlen`
- [x] Check: `chk_dept_code_format`
- [x] Check: `chk_desig_salary_min`
- [x] Check: `chk_desig_salary_range`
- [x] Check: `chk_emp_name_nonempty`
- [x] Check: `chk_emp_age_adult`
- [x] Check: `chk_salary_basic_positive`
- [x] Check: `chk_salary_hra_nonnegative`
- [x] Check: `chk_salary_med_nonnegative`
- [x] Check: `chk_salary_conv_nonnegative`
- [x] Check: `chk_salary_tax_rate_range`
- [x] Check: `chk_salary_pf_rate_range`
- [x] Check: `chk_salary_effective_dates`
- [x] Check: `chk_att_hours_range`
- [x] Check: `chk_att_ot_range`
- [x] Check: `chk_att_checkout_after_checkin`
- [x] Check: `chk_leave_type_days_range`
- [x] Check: `chk_alloc_year_range`
- [x] Check: `chk_alloc_allocated_positive`
- [x] Check: `chk_alloc_used_nonnegative`
- [x] Check: `chk_alloc_remaining_nonnegative`
- [x] Check: `chk_alloc_balance_identity`
- [x] Check: `chk_req_date_order`
- [x] Check: `chk_req_total_days_positive`
- [x] Check: `chk_pay_month_range`
- [x] Check: `chk_pay_year_range`
- [x] Check: `chk_pay_working_days_range`
- [x] Check: `chk_pay_present_days_range`
- [x] Check: `chk_pay_gross_geq_basic`
- [x] Check: `chk_pay_net_nonnegative`
- [x] Check: `chk_pay_math_consistency`

### Performance B-Tree Indexes (16 Indexes)
- [x] Index: `idx_employee_department_status`
- [x] Index: `idx_employee_designation_status`
- [x] Index: `idx_employee_manager`
- [x] Index: `idx_employee_hire_date`
- [x] Index: `idx_attendance_workdate_status`
- [x] Index: `idx_attendance_emp_date_status`
- [x] Index: `idx_salary_structure_emp_active`
- [x] Index: `idx_leave_request_status_emp`
- [x] Index: `idx_leave_request_dates_status`
- [x] Index: `idx_leave_allocation_year_emp`
- [x] Index: `idx_monthly_payroll_period_status`
- [x] Index: `idx_monthly_payroll_emp_period`
- [x] Index: `idx_payroll_component_type_name`
- [x] Index: `idx_disbursement_status_date`
- [x] Index: `idx_audit_table_record`
- [x] Index: `idx_audit_timestamp_user`

### Database Views (6 Views)
- [x] View: `vw_EmployeeDirectory`
- [x] View: `vw_AttendanceMonthlySummary`
- [x] View: `vw_MonthlyPayrollSummary`
- [x] View: `vw_LeaveBalanceAndPendingRequests`
- [x] View: `vw_DepartmentPayrollExpenditure`
- [x] View: `vw_DisbursementReconciliation`

---

## 2. Programmable Stored Logic Operations

### Stored Procedures (6 Procedures)
- [x] Stored Procedure: `sp_ProcessMonthlyPayrollBatch`
- [x] Stored Procedure: `sp_FinalizeMonthlyPayroll`
- [x] Stored Procedure: `sp_OnboardEmployeeWithSalary`
- [x] Stored Procedure: `sp_DisbursePayroll`
- [x] Stored Procedure: `sp_ApproveLeaveRequest`
- [x] Stored Procedure: `sp_RejectLeaveRequest`

### User-Defined Functions (6 Scalar UDFs)
- [x] Function: `fn_CalculateMonthlyNetPay`
- [x] Function: `fn_GetEmployeeLeaveBalance`
- [x] Function: `fn_GetDepartmentMonthlyPayrollTotal`
- [x] Function: `fn_MaskBankAccount`
- [x] Function: `fn_CalculateOvertimePay`
- [x] Function: `fn_GetEmployeeTenureMonths`

### Active Integrity & Audit Triggers (4 Triggers)
- [x] Trigger: `trg_AuditSalaryModifications`
- [x] Trigger: `trg_EnforceLeaveQuota`
- [x] Trigger: `trg_SyncLeaveAllocationOnStatusChange`
- [x] Trigger: `trg_ValidateAttendanceTimes`

---

## 3. Data Manipulation Language (DML) Operations

### INSERT Operations
- [x] Reference Department Catalog Seeding
- [x] Designation Catalog & Salary Band Seeding
- [x] Statutory Leave Policies Seeding
- [x] User Account Credential Ingestion
- [x] Employee Profile Data Ingestion
- [x] Effective-Dated Salary Structure Ingestion
- [x] Biometric Daily Attendance Punch Ingestion
- [x] Annual Leave Entitlement Allocation Ingestion
- [x] Leave Application Request Ingestion
- [x] Monthly Batch Payroll Ledger Generation
- [x] Itemized Payroll Component Details Ingestion
- [x] Electronic Fund Transfer (BEFTN) Disbursement Voucher Generation
- [x] Structured JSON Audit Delta Log Ingestion

### SELECT & Analytical Query Operations
- [x] Keyset & Offset Pagination Query
- [x] Parameterized Multi-Attribute Search Query
- [x] Recursive CTE Organizational Hierarchy Traversal
- [x] Dense Rank & Rank Compensation Distribution
- [x] Month-over-Month Departmental Payroll Variance (`LAG`)
- [x] Day-over-Day Consecutive Shift Variance (`LEAD`)
- [x] Chronic Absenteeism & Punctuality Outlier Detection
- [x] Overtime Outliers & Departmental Benchmark Comparison
- [x] Statutory Tax & Provident Fund Remittance Statement
- [x] Designation Salary Band Compliance Audit
- [x] BEFTN Electronic Fund Transfer Reconciliation
- [x] Corporate Leave Utilization & Outstanding Liability Report
- [x] Compensation Quartile & Percentile Grouping (`NTILE`)
- [x] Structured JSON Audit Trail Inspection
- [x] Correlated Subquery Above-Average Salary Filter
- [x] Multidimensional Rollup Headcount & Cost Aggregations (`WITH ROLLUP`)
- [x] Cumulative Payroll Spend Running Total
- [x] Query Plan Execution Analysis (`EXPLAIN FORMAT=TREE` / `EXPLAIN ANALYZE`)
- [x] Automated Data Integrity & Invariant Health Scanner (`UNION ALL`)

### UPDATE Operations
- [x] Leave Request Status Update: Pending to Approved
- [x] Leave Request Status Update: Pending to Rejected
- [x] Leave Request Status Update: Approved to Cancelled
- [x] Automatic Leave Quota Allocation Decrement
- [x] Automatic Leave Quota Allocation Restoration
- [x] Monthly Payroll Status Update: Draft to Finalized
- [x] Monthly Payroll Status Update: Finalized to Disbursed
- [x] Salary Structure Terms Revision
- [x] Biometric Attendance Log Timestamp & Hours Correction
- [x] Employee Banking Particulars Update
- [x] Department Head Re-assignment

### DELETE & TRUNCATE Operations
- [x] Draft Unfinalized Payroll Records Purge
- [x] Cascading Employee Profile Data Deletion
- [x] Restricted Historical Payroll Deletion Protection
- [x] Restricted Disbursed Voucher Deletion Protection
- [x] Reference Catalog Table Truncation (`TRUNCATE TABLE`)
- [x] Post-Test QA Fixture Clean-Up

---

## 4. Transaction Control Language (TCL) & Concurrency Operations

- [x] Explicit Transaction Initiation (`START TRANSACTION`)
- [x] Transaction State Committal (`COMMIT`)
- [x] Transaction State Rollback (`ROLLBACK`)
- [x] Procedural Exception Handling (`DECLARE EXIT HANDLER FOR SQLEXCEPTION`)
- [x] Pessimistic Row-Level Locking: Leave Allocation (`SELECT ... FOR UPDATE`)
- [x] Pessimistic Row-Level Locking: Monthly Payroll Voucher (`SELECT ... FOR UPDATE`)
- [x] Lock Wait Timeout Configuration (`SET innodb_lock_wait_timeout = 1`)
- [x] Application-Level Transaction Boundary (`BeginTransactionAsync` / `CommitAsync`)

---

## 5. Data Control Language (DCL) & Security Operations

- [x] Service Account Provisioning (`paypulse_user`, `paypulse_api_svc`, `paypulse_hr_svc`, `paypulse_payroll_svc`)
- [x] Enterprise Role Provisioning (`role_paypulse_admin`, `role_paypulse_hr`, `role_paypulse_payroll`, `role_paypulse_supervisor`, `role_paypulse_employee`, `role_paypulse_api`)
- [x] Operational DML Privileges Grant (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- [x] Stored Routine Privileges Grant (`EXECUTE`)
- [x] Destructive DDL Privilege Revocation / Prohibition (`DROP`, `ALTER`, `TRUNCATE`)
- [x] Password Hash Encryption (BCrypt Work Factor 12)
- [x] Financial Account Masking (`fn_MaskBankAccount`)
- [x] Parameterized Query Execution (Anti-SQL Injection)

---

## 6. Application Layer & ORM Operations (.NET 10 / EF Core)

- [x] EF Core DbContext Entity Mapping (`AppDbContext`)
- [x] Fluent API Table, Column & Precision Mapping (`EntityConfigurations.cs`)
- [x] Transient Connection Drop Auto-Retry Resiliency (`EnableRetryOnFailure`)
- [x] Navigation Property Eager Loading (`Include`, `ThenInclude`)
- [x] Read-Only Performance Query Optimization (`AsNoTracking`)
- [x] Filtered Entity Pagination Query (`Skip`, `Take`, `CountAsync`)
- [x] Change Tracker Unit of Work Batch Persistence (`SaveChangesAsync`)
- [x] Application-Side Audit Event Dispatching (`SystemAuditLog`)

---

## 7. Client-Side Simulated Database Operations (`mockDb.ts`)

- [x] LocalStorage Persistent Storage Emulation
- [x] Asynchronous Roundtrip Network Delay Simulation (`delay`)
- [x] Standalone Mock Entity CRUD Operations
- [x] Synthetic Mock Store Full Database Reset (`mockDb.resetAll`)

---

## 8. Verification, Testing & Diagnostic Operations

- [x] Standalone SQL Functional Verification Suite (10 Test Queries in `08_test_queries.sql`)
- [x] Automated Pytest Verification Suite (18 Test Cases in `test_database.py`)
- [x] ASP.NET Core Web API Integration Test Suites (xUnit)
- [x] Database Health & Anomaly Invariant Scanners
