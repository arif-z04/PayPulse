-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 01: Core Relational Schema DDL
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Entities Defined: 13 Core Relational Tables
-- ============================================================================

USE `paypulse_db`;

-- Temporarily disable foreign key checks during table definitions
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Entity: User_Account
-- System authentication identity, credential security, and RBAC role assignment.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `User_Account`;
CREATE TABLE `User_Account` (
    `User_ID` INT AUTO_INCREMENT,
    `Username` VARCHAR(50) NOT NULL,
    `Password_Hash` VARCHAR(255) NOT NULL COMMENT 'Salted BCrypt/Argon2 password hash',
    `Role` ENUM(
        'System Administrator',
        'HR Manager',
        'Payroll Officer',
        'Department Supervisor',
        'Employee'
    ) NOT NULL DEFAULT 'Employee',
    `Is_Active` BOOLEAN NOT NULL DEFAULT TRUE,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_user_account` PRIMARY KEY (`User_ID`),
    CONSTRAINT `uq_user_username` UNIQUE (`Username`),
    CONSTRAINT `chk_user_username_minlen` CHECK (CHAR_LENGTH(TRIM(`Username`)) >= 3)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Enterprise authentication credentials and system role assignment';

-- ----------------------------------------------------------------------------
-- 2. Entity: Department
-- Organizational business units, operational branches, and divisions.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Department`;
CREATE TABLE `Department` (
    `Department_ID` INT AUTO_INCREMENT,
    `Department_Name` VARCHAR(100) NOT NULL,
    `Department_Code` VARCHAR(10) NOT NULL,
    `Office_Location` VARCHAR(255) NOT NULL,
    `Head_Of_Department_ID` INT NULL COMMENT 'Circular FK to Employee(Employee_ID) defined in Script 02',
    `Description` TEXT NULL,
    `Is_Active` BOOLEAN NOT NULL DEFAULT TRUE,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_department` PRIMARY KEY (`Department_ID`),
    CONSTRAINT `uq_dept_name` UNIQUE (`Department_Name`),
    CONSTRAINT `uq_dept_code` UNIQUE (`Department_Code`),
    CONSTRAINT `chk_dept_code_format` CHECK (CHAR_LENGTH(TRIM(`Department_Code`)) >= 2)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Organizational divisions, business units, and department heads';

-- ----------------------------------------------------------------------------
-- 3. Entity: Designation
-- Standardized job titles, seniority levels, and statutory salary boundary brackets.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Designation`;
CREATE TABLE `Designation` (
    `Designation_ID` INT AUTO_INCREMENT,
    `Department_ID` INT NOT NULL,
    `Title` VARCHAR(100) NOT NULL,
    `Base_Salary_Min` DECIMAL(12, 2) NOT NULL,
    `Base_Salary_Max` DECIMAL(12, 2) NOT NULL,
    `Description` TEXT NULL,
    `Is_Active` BOOLEAN NOT NULL DEFAULT TRUE,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_designation` PRIMARY KEY (`Designation_ID`),
    CONSTRAINT `uq_dept_designation_title` UNIQUE (`Department_ID`, `Title`),
    CONSTRAINT `chk_desig_salary_min` CHECK (`Base_Salary_Min` >= 0.00),
    CONSTRAINT `chk_desig_salary_range` CHECK (`Base_Salary_Max` >= `Base_Salary_Min`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Job titles, departmental alignment, and statutory salary brackets';

-- ----------------------------------------------------------------------------
-- 4. Entity: Employee
-- Central workforce profile, manager hierarchy, and banking settlement details.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Employee`;
CREATE TABLE `Employee` (
    `Employee_ID` INT AUTO_INCREMENT,
    `Employee_Code` VARCHAR(20) NOT NULL,
    `User_ID` INT NOT NULL,
    `Department_ID` INT NOT NULL,
    `Designation_ID` INT NOT NULL,
    `Manager_ID` INT NULL COMMENT 'Recursive self-referencing hierarchy',
    `First_Name` VARCHAR(50) NOT NULL,
    `Last_Name` VARCHAR(50) NOT NULL,
    `Email` VARCHAR(100) NOT NULL,
    `Phone` VARCHAR(20) NOT NULL,
    `NID` VARCHAR(25) NOT NULL COMMENT 'National Identity Card (10, 13, or 17 digits)',
    `Date_Of_Birth` DATE NOT NULL,
    `Gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `Address` VARCHAR(255) NOT NULL,
    `Hire_Date` DATE NOT NULL,
    `Bank_Account_No` VARCHAR(50) NOT NULL,
    `Bank_Name` VARCHAR(100) NOT NULL,
    `Bank_Branch` VARCHAR(100) NOT NULL,
    `Bank_Routing_No` VARCHAR(20) NOT NULL,
    `Employment_Status` ENUM('Active', 'On-Leave', 'Suspended', 'Terminated', 'Resigned') NOT NULL DEFAULT 'Active',
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_employee` PRIMARY KEY (`Employee_ID`),
    CONSTRAINT `uq_emp_code` UNIQUE (`Employee_Code`),
    CONSTRAINT `uq_emp_user_id` UNIQUE (`User_ID`),
    CONSTRAINT `uq_emp_email` UNIQUE (`Email`),
    CONSTRAINT `uq_emp_nid` UNIQUE (`NID`),
    CONSTRAINT `chk_emp_name_nonempty` CHECK (CHAR_LENGTH(TRIM(`First_Name`)) >= 1 AND CHAR_LENGTH(TRIM(`Last_Name`)) >= 1),
    CONSTRAINT `chk_emp_age_adult` CHECK (`Hire_Date` >= `Date_Of_Birth`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Employee biographical, organizational, and banking settlement profile';

-- ----------------------------------------------------------------------------
-- 5. Entity: Salary_Structure
-- Compensation structure with allowances, tax/provident fund rates, and effective dates.
-- Designed with effective-dating to preserve compensation history over time.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Salary_Structure`;
CREATE TABLE `Salary_Structure` (
    `Structure_ID` INT AUTO_INCREMENT,
    `Employee_ID` INT NOT NULL,
    `Basic_Salary` DECIMAL(12, 2) NOT NULL,
    `House_Rent_Allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Medical_Allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Conveyance_Allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Tax_Deduction_Rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Percentage rate e.g. 5.00 for 5%',
    `Provident_Fund_Rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Percentage rate e.g. 7.50 for 7.5%',
    `Effective_From` DATE NOT NULL,
    `Effective_To` DATE NULL COMMENT 'NULL signifies the currently active salary structure',
    `Is_Active` BOOLEAN NOT NULL DEFAULT TRUE,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_salary_structure` PRIMARY KEY (`Structure_ID`),
    CONSTRAINT `chk_salary_basic_positive` CHECK (`Basic_Salary` > 0.00),
    CONSTRAINT `chk_salary_hra_nonnegative` CHECK (`House_Rent_Allowance` >= 0.00),
    CONSTRAINT `chk_salary_med_nonnegative` CHECK (`Medical_Allowance` >= 0.00),
    CONSTRAINT `chk_salary_conv_nonnegative` CHECK (`Conveyance_Allowance` >= 0.00),
    CONSTRAINT `chk_salary_tax_rate_range` CHECK (`Tax_Deduction_Rate` >= 0.00 AND `Tax_Deduction_Rate` <= 100.00),
    CONSTRAINT `chk_salary_pf_rate_range` CHECK (`Provident_Fund_Rate` >= 0.00 AND `Provident_Fund_Rate` <= 100.00),
    CONSTRAINT `chk_salary_effective_dates` CHECK (`Effective_To` IS NULL OR `Effective_To` >= `Effective_From`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Effective-dated compensation structures, allowances, and statutory rates';

-- ----------------------------------------------------------------------------
-- 6. Entity: Attendance_Log
-- Daily biometric check-in/out timestamps, hours worked, overtime, and work statuses.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Attendance_Log`;
CREATE TABLE `Attendance_Log` (
    `Log_ID` INT AUTO_INCREMENT,
    `Employee_ID` INT NOT NULL,
    `Work_Date` DATE NOT NULL,
    `Check_In_Time` DATETIME NULL,
    `Check_Out_Time` DATETIME NULL,
    `Working_Hours` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `Overtime_Hours` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `Attendance_Status` ENUM('Present', 'Late', 'Half-Day', 'Absent', 'On-Leave', 'Holiday', 'Weekend') NOT NULL DEFAULT 'Present',
    `Remarks` VARCHAR(255) NULL,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_attendance_log` PRIMARY KEY (`Log_ID`),
    CONSTRAINT `uq_emp_work_date` UNIQUE (`Employee_ID`, `Work_Date`),
    CONSTRAINT `chk_att_hours_range` CHECK (`Working_Hours` >= 0.00 AND `Working_Hours` <= 24.00),
    CONSTRAINT `chk_att_ot_range` CHECK (`Overtime_Hours` >= 0.00 AND `Overtime_Hours` <= 16.00),
    CONSTRAINT `chk_att_checkout_after_checkin` CHECK (`Check_Out_Time` IS NULL OR `Check_In_Time` IS NULL OR `Check_Out_Time` >= `Check_In_Time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Daily biometric attendance logs, timestamps, hours, and work statuses';

-- ----------------------------------------------------------------------------
-- 7. Entity: Leave_Type
-- Policy definitions for paid/unpaid leaves and annual maximum entitlements.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Leave_Type`;
CREATE TABLE `Leave_Type` (
    `Leave_Type_ID` INT AUTO_INCREMENT,
    `Type_Name` VARCHAR(50) NOT NULL,
    `Max_Days_Per_Year` INT NOT NULL,
    `Is_Carry_Forward` BOOLEAN NOT NULL DEFAULT FALSE,
    `Is_Paid` BOOLEAN NOT NULL DEFAULT TRUE,
    `Description` VARCHAR(255) NULL,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_leave_type` PRIMARY KEY (`Leave_Type_ID`),
    CONSTRAINT `uq_leave_type_name` UNIQUE (`Type_Name`),
    CONSTRAINT `chk_leave_type_days_range` CHECK (`Max_Days_Per_Year` >= 0 AND `Max_Days_Per_Year` <= 365)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Corporate leave policy definitions and statutory allocations';

-- ----------------------------------------------------------------------------
-- 8. Entity: Leave_Allocation
-- Annual leave entitlement ledger and consumed balance per employee and leave type.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Leave_Allocation`;
CREATE TABLE `Leave_Allocation` (
    `Allocation_ID` INT AUTO_INCREMENT,
    `Employee_ID` INT NOT NULL,
    `Leave_Type_ID` INT NOT NULL,
    `Calendar_Year` SMALLINT NOT NULL,
    `Total_Allocated` INT NOT NULL,
    `Days_Used` INT NOT NULL DEFAULT 0,
    `Days_Remaining` INT NOT NULL,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_leave_allocation` PRIMARY KEY (`Allocation_ID`),
    CONSTRAINT `uq_emp_leave_year` UNIQUE (`Employee_ID`, `Leave_Type_ID`, `Calendar_Year`),
    CONSTRAINT `chk_alloc_year_range` CHECK (`Calendar_Year` BETWEEN 2000 AND 2100),
    CONSTRAINT `chk_alloc_allocated_positive` CHECK (`Total_Allocated` >= 0),
    CONSTRAINT `chk_alloc_used_nonnegative` CHECK (`Days_Used` >= 0),
    CONSTRAINT `chk_alloc_remaining_nonnegative` CHECK (`Days_Remaining` >= 0),
    CONSTRAINT `chk_alloc_balance_identity` CHECK (`Days_Remaining` = `Total_Allocated` - `Days_Used`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Annual leave entitlement quotas and real-time remaining balances';

-- ----------------------------------------------------------------------------
-- 9. Entity: Leave_Request
-- Formal leave applications submitted by employees, approval workflow status.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Leave_Request`;
CREATE TABLE `Leave_Request` (
    `Request_ID` INT AUTO_INCREMENT,
    `Employee_ID` INT NOT NULL,
    `Leave_Type_ID` INT NOT NULL,
    `Approved_By_User_ID` INT NULL COMMENT 'FK to User_Account(User_ID)',
    `Start_Date` DATE NOT NULL,
    `End_Date` DATE NOT NULL,
    `Total_Days` INT NOT NULL,
    `Reason` VARCHAR(500) NOT NULL,
    `Status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `Applied_Date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Approval_Remarks` VARCHAR(255) NULL,
    `Approved_At` DATETIME NULL,
    CONSTRAINT `pk_leave_request` PRIMARY KEY (`Request_ID`),
    CONSTRAINT `chk_req_date_order` CHECK (`End_Date` >= `Start_Date`),
    CONSTRAINT `chk_req_total_days_positive` CHECK (`Total_Days` > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Leave applications, managerial sign-off, and lifecycle states';

-- ----------------------------------------------------------------------------
-- 10. Entity: Monthly_Payroll
-- Immutable point-in-time financial compensation ledger per employee and period.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Monthly_Payroll`;
CREATE TABLE `Monthly_Payroll` (
    `Payroll_ID` INT AUTO_INCREMENT,
    `Employee_ID` INT NOT NULL,
    `Payroll_Month` TINYINT NOT NULL,
    `Payroll_Year` SMALLINT NOT NULL,
    `Working_Days` TINYINT NOT NULL,
    `Present_Days` TINYINT NOT NULL,
    `Paid_Leave_Days` TINYINT NOT NULL DEFAULT 0,
    `Unpaid_Leave_Days` TINYINT NOT NULL DEFAULT 0,
    `Basic_Salary` DECIMAL(12, 2) NOT NULL,
    `Total_Allowances` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Gross_Salary` DECIMAL(12, 2) NOT NULL,
    `Total_Deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `Net_Salary` DECIMAL(12, 2) NOT NULL,
    `Generation_Date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Finalized_Date` DATETIME NULL,
    `Payroll_Status` ENUM('Draft', 'Generated', 'Approved', 'Finalized', 'Disbursed', 'Cancelled') NOT NULL DEFAULT 'Generated',
    `Generated_By_User_ID` INT NULL,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_monthly_payroll` PRIMARY KEY (`Payroll_ID`),
    CONSTRAINT `uq_emp_payroll_period` UNIQUE (`Employee_ID`, `Payroll_Year`, `Payroll_Month`),
    CONSTRAINT `chk_pay_month_range` CHECK (`Payroll_Month` BETWEEN 1 AND 12),
    CONSTRAINT `chk_pay_year_range` CHECK (`Payroll_Year` BETWEEN 2000 AND 2100),
    CONSTRAINT `chk_pay_working_days_range` CHECK (`Working_Days` >= 0 AND `Working_Days` <= 31),
    CONSTRAINT `chk_pay_present_days_range` CHECK (`Present_Days` >= 0 AND `Present_Days` <= `Working_Days`),
    CONSTRAINT `chk_pay_paid_leave_nonnegative` CHECK (`Paid_Leave_Days` >= 0),
    CONSTRAINT `chk_pay_unpaid_leave_nonnegative` CHECK (`Unpaid_Leave_Days` >= 0),
    CONSTRAINT `chk_pay_basic_nonnegative` CHECK (`Basic_Salary` >= 0.00),
    CONSTRAINT `chk_pay_allowances_nonnegative` CHECK (`Total_Allowances` >= 0.00),
    CONSTRAINT `chk_pay_gross_geq_basic` CHECK (`Gross_Salary` >= `Basic_Salary`),
    CONSTRAINT `chk_pay_deductions_nonnegative` CHECK (`Total_Deductions` >= 0.00),
    CONSTRAINT `chk_pay_net_nonnegative` CHECK (`Net_Salary` >= 0.00),
    CONSTRAINT `chk_pay_math_consistency` CHECK (`Net_Salary` = `Gross_Salary` - `Total_Deductions`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Historical monthly compensation ledger and statutory withholding snapshot';

-- ----------------------------------------------------------------------------
-- 11. Entity: Payroll_Component_Detail
-- Granular line-item breakdown of allowances, additions, and statutory deductions.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Payroll_Component_Detail`;
CREATE TABLE `Payroll_Component_Detail` (
    `Detail_ID` INT AUTO_INCREMENT,
    `Payroll_ID` INT NOT NULL,
    `Component_Name` VARCHAR(100) NOT NULL,
    `Component_Type` ENUM('Earning', 'Deduction') NOT NULL,
    `Amount` DECIMAL(12, 2) NOT NULL,
    `Remarks` VARCHAR(255) NULL,
    CONSTRAINT `pk_payroll_component_detail` PRIMARY KEY (`Detail_ID`),
    CONSTRAINT `chk_comp_amount_nonnegative` CHECK (`Amount` >= 0.00)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Itemized earnings and deduction breakdown lines per monthly payslip';

-- ----------------------------------------------------------------------------
-- 12. Entity: Disbursement_Record
-- Electronic Fund Transfer (BEFTN) banking settlement and transaction ledger.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Disbursement_Record`;
CREATE TABLE `Disbursement_Record` (
    `Disbursement_ID` INT AUTO_INCREMENT,
    `Payroll_ID` INT NOT NULL,
    `Payment_Method` ENUM('Bank Transfer (BEFTN)', 'Direct Deposit', 'Cheque', 'Cash') NOT NULL DEFAULT 'Bank Transfer (BEFTN)',
    `Transaction_Reference` VARCHAR(100) NOT NULL,
    `Disbursement_Date` DATETIME NOT NULL,
    `Disbursement_Status` ENUM('Pending', 'Processing', 'Disbursed', 'Failed', 'Reversed') NOT NULL DEFAULT 'Pending',
    `Disbursed_Amount` DECIMAL(12, 2) NOT NULL,
    `Remarks` VARCHAR(255) NULL,
    `Disbursed_By_User_ID` INT NULL,
    `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_disbursement_record` PRIMARY KEY (`Disbursement_ID`),
    CONSTRAINT `uq_disb_payroll_id` UNIQUE (`Payroll_ID`),
    CONSTRAINT `uq_disb_txref` UNIQUE (`Transaction_Reference`),
    CONSTRAINT `chk_disb_amount_nonnegative` CHECK (`Disbursed_Amount` >= 0.00)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'BEFTN banking disbursement records and transaction settlement tracking';

-- ----------------------------------------------------------------------------
-- 13. Entity: System_Audit_Log
-- Immutable append-only audit trail capturing security events and data deltas.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `System_Audit_Log`;
CREATE TABLE `System_Audit_Log` (
    `Audit_ID` BIGINT AUTO_INCREMENT,
    `Table_Name` VARCHAR(64) NOT NULL,
    `Operation_Type` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `Record_ID` VARCHAR(64) NOT NULL,
    `Changed_By_User` INT NULL COMMENT 'FK to User_Account(User_ID)',
    `Action_Timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `Old_Values` JSON NULL COMMENT 'Before-state snapshot in structured JSON',
    `New_Values` JSON NULL COMMENT 'After-state snapshot in structured JSON',
    `Description` VARCHAR(500) NULL,
    CONSTRAINT `pk_system_audit_log` PRIMARY KEY (`Audit_ID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
COMMENT = 'Immutable append-only enterprise security audit log with JSON delta states';

-- Restore foreign key checks
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
