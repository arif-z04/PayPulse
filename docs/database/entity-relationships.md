# PayPulse Entity Relationships & Referential Integrity Matrix

This document provides a detailed breakdown of all relationships, cardinalities, participation constraints, foreign keys, and referential actions across the 13 core relational tables in the PayPulse database schema.

---

## 1. Master Referential Integrity Matrix

The following matrix documents all 19 foreign key constraints established in `sql/02_constraints_and_indexes.sql`:

| # | Parent Table | Child Table | Foreign Key Column | Referenced Column | Cardinality | Participation | ON DELETE | ON UPDATE | Business Justification |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `Department` | `Designation` | `Department_ID` | `Department_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | A business unit defines job designations. Cannot delete a department with active designations. |
| 2 | `Department` | `Employee` | `Department_ID` | `Department_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | Employees belong to a department. Dropping a department with active employees is prohibited. |
| 3 | `Designation` | `Employee` | `Designation_ID` | `Designation_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | Employees hold a designation. Cannot delete a designation assigned to active staff. |
| 4 | `User_Account` | `Employee` | `User_ID` | `User_ID` | 1 : 1 | Mandatory in Child | `CASCADE` | `CASCADE` | System login credentials link 1:1 with an employee profile. Purging user cascades to employee. |
| 5 | `Employee` | `Employee` | `Manager_ID` | `Employee_ID` | 1 : N | Optional in Child | `SET NULL` | `CASCADE` | Self-referencing reporting hierarchy. CEO has `Manager_ID = NULL`. If manager departs, subordinates reset to NULL. |
| 6 | `Employee` | `Department` | `Head_Of_Department_ID` | `Employee_ID` | 1 : 1 | Optional in Parent | `SET NULL` | `CASCADE` | Circular relationship. Department head is an active employee. If employee leaves, pointer resets to NULL. |
| 7 | `Employee` | `Salary_Structure` | `Employee_ID` | `Employee_ID` | 1 : N | Mandatory in Child | `CASCADE` | `CASCADE` | Effective-dated salary history. Purging employee profile purges their compensation history. |
| 8 | `Employee` | `Attendance_Log` | `Employee_ID` | `Employee_ID` | 1 : N | Mandatory in Child | `CASCADE` | `CASCADE` | Daily biometric attendance logs belong directly to an employee. |
| 9 | `Employee` | `Leave_Allocation` | `Employee_ID` | `Employee_ID` | 1 : N | Mandatory in Child | `CASCADE` | `CASCADE` | Annual leave entitlement ledger rows per employee. |
| 10 | `Leave_Type` | `Leave_Allocation` | `Leave_Type_ID` | `Leave_Type_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | Corporate policy governs leave quotas. Cannot delete a leave policy allocated to staff. |
| 11 | `Employee` | `Leave_Request` | `Employee_ID` | `Employee_ID` | 1 : N | Mandatory in Child | `CASCADE` | `CASCADE` | Leave applications submitted by an employee. |
| 12 | `Leave_Type` | `Leave_Request` | `Leave_Type_ID` | `Leave_Type_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | Policy categorizes application. Cannot drop leave types referenced by requests. |
| 13 | `User_Account` | `Leave_Request` | `Approved_By_User_ID` | `User_ID` | 1 : N | Optional in Child | `SET NULL` | `CASCADE` | Approver attribution. If manager account is purged, approval record remains intact. |
| 14 | `Employee` | `Monthly_Payroll` | `Employee_ID` | `Employee_ID` | 1 : N | Mandatory in Child | `RESTRICT` | `CASCADE` | **Financial Integrity**: Deleting an employee with finalized payroll is strictly RESTRICTED by labor tax audit rules. |
| 15 | `User_Account` | `Monthly_Payroll` | `Generated_By_User_ID` | `User_ID` | 1 : N | Optional in Child | `SET NULL` | `CASCADE` | Batch payroll generation officer attribution. |
| 16 | `Monthly_Payroll` | `Payroll_Component_Detail` | `Payroll_ID` | `Payroll_ID` | 1 : N | Mandatory in Child | `CASCADE` | `CASCADE` | Itemized earnings and deductions belong strictly to their master monthly payroll voucher. |
| 17 | `Monthly_Payroll` | `Disbursement_Record` | `Payroll_ID` | `Payroll_ID` | 1 : 1 | Mandatory in Child | `RESTRICT` | `CASCADE` | **Banking Audit**: Electronic bank transfer settlement record. Deleting payroll with active settlement is prohibited. |
| 18 | `User_Account` | `Disbursement_Record` | `Disbursed_By_User_ID` | `User_ID` | 1 : N | Optional in Child | `SET NULL` | `CASCADE` | Finance officer attribution for electronic fund transfer. |
| 19 | `User_Account` | `System_Audit_Log` | `Changed_By_User` | `User_ID` | 1 : N | Optional in Child | `SET NULL` | `CASCADE` | Security audit trail attribution. If user is deleted, audit record remains immutable. |

---

## 2. Cardinality & Participation Analysis

### 2.1 Identity & Profile Binding (1 : 1 Mandatory)
- **User_Account ↔ Employee**:
  - Each `User_Account` is created for exactly one `Employee`.
  - Each `Employee` must possess exactly one `User_Account`.
  - Enforced via unique constraint on `Employee.User_ID` (`uq_emp_user_id`).
  - **Participation**: Mandatory on both ends in business logic. In SQL, child `Employee.User_ID` is `NOT NULL` and `UNIQUE`.

### 2.2 Managerial Hierarchy (1 : N Recursive)
- **Employee (Manager) ↔ Employee (Subordinate)**:
  - An employee may manage zero, one, or many other employees (`1 : N`).
  - An employee has at most one direct reporting manager (`N : 1`).
  - **Participation**: Optional on both ends. Subordinates point to their manager; the CEO and board members have `Manager_ID IS NULL`.

### 2.3 Departmental Structure & Circular Head (1 : N and 1 : 1)
- **Department ↔ Employee**:
  - A Department employs 1 to N employees (Mandatory for Department to function; Mandatory for Employee to belong to a Department).
  - A Department is led by 0 or 1 Employee as Head (`Head_Of_Department_ID`).
  - **Resolution of Circular Dependency**: `Department.Head_Of_Department_ID` is nullable with `ON DELETE SET NULL`. During initial database seeding, departments are inserted with `NULL` head pointers, employees are inserted with valid `Department_ID`, and head pointers are updated afterwards.

### 2.4 Compensation History (1 : N Effective-Dated)
- **Employee ↔ Salary_Structure**:
  - An employee accumulates 1 to N compensation structure revisions over their tenure.
  - Exactly one structure has `Is_Active = TRUE` and `Effective_To IS NULL` at any given time.
  - Historical records preserve past basic salaries and allowance rates for audit verification.

### 2.5 Timekeeping & Attendance (1 : N)
- **Employee ↔ Attendance_Log**:
  - An employee logs 0 to N daily attendance records.
  - A composite unique constraint `(Employee_ID, Work_Date)` guarantees at most one biometric record per employee per calendar date.

### 2.6 Leave Allocation & Workflows (1 : N)
- **Leave_Type ↔ Leave_Allocation ↔ Employee**:
  - Every employee receives annual allocations for each active `Leave_Type`.
  - Composite unique constraint `(Employee_ID, Leave_Type_ID, Calendar_Year)` prevents duplicate annual quotas.
- **Employee ↔ Leave_Request ↔ User_Account**:
  - Employees submit applications (`Leave_Request`).
  - Applications reference a `Leave_Type` and an optional approving `User_Account`.

### 2.7 Payroll & Settlement Ledgers (1 : N and 1 : 1)
- **Employee ↔ Monthly_Payroll**:
  - An employee accumulates monthly payroll records (`1 : N`).
  - Composite unique constraint `(Employee_ID, Payroll_Year, Payroll_Month)` enforces that each employee is processed exactly once per fiscal month.
- **Monthly_Payroll ↔ Payroll_Component_Detail**:
  - Each payroll voucher has 1 to N line items (`Basic Salary`, `House Rent`, `Tax`, `PF`, etc.).
  - Child rows cascade if a draft payroll run is regenerated.
- **Monthly_Payroll ↔ Disbursement_Record**:
  - Each monthly payroll maps to at most one `Disbursement_Record` (`1 : 1`).
  - Unique constraint on `Disbursement_Record.Payroll_ID` guarantees single settlement.

---

## 3. Strict Non-Cascading Financial Policy

In PayPulse, `ON DELETE CASCADE` is intentionally **prohibited** on all financial transactions:

1. **Statutory Tax & Labor Compliance**: Bangladesh labor statutes mandate preserving wage and tax records for multiple fiscal years.
2. **Prevention of Catastrophic Accidental Deletion**: An administrative action terminating an employee must never purge the organization's payroll ledger. By enforcing `ON DELETE RESTRICT` on `fk_monthly_payroll_employee` and `fk_disbursement_payroll`, the database engine physically rejects destructive deletes.
