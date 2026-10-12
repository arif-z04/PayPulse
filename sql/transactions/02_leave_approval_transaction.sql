-- ============================================================================
-- PayPulse Transaction Script 02: Leave Approval and Balance Transaction
-- Database: paypulse_db | Engine: InnoDB | Concurrency: Row-Level Locking (Pessimistic)
-- ============================================================================
-- Objective:
-- Atomically approve a pending leave application with strict quota verification,
-- pessimistic row locking (FOR UPDATE) to prevent race conditions/double deductions,
-- ledger synchronization, and immutable audit logging.
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_ApproveLeaveRequestTransaction`$$

CREATE PROCEDURE `sp_ApproveLeaveRequestTransaction`(
    IN p_request_id INT,
    IN p_approver_user_id INT,
    IN p_approval_remarks VARCHAR(255),
    OUT p_out_status VARCHAR(50),
    OUT p_out_remaining_days INT
)
proc_body: BEGIN
    DECLARE v_emp_id INT;
    DECLARE v_leave_type_id INT;
    DECLARE v_total_days INT;
    DECLARE v_req_year SMALLINT;
    DECLARE v_curr_status VARCHAR(20);
    DECLARE v_allocation_id INT;
    DECLARE v_days_remaining INT;
    DECLARE v_approver_role VARCHAR(50);

    -- Error Handling: Rollback on any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_status = 'FAILED: Transaction Rolled Back on Exception';
        SET p_out_remaining_days = NULL;
        RESIGNAL;
    END;

    -- 1. Validate Approver Authorization
    SELECT `Role` INTO v_approver_role
    FROM `User_Account`
    WHERE `User_ID` = p_approver_user_id AND `Is_Active` = TRUE;

    IF v_approver_role IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Authorization Error: Approver account not found or inactive.';
    END IF;

    IF v_approver_role NOT IN ('System Administrator', 'HR Manager', 'Department Supervisor') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Authorization Error: Acting user lacks permission to approve leave applications.';
    END IF;

    -- ========================================================================
    -- ATOMIC TRANSACTION BLOCK WITH ROW-LEVEL LOCKING
    -- ========================================================================
    START TRANSACTION;

    -- 2. Lock and retrieve the Leave Request row (Pessimistic concurrency)
    -- FOR UPDATE prevents another concurrent transaction from evaluating or approving this request simultaneously
    SELECT `Employee_ID`, `Leave_Type_ID`, `Total_Days`, YEAR(`Start_Date`), `Status`
    INTO v_emp_id, v_leave_type_id, v_total_days, v_req_year, v_curr_status
    FROM `Leave_Request`
    WHERE `Request_ID` = p_request_id
    FOR UPDATE;

    IF v_curr_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Leave request record not found.';
    END IF;

    -- Concurrency Guard: State transition validation
    IF v_curr_status <> 'Pending' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Concurrency Error: Only Pending leave requests can be approved. Request already processed.';
    END IF;

    -- 3. Lock and retrieve the corresponding Leave Allocation quota row
    SELECT `Allocation_ID`, `Days_Remaining`
    INTO v_allocation_id, v_days_remaining
    FROM `Leave_Allocation`
    WHERE `Employee_ID` = v_emp_id
      AND `Leave_Type_ID` = v_leave_type_id
      AND `Calendar_Year` = v_req_year
    FOR UPDATE;

    IF v_allocation_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: No leave allocation found for this employee, leave type, and calendar year.';
    END IF;

    -- Balance check
    IF v_days_remaining < v_total_days THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Business Rule Violation: Insufficient leave balance remaining to approve requested days.';
    END IF;

    -- 4. Update the Leave Request record
    -- Note: Updating Status to 'Approved' will trigger trg_SyncLeaveAllocationOnStatusChange
    -- to update Days_Used and Days_Remaining in Leave_Allocation automatically and consistently.
    UPDATE `Leave_Request`
    SET `Status` = 'Approved',
        `Approved_By_User_ID` = p_approver_user_id,
        `Approval_Remarks` = COALESCE(p_approval_remarks, 'Approved via transactional workflow'),
        `Approved_At` = NOW()
    WHERE `Request_ID` = p_request_id;

    -- 5. Retrieve updated remaining balance from Leave_Allocation
    SELECT `Days_Remaining` INTO p_out_remaining_days
    FROM `Leave_Allocation`
    WHERE `Allocation_ID` = v_allocation_id;

    -- 6. Record System Audit Trail
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Leave_Request', 'UPDATE', CAST(p_request_id AS CHAR), p_approver_user_id,
        CONCAT('Transactionally approved leave request #', p_request_id, ' for ', v_total_days, ' days. New remaining balance: ', p_out_remaining_days)
    );

    -- 7. Commit changes atomically
    COMMIT;
    SET p_out_status = 'SUCCESS: Leave Request Approved';
END proc_body$$

DELIMITER ;
