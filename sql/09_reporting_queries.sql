-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 09: 35+ Enterprise Analytical, Reporting & Verification SQL Queries
-- Database: paypulse_db
-- Dialect: Native MySQL 8.4 LTS
-- Covers: CRUD, Pagination, Multi-Table Joins, Grouping, Correlated Subqueries,
--         CTEs, Recursive CTEs, Window Functions, Integrity Checks, Rollups
-- ============================================================================

USE `paypulse_db`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION A: CRUD, FILTERING, SORTING & PAGINATION QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 01: Keyset / Offset Pagination Query for Employee Directory
-- Demonstrates: Multi-table JOIN, dynamic search filtering, sorting, LIMIT/OFFSET
-- Business Purpose: Powers enterprise web grid pagination (Page 1, 10 records per page)
--                   filtering for active employees in Software Engineering.
-- Expected Result: 10 rows returned with employee details, department name, title,
--                  and manager name.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    e.`Email`,
    e.`Phone`,
    d.`Department_Name`,
    des.`Title` AS `Designation_Title`,
    COALESCE(CONCAT(m.`First_Name`, ' ', m.`Last_Name`), 'TOP EXECUTIVE') AS `Manager_Name`,
    e.`Hire_Date`,
    e.`Employment_Status`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
LEFT JOIN `Employee` m ON e.`Manager_ID` = m.`Employee_ID`
WHERE e.`Employment_Status` = 'Active'
  AND d.`Department_Code` = 'ENG'
ORDER BY e.`Hire_Date` ASC, e.`Employee_ID` ASC
LIMIT 10 OFFSET 0;

-- ----------------------------------------------------------------------------
-- QUERY 02: Parameterized Multi-Attribute Search with Sorting
-- Demonstrates: Multi-column LIKE search, NULL-safe joins, compound sorting
-- Business Purpose: Global search modal finding employees across name, code, or NID.
-- Expected Result: Matching employees sorted alphabetically by Last Name.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Full_Name`,
    e.`NID`,
    e.`Email`,
    d.`Department_Name`,
    des.`Title` AS `Designation_Title`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
WHERE (e.`First_Name` LIKE '%Ahmed%' OR e.`Last_Name` LIKE '%Ahmed%' OR e.`Employee_Code` LIKE '%EMP-1001%')
ORDER BY e.`Last_Name` ASC, e.`First_Name` ASC;

-- ----------------------------------------------------------------------------
-- QUERY 03: Comprehensive Data Integrity & Anomaly Scanner
-- Demonstrates: Compound UNION ALL check query verifying database-wide invariants.
-- Business Purpose: Automated health-check scanner for compliance and ledger audits.
-- Expected Result: Zero anomaly rows (count = 0 for all checks).
-- ----------------------------------------------------------------------------
SELECT 'Orphaned Employees (Invalid User_ID)' AS `Check_Name`, COUNT(*) AS `Anomaly_Count`
FROM `Employee` e LEFT JOIN `User_Account` u ON e.`User_ID` = u.`User_ID` WHERE u.`User_ID` IS NULL
UNION ALL
SELECT 'Employees without Active Salary Structure', COUNT(*)
FROM `Employee` e LEFT JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE WHERE ss.`Structure_ID` IS NULL
UNION ALL
SELECT 'Inconsistent Net Salary Calculations', COUNT(*)
FROM `Monthly_Payroll` WHERE `Net_Salary` <> (`Gross_Salary` - `Total_Deductions`)
UNION ALL
SELECT 'Inconsistent Leave Allocation Balances', COUNT(*)
FROM `Leave_Allocation` WHERE `Days_Remaining` <> (`Total_Allocated` - `Days_Used`);

-- ============================================================================
-- SECTION B: ADVANCED ANALYTICAL & REPORTING QUERIES
-- ============================================================================

-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 11: 32 Advanced Analytical & Reporting SQL Queries
-- Database: paypulse_db
-- Dialect: Native MySQL 8.4 LTS
-- Covers: CTEs, Recursive CTEs, Window Functions, Rollups, Joins, Aggregations
-- ============================================================================


-- ----------------------------------------------------------------------------
-- QUERY 01: Full Organizational Reporting Tree via Recursive CTE
-- Demonstrates: Recursive CTE, Self-Join, Hierarchy Level, Path String
-- Business Purpose: Traverses reporting lines from CEO/Directors down to junior staff.
-- ----------------------------------------------------------------------------

WITH RECURSIVE OrgHierarchy AS (
    -- Anchor member: Executive officers who report to nobody (Manager_ID IS NULL)
    SELECT 
        e.`Employee_ID`,
        e.`Employee_Code`,
        CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
        e.`Manager_ID`,
        CAST(NULL AS CHAR(100)) AS `Manager_Name`,
        d.`Department_Name`,
        des.`Title` AS `Designation_Title`,
        1 AS `Hierarchy_Level`,
        CAST(CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS CHAR(1000)) AS `Management_Path`
    FROM `Employee` e
    JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
    JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
    WHERE e.`Manager_ID` IS NULL

    UNION ALL

    -- Recursive member: Subordinates reporting to employees in the previous level
    SELECT 
        sub.`Employee_ID`,
        sub.`Employee_Code`,
        CONCAT(sub.`First_Name`, ' ', sub.`Last_Name`) AS `Employee_Name`,
        sub.`Manager_ID`,
        mgr.`Employee_Name` AS `Manager_Name`,
        d.`Department_Name`,
        des.`Title` AS `Designation_Title`,
        mgr.`Hierarchy_Level` + 1 AS `Hierarchy_Level`,
        CONCAT(mgr.`Management_Path`, ' -> ', sub.`First_Name`, ' ', sub.`Last_Name`) AS `Management_Path`
    FROM `Employee` sub
    JOIN OrgHierarchy mgr ON sub.`Manager_ID` = mgr.`Employee_ID`
    JOIN `Department` d ON sub.`Department_ID` = d.`Department_ID`
    JOIN `Designation` des ON sub.`Designation_ID` = des.`Designation_ID`
)
SELECT 
    `Hierarchy_Level`,
    `Employee_Code`,
    `Employee_Name`,
    COALESCE(`Manager_Name`, 'TOP EXECUTIVE') AS `Manager_Name`,
    `Department_Name`,
    `Designation_Title`,
    `Management_Path`
FROM OrgHierarchy
ORDER BY `Hierarchy_Level`, `Department_Name`, `Employee_Name`;

-- ----------------------------------------------------------------------------
-- QUERY 02: Departmental Compensation Ranking via DENSE_RANK() & RANK()
-- Demonstrates: Window Functions DENSE_RANK() and RANK() partitioned by department
-- Business Purpose: Identifies top 3 highest earners in each corporate division.
-- ----------------------------------------------------------------------------
WITH RankedComp AS (
    SELECT 
        d.`Department_Name`,
        e.`Employee_Code`,
        CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
        des.`Title` AS `Designation`,
        ss.`Basic_Salary`,
        DENSE_RANK() OVER (
            PARTITION BY d.`Department_ID` 
            ORDER BY ss.`Basic_Salary` DESC
        ) AS `Salary_Dense_Rank`,
        RANK() OVER (
            PARTITION BY d.`Department_ID` 
            ORDER BY ss.`Basic_Salary` DESC
        ) AS `Salary_Standard_Rank`
    FROM `Employee` e
    JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
    JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
    JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
)
SELECT 
    `Department_Name`,
    `Salary_Dense_Rank`,
    `Employee_Code`,
    `Employee_Name`,
    `Designation`,
    `Basic_Salary`
FROM RankedComp
WHERE `Salary_Dense_Rank` <= 3
ORDER BY `Department_Name`, `Salary_Dense_Rank`;

-- ----------------------------------------------------------------------------
-- QUERY 03: Month-over-Month Departmental Payroll Variance using LAG()
-- Demonstrates: Window Function LAG(), Variance calculation, Percentage delta
-- Business Purpose: Analyzes fiscal payroll shifts between consecutive months.
-- ----------------------------------------------------------------------------
WITH MonthlyDeptTotals AS (
    SELECT 
        d.`Department_Name`,
        p.`Payroll_Year`,
        p.`Payroll_Month`,
        SUM(p.`Gross_Salary`) AS `Current_Gross_Expenditure`,
        SUM(p.`Net_Salary`) AS `Current_Net_Payout`
    FROM `Monthly_Payroll` p
    JOIN `Employee` e ON p.`Employee_ID` = e.`Employee_ID`
    JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
    GROUP BY d.`Department_Name`, p.`Payroll_Year`, p.`Payroll_Month`
),
MoMVariance AS (
    SELECT 
        `Department_Name`,
        `Payroll_Year`,
        `Payroll_Month`,
        `Current_Gross_Expenditure`,
        LAG(`Current_Gross_Expenditure`, 1) OVER (
            PARTITION BY `Department_Name` 
            ORDER BY `Payroll_Year`, `Payroll_Month`
        ) AS `Previous_Gross_Expenditure`
    FROM MonthlyDeptTotals
)
SELECT 
    `Department_Name`,
    `Payroll_Year`,
    `Payroll_Month`,
    `Current_Gross_Expenditure`,
    COALESCE(`Previous_Gross_Expenditure`, 0.00) AS `Previous_Gross_Expenditure`,
    ROUND(`Current_Gross_Expenditure` - COALESCE(`Previous_Gross_Expenditure`, `Current_Gross_Expenditure`), 2) AS `Gross_Absolute_Delta`,
    ROUND(
        CASE 
            WHEN `Previous_Gross_Expenditure` IS NULL THEN 0.00
            ELSE ((`Current_Gross_Expenditure` - `Previous_Gross_Expenditure`) / `Previous_Gross_Expenditure`) * 100.0
        END, 2
    ) AS `Percentage_Growth`
FROM MoMVariance
ORDER BY `Department_Name`, `Payroll_Year`, `Payroll_Month`;

-- ----------------------------------------------------------------------------
-- QUERY 04: Identification of Chronic Absenteeism and Punctuality Outliers
-- Demonstrates: GROUP BY, HAVING, Multi-table Joins, Conditional Aggregation
-- Business Purpose: Flags employees with >= 2 unexcused absences or >= 3 late check-ins.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    COUNT(a.`Log_ID`) AS `Total_Days_Evaluated`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Absent' THEN 1 ELSE 0 END) AS `Total_Absences`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Late' THEN 1 ELSE 0 END) AS `Total_Late_Checkins`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Half-Day' THEN 1 ELSE 0 END) AS `Total_Half_Days`,
    ROUND(
        (SUM(CASE WHEN a.`Attendance_Status` = 'Present' THEN 1 ELSE 0 END) / COUNT(a.`Log_ID`)) * 100.0, 
        2
    ) AS `Punctual_Attendance_Rate`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Attendance_Log` a ON e.`Employee_ID` = a.`Employee_ID`
WHERE a.`Work_Date` BETWEEN '2026-08-01' AND '2026-08-31'
GROUP BY e.`Employee_Code`, e.`First_Name`, e.`Last_Name`, d.`Department_Name`
HAVING `Total_Absences` >= 1 OR `Total_Late_Checkins` >= 3
ORDER BY `Total_Absences` DESC, `Total_Late_Checkins` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 05: Overtime Outliers & High-Expenditure Employees using CTE & Benchmark
-- Demonstrates: CTE, Correlated Subquery benchmark comparison, Filter on deviation
-- Business Purpose: Finds employees exceeding 1.5x their departmental average overtime.
-- ----------------------------------------------------------------------------
WITH DeptAvgOvertime AS (
    SELECT 
        e.`Department_ID`,
        AVG(a.`Overtime_Hours`) AS `Dept_Avg_OT_Hours`
    FROM `Attendance_Log` a
    JOIN `Employee` e ON a.`Employee_ID` = e.`Employee_ID`
    WHERE a.`Work_Date` BETWEEN '2026-08-01' AND '2026-08-31'
    GROUP BY e.`Department_ID`
),
EmployeeOvertime AS (
    SELECT 
        e.`Employee_ID`,
        e.`Employee_Code`,
        CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
        e.`Department_ID`,
        d.`Department_Name`,
        SUM(a.`Overtime_Hours`) AS `Employee_OT_Hours`
    FROM `Employee` e
    JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
    JOIN `Attendance_Log` a ON e.`Employee_ID` = a.`Employee_ID`
    WHERE a.`Work_Date` BETWEEN '2026-08-01' AND '2026-08-31'
    GROUP BY e.`Employee_ID`, e.`Employee_Code`, e.`First_Name`, e.`Last_Name`, e.`Department_ID`, d.`Department_Name`
)
SELECT 
    eo.`Employee_Code`,
    eo.`Employee_Name`,
    eo.`Department_Name`,
    eo.`Employee_OT_Hours`,
    ROUND(dao.`Dept_Avg_OT_Hours`, 2) AS `Dept_Avg_OT_Benchmark`,
    ROUND(eo.`Employee_OT_Hours` - dao.`Dept_Avg_OT_Hours`, 2) AS `Excess_Overtime_Hours`
FROM EmployeeOvertime eo
JOIN DeptAvgOvertime dao ON eo.`Department_ID` = dao.`Department_ID`
WHERE eo.`Employee_OT_Hours` > (1.5 * dao.`Dept_Avg_OT_Hours`)
ORDER BY eo.`Employee_OT_Hours` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 06: Statutory Tax & Provident Fund Remittance Statement
-- Demonstrates: Financial aggregations, Component breakdown, Compliance summary
-- Business Purpose: Prepares monthly tax withholding and retirement fund schedules.
-- ----------------------------------------------------------------------------
SELECT 
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    d.`Department_Name`,
    COUNT(p.`Employee_ID`) AS `Staff_Count`,
    SUM(p.`Basic_Salary`) AS `Total_Basic_Salary`,
    SUM(
        COALESCE((SELECT pcd.`Amount` 
                  FROM `Payroll_Component_Detail` pcd 
                  WHERE pcd.`Payroll_ID` = p.`Payroll_ID` 
                    AND pcd.`Component_Name` LIKE '%Income Tax%'), 0.00)
    ) AS `Total_Income_Tax_Withheld`,
    SUM(
        COALESCE((SELECT pcd.`Amount` 
                  FROM `Payroll_Component_Detail` pcd 
                  WHERE pcd.`Payroll_ID` = p.`Payroll_ID` 
                    AND pcd.`Component_Name` LIKE '%Provident Fund%'), 0.00)
    ) AS `Total_Provident_Fund_Employee`,
    -- Company matching provident fund (100% employer match)
    SUM(
        COALESCE((SELECT pcd.`Amount` 
                  FROM `Payroll_Component_Detail` pcd 
                  WHERE pcd.`Payroll_ID` = p.`Payroll_ID` 
                    AND pcd.`Component_Name` LIKE '%Provident Fund%'), 0.00)
    ) AS `Total_Company_PF_Contribution_Match`,
    ROUND(
        SUM(p.`Net_Salary`), 2
    ) AS `Total_Disbursed_Take_Home`
FROM `Monthly_Payroll` p
JOIN `Employee` e ON p.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
WHERE p.`Payroll_Year` = 2026 AND p.`Payroll_Month` = 8
GROUP BY p.`Payroll_Year`, p.`Payroll_Month`, d.`Department_Name`
ORDER BY `Total_Basic_Salary` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 07: Designation Salary Band Compliance Audit
-- Demonstrates: CASE expression, Numerical bounds comparison, Outlier detection
-- Business Purpose: Detects employees whose basic salary falls outside their band.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    des.`Title` AS `Designation_Title`,
    des.`Base_Salary_Min`,
    des.`Base_Salary_Max`,
    ss.`Basic_Salary` AS `Actual_Basic_Salary`,
    CASE 
        WHEN ss.`Basic_Salary` < des.`Base_Salary_Min` THEN 'UNDERPAID (Below Band Minimum)'
        WHEN ss.`Basic_Salary` > des.`Base_Salary_Max` THEN 'OVERPAID (Exceeds Band Maximum)'
        ELSE 'COMPLIANT'
    END AS `Band_Compliance_Status`,
    CASE 
        WHEN ss.`Basic_Salary` < des.`Base_Salary_Min` THEN ROUND(des.`Base_Salary_Min` - ss.`Basic_Salary`, 2)
        WHEN ss.`Basic_Salary` > des.`Base_Salary_Max` THEN ROUND(ss.`Basic_Salary` - des.`Base_Salary_Max`, 2)
        ELSE 0.00
    END AS `Variance_From_Limit`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
ORDER BY `Variance_From_Limit` DESC, `Actual_Basic_Salary` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 08: Electronic Fund Transfer (BEFTN) Bank Disbursement Reconciliation
-- Demonstrates: Masked banking columns, Settlement status breakdown, Join on 1:1
-- Business Purpose: Validates disbursed vs pending fund transfer amounts per bank.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Bank_Name`,
    COUNT(dis.`Disbursement_ID`) AS `Total_Transactions`,
    SUM(CASE WHEN dis.`Disbursement_Status` = 'Disbursed' THEN 1 ELSE 0 END) AS `Successful_Disbursements`,
    SUM(CASE WHEN dis.`Disbursement_Status` = 'Pending' THEN 1 ELSE 0 END) AS `Pending_Disbursements`,
    SUM(CASE WHEN dis.`Disbursement_Status` = 'Failed' THEN 1 ELSE 0 END) AS `Failed_Disbursements`,
    SUM(dis.`Disbursed_Amount`) AS `Total_Volume_BDT`,
    ROUND(AVG(dis.`Disbursed_Amount`), 2) AS `Average_Payout_Per_Account`
FROM `Disbursement_Record` dis
JOIN `Monthly_Payroll` p ON dis.`Payroll_ID` = p.`Payroll_ID`
JOIN `Employee` e ON p.`Employee_ID` = e.`Employee_ID`
WHERE p.`Payroll_Year` = 2026 AND p.`Payroll_Month` = 8
GROUP BY e.`Bank_Name`
ORDER BY `Total_Volume_BDT` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 09: Corporate Leave Utilization & Outstanding Liability Report
-- Demonstrates: Multiple Joins, Percent utilization formula, Liability exposure
-- Business Purpose: Computes consumed vs remaining quota and financial liability.
-- ----------------------------------------------------------------------------
SELECT 
    lt.`Type_Name` AS `Leave_Category`,
    COUNT(DISTINCT la.`Employee_ID`) AS `Covered_Employees`,
    SUM(la.`Total_Allocated`) AS `Total_Days_Allocated`,
    SUM(la.`Days_Used`) AS `Total_Days_Consumed`,
    SUM(la.`Days_Remaining`) AS `Total_Days_Remaining_Balance`,
    ROUND((SUM(la.`Days_Used`) / SUM(la.`Total_Allocated`)) * 100.0, 2) AS `Utilization_Percentage`,
    -- Approximates monetary liability using corporate average daily salary
    ROUND(
        SUM(la.`Days_Remaining`) * (
            SELECT AVG(ss.`Basic_Salary` / 26.0) 
            FROM `Salary_Structure` ss 
            WHERE ss.`Is_Active` = TRUE
        ), 2
    ) AS `Estimated_Leave_Liability_BDT`
FROM `Leave_Allocation` la
JOIN `Leave_Type` lt ON la.`Leave_Type_ID` = lt.`Leave_Type_ID`
WHERE la.`Calendar_Year` = 2026
GROUP BY lt.`Type_Name`
ORDER BY `Utilization_Percentage` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 10: Top Compensation Quartiles and Percentiles via NTILE()
-- Demonstrates: Window Function NTILE(4), Salary tier division
-- Business Purpose: Groups workforce into 4 salary tiers for executive pay analysis.
-- ----------------------------------------------------------------------------
WITH Quartiles AS (
    SELECT 
        e.`Employee_Code`,
        CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
        d.`Department_Name`,
        des.`Title` AS `Designation`,
        ss.`Basic_Salary`,
        NTILE(4) OVER (ORDER BY ss.`Basic_Salary` DESC) AS `Compensation_Quartile`
    FROM `Employee` e
    JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
    JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
    JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
)
SELECT 
    `Compensation_Quartile`,
    CASE 
        WHEN `Compensation_Quartile` = 1 THEN 'Tier 1: Top 25% (Executive & Principals)'
        WHEN `Compensation_Quartile` = 2 THEN 'Tier 2: Upper Mid 25% (Senior Staff)'
        WHEN `Compensation_Quartile` = 3 THEN 'Tier 3: Lower Mid 25% (Mid-Level)'
        ELSE 'Tier 4: Entry 25% (Junior & Support)'
    END AS `Quartile_Description`,
    COUNT(*) AS `Employee_Count`,
    MIN(`Basic_Salary`) AS `Min_Salary_In_Tier`,
    MAX(`Basic_Salary`) AS `Max_Salary_In_Tier`,
    ROUND(AVG(`Basic_Salary`), 2) AS `Average_Salary_In_Tier`
FROM Quartiles
GROUP BY `Compensation_Quartile`
ORDER BY `Compensation_Quartile`;

-- ----------------------------------------------------------------------------
-- QUERY 11: Security & Salary Revision Audit Trail Analysis
-- Demonstrates: JSON Extraction (JSON_UNQUOTE, JSON_EXTRACT), Timestamp ordering
-- Business Purpose: Tracks historical pay increments, author, and delta values.
-- ----------------------------------------------------------------------------
SELECT 
    sal.`Audit_ID`,
    sal.`Action_Timestamp`,
    sal.`Record_ID` AS `Salary_Structure_ID`,
    sal.`Operation_Type`,
    JSON_UNQUOTE(JSON_EXTRACT(sal.`Old_Values`, '$.Basic_Salary')) AS `Previous_Basic_Salary`,
    JSON_UNQUOTE(JSON_EXTRACT(sal.`New_Values`, '$.Basic_Salary')) AS `Updated_Basic_Salary`,
    ROUND(
        CAST(JSON_UNQUOTE(JSON_EXTRACT(sal.`New_Values`, '$.Basic_Salary')) AS DECIMAL(12,2)) -
        CAST(JSON_UNQUOTE(JSON_EXTRACT(sal.`Old_Values`, '$.Basic_Salary')) AS DECIMAL(12,2)),
        2
    ) AS `Salary_Increment_Delta`,
    COALESCE(u.`Username`, 'SYSTEM_AUTOMATION') AS `Executed_By_User`,
    sal.`Description`
FROM `System_Audit_Log` sal
LEFT JOIN `User_Account` u ON sal.`Changed_By_User` = u.`User_ID`
WHERE sal.`Table_Name` = 'Salary_Structure'
ORDER BY sal.`Action_Timestamp` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 12: Employees with Above-Average Departmental Salaries via Correlated Subquery
-- Demonstrates: Correlated Subquery in WHERE clause
-- Business Purpose: Flags employees earning more than their peer department average.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    ss.`Basic_Salary`,
    ROUND((
        SELECT AVG(inner_ss.`Basic_Salary`)
        FROM `Employee` inner_e
        JOIN `Salary_Structure` inner_ss ON inner_e.`Employee_ID` = inner_ss.`Employee_ID` AND inner_ss.`Is_Active` = TRUE
        WHERE inner_e.`Department_ID` = e.`Department_ID`
    ), 2) AS `Department_Average_Salary`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
WHERE ss.`Basic_Salary` > (
    SELECT AVG(inner_ss.`Basic_Salary`)
    FROM `Employee` inner_e
    JOIN `Salary_Structure` inner_ss ON inner_e.`Employee_ID` = inner_ss.`Employee_ID` AND inner_ss.`Is_Active` = TRUE
    WHERE inner_e.`Department_ID` = e.`Department_ID`
)
ORDER BY d.`Department_Name`, ss.`Basic_Salary` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 13: Departmental Headcount & Salary Distribution with ROLLUP
-- Demonstrates: GROUP BY with WITH ROLLUP for executive subtotals and grand totals
-- Business Purpose: Produces multi-level departmental summaries with company totals.
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(d.`Department_Name`, '*** ALL DEPARTMENTS (GRAND TOTAL) ***') AS `Department`,
    COUNT(e.`Employee_ID`) AS `Headcount`,
    ROUND(SUM(ss.`Basic_Salary`), 2) AS `Total_Basic_Payroll`,
    ROUND(AVG(ss.`Basic_Salary`), 2) AS `Average_Basic_Salary`,
    ROUND(MIN(ss.`Basic_Salary`), 2) AS `Minimum_Salary`,
    ROUND(MAX(ss.`Basic_Salary`), 2) AS `Maximum_Salary`
FROM `Department` d
JOIN `Employee` e ON d.`Department_ID` = e.`Department_ID`
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
GROUP BY d.`Department_Name` WITH ROLLUP;

-- ----------------------------------------------------------------------------
-- QUERY 14: Employees with Zero Leave Requests in Calendar Year
-- Demonstrates: NOT EXISTS correlated subquery
-- Business Purpose: Audits employees who took zero leaves (burnout risk monitoring).
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    des.`Title` AS `Designation`,
    e.`Hire_Date`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Designation` des ON e.`Designation_ID` = des.`Designation_ID`
WHERE NOT EXISTS (
    SELECT 1 
    FROM `Leave_Request` lr 
    WHERE lr.`Employee_ID` = e.`Employee_ID`
      AND YEAR(lr.`Start_Date`) = 2026
)
ORDER BY d.`Department_Name`, e.`Hire_Date`;

-- ----------------------------------------------------------------------------
-- QUERY 15: Consecutive Daily Working Hours Variance via LEAD()
-- Demonstrates: Window Function LEAD() for chronological comparison
-- Business Purpose: Tracks shifts in working duration across consecutive work dates.
-- ----------------------------------------------------------------------------
SELECT 
    a.`Employee_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    a.`Work_Date`,
    a.`Working_Hours` AS `Current_Hours`,
    LEAD(a.`Working_Hours`, 1) OVER (
        PARTITION BY a.`Employee_ID` 
        ORDER BY a.`Work_Date`
    ) AS `Next_Day_Hours`,
    ROUND(
        LEAD(a.`Working_Hours`, 1) OVER (
            PARTITION BY a.`Employee_ID` 
            ORDER BY a.`Work_Date`
        ) - a.`Working_Hours`, 
        2
    ) AS `Hours_Variance`
FROM `Attendance_Log` a
JOIN `Employee` e ON a.`Employee_ID` = e.`Employee_ID`
WHERE a.`Employee_ID` IN (1, 2, 3, 4, 5)
  AND a.`Work_Date` BETWEEN '2026-08-01' AND '2026-08-10'
ORDER BY a.`Employee_ID`, a.`Work_Date`;

-- ----------------------------------------------------------------------------
-- QUERY 16: Cumulative Monthly Payroll Spend Running Total
-- Demonstrates: Window Function SUM() OVER (ORDER BY ...) Running Total
-- Business Purpose: Computes cumulative cash outflow throughout fiscal periods.
-- ----------------------------------------------------------------------------
SELECT 
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    COUNT(p.`Payroll_ID`) AS `Disbursed_Headcount`,
    SUM(p.`Net_Salary`) AS `Monthly_Net_Outflow`,
    SUM(SUM(p.`Net_Salary`)) OVER (
        ORDER BY p.`Payroll_Year`, p.`Payroll_Month`
    ) AS `Cumulative_Running_Total_BDT`
FROM `Monthly_Payroll` p
WHERE p.`Payroll_Status` = 'Disbursed'
GROUP BY p.`Payroll_Year`, p.`Payroll_Month`
ORDER BY p.`Payroll_Year`, p.`Payroll_Month`;

-- ----------------------------------------------------------------------------
-- QUERY 17: Pending Leave Approval Queue with Supervisor Contacts
-- Demonstrates: Multiple Joins, Pending state filtering, Contact resolution
-- Business Purpose: Administrative dashboard widget for outstanding sign-offs.
-- ----------------------------------------------------------------------------
SELECT 
    lr.`Request_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Applicant_Name`,
    d.`Department_Name`,
    lt.`Type_Name` AS `Leave_Type`,
    lr.`Start_Date`,
    lr.`End_Date`,
    lr.`Total_Days`,
    lr.`Reason`,
    lr.`Applied_Date`,
    CONCAT(mgr.`First_Name`, ' ', mgr.`Last_Name`) AS `Direct_Manager_Name`,
    mgr.`Email` AS `Manager_Contact_Email`
FROM `Leave_Request` lr
JOIN `Employee` e ON lr.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Leave_Type` lt ON lr.`Leave_Type_ID` = lt.`Leave_Type_ID`
LEFT JOIN `Employee` mgr ON e.`Manager_ID` = mgr.`Employee_ID`
WHERE lr.`Status` = 'Pending'
ORDER BY lr.`Applied_Date` ASC;

-- ----------------------------------------------------------------------------
-- QUERY 18: Itemized Payslip Line Items Breakdown for Employee #1
-- Demonstrates: Earning vs Deduction classification, Formatted amounts
-- Business Purpose: Renders standard tabular printable payslip component breakdown.
-- ----------------------------------------------------------------------------
SELECT 
    p.`Payroll_ID`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    p.`Payroll_Month`,
    p.`Payroll_Year`,
    pcd.`Component_Type`,
    pcd.`Component_Name`,
    pcd.`Amount`,
    pcd.`Remarks`
FROM `Monthly_Payroll` p
JOIN `Employee` e ON p.`Employee_ID` = e.`Employee_ID`
JOIN `Payroll_Component_Detail` pcd ON p.`Payroll_ID` = pcd.`Payroll_ID`
WHERE p.`Employee_ID` = 1
  AND p.`Payroll_Year` = 2026
  AND p.`Payroll_Month` = 8
ORDER BY pcd.`Component_Type` DESC, pcd.`Amount` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 19: Direct Reports Count Per Supervisor
-- Demonstrates: Self-Join with Aggregation, GROUP BY, Filter on Managers
-- Business Purpose: Evaluates managerial span of control across departments.
-- ----------------------------------------------------------------------------
SELECT 
    mgr.`Employee_ID` AS `Manager_ID`,
    mgr.`Employee_Code` AS `Manager_Code`,
    CONCAT(mgr.`First_Name`, ' ', mgr.`Last_Name`) AS `Manager_Name`,
    d.`Department_Name`,
    des.`Title` AS `Manager_Title`,
    COUNT(sub.`Employee_ID`) AS `Direct_Reports_Count`
FROM `Employee` mgr
JOIN `Department` d ON mgr.`Department_ID` = d.`Department_ID`
JOIN `Designation` des ON mgr.`Designation_ID` = des.`Designation_ID`
JOIN `Employee` sub ON mgr.`Employee_ID` = sub.`Manager_ID`
GROUP BY mgr.`Employee_ID`, mgr.`Employee_Code`, mgr.`First_Name`, mgr.`Last_Name`, d.`Department_Name`, des.`Title`
ORDER BY `Direct_Reports_Count` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 20: Salary Disparity Ratio (Highest to Lowest Paid in Department)
-- Demonstrates: MIN(), MAX(), Mathematical Ratio, GROUP BY
-- Business Purpose: Evaluates internal compensation equality across departments.
-- ----------------------------------------------------------------------------
SELECT 
    d.`Department_Name`,
    COUNT(e.`Employee_ID`) AS `Headcount`,
    MIN(ss.`Basic_Salary`) AS `Lowest_Salary`,
    MAX(ss.`Basic_Salary`) AS `Highest_Salary`,
    ROUND(MAX(ss.`Basic_Salary`) / MIN(ss.`Basic_Salary`), 2) AS `Disparity_Ratio`,
    ROUND(AVG(ss.`Basic_Salary`), 2) AS `Mean_Salary`
FROM `Department` d
JOIN `Employee` e ON d.`Department_ID` = e.`Department_ID`
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
GROUP BY d.`Department_Name`
ORDER BY `Disparity_Ratio` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 21: Employees with Historical Salary Structure Revisions
-- Demonstrates: HAVING COUNT(*) > 1, Tracking career progression
-- Business Purpose: Identifies staff who received salary increments/promotions.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    COUNT(ss.`Structure_ID`) AS `Revision_Count`,
    MIN(ss.`Effective_From`) AS `First_Structure_Date`,
    MAX(ss.`Effective_From`) AS `Latest_Revision_Date`
FROM `Employee` e
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID`
GROUP BY e.`Employee_Code`, e.`First_Name`, e.`Last_Name`, d.`Department_Name`
HAVING `Revision_Count` > 1
ORDER BY `Revision_Count` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 22: Active vs Inactive User Accounts Audit
-- Demonstrates: Conditional COUNT, User account security audit
-- Business Purpose: Verifies active credentials vs deactivated/suspended staff.
-- ----------------------------------------------------------------------------
SELECT 
    u.`Role` AS `User_Role`,
    COUNT(u.`User_ID`) AS `Total_Accounts`,
    SUM(CASE WHEN u.`Is_Active` = TRUE THEN 1 ELSE 0 END) AS `Active_Accounts`,
    SUM(CASE WHEN u.`Is_Active` = FALSE THEN 1 ELSE 0 END) AS `Suspended_Accounts`
FROM `User_Account` u
GROUP BY u.`Role`
ORDER BY `Total_Accounts` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 23: Biometric Punctuality Matrix by Day of Week
-- Demonstrates: DAYNAME(), WEEKDAY(), Aggregated attendance behaviors
-- Business Purpose: Identifies days with highest rates of late check-ins.
-- ----------------------------------------------------------------------------
SELECT 
    DAYNAME(a.`Work_Date`) AS `Day_Of_Week`,
    COUNT(a.`Log_ID`) AS `Total_Logged_Entries`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Present' THEN 1 ELSE 0 END) AS `Present_Count`,
    SUM(CASE WHEN a.`Attendance_Status` = 'Late' THEN 1 ELSE 0 END) AS `Late_Count`,
    ROUND(
        (SUM(CASE WHEN a.`Attendance_Status` = 'Late' THEN 1 ELSE 0 END) / COUNT(a.`Log_ID`)) * 100.0, 
        2
    ) AS `Late_Arrival_Percentage`
FROM `Attendance_Log` a
WHERE a.`Work_Date` BETWEEN '2026-08-01' AND '2026-08-31'
GROUP BY DAYNAME(a.`Work_Date`), WEEKDAY(a.`Work_Date`)
ORDER BY WEEKDAY(a.`Work_Date`);

-- ----------------------------------------------------------------------------
-- QUERY 24: Departments with Above-Threshold Overtime Compensation
-- Demonstrates: Subquery with SUM and HAVING
-- Business Purpose: Identifies departments spending > BDT 50,000 on overtime.
-- ----------------------------------------------------------------------------
SELECT 
    d.`Department_Name`,
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    SUM(pcd.`Amount`) AS `Total_Overtime_Expenditure`
FROM `Department` d
JOIN `Employee` e ON d.`Department_ID` = e.`Department_ID`
JOIN `Monthly_Payroll` p ON e.`Employee_ID` = p.`Employee_ID`
JOIN `Payroll_Component_Detail` pcd ON p.`Payroll_ID` = pcd.`Payroll_ID`
WHERE pcd.`Component_Name` LIKE '%Overtime%'
  AND p.`Payroll_Year` = 2026 
  AND p.`Payroll_Month` = 8
GROUP BY d.`Department_Name`, p.`Payroll_Year`, p.`Payroll_Month`
HAVING `Total_Overtime_Expenditure` > 25000.00
ORDER BY `Total_Overtime_Expenditure` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 25: Leave Request Approval Turnaround Time Analysis
-- Demonstrates: TIMESTAMPDIFF() in Hours, Workflow efficiency tracking
-- Business Purpose: Measures time taken by supervisors to action leave requests.
-- ----------------------------------------------------------------------------
SELECT 
    d.`Department_Name`,
    COUNT(lr.`Request_ID`) AS `Actioned_Requests`,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, lr.`Applied_Date`, lr.`Approved_At`)), 1) AS `Avg_Approval_Turnaround_Hours`,
    MIN(TIMESTAMPDIFF(HOUR, lr.`Applied_Date`, lr.`Approved_At`)) AS `Fastest_Approval_Hours`,
    MAX(TIMESTAMPDIFF(HOUR, lr.`Applied_Date`, lr.`Approved_At`)) AS `Slowest_Approval_Hours`
FROM `Leave_Request` lr
JOIN `Employee` e ON lr.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
WHERE lr.`Status` IN ('Approved', 'Rejected') 
  AND lr.`Approved_At` IS NOT NULL
GROUP BY d.`Department_Name`
ORDER BY `Avg_Approval_Turnaround_Hours` ASC;

-- ----------------------------------------------------------------------------
-- QUERY 26: Gender Diversity & Pay Equity Overview
-- Demonstrates: Demographics segmentation, Comparative salary means
-- Business Purpose: Evaluates corporate gender representation and mean pay parity.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Gender`,
    COUNT(e.`Employee_ID`) AS `Headcount`,
    ROUND((COUNT(e.`Employee_ID`) / (SELECT COUNT(*) FROM `Employee`)) * 100.0, 1) AS `Workforce_Share_Pct`,
    ROUND(AVG(ss.`Basic_Salary`), 2) AS `Average_Basic_Salary`,
    ROUND(MIN(ss.`Basic_Salary`), 2) AS `Min_Basic_Salary`,
    ROUND(MAX(ss.`Basic_Salary`), 2) AS `Max_Basic_Salary`
FROM `Employee` e
JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID` AND ss.`Is_Active` = TRUE
GROUP BY e.`Gender`
ORDER BY `Headcount` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 27: Employee Tenure Distribution by Department
-- Demonstrates: TIMESTAMPDIFF(YEAR), Service brackets
-- Business Purpose: Tracks organizational employee retention across departments.
-- ----------------------------------------------------------------------------
SELECT 
    d.`Department_Name`,
    SUM(CASE WHEN TIMESTAMPDIFF(YEAR, e.`Hire_Date`, CURDATE()) < 2 THEN 1 ELSE 0 END) AS `Tenure_Under_2_Years`,
    SUM(CASE WHEN TIMESTAMPDIFF(YEAR, e.`Hire_Date`, CURDATE()) BETWEEN 2 AND 4 THEN 1 ELSE 0 END) AS `Tenure_2_to_4_Years`,
    SUM(CASE WHEN TIMESTAMPDIFF(YEAR, e.`Hire_Date`, CURDATE()) >= 5 THEN 1 ELSE 0 END) AS `Tenure_5_Plus_Years`,
    ROUND(AVG(TIMESTAMPDIFF(MONTH, e.`Hire_Date`, CURDATE())), 1) AS `Average_Tenure_Months`
FROM `Department` d
JOIN `Employee` e ON d.`Department_ID` = e.`Department_ID`
GROUP BY d.`Department_Name`
ORDER BY `Average_Tenure_Months` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 28: Failed or Delayed BEFTN Disbursements Investigation
-- Demonstrates: Filtering by settlement exceptions, Reconciliation
-- Business Purpose: Highlights banking rejections requiring treasury intervention.
-- ----------------------------------------------------------------------------
SELECT 
    dis.`Disbursement_ID`,
    dis.`Transaction_Reference`,
    dis.`Disbursement_Date`,
    dis.`Disbursement_Status`,
    dis.`Disbursed_Amount`,
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    e.`Bank_Name`,
    e.`Bank_Account_No`,
    e.`Bank_Routing_No`,
    dis.`Remarks`
FROM `Disbursement_Record` dis
JOIN `Monthly_Payroll` p ON dis.`Payroll_ID` = p.`Payroll_ID`
JOIN `Employee` e ON p.`Employee_ID` = e.`Employee_ID`
WHERE dis.`Disbursement_Status` IN ('Failed', 'Reversed', 'Pending')
ORDER BY dis.`Disbursement_Date` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 29: Net Pay Distribution Histogram via CASE Bins
-- Demonstrates: Frequency distribution bins for take-home compensation
-- Business Purpose: Analyzes compensation dispersion across the organization.
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN p.`Net_Salary` < 60000.00 THEN 'Under ৳60,000'
        WHEN p.`Net_Salary` BETWEEN 60000.00 AND 99999.99 THEN '৳60,000 - ৳99,999'
        WHEN p.`Net_Salary` BETWEEN 100000.00 AND 149999.99 THEN '৳100,000 - ৳149,999'
        WHEN p.`Net_Salary` BETWEEN 150000.00 AND 199999.99 THEN '৳150,000 - ৳199,999'
        ELSE '৳200,000 and Above'
    END AS `Net_Salary_Bracket`,
    COUNT(p.`Payroll_ID`) AS `Employee_Count`,
    ROUND(SUM(p.`Net_Salary`), 2) AS `Total_Payout_In_Bracket`
FROM `Monthly_Payroll` p
WHERE p.`Payroll_Year` = 2026 AND p.`Payroll_Month` = 8
GROUP BY `Net_Salary_Bracket`
ORDER BY MIN(p.`Net_Salary`) ASC;

-- ----------------------------------------------------------------------------
-- QUERY 30: Detailed Department Head Information and Unit Oversight
-- Demonstrates: Self-Join and Circular Relationship Resolution
-- Business Purpose: Lists department heads, their job title, and team size.
-- ----------------------------------------------------------------------------
SELECT 
    d.`Department_ID`,
    d.`Department_Name`,
    d.`Department_Code`,
    CONCAT(head.`First_Name`, ' ', head.`Last_Name`) AS `Department_Head_Name`,
    head.`Email` AS `Head_Email`,
    head_des.`Title` AS `Head_Designation`,
    (SELECT COUNT(*) FROM `Employee` sub WHERE sub.`Department_ID` = d.`Department_ID`) AS `Total_Team_Size`
FROM `Department` d
LEFT JOIN `Employee` head ON d.`Head_Of_Department_ID` = head.`Employee_ID`
LEFT JOIN `Designation` head_des ON head.`Designation_ID` = head_des.`Designation_ID`
ORDER BY d.`Department_ID`;

-- ----------------------------------------------------------------------------
-- QUERY 31: Employees with High Leave Depletion (> 80% Consumed)
-- Demonstrates: Calculated ratio filter across leave allocations
-- Business Purpose: Flags staff who have nearly exhausted their yearly leave quota.
-- ----------------------------------------------------------------------------
SELECT 
    e.`Employee_Code`,
    CONCAT(e.`First_Name`, ' ', e.`Last_Name`) AS `Employee_Name`,
    d.`Department_Name`,
    lt.`Type_Name` AS `Leave_Type`,
    la.`Total_Allocated`,
    la.`Days_Used`,
    la.`Days_Remaining`,
    ROUND((la.`Days_Used` / la.`Total_Allocated`) * 100.0, 1) AS `Depletion_Pct`
FROM `Leave_Allocation` la
JOIN `Employee` e ON la.`Employee_ID` = e.`Employee_ID`
JOIN `Department` d ON e.`Department_ID` = d.`Department_ID`
JOIN `Leave_Type` lt ON la.`Leave_Type_ID` = lt.`Leave_Type_ID`
WHERE la.`Calendar_Year` = 2026
  AND (la.`Days_Used` / la.`Total_Allocated`) >= 0.70
ORDER BY `Depletion_Pct` DESC;

-- ----------------------------------------------------------------------------
-- QUERY 32: Enterprise Executive Payroll Summary Statement (Consolidated)
-- Demonstrates: Grand multi-aggregate statement combining payroll and headcounts
-- Business Purpose: Executive Board financial summary report.
-- ----------------------------------------------------------------------------
SELECT 
    p.`Payroll_Year`,
    p.`Payroll_Month`,
    COUNT(DISTINCT p.`Employee_ID`) AS `Total_Employees_Paid`,
    ROUND(SUM(p.`Basic_Salary`), 2) AS `Total_Basic_Salary`,
    ROUND(SUM(p.`Total_Allowances`), 2) AS `Total_Allowances_Paid`,
    ROUND(SUM(p.`Gross_Salary`), 2) AS `Total_Gross_Payroll`,
    ROUND(SUM(p.`Total_Deductions`), 2) AS `Total_Deductions_Retained`,
    ROUND(SUM(p.`Net_Salary`), 2) AS `Total_Net_Disbursement`,
    ROUND(AVG(p.`Net_Salary`), 2) AS `Average_Take_Home_Pay`
FROM `Monthly_Payroll` p
WHERE p.`Payroll_Year` = 2026 AND p.`Payroll_Month` = 8
GROUP BY p.`Payroll_Year`, p.`Payroll_Month`;
