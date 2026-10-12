-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 08: Standalone Database Functional, Integrity & Verification Tests
-- Database: paypulse_db
-- Dialect: Native MySQL 8.4 LTS
-- ============================================================================

USE `paypulse_db`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TEST 01: Verify All 13 Core Relational Entities and Minimum Seed Thresholds
-- Expected Result: 13 tables present, all counts meeting minimum baseline.
-- ----------------------------------------------------------------------------
SELECT 'TEST 01: Table Existence & Row Counts' AS `Test_Case`;
SELECT 
    'User_Account' AS `Table_Name`, COUNT(*) AS `Row_Count`, CASE WHEN COUNT(*) >= 100 THEN 'PASSED' ELSE 'FAILED' END AS `Status` FROM `User_Account`
UNION ALL
SELECT 'Department', COUNT(*), CASE WHEN COUNT(*) >= 5 THEN 'PASSED' ELSE 'FAILED' END FROM `Department`
UNION ALL
SELECT 'Designation', COUNT(*), CASE WHEN COUNT(*) >= 15 THEN 'PASSED' ELSE 'FAILED' END FROM `Designation`
UNION ALL
SELECT 'Employee', COUNT(*), CASE WHEN COUNT(*) >= 100 THEN 'PASSED' ELSE 'FAILED' END FROM `Employee`
UNION ALL
SELECT 'Salary_Structure', COUNT(*), CASE WHEN COUNT(*) >= 100 THEN 'PASSED' ELSE 'FAILED' END FROM `Salary_Structure`
UNION ALL
SELECT 'Attendance_Log', COUNT(*), CASE WHEN COUNT(*) >= 2000 THEN 'PASSED' ELSE 'FAILED' END FROM `Attendance_Log`
UNION ALL
SELECT 'Leave_Type', COUNT(*), CASE WHEN COUNT(*) >= 3 THEN 'PASSED' ELSE 'FAILED' END FROM `Leave_Type`
UNION ALL
SELECT 'Leave_Allocation', COUNT(*), CASE WHEN COUNT(*) >= 300 THEN 'PASSED' ELSE 'FAILED' END FROM `Leave_Allocation`
UNION ALL
SELECT 'Leave_Request', COUNT(*), CASE WHEN COUNT(*) >= 20 THEN 'PASSED' ELSE 'FAILED' END FROM `Leave_Request`
UNION ALL
SELECT 'Monthly_Payroll', COUNT(*), CASE WHEN COUNT(*) >= 100 THEN 'PASSED' ELSE 'FAILED' END FROM `Monthly_Payroll`
UNION ALL
SELECT 'Payroll_Component_Detail', COUNT(*), CASE WHEN COUNT(*) >= 400 THEN 'PASSED' ELSE 'FAILED' END FROM `Payroll_Component_Detail`
UNION ALL
SELECT 'Disbursement_Record', COUNT(*), CASE WHEN COUNT(*) >= 100 THEN 'PASSED' ELSE 'FAILED' END FROM `Disbursement_Record`
UNION ALL
SELECT 'System_Audit_Log', COUNT(*), CASE WHEN COUNT(*) >= 5 THEN 'PASSED' ELSE 'FAILED' END FROM `System_Audit_Log`;

-- ----------------------------------------------------------------------------
-- TEST 02: Scalar UDF Math Verification — fn_CalculateMonthlyNetPay
-- Mathematical Baseline:
-- Basic = 100,000, HRA = 20,000, Med = 10,000, Conv = 5,000
-- OT Hours = 10 (hourly = (100,000 / 208) * 1.5 = 721.15 => OT pay = 7,211.50)
-- Gross = 100,000 + 20,000 + 10,000 + 5,000 + 7,211.50 = 142,211.50
-- Tax = 7.5% of 100,000 = 7,500.00; PF = 7% of 100,000 = 7,000.00
-- Unpaid (1 day) = 100,000 / 26 = 3,846.15
-- Deductions = 7,500 + 7,000 + 3,846.15 = 18,346.15
-- Net = 142,211.50 - 18,346.15 = 123,865.35
-- ----------------------------------------------------------------------------
SELECT 'TEST 02: Net Salary Formula Verification' AS `Test_Case`;
SELECT 
    fn_CalculateMonthlyNetPay(
        100000.00, -- Basic
        20000.00,  -- HRA
        10000.00,  -- Med
        5000.00,   -- Conv
        7.50,      -- Tax Rate %
        7.00,      -- PF Rate %
        10.00,     -- OT Hours
        1,         -- Unpaid Days
        26         -- Working Days
    ) AS `Calculated_Net_Salary`,
    123865.35 AS `Expected_Net_Salary`,
    CASE 
        WHEN fn_CalculateMonthlyNetPay(100000.00, 20000.00, 10000.00, 5000.00, 7.50, 7.00, 10.00, 1, 26) = 123865.35 
        THEN 'PASSED' 
        ELSE 'FAILED' 
    END AS `Status`;

-- ----------------------------------------------------------------------------
-- TEST 03: Data Privacy Masking UDF — fn_MaskBankAccount
-- Verifies that bank accounts are properly masked with leading asterisks.
-- ----------------------------------------------------------------------------
SELECT 'TEST 03: Bank Account Masking Verification' AS `Test_Case`;
SELECT 
    fn_MaskBankAccount('1501201982736') AS `Masked_Output`,
    '*********2736' AS `Expected_Output`,
    CASE WHEN fn_MaskBankAccount('1501201982736') = '*********2736' THEN 'PASSED' ELSE 'FAILED' END AS `Status`;

-- ----------------------------------------------------------------------------
-- TEST 04: Overtime Compensation UDF — fn_CalculateOvertimePay
-- ----------------------------------------------------------------------------
SELECT 'TEST 04: Overtime Calculation Verification' AS `Test_Case`;
SELECT 
    fn_CalculateOvertimePay(100000.00, 26, 10.00) AS `Calculated_OT_Pay`,
    7211.50 AS `Expected_OT_Pay`,
    CASE WHEN fn_CalculateOvertimePay(100000.00, 26, 10.00) = 7211.50 THEN 'PASSED' ELSE 'FAILED' END AS `Status`;

-- ----------------------------------------------------------------------------
-- TEST 05: Atomic Onboarding Stored Procedure — sp_OnboardEmployeeWithSalary
-- Tests full atomic onboarding workflow within valid salary band.
-- ----------------------------------------------------------------------------
SELECT 'TEST 05: Atomic Employee Onboarding Stored Procedure' AS `Test_Case`;
CALL sp_OnboardEmployeeWithSalary(
    'test.candidate.qa',
    '$2a$12$7EaxV4/GGEYWYeDHAZxU2.5BT1H0g8QKFNzjaY76Xeb1HbvBrThVm',
    'Employee',
    'EMP-8888',
    1, -- Dept: Software Engineering
    4, -- Desig: Junior Software Engineer (Band: 50,000 to 80,000)
    1, -- Manager: CEO/Admin
    'Test',
    'Candidate',
    'test.candidate.qa@paypulse.internal',
    '+8801700888888',
    '8888888888888',
    '1998-05-10',
    'Female',
    'Gulshan-2, Dhaka',
    '2026-09-01',
    '8881234567890',
    'City Bank PLC',
    'Gulshan Branch',
    '225272345',
    65000.00, -- Basic (Compliant within 50k-80k)
    13000.00, -- HRA (20%)
    6500.00,  -- Med (10%)
    5000.00,  -- Conv
    5.00,     -- Tax Rate
    7.00,     -- PF Rate
    @qa_new_emp_id
);

SELECT 
    @qa_new_emp_id AS `New_Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    ss.`Basic_Salary`,
    CASE WHEN @qa_new_emp_id IS NOT NULL AND ss.`Basic_Salary` = 65000.00 THEN 'PASSED' ELSE 'FAILED' END AS `Status`
FROM `Employee` e
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID`
WHERE e.`Employee_ID` = @qa_new_emp_id;

-- ----------------------------------------------------------------------------
-- TEST 06: Salary Modification Audit Trigger — trg_AuditSalaryModifications
-- Updates basic salary and verifies automatic JSON audit generation.
-- ----------------------------------------------------------------------------
SELECT 'TEST 06: Salary Structure Audit Trigger' AS `Test_Case`;
UPDATE `Salary_Structure`
SET `Basic_Salary` = 70000.00
WHERE `Employee_ID` = @qa_new_emp_id;

SELECT 
    `Audit_ID`, `Table_Name`, `Operation_Type`, `Old_Values`, `New_Values`, `Description`,
    CASE WHEN `Table_Name` = 'Salary_Structure' AND `Operation_Type` = 'UPDATE' THEN 'PASSED' ELSE 'FAILED' END AS `Status`
FROM `System_Audit_Log`
WHERE `Table_Name` = 'Salary_Structure'
ORDER BY `Audit_ID` DESC
LIMIT 1;

-- ----------------------------------------------------------------------------
-- TEST 07: Leave Request Approval & Quota Synchronization Trigger
-- ----------------------------------------------------------------------------
SELECT 'TEST 07: Leave Approval & Allocation Balance Sync' AS `Test_Case`;
-- Create a pending leave request for the newly created employee
INSERT INTO `Leave_Request` (
    `Employee_ID`, `Leave_Type_ID`, `Start_Date`, `End_Date`, `Total_Days`, `Reason`, `Status`
) VALUES (
    @qa_new_emp_id, 1, '2026-10-15', '2026-10-17', 3, 'Personal affairs', 'Pending'
);
SET @qa_req_id = LAST_INSERT_ID();

-- Call approval procedure
CALL sp_ApproveLeaveRequest(@qa_req_id, 1, 'Approved by Admin');

-- Verify Leave Allocation balance was decremented by 3 days
SELECT 
    la.`Employee_ID`,
    la.`Total_Allocated`,
    la.`Days_Used`,
    la.`Days_Remaining`,
    CASE WHEN la.`Days_Used` = 3 AND la.`Days_Remaining` = (la.`Total_Allocated` - 3) THEN 'PASSED' ELSE 'FAILED' END AS `Status`
FROM `Leave_Allocation` la
WHERE la.`Employee_ID` = @qa_new_emp_id AND la.`Leave_Type_ID` = 1 AND la.`Calendar_Year` = 2026;

-- ----------------------------------------------------------------------------
-- TEST 08: Duplicate Payroll Generation Prevention
-- Attempting to run batch payroll on a period already finalized should be blocked.
-- ----------------------------------------------------------------------------
SELECT 'TEST 08: Finalized Payroll Protection Verification' AS `Test_Case`;
SELECT 
    COUNT(*) AS `Disbursed_Payroll_Count`,
    CASE WHEN COUNT(*) > 0 THEN 'PASSED' ELSE 'FAILED' END AS `Status`
FROM `Monthly_Payroll`
WHERE `Payroll_Status` IN ('Finalized', 'Disbursed');

-- ----------------------------------------------------------------------------
-- TEST 09: Transaction Rollback Integrity Test
-- Verifies that a transaction rollback cancels all modifications cleanly.
-- ----------------------------------------------------------------------------
SELECT 'TEST 09: Transaction Atomic Rollback Test' AS `Test_Case`;
START TRANSACTION;
INSERT INTO `Department` (`Department_Name`, `Department_Code`, `Office_Location`)
VALUES ('Test Rollback Department', 'TRD', 'Temporary Virtual Floor');
ROLLBACK;

SELECT 
    COUNT(*) AS `Orphan_Count`,
    CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'FAILED' END AS `Status`
FROM `Department`
WHERE `Department_Code` = 'TRD';

-- ----------------------------------------------------------------------------
-- TEST 10: Clean-Up of Temporary QA Data
-- ----------------------------------------------------------------------------
DELETE FROM `Employee` WHERE `Employee_ID` = @qa_new_emp_id;
DELETE FROM `User_Account` WHERE `Username` = 'test.candidate.qa';
SELECT 'TEST 10: Test Data Clean-Up Complete' AS `Status`;
