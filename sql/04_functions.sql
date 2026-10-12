-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 04: User-Defined Functions (UDFs)
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Dialect: Native MySQL Deterministic and Read-Only Scalar Functions
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. Function: fn_CalculateMonthlyNetPay
-- Pure mathematical calculation of take-home net salary based on basic pay,
-- allowances, overtime hours, statutory tax/PF slabs, and unpaid leaves.
-- Marked DETERMINISTIC with NO SQL to enable optimal compiler inlining.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_CalculateMonthlyNetPay`$$
CREATE FUNCTION `fn_CalculateMonthlyNetPay`(
    p_basic_salary DECIMAL(12, 2),
    p_hra DECIMAL(12, 2),
    p_medical DECIMAL(12, 2),
    p_conveyance DECIMAL(12, 2),
    p_tax_rate DECIMAL(5, 2),
    p_pf_rate DECIMAL(5, 2),
    p_ot_hours DECIMAL(4, 2),
    p_unpaid_days INT,
    p_working_days INT
) RETURNS DECIMAL(12, 2)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_safe_work_days INT;
    DECLARE v_per_day_basic DECIMAL(12, 2);
    DECLARE v_ot_rate DECIMAL(10, 2);
    DECLARE v_ot_pay DECIMAL(12, 2);
    DECLARE v_gross DECIMAL(12, 2);
    DECLARE v_tax DECIMAL(12, 2);
    DECLARE v_pf DECIMAL(12, 2);
    DECLARE v_unpaid_deduction DECIMAL(12, 2);
    DECLARE v_net DECIMAL(12, 2);

    -- Guard against division by zero
    SET v_safe_work_days = CASE WHEN p_working_days <= 0 THEN 26 ELSE p_working_days END;
    
    SET v_per_day_basic = ROUND(p_basic_salary / v_safe_work_days, 2);
    SET v_ot_rate = ROUND((p_basic_salary / (v_safe_work_days * 8.0)) * 1.5, 2);
    SET v_ot_pay = ROUND(COALESCE(p_ot_hours, 0.00) * v_ot_rate, 2);

    SET v_gross = p_basic_salary + COALESCE(p_hra, 0.00) + COALESCE(p_medical, 0.00) + COALESCE(p_conveyance, 0.00) + v_ot_pay;

    SET v_tax = ROUND(p_basic_salary * (COALESCE(p_tax_rate, 0.00) / 100.0), 2);
    SET v_pf = ROUND(p_basic_salary * (COALESCE(p_pf_rate, 0.00) / 100.0), 2);
    SET v_unpaid_deduction = ROUND(COALESCE(p_unpaid_days, 0) * v_per_day_basic, 2);

    SET v_net = v_gross - (v_tax + v_pf + v_unpaid_deduction);

    RETURN CASE WHEN v_net < 0.00 THEN 0.00 ELSE v_net END;
END$$

-- ----------------------------------------------------------------------------
-- 2. Function: fn_GetEmployeeLeaveBalance
-- Queries real-time available remaining leave days for an employee, leave type,
-- and calendar year. Returns 0 if no allocation exists.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_GetEmployeeLeaveBalance`$$
CREATE FUNCTION `fn_GetEmployeeLeaveBalance`(
    p_employee_id INT,
    p_leave_type_id INT,
    p_calendar_year INT
) RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_remaining INT DEFAULT 0;

    SELECT COALESCE(`Days_Remaining`, 0)
    INTO v_remaining
    FROM `Leave_Allocation`
    WHERE `Employee_ID` = p_employee_id
      AND `Leave_Type_ID` = p_leave_type_id
      AND `Calendar_Year` = p_calendar_year
    LIMIT 1;

    RETURN v_remaining;
END$$

-- ----------------------------------------------------------------------------
-- 3. Function: fn_GetDepartmentMonthlyPayrollTotal
-- Computes the total net payroll expenditure for a department in a specified
-- period. Returns 0.00 if no payroll records match.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_GetDepartmentMonthlyPayrollTotal`$$
CREATE FUNCTION `fn_GetDepartmentMonthlyPayrollTotal`(
    p_department_id INT,
    p_payroll_year INT,
    p_payroll_month INT
) RETURNS DECIMAL(14, 2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(14, 2) DEFAULT 0.00;

    SELECT COALESCE(SUM(p.`Net_Salary`), 0.00)
    INTO v_total
    FROM `Monthly_Payroll` p
    JOIN `Employee` e 
        ON p.`Employee_ID` = e.`Employee_ID`
    WHERE e.`Department_ID` = p_department_id
      AND p.`Payroll_Year` = p_payroll_year
      AND p.`Payroll_Month` = p_payroll_month;

    RETURN v_total;
END$$

-- ----------------------------------------------------------------------------
-- 4. Function: fn_MaskBankAccount
-- Formats raw bank account strings for secure display (e.g. *******1234).
-- Prevents exposing customer sensitive financial identifiers in general views.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_MaskBankAccount`$$
CREATE FUNCTION `fn_MaskBankAccount`(
    p_account_no VARCHAR(50)
) RETURNS VARCHAR(50) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_clean VARCHAR(50);
    DECLARE v_len INT;

    SET v_clean = TRIM(COALESCE(p_account_no, ''));
    SET v_len = CHAR_LENGTH(v_clean);

    IF v_len <= 4 THEN
        RETURN '****';
    END IF;

    RETURN CONCAT(REPEAT('*', v_len - 4), RIGHT(v_clean, 4));
END$$

-- ----------------------------------------------------------------------------
-- 5. Function: fn_CalculateOvertimePay
-- Calculates overtime remuneration based on basic salary and hourly multiplier (1.5x).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_CalculateOvertimePay`$$
CREATE FUNCTION `fn_CalculateOvertimePay`(
    p_basic_salary DECIMAL(12, 2),
    p_working_days INT,
    p_overtime_hours DECIMAL(4, 2)
) RETURNS DECIMAL(12, 2)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_safe_days INT;
    DECLARE v_hourly_rate DECIMAL(10, 2);
    
    SET v_safe_days = CASE WHEN p_working_days <= 0 THEN 26 ELSE p_working_days END;
    SET v_hourly_rate = (p_basic_salary / (v_safe_days * 8.0)) * 1.5;
    
    RETURN ROUND(COALESCE(p_overtime_hours, 0.00) * v_hourly_rate, 2);
END$$

-- ----------------------------------------------------------------------------
-- 6. Function: fn_GetEmployeeTenureMonths
-- Returns the employee tenure in complete elapsed calendar months.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_GetEmployeeTenureMonths`$$
CREATE FUNCTION `fn_GetEmployeeTenureMonths`(
    p_employee_id INT
) RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_months INT DEFAULT 0;

    SELECT TIMESTAMPDIFF(MONTH, `Hire_Date`, CURDATE())
    INTO v_months
    FROM `Employee`
    WHERE `Employee_ID` = p_employee_id;

    RETURN COALESCE(v_months, 0);
END$$

DELIMITER ;
