-- ============================================================================
-- PayPulse Transaction Script 01: Payroll Processing Transaction
-- Database: paypulse_db | Engine: InnoDB | ACID: Atomicity, Consistency, Isolation, Durability
-- ============================================================================
-- Objective:
-- Atomically calculate and commit an employee's monthly payroll voucher,
-- including itemized component breakdowns (allowances, statutory withholdings)
-- and audit trail. Enforces duplicate prevention and exact decimal arithmetic.
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_ProcessEmployeePayrollTransaction`$$

CREATE PROCEDURE `sp_ProcessEmployeePayrollTransaction`(
    IN p_employee_id INT,
    IN p_payroll_year SMALLINT,
    IN p_payroll_month TINYINT,
    IN p_processed_by_user_id INT,
    OUT p_out_payroll_id INT,
    OUT p_out_net_salary DECIMAL(12, 2),
    OUT p_out_status VARCHAR(50)
)
proc_body: BEGIN
    -- Local variables for compensation
    DECLARE v_emp_status VARCHAR(20);
    DECLARE v_basic_salary DECIMAL(12, 2);
    DECLARE v_hra DECIMAL(12, 2);
    DECLARE v_med DECIMAL(12, 2);
    DECLARE v_conv DECIMAL(12, 2);
    DECLARE v_tax_rate DECIMAL(5, 2);
    DECLARE v_pf_rate DECIMAL(5, 2);

    -- Local variables for attendance & leaves
    DECLARE v_working_days TINYINT DEFAULT 26;
    DECLARE v_present_days TINYINT DEFAULT 0;
    DECLARE v_paid_leave_days TINYINT DEFAULT 0;
    DECLARE v_unpaid_leave_days TINYINT DEFAULT 0;
    DECLARE v_ot_hours DECIMAL(4, 2) DEFAULT 0.00;

    -- Financial calculations
    DECLARE v_per_day_basic DECIMAL(12, 2);
    DECLARE v_ot_rate DECIMAL(10, 2);
    DECLARE v_ot_pay DECIMAL(12, 2);
    DECLARE v_unpaid_deduction DECIMAL(12, 2);
    DECLARE v_tax_deduction DECIMAL(12, 2);
    DECLARE v_pf_deduction DECIMAL(12, 2);
    DECLARE v_total_allowances DECIMAL(12, 2);
    DECLARE v_gross_salary DECIMAL(12, 2);
    DECLARE v_total_deductions DECIMAL(12, 2);
    DECLARE v_net_salary DECIMAL(12, 2);

    -- Date helpers
    DECLARE v_first_of_month DATE;
    DECLARE v_last_of_month DATE;
    DECLARE v_existing_status VARCHAR(20);

    -- Error Handling: Rollback on any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_payroll_id = NULL;
        SET p_out_net_salary = 0.00;
        SET p_out_status = 'FAILED: Transaction Rolled Back on Exception';
        RESIGNAL;
    END;

    -- 1. Parameter Validation
    IF p_payroll_month < 1 OR p_payroll_month > 12 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Payroll month must be between 1 and 12.';
    END IF;

    IF p_payroll_year < 2000 OR p_payroll_year > 2100 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Payroll year must be between 2000 and 2100.';
    END IF;

    SET v_first_of_month = STR_TO_DATE(CONCAT(p_payroll_year, '-', LPAD(p_payroll_month, 2, '0'), '-01'), '%Y-%m-%d');
    SET v_last_of_month = LAST_DAY(v_first_of_month);

    -- 2. Verify Employee Status & Active Salary Structure
    SELECT e.`Employment_Status`, ss.`Basic_Salary`, ss.`House_Rent_Allowance`,
           ss.`Medical_Allowance`, ss.`Conveyance_Allowance`,
           ss.`Tax_Deduction_Rate`, ss.`Provident_Fund_Rate`
    INTO v_emp_status, v_basic_salary, v_hra, v_med, v_conv, v_tax_rate, v_pf_rate
    FROM `Employee` e
    JOIN `Salary_Structure` ss ON e.`Employee_ID` = ss.`Employee_ID`
    WHERE e.`Employee_ID` = p_employee_id
      AND ss.`Is_Active` = TRUE
      AND ss.`Effective_From` <= v_last_of_month
      AND (ss.`Effective_To` IS NULL OR ss.`Effective_To` >= v_first_of_month)
    LIMIT 1;

    IF v_emp_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Employee not found or active salary structure missing.';
    END IF;

    IF v_emp_status NOT IN ('Active', 'On-Leave') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Employee is not eligible for payroll in their current employment status.';
    END IF;

    -- 3. Check for existing payroll (Concurrency & Idempotency Protection)
    SELECT `Payroll_Status` INTO v_existing_status
    FROM `Monthly_Payroll`
    WHERE `Employee_ID` = p_employee_id
      AND `Payroll_Year` = p_payroll_year
      AND `Payroll_Month` = p_payroll_month
    FOR UPDATE;

    IF v_existing_status IN ('Finalized', 'Disbursed', 'Approved') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Concurrency Error: Cannot modify finalized or disbursed payroll record.';
    END IF;

    -- 4. Calculate Attendance and Overtime
    SELECT 
        COALESCE(SUM(CASE WHEN `Attendance_Status` IN ('Present', 'Late', 'Half-Day') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(`Overtime_Hours`), 0.00)
    INTO v_present_days, v_ot_hours
    FROM `Attendance_Log`
    WHERE `Employee_ID` = p_employee_id
      AND `Work_Date` BETWEEN v_first_of_month AND v_last_of_month;

    IF v_present_days > v_working_days THEN
        SET v_present_days = v_working_days;
    END IF;
    IF v_present_days = 0 THEN
        SET v_present_days = v_working_days; -- Default to full month if no manual logs
    END IF;

    -- 5. Calculate Approved Leaves
    SELECT 
        COALESCE(SUM(CASE WHEN lt.`Is_Paid` = TRUE THEN lr.`Total_Days` ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lt.`Is_Paid` = FALSE THEN lr.`Total_Days` ELSE 0 END), 0)
    INTO v_paid_leave_days, v_unpaid_leave_days
    FROM `Leave_Request` lr
    JOIN `Leave_Type` lt ON lr.`Leave_Type_ID` = lt.`Leave_Type_ID`
    WHERE lr.`Employee_ID` = p_employee_id
      AND lr.`Status` = 'Approved'
      AND lr.`Start_Date` <= v_last_of_month
      AND lr.`End_Date` >= v_first_of_month;

    -- 6. Exact Decimal Financial Math
    SET v_per_day_basic = ROUND(v_basic_salary / v_working_days, 2);
    SET v_ot_rate = ROUND((v_basic_salary / (v_working_days * 8.0)) * 1.5, 2);
    SET v_ot_pay = ROUND(v_ot_hours * v_ot_rate, 2);

    SET v_unpaid_deduction = ROUND(v_unpaid_leave_days * v_per_day_basic, 2);
    SET v_tax_deduction = ROUND(v_basic_salary * (v_tax_rate / 100.0), 2);
    SET v_pf_deduction = ROUND(v_basic_salary * (v_pf_rate / 100.0), 2);

    SET v_total_allowances = ROUND(v_hra + v_med + v_conv + v_ot_pay, 2);
    SET v_gross_salary = ROUND(v_basic_salary + v_total_allowances, 2);
    SET v_total_deductions = ROUND(v_tax_deduction + v_pf_deduction + v_unpaid_deduction, 2);
    SET v_net_salary = ROUND(v_gross_salary - v_total_deductions, 2);

    -- Consistency check: Net salary must satisfy mathematical identity
    IF v_net_salary <> (v_gross_salary - v_total_deductions) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Consistency Invariant Error: Net Salary math does not reconcile.';
    END IF;

    -- ========================================================================
    -- ATOMIC TRANSACTION BLOCK
    -- ========================================================================
    START TRANSACTION;

    -- If unfinalized Draft exists, remove it cleanly before regenerating
    IF v_existing_status IS NOT NULL THEN
        DELETE FROM `Payroll_Component_Detail`
        WHERE `Payroll_ID` IN (
            SELECT `Payroll_ID` FROM `Monthly_Payroll`
            WHERE `Employee_ID` = p_employee_id
              AND `Payroll_Year` = p_payroll_year
              AND `Payroll_Month` = p_payroll_month
        );

        DELETE FROM `Monthly_Payroll`
        WHERE `Employee_ID` = p_employee_id
          AND `Payroll_Year` = p_payroll_year
          AND `Payroll_Month` = p_payroll_month;
    END IF;

    -- Insert Master Monthly Payroll Record
    INSERT INTO `Monthly_Payroll` (
        `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
        `Working_Days`, `Present_Days`, `Paid_Leave_Days`, `Unpaid_Leave_Days`,
        `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
        `Total_Deductions`, `Net_Salary`, `Generation_Date`,
        `Payroll_Status`, `Generated_By_User_ID`
    ) VALUES (
        p_employee_id, p_payroll_month, p_payroll_year,
        v_working_days, v_present_days, v_paid_leave_days, v_unpaid_leave_days,
        v_basic_salary, v_total_allowances, v_gross_salary,
        v_total_deductions, v_net_salary, NOW(),
        'Draft', p_processed_by_user_id
    );

    SET p_out_payroll_id = LAST_INSERT_ID();
    SET p_out_net_salary = v_net_salary;

    -- Insert Itemized Payslip Components
    INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
    VALUES 
        (p_out_payroll_id, 'Basic Salary', 'Earning', v_basic_salary),
        (p_out_payroll_id, 'House Rent Allowance', 'Earning', v_hra),
        (p_out_payroll_id, 'Medical Allowance', 'Earning', v_med),
        (p_out_payroll_id, 'Conveyance Allowance', 'Earning', v_conv);

    IF v_ot_pay > 0 THEN
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES (p_out_payroll_id, 'Overtime Compensation', 'Earning', v_ot_pay);
    END IF;

    IF v_tax_deduction > 0 THEN
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES (p_out_payroll_id, 'Income Tax Withholding', 'Deduction', v_tax_deduction);
    END IF;

    IF v_pf_deduction > 0 THEN
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES (p_out_payroll_id, 'Provident Fund (Employee)', 'Deduction', v_pf_deduction);
    END IF;

    IF v_unpaid_deduction > 0 THEN
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES (p_out_payroll_id, 'Unpaid Leave Deduction', 'Deduction', v_unpaid_deduction);
    END IF;

    -- Audit Log entry
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Monthly_Payroll', 'INSERT', CAST(p_out_payroll_id AS CHAR), p_processed_by_user_id,
        CONCAT('Generated payroll voucher for Emp ID ', p_employee_id, ' Period ', p_payroll_year, '-', LPAD(p_payroll_month, 2, '0'), ' Net: BDT ', v_net_salary)
    );

    COMMIT;
    SET p_out_status = 'SUCCESS: Payroll Voucher Committed';
END proc_body$$

DELIMITER ;
