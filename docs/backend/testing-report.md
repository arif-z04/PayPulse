# PayPulse Automated Testing Report & Verification Suite

This document presents the test strategy, execution logs, and verification results for the **PayPulse** backend.

---

## 1. Testing Strategy

The PayPulse testing suite is split into two distinct testing categories:

1. **Unit Testing (`PayPulse.UnitTests`)**:
   - Focuses on pure business calculations, statutory formulas, leave quota deduction logic, and cryptographic verification without external database or network dependencies.
2. **Integration Testing (`PayPulse.IntegrationTests`)**:
   - Executes end-to-end HTTP requests against an in-memory test host (`CustomWebApplicationFactory`) connected to the live **MySQL 8.4 LTS** database container populated with Phase 1 seed data (105 employees, payroll runs, attendance records).
   - Validates JWT bearer authorization, role-based access restrictions, database querying, and transaction isolation.

---

## 2. Test Execution Summary

| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Execution Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`PayPulse.UnitTests`** | 11 | 11 | 0 | 0 | **100%** | ~1.0 s |
| **`PayPulse.IntegrationTests`** | 14 | 14 | 0 | 0 | **100%** | ~6.0 s |
| **Total Test Suite** | **25** | **25** | **0** | **0** | **100%** | **~7.0 s** |

---

## 3. Unit Test Inventory (`PayPulse.UnitTests`)

### A. Salary & Compensation Calculations (`SalaryCalculationTests.cs`)
- `CalculateSalary_WithStandardInputs_ShouldComputeCorrectAllowancesAndNet`:
  * Verifies: Basic (100,000) + HRA (40,000) + Med (10,000) + Conv (5,000) = Gross 155,000.
  * Validates tax (10%) and PF (5%) deduction calculations.
- `CalculateOvertimePay_WithValidHours_ShouldApplyOnePointFiveMultiplier`:
  * Verifies: Basic (100,000) / (22 days * 8 hours) = Hourly 568.18.
  * Verifies 1.5x multiplier = OT rate 852.27 / hour for 10 hours = 8,522.73 BDT.
- `CalculateDeductions_WithTaxAndProvidentFund_ShouldComputeAccurateDeductions`:
  * Validates precision and rounding of statutory tax and PF withholding.
- `CalculateProRataDailyRate_ShouldDivideBasicByWorkingDays`:
  * Verifies daily pro-rata deduction rate for unpaid leaves.

### B. Leave Management & Quotas (`LeavePolicyTests.cs`)
- `LeaveApplication_WhenRemainingDaysSufficient_ShouldDeductBalance`:
  * Validates quota deduction: 10 allocated - 3 applied = 7 remaining.
- `LeaveApplication_WhenRemainingDaysInsufficient_ShouldFailValidation`:
  * Asserts that attempting to request more days than remaining throws a validation error.
- `StatutoryLeaveTypes_ShouldContainAllRequiredCategories`:
  * Asserts presence of Casual, Medical, Earned, Maternity, Paternity, and Unpaid leave categories.

### C. Cryptography & JWT Security (`SecurityAndAuthTests.cs`)
- `HashPassword_ShouldGenerateValidBCryptHash`:
  * Asserts BCrypt hashes begin with `$2a$` or `$2b$` and salt length.
- `VerifyPassword_WithCorrectPassword_ShouldReturnTrue`:
  * Confirms accurate matching against known salt hashes.
- `VerifyPassword_WithIncorrectPassword_ShouldReturnFalse`:
  * Confirms invalid passwords are systematically rejected.
- `GenerateToken_ShouldEmbedRequiredClaims`:
  * Asserts presence of `nameidentifier`, `role`, `email`, and `employee_id` claims in generated tokens.

---

## 4. Integration Test Inventory (`PayPulse.IntegrationTests`)

### A. Authentication & Authorization (`AuthenticationIntegrationTests.cs`)
- `Login_WithValidAdminCredentials_ShouldReturnOkAndJwtToken`:
  * Performs `POST /api/auth/login` with `admin` credentials against MySQL database. Returns HTTP 200, valid JWT, and user metadata.
- `Login_WithInvalidPassword_ShouldReturnBadRequest`:
  * Submits invalid password. Confirms HTTP 400 Bad Request error response.
- `GetCurrentUser_WithoutToken_ShouldReturnUnauthorized`:
  * Calls protected `GET /api/auth/me` without Authorization header. Asserts HTTP 401 Unauthorized.
- `GetCurrentUser_WithValidToken_ShouldReturnCurrentProfile`:
  * Calls protected `GET /api/auth/me` with Bearer token. Returns authenticated user profile.
- `AdminOnlyEndpoint_WhenAccessedByEmployee_ShouldReturnForbidden`:
  * Logs in as `nusrat.employee` and attempts to access `/api/audit`. Confirms HTTP 403 Forbidden.

### B. Workforce Management (`EmployeeApiIntegrationTests.cs`)
- `GetEmployees_ShouldReturnPaginatedResultsFromMySQL`:
  * Queries `GET /api/employees?page=1&pageSize=10`. Validates 10 items returned and `totalCount >= 105`.
- `GetEmployeeById_WithValidId_ShouldReturnEmployeeDetails`:
  * Queries `GET /api/employees/1`. Returns employee profile with department and designation objects.
- `GetEmployeeSalaryStructure_ShouldReturnConfiguredAllowances`:
  * Queries `/api/employees/1/salary-structure`. Validates Basic Salary, HRA, and allowances.

### C. Monthly Payroll & Disbursements (`PayrollApiIntegrationTests.cs`)
- `GetPayrolls_ShouldReturnRecordsFromMySQL`:
  * Queries `GET /api/payroll?period=2026-08&pageSize=10`. Verifies payslips and itemized component lines.
- `ProcessBatch_OnAlreadyDisbursedPeriod_ShouldBePrevented`:
  * Attempts to re-run payroll batch on disbursed period `2026-08`. Asserts business rule prevention.

### D. Leave & Attendance (`LeaveAndAttendanceApiTests.cs`)
- `GetLeaveTypes_ShouldReturnAllSixStatutoryLeaveTypes`:
  * Queries `GET /api/leave/types`. Verifies all 6 labor law leave policies are returned.
- `GetAttendanceSummary_ShouldReturnAggregateMetrics`:
  * Queries `GET /api/attendance/summary`. Verifies present days, late count, and overtime totals.

### E. Analytics & Search (`ReportsAndAuditApiTests.cs`)
- `GetDepartmentPayrollCost_ShouldReturnAggregatesAcrossAllDepartments`:
  * Queries `GET /api/reports/payroll-cost?period=2026-08`. Returns payroll cost summaries by department.
- `GlobalSearch_WithValidQuery_ShouldReturnRelevantResults`:
  * Queries `GET /api/search?q=Engineering`. Verifies search results across departments and employees.

---

## 5. Console Test Run Output

```
Test run for /home/noir/Projects/PayPulse/tests/PayPulse.UnitTests/bin/Debug/net10.0/PayPulse.UnitTests.dll (.NETCoreApp,Version=v10.0)
VSTest version 18.0.2-dev (x64)

Passed!  - Failed:     0, Passed:    11, Skipped:     0, Total:    11, Duration: 1 s - PayPulse.UnitTests.dll (net10.0)

Test run for /home/noir/Projects/PayPulse/tests/PayPulse.IntegrationTests/bin/Debug/net10.0/PayPulse.IntegrationTests.dll (.NETCoreApp,Version=v10.0)
VSTest version 18.0.2-dev (x64)

Passed!  - Failed:     0, Passed:    14, Skipped:     0, Total:    14, Duration: 6 s - PayPulse.IntegrationTests.dll (net10.0)
```
