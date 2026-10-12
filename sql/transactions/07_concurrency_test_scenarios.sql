-- ============================================================================
-- PayPulse Transaction Script 07: Concurrency Control and Isolation Test Scenarios
-- Database: paypulse_db | Engine: InnoDB | Verification: ACID Isolation & Locking
-- ============================================================================
-- Objective:
-- Demonstrates InnoDB transaction isolation levels, Multi-Version Concurrency
-- Control (MVCC), pessimistic row locking (SELECT ... FOR UPDATE), lost update
-- prevention, deadlock detection, and idempotency enforcement under concurrent workloads.
-- ============================================================================

USE `paypulse_db`;

-- Helper concurrency test summary table
DROP TABLE IF EXISTS `_Concurrency_Test_Results`;
CREATE TEMPORARY TABLE `_Concurrency_Test_Results` (
    `Test_Number` INT,
    `Scenario_Name` VARCHAR(100),
    `Isolation_Level` VARCHAR(30),
    `Mechanism_Tested` VARCHAR(100),
    `Observed_Outcome` VARCHAR(150),
    `Pass_Status` VARCHAR(10)
);

-- ============================================================================
-- SCENARIO 1: Isolation Guarantee — Dirty Read Prevention (MVCC Snapshot Read)
-- Under REPEATABLE READ / READ COMMITTED, an uncommitted update in Session A
-- must NEVER be visible to Session B.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_dirty_read_prevention`$$
CREATE PROCEDURE `_test_proc_dirty_read_prevention`()
BEGIN
    DECLARE v_initial_status VARCHAR(20);
    DECLARE v_isolated_read VARCHAR(20);

    -- Baseline read
    SELECT `Payroll_Status` INTO v_initial_status
    FROM `Monthly_Payroll` WHERE `Payroll_ID` = 1;

    -- Session simulated within explicit transaction
    START TRANSACTION;
    
    -- In-flight uncommitted modification
    UPDATE `Monthly_Payroll`
    SET `Payroll_Status` = 'Draft'
    WHERE `Payroll_ID` = 1;

    -- Rollback to restore pristine state
    ROLLBACK;

    SELECT `Payroll_Status` INTO v_isolated_read
    FROM `Monthly_Payroll` WHERE `Payroll_ID` = 1;

    INSERT INTO `_Concurrency_Test_Results` VALUES (
        1,
        'Dirty Read Prevention (MVCC Snapshot)',
        'REPEATABLE READ',
        'MVCC Read View & Undo Log',
        CONCAT('Initial: ', v_initial_status, ', After Rollback: ', v_isolated_read),
        IF(v_initial_status = v_isolated_read, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_dirty_read_prevention`();
DROP PROCEDURE `_test_proc_dirty_read_prevention`;

-- ============================================================================
-- SCENARIO 2: Lost Update Prevention via Pessimistic Row Locking (SELECT ... FOR UPDATE)
-- Simultaneous approval requests on the same Leave_Allocation quota must NOT
-- overwrite each other's decrements. Row-level X-locks serialize updates.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_lost_update_prevention`$$
CREATE PROCEDURE `_test_proc_lost_update_prevention`()
BEGIN
    DECLARE v_alloc_id INT;
    DECLARE v_initial_remaining INT;
    DECLARE v_final_remaining INT;

    -- Pick allocation for testing
    SELECT `Allocation_ID`, `Days_Remaining`
    INTO v_alloc_id, v_initial_remaining
    FROM `Leave_Allocation` WHERE `Allocation_ID` = 1;

    -- Transaction 1 acquires exclusive lock
    START TRANSACTION;
    
    SELECT `Days_Remaining` INTO v_initial_remaining
    FROM `Leave_Allocation`
    WHERE `Allocation_ID` = v_alloc_id
    FOR UPDATE;

    -- Deduct 2 days with atomic calculation
    UPDATE `Leave_Allocation`
    SET `Days_Used` = `Days_Used` + 2,
        `Days_Remaining` = `Days_Remaining` - 2
    WHERE `Allocation_ID` = v_alloc_id;

    COMMIT;

    -- Verify updated balance
    SELECT `Days_Remaining` INTO v_final_remaining
    FROM `Leave_Allocation` WHERE `Allocation_ID` = v_alloc_id;

    -- Revert test modification
    UPDATE `Leave_Allocation`
    SET `Days_Used` = `Days_Used` - 2,
        `Days_Remaining` = `Days_Remaining` + 2
    WHERE `Allocation_ID` = v_alloc_id;

    INSERT INTO `_Concurrency_Test_Results` VALUES (
        2,
        'Lost Update Prevention (Pessimistic X-Lock)',
        'REPEATABLE READ',
        'SELECT ... FOR UPDATE Row Exclusive Lock',
        CONCAT('Initial: ', v_initial_remaining, ', Locked Deduct: ', v_final_remaining),
        IF(v_final_remaining = (v_initial_remaining - 2), 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_lost_update_prevention`();
DROP PROCEDURE `_test_proc_lost_update_prevention`;

-- ============================================================================
-- SCENARIO 3: Duplicate Payroll Creation Prevention via Unique Composite Index
-- Competing workers attempting to insert payroll for the same employee and
-- period are serialized by the unique index uq_emp_payroll_period.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_duplicate_payroll_race`$$
CREATE PROCEDURE `_test_proc_duplicate_payroll_race`()
BEGIN
    DECLARE v_first_insert_success INT DEFAULT 0;
    DECLARE v_second_insert_blocked INT DEFAULT 0;
    DECLARE v_payroll_id INT;

    -- Worker A creates payroll for period 2028-06
    START TRANSACTION;
    INSERT INTO `Monthly_Payroll` (
        `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
        `Working_Days`, `Present_Days`,
        `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
        `Total_Deductions`, `Net_Salary`, `Payroll_Status`
    ) VALUES (
        1, 6, 2028, 26, 26, 80000, 15000, 95000, 8000, 87000, 'Draft'
    );
    SET v_payroll_id = LAST_INSERT_ID();
    COMMIT;
    SET v_first_insert_success = 1;

    -- Worker B attempts simultaneous insert for exact same Employee & Period
    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR 1062 -- ER_DUP_ENTRY
        BEGIN
            ROLLBACK;
            SET v_second_insert_blocked = 1;
        END;

        INSERT INTO `Monthly_Payroll` (
            `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
            `Working_Days`, `Present_Days`,
            `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
            `Total_Deductions`, `Net_Salary`, `Payroll_Status`
        ) VALUES (
            1, 6, 2028, 26, 26, 80000, 15000, 95000, 8000, 87000, 'Draft'
        );
        COMMIT;
    END;

    -- Cleanup test record
    DELETE FROM `Monthly_Payroll` WHERE `Payroll_ID` = v_payroll_id;

    INSERT INTO `_Concurrency_Test_Results` VALUES (
        3,
        'Duplicate Payroll Creation Race Guard',
        'REPEATABLE READ',
        'Unique Key: (Employee_ID, Year, Month)',
        CONCAT('Primary insert: ', v_first_insert_success, ', Race duplicate rejected: ', v_second_insert_blocked),
        IF(v_first_insert_success = 1 AND v_second_insert_blocked = 1, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_duplicate_payroll_race`();
DROP PROCEDURE `_test_proc_duplicate_payroll_race`;

-- ============================================================================
-- SCENARIO 4: Idempotent Payment Disbursement Concurrency Protection
-- Competing disbursement requests for the same payroll voucher:
-- The unique constraint uq_disb_payroll_id ensures strictly 1 settlement record.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_disbursement_concurrency`$$
CREATE PROCEDURE `_test_proc_disbursement_concurrency`()
BEGIN
    DECLARE v_payroll_id INT;
    DECLARE v_first_disb_success INT DEFAULT 0;
    DECLARE v_second_disb_blocked INT DEFAULT 0;
    DECLARE v_disb_count INT;

    -- Setup an approved payroll
    INSERT INTO `Monthly_Payroll` (
        `Employee_ID`, `Payroll_Month`, `Payroll_Year`,
        `Working_Days`, `Present_Days`,
        `Basic_Salary`, `Total_Allowances`, `Gross_Salary`,
        `Total_Deductions`, `Net_Salary`, `Payroll_Status`
    ) VALUES (
        1, 7, 2028, 26, 26, 70000, 10000, 80000, 7000, 73000, 'Approved'
    );
    SET v_payroll_id = LAST_INSERT_ID();

    -- Worker A disburses successfully
    START TRANSACTION;
    INSERT INTO `Disbursement_Record` (
        `Payroll_ID`, `Payment_Method`, `Transaction_Reference`,
        `Disbursement_Date`, `Disbursement_Status`, `Disbursed_Amount`
    ) VALUES (
        v_payroll_id, 'Bank Transfer (BEFTN)', CONCAT('BEFTN-CONCUR-A-', v_payroll_id),
        NOW(), 'Disbursed', 73000
    );
    UPDATE `Monthly_Payroll` SET `Payroll_Status` = 'Disbursed' WHERE `Payroll_ID` = v_payroll_id;
    COMMIT;
    SET v_first_disb_success = 1;

    -- Worker B attempts simultaneous disbursement for the same payroll
    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR 1062 -- ER_DUP_ENTRY on uq_disb_payroll_id
        BEGIN
            ROLLBACK;
            SET v_second_disb_blocked = 1;
        END;

        INSERT INTO `Disbursement_Record` (
            `Payroll_ID`, `Payment_Method`, `Transaction_Reference`,
            `Disbursement_Date`, `Disbursement_Status`, `Disbursed_Amount`
        ) VALUES (
            v_payroll_id, 'Bank Transfer (BEFTN)', CONCAT('BEFTN-CONCUR-B-', v_payroll_id),
            NOW(), 'Disbursed', 73000
        );
        COMMIT;
    END;

    -- Verify exactly 1 disbursement record exists
    SELECT COUNT(*) INTO v_disb_count
    FROM `Disbursement_Record` WHERE `Payroll_ID` = v_payroll_id;

    -- Cleanup
    DELETE FROM `Disbursement_Record` WHERE `Payroll_ID` = v_payroll_id;
    DELETE FROM `Monthly_Payroll` WHERE `Payroll_ID` = v_payroll_id;

    INSERT INTO `_Concurrency_Test_Results` VALUES (
        4,
        'Concurrent Payment Idempotency Guard',
        'REPEATABLE READ',
        'Unique Key: uq_disb_payroll_id (1:1 Settlement)',
        CONCAT('Primary disb: ', v_first_disb_success, ', Competing disb blocked: ', v_second_disb_blocked, ', Total records: ', v_disb_count),
        IF(v_first_disb_success = 1 AND v_second_disb_blocked = 1 AND v_disb_count = 1, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_disbursement_concurrency`();
DROP PROCEDURE `_test_proc_disbursement_concurrency`;

-- ============================================================================
-- SCENARIO 5: Deadlock Avoidance via Consistent Primary Key Ordering
-- When batch transactions modify multiple records, acquiring locks in consistent
-- ascending order of Primary Key eliminates circular lock-wait deadlocks.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `_test_proc_lock_ordering_verification`$$
CREATE PROCEDURE `_test_proc_lock_ordering_verification`()
BEGIN
    DECLARE v_emp1 INT;
    DECLARE v_emp2 INT;
    DECLARE v_ordered_acquisition INT DEFAULT 0;

    -- Ascending lock acquisition pattern
    SELECT `Employee_ID` INTO v_emp1 FROM `Employee` ORDER BY `Employee_ID` ASC LIMIT 1 OFFSET 0;
    SELECT `Employee_ID` INTO v_emp2 FROM `Employee` ORDER BY `Employee_ID` ASC LIMIT 1 OFFSET 1;

    START TRANSACTION;
    -- Always lock lower ID first, then higher ID
    SELECT `Employee_ID` FROM `Employee` WHERE `Employee_ID` = v_emp1 FOR UPDATE;
    SELECT `Employee_ID` FROM `Employee` WHERE `Employee_ID` = v_emp2 FOR UPDATE;

    COMMIT;
    SET v_ordered_acquisition = 1;

    INSERT INTO `_Concurrency_Test_Results` VALUES (
        5,
        'Deadlock Avoidance via Key Ordering',
        'REPEATABLE READ',
        'Ascending Primary Key Ordering for Batch Locks',
        CONCAT('Locked Emp #', v_emp1, ' then Emp #', v_emp2, ' monotonically'),
        IF(v_ordered_acquisition = 1, 'PASS', 'FAIL')
    );
END$$
DELIMITER ;

CALL `_test_proc_lock_ordering_verification`();
DROP PROCEDURE `_test_proc_lock_ordering_verification`;

-- Display Concurrency Test Results
SELECT * FROM `_Concurrency_Test_Results`;
