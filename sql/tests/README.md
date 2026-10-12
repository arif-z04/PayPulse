# PayPulse Database System — Automated Testing Suite

This directory contains the automated test harness for the PayPulse database layer. Tests execute against a live **MySQL 8.4 LTS** instance to validate relational constraints, trigger workflows, stored procedures, ACID transactions, and analytical views.

---

## 1. Prerequisites

- **Python 3.10+** (Python 3.12 verified)
- **uv** (recommended) or standard `pip`
- Active MySQL 8.4 LTS instance (e.g. Docker container `paypulse-mysql` mapped to port `3308`)

---

## 2. Setup Environment

To install the testing dependencies (`pytest`, `pymysql`, `cryptography`):

```bash
# Using uv (fastest)
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Or using standard python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 3. Running the Test Suite

Execute the test runner script:

```bash
python3 run_tests.py
```

Or invoke `pytest` directly with detailed output:

```bash
pytest -v test_database.py
```

---

## 4. Test Coverage Matrix (18 Core Verification Cases)

| Test Identifier | Category | Assertion & Validation Purpose |
|---|---|---|
| `test_01_schema_creation_and_entity_existence` | Schema DDL | Confirms all 13 core relational tables exist in MySQL engine. |
| `test_02_seed_data_thresholds_and_referential_integrity` | Seed Data | Verifies >= 100 employees, >= 2,000 attendance rows, and multi-month payroll. |
| `test_03_invalid_foreign_key_rejection` | Integrity | Asserts DBMS rejects insertion with invalid parent references (`RESTRICT`). |
| `test_04_duplicate_constraints_rejection` | Candidate Keys | Asserts rejection of duplicate emails, usernames, work dates, and payroll periods. |
| `test_05_invalid_negative_financial_values_rejection` | Domain Rules | Asserts CHECK constraints reject negative basic salaries or allowances. |
| `test_06_leave_quota_violation_prevention_trigger` | Triggers | Asserts `trg_EnforceLeaveQuota` blocks approving leave exceeding quota balance. |
| `test_07_leave_balance_synchronization_on_status_change` | Triggers | Verifies balance increment/decrement on transitions (`Approved` vs `Cancelled`). |
| `test_08_salary_change_audit_generation` | Audit Trail | Asserts `trg_AuditSalaryModifications` logs before/after states as JSON deltas. |
| `test_09_payroll_formula_and_function_correctness` | UDF & Math | Validates `fn_CalculateMonthlyNetPay` against independent math specification. |
| `test_10_duplicate_payroll_run_prevention` | Procedures | Confirms `sp_ProcessMonthlyPayrollBatch` blocks re-running finalized periods. |
| `test_11_disbursement_lifecycle` | Procedures | Validates atomic BEFTN settlement via `sp_DisbursePayroll` and prevents duplicate payouts. |
| `test_12_transaction_rollback_after_failure` | ACID | Verifies transaction rollback after an injected mid-flight constraint violation. |
| `test_13_role_and_privilege_restrictions` | Security RBAC | Validates that HR service account cannot execute banking disbursements. |
| `test_14_sql_injection_resilience` | Security | Verifies that SQL injection payloads are treated strictly as string literals. |
| `test_15_analytical_report_views` | Views | Validates departmental expenditure calculations and account number masking. |
| `test_16_concurrency_pessimistic_locking` | Concurrency | Simulates concurrent `SELECT ... FOR UPDATE` row locks with lock wait timeouts. |
| `test_17_backup_restoration_integrity_verification` | Recovery | Confirms zero orphaned rows across parent-child relationship graphs. |
| `test_18_query_performance_index_utilization` | Indexing | Measures query response on 2,000+ attendance records to be sub-150ms. |
