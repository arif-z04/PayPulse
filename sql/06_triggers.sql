-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 06: Active Database Integrity & Audit Triggers
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Dialect: Native MySQL BEFORE/AFTER triggers with JSON deltas and signals
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. Trigger: trg_AuditSalaryModifications
-- Fires AFTER UPDATE on Salary_Structure. Captures before and after values
-- as structured JSON into System_Audit_Log whenever basic salary, allowances,
-- or withholding rates are modified.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_AuditSalaryModifications`$$
CREATE TRIGGER `trg_AuditSalaryModifications`
AFTER UPDATE ON `Salary_Structure`
FOR EACH ROW
BEGIN
    -- Check if any financial terms or tax/PF rates were actually changed
    IF (OLD.`Basic_Salary` <> NEW.`Basic_Salary`
        OR OLD.`House_Rent_Allowance` <> NEW.`House_Rent_Allowance`
        OR OLD.`Medical_Allowance` <> NEW.`Medical_Allowance`
        OR OLD.`Conveyance_Allowance` <> NEW.`Conveyance_Allowance`
        OR OLD.`Tax_Deduction_Rate` <> NEW.`Tax_Deduction_Rate`
        OR OLD.`Provident_Fund_Rate` <> NEW.`Provident_Fund_Rate`
        OR OLD.`Is_Active` <> NEW.`Is_Active`) THEN

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
            'Salary_Structure',
            'UPDATE',
            CAST(NEW.`Structure_ID` AS CHAR),
            NULL, -- Evaluated from session or backend user context
            NOW(6),
            JSON_OBJECT(
                'Basic_Salary', OLD.`Basic_Salary`,
                'House_Rent_Allowance', OLD.`House_Rent_Allowance`,
                'Medical_Allowance', OLD.`Medical_Allowance`,
                'Conveyance_Allowance', OLD.`Conveyance_Allowance`,
                'Tax_Deduction_Rate', OLD.`Tax_Deduction_Rate`,
                'Provident_Fund_Rate', OLD.`Provident_Fund_Rate`,
                'Is_Active', OLD.`Is_Active`
            ),
            JSON_OBJECT(
                'Basic_Salary', NEW.`Basic_Salary`,
                'House_Rent_Allowance', NEW.`House_Rent_Allowance`,
                'Medical_Allowance', NEW.`Medical_Allowance`,
                'Conveyance_Allowance', NEW.`Conveyance_Allowance`,
                'Tax_Deduction_Rate', NEW.`Tax_Deduction_Rate`,
                'Provident_Fund_Rate', NEW.`Provident_Fund_Rate`,
                'Is_Active', NEW.`Is_Active`
            ),
            CONCAT('Salary structure updated for Employee ID: ', NEW.`Employee_ID`)
        );
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 2. Trigger: trg_EnforceLeaveQuota
-- Fires BEFORE UPDATE on Leave_Request.
-- When a request status transitions to 'Approved', verifies that the employee's
-- allocation balance has sufficient remaining days. Rejects with custom SIGNAL.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_EnforceLeaveQuota`$$
CREATE TRIGGER `trg_EnforceLeaveQuota`
BEFORE UPDATE ON `Leave_Request`
FOR EACH ROW
BEGIN
    DECLARE v_days_remaining INT DEFAULT 0;
    DECLARE v_req_year SMALLINT;

    -- Only inspect when status changes from something non-Approved to 'Approved'
    IF OLD.`Status` <> 'Approved' AND NEW.`Status` = 'Approved' THEN
        SET v_req_year = YEAR(NEW.`Start_Date`);

        SELECT `Days_Remaining`
        INTO v_days_remaining
        FROM `Leave_Allocation`
        WHERE `Employee_ID` = NEW.`Employee_ID`
          AND `Leave_Type_ID` = NEW.`Leave_Type_ID`
          AND `Calendar_Year` = v_req_year
        LIMIT 1;

        IF v_days_remaining IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity Error: No leave allocation quota found for this employee and calendar year.';
        END IF;

        IF v_days_remaining < NEW.`Total_Days` THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Quota Exceeded: Insufficient remaining leave balance for this employee.';
        END IF;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 3. Trigger: trg_SyncLeaveAllocationOnStatusChange
-- Fires AFTER UPDATE on Leave_Request.
-- Synchronizes Days_Used and Days_Remaining in Leave_Allocation:
--   a) When transition Pending -> Approved: decrements remaining, increments used.
--   b) When transition Approved -> Cancelled: restores quota balance.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_SyncLeaveAllocationOnStatusChange`$$
CREATE TRIGGER `trg_SyncLeaveAllocationOnStatusChange`
AFTER UPDATE ON `Leave_Request`
FOR EACH ROW
BEGIN
    DECLARE v_req_year SMALLINT;
    SET v_req_year = YEAR(NEW.`Start_Date`);

    -- Scenario A: Newly Approved Request
    IF OLD.`Status` <> 'Approved' AND NEW.`Status` = 'Approved' THEN
        UPDATE `Leave_Allocation`
        SET `Days_Used` = `Days_Used` + NEW.`Total_Days`,
            `Days_Remaining` = `Days_Remaining` - NEW.`Total_Days`
        WHERE `Employee_ID` = NEW.`Employee_ID`
          AND `Leave_Type_ID` = NEW.`Leave_Type_ID`
          AND `Calendar_Year` = v_req_year;

    -- Scenario B: Cancellation of a previously Approved Request
    ELSEIF OLD.`Status` = 'Approved' AND NEW.`Status` = 'Cancelled' THEN
        UPDATE `Leave_Allocation`
        SET `Days_Used` = `Days_Used` - OLD.`Total_Days`,
            `Days_Remaining` = `Days_Remaining` + OLD.`Total_Days`
        WHERE `Employee_ID` = NEW.`Employee_ID`
          AND `Leave_Type_ID` = NEW.`Leave_Type_ID`
          AND `Calendar_Year` = v_req_year;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 4. Trigger: trg_ValidateAttendanceTimes
-- Fires BEFORE INSERT on Attendance_Log. Enforces that check-out cannot precede
-- check-in and calculates working hours if both timestamps are provided.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_ValidateAttendanceTimes`$$
CREATE TRIGGER `trg_ValidateAttendanceTimes`
BEFORE INSERT ON `Attendance_Log`
FOR EACH ROW
BEGIN
    IF NEW.`Check_In_Time` IS NOT NULL AND NEW.`Check_Out_Time` IS NOT NULL THEN
        IF NEW.`Check_Out_Time` < NEW.`Check_In_Time` THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Invalid Timestamps: Check-out time cannot precede check-in time.';
        END IF;

        -- Auto-calculate working hours if not provided or 0
        IF NEW.`Working_Hours` = 0.00 THEN
            SET NEW.`Working_Hours` = ROUND(TIMESTAMPDIFF(MINUTE, NEW.`Check_In_Time`, NEW.`Check_Out_Time`) / 60.0, 2);
            IF NEW.`Working_Hours` > 24.00 THEN
                SET NEW.`Working_Hours` = 24.00;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

