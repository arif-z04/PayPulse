# PayPulse Programmable Database Objects: Procedures, Functions & Triggers

This document provides complete technical specifications for all database-side stored procedures, user-defined functions, active integrity triggers, and reporting views implemented in PayPulse (`paypulse_db`).

---

## 1. Architectural Philosophy: Division of Responsibilities

In PayPulse, business logic is partitioned deliberately between the **MySQL Database Layer** and the upcoming **ASP.NET Core Application Layer**:

```text
┌────────────────────────────────────────────────────────┐
│             Backend API Layer (ASP.NET Core)           │
│   • Input syntax & schema model binding validation     │
│   • JWT token generation, claims validation & RBAC     │
│   • Password salting & BCrypt hashing (Work Factor 12) │
│   • External integration (email, SMS, BEFTN bank APIs) │
│   • Complex domain modeling & orchestration            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Database Layer (MySQL 8.4 LTS)           │
│   • Declarative relational referential integrity (FKs) │
│   • Point-in-time financial mathematical formulas      │
│   • Strict check constraints & unique business keys    │
│   • Atomic batch transactions with rollback on failure │
│   • Concurrency pessimistic locking (SELECT FOR UPDATE)│
│   • Automatic audit trail generation via JSON triggers │
│   • High-performance analytical views & aggregations   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Stored Procedures (6 Procedures)

### 2.1 `sp_ProcessMonthlyPayrollBatch`
- **Purpose**: Batch-calculates and records monthly payroll for all active employees for a given year and month.
- **Parameters**:
  - `p_payroll_year INT`: Calendar year (e.g. `2026`).
  - `p_payroll_month INT`: Calendar month (e.g. `8`).
  - `p_generated_by_user_id INT`: ID of the authorizing Payroll Officer.
- **ACID & Concurrency Guarantees**:
  - Verifies that the period is not already `'Finalized'` or `'Disbursed'`. If already locked, raises `SIGNAL SQLSTATE '45000'`.
  - Begins explicit transaction (`START TRANSACTION`).
  - Clears prior draft runs for that period.
  - Iterates over active employees matching active salary structures.
  - Aggregates attendance logs and approved leaves in that month.
  - Computes daily rate ($Basic / 26$), overtime pay ($Hourly \times 1.5$), income tax, and provident fund.
  - Inserts `Monthly_Payroll` and itemized `Payroll_Component_Detail` rows.
  - Appends batch execution metadata to `System_Audit_Log`.
  - Declares `EXIT HANDLER FOR SQLEXCEPTION` with explicit `ROLLBACK`.

### 2.2 `sp_FinalizeMonthlyPayroll`
- **Purpose**: Locks a generated payroll batch into `'Finalized'` status, preventing further modifications.
- **Parameters**: `p_payroll_year INT`, `p_payroll_month INT`, `p_user_id INT`.
- **Behavior**: Transitions status from `'Generated'` to `'Finalized'` and sets `Finalized_Date = NOW()`.

### 2.3 `sp_DisbursePayroll`
- **Purpose**: Atomically executes the electronic banking settlement voucher for a finalized payroll record.
- **Parameters**:
  - `p_payroll_id INT`: Target payroll voucher ID.
  - `p_payment_method VARCHAR(50)`: Payment gateway/method (e.g. `'Bank Transfer (BEFTN)'`).
  - `p_transaction_prefix VARCHAR(20)`: Prefix string (e.g. `'BEFTN'`).
  - `p_processed_by_user_id INT`: Authorizing treasury officer.
  - `OUT p_transaction_reference VARCHAR(100)`: Formatted reference code.
- **Guarantees**:
  - Validates that payroll exists and is not already disbursed.
  - Generates unique reference: `BEFTN-YYYYMMDD-<Payroll_ID>-<RAND>`.
  - Inserts into `Disbursement_Record` and sets `Monthly_Payroll.Payroll_Status = 'Disbursed'`.

### 2.4 `sp_ApproveLeaveRequest`
- **Purpose**: Atomically approves a pending leave application after quota validation.
- **Parameters**: `p_request_id INT`, `p_approver_user_id INT`, `p_approval_remarks VARCHAR(255)`.
- **Behavior**: Checks status is `'Pending'` and `Days_Remaining >= Total_Days`. Sets status to `'Approved'`, which activates balance synchronization triggers.

### 2.5 `sp_RejectLeaveRequest`
- **Purpose**: Atomically rejects a pending leave application with justification remarks.
- **Parameters**: `p_request_id INT`, `p_approver_user_id INT`, `p_rejection_remarks VARCHAR(255)`.
- **Behavior**: Updates status to `'Rejected'` with approver remarks and records audit log.

### 2.6 `sp_OnboardEmployeeWithSalary`
- **Purpose**: Atomically provisions user credentials, employee profile, salary structure within pay grade bounds, and initial leave quotas.
- **Parameters**: 23 parameters covering personal info, banking info, and compensation terms.
- **Validation**: Rejects salary if outside `Base_Salary_Min` and `Base_Salary_Max` of the designation.

---

## 3. User-Defined Functions (6 Scalar UDFs)

| Function Name | Return Type | Attributes | Business Purpose |
|---|---|---|---|
| `fn_CalculateMonthlyNetPay` | `DECIMAL(12,2)` | `DETERMINISTIC NO SQL` | Pure mathematical calculation of take-home pay based on basic salary, allowances, overtime hours, tax/PF rates, and unpaid leaves. |
| `fn_GetEmployeeLeaveBalance` | `INT` | `READS SQL DATA` | Returns real-time available remaining leave days for an employee, leave type, and calendar year. |
| `fn_GetDepartmentMonthlyPayrollTotal` | `DECIMAL(14,2)` | `READS SQL DATA` | Computes the aggregated net payroll expenditure for a specific department and period. |
| `fn_MaskBankAccount` | `VARCHAR(50)` | `DETERMINISTIC NO SQL` | Formats raw bank account numbers for secure display (e.g. `*********2736`). |
| `fn_CalculateOvertimePay` | `DECIMAL(12,2)` | `DETERMINISTIC NO SQL` | Calculates overtime compensation: `(Basic / (26 * 8)) * 1.5 * OvertimeHours`. |
| `fn_GetEmployeeTenureMonths` | `INT` | `READS SQL DATA` | Returns elapsed tenure in calendar months between hire date and current date. |

---

## 4. Active Integrity & Audit Triggers (4 Triggers)

### 4.1 `trg_AuditSalaryModifications`
- **Event**: `AFTER UPDATE ON Salary_Structure`
- **Purpose**: Fires whenever basic salary, allowances, tax rate, or PF rate change. Captures before and after states as structured JSON objects and logs them to `System_Audit_Log`.

### 4.2 `trg_EnforceLeaveQuota`
- **Event**: `BEFORE UPDATE ON Leave_Request`
- **Purpose**: When status transitions to `'Approved'`, checks that `Days_Remaining >= Total_Days`. If insufficient, raises `SIGNAL SQLSTATE '45000'` with `'Quota Exceeded: Insufficient remaining leave balance'`.

### 4.3 `trg_SyncLeaveAllocationOnStatusChange`
- **Event**: `AFTER UPDATE ON Leave_Request`
- **Purpose**:
  - `Pending` $\rightarrow$ `Approved`: Decrements `Days_Remaining` and increments `Days_Used`.
  - `Approved` $\rightarrow$ `Cancelled`: Restores the quota balance by incrementing `Days_Remaining` and decrementing `Days_Used`.

### 4.4 `trg_ValidateAttendanceTimes`
- **Event**: `BEFORE INSERT ON Attendance_Log`
- **Purpose**: Rejects check-out timestamp preceding check-in timestamp. Automatically calculates `Working_Hours` if not provided.

*(Note on Finalized Payroll Immutability: Deletion of historical finalized or disbursed payroll is strictly prohibited by declarative foreign key constraints `fk_monthly_payroll_employee` and `fk_disbursement_payroll` with `ON DELETE RESTRICT`, while batch regeneration is guarded by procedure checks in `sp_ProcessMonthlyPayrollBatch`).*

---

## 5. Secure Database Views (6 Views)

1. `vw_EmployeeDirectory`: Staff directory joining Employee, Department, Designation, and Manager, excluding passwords and sensitive banking data.
2. `vw_AttendanceMonthlySummary`: Monthly biometric summaries aggregating present, late, half-day, absent days, and overtime hours.
3. `vw_MonthlyPayrollSummary`: Monthly compensation ledger linked with BEFTN disbursement statuses.
4. `vw_LeaveBalanceAndPendingRequests`: Real-time leave quotas, remaining days, and pending approval counts.
5. `vw_DepartmentPayrollExpenditure`: Departmental cost rollups (headcount, basic, gross, deductions, net totals, average salary).
6. `vw_DisbursementReconciliation`: Banking audit reconciling net salary against disbursed amount, BEFTN transaction reference, and masked account number.
