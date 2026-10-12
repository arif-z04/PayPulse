# PayPulse Database Verification & Testing Report

**Execution Timestamp**: 2026-10-12 12:13:56 UTC+6  
**Target Database Engine**: MySQL 8.4 LTS (`8.4.11-1.el9` running in Docker container `paypulse-mysql` on port `3308`)  
**Test Harness**: `pytest 9.1.1` with `pymysql 1.2.3` and `cryptography 50.0.2` on Python 3.14  
**Test Suite Path**: [`sql/tests/test_database.py`](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py)  
**Execution Outcome**: **18 Passed, 0 Failed (100% Pass Rate)**

---

## 1. Executive Summary

A comprehensive automated test suite and standalone SQL verification script were executed against the active MySQL 8.4 LTS database instance. All 18 automated criteria and 10 standalone SQL test cases passed successfully with zero errors.

### Pytest Test Execution Log:
```text
============================= test session starts ==============================
platform linux -- Python 3.14.7, pytest-9.1.1, pluggy-1.6.0
rootdir: /home/noir/Projects/PayPulse
collected 18 items

sql/tests/test_database.py::test_01_schema_creation_and_entity_existence PASSED [  5%]
sql/tests/test_database.py::test_02_seed_data_thresholds_and_referential_integrity PASSED [ 11%]
sql/tests/test_database.py::test_03_invalid_foreign_key_rejection PASSED [ 16%]
sql/tests/test_database.py::test_04_duplicate_constraints_rejection PASSED [ 22%]
sql/tests/test_database.py::test_05_invalid_negative_financial_values_rejection PASSED [ 27%]
sql/tests/test_database.py::test_06_leave_quota_violation_prevention_trigger PASSED [ 33%]
sql/tests/test_database.py::test_07_leave_balance_synchronization_on_status_change PASSED [ 38%]
sql/tests/test_database.py::test_08_salary_change_audit_generation PASSED [ 44%]
sql/tests/test_database.py::test_09_payroll_formula_and_function_correctness PASSED [ 50%]
sql/tests/test_database.py::test_10_duplicate_payroll_run_prevention PASSED [ 55%]
sql/tests/test_database.py::test_11_disbursement_lifecycle PASSED        [ 61%]
sql/tests/test_database.py::test_12_transaction_rollback_after_failure PASSED [ 66%]
sql/tests/test_database.py::test_13_role_and_privilege_restrictions PASSED [ 72%]
sql/tests/test_database.py::test_14_sql_injection_resilience PASSED      [ 77%]
sql/tests/test_database.py::test_15_analytical_report_views PASSED       [ 83%]
sql/tests/test_database.py::test_16_concurrency_pessimistic_locking PASSED [ 88%]
sql/tests/test_database.py::test_17_backup_restoration_integrity_verification PASSED [ 94%]
sql/tests/test_database.py::test_18_query_performance_index_utilization PASSED [100%]

============================== 18 passed in 1.23s ==============================
```

---

## 2. Detailed Test Results & Verification Log

### Test 01: Clean Schema Creation & Entity Existence
- **Purpose**: Verifies that all 13 core relational tables exist in the `paypulse_db` schema.
- **Outcome**: **PASSED**. Confirmed presence of: `User_Account`, `Department`, `Designation`, `Employee`, `Salary_Structure`, `Attendance_Log`, `Leave_Type`, `Leave_Allocation`, `Leave_Request`, `Monthly_Payroll`, `Payroll_Component_Detail`, `Disbursement_Record`, `System_Audit_Log`.

### Test 02: Seed Data Loading & Minimum Entity Thresholds
- **Purpose**: Verifies that seed data fulfills academic threshold targets.
- **Outcome**: **PASSED**.
  - `Employee` count: 105 (Target $\ge 100$).
  - `Attendance_Log` count: 2,940 (Target $\ge 2,000$).
  - `Monthly_Payroll` count: 210 (Target $\ge 100$).

### Test 03: Invalid Foreign Key Rejection
- **Purpose**: Asserts that inserting a child row with a non-existent parent key fails.
- **Scenario**: Inserted `Employee` with `Department_ID = 99999`.
- **Outcome**: **PASSED**. MySQL rejected the query with `IntegrityError (1452): Cannot add or update a child row: a foreign key constraint fails`.

### Test 04: Duplicate Candidate Keys Rejection
- **Purpose**: Verifies candidate key uniqueness across entities.
- **Scenarios**:
  - Duplicate `Username = 'admin'` in `User_Account`.
  - Duplicate `(Employee_ID, Work_Date)` in `Attendance_Log`.
  - Duplicate `(Employee_ID, Payroll_Year, Payroll_Month)` in `Monthly_Payroll`.
- **Outcome**: **PASSED**. All rejected with MySQL Error 1062 (Duplicate entry).

### Test 05: Invalid Negative Financial Values Rejection
- **Purpose**: Tests domain CHECK constraints on financial columns.
- **Scenario**: Inserted `Salary_Structure` with `Basic_Salary = -50000.00`.
- **Outcome**: **PASSED**. Rejected with `OperationalError (3819): Check constraint 'chk_salary_basic_positive' is violated`.

### Test 06: Leave Quota Violation Prevention (Trigger)
- **Purpose**: Validates active trigger `trg_EnforceLeaveQuota`.
- **Scenario**: Attempted to transition a 20-day leave request to `'Approved'` for an employee with only 14 days annual quota.
- **Outcome**: **PASSED**. Trigger intercepted update and raised custom error `SIGNAL SQLSTATE '45000' (Quota Exceeded: Insufficient remaining leave balance)`.

### Test 07: Leave Approval, Cancellation & Balance Synchronization (Trigger)
- **Purpose**: Validates automatic ledger updates by `trg_SyncLeaveAllocationOnStatusChange`.
- **Scenario**:
  - Baseline Casual Leave: `Days_Used = 0`, `Days_Remaining = 14`.
  - Request for 3 days approved: Balance updated to `Days_Used = 3`, `Days_Remaining = 11`.
  - Request cancelled: Balance restored to `Days_Used = 0`, `Days_Remaining = 14`.
- **Outcome**: **PASSED**. Mathematical symmetry preserved.

### Test 08: Salary Change Audit Generation (Trigger)
- **Purpose**: Validates automated JSON delta capture by `trg_AuditSalaryModifications`.
- **Scenario**: Updated basic salary for Employee 10 by $+5,000.00$.
- **Outcome**: **PASSED**. An audit record was inserted into `System_Audit_Log` containing `Old_Values` and `New_Values` JSON structures with exact pre/post basic salaries.

### Test 09: Payroll Calculations against Independently Calculated Results
- **Purpose**: Validates `fn_CalculateMonthlyNetPay` against independent mathematics.
- **Scenario**: Basic 120,000, HRA 24,000, Med 12,000, Conv 8,000, OT 12 hrs, Unpaid 2 days, Tax 8%, PF 7.5%.
- **Expected Net**: 146,553.80 BDT.
- **Computed Net**: 146,553.80 BDT.
- **Outcome**: **PASSED**. Zero divergence.

### Test 10: Duplicate Payroll Run Prevention
- **Purpose**: Validates `sp_ProcessMonthlyPayrollBatch` guard clause.
- **Scenario**: Re-ran batch generation for period `(2026, 8)` which is already Finalized/Disbursed.
- **Outcome**: **PASSED**. Aborted with `Cannot regenerate: Payroll for this period is already Finalized or Disbursed`.

### Test 11: Disbursement Lifecycle & Duplicate Rejection
- **Purpose**: Validates `sp_DisbursePayroll` atomic transaction and duplicate prevention.
- **Scenario**: Disbursed test payroll voucher; attempted immediate second disbursement.
- **Outcome**: **PASSED**. First attempt produced valid `BEFTN` reference; second attempt aborted with error `already been disbursed`.

### Test 12: Transaction Rollback After Injected Failure
- **Purpose**: Demonstrates ACID atomicity under statement failure.
- **Scenario**: Created temporary department followed by duplicate code violation; issued `ROLLBACK`.
- **Outcome**: **PASSED**. Verified 0 rows remained.

### Test 13: Role & Privilege Restrictions
- **Purpose**: Validates Principle of Least Privilege for `paypulse_hr_svc`.
- **Scenario**: Logged in as HR account; attempted direct `INSERT INTO Disbursement_Record`.
- **Outcome**: **PASSED**. Denied with MySQL Error 1142 (`INSERT command denied to user 'paypulse_hr_svc'`).

### Test 14: SQL Injection Resilience
- **Purpose**: Verifies that query parameterization neutralizes injection attacks.
- **Scenario**: Queried employee using payload `EMP-1001' OR '1'='1`.
- **Outcome**: **PASSED**. Treated as literal string, returning 0 rows.

### Test 15: Analytical Report Views Correctness
- **Purpose**: Validates database views `vw_DepartmentPayrollExpenditure` and `vw_DisbursementReconciliation`.
- **Outcome**: **PASSED**. Confirmed multi-department aggregations and verified bank account masking (`*******2736`).

### Test 16: Concurrency Simulation & Pessimistic Locking
- **Purpose**: Tests row-level locks via `SELECT ... FOR UPDATE`.
- **Scenario**: Connection 1 acquired exclusive lock on `Salary_Structure`; Connection 2 attempted immediate lock with 1-second timeout.
- **Outcome**: **PASSED**. Connection 2 blocked and raised `OperationalError (1205): Lock wait timeout exceeded`.

### Test 17: Backup & Restoration Referential Integrity Verification
- **Purpose**: Validates complete absence of orphaned records across the schema.
- **Outcome**: **PASSED**. Zero orphaned employees, zero orphaned attendance rows, zero orphaned payroll components.

### Test 18: Query Performance Measurement on Realistic Datasets
- **Purpose**: Measures query latency on 2,900+ attendance records.
- **Threshold**: Latency $< 150\text{ ms}$.
- **Actual Measured Latency**: **18.4 ms** (utilizing `idx_attendance_workdate_status`).
- **Outcome**: **PASSED**.

---

## 3. Standalone SQL Test Execution Output (`sql/08_test_queries.sql`)

```text
Table_Name                  Row_Count   Status
User_Account                106         PASSED
Department                  6           PASSED
Designation                 19          PASSED
Employee                    105         PASSED
Salary_Structure            152         PASSED
Attendance_Log              2940        PASSED
Leave_Type                  6           PASSED
Leave_Allocation            315         PASSED
Leave_Request               60          PASSED
Monthly_Payroll             210         PASSED
Payroll_Component_Detail    1402        PASSED
Disbursement_Record         210         PASSED
System_Audit_Log            14          PASSED

TEST 02: Net Salary Formula Verification: PASSED (123,865.35 BDT)
TEST 03: Bank Account Masking Verification: PASSED (*********2736)
TEST 04: Overtime Calculation Verification: PASSED (7,211.50 BDT)
TEST 05: Atomic Employee Onboarding Stored Procedure: PASSED (EMP-8888 created)
TEST 06: Salary Structure Audit Trigger: PASSED (JSON delta captured in System_Audit_Log)
TEST 07: Leave Approval & Allocation Balance Sync: PASSED (Allocation decremented to 11)
TEST 08: Finalized Payroll Protection Verification: PASSED (210 finalized records preserved)
TEST 09: Transaction Atomic Rollback Test: PASSED (0 orphan records)
TEST 10: Test Data Clean-Up Complete: PASSED
```

---

## 4. Known Limitations & Phase 2 Integration Notes

1. **Biometric Device Polling**: Biometric attendance clock-in hardware typically communicates via UDP or specialized socket agents. In Phase 1, timestamps are recorded via SQL DML and the punch simulator. The Phase 2 ASP.NET Core API will introduce a background hosted service (`IHostedService`) to ingest hardware punch events.
2. **BEFTN Bank Clearing Settlement Window**: Real BEFTN file dispatches occur in daily banking clearance batches (NPSB/BEFTN cycles). The database models settlement states (`Pending`, `Processing`, `Disbursed`, `Failed`, `Reversed`) and generates unique reconciliation tracking numbers.
3. **Session User Attribution**: In stored procedure and trigger executions invoked through web backend connection pools, `@acting_user_id` should be populated per request by an ASP.NET Core action filter to attribute database audits to specific authenticated users.
