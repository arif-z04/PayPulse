# PayPulse Database System — Phase 1 Implementation

This directory contains the complete, production-grade, modular, executable SQL implementation of the **PayPulse — Enterprise Employee Payroll, Attendance, and Leave Management System** database layer.

---

## 1. Technology Environment & Specifications

- **DBMS**: MySQL 8.4 LTS (`8.4.11` verified)
- **Storage Engine**: `InnoDB` (strict ACID transactions, foreign key constraints, row-level locking)
- **Character Set**: `utf8mb4` (Full 4-byte UTF-8, supporting multilingual Bengali Unicode & international characters)
- **Collation**: `utf8mb4_unicode_ci` (Unicode Collation Algorithm compliant)
- **Host Port**: `127.0.0.1:3308` (Docker container: `paypulse-mysql`)
- **Default Database**: `paypulse_db`
- **Application Service Account**: `paypulse_user` / `PayPulseUser@2026!`
- **Root Account**: `root` / `PayPulse@2026!`

---

## 2. Directory Structure & Execution Order

All SQL scripts are sequentially numbered to guarantee clean, deterministic initialization:

```text
sql/
├── README.md                      # Master database documentation, setup, and runbook
├── 00_create_database.sql         # Verifies engine parameters & creates paypulse_db with utf8mb4
├── 01_schema.sql                  # DDL table definitions for all 13 core relational entities
├── 02_constraints_and_indexes.sql # 19 Foreign keys, referential actions & performance B-Tree indexes
├── 03_views.sql                   # 6 Secure operational and executive reporting views
├── 04_functions.sql               # Deterministic scalar UDFs (net pay math, leave balances, masking)
├── 05_procedures.sql               # ACID batch payroll, employee onboarding, disbursements
├── 06_triggers.sql                 # Quota enforcement, balance sync, and JSON audit deltas
├── 07_seed_data.sql               # Comprehensive seed data (105 employees, 2,940 logs, payroll)
├── 08_test_queries.sql             # Standalone functional and transactional verification queries
├── 09_reporting_queries.sql        # 35 Advanced reporting queries (CTEs, Windowing, Aggregations)
├── transactions/                  # Production ACID Transaction Scripts & Scenarios
│   ├── 01_payroll_transaction.sql               # Atomic payroll voucher calculation & line item persistence
│   ├── 02_leave_approval_transaction.sql        # Row-locked leave approval & allocation synchronization
│   ├── 03_employee_creation_transaction.sql     # Multi-entity atomic onboarding (User + Emp + Salary + Quotas)
│   ├── 04_payment_recording_transaction.sql     # Idempotent BEFTN salary disbursement & status transition
│   ├── 05_attendance_correction_transaction.sql # Biometric log adjustment with JSON audit trail
│   ├── 06_transaction_rollback_tests.sql        # Executable rollback tests across 5 failure scenarios
│   └── 07_concurrency_test_scenarios.sql        # Executable MVCC isolation & race-condition verification
└── tests/                         # Automated Python Test Suite (pytest + pymysql)
    ├── README.md                  # Test suite instructions
    ├── requirements.txt           # Test dependencies
    ├── run_tests.py               # Test runner script
    └── test_database.py           # 18 automated test cases covering constraints & ACID
```

---

## 2.1 Production Transaction Management (`sql/transactions/`)

PayPulse relies on strict InnoDB ACID transaction semantics for financial and workforce integrity:

| Script | Workflow | Key ACID / Concurrency Protection |
| :--- | :--- | :--- |
| `01_payroll_transaction.sql` | `sp_ProcessEmployeePayrollTransaction` | Atomic voucher + line items + audit. Prevents duplicate runs for `(Emp_ID, Year, Month)`. |
| `02_leave_approval_transaction.sql` | `sp_ApproveLeaveRequestTransaction` | Pessimistic `FOR UPDATE` row lock on request & quota. Prevents double-approval & balance deficit. |
| `03_employee_creation_transaction.sql` | `sp_CreateEmployeeAtomicTransaction` | Atomic multi-entity creation. Complete rollback on failure; zero orphaned `User_Account` records. |
| `04_payment_recording_transaction.sql` | `sp_RecordPaymentTransaction` | Idempotent disbursement. Unique transaction reference + 1:1 constraint `uq_disb_payroll_id`. |
| `05_attendance_correction_transaction.sql` | `sp_CorrectAttendanceTransaction` | Timestamp ordering check (`checkout >= checkin`), hours limit `<= 24`, structured JSON audit delta. |
| `06_transaction_rollback_tests.sql` | 5 Executable Rollback Scenarios | Verifies zero partial writes upon injected integrity failures across all critical domains. |
| `07_concurrency_test_scenarios.sql` | 5 Executable Concurrency Tests | Verifies MVCC snapshot isolation, lost-update prevention, unique index races, and lock ordering. |

### Running the Transaction Test Scripts:

```bash
# Execute Rollback Test Suite (5 automated scenarios)
mariadb -h 127.0.0.1 -P 3308 -u paypulse_user -p'PayPulseUser@2026!' paypulse_db < sql/transactions/06_transaction_rollback_tests.sql

# Execute Concurrency & Isolation Test Suite (5 automated scenarios)
mariadb -h 127.0.0.1 -P 3308 -u paypulse_user -p'PayPulseUser@2026!' paypulse_db < sql/transactions/07_concurrency_test_scenarios.sql
```

## 3. Quick Start — Database Initialization Guide

### Step 1: Ensure MySQL Container is Running

If the container is already running:
```bash
docker ps | grep paypulse-mysql
```
If not running:
```bash
docker start paypulse-mysql
```
Or create a fresh container:
```bash
docker run -d \
  --name paypulse-mysql \
  --restart unless-stopped \
  -p 127.0.0.1:3308:3306 \
  -e MYSQL_ROOT_PASSWORD='PayPulse@2026!' \
  -e MYSQL_DATABASE='paypulse_db' \
  -e MYSQL_USER='paypulse_user' \
  -e MYSQL_PASSWORD='PayPulseUser@2026!' \
  mysql:8.4
```

---

### Step 2: Execute the SQL Pipeline in Sequential Order

Execute the scripts in order against the running container:

```bash
# 1. Database Creation
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' < sql/00_create_database.sql

# 2. Schema DDL
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/01_schema.sql

# 3. Constraints & Indexes
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/02_constraints_and_indexes.sql

# 4. Database Views
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/03_views.sql

# 5. Functions
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/04_functions.sql

# 6. Stored Procedures
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/05_procedures.sql

# 7. Triggers
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/06_triggers.sql

# 8. Realistic Seed Data
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/07_seed_data.sql
```

---

### Step 3: Run Database Verification Tests

Execute the standalone SQL test script:
```bash
mariadb -h 127.0.0.1 -P 3308 -u root -p'PayPulse@2026!' paypulse_db < sql/08_test_queries.sql
```

Or execute the Python automated test suite:
```bash
python3 sql/tests/run_tests.py
```

---

## 4. Core Relational Entities Summary (13 Entities)

| # | Entity Name | Primary Key | Description |
|---|---|---|---|
| 1 | `User_Account` | `User_ID` | Authentication credentials, RBAC roles, active status |
| 2 | `Department` | `Department_ID` | Corporate business divisions and department heads |
| 3 | `Designation` | `Designation_ID` | Job titles and statutory salary brackets (Min/Max) |
| 4 | `Employee` | `Employee_ID` | Biographical profiles, employment status, manager hierarchy, BEFTN bank data |
| 5 | `Salary_Structure` | `Structure_ID` | Effective-dated compensation, allowances, tax & PF rates |
| 6 | `Attendance_Log` | `Log_ID` | Daily biometric check-in/out timestamps, hours worked, overtime |
| 7 | `Leave_Type` | `Leave_Type_ID` | Statutory leave policy definitions and annual quotas |
| 8 | `Leave_Allocation` | `Allocation_ID` | Real-time annual leave quotas, days used, and days remaining |
| 9 | `Leave_Request` | `Request_ID` | Leave applications, managerial approvals, and status lifecycle |
| 10 | `Monthly_Payroll` | `Payroll_ID` | Point-in-time monthly financial ledger and statutory withholding snapshot |
| 11 | `Payroll_Component_Detail` | `Detail_ID` | Itemized line-item breakdown of allowances and deductions |
| 12 | `Disbursement_Record` | `Disbursement_ID` | BEFTN electronic fund transfer settlement and audit tracking |
| 13 | `System_Audit_Log` | `Audit_ID` | Immutable append-only audit trail with structured JSON deltas |

---

## 5. Security Architecture & RBAC

PayPulse enforces separation between **Application Authorization** (JWT Bearer tokens mapped to enterprise roles) and **Database Security** (least-privilege database user grants).

- `role_paypulse_admin`: Full operational DML on `paypulse_db`.
- `role_paypulse_hr`: Employee onboarding, department & designation catalogs, leave workflows.
- `role_paypulse_payroll`: Compensation structures, batch payroll processing, BEFTN disbursements.
- `role_paypulse_supervisor`: Department attendance review and subordinate leave requests.
- `role_paypulse_employee`: Self-service attendance punching and personal leave balances.
- `role_paypulse_api`: API service account (`paypulse_user` / `paypulse_api_svc`) with complete DML and EXECUTE permissions, strictly prohibiting destructive DDL (`DROP`, `TRUNCATE`, `ALTER`).

Sensitive banking account numbers and national identity cards are masked in database views using `fn_MaskBankAccount`.
