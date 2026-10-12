# PayPulse Enterprise Data Dictionary

This document serves as the authoritative, comprehensive data dictionary for all **13 core relational entities** in the PayPulse database system (`paypulse_db`).

---

## 1. User_Account

**Purpose**: System authentication identity, credential storage, account status, and Role-Based Access Control (RBAC).

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `User_ID` | `INT` | No | Auto Increment | **PK** | | Unique surrogate identity key (e.g. `1`) |
| `Username` | `VARCHAR(50)` | No | | **UK** | Min length >= 3 | Unique corporate login handle (e.g. `'admin'`, `'farzana.hr'`) |
| `Password_Hash` | `VARCHAR(255)` | No | | | | Salted BCrypt/Argon2 cryptographic hash (e.g. `$2a$12$...`) |
| `Role` | `ENUM(...)` | No | `'Employee'` | | 5 system roles | `'System Administrator'`, `'HR Manager'`, `'Payroll Officer'`, `'Department Supervisor'`, `'Employee'` |
| `Is_Active` | `BOOLEAN` | No | `TRUE` | | | Account activation status flag |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Timestamp of account registration |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Timestamp of last credential or status modification |

- **Table Constraints**:
  - `CONSTRAINT pk_user_account PRIMARY KEY (User_ID)`
  - `CONSTRAINT uq_user_username UNIQUE (Username)`
  - `CONSTRAINT chk_user_username_minlen CHECK (CHAR_LENGTH(TRIM(Username)) >= 3)`
- **Relationships**: Parent entity to `Employee` (1:1), `Leave_Request` (1:N Approver), `Monthly_Payroll` (1:N Processor), `Disbursement_Record` (1:N Authorizer), and `System_Audit_Log` (1:N Subject).

---

## 2. Department

**Purpose**: Organizational business units, operational divisions, cost centers, and office branches.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Department_ID` | `INT` | No | Auto Increment | **PK** | | Department primary identifier (e.g. `1`) |
| `Department_Name` | `VARCHAR(100)` | No | | **UK** | | Business unit title (e.g. `'Software Engineering'`) |
| `Department_Code` | `VARCHAR(10)` | No | | **UK** | Min length >= 2 | Corporate abbreviation code (e.g. `'ENG'`, `'FIN'`, `'HRD'`) |
| `Office_Location` | `VARCHAR(255)` | No | | | | Physical facility location (e.g. `'Dhaka Tower, 11th Floor'`) |
| `Head_Of_Department_ID` | `INT` | Yes | `NULL` | **FK** | Circular to Employee | Employee ID of division director or supervisor |
| `Description` | `TEXT` | Yes | `NULL` | | | Functional scope and operational mission statement |
| `Is_Active` | `BOOLEAN` | No | `TRUE` | | | Active operational status flag |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Department provisioning timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Last modification timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_department PRIMARY KEY (Department_ID)`
  - `CONSTRAINT uq_dept_name UNIQUE (Department_Name)`
  - `CONSTRAINT uq_dept_code UNIQUE (Department_Code)`
  - `CONSTRAINT chk_dept_code_format CHECK (CHAR_LENGTH(TRIM(Department_Code)) >= 2)`
  - `CONSTRAINT fk_department_head FOREIGN KEY (Head_Of_Department_ID) REFERENCES Employee(Employee_ID) ON DELETE SET NULL ON UPDATE CASCADE`
- **Relationships**: Parent to `Designation` (1:N) and `Employee` (1:N).

---

## 3. Designation

**Purpose**: Standardized job titles, departmental classifications, seniority ranks, and statutory salary brackets.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Designation_ID` | `INT` | No | Auto Increment | **PK** | | Designation primary key (e.g. `1`) |
| `Department_ID` | `INT` | No | | **FK** | | Department offering this job position |
| `Title` | `VARCHAR(100)` | No | | **UK** (composite) | Unique per Dept | Position title (e.g. `'Senior Software Engineer'`) |
| `Base_Salary_Min` | `DECIMAL(12,2)` | No | | | `CHECK (>= 0)` | Lower boundary of pay grade bracket in BDT (e.g. `120000.00`) |
| `Base_Salary_Max` | `DECIMAL(12,2)` | No | | | `CHECK (>= Min)` | Upper boundary of pay grade bracket in BDT (e.g. `175000.00`) |
| `Description` | `TEXT` | Yes | `NULL` | | | Job responsibilities and prerequisites summary |
| `Is_Active` | `BOOLEAN` | No | `TRUE` | | | Position classification active flag |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Creation timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Modification timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_designation PRIMARY KEY (Designation_ID)`
  - `CONSTRAINT uq_dept_designation_title UNIQUE (Department_ID, Title)`
  - `CONSTRAINT chk_desig_salary_min CHECK (Base_Salary_Min >= 0.00)`
  - `CONSTRAINT chk_desig_salary_range CHECK (Base_Salary_Max >= Base_Salary_Min)`
  - `CONSTRAINT fk_designation_department FOREIGN KEY (Department_ID) REFERENCES Department(Department_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Relationships**: Child of `Department` (N:1), Parent to `Employee` (1:N).

---

## 4. Employee

**Purpose**: Central workforce profile containing personal identities, manager hierarchy, and BEFTN banking details.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Employee_ID` | `INT` | No | Auto Increment | **PK** | | Internal surrogate identity key (e.g. `1`) |
| `Employee_Code` | `VARCHAR(20)` | No | | **UK** | Pattern | Organization code (e.g. `'EMP-1001'`) |
| `User_ID` | `INT` | No | | **FK, UK** | 1:1 Mandatory | System credentials link |
| `Department_ID` | `INT` | No | | **FK** | | Business unit assignment |
| `Designation_ID` | `INT` | No | | **FK** | | Job title and pay bracket assignment |
| `Manager_ID` | `INT` | Yes | `NULL` | **FK** | Recursive hierarchy | Direct supervisor ID (NULL for CEO) |
| `First_Name` | `VARCHAR(50)` | No | | | Non-empty | Given name (e.g. `'Tanvir'`) |
| `Last_Name` | `VARCHAR(50)` | No | | | Non-empty | Family name (e.g. `'Ahmed'`) |
| `Email` | `VARCHAR(100)` | No | | **UK** | RFC format | Work email (e.g. `'tanvir.ahmed@paypulse.internal'`) |
| `Phone` | `VARCHAR(20)` | No | | | | Official phone number (e.g. `'+8801711001001'`) |
| `NID` | `VARCHAR(25)` | No | | **UK** | 10, 13, 17 digits | Bangladesh National ID Card number |
| `Date_Of_Birth` | `DATE` | No | | | Age <= Hire Date | Birth date (e.g. `'1988-05-12'`) |
| `Gender` | `ENUM(...)` | No | | | `'Male'`, `'Female'`, `'Other'` | Gender demographic |
| `Address` | `VARCHAR(255)` | No | | | | Residential postal address |
| `Hire_Date` | `DATE` | No | | | | Date of appointment (e.g. `'2020-01-15'`) |
| `Bank_Account_No`| `VARCHAR(50)` | No | | | | Bank account number for BEFTN transfers |
| `Bank_Name` | `VARCHAR(100)` | No | | | | Commercial bank title (e.g. `'BRAC Bank PLC'`) |
| `Bank_Branch` | `VARCHAR(100)` | No | | | | Bank branch name (e.g. `'Gulshan Branch'`) |
| `Bank_Routing_No`| `VARCHAR(20)` | No | | | 9 digits | BEFTN routing code (e.g. `'060264120'`) |
| `Employment_Status`| `ENUM(...)`| No | `'Active'` | | Active, On-Leave, etc. | Employment status lifecycle state |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Onboarding timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Profile update timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_employee PRIMARY KEY (Employee_ID)`
  - `CONSTRAINT uq_emp_code UNIQUE (Employee_Code)`
  - `CONSTRAINT uq_emp_user_id UNIQUE (User_ID)`
  - `CONSTRAINT uq_emp_email UNIQUE (Email)`
  - `CONSTRAINT uq_emp_nid UNIQUE (NID)`
  - `CONSTRAINT chk_emp_name_nonempty CHECK (CHAR_LENGTH(TRIM(First_Name)) >= 1 AND CHAR_LENGTH(TRIM(Last_Name)) >= 1)`
  - `CONSTRAINT chk_emp_age_adult CHECK (Hire_Date >= Date_Of_Birth)`
  - `CONSTRAINT fk_employee_user FOREIGN KEY (User_ID) REFERENCES User_Account(User_ID) ON DELETE CASCADE ON UPDATE CASCADE`
  - `CONSTRAINT fk_employee_department FOREIGN KEY (Department_ID) REFERENCES Department(Department_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `CONSTRAINT fk_employee_designation FOREIGN KEY (Designation_ID) REFERENCES Designation(Designation_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `CONSTRAINT fk_employee_manager FOREIGN KEY (Manager_ID) REFERENCES Employee(Employee_ID) ON DELETE SET NULL ON UPDATE CASCADE`

---

## 5. Salary_Structure

**Purpose**: Effective-dated compensation configuration defining basic pay, allowances, and statutory withholding rates.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Structure_ID` | `INT` | No | Auto Increment | **PK** | | Compensation structure identifier (e.g. `1`) |
| `Employee_ID` | `INT` | No | | **FK** | | Employee receiving this salary agreement |
| `Basic_Salary` | `DECIMAL(12,2)` | No | | | `CHECK (> 0)` | Base contractual monthly pay in BDT (e.g. `160000.00`) |
| `House_Rent_Allowance` | `DECIMAL(12,2)` | No | `0.00` | | `CHECK (>= 0)` | Housing subsidy (e.g. `32000.00`) |
| `Medical_Allowance` | `DECIMAL(12,2)` | No | `0.00` | | `CHECK (>= 0)` | Healthcare subsidy (e.g. `16000.00`) |
| `Conveyance_Allowance` | `DECIMAL(12,2)` | No | `0.00` | | `CHECK (>= 0)` | Commute subsidy (e.g. `10000.00`) |
| `Tax_Deduction_Rate` | `DECIMAL(5,2)` | No | `0.00` | | `CHECK (0..100)` | Withholding income tax percentage (e.g. `9.00%`) |
| `Provident_Fund_Rate` | `DECIMAL(5,2)` | No | `0.00` | | `CHECK (0..100)` | Retirement fund percentage (e.g. `8.00%`) |
| `Effective_From` | `DATE` | No | | | | Date compensation takes legal effect |
| `Effective_To` | `DATE` | Yes | `NULL` | | `CHECK (To >= From)`| Date structure is superseded (NULL = currently active) |
| `Is_Active` | `BOOLEAN` | No | `TRUE` | | | TRUE for the active payroll rate |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Creation timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Mutation timestamp (triggers audit log) |

- **Table Constraints**:
  - `CONSTRAINT pk_salary_structure PRIMARY KEY (Structure_ID)`
  - `CONSTRAINT chk_salary_basic_positive CHECK (Basic_Salary > 0.00)`
  - `CONSTRAINT chk_salary_hra_nonnegative CHECK (House_Rent_Allowance >= 0.00)`
  - `CONSTRAINT chk_salary_med_nonnegative CHECK (Medical_Allowance >= 0.00)`
  - `CONSTRAINT chk_salary_conv_nonnegative CHECK (Conveyance_Allowance >= 0.00)`
  - `CONSTRAINT chk_salary_tax_rate_range CHECK (Tax_Deduction_Rate >= 0.00 AND Tax_Deduction_Rate <= 100.00)`
  - `CONSTRAINT chk_salary_pf_rate_range CHECK (Provident_Fund_Rate >= 0.00 AND Provident_Fund_Rate <= 100.00)`
  - `CONSTRAINT chk_salary_effective_dates CHECK (Effective_To IS NULL OR Effective_To >= Effective_From)`
  - `CONSTRAINT fk_salary_structure_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE`

---

## 6. Attendance_Log

**Purpose**: Daily biometric timekeeping records, punch timestamps, working hours, and overtime.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Log_ID` | `INT` | No | Auto Increment | **PK** | | Biometric log identifier |
| `Employee_ID` | `INT` | No | | **FK, UK** (composite)| | Employee clocking in |
| `Work_Date` | `DATE` | No | | **UK** (composite)| | Calendar date of work shift (e.g. `'2026-08-10'`) |
| `Check_In_Time` | `DATETIME` | Yes | `NULL` | | | Clock-in biometric punch timestamp |
| `Check_Out_Time`| `DATETIME` | Yes | `NULL` | | `CHECK (Out >= In)`| Clock-out biometric punch timestamp |
| `Working_Hours` | `DECIMAL(4,2)` | No | `0.00` | | `CHECK (0..24)` | Calculated shift hours (e.g. `9.00`) |
| `Overtime_Hours`| `DECIMAL(4,2)` | No | `0.00` | | `CHECK (0..16)` | Calculated overtime beyond standard 8 hrs (e.g. `2.00`) |
| `Attendance_Status`| `ENUM(...)` | No | `'Present'` | | Present, Late, etc. | Daily classification status |
| `Remarks` | `VARCHAR(255)` | Yes | `NULL` | | | Lateness reason or device notice |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Record entry timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_attendance_log PRIMARY KEY (Log_ID)`
  - `CONSTRAINT uq_emp_work_date UNIQUE (Employee_ID, Work_Date)`
  - `CONSTRAINT chk_att_hours_range CHECK (Working_Hours >= 0.00 AND Working_Hours <= 24.00)`
  - `CONSTRAINT chk_att_ot_range CHECK (Overtime_Hours >= 0.00 AND Overtime_Hours <= 16.00)`
  - `CONSTRAINT chk_att_checkout_after_checkin CHECK (Check_Out_Time IS NULL OR Check_In_Time IS NULL OR Check_Out_Time >= Check_In_Time)`
  - `CONSTRAINT fk_attendance_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE`

---

## 7. Leave_Type

**Purpose**: Corporate leave policies, statutory limits, and compensation terms.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Leave_Type_ID` | `INT` | No | Auto Increment | **PK** | | Policy identifier |
| `Type_Name` | `VARCHAR(50)` | No | | **UK** | | Policy title (e.g. `'Casual Leave'`, `'Medical Leave'`, `'Earned Leave'`) |
| `Max_Days_Per_Year` | `INT` | No | | | `CHECK (0..365)` | Annual entitlement limit (e.g. `14`) |
| `Is_Carry_Forward` | `BOOLEAN` | No | `FALSE` | | | Allows unconsumed days to rollover to next year |
| `Is_Paid` | `BOOLEAN` | No | `TRUE` | | | Paid vs Unpaid salary consequence |
| `Description` | `VARCHAR(255)` | Yes | `NULL` | | | Policy terms summary |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Creation timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_leave_type PRIMARY KEY (Leave_Type_ID)`
  - `CONSTRAINT uq_leave_type_name UNIQUE (Type_Name)`
  - `CONSTRAINT chk_leave_type_days_range CHECK (Max_Days_Per_Year >= 0 AND Max_Days_Per_Year <= 365)`

---

## 8. Leave_Allocation

**Purpose**: Real-time quota balance and consumption ledger per employee, leave type, and calendar year.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Allocation_ID` | `INT` | No | Auto Increment | **PK** | | Allocation ledger identifier |
| `Employee_ID` | `INT` | No | | **FK, UK** (composite)| | Employee entitlement owner |
| `Leave_Type_ID` | `INT` | No | | **FK, UK** (composite)| | Governed leave policy |
| `Calendar_Year` | `SMALLINT` | No | | **UK** (composite)| `CHECK (2000..2100)`| Fiscal entitlement year (e.g. `2026`) |
| `Total_Allocated`| `INT` | No | | | `CHECK (>= 0)` | Total granted days quota (e.g. `14`) |
| `Days_Used` | `INT` | No | `0` | | `CHECK (>= 0)` | Days consumed via approved requests |
| `Days_Remaining`| `INT` | No | | | `CHECK (Rem = Total-Used)`| Available remaining balance |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Provisioning timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Balance synchronization timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_leave_allocation PRIMARY KEY (Allocation_ID)`
  - `CONSTRAINT uq_emp_leave_year UNIQUE (Employee_ID, Leave_Type_ID, Calendar_Year)`
  - `CONSTRAINT chk_alloc_year_range CHECK (Calendar_Year BETWEEN 2000 AND 2100)`
  - `CONSTRAINT chk_alloc_allocated_positive CHECK (Total_Allocated >= 0)`
  - `CONSTRAINT chk_alloc_used_nonnegative CHECK (Days_Used >= 0)`
  - `CONSTRAINT chk_alloc_remaining_nonnegative CHECK (Days_Remaining >= 0)`
  - `CONSTRAINT chk_alloc_balance_identity CHECK (Days_Remaining = Total_Allocated - Days_Used)`
  - `CONSTRAINT fk_leave_allocation_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE`
  - `CONSTRAINT fk_leave_allocation_type FOREIGN KEY (Leave_Type_ID) REFERENCES Leave_Type(Leave_Type_ID) ON DELETE RESTRICT ON UPDATE CASCADE`

---

## 9. Leave_Request

**Purpose**: Formal leave applications, approval workflow lifecycle states, and managerial sign-offs.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Request_ID` | `INT` | No | Auto Increment | **PK** | | Application serial number |
| `Employee_ID` | `INT` | No | | **FK** | | Applicant employee |
| `Leave_Type_ID` | `INT` | No | | **FK** | | Classification category |
| `Approved_By_User_ID`| `INT` | Yes | `NULL` | **FK** | User_Account | Approver manager or HR user ID |
| `Start_Date` | `DATE` | No | | | | Starting date of requested leave |
| `End_Date` | `DATE` | No | | | `CHECK (End >= Start)`| Ending date of requested leave |
| `Total_Days` | `INT` | No | | | `CHECK (> 0)` | Calendar duration in days |
| `Reason` | `VARCHAR(500)` | No | | | | Stated justification for absence |
| `Status` | `ENUM(...)` | No | `'Pending'` | | Pending, Approved, etc. | Workflow lifecycle state |
| `Applied_Date` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Submission timestamp |
| `Approval_Remarks`| `VARCHAR(255)`| Yes | `NULL` | | | Sign-off or rejection explanation |
| `Approved_At` | `DATETIME` | Yes | `NULL` | | | Timestamp of managerial action |

- **Table Constraints**:
  - `CONSTRAINT pk_leave_request PRIMARY KEY (Request_ID)`
  - `CONSTRAINT chk_req_date_order CHECK (End_Date >= Start_Date)`
  - `CONSTRAINT chk_req_total_days_positive CHECK (Total_Days > 0)`
  - `CONSTRAINT fk_leave_request_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE`
  - `CONSTRAINT fk_leave_request_type FOREIGN KEY (Leave_Type_ID) REFERENCES Leave_Type(Leave_Type_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `CONSTRAINT fk_leave_request_approver FOREIGN KEY (Approved_By_User_ID) REFERENCES User_Account(User_ID) ON DELETE SET NULL ON UPDATE CASCADE`

---

## 10. Monthly_Payroll

**Purpose**: Immutable point-in-time financial compensation ledger per employee and period.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Payroll_ID` | `INT` | No | Auto Increment | **PK** | | Monthly ledger identifier |
| `Employee_ID` | `INT` | No | | **FK, UK** (composite)| | Paid employee |
| `Payroll_Month` | `TINYINT` | No | | **UK** (composite)| `CHECK (1..12)` | Calendar month (e.g. `8` for August) |
| `Payroll_Year` | `SMALLINT` | No | | **UK** (composite)| `CHECK (2000..2100)`| Calendar year (e.g. `2026`) |
| `Working_Days` | `TINYINT` | No | | | `CHECK (0..31)` | Standard billable shift days (e.g. `26`) |
| `Present_Days` | `TINYINT` | No | | | `CHECK (<= Working)` | Validated presence days from logs |
| `Paid_Leave_Days`| `TINYINT` | No | `0` | | | Approved paid absences |
| `Unpaid_Leave_Days`| `TINYINT`| No | `0` | | | Unexcused absences resulting in deduction |
| `Basic_Salary` | `DECIMAL(12,2)` | No | | | `CHECK (>= 0)` | Static snapshot of contractual basic pay |
| `Total_Allowances`| `DECIMAL(12,2)`| No | `0.00` | | `CHECK (>= 0)` | Sum of rent, medical, conveyance & OT |
| `Gross_Salary` | `DECIMAL(12,2)` | No | | | `CHECK (>= Basic)` | Total gross earnings before deductions |
| `Total_Deductions`| `DECIMAL(12,2)`| No | `0.00` | | `CHECK (>= 0)` | Sum of tax, provident fund & penalties |
| `Net_Salary` | `DECIMAL(12,2)` | No | | | `CHECK (Net = Gross-Ded)`| Final net take-home remuneration |
| `Generation_Date`| `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Batch creation timestamp |
| `Finalized_Date` | `DATETIME` | Yes | `NULL` | | | Approval & final locking timestamp |
| `Payroll_Status` | `ENUM(...)` | No | `'Generated'` | | Generated, Disbursed, etc.| Fiscal audit status |
| `Generated_By_User_ID`| `INT` | Yes | `NULL` | **FK** | User_Account | Payroll officer user ID |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Mutation timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_monthly_payroll PRIMARY KEY (Payroll_ID)`
  - `CONSTRAINT uq_emp_payroll_period UNIQUE (Employee_ID, Payroll_Year, Payroll_Month)`
  - `CONSTRAINT chk_pay_month_range CHECK (Payroll_Month BETWEEN 1 AND 12)`
  - `CONSTRAINT chk_pay_year_range CHECK (Payroll_Year BETWEEN 2000 AND 2100)`
  - `CONSTRAINT chk_pay_working_days_range CHECK (Working_Days >= 0 AND Working_Days <= 31)`
  - `CONSTRAINT chk_pay_present_days_range CHECK (Present_Days >= 0 AND Present_Days <= Working_Days)`
  - `CONSTRAINT chk_pay_paid_leave_nonnegative CHECK (Paid_Leave_Days >= 0)`
  - `CONSTRAINT chk_pay_unpaid_leave_nonnegative CHECK (Unpaid_Leave_Days >= 0)`
  - `CONSTRAINT chk_pay_basic_nonnegative CHECK (Basic_Salary >= 0.00)`
  - `CONSTRAINT chk_pay_allowances_nonnegative CHECK (Total_Allowances >= 0.00)`
  - `CONSTRAINT chk_pay_gross_geq_basic CHECK (Gross_Salary >= Basic_Salary)`
  - `CONSTRAINT chk_pay_deductions_nonnegative CHECK (Total_Deductions >= 0.00)`
  - `CONSTRAINT chk_pay_net_nonnegative CHECK (Net_Salary >= 0.00)`
  - `CONSTRAINT chk_pay_math_consistency CHECK (Net_Salary = Gross_Salary - Total_Deductions)`
  - `CONSTRAINT fk_monthly_payroll_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `CONSTRAINT fk_monthly_payroll_user FOREIGN KEY (Generated_By_User_ID) REFERENCES User_Account(User_ID) ON DELETE SET NULL ON UPDATE CASCADE`

---

## 11. Payroll_Component_Detail

**Purpose**: Itemized earnings and deductions breakdown lines per monthly payslip ledger.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Detail_ID` | `INT` | No | Auto Increment | **PK** | | Component line identifier |
| `Payroll_ID` | `INT` | No | | **FK** | | Monthly payroll master reference |
| `Component_Name`| `VARCHAR(100)` | No | | | | Line title (e.g. `'Basic Salary'`, `'Income Tax'`) |
| `Component_Type`| `ENUM(...)` | No | | | `'Earning'`, `'Deduction'` | Financial classification |
| `Amount` | `DECIMAL(12,2)` | No | | | `CHECK (>= 0)` | Line amount in BDT (e.g. `24000.00`) |
| `Remarks` | `VARCHAR(255)` | Yes | `NULL` | | | Calculation basis (e.g. `'8.00% tax slab'`) |

- **Table Constraints**:
  - `CONSTRAINT pk_payroll_component_detail PRIMARY KEY (Detail_ID)`
  - `CONSTRAINT chk_comp_amount_nonnegative CHECK (Amount >= 0.00)`
  - `CONSTRAINT fk_payroll_component_payroll FOREIGN KEY (Payroll_ID) REFERENCES Monthly_Payroll(Payroll_ID) ON DELETE CASCADE ON UPDATE CASCADE`

---

## 12. Disbursement_Record

**Purpose**: Electronic Fund Transfer (BEFTN) banking settlement and transaction ledger.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Disbursement_ID`| `INT` | No | Auto Increment | **PK** | | Settlement record identifier |
| `Payroll_ID` | `INT` | No | | **FK, UK** | 1:1 with Payroll | Disbursed payroll voucher ID |
| `Payment_Method` | `ENUM(...)` | No | `'Bank Transfer (BEFTN)'` | | BEFTN, Cheque, etc. | Electronic payment gateway method |
| `Transaction_Reference`| `VARCHAR(100)`| No | | **UK** | Unique batch slip | BEFTN reference code (e.g. `'BEFTN-202608-0012'`) |
| `Disbursement_Date`| `DATETIME` | No | | | | Electronic transfer clearing timestamp |
| `Disbursement_Status`| `ENUM(...)`| No | `'Pending'`| | Disbursed, Pending, etc. | Settlement clearing status |
| `Disbursed_Amount`| `DECIMAL(12,2)`| No | | | `CHECK (>= 0)` | Disbursed total (matches Net_Salary) |
| `Remarks` | `VARCHAR(255)` | Yes | `NULL` | | | Bank clearing batch notes |
| `Disbursed_By_User_ID`| `INT` | Yes | `NULL` | **FK** | User_Account | Finance officer who authorized batch |
| `Created_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | | Batch dispatch timestamp |
| `Updated_At` | `DATETIME` | No | `CURRENT_TIMESTAMP` | | On Update | Settlement confirmation timestamp |

- **Table Constraints**:
  - `CONSTRAINT pk_disbursement_record PRIMARY KEY (Disbursement_ID)`
  - `CONSTRAINT uq_disb_payroll_id UNIQUE (Payroll_ID)`
  - `CONSTRAINT uq_disb_txref UNIQUE (Transaction_Reference)`
  - `CONSTRAINT chk_disb_amount_nonnegative CHECK (Disbursed_Amount >= 0.00)`
  - `CONSTRAINT fk_disbursement_payroll FOREIGN KEY (Payroll_ID) REFERENCES Monthly_Payroll(Payroll_ID) ON DELETE RESTRICT ON UPDATE CASCADE`
  - `CONSTRAINT fk_disbursement_user FOREIGN KEY (Disbursed_By_User_ID) REFERENCES User_Account(User_ID) ON DELETE SET NULL ON UPDATE CASCADE`

---

## 13. System_Audit_Log

**Purpose**: Immutable append-only audit trail capturing administrative security events and JSON delta states.

| Column Name | Data Type | Nullable | Default | Keys | Constraints | Description & Example |
|---|---|---|---|---|---|---|
| `Audit_ID` | `BIGINT` | No | Auto Increment | **PK** | | Global audit sequence number |
| `Table_Name` | `VARCHAR(64)` | No | | | | Mutated entity table (e.g. `'Salary_Structure'`) |
| `Operation_Type`| `ENUM(...)` | No | | | `'INSERT'`, `'UPDATE'`, `'DELETE'` | DML operation executed |
| `Record_ID` | `VARCHAR(64)` | No | | | | Primary key identifier of altered row |
| `Changed_By_User`| `INT` | Yes | `NULL` | **FK** | User_Account | User account that executed the mutation |
| `Action_Timestamp`| `DATETIME(6)` | No | `CURRENT_TIMESTAMP(6)`| | Microsecond precision | Server timestamp of event |
| `Old_Values` | `JSON` | Yes | `NULL` | | | State before update/delete (JSON object) |
| `New_Values` | `JSON` | Yes | `NULL` | | | State after insert/update (JSON object) |
| `Description` | `VARCHAR(500)` | Yes | `NULL` | | | Human-readable explanation of operation |

- **Table Constraints**:
  - `CONSTRAINT pk_system_audit_log PRIMARY KEY (Audit_ID)`
  - `CONSTRAINT fk_audit_user FOREIGN KEY (Changed_By_User) REFERENCES User_Account(User_ID) ON DELETE SET NULL ON UPDATE CASCADE`
