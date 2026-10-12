# PayPulse — Database Transaction, ACID & Concurrency Test Report

## 1. Executive Summary & Metrics

This test report documents the exhaustive verification of database transaction management, ACID properties, and concurrency control across the **PayPulse Employee Payroll, Attendance, and Leave Management System**.

All tests were executed against a real **MySQL 8.4 LTS** instance running InnoDB on `127.0.0.1:3308` and the live **ASP.NET Core Web API / EF Core** backend.

### 1.1. Summary Scorecard

| Test Category | Total Tests | Passed | Failed | Skipped | Success Rate |
|---|---|---|---|---|---|
| **SQL Rollback Test Suite (`sql/transactions/06_*.sql`)** | 5 | 5 | 0 | 0 | **100%** |
| **SQL Concurrency Test Suite (`sql/transactions/07_*.sql`)** | 5 | 5 | 0 | 0 | **100%** |
| **Backend Transaction Integration Tests (`xUnit`)** | 10 | 10 | 0 | 0 | **100%** |
| **Full Regression Suite (`Unit + API + Transaction`)** | 35 | 35 | 0 | 0 | **100%** |

---

## 2. SQL Rollback Test Suite Evidence (`06_transaction_rollback_tests.sql`)

Executed via:
```bash
docker exec -i paypulse-mysql mysql -u paypulse_user -pPayPulseUser@2026! paypulse_db < sql/transactions/06_transaction_rollback_tests.sql
```

### 2.1. Results Matrix

| Scenario # | Scenario Name | Injected Failure | Verified Database Behavior | Status |
|:---:|---|---|---|:---:|
| **1** | Employee Creation Rollback | Duplicate National ID (`uq_emp_nid`) on profile insertion after user account created | `User_Account` insertion rolled back completely (`Count = 0`). Zero orphan users. | **PASS** |
| **2** | Payroll Processing Rollback | Negative component amount (`chk_comp_amount_nonnegative`) on detail line item | Master `Monthly_Payroll` voucher rolled back (`Count = 0`). Zero partial vouchers. | **PASS** |
| **3** | Leave Quota Trigger Rollback | Total days requested exceeds available balance (`Days_Remaining`) | Trigger `trg_SyncLeaveAllocationOnStatusChange` rejects update with `45000`. Status remains `Pending`. | **PASS** |
| **4** | Disbursement Duplicate Rollback | Duplicate `Payroll_ID` violates 1:1 settlement unique constraint `uq_disb_payroll_id` | Duplicate insertion rolled back, `Monthly_Payroll.Status` remains `Approved`, zero disbursement rows. | **PASS** |
| **5** | Attendance Inverted Timestamps Rollback | Check-out timestamp earlier than check-in timestamp | Signal `45000` raised, transaction rolled back, initial attendance logs preserved intact. | **PASS** |

---

## 3. SQL Concurrency Test Suite Evidence (`07_concurrency_test_scenarios.sql`)

Executed via:
```bash
docker exec -i paypulse-mysql mysql -u paypulse_user -pPayPulseUser@2026! paypulse_db < sql/transactions/07_concurrency_test_scenarios.sql
```

### 3.1. Results Matrix

| Scenario # | Scenario Name | Isolation Level | Concurrency Mechanism | Verified Outcome | Status |
|:---:|---|---|---|---|:---:|
| **1** | Dirty Read Prevention | `REPEATABLE READ` | MVCC Read Views & Undo Logs | Uncommitted updates in Session 1 are invisible to Session 2. Clean read view restored upon rollback. | **PASS** |
| **2** | Lost Update Prevention | `REPEATABLE READ` | Pessimistic Locking (`SELECT ... FOR UPDATE`) | Concurrent leave quota deductions are serialized. Decrements from 9 to 7 accurately with zero lost updates. | **PASS** |
| **3** | Duplicate Payroll Generation Race | `REPEATABLE READ` | Unique Index `uq_emp_payroll_period` | First thread succeeds; competing simultaneous thread fails with `ER_DUP_ENTRY (1062)`. Exactly 1 voucher exists. | **PASS** |
| **4** | Payment Idempotency Guard | `REPEATABLE READ` | Unique Index `uq_disb_payroll_id` | Double payout prevented. Exactly 1 disbursement record created for the payroll voucher. | **PASS** |
| **5** | Deadlock Avoidance via Key Ordering | `REPEATABLE READ` | Monotonic Primary Key Sorting (`ASC`) | Batch locking sorted by `Employee_ID ASC` eliminates circular lock wait conditions. | **PASS** |

---

## 4. .NET Integration Test Suite Evidence (`TransactionIntegrationTests.cs`)

Executed via:
```bash
dotnet test --filter "FullyQualifiedName~TransactionIntegrationTests"
```

Output:
```text
Test run for /home/noir/Projects/PayPulse/tests/PayPulse.IntegrationTests/bin/Debug/net10.0/PayPulse.IntegrationTests.dll (.NETCoreApp,Version=v10.0)
VSTest version 18.0.2-dev (x64)
Starting test execution, please wait...
A total of 1 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:    10, Skipped:     0, Total:    10, Duration: 3 s - PayPulse.IntegrationTests.dll (net10.0)
```

### 4.1. Detailed Test Case Specifications & Results

#### Test 1: `Test01_SuccessfulPayrollProcessing_CommitsMasterAndLineItems`
- **Method**: Processes batch payroll for 2027-01 using `IPayrollService.ProcessMonthlyPayrollBatchAsync`.
- **Assertion**:
  - `ProcessedCount > 0`.
  - All master vouchers created.
  - Every voucher contains itemized `PayrollComponentDetail` lines including "Basic Salary".
  - `NetSalary == GrossSalary - TotalDeductions`.
  - `System_Audit_Log` records audit entry for batch run.
- **Result**: **PASS**

#### Test 2: `Test02_PayrollRollback_OnInjectedFailure_RestoresCleanState`
- **Method**: Starts transaction with `CreateExecutionStrategy()`, inserts master `MonthlyPayroll`, then attempts to add a component with `Amount = -9999m`.
- **Assertion**:
  - Catches `DbUpdateException` due to MySQL check constraint `chk_comp_amount_nonnegative`.
  - Master voucher is completely rolled back (`Count = 0`).
- **Result**: **PASS**

#### Test 3: `Test03_LeaveApprovalRollback_OnQuotaExceeded_PreservesPendingState`
- **Method**: Creates leave request for excessive days beyond employee's quota, invokes `ILeaveService.ApproveLeaveRequestAsync`.
- **Assertion**:
  - Throws `BusinessRuleException` with message `*Quota exceeded*`.
  - Leave application status remains `'Pending'`.
  - Leave allocation balance remains unchanged.
- **Result**: **PASS**

#### Test 4: `Test04_ConcurrentLeaveApproval_SerializesUpdates_PreventsDoubleDeduction`
- **Method**: Spawns two concurrent tasks calling `ILeaveService.ApproveLeaveRequestAsync` on the exact same `RequestId`.
- **Assertion**:
  - Exactly 1 approval succeeds (`successCount == 1`).
  - Exactly 1 competing request fails (`conflictCount == 1`) with `BusinessRuleException`.
  - Leave balance is decremented exactly once, verifying total protection against race conditions and double deduction.
- **Result**: **PASS**

#### Test 5: `Test05_ConcurrentPayrollCreation_UniqueConstraint_RejectsDuplicate`
- **Method**: Spawns two concurrent threads attempting to create identical `MonthlyPayroll` records for the same employee, year, and month.
- **Assertion**:
  - Exactly 1 succeeds, exactly 1 fails with unique constraint violation.
  - Exactly 1 record exists in the database.
- **Result**: **PASS**

#### Test 6: `Test06_EmployeeCreationRollback_WhenProfileFails_UserIsRolledBack`
- **Method**: Invokes `IEmployeeService.CreateEmployeeAsync` with an email address but an existing National ID to trigger duplicate key failure on the second step.
- **Assertion**:
  - Throws `DuplicateEntityException`.
  - User account created in Step 1 is completely rolled back (`userInDb == false`).
- **Result**: **PASS**

#### Test 7: `Test07_PaymentConsistency_FailureMidway_RollsBackStatusAndDisbursement`
- **Method**: Updates `MonthlyPayroll.PayrollStatus = "Disbursed"`, then attempts to insert a `DisbursementRecord` with an existing `TransactionReference`.
- **Assertion**:
  - Catches `DbUpdateException` on duplicate index.
  - Transaction rolls back: `MonthlyPayroll.PayrollStatus` remains `'Approved'`, zero disbursement records created.
- **Result**: **PASS**

#### Test 8: `Test08_DuplicateRequests_IdempotencyProtection_PreventsDoubleDisbursement`
- **Method**: Disburses payroll voucher via `IPayrollService.DisbursePayrollAsync`, then calls the same method a second time.
- **Assertion**:
  - First call transitions voucher to `'Disbursed'`.
  - Second call immediately throws `BusinessRuleException` ("already been disbursed").
  - Exactly 1 disbursement record exists in the database.
- **Result**: **PASS**

#### Test 9: `Test09_DeadlockOrTransientErrorHandling_EnsuresSafeFailure`
- **Method**: Simulates explicit transaction rollback while locking records to verify connection cleanliness.
- **Assertion**:
  - Connection is released cleanly without connection pool poisoning or orphaned locks.
  - Subsequent read operations execute normally.
- **Result**: **PASS**

#### Test 10: `Test10_DataIntegrity_InvariantsSatisfied_AcrossFinancialAndLeaveEntities`
- **Method**: Comprehensive invariant check across all active database records.
- **Assertion**:
  - For every `MonthlyPayroll`: `NetSalary == GrossSalary - TotalDeductions`.
  - For every `LeaveAllocation`: `DaysRemaining == TotalAllocatedDays - DaysUsed`.
  - For every `DisbursementRecord`: `DisbursedAmount == MonthlyPayroll.NetSalary`.
- **Result**: **PASS**

---

## 5. Full Backend Test Suite Regression Summary

Executed via:
```bash
dotnet test
```

Output:
```text
Passed!  - Failed: 0, Passed: 11, Skipped: 0, Total: 11, Duration: 1 s - PayPulse.UnitTests.dll (net10.0)
Passed!  - Failed: 0, Passed: 24, Skipped: 0, Total: 24, Duration: 5 s - PayPulse.IntegrationTests.dll (net10.0)
```

**Overall Result**: 35 passed, 0 failed across all domains. Zero regressions detected.
