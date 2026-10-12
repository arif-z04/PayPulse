# PayPulse Database Operations Checklist & Technical Audit

This document provides a comprehensive, production-grade checklist and technical reference of all database operations engineered in the **PayPulse — Enterprise Employee Payroll, Attendance, and Leave Management System** project.

It covers operations spanning the native **MySQL 8.4 LTS** engine, **Entity Framework Core 10** backend persistence layer, **ASP.NET Core Web API** application services, and client-side simulated stores.

---

## 📑 Table of Contents

1. [Architectural Overview & Database Scope](#1-architectural-overview--database-scope)
2. [Category 1: Data Definition Language (DDL) Operations](#category-1-data-definition-language-ddl-operations)
   - [1.1 Database & Schema Initialization](#11-database--schema-initialization)
   - [1.2 Relational Tables (13 Core Entities)](#12-relational-tables-13-core-entities)
   - [1.3 Foreign Keys & Referential Actions (19 FKs)](#13-foreign-keys--referential-actions-19-fks)
   - [1.4 Candidate & Unique Key Constraints (14 Keys)](#14-candidate--unique-key-constraints-14-keys)
   - [1.5 Domain CHECK Constraints (31 Rules)](#15-domain-check-constraints-31-rules)
   - [1.6 Performance B-Tree Indexes (16 Indexes)](#16-performance-b-tree-indexes-16-indexes)
   - [1.7 Secure Database Views (6 Views)](#17-secure-database-views-6-views)
3. [Category 2: Data Manipulation Language (DML) Operations](#category-2-data-manipulation-language-dml-operations)
   - [2.1 INSERT Operations (Data Ingestion & Seeding)](#21-insert-operations-data-ingestion--seeding)
   - [2.2 SELECT & Analytical Query Operations](#22-select--analytical-query-operations)
   - [2.3 UPDATE Operations (State Transitions & Adjustments)](#23-update-operations-state-transitions--adjustments)
   - [2.4 DELETE & TRUNCATE Operations](#24-delete--truncate-operations)
4. [Category 3: Programmable Server-Side Database Objects](#category-3-programmable-server-side-database-objects)
   - [3.1 Stored Procedures (6 Procedures)](#31-stored-procedures-6-procedures)
   - [3.2 User-Defined Functions (6 Scalar UDFs)](#32-user-defined-functions-6-scalar-udfs)
   - [3.3 Active Integrity & Audit Triggers (4 Triggers)](#33-active-integrity--audit-triggers-4-triggers)
5. [Category 4: Transaction Control Language (TCL) & Concurrency Operations](#category-4-transaction-control-language-tcl--concurrency-operations)
   - [4.1 ACID Transaction Management](#41-acid-transaction-management)
   - [4.2 Pessimistic Concurrency & Row-Level Locking](#42-pessimistic-concurrency--row-level-locking)
   - [4.3 Error Handling & Exception Rollbacks](#43-error-handling--exception-rollbacks)
6. [Category 5: Data Control Language (DCL) & Security Operations](#category-5-data-control-language-dcl--security-operations)
   - [5.1 User Accounts & Service Principals](#51-user-accounts--service-principals)
   - [5.2 MySQL Enterprise Roles & Least-Privilege Grants](#52-mysql-enterprise-roles--least-privilege-grants)
   - [5.3 Sensitive Data Protection & Cryptographic Masking](#53-sensitive-data-protection--cryptographic-masking)
   - [5.4 SQL Injection Defense Strategy](#54-sql-injection-defense-strategy)
7. [Category 6: Application Layer & ORM Operations (.NET 10 / EF Core)](#category-6-application-layer--orm-operations-net-10--ef-core)
   - [6.1 Entity Framework Core Configuration & DbContext](#61-entity-framework-core-configuration--dbcontext)
   - [6.2 Application Services Data Access Operations](#62-application-services-data-access-operations)
8. [Category 7: Client-Side Simulated Database Operations (`mockDb.ts`)](#category-7-client-side-simulated-database-operations-mockdbts)
9. [Category 8: Verification, Test Harness & Diagnostic Operations](#category-8-verification-test-harness--diagnostic-operations)
   - [8.1 Standalone SQL Verification Suite (10 Test Suites)](#81-standalone-sql-verification-suite-10-test-suites)
   - [8.2 Automated Python Pytest Verification Suite (18 Criteria)](#82-automated-python-pytest-verification-suite-18-criteria)
   - [8.3 Database Health & Anomaly Scanners](#83-database-health--anomaly-scanners)

---

## 1. Architectural Overview & Database Scope

The PayPulse platform treats the database as the **computational, referential, and integrity core** of the entire human resource and financial system.

| Parameter | Specification | Verification Source |
|---|---|---|
| **DBMS Engine** | MySQL Community Server 8.4 LTS (`8.4.11-1.el9`) | [00_create_database.sql](file:///home/noir/Projects/PayPulse/sql/00_create_database.sql#L1-L26) |
| **Storage Engine** | `InnoDB` (ACID transactions, row-level locks, foreign keys) | [01_schema.sql](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L5) |
| **Character Encoding** | `utf8mb4` (Full 4-byte UTF-8 supporting Bengali Unicode & emojis) | [00_create_database.sql](file:///home/noir/Projects/PayPulse/sql/00_create_database.sql#L15) |
| **Collation** | `utf8mb4_unicode_ci` / `utf8mb4_0900_ai_ci` | [01_schema.sql](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L6) |
| **SQL Mode** | `STRICT_TRANS_TABLES, NO_ZERO_DATE, ERROR_FOR_DIVISION_BY_ZERO` | [database-overview.md](file:///home/noir/Projects/PayPulse/docs/database/database-overview.md#L51) |
| **Isolation Level** | `REPEATABLE-READ` (InnoDB MVCC Snapshot Isolation) | [security-and-transactions.md](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L132-L136) |
| **ORM Framework** | Entity Framework Core 10.0 (`Pomelo.EntityFrameworkCore.MySql 9.0`) | [AppDbContext.cs](file:///home/noir/Projects/PayPulse/src/PayPulse.Infrastructure/Persistence/AppDbContext.cs#L8-L31) |
| **Relational Model** | 13 Core Entities in 3NF / BCNF | [data-dictionary.md](file:///home/noir/Projects/PayPulse/docs/database/data-dictionary.md#L1-L80) |

---

## Category 1: Data Definition Language (DDL) Operations

### 1.1 Database & Schema Initialization
- [x] **Create Database with Character Set**: `CREATE DATABASE IF NOT EXISTS paypulse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` — [00_create_database.sql:L15-L16](file:///home/noir/Projects/PayPulse/sql/00_create_database.sql#L15-L16)
- [x] **Session Configuration Enforcement**: Explicitly sets `NAMES utf8mb4` and validates engine parameters before DDL execution — [00_create_database.sql:L20-L26](file:///home/noir/Projects/PayPulse/sql/00_create_database.sql#L20-L26)
- [x] **Foreign Key Checks Toggling**: Disables `FOREIGN_KEY_CHECKS = 0` during initialization and restores to `1` post-DDL for clean ordering — [01_schema.sql:L13-L14](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L13-L14), [01_schema.sql:L347](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L347)

### 1.2 Relational Tables (13 Core Entities)
- [x] **`User_Account` Table Creation**: Defines identity, salted credential storage (BCrypt/Argon2), RBAC roles enum, and active flags — [01_schema.sql:L20-L38](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L20-L38)
- [x] **`Department` Table Creation**: Defines organizational units, corporate codes, office physical locations, and nullable department head pointer — [01_schema.sql:L45-L60](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L45-L60)
- [x] **`Designation` Table Creation**: Defines job roles, departmental alignments, and statutory base salary range brackets (`Base_Salary_Min`, `Base_Salary_Max`) — [01_schema.sql:L67-L82](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L67-L82)
- [x] **`Employee` Table Creation**: Defines biographical records, NID, date of birth, contact details, managerial hierarchy, and BEFTN bank routing specifications — [01_schema.sql:L89-L120](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L89-L120)
- [x] **`Salary_Structure` Table Creation**: Defines effective-dated compensation versions, allowances (HRA, medical, conveyance), and statutory Tax/PF withholding percentages — [01_schema.sql:L128-L151](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L128-L151)
- [x] **`Attendance_Log` Table Creation**: Defines daily biometric punch timestamps, total working hours, overtime hours, and attendance states — [01_schema.sql:L158-L175](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L158-L175)
- [x] **`Leave_Type` Table Creation**: Defines corporate leave categories, annual quotas, paid/unpaid flags, and carry-forward rules — [01_schema.sql:L182-L194](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L182-L194)
- [x] **`Leave_Allocation` Table Creation**: Defines annual calendar year employee leave ledgers, allocated days, used days, and remaining days — [01_schema.sql:L201-L219](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L201-L219)
- [x] **`Leave_Request` Table Creation**: Defines leave applications, date boundaries, total requested days, approval statuses, and supervisor sign-offs — [01_schema.sql:L226-L243](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L226-L243)
- [x] **`Monthly_Payroll` Table Creation**: Defines immutable historical compensation ledgers, working/present/leave day counts, gross pay, deductions, and net pay snapshots — [01_schema.sql:L250-L284](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L250-L284)
- [x] **`Payroll_Component_Detail` Table Creation**: Defines itemized granular earnings and deductions breakdown lines per monthly payslip — [01_schema.sql:L291-L302](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L291-L302)
- [x] **`Disbursement_Record` Table Creation**: Defines electronic funds transfer (BEFTN) settlement tracking, transaction reference keys, and payment dates — [01_schema.sql:L308-L325](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L308-L325)
- [x] **`System_Audit_Log` Table Creation**: Defines an immutable append-only audit trail capturing table names, operation types, before/after JSON states, and actor IDs — [01_schema.sql:L332-L344](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L332-L344)

### 1.3 Foreign Keys & Referential Actions (19 FKs)
- [x] **`fk_designation_department`**: `Designation(Department_ID) -> Department(Department_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L20-L25](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L20-L25)
- [x] **`fk_employee_department`**: `Employee(Department_ID) -> Department(Department_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L32-L37](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L32-L37)
- [x] **`fk_employee_designation`**: `Employee(Designation_ID) -> Designation(Designation_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L44-L49](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L44-L49)
- [x] **`fk_employee_user`**: `Employee(User_ID) -> User_Account(User_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L56-L61](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L56-L61)
- [x] **`fk_employee_manager`**: `Employee(Manager_ID) -> Employee(Employee_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L68-L73](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L68-L73)
- [x] **`fk_department_head`**: Circular FK `Department(Head_Of_Department_ID) -> Employee(Employee_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L80-L85](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L80-L85)
- [x] **`fk_salary_structure_employee`**: `Salary_Structure(Employee_ID) -> Employee(Employee_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L92-L97](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L92-L97)
- [x] **`fk_attendance_employee`**: `Attendance_Log(Employee_ID) -> Employee(Employee_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L103-L108](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L103-L108)
- [x] **`fk_leave_allocation_employee`**: `Leave_Allocation(Employee_ID) -> Employee(Employee_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L114-L119](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L114-L119)
- [x] **`fk_leave_allocation_type`**: `Leave_Allocation(Leave_Type_ID) -> Leave_Type(Leave_Type_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L125-L130](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L125-L130)
- [x] **`fk_leave_request_employee`**: `Leave_Request(Employee_ID) -> Employee(Employee_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L136-L141](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L136-L141)
- [x] **`fk_leave_request_type`**: `Leave_Request(Leave_Type_ID) -> Leave_Type(Leave_Type_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L147-L152](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L147-L152)
- [x] **`fk_leave_request_approver`**: `Leave_Request(Approved_By_User_ID) -> User_Account(User_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L159-L164](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L159-L164)
- [x] **`fk_monthly_payroll_employee`**: `Monthly_Payroll(Employee_ID) -> Employee(Employee_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE` — Protects financial history) — [02_constraints_and_indexes.sql:L171-L176](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L171-L176)
- [x] **`fk_monthly_payroll_user`**: `Monthly_Payroll(Generated_By_User_ID) -> User_Account(User_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L182-L187](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L182-L187)
- [x] **`fk_payroll_component_payroll`**: `Payroll_Component_Detail(Payroll_ID) -> Monthly_Payroll(Payroll_ID)` (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L194-L199](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L194-L199)
- [x] **`fk_disbursement_payroll`**: `Disbursement_Record(Payroll_ID) -> Monthly_Payroll(Payroll_ID)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE` — Strictly blocks deleting disbursed payroll) — [02_constraints_and_indexes.sql:L206-L211](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L206-L211)
- [x] **`fk_disbursement_user`**: `Disbursement_Record(Disbursed_By_User_ID) -> User_Account(User_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L217-L222](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L217-L222)
- [x] **`fk_audit_user`**: `System_Audit_Log(Changed_By_User) -> User_Account(User_ID)` (`ON DELETE SET NULL`, `ON UPDATE CASCADE`) — [02_constraints_and_indexes.sql:L228-L233](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L228-L233)

### 1.4 Candidate & Unique Key Constraints (14 Keys)
- [x] **`uq_user_username`**: Unique usernames across the authentication database — [01_schema.sql:L35](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L35)
- [x] **`uq_dept_name`**: Unique department name — [01_schema.sql:L56](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L56)
- [x] **`uq_dept_code`**: Unique uppercase corporate department code (e.g., `ENG`, `HRD`) — [01_schema.sql:L57](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L57)
- [x] **`uq_dept_designation_title`**: Composite unique `(Department_ID, Title)` — [01_schema.sql:L78](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L78)
- [x] **`uq_emp_code`**: Unique employee alphanumeric identifier (`EMP-1001`) — [01_schema.sql:L113](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L113)
- [x] **`uq_emp_user_id`**: 1:1 Mandatory relationship enforcement between User and Employee profile — [01_schema.sql:L114](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L114)
- [x] **`uq_emp_email`**: Unique official corporate email address — [01_schema.sql:L115](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L115)
- [x] **`uq_emp_nid`**: Unique Bangladeshi National ID card number — [01_schema.sql:L116](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L116)
- [x] **`uq_emp_work_date`**: Composite unique `(Employee_ID, Work_Date)` preventing duplicate daily attendance punches — [01_schema.sql:L170](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L170)
- [x] **`uq_leave_type_name`**: Unique statutory leave policy category name — [01_schema.sql:L191](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L191)
- [x] **`uq_emp_leave_year`**: Composite unique `(Employee_ID, Leave_Type_ID, Calendar_Year)` — [01_schema.sql:L212](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L212)
- [x] **`uq_emp_payroll_period`**: Composite unique `(Employee_ID, Payroll_Year, Payroll_Month)` preventing duplicate payroll vouchers — [01_schema.sql:L270](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L270)
- [x] **`uq_disb_payroll_id`**: 1:1 Strict settlement relationship between payroll and disbursement voucher — [01_schema.sql:L321](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L321)
- [x] **`uq_disb_txref`**: Unique electronic banking BEFTN reference code — [01_schema.sql:L322](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L322)

### 1.5 Domain CHECK Constraints (31 Rules)
- [x] **`chk_user_username_minlen`**: `CHAR_LENGTH(TRIM(Username)) >= 3` — [01_schema.sql:L36](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L36)
- [x] **`chk_dept_code_format`**: `CHAR_LENGTH(TRIM(Department_Code)) >= 2` — [01_schema.sql:L58](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L58)
- [x] **`chk_desig_salary_min`**: `Base_Salary_Min >= 0.00` — [01_schema.sql:L79](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L79)
- [x] **`chk_desig_salary_range`**: `Base_Salary_Max >= Base_Salary_Min` — [01_schema.sql:L80](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L80)
- [x] **`chk_emp_name_nonempty`**: Verifies first and last names contain at least 1 non-whitespace character — [01_schema.sql:L117](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L117)
- [x] **`chk_emp_age_adult`**: `Hire_Date >= Date_Of_Birth` — [01_schema.sql:L118](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L118)
- [x] **`chk_salary_basic_positive`**: `Basic_Salary > 0.00` (strictly positive basic compensation) — [01_schema.sql:L143](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L143)
- [x] **`chk_salary_hra_nonnegative`**: `House_Rent_Allowance >= 0.00` — [01_schema.sql:L144](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L144)
- [x] **`chk_salary_med_nonnegative`**: `Medical_Allowance >= 0.00` — [01_schema.sql:L145](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L145)
- [x] **`chk_salary_conv_nonnegative`**: `Conveyance_Allowance >= 0.00` — [01_schema.sql:L146](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L146)
- [x] **`chk_salary_tax_rate_range`**: `Tax_Deduction_Rate BETWEEN 0.00 AND 100.00` — [01_schema.sql:L147](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L147)
- [x] **`chk_salary_pf_rate_range`**: `Provident_Fund_Rate BETWEEN 0.00 AND 100.00` — [01_schema.sql:L148](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L148)
- [x] **`chk_salary_effective_dates`**: `Effective_To IS NULL OR Effective_To >= Effective_From` — [01_schema.sql:L149](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L149)
- [x] **`chk_att_hours_range`**: `Working_Hours BETWEEN 0.00 AND 24.00` — [01_schema.sql:L171](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L171)
- [x] **`chk_att_ot_range`**: `Overtime_Hours BETWEEN 0.00 AND 16.00` — [01_schema.sql:L172](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L172)
- [x] **`chk_att_checkout_after_checkin`**: `Check_Out_Time IS NULL OR Check_Out_Time >= Check_In_Time` — [01_schema.sql:L173](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L173)
- [x] **`chk_leave_type_days_range`**: `Max_Days_Per_Year BETWEEN 0 AND 365` — [01_schema.sql:L192](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L192)
- [x] **`chk_alloc_year_range`**: `Calendar_Year BETWEEN 2000 AND 2100` — [01_schema.sql:L213](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L213)
- [x] **`chk_alloc_allocated_positive`**: `Total_Allocated >= 0` — [01_schema.sql:L214](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L214)
- [x] **`chk_alloc_used_nonnegative`**: `Days_Used >= 0` — [01_schema.sql:L215](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L215)
- [x] **`chk_alloc_remaining_nonnegative`**: `Days_Remaining >= 0` — [01_schema.sql:L216](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L216)
- [x] **`chk_alloc_balance_identity`**: Invariant `Days_Remaining = Total_Allocated - Days_Used` — [01_schema.sql:L217](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L217)
- [x] **`chk_req_date_order`**: `End_Date >= Start_Date` — [01_schema.sql:L240](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L240)
- [x] **`chk_req_total_days_positive`**: `Total_Days > 0` — [01_schema.sql:L241](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L241)
- [x] **`chk_pay_month_range`**: `Payroll_Month BETWEEN 1 AND 12` — [01_schema.sql:L271](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L271)
- [x] **`chk_pay_year_range`**: `Payroll_Year BETWEEN 2000 AND 2100` — [01_schema.sql:L272](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L272)
- [x] **`chk_pay_working_days_range`**: `Working_Days BETWEEN 0 AND 31` — [01_schema.sql:L273](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L273)
- [x] **`chk_pay_present_days_range`**: `Present_Days BETWEEN 0 AND Working_Days` — [01_schema.sql:L274](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L274)
- [x] **`chk_pay_gross_geq_basic`**: `Gross_Salary >= Basic_Salary` — [01_schema.sql:L279](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L279)
- [x] **`chk_pay_net_nonnegative`**: `Net_Salary >= 0.00` — [01_schema.sql:L281](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L281)
- [x] **`chk_pay_math_consistency`**: Invariant `Net_Salary = Gross_Salary - Total_Deductions` — [01_schema.sql:L282](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L282)

### 1.6 Performance B-Tree Indexes (16 Indexes)
- [x] **`idx_employee_department_status`**: On `Employee(Department_ID, Employment_Status)` — [02_constraints_and_indexes.sql:L244-L245](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L244-L245)
- [x] **`idx_employee_designation_status`**: On `Employee(Designation_ID, Employment_Status)` — [02_constraints_and_indexes.sql:L247-L248](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L247-L248)
- [x] **`idx_employee_manager`**: On `Employee(Manager_ID)` for recursive CTE tree traversals — [02_constraints_and_indexes.sql:L250-L251](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L250-L251)
- [x] **`idx_employee_hire_date`**: On `Employee(Hire_Date)` for tenure sorting — [02_constraints_and_indexes.sql:L253-L254](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L253-L254)
- [x] **`idx_attendance_workdate_status`**: On `Attendance_Log(Work_Date, Attendance_Status)` (Yields 94% cost reduction in benchmarks) — [02_constraints_and_indexes.sql:L260-L261](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L260-L261)
- [x] **`idx_attendance_emp_date_status`**: On `Attendance_Log(Employee_ID, Work_Date, Attendance_Status)` — [02_constraints_and_indexes.sql:L263-L264](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L263-L264)
- [x] **`idx_salary_structure_emp_active`**: On `Salary_Structure(Employee_ID, Is_Active, Effective_From)` — [02_constraints_and_indexes.sql:L270-L271](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L270-L271)
- [x] **`idx_leave_request_status_emp`**: On `Leave_Request(Status, Employee_ID)` for supervisor review queues — [02_constraints_and_indexes.sql:L277-L278](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L277-L278)
- [x] **`idx_leave_request_dates_status`**: On `Leave_Request(Start_Date, End_Date, Status)` — [02_constraints_and_indexes.sql:L280-L281](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L280-L281)
- [x] **`idx_leave_allocation_year_emp`**: On `Leave_Allocation(Calendar_Year, Employee_ID)` — [02_constraints_and_indexes.sql:L283-L284](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L283-L284)
- [x] **`idx_monthly_payroll_period_status`**: On `Monthly_Payroll(Payroll_Year, Payroll_Month, Payroll_Status)` — [02_constraints_and_indexes.sql:L290-L291](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L290-L291)
- [x] **`idx_monthly_payroll_emp_period`**: On `Monthly_Payroll(Employee_ID, Payroll_Year, Payroll_Month)` — [02_constraints_and_indexes.sql:L293-L294](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L293-L294)
- [x] **`idx_payroll_component_type_name`**: On `Payroll_Component_Detail(Payroll_ID, Component_Type, Component_Name)` — [02_constraints_and_indexes.sql:L300-L301](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L300-L301)
- [x] **`idx_disbursement_status_date`**: On `Disbursement_Record(Disbursement_Status, Disbursement_Date)` — [02_constraints_and_indexes.sql:L307-L308](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L307-L308)
- [x] **`idx_audit_table_record`**: On `System_Audit_Log(Table_Name, Record_ID)` — [02_constraints_and_indexes.sql:L314-L315](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L314-L315)
- [x] **`idx_audit_timestamp_user`**: On `System_Audit_Log(Action_Timestamp, Changed_By_User)` — [02_constraints_and_indexes.sql:L317-L318](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L317-L318)

### 1.7 Secure Database Views (6 Views)
- [x] **`vw_EmployeeDirectory`**: Joins Employee, Department, Designation, Manager, and User, hiding credential hashes, NID, and bank details — [03_views.sql:L16-L45](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L16-L45)
- [x] **`vw_AttendanceMonthlySummary`**: Aggregates present, late, half-day, absent, and on-leave days alongside overtime hours and average working hours per employee and month — [03_views.sql:L51-L80](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L51-L80)
- [x] **`vw_MonthlyPayrollSummary`**: Formats monthly payroll records linked with BEFTN disbursement settlement status and references — [03_views.sql:L85-L119](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L85-L119)
- [x] **`vw_LeaveBalanceAndPendingRequests`**: Computes live leave quotas, used days, remaining days, and pending approval counters using correlated subqueries — [03_views.sql:L124-L152](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L124-L152)
- [x] **`vw_DepartmentPayrollExpenditure`**: Executive summary rolling up headcount, basic, gross, deductions, and average net salary by department and period — [03_views.sql:L157-L182](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L157-L182)
- [x] **`vw_DisbursementReconciliation`**: Banking audit view with masked bank accounts (`*******2736`) reconciling net salaries with disbursed amounts — [03_views.sql:L187-L212](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L187-L212)

---

## Category 2: Data Manipulation Language (DML) Operations

### 2.1 INSERT Operations (Data Ingestion & Seeding)
- [x] **Seed Departments & Reference Catalog**: Ingests 6 corporate departments and 17 standardized designations with strict salary boundaries — [07_seed_data.sql:L31-L100](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L31-L100)
- [x] **Seed Leave Policies**: Inserts 6 statutory leave types (Casual, Sick, Earned, Maternity, Paternity, Unpaid) — [07_seed_data.sql:L105-L125](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L105-L125)
- [x] **Seed 105 Enterprise Employees & Users**: Generates 105 user credentials with BCrypt hashes, corresponding employee profiles, NID, and BEFTN banking particulars — [07_seed_data.sql:L130-L500](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L130-L500)
- [x] **Seed Effective-Dated Salary Structures**: Provisions active baseline compensation structures for all 105 employees within their designation pay bands — [07_seed_data.sql:L510-L750](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L510-L750)
- [x] **Seed 2,940 Biometric Attendance Logs**: Ingests 2,940 authentic check-in/out records for August 2026 across 28 days with realistic shift variances and overtime — [07_seed_data.sql:L800-L3800](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L800-L3800)
- [x] **Seed Leave Allocations & Applications**: Provisions 315 annual entitlement ledgers and historical leave requests with manager approvals — [07_seed_data.sql:L3850-L4500](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L3850-L4500)
- [x] **Seed Monthly Payrolls & Components**: Ingests 210 finalized monthly payroll snapshots and 1,050+ itemized component detail line items — [07_seed_data.sql:L4550-L5400](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L4550-L5400)
- [x] **Seed BEFTN Disbursements**: Ingests 210 electronic fund transfer settlement vouchers with unique transaction references — [07_seed_data.sql:L5450-L5650](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L5450-L5650)
- [x] **Atomic Employee Onboarding Insertion**: Stored procedure `sp_OnboardEmployeeWithSalary` executes multi-table transactional insertion (`User_Account`, `Employee`, `Salary_Structure`, `Leave_Allocation`) — [05_procedures.sql:L323-L450](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L323-L450)
- [x] **Biometric Daily Punch Insertion**: `AttendanceService.RecordAttendanceAsync` inserts clock-in/out entries with automated hours calculation — [AttendanceService.cs:L68-L105](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/AttendanceService.cs#L68-L105)
- [x] **Automated Audit Event Ingestion**: Inserts structured JSON delta snapshots into `System_Audit_Log` on modifications — [06_triggers.sql:L40-L72](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L40-L72)

### 2.2 SELECT & Analytical Query Operations
- [x] **Keyset & Offset Pagination Filtering**: Multi-table joined employee directory pagination with dynamic status filtering — [09_reporting_queries.sql:L18-L44](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L18-L44)
- [x] **Parameterized Multi-Attribute Global Search**: Multi-column LIKE query searching across first name, last name, employee code, and NID — [09_reporting_queries.sql:L46-L64](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L46-L64)
- [x] **Database Health & Invariant Scanner**: Compound `UNION ALL` scan verifying orphan absence, net pay formula consistency, and leave balance identities — [09_reporting_queries.sql:L66-L82](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L66-L82)
- [x] **Recursive CTE Organizational Reporting Tree**: Traverses executive hierarchy from CEO down to junior staff calculating tree depth and reporting paths — [09_reporting_queries.sql:L97-L145](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L97-L145)
- [x] **Window Ranking via `DENSE_RANK()` & `RANK()`**: Ranks departmental compensation tiers and identifies salary disparities — [09_reporting_queries.sql:L149-L182](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L149-L182)
- [x] **Month-over-Month Payroll Variance via `LAG()`**: Calculates percentage payroll growth and expenditure shift across sequential pay cycles — [09_reporting_queries.sql:L185-L227](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L185-L227)
- [x] **Chronic Absenteeism & Outlier Detection**: Identifies employees with late arrivals or unexcused absences above organizational thresholds — [09_reporting_queries.sql:L230-L252](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L230-L252)
- [x] **High-Overtime Expenditure Benchmarking**: CTE computing mean departmental overtime and isolating personnel exceeding 1.5 standard deviations — [09_reporting_queries.sql:L255-L292](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L255-L292)
- [x] **Statutory Tax & Provident Fund Compliance Statement**: Aggregates taxable incomes, corporate matching PF, and national board remittances — [09_reporting_queries.sql:L295-L332](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L295-L332)
- [x] **Designation Pay Band Compliance Audit**: Validates active salaries against `Base_Salary_Min` and `Base_Salary_Max` boundaries — [09_reporting_queries.sql:L335-L361](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L335-L361)
- [x] **BEFTN Bank Reconciliation Query**: Audits disbursed amounts against payroll vouchers and flags mismatches — [09_reporting_queries.sql:L364-L381](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L364-L381)
- [x] **Leave Liability & Accrual Exposure Report**: Computes corporate financial liability of unconsumed statutory earned leave days — [09_reporting_queries.sql:L384-L407](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L384-L407)
- [x] **Compensation Quartiles & Percentiles via `NTILE(4)`**: Stratifies total workforce earnings into quartile distributions — [09_reporting_queries.sql:L410-L441](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L410-L441)
- [x] **Structured JSON Audit Trail Inspection**: Extracts structured `Old_Values` and `New_Values` delta JSON payloads from `System_Audit_Log` — [09_reporting_queries.sql:L444-L465](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L444-L465)
- [x] **Correlated Subquery Above-Average Salary Filter**: Selects employees earning higher than their departmental average salary — [09_reporting_queries.sql:L468-L492](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L468-L492)
- [x] **Hierarchical Rollup Aggregations via `WITH ROLLUP`**: Generates super-aggregate headcount and gross expenditure summaries — [09_reporting_queries.sql:L495-L510](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L495-L510)
- [x] **Day-over-Day Working Hours Variance via `LEAD()`**: Compares consecutive day biometric shifts per employee — [09_reporting_queries.sql:L534-L559](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L534-L559)
- [x] **Running Total Spend Accumulator**: Computes cumulative payroll expenditure across calendar months using windowed `SUM()` — [09_reporting_queries.sql:L562-L578](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L562-L578)

### 2.3 UPDATE Operations (State Transitions & Adjustments)
- [x] **Leave Request State Transitions**:
  - `sp_ApproveLeaveRequest`: Transitions status from `'Pending'` to `'Approved'`, activates quota deduction triggers, and records approval comments — [05_procedures.sql:L556-L625](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L556-L625)
  - `sp_RejectLeaveRequest`: Transitions status to `'Rejected'` and appends justification remarks without altering quotas — [05_procedures.sql:L629-L675](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L629-L675)
- [x] **Automatic Leave Quota Synchronization**:
  - Increments `Days_Used` and decrements `Days_Remaining` upon leave approval — [06_triggers.sql:L123-L132](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L123-L132)
  - Restores quota balance upon approved leave cancellation — [06_triggers.sql:L133-L142](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L133-L142)
- [x] **Payroll Lifecycle Status Updates**:
  - `sp_FinalizeMonthlyPayroll`: Transitions payroll from `'Generated'` / `'Draft'` to `'Finalized'` and locks finalized timestamp — [05_procedures.sql:L281-L318](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L281-L318)
  - `sp_DisbursePayroll`: Transitions status to `'Disbursed'` after generating the unique BEFTN banking voucher — [05_procedures.sql:L525-L528](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L525-L528)
- [x] **Salary Structure Compensation Revision**: Updates basic pay or allowances while automatically firing trigger `trg_AuditSalaryModifications` — [06_triggers.sql:L20-L74](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L20-L74)
- [x] **Biometric Time Corrections**: Updates check-out times and recalculates total working duration — [AttendanceService.cs:L135-L165](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/AttendanceService.cs#L135-L165)
- [x] **Employee Bank Account Revisions**: Updates bank name, routing number, and branch details — [EmployeeService.cs:L240-L280](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/EmployeeService.cs#L240-L280)

### 2.4 DELETE & TRUNCATE Operations
- [x] **Draft Payroll Batch Purge**: Deletes unfinalized (`'Draft'`, `'Generated'`) payroll vouchers prior to batch regeneration, ensuring idempotent re-runs — [05_procedures.sql:L111-L115](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L111-L115)
- [x] **Cascading Employee Entity Deletion**: Cascades deletions to dependent profile structures (`Salary_Structure`, `Attendance_Log`, `Leave_Allocation`, `Leave_Request`) upon employee termination — [02_constraints_and_indexes.sql:L92-L141](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L92-L141)
- [x] **Restricted Financial Record Deletion Protection**: Prohibits deletion of employees who have associated `Monthly_Payroll` records (`ON DELETE RESTRICT`), preserving statutory tax integrity — [02_constraints_and_indexes.sql:L171-L176](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L171-L176)
- [x] **Restricted Settlement Deletion Protection**: Prohibits deleting finalized payroll records linked to an active `Disbursement_Record` (`ON DELETE RESTRICT`) — [02_constraints_and_indexes.sql:L206-L211](file:///home/noir/Projects/PayPulse/sql/02_constraints_and_indexes.sql#L206-L211)
- [x] **Catalog Table Truncation**: Reinitializes seed catalogs via `TRUNCATE TABLE` under disabled foreign key constraints — [07_seed_data.sql:L31](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L31), [07_seed_data.sql:L46](file:///home/noir/Projects/PayPulse/sql/07_seed_data.sql#L46)
- [x] **Test Fixture Clean-Up**: Atomically purges temporary QA entities post-test execution — [08_test_queries.sql:L210-L212](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L210-L212)

---

## Category 3: Programmable Server-Side Database Objects

### 3.1 Stored Procedures (6 Procedures)
- [x] **`sp_ProcessMonthlyPayrollBatch(p_payroll_year, p_payroll_month, p_generated_by_user_id)`**:
  - Iterates over all active employees using cursor `cur_employees`.
  - Aggregates biometric attendance and approved leaves (paid vs unpaid).
  - Calculates daily rate ($Basic / 26$), overtime pay ($Hourly \times 1.5$), income tax, and provident fund.
  - Inserts `Monthly_Payroll` and itemized `Payroll_Component_Detail` rows atomically.
  - Blocks execution if payroll for the period is already Finalized/Disbursed.
  - Declares `EXIT HANDLER FOR SQLEXCEPTION` with transaction rollback.
  - Source: [05_procedures.sql:L20-L277](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L20-L277)
- [x] **`sp_FinalizeMonthlyPayroll(p_payroll_year, p_payroll_month, p_user_id)`**:
  - Atomically locks generated payroll batches from `'Generated'` to `'Finalized'`.
  - Sets `Finalized_Date = NOW()` and appends execution entry to `System_Audit_Log`.
  - Source: [05_procedures.sql:L281-L318](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L281-L318)
- [x] **`sp_OnboardEmployeeWithSalary(...)`** (23 Parameters):
  - Validates salary within designation min/max salary brackets.
  - Atomically inserts `User_Account`, `Employee`, `Salary_Structure`, and initial `Leave_Allocation` quotas in a single transaction.
  - Outputs newly created employee ID via `OUT p_new_employee_id`.
  - Source: [05_procedures.sql:L323-L450](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L323-L450)
- [x] **`sp_DisbursePayroll(p_payroll_id, p_payment_method, p_transaction_prefix, p_processed_by_user_id, OUT p_transaction_reference)`**:
  - Acquires pessimistic lock on `Monthly_Payroll` (`SELECT ... FOR UPDATE`).
  - Verifies payroll is in `'Finalized'` or `'Approved'` status and not already disbursed.
  - Generates unique reference `BEFTN-YYYYMMDD-<Payroll_ID>-<RAND>`.
  - Inserts into `Disbursement_Record` and sets `Monthly_Payroll.Payroll_Status = 'Disbursed'`.
  - Source: [05_procedures.sql:L456-L551](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L456-L551)
- [x] **`sp_ApproveLeaveRequest(p_request_id, p_approver_user_id, p_approval_remarks)`**:
  - Locks `Leave_Request` and `Leave_Allocation` rows pessimisticly.
  - Asserts status is `'Pending'` and `Days_Remaining >= Total_Days`.
  - Sets status to `'Approved'`, which activates balance synchronization triggers.
  - Source: [05_procedures.sql:L556-L625](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L556-L625)
- [x] **`sp_RejectLeaveRequest(p_request_id, p_approver_user_id, p_rejection_remarks)`**:
  - Validates request is `'Pending'`.
  - Sets status to `'Rejected'`, stores approver remarks, and leaves quota untouched.
  - Source: [05_procedures.sql:L629-L675](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L629-L675)

### 3.2 User-Defined Functions (6 Scalar UDFs)
- [x] **`fn_CalculateMonthlyNetPay`**:
  - `DETERMINISTIC NO SQL` function.
  - Computes net pay: $Gross - (Tax + PF + UnpaidLeaveDeduction)$.
  - Source: [04_functions.sql:L20-L60](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L20-L60)
- [x] **`fn_GetEmployeeLeaveBalance`**:
  - `READS SQL DATA` function.
  - Queries real-time `Days_Remaining` for employee, leave type, and calendar year.
  - Source: [04_functions.sql:L68-L86](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L68-L86)
- [x] **`fn_GetDepartmentMonthlyPayrollTotal`**:
  - `READS SQL DATA` function.
  - Computes aggregated net payroll spend for a given department, year, and month.
  - Source: [04_functions.sql:L94-L113](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L94-L113)
- [x] **`fn_MaskBankAccount`**:
  - `DETERMINISTIC NO SQL` function.
  - Masks account numbers for privacy (e.g., `1501201982736` $\rightarrow$ `*********2736`).
  - Source: [04_functions.sql:L121-L138](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L121-L138)
- [x] **`fn_CalculateOvertimePay`**:
  - `DETERMINISTIC NO SQL` function.
  - Implements formula: $(Basic / (26 \times 8.0)) \times 1.5 \times OvertimeHours$.
  - Source: [04_functions.sql:L145-L160](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L145-L160)
- [x] **`fn_GetEmployeeTenureMonths`**:
  - `READS SQL DATA` function.
  - Calculates elapsed tenure in complete calendar months (`TIMESTAMPDIFF(MONTH, Hire_Date, CURDATE())`).
  - Source: [04_functions.sql:L167-L180](file:///home/noir/Projects/PayPulse/sql/04_functions.sql#L167-L180)

### 3.3 Active Integrity & Audit Triggers (4 Triggers)
- [x] **`trg_AuditSalaryModifications`**:
  - `AFTER UPDATE ON Salary_Structure`.
  - Detects changes in basic salary, HRA, medical, conveyance, tax rate, or PF rate.
  - Serializes previous and new states into structured JSON objects and logs to `System_Audit_Log`.
  - Source: [06_triggers.sql:L20-L74](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L20-L74)
- [x] **`trg_EnforceLeaveQuota`**:
  - `BEFORE UPDATE ON Leave_Request`.
  - When status changes to `'Approved'`, verifies that employee has sufficient `Days_Remaining`.
  - Throws `SIGNAL SQLSTATE '45000'` with `'Quota Exceeded: Insufficient remaining leave balance'` if balance is violated.
  - Source: [06_triggers.sql:L78-L113](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L78-L113)
- [x] **`trg_SyncLeaveAllocationOnStatusChange`**:
  - `AFTER UPDATE ON Leave_Request`.
  - Automatically updates `Leave_Allocation` ledger:
    - `Pending -> Approved`: Increments `Days_Used` by `Total_Days` and decrements `Days_Remaining`.
    - `Approved -> Cancelled`: Restores quota by decrementing `Days_Used` and incrementing `Days_Remaining`.
  - Source: [06_triggers.sql:L117-L146](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L117-L146)
- [x] **`trg_ValidateAttendanceTimes`**:
  - `BEFORE INSERT ON Attendance_Log`.
  - Prevents check-out time preceding check-in time.
  - Computes `Working_Hours` automatically if check-out time is present and working hours were omitted.
  - Source: [06_triggers.sql:L150-L168](file:///home/noir/Projects/PayPulse/sql/06_triggers.sql#L150-L168)

---

## Category 4: Transaction Control Language (TCL) & Concurrency Operations

### 4.1 ACID Transaction Management
- [x] **Explicit Transaction Scopes**: Enforces `START TRANSACTION` / `COMMIT` boundaries around multi-step operations (`sp_ProcessMonthlyPayrollBatch`, `sp_OnboardEmployeeWithSalary`, `sp_DisbursePayroll`) — [05_procedures.sql:L108](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L108), [05_procedures.sql:L270](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L270)
- [x] **Backend Atomic Units of Work**: ASP.NET Core `PayrollService` executes EF Core transaction scope `using var transaction = await _context.Database.BeginTransactionAsync()` — [PayrollService.cs:L122-L255](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L122-L255)
- [x] **Atomic Rollback Guarantee**: Verified via automated test injecting errors to ensure zero partial writes persist — [test_database.py:L331-L343](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L331-L343)

### 4.2 Pessimistic Concurrency & Row-Level Locking
- [x] **Leave Quota Lock**: Acquires exclusive row lock `SELECT Days_Remaining FROM Leave_Allocation ... FOR UPDATE` during approval to prevent race conditions — [05_procedures.sql:L587](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L587)
- [x] **Disbursement Double-Settlement Lock**: Locks payroll voucher `SELECT Payroll_Status, Net_Salary FROM Monthly_Payroll ... FOR UPDATE` before issuing payment vouchers — [05_procedures.sql:L493](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L493)
- [x] **Lock Timeout Testing**: Pytest suite validates that concurrent locks raise `lock wait timeout exceeded` when timeout expires (`SET innodb_lock_wait_timeout = 1`) — [test_database.py:L397-L411](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L397-L411)

### 4.3 Error Handling & Exception Rollbacks
- [x] **SQL Exception Handlers**: Implements `DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;` in all stored procedures — [05_procedures.sql:L75-L79](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L75-L79)
- [x] **Custom Business Rule Signals**: Raises `SIGNAL SQLSTATE '45000'` with descriptive error text for invalid dates, unauthorized state changes, or out-of-band salaries — [05_procedures.sql:L83-L89](file:///home/noir/Projects/PayPulse/sql/05_procedures.sql#L83-L89)

---

## Category 5: Data Control Language (DCL) & Security Operations

### 5.1 User Accounts & Service Principals
- [x] **Service Accounts Provisioned**:
  - `paypulse_user` / `paypulse_api_svc`: Backend application connection pool user — [sql/README.md:L15](file:///home/noir/Projects/PayPulse/sql/README.md#L15)
  - `paypulse_hr_svc`: Human resource department service user — [test_database.py:L347-L355](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L347-L355)
  - `paypulse_payroll_svc`: Financial ledger service user — [security-and-transactions.md:L50-L58](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L50-L58)

### 5.2 MySQL Enterprise Roles & Least-Privilege Grants
- [x] **`role_paypulse_admin`**: Full operational DML on `paypulse_db` — [security-and-transactions.md:L42](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L42)
- [x] **`role_paypulse_hr`**: Granted `SELECT`, `INSERT`, `UPDATE` on `Employee`, `Department`, `Designation`, `Attendance_Log`, `Leave_Allocation`, `Leave_Request`; strictly denies financial updates — [security-and-transactions.md:L65-L67](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L65-L67)
- [x] **`role_paypulse_payroll`**: Granted access to compensation, payroll, and disbursement entities; strictly denies biographical profile modification — [security-and-transactions.md:L68-L69](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L68-L69)
- [x] **`role_paypulse_supervisor`**: Scoped to department employee attendance monitoring and subordinate leave reviews — [sql/README.md:L146](file:///home/noir/Projects/PayPulse/sql/README.md#L146)
- [x] **`role_paypulse_employee`**: Restricted to self-service attendance punches and personal leave ledgers — [sql/README.md:L147](file:///home/noir/Projects/PayPulse/sql/README.md#L147)
- [x] **`role_paypulse_api`**: Full DML and `EXECUTE` privileges; **explicitly denies destructive DDL** (`DROP`, `ALTER`, `TRUNCATE`) — [security-and-transactions.md:L61-L64](file:///home/noir/Projects/PayPulse/docs/database/security-and-transactions.md#L61-L64)

### 5.3 Sensitive Data Protection & Cryptographic Masking
- [x] **Cryptographic Password Salting**: Seed and production accounts store BCrypt hashes (work factor 12) in `User_Account.Password_Hash`; plaintext is never stored — [01_schema.sql:L23](file:///home/noir/Projects/PayPulse/sql/01_schema.sql#L23)
- [x] **Bank Account Masking**: `fn_MaskBankAccount` obscures bank account numbers across views (`vw_DisbursementReconciliation`) — [03_views.sql:L196](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L196)
- [x] **National Identity Confidentiality**: NID column omitted from general staff views (`vw_EmployeeDirectory`) — [03_views.sql:L16-L45](file:///home/noir/Projects/PayPulse/sql/03_views.sql#L16-L45)

### 5.4 SQL Injection Defense Strategy
- [x] **Query Parameterization Verified**: Python test suite asserts that malicious payloads (`EMP-1001' OR '1'='1`) are evaluated strictly as literal parameters with zero injection leakage — [test_database.py:L370-L377](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L370-L377)
- [x] **LINQ Parameterization**: EF Core converts all LINQ queries to parameterized MySQL queries (`@p__0`, `@p__1`) — [PayrollService.cs:L60-L68](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L60-L68)

---

## Category 6: Application Layer & ORM Operations (.NET 10 / EF Core)

### 6.1 Entity Framework Core Configuration & DbContext
- [x] **Authoritative DbContext Definition**: `AppDbContext` registers 13 `DbSet<T>` properties conforming to Phase 1 tables — [AppDbContext.cs:L12-L24](file:///home/noir/Projects/PayPulse/src/PayPulse.Infrastructure/Persistence/AppDbContext.cs#L12-L24)
- [x] **Fluent API Column & Key Mappings**: Mappings define primary keys, table names, custom column names (`User_ID`, `Employee_Code`, `Base_Salary_Min`), precisions, and non-database ignored fields (`EmploymentType`, `SpecialAllowance`) — [EntityConfigurations.cs:L7-L418](file:///home/noir/Projects/PayPulse/src/PayPulse.Infrastructure/Persistence/Configurations/EntityConfigurations.cs#L7-L418)
- [x] **Connection Resiliency**: Configured with `EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10))` in database integration setup — [database-integration.md:L22-L35](file:///home/noir/Projects/PayPulse/docs/backend/database-integration.md#L22-L35)

### 6.2 Application Services Data Access Operations
- [x] **`PayrollService` Operations**:
  - `GetPayrollsAsync`: Paginated retrieval with filtering by period, status, department, and employee search using `AsNoTracking()` — [PayrollService.cs:L22-L85](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L22-L85)
  - `ProcessMonthlyPayrollBatchAsync`: Orchestrates atomic batch calculation, statutory deductions, draft creation, and audit logging — [PayrollService.cs:L103-L272](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L103-L272)
  - `FinalizePayrollAsync`: Transitions voucher status to `'Finalized'` and commits structured audit delta — [PayrollService.cs:L274-L311](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L274-L311)
  - `DisbursePayrollAsync`: Creates `DisbursementRecord`, transitions status to `'Disbursed'`, and logs transaction — [PayrollService.cs:L313-L355](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/PayrollService.cs#L313-L355)
- [x] **`EmployeeService` Operations**:
  - `GetEmployeesAsync`: Filtered and paginated search — [EmployeeService.cs:L25-L75](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/EmployeeService.cs#L25-L75)
  - `CreateEmployeeAsync`: Provisions user account, employee profile, salary structure within designation bounds, and leave quotas — [EmployeeService.cs:L90-L160](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/EmployeeService.cs#L90-L160)
  - `GetReportingTreeAsync`: Builds employee hierarchy tree for org visualization — [EmployeeService.cs:L200-L235](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/EmployeeService.cs#L200-L235)
- [x] **`AttendanceService` Operations**:
  - `RecordAttendanceAsync`: Biometric punch recording and daily status resolution — [AttendanceService.cs:L68-L105](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/AttendanceService.cs#L68-L105)
  - `GetEmployeeMonthlySummaryAsync`: Monthly rollups for attendance analytics — [AttendanceService.cs:L180-L220](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/AttendanceService.cs#L180-L220)
- [x] **`LeaveService` Operations**:
  - `ApplyLeaveAsync`: Creates pending leave application and checks remaining quota — [LeaveService.cs:L55-L95](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/LeaveService.cs#L55-L95)
  - `ApproveLeaveAsync`: Approves leave and synchronizes allocation balances — [LeaveService.cs:L100-L145](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/LeaveService.cs#L100-L145)
- [x] **`AuditService` Operations**:
  - `GetAuditLogsAsync`: Queries immutable audit trail with filtering by table, operation, user, and date — [AuditService.cs:L20-L65](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/AuditService.cs#L20-L65)
- [x] **`ReportService` Operations**:
  - `GetPayrollSummaryReportAsync`: Aggregates compensation costs, tax deductions, and PF contributions — [ReportService.cs:L25-L75](file:///home/noir/Projects/PayPulse/src/PayPulse.Application/Services/ReportService.cs#L25-L75)

---

## Category 7: Client-Side Simulated Database Operations (`mockDb.ts`)

- [x] **Simulated LocalStorage Store**: Emulates relational storage across 13 keys (`paypulse_users`, `paypulse_employees`, `paypulse_payroll`, etc.) — [mockDb.ts:L33-L47](file:///home/noir/Projects/PayPulse/src/mocks/mockDb.ts#L33-L47)
- [x] **Asynchronous Network Delay Simulation**: Injects realistic network roundtrip latency (`delay(150ms)`) to simulate remote DB communication — [mockDb.ts:L50-L51](file:///home/noir/Projects/PayPulse/src/mocks/mockDb.ts#L50-L51)
- [x] **Mock Database Reset Routine**: `mockDb.resetAll()` resets all collections to the authoritative synthetic baseline — [mockDb.ts:L75-L90](file:///home/noir/Projects/PayPulse/src/mocks/mockDb.ts#L75-L90)
- [x] **Mock CRUD API Abstraction**: Complete read/write services mirroring backend endpoints (`getEmployees`, `saveEmployees`, `getPayroll`, `savePayroll`, etc.) — [mockDb.ts:L92-L175](file:///home/noir/Projects/PayPulse/src/mocks/mockDb.ts#L92-L175)

---

## Category 8: Verification, Test Harness & Diagnostic Operations

### 8.1 Standalone SQL Verification Suite (10 Test Suites)
- [x] **TEST 01**: Table Existence & Minimum Row Count Baseline Verification — [08_test_queries.sql:L15-L42](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L15-L42)
- [x] **TEST 02**: Mathematical Net Salary Formula Verification (`fn_CalculateMonthlyNetPay`) — [08_test_queries.sql:L54-L73](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L54-L73)
- [x] **TEST 03**: Data Privacy Bank Account Masking Verification (`fn_MaskBankAccount`) — [08_test_queries.sql:L78-L83](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L78-L83)
- [x] **TEST 04**: Overtime Compensation Math Verification (`fn_CalculateOvertimePay`) — [08_test_queries.sql:L87-L92](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L87-L92)
- [x] **TEST 05**: Atomic Employee Onboarding Stored Procedure (`sp_OnboardEmployeeWithSalary`) — [08_test_queries.sql:L97-L136](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L97-L136)
- [x] **TEST 06**: Salary Modification Audit Trigger (`trg_AuditSalaryModifications`) — [08_test_queries.sql:L142-L154](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L142-L154)
- [x] **TEST 07**: Leave Approval & Allocation Balance Synchronization Trigger (`trg_SyncLeaveAllocationOnStatusChange`) — [08_test_queries.sql:L158-L179](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L158-L179)
- [x] **TEST 08**: Duplicate & Finalized Payroll Modification Prevention — [08_test_queries.sql:L184-L190](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L184-L190)
- [x] **TEST 09**: Transaction Atomic Rollback Integrity Test — [08_test_queries.sql:L195-L206](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L195-L206)
- [x] **TEST 10**: Post-Verification QA Data Clean-Up — [08_test_queries.sql:L210-L213](file:///home/noir/Projects/PayPulse/sql/08_test_queries.sql#L210-L213)

### 8.2 Automated Python Pytest Verification Suite (18 Criteria)
*Achieved **100% Pass Rate** (18 passed in 1.23s) on MySQL 8.4 LTS ([testing-report.md](file:///home/noir/Projects/PayPulse/docs/database/testing-report.md#L7-L42)).*

- [x] **Test 01 (`test_01_schema_creation_and_entity_existence`)**: Verifies presence of all 13 core relational tables — [test_database.py:L59-L73](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L59-L73)
- [x] **Test 02 (`test_02_seed_data_thresholds_and_referential_integrity`)**: Asserts $\ge 100$ employees, $\ge 2,000$ attendance logs, $\ge 100$ payrolls — [test_database.py:L77-L90](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L77-L90)
- [x] **Test 03 (`test_03_invalid_foreign_key_rejection`)**: Verifies MySQL `IntegrityError (1452)` upon inserting invalid parent FK — [test_database.py:L94-L115](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L94-L115)
- [x] **Test 04 (`test_04_duplicate_constraints_rejection`)**: Verifies `Error 1062` on duplicate usernames, attendance dates, and payroll periods — [test_database.py:L119-L140](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L119-L140)
- [x] **Test 05 (`test_05_invalid_negative_financial_values_rejection`)**: Verifies CHECK constraint rejection of negative basic salaries — [test_database.py:L144-L154](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L144-L154)
- [x] **Test 06 (`test_06_leave_quota_violation_prevention_trigger`)**: Asserts `trg_EnforceLeaveQuota` aborts requests exceeding annual quota — [test_database.py:L158-L173](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L158-L173)
- [x] **Test 07 (`test_07_leave_balance_synchronization_on_status_change`)**: Validates automatic quota deduction on approval and restoration on cancellation — [test_database.py:L177-L212](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L177-L212)
- [x] **Test 08 (`test_08_salary_change_audit_generation`)**: Asserts `trg_AuditSalaryModifications` writes JSON deltas to audit log — [test_database.py:L216-L238](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L216-L238)
- [x] **Test 09 (`test_09_payroll_formula_and_function_correctness`)**: Validates net pay math against independent calculation (146,553.80 BDT) — [test_database.py:L242-L274](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L242-L274)
- [x] **Test 10 (`test_10_duplicate_payroll_run_prevention`)**: Asserts batch procedure blocks rerunning an already finalized/disbursed period — [test_database.py:L278-L284](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L278-L284)
- [x] **Test 11 (`test_11_disbursement_lifecycle`)**: Validates BEFTN disbursement reference generation and blocks duplicate payout — [test_database.py:L288-L327](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L288-L327)
- [x] **Test 12 (`test_12_transaction_rollback_after_failure`)**: Validates atomic rollback undoes partial records upon failure — [test_database.py:L331-L343](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L331-L343)
- [x] **Test 13 (`test_13_role_and_privilege_restrictions`)**: Asserts `paypulse_hr_svc` is denied direct disbursement inserts — [test_database.py:L347-L366](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L347-L366)
- [x] **Test 14 (`test_14_sql_injection_resilience`)**: Asserts parameterized statements block SQL injection payloads — [test_database.py:L370-L377](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L370-L377)
- [x] **Test 15 (`test_15_analytical_report_views`)**: Validates data aggregation and bank account masking across database views — [test_database.py:L381-L394](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L381-L394)
- [x] **Test 16 (`test_16_concurrency_pessimistic_locking`)**: Simulates concurrent row lock contention with `SELECT ... FOR UPDATE` — [test_database.py:L397-L411](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L397-L411)
- [x] **Test 17 (`test_17_backup_restoration_integrity_verification`)**: Verifies zero orphaned records exist in database — [test_database.py:L415-L424](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L415-L424)
- [x] **Test 18 (`test_18_query_performance_index_utilization`)**: Asserts 1,000+ indexed attendance records retrieve in $< 150\text{ ms}$ — [test_database.py:L428-L444](file:///home/noir/Projects/PayPulse/sql/tests/test_database.py#L428-L444)

### 8.3 Database Health & Anomaly Scanners
- [x] **Orphan Employee Check**: Scans for employees with non-existent or deleted `User_Account` entries — [09_reporting_queries.sql:L71-L72](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L71-L72)
- [x] **Active Salary Structure Coverage Check**: Scans for active employees missing an active `Salary_Structure` — [09_reporting_queries.sql:L74-L75](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L74-L75)
- [x] **Net Pay Arithmetic Invariant Check**: Audits `Monthly_Payroll` records where `Net_Salary <> (Gross_Salary - Total_Deductions)` — [09_reporting_queries.sql:L77-L78](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L77-L78)
- [x] **Leave Quota Identity Invariant Check**: Audits `Leave_Allocation` rows where `Days_Remaining <> (Total_Allocated - Days_Used)` — [09_reporting_queries.sql:L80-L81](file:///home/noir/Projects/PayPulse/sql/09_reporting_queries.sql#L80-L81)
