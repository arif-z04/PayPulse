-- ============================================================================
-- PayPulse Transaction Script 05: Attendance Correction Transaction
-- Database: paypulse_db | Engine: InnoDB | Domain: Timekeeping & Compliance
-- ============================================================================
-- Objective:
-- Atomically correct a biometric attendance log with recalculated working/overtime
-- hours, validate timestamp ordering, record before/after JSON states in
-- System_Audit_Log, and roll back on any constraint violation.
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_CorrectAttendanceTransaction`$$

CREATE PROCEDURE `sp_CorrectAttendanceTransaction`(
    IN p_log_id INT,
    IN p_new_check_in DATETIME,
    IN p_new_check_out DATETIME,
    IN p_new_status VARCHAR(20),
    IN p_corrected_by_user_id INT,
    IN p_reason VARCHAR(255),
    OUT p_out_working_hours DECIMAL(4, 2),
    OUT p_out_overtime_hours DECIMAL(4, 2),
    OUT p_out_status VARCHAR(50)
)
proc_body: BEGIN
    DECLARE v_old_emp_id INT;
    DECLARE v_old_date DATE;
    DECLARE v_old_in DATETIME;
    DECLARE v_old_out DATETIME;
    DECLARE v_old_hours DECIMAL(4, 2);
    DECLARE v_old_ot DECIMAL(4, 2);
    DECLARE v_old_status VARCHAR(20);

    DECLARE v_diff_minutes INT;
    DECLARE v_calc_hours DECIMAL(4, 2) DEFAULT 0.00;
    DECLARE v_calc_ot DECIMAL(4, 2) DEFAULT 0.00;
    DECLARE v_user_role VARCHAR(50);

    -- Error Handling: Rollback on any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_working_hours = 0.00;
        SET p_out_overtime_hours = 0.00;
        SET p_out_status = 'FAILED: Transaction Rolled Back on Exception';
        RESIGNAL;
    END;

    -- 1. Authorization Verification
    SELECT `Role` INTO v_user_role
    FROM `User_Account`
    WHERE `User_ID` = p_corrected_by_user_id AND `Is_Active` = TRUE;

    IF v_user_role IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Authorization Error: User account not found or inactive.';
    END IF;

    IF v_user_role NOT IN ('System Administrator', 'HR Manager', 'Department Supervisor') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Authorization Error: User lacks permission to correct attendance logs.';
    END IF;

    -- 2. Timestamp Consistency Check
    IF p_new_check_in IS NOT NULL AND p_new_check_out IS NOT NULL THEN
        IF p_new_check_out < p_new_check_in THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Validation Error: Check-out time cannot precede check-in time.';
        END IF;

        SET v_diff_minutes = TIMESTAMPDIFF(MINUTE, p_new_check_in, p_new_check_out);
        SET v_calc_hours = ROUND(v_diff_minutes / 60.0, 2);

        IF v_calc_hours > 24.00 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Validation Error: Total working hours cannot exceed 24 hours in a single day.';
        END IF;

        -- Overtime: hours in excess of 8 standard daily hours
        IF v_calc_hours > 8.00 THEN
            SET v_calc_ot = ROUND(v_calc_hours - 8.00, 2);
        ELSE
            SET v_calc_ot = 0.00;
        END IF;
    END IF;

    -- ========================================================================
    -- ATOMIC TRANSACTION BLOCK
    -- ========================================================================
    START TRANSACTION;

    -- 3. Lock and retrieve current attendance record (Pessimistic concurrency)
    SELECT `Employee_ID`, `Work_Date`, `Check_In_Time`, `Check_Out_Time`,
           `Working_Hours`, `Overtime_Hours`, `Attendance_Status`
    INTO v_old_emp_id, v_old_date, v_old_in, v_old_out,
         v_old_hours, v_old_ot, v_old_status
    FROM `Attendance_Log`
    WHERE `Log_ID` = p_log_id
    FOR UPDATE;

    IF v_old_emp_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Attendance log record not found.';
    END IF;

    -- 4. Apply Correction
    UPDATE `Attendance_Log`
    SET `Check_In_Time` = p_new_check_in,
        `Check_Out_Time` = p_new_check_out,
        `Working_Hours` = v_calc_hours,
        `Overtime_Hours` = v_calc_ot,
        `Attendance_Status` = COALESCE(p_new_status, v_old_status),
        `Remarks` = CONCAT('Corrected by Admin: ', COALESCE(p_reason, 'Manual adjustment'))
    WHERE `Log_ID` = p_log_id;

    -- 5. Record System Audit Trail with structured JSON deltas
    INSERT INTO `System_Audit_Log` (
        `Table_Name`,
        `Operation_Type`,
        `Record_ID`,
        `Changed_By_User`,
        `Action_Timestamp`,
        `Old_Values`,
        `New_Values`,
        `Description`
    ) VALUES (
        'Attendance_Log',
        'UPDATE',
        CAST(p_log_id AS CHAR),
        p_corrected_by_user_id,
        NOW(6),
        JSON_OBJECT(
            'Check_In_Time', v_old_in,
            'Check_Out_Time', v_old_out,
            'Working_Hours', v_old_hours,
            'Overtime_Hours', v_old_ot,
            'Attendance_Status', v_old_status
        ),
        JSON_OBJECT(
            'Check_In_Time', p_new_check_in,
            'Check_Out_Time', p_new_check_out,
            'Working_Hours', v_calc_hours,
            'Overtime_Hours', v_calc_ot,
            'Attendance_Status', COALESCE(p_new_status, v_old_status)
        ),
        CONCAT('Attendance correction for Emp ID ', v_old_emp_id, ' Date ', v_old_date, '. Reason: ', COALESCE(p_reason, 'Manual adjustment'))
    );

    -- 6. Commit atomic correction
    COMMIT;

    SET p_out_working_hours = v_calc_hours;
    SET p_out_overtime_hours = v_calc_ot;
    SET p_out_status = 'SUCCESS: Attendance Log Corrected';
END proc_body$$

DELIMITER ;
