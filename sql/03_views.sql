-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 03: Secure Operational & Analytical Database Views
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Security Compliance: Masks sensitive banking data and hides password hashes
-- ============================================================================

USE `paypulse_db`;

-- ----------------------------------------------------------------------------
-- 1. View: vw_EmployeeDirectory
-- General enterprise organizational directory for HR, staff, and supervisors.
-- Excludes sensitive credential hashes, National IDs, and banking information.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_EmployeeDirectory` AS
SELECT 
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    e.`First_Name`,
    e.`Last_Name`,
    e.`Email`,
    e.`Phone`,
    e.`Gender`,
    d.`Department_ID`,
    d.`Department_Name`,
    d.`Department_Code`,
    des.`Designation_ID`,
    des.`Title` AS `Designation_Title`,
    e.`Manager_ID`,
    CONCAT(m.`First_Name`, ' ', m.`Last_Name`) AS `Manager_Name`,
    e.`Hire_Date`,
    e.`Employment_Status`,
    u.`Role` AS `System_Role`,
    u.`Is_Active` AS `Account_Active`
FROM `Employee` e
JOIN `Department` d 
    ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des 
    ON e.`Designation_ID` = des.`Designation_ID`
LEFT JOIN `Employee` m 
    ON e.`Manager_ID` = m.`Employee_ID`
JOIN `User_Account` u 
    ON e.`User_ID` = u.`User_ID`;

-- ----------------------------------------------------------------------------
-- 2. View: vw_AttendanceMonthlySummary
-- Aggregates monthly biometric attendance metrics per employee.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_AttendanceMonthlySummary` AS
SELECT 
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    d.`Department_Name`,
    YEAR(a.`Work_Date`) AS `Attendance_Year`,
    MONTH(a.`Work_Date`) AS `Attendance_Month`,
    COUNT(a.`Log_ID`) AS `Total_Logged_Days`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Present' THEN 1 ELSE 0 END) AS `Present_Days`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Late' THEN 1 ELSE 0 END) AS `Late_Days`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Half-Day' THEN 1 ELSE 0 END) AS `Half_Days`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Absent' THEN 1 ELSE 0 END) AS `Absent_Days`,
    SUM(CASE WHEN a.`Attendance_Status` = 'On-Leave' THEN 1 ELSE 0 END) AS `On_Leave_Days`,
    COALESCE(SUM(a.`Overtime_Hours`), 0.00) AS `Total_Overtime_Hours`,
    ROUND(AVG(a.`Working_Hours`), 2) AS `Avg_Daily_Working_Hours`
FROM `Employee` e
JOIN `Department` d 
    ON e.`Department_ID` = d.`Department_ID`
JOIN `Attendance_Log` a 
    ON e.`Employee_ID` = a.`Employee_ID`
GROUP BY 
    e.`Employee_ID`,
    e.`Employee_Code`,
    e.`First_Name`,
    e.`Last_Name`,
    d.`Department_Name`,
    YEAR(a.`Work_Date`),
    MONTH(a.`Work_Date`);

-- ----------------------------------------------------------------------------
-- 3. View: vw_MonthlyPayrollSummary
-- Comprehensive monthly compensation ledger with settlement tracking.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_MonthlyPayrollSummary` AS
SELECT 
    p.`Payroll_ID`,
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    d.`Department_Name`,
    des.`Title` AS `Designation_Title`,
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    p.`Working_Days`,
    p.`Present_Days`,
    p.`Paid_Leave_Days`,
    p.`Unpaid_Leave_Days`,
    p.`Basic_Salary`,
    p.`Total_Allowances`,
    p.`Gross_Salary`,
    p.`Total_Deductions`,
    p.`Net_Salary`,
    p.`Payroll_Status`,
    p.`Generation_Date`,
    p.`Finalized_Date`,
    dis.`Disbursement_Status`,
    dis.`Transaction_Reference`,
    dis.`Disbursement_Date`
FROM `Monthly_Payroll` p
JOIN `Employee` e 
    ON p.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d 
    ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des 
    ON e.`Designation_ID` = des.`Designation_ID`
LEFT JOIN `Disbursement_Record` dis 
    ON p.`Payroll_ID` = dis.`Payroll_ID`;

-- ----------------------------------------------------------------------------
-- 4. View: vw_LeaveBalanceAndPendingRequests
-- Live leave quota tracking alongside pending application indicators.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_LeaveBalanceAndPendingRequests` AS
SELECT 
    la.`Allocation_ID`,
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    d.`Department_Name`,
    lt.`Leave_Type_ID`,
    lt.`Type_Name` AS `Leave_Type_Name`,
    lt.`Is_Paid`,
    la.`Calendar_Year`,
    la.`Total_Allocated`,
    la.`Days_Used`,
    la.`Days_Remaining`,
    COALESCE(
        (SELECT COUNT(*) 
         FROM `Leave_Request` lr 
         WHERE lr.`Employee_ID` = e.`Employee_ID` 
           AND lr.`Leave_Type_ID` = lt.`Leave_Type_ID` 
           AND lr.`Status` = 'Pending'), 0
    ) AS `Pending_Requests_Count`
FROM `Leave_Allocation` la
JOIN `Employee` e 
    ON la.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d 
    ON e.`Department_ID` = d.`Department_ID`
JOIN `Leave_Type` lt 
    ON la.`Leave_Type_ID` = lt.`Leave_Type_ID`;

-- ----------------------------------------------------------------------------
-- 5. View: vw_DepartmentPayrollExpenditure
-- Departmental fiscal aggregation for executive budgeting and headcount audits.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_DepartmentPayrollExpenditure` AS
SELECT 
    d.`Department_ID`,
    d.`Department_Name`,
    d.`Department_Code`,
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    COUNT(DISTINCT p.`Employee_ID`) AS `Processed_Headcount`,
    SUM(p.`Basic_Salary`) AS `Total_Basic_Salary`,
    SUM(p.`Total_Allowances`) AS `Total_Allowances`,
    SUM(p.`Gross_Salary`) AS `Total_Gross_Expenditure`,
    SUM(p.`Total_Deductions`) AS `Total_Deductions`,
    SUM(p.`Net_Salary`) AS `Total_Net_Disbursement`,
    ROUND(AVG(p.`Net_Salary`), 2) AS `Average_Net_Salary`
FROM `Department` d
JOIN `Employee` e 
    ON d.`Department_ID` = e.`Department_ID`
JOIN `Monthly_Payroll` p 
    ON e.`Employee_ID` = p.`Employee_ID`
GROUP BY 
    d.`Department_ID`,
    d.`Department_Name`,
    d.`Department_Code`,
    p.`Payroll_Year`,
    p.`Payroll_Month`;

-- ----------------------------------------------------------------------------
-- 6. View: vw_DisbursementReconciliation
-- Banking settlement statement with masked account numbers for privacy.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_DisbursementReconciliation` AS
SELECT 
    dis.`Disbursement_ID`,
    p.`Payroll_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    e.`Bank_Name`,
    e.`Bank_Branch`,
    CONCAT('*******', RIGHT(TRIM(e.`Bank_Account_No`), 4)) AS `Masked_Bank_Account`,
    e.`Bank_Routing_No`,
    dis.`Payment_Method`,
    dis.`Transaction_Reference`,
    dis.`Disbursed_Amount`,
    dis.`Disbursement_Date`,
    dis.`Disbursement_Status`,
    p.`Payroll_Status`,
    p.`Payroll_Year`,
    p.`Payroll_Month`
FROM `Disbursement_Record` dis
JOIN `Monthly_Payroll` p 
    ON dis.`Payroll_ID` = p.`Payroll_ID`
JOIN `Employee` e 
    ON p.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d 
    ON e.`Department_ID` = d.`Department_ID`;
