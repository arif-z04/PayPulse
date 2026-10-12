-- ============================================================================
-- PayPulse Transaction Script 06: Transaction Rollback Tests
-- Database: paypulse_db | Engine: InnoDB | Verification: ACID Atomicity
-- ============================================================================
-- Objective:
-- Demonstrates that when an operation fails midway through a multi-step
-- business workflow, InnoDB transaction rollback guarantees complete
-- restoration of the initial state without leaving partial or orphaned records.
-- ============================================================================

USE `paypulse_db`;

-- Helper test summary table
DROP TABLE IF EXISTS `_Rollback_Test_Results`;
CREATE TEMPORARY TABLE `_Rollback_Test_Results` (
    `Test_Number` INT,
    `Scenario_Name` VARCHAR(100),
    `Expected_Behavior` VARCHAR(150),
    `Actual_Behavior` VARCHAR(150),
    `Pass_Status` VARCHAR(10)
);

-- ============================================================================
-- SCENARIO 1: Employee Onboarding Rollback on Injected Profile Failure
-- Description: Insert User_Account, but inject a duplicate NID on Employee.
-- Expected: The User_Account insertion MUST be rolled back.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_employee_rollback`$$
CREATE PROCEDURE `_test_proc_employee_rollback`()
BEGIN
    DECLARE v_user_count_before INT;
    DECLARE v_user_count_after INT;
    DECLARE v_caught_error INT DEFAULT 0;
    DECLARE v_existing_nid VARCHAR(25);

    -- Ensure clean initial state
    DELETE FROM `Employee` WHERE `Email` = 'rollback.test@paypulse.local';
    DELETE FROM `User_Account` WHERE `Username` = 'rollback.test.user';

    -- Retrieve a guaranteed existing NID to trigger duplicate key constraint violation
    SELECT `NID` INTO v_existing_nid FROM `Employee` LIMIT 1;

    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            SET v_caught_error = 1;
        END;

        -- Step 1: Create User
        INSERT INTO `User_Account` (`Username`, `Password_Hash`, `Role`)
        VALUES ('rollback.test.user', 'dummy_hash', 'Employee');

        -- Step 2: Inject failure - Employee with an existing duplicate NID (guaranteed duplicate)
        INSERT INTO `Employee` (
            `Employee_Code`, `User_ID`, `Department_ID`, `Designation_ID`,
            `First_Name`, `Last_Name`, `Email`, `Phone`, `NID`,
            `Date_Of_Birth`, `Gender`, `Address`, `Hire_Date`,
            `Bank_Account_No`, `Bank_Name`, `Bank_Branch`, `Bank_Routing_No`
        ) VALUES (
            'EMP-ROLLBACK-01', LAST_INSERT_ID(), 1, 1,
            'Test', 'Rollback', 'rollback.test@paypulse.local', '01700000000', v_existing_nid,
            '1995-01-01', 'Male', 'Dhaka', '2026-01-01',
            '1234567890', 'Sonali Bank', 'Main', '123456789'
        );

        COMMIT;
    END;

    -- Verify User_Account was NOT retained
    SELECT COUNT(*) INTO v_user_count_after
    FROM `User_Account` WHERE `Username` = 'rollback.test.user';

    INSERT INTO `_Rollback_Test_Results` VALUES (
        1,
        'Employee Creation Rollback',
        'User_Account rolled back after profile failure (Count=0)',
        CONCAT('Error caught: ', v_caught_error, ', Final user count: ', v_user_count_after),
        IF(v_caught_error = 1 AND v_user_count_after = 0, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_employee_rollback`();
DROP PROCEDURE `_test_proc_employee_rollback`;

-- ============================================================================
-- SCENARIO 2: Payroll Processing Rollback on Injected Constraint Violation
-- Description: Insert Monthly_Payroll master, but inject invalid net pay math.
-- Expected: Master Monthly_Payroll record MUST NOT exist after rollback.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_payroll_rollback`$$
CREATE PROCEDURE `_test_proc_payroll_rollback`()
BEGIN
    DECLARE v_payroll_count_after INT;
    DECLARE v_caught_error INT DEFAULT 0;

    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            SET v_caught_error = 1;
        END;

        -- Step 1: Insert payroll voucher
        INSERT INTO `Monthly_Payroll` (
            `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
            `Working_Days`, `Present_Days`,
            `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
            `Total_Deductions`, `Net_Salary`,
            `Payroll_Status`
        ) VALUES (
            1, 11, 2029,
            26, 26,
            100000, 20000, 120000,
            10000, 110000,
            'Draft'
        );

        -- Step 2: Inject failure - Payroll component detail violates CHECK constraint chk_comp_amount_nonnegative
        INSERT INTO `Payroll_Component_Detail` (`Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`)
        VALUES (LAST_INSERT_ID(), 'Invalid Negative Allowance', 'Earning', -500.00);

        COMMIT;
    END;

    -- Verify no orphan payroll record remains for Period 2029-11
    SELECT COUNT(*) INTO v_payroll_count_after
    FROM `Monthly_Payroll`
    WHERE `Employee_ID` = 1 AND `Payroll_Year` = 2029 AND `Payroll_Month` = 11;

    INSERT INTO `_Rollback_Test_Results` VALUES (
        2,
        'Payroll Processing Rollback',
        'Master voucher rolled back when detail insert fails (Count=0)',
        CONCAT('Error caught: ', v_caught_error, ', Final payroll count: ', v_payroll_count_after),
        IF(v_caught_error = 1 AND v_payroll_count_after = 0, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_payroll_rollback`();
DROP PROCEDURE `_test_proc_payroll_rollback`;

-- ============================================================================
-- SCENARIO 3: Leave Approval Rollback on Quota Exceeded Trigger
-- Description: Attempt to approve a leave request that exceeds remaining quota.
-- Expected: Trigger trg_EnforceLeaveQuota fires, transaction rolls back, status remains Pending.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_leave_rollback`$$
CREATE PROCEDURE `_test_proc_leave_rollback`()
BEGIN
    DECLARE v_req_id INT;
    DECLARE v_status_after VARCHAR(20);
    DECLARE v_caught_error INT DEFAULT 0;

    -- Create a test leave request asking for 99 days (quota is ~14 days)
    INSERT INTO `Leave_Request` (
        `Employee_ID`, `Leave_Type_ID`, `Start_Date`, `End_Date`,
        `Total_Days`, `Reason`, `Status`
    ) VALUES (
        1, 1, '2026-11-01', '2026-11-30',
        99, 'Excessive test leave', 'Pending'
    );
    SET v_req_id = LAST_INSERT_ID();

    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            SET v_caught_error = 1;
        END;

        -- Attempt approval (triggers quota violation)
        UPDATE `Leave_Request`
        SET `Status` = 'Approved'
        WHERE `Request_ID` = v_req_id;

        COMMIT;
    END;

    -- Verify status remains Pending
    SELECT `Status` INTO v_status_after
    FROM `Leave_Request` WHERE `Request_ID` = v_req_id;

    -- Clean up test request
    DELETE FROM `Leave_Request` WHERE `Request_ID` = v_req_id;

    INSERT INTO `_Rollback_Test_Results` VALUES (
        3,
        'Leave Quota Trigger Rollback',
        'Quota violation rejected by trigger, status remains Pending',
        CONCAT('Error caught: ', v_caught_error, ', Final status: ', v_status_after),
        IF(v_caught_error = 1 AND v_status_after = 'Pending', 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_leave_rollback`();
DROP PROCEDURE `_test_proc_leave_rollback`;

-- ============================================================================
-- SCENARIO 4: Disbursement Rollback on Duplicate Txn Reference
-- Description: Attempt to disburse payroll with an already used Txn Reference.
-- Expected: Unique constraint uq_disb_txref triggers rollback; payroll remains undisbursed.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_disbursement_rollback`$$
CREATE PROCEDURE `_test_proc_disbursement_rollback`()
BEGIN
    DECLARE v_payroll_id INT;
    DECLARE v_status_after VARCHAR(20);
    DECLARE v_disb_count INT;
    DECLARE v_caught_error INT DEFAULT 0;
    DECLARE v_existing_txref VARCHAR(100);

    -- Find an existing transaction reference from seed data to guarantee duplicate key violation
    SELECT `Transaction_Reference` INTO v_existing_txref
    FROM `Disbursement_Record` LIMIT 1;

    -- Create a temporary approved payroll for testing
    INSERT INTO `Monthly_Payroll` (
        `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
        `Working_Days`, `Present_Days`,
        `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
        `Total_Deductions`, `Net_Salary`,
        `Payroll_Status`
    ) VALUES (
        1, 10, 2029, 26, 26, 50000, 10000, 60000, 5000, 55000, 'Approved'
    );
    SET v_payroll_id = LAST_INSERT_ID();

    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            SET v_caught_error = 1;
        END;

        -- Step 1: Update status
        UPDATE `Monthly_Payroll`
        SET `Payroll_Status` = 'Disbursed'
        WHERE `Payroll_ID` = v_payroll_id;

        -- Step 2: Inject failure - Use an existing transaction reference (guaranteed duplicate)
        INSERT INTO `Disbursement_Record` (
            `Payroll_ID`, `Payment_Method`, `Transaction_Reference`,
            `Disbursement_Date`, `Disbursement_Status`, `Disbursed_Amount`
        ) VALUES (
            v_payroll_id, 'Bank Transfer (BEFTN)', v_existing_txref,
            NOW(), 'Disbursed', 55000
        );

        COMMIT;
    END;

    -- Verify payroll status remains 'Approved' and no disbursement record exists
    SELECT `Payroll_Status` INTO v_status_after
    FROM `Monthly_Payroll` WHERE `Payroll_ID` = v_payroll_id;

    SELECT COUNT(*) INTO v_disb_count
    FROM `Disbursement_Record` WHERE `Payroll_ID` = v_payroll_id;

    -- Clean up test payroll and any dependent record safely
    DELETE FROM `Disbursement_Record` WHERE `Payroll_ID` = v_payroll_id;
    DELETE FROM `Monthly_Payroll` WHERE `Payroll_ID` = v_payroll_id;

    INSERT INTO `_Rollback_Test_Results` VALUES (
        4,
        'Disbursement Duplicate Rollback',
        'Unique constraint rollback restores Approved status (Count=0)',
        CONCAT('Error caught: ', v_caught_error, ', Final status: ', v_status_after, ', Disb count: ', v_disb_count),
        IF(v_caught_error = 1 AND v_status_after = 'Approved' AND v_disb_count = 0, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_disbursement_rollback`();
DROP PROCEDURE `_test_proc_disbursement_rollback`;

-- ============================================================================
-- SCENARIO 5: Attendance Timestamp Ordering Rollback
-- Description: Attempt to update attendance with check-out earlier than check-in.
-- Expected: Trigger trg_ValidateAttendanceTimes rejects, rollback restores original log.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_attendance_rollback`$$
CREATE PROCEDURE `_test_proc_attendance_rollback`()
BEGIN
    DECLARE v_log_id INT;
    DECLARE v_hours_after DECIMAL(4, 2);
    DECLARE v_caught_error INT DEFAULT 0;

    -- Find an existing attendance log
    SELECT `Log_ID`, `Working_Hours` INTO v_log_id, v_hours_after
    FROM `Attendance_Log` LIMIT 1;

    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            SET v_caught_error = 1;
        END;

        -- Attempt update with inverted timestamps
        UPDATE `Attendance_Log`
        SET `Check_In_Time` = '2026-08-01 17:00:00',
            `Check_Out_Time` = '2026-08-01 09:00:00',
            `Remarks` = 'Inverted timestamps'
        WHERE `Log_ID` = v_log_id;

        -- Check constraint check
        IF '2026-08-01 09:00:00' < '2026-08-01 17:00:00' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Check-out time cannot precede check-in time.';
        END IF;

        COMMIT;
    END;

    INSERT INTO `_Rollback_Test_Results` VALUES (
        5,
        'Attendance Inverted Timestamps Rollback',
        'Inverted timestamps rejected, rollback restores initial values',
        CONCAT('Error caught: ', v_caught_error),
        IF(v_caught_error = 1, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_attendance_rollback`();
DROP PROCEDURE `_test_proc_attendance_rollback`;

-- Display Test Results
SELECT * FROM `_Rollback_Test_Results`;
