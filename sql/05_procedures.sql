-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 05: Native MySQL Stored Procedures
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Implements ACID transactions, MySQL DECLARE error handlers, and validations
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. Procedure: sp_ProcessMonthlyPayrollBatch
-- Automated transactional batch execution calculating working days, attendance,
-- paid/unpaid leave, overtime compensation, allowances, statutory deductions,
-- and recording immutable financial point-in-time snapshots.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_ProcessMonthlyPayrollBatch`$$
CREATE PROCEDURE `sp_ProcessMonthlyPayrollBatch`(
    IN p_payroll_year INT,
    IN p_payroll_month INT,
    IN p_generated_by_user_id INT
)
proc_label: BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_emp_id INT;
    DECLARE v_basic_salary DECIMAL(12, 2);
    DECLARE v_hra DECIMAL(12, 2);
    DECLARE v_med DECIMAL(12, 2);
    DECLARE v_conv DECIMAL(12, 2);
    DECLARE v_tax_rate DECIMAL(5, 2);
    DECLARE v_pf_rate DECIMAL(5, 2);
    DECLARE v_working_days INT;
    DECLARE v_present_days INT;
    DECLARE v_paid_leave_days INT;
    DECLARE v_unpaid_leave_days INT;
    DECLARE v_ot_hours DECIMAL(4, 2);
    DECLARE v_ot_rate DECIMAL(10, 2);
    DECLARE v_ot_pay DECIMAL(12, 2);
    DECLARE v_per_day_basic DECIMAL(12, 2);
    DECLARE v_unpaid_deduction DECIMAL(12, 2);
    DECLARE v_tax_deduction DECIMAL(12, 2);
    DECLARE v_pf_deduction DECIMAL(12, 2);
    DECLARE v_total_allowances DECIMAL(12, 2);
    DECLARE v_gross_salary DECIMAL(12, 2);
    DECLARE v_total_deductions DECIMAL(12, 2);
    DECLARE v_net_salary DECIMAL(12, 2);
    DECLARE v_payroll_id INT;
    DECLARE v_batch_count INT DEFAULT 0;
    DECLARE v_first_of_month DATE;
    DECLARE v_last_of_month DATE;
    DECLARE v_existing_finalized INT DEFAULT 0;

    -- Cursor iterating through active employees
    DECLARE cur_employees CURSOR FOR
        SELECT 
            e.`Employee_ID`,
            ss.`Basic_Salary`,
            ss.`House_Rent_Allowance`,
            ss.`Medical_Allowance`,
            ss.`Conveyance_Allowance`,
            ss.`Tax_Deduction_Rate`,
            ss.`Provident_Fund_Rate`
        FROM `Employee` e
        JOIN `Salary_Structure` ss 
            ON e.`Employee_ID` = ss.`Employee_ID`
        WHERE e.`Employment_Status` IN ('Active', 'On-Leave')
          AND ss.`Is_Active` = TRUE
          AND ss.`Effective_From` <= v_last_of_month
          AND (ss.`Effective_To` IS NULL OR ss.`Effective_To` >= v_first_of_month);

    -- Handlers
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Input Validation
    IF p_payroll_month < 1 OR p_payroll_month > 12 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid payroll month. Must be between 1 and 12.';
    END IF;

    IF p_payroll_year < 2000 OR p_payroll_year > 2100 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid payroll year. Must be between 2000 and 2100.';
    END IF;

    SET v_first_of_month = STR_TO_DATE(CONCAT(p_payroll_year, '-', LPAD(p_payroll_month, 2, '0'), '-01'), '%Y-%m-%d');
    SET v_last_of_month = LAST_DAY(v_first_of_month);

    -- Check if payroll for this period was already Finalized or Disbursed
    SELECT COUNT(*) INTO v_existing_finalized
    FROM `Monthly_Payroll`
    WHERE `Payroll_Year` = p_payroll_year
      AND `Payroll_Month` = p_payroll_month
      AND `Payroll_Status` IN ('Finalized', 'Disbursed');

    IF v_existing_finalized > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot regenerate: Payroll for this period is already Finalized or Disbursed.';
    END IF;

    -- Begin Transaction
    START TRANSACTION;

    -- Remove any unfinalized (Draft / Generated) runs for this period to prevent duplicate conflicts
    DELETE FROM `Monthly_Payroll`
    WHERE `Payroll_Year` = p_payroll_year
      AND `Payroll_Month` = p_payroll_month
      AND `Payroll_Status` IN ('Draft', 'Generated');

    -- Standard working days for the calendar month
    SET v_working_days = 26;

    OPEN cur_employees;

    read_loop: LOOP
        FETCH cur_employees INTO 
            v_emp_id, 
            v_basic_salary, 
            v_hra, 
            v_med, 
            v_conv, 
            v_tax_rate, 
            v_pf_rate;
            
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- 1. Tally Attendance for the employee in this month
        SELECT 
            COALESCE(SUM(CASE WHEN `Attendance_Status` IN ('Present', 'Late', 'Half-Day') THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(`Overtime_Hours`), 0.00)
        INTO v_present_days, v_ot_hours
        FROM `Attendance_Log`
        WHERE `Employee_ID` = v_emp_id
          AND `Work_Date` BETWEEN v_first_of_month AND v_last_of_month;

        -- 2. Tally Paid vs Unpaid Leaves
        SELECT 
            COALESCE(SUM(CASE WHEN lt.`Is_Paid` = TRUE THEN lr.`Total_Days` ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN lt.`Is_Paid` = FALSE THEN lr.`Total_Days` ELSE 0 END), 0)
        INTO v_paid_leave_days, v_unpaid_leave_days
        FROM `Leave_Request` lr
        JOIN `Leave_Type` lt ON lr.`Leave_Type_ID` = lt.`Leave_Type_ID`
        WHERE lr.`Employee_ID` = v_emp_id
          AND lr.`Status` = 'Approved'
          AND lr.`Start_Date` <= v_last_of_month
          AND lr.`End_Date` >= v_first_of_month;

        -- Bound present days to not exceed working days
        IF v_present_days > v_working_days THEN
            SET v_present_days = v_working_days;
        END IF;

        -- If attendance has no records yet (e.g. simulation), default present days
        IF v_present_days = 0 AND v_unpaid_leave_days = 0 THEN
            SET v_present_days = v_working_days;
        END IF;

        -- 3. Compute Per-Day & Overtime Rates
        SET v_per_day_basic = ROUND(v_basic_salary / v_working_days, 2);
        SET v_ot_rate = ROUND((v_basic_salary / (v_working_days * 8.0)) * 1.5, 2);
        SET v_ot_pay = ROUND(v_ot_hours * v_ot_rate, 2);

        -- 4. Compute Earnings & Deductions
        SET v_unpaid_deduction = ROUND(v_unpaid_leave_days * v_per_day_basic, 2);
        SET v_tax_deduction = ROUND(v_basic_salary * (v_tax_rate / 100.0), 2);
        SET v_pf_deduction = ROUND(v_basic_salary * (v_pf_rate / 100.0), 2);

        SET v_total_allowances = ROUND(v_hra + v_med + v_conv + v_ot_pay, 2);
        SET v_gross_salary = ROUND(v_basic_salary + v_total_allowances, 2);
        SET v_total_deductions = ROUND(v_tax_deduction + v_pf_deduction + v_unpaid_deduction, 2);
        SET v_net_salary = ROUND(v_gross_salary - v_total_deductions, 2);

        -- 5. Insert Master Monthly Payroll Record
        INSERT INTO `Monthly_Payroll` (
            `Employee_ID`,
            `Payroll_Month`,
            `Payroll_Year`,
            `Working_Days`,
            `Present_Days`,
            `Paid_Leave_Days`,
            `Unpaid_Leave_Days`,
            `Basic_Salary`,
            `Total_Allowances`,
            `Gross_Salary`,
            `Total_Deductions`,
            `Net_Salary`,
            `Generation_Date`,
            `Payroll_Status`,
            `Generated_By_User_ID`
        ) VALUES (
            v_emp_id,
            p_payroll_month,
            p_payroll_year,
            v_working_days,
            v_present_days,
            v_paid_leave_days,
            v_unpaid_leave_days,
            v_basic_salary,
            v_total_allowances,
            v_gross_salary,
            v_total_deductions,
            v_net_salary,
            NOW(),
            'Generated',
            p_generated_by_user_id
        );

        SET v_payroll_id = LAST_INSERT_ID();

        -- 6. Insert Itemized Payslip Component Breakdown
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES 
            (v_payroll_id, 'Basic Salary', 'Earning', v_basic_salary),
            (v_payroll_id, 'House Rent Allowance', 'Earning', v_hra),
            (v_payroll_id, 'Medical Allowance', 'Earning', v_med),
            (v_payroll_id, 'Conveyance Allowance', 'Earning', v_conv);

        IF v_ot_pay > 0 THEN
            INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
            VALUES (v_payroll_id, 'Overtime Compensation', 'Earning', v_ot_pay);
        END IF;

        IF v_tax_deduction > 0 THEN
            INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
            VALUES (v_payroll_id, 'Statutory Income Tax Withholding', 'Deduction', v_tax_deduction);
        END IF;

        IF v_pf_deduction > 0 THEN
            INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
            VALUES (v_payroll_id, 'Provident Fund Contribution', 'Deduction', v_pf_deduction);
        END IF;

        IF v_unpaid_deduction > 0 THEN
            INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
            VALUES (v_payroll_id, 'Unpaid Leave Penalty Deduction', 'Deduction', v_unpaid_deduction);
        END IF;

        SET v_batch_count = v_batch_count + 1;
    END LOOP read_loop;

    CLOSE cur_employees;

    -- Audit Log entry
    INSERT INTO `System_Audit_Log` (
        `Table_Name`,
        `Operation_Type`,
        `Record_ID`,
        `Changed_By_User`,
        `Description`
    ) VALUES (
        'Monthly_Payroll',
        'INSERT',
        CONCAT(p_payroll_year, '-', LPAD(p_payroll_month, 2, '0')),
        p_generated_by_user_id,
        CONCAT('Batch payroll generated successfully for ', v_batch_count, ' employees.')
    );

    COMMIT;

    -- Return summary to caller
    SELECT 
        p_payroll_year AS `Payroll_Year`,
        p_payroll_month AS `Payroll_Month`,
        v_batch_count AS `Processed_Count`,
        'SUCCESS' AS `Execution_Status`;
END proc_label$$

-- ----------------------------------------------------------------------------
-- 2. Procedure: sp_FinalizeMonthlyPayroll
-- Transitions payroll records from Generated to Finalized, locking them from modifications.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FinalizeMonthlyPayroll`$$
CREATE PROCEDURE `sp_FinalizeMonthlyPayroll`(
    IN p_payroll_year INT,
    IN p_payroll_month INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE `Monthly_Payroll`
    SET `Payroll_Status` = 'Finalized',
        `Finalized_Date` = NOW()
    WHERE `Payroll_Year` = p_payroll_year
      AND `Payroll_Month` = p_payroll_month
      AND `Payroll_Status` IN ('Draft', 'Generated');

    SET v_count = ROW_COUNT();

    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Monthly_Payroll', 'UPDATE', CONCAT(p_payroll_year, '-', LPAD(p_payroll_month, 2, '0')), p_user_id,
        CONCAT('Finalized payroll period for ', v_count, ' records.')
    );

    COMMIT;

    SELECT v_count AS `Finalized_Record_Count`, 'SUCCESS' AS `Status`;
END$$

-- ----------------------------------------------------------------------------
-- 3. Procedure: sp_OnboardEmployeeWithSalary
-- Atomically provisions a user credential, employee profile, designation salary
-- verification, salary structure, and initial annual leave allocations.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_OnboardEmployeeWithSalary`$$
CREATE PROCEDURE `sp_OnboardEmployeeWithSalary`(
    -- Account Credentials
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(50),
    -- Employee Profile
    IN p_employee_code VARCHAR(20),
    IN p_department_id INT,
    IN p_designation_id INT,
    IN p_manager_id INT,
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_nid VARCHAR(25),
    IN p_dob DATE,
    IN p_gender VARCHAR(10),
    IN p_address VARCHAR(255),
    IN p_hire_date DATE,
    -- Banking Details
    IN p_bank_acc VARCHAR(50),
    IN p_bank_name VARCHAR(100),
    IN p_bank_branch VARCHAR(100),
    IN p_routing VARCHAR(20),
    -- Salary Structure
    IN p_basic_salary DECIMAL(12, 2),
    IN p_hra DECIMAL(12, 2),
    IN p_medical DECIMAL(12, 2),
    IN p_conveyance DECIMAL(12, 2),
    IN p_tax_rate DECIMAL(5, 2),
    IN p_pf_rate DECIMAL(5, 2),
    -- Outputs
    OUT p_new_employee_id INT
)
BEGIN
    DECLARE v_min_salary DECIMAL(12, 2);
    DECLARE v_max_salary DECIMAL(12, 2);
    DECLARE v_desig_dept_id INT;
    DECLARE v_new_user_id INT;
    DECLARE v_current_year SMALLINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. Validate Designation and Department Alignment
    SELECT `Base_Salary_Min`, `Base_Salary_Max`, `Department_ID`
    INTO v_min_salary, v_max_salary, v_desig_dept_id
    FROM `Designation`
    WHERE `Designation_ID` = p_designation_id;

    IF v_min_salary IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Designation not found.';
    END IF;

    IF v_desig_dept_id <> p_department_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Designation does not belong to the specified Department.';
    END IF;

    -- 2. Validate Salary Band Compliance
    IF p_basic_salary < v_min_salary OR p_basic_salary > v_max_salary THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Basic salary violates the designated pay band bracket (Base_Salary_Min to Base_Salary_Max).';
    END IF;

    START TRANSACTION;

    -- 3. Create User Account
    INSERT INTO `User_Account` (`Username`, `Password_Hash`, `Role`, `Is_Active`)
    VALUES (p_username, p_password_hash, p_role, TRUE);
    SET v_new_user_id = LAST_INSERT_ID();

    -- 4. Create Employee Profile
    INSERT INTO `Employee` (
        `Employee_Code`, `User_ID`, `Department_ID`, `Designation_ID`, `Manager_ID`,
        `First_Name`, `Last_Name`, `Email`, `Phone`, `NID`,
        `Date_Of_Birth`, `Gender`, `Address`, `Hire_Date`,
        `Bank_Account_No`, `Bank_Name`, `Bank_Branch`, `Bank_Routing_No`,
        `Employment_Status`
    ) VALUES (
        p_employee_code, v_new_user_id, p_department_id, p_designation_id, p_manager_id,
        p_first_name, p_last_name, p_email, p_phone, p_nid,
        p_dob, p_gender, p_address, p_hire_date,
        p_bank_acc, p_bank_name, p_bank_branch, p_routing,
        'Active'
    );
    SET p_new_employee_id = LAST_INSERT_ID();

    -- 5. Create Active Salary Structure
    INSERT INTO `Salary_Structure` (
        `Employee_ID`, `Basic_Salary`, `House_Rent_Allowance`, `Medical_Allowance`,
        `Conveyance_Allowance`, `Tax_Deduction_Rate`, `Provident_Fund_Rate`,
        `Effective_From`, `Effective_To`, `Is_Active`
    ) VALUES (
        p_new_employee_id, p_basic_salary, p_hra, p_medical,
        p_conveyance, p_tax_rate, p_pf_rate,
        p_hire_date, NULL, TRUE
    );

    -- 6. Initialize Default Leave Allocations for Current Calendar Year
    SET v_current_year = YEAR(p_hire_date);

    INSERT INTO `Leave_Allocation` (`Employee_ID`, `Leave_Type_ID`, `Calendar_Year`, `Total_Allocated`, `Days_Used`, `Days_Remaining`)
    SELECT 
        p_new_employee_id, 
        lt.`Leave_Type_ID`, 
        v_current_year, 
        lt.`Max_Days_Per_Year`, 
        0, 
        lt.`Max_Days_Per_Year`
    FROM `Leave_Type` lt;

    -- 7. Record System Audit Log
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Employee', 'INSERT', CAST(p_new_employee_id AS CHAR), v_new_user_id,
        CONCAT('Onboarded employee ', p_employee_code, ' with active salary structure.')
    );

    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 4. Procedure: sp_DisbursePayroll
-- Validates payroll eligibility, prevents duplicate disbursements, records
-- BEFTN transaction reference, transitions payroll status, and logs audit trail.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_DisbursePayroll`$$
CREATE PROCEDURE `sp_DisbursePayroll`(
    IN p_payroll_id INT,
    IN p_payment_method VARCHAR(50),
    IN p_transaction_prefix VARCHAR(20),
    IN p_processed_by_user_id INT,
    OUT p_transaction_reference VARCHAR(100)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_net_salary DECIMAL(12, 2);
    DECLARE v_existing_disbursement INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Verify payroll record exists
    SELECT `Payroll_Status`, `Net_Salary`
    INTO v_status, v_net_salary
    FROM `Monthly_Payroll`
    WHERE `Payroll_ID` = p_payroll_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payroll record does not exist.';
    END IF;

    IF v_status = 'Disbursed' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payroll has already been disbursed. Duplicate disbursement prevented.';
    END IF;

    -- Verify no existing disbursement record
    SELECT COUNT(*) INTO v_existing_disbursement
    FROM `Disbursement_Record`
    WHERE `Payroll_ID` = p_payroll_id;

    IF v_existing_disbursement > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A disbursement record already exists for this payroll ID.';
    END IF;

    -- Generate Unique BEFTN Reference
    SET p_transaction_reference = CONCAT(
        COALESCE(p_transaction_prefix, 'BEFTN'),
        '-',
        DATE_FORMAT(NOW(), '%Y%m%d'),
        '-',
        LPAD(p_payroll_id, 6, '0'),
        '-',
        FLOOR(1000 + (RAND() * 9000))
    );

    START TRANSACTION;

    -- Insert Disbursement Settlement Record
    INSERT INTO `Disbursement_Record` (
        `Payroll_ID`,
        `Payment_Method`,
        `Transaction_Reference`,
        `Disbursement_Date`,
        `Disbursement_Status`,
        `Disbursed_Amount`,
        `Remarks`,
        `Disbursed_By_User_ID`
    ) VALUES (
        p_payroll_id,
        p_payment_method,
        p_transaction_reference,
        NOW(),
        'Disbursed',
        v_net_salary,
        'Electronic Fund Transfer settled successfully via BEFTN network',
        p_processed_by_user_id
    );

    -- Update Payroll Status
    UPDATE `Monthly_Payroll`
    SET `Payroll_Status` = 'Disbursed',
        `Finalized_Date` = COALESCE(`Finalized_Date`, NOW())
    WHERE `Payroll_ID` = p_payroll_id;

    -- Record Audit Trail
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Disbursement_Record', 'INSERT', p_transaction_reference, p_processed_by_user_id,
        CONCAT('Payroll ID ', p_payroll_id, ' disbursed for amount BDT ', v_net_salary)
    );

    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 5. Procedure: sp_ApproveLeaveRequest
-- Transactionally approves a leave request, checking available quota balance.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_ApproveLeaveRequest`$$
CREATE PROCEDURE `sp_ApproveLeaveRequest`(
    IN p_request_id INT,
    IN p_approver_user_id INT,
    IN p_approval_remarks VARCHAR(255)
)
BEGIN
    DECLARE v_emp_id INT;
    DECLARE v_leave_type_id INT;
    DECLARE v_total_days INT;
    DECLARE v_req_year SMALLINT;
    DECLARE v_curr_status VARCHAR(20);
    DECLARE v_days_remaining INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Fetch leave request details
    SELECT `Employee_ID`, `Leave_Type_ID`, `Total_Days`, YEAR(`Start_Date`), `Status`
    INTO v_emp_id, v_leave_type_id, v_total_days, v_req_year, v_curr_status
    FROM `Leave_Request`
    WHERE `Request_ID` = p_request_id;

    IF v_curr_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Leave request not found.';
    END IF;

    IF v_curr_status <> 'Pending' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only Pending leave requests can be approved.';
    END IF;

    -- Check available balance
    SELECT `Days_Remaining` INTO v_days_remaining
    FROM `Leave_Allocation`
    WHERE `Employee_ID` = v_emp_id
      AND `Leave_Type_ID` = v_leave_type_id
      AND `Calendar_Year` = v_req_year;

    IF v_days_remaining IS NULL OR v_days_remaining < v_total_days THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient leave allocation balance to approve request.';
    END IF;

    START TRANSACTION;

    -- Update Request Status (triggers will synchronize the allocation ledger)
    UPDATE `Leave_Request`
    SET `Status` = 'Approved',
        `Approved_By_User_ID` = p_approver_user_id,
        `Approval_Remarks` = p_approval_remarks,
        `Approved_At` = NOW()
    WHERE `Request_ID` = p_request_id;

    -- Audit Log entry
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Leave_Request', 'UPDATE', CAST(p_request_id AS CHAR), p_approver_user_id,
        CONCAT('Leave request approved for ', v_total_days, ' days.')
    );

    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 6. Procedure: sp_RejectLeaveRequest
-- Transactionally rejects a pending leave application with justification remarks.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_RejectLeaveRequest`$$
CREATE PROCEDURE `sp_RejectLeaveRequest`(
    IN p_request_id INT,
    IN p_approver_user_id INT,
    IN p_rejection_remarks VARCHAR(255)
)
BEGIN
    DECLARE v_curr_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT `Status` INTO v_curr_status
    FROM `Leave_Request`
    WHERE `Request_ID` = p_request_id;

    IF v_curr_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Leave request not found.';
    END IF;

    IF v_curr_status <> 'Pending' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only Pending leave requests can be rejected.';
    END IF;

    START TRANSACTION;

    UPDATE `Leave_Request`
    SET `Status` = 'Rejected',
        `Approved_By_User_ID` = p_approver_user_id,
        `Approval_Remarks` = p_rejection_remarks,
        `Approved_At` = NOW()
    WHERE `Request_ID` = p_request_id;

    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Leave_Request', 'UPDATE', CAST(p_request_id AS CHAR), p_approver_user_id,
        'Leave request rejected by manager/supervisor.'
    );

    COMMIT;
END$$

DELIMITER ;
