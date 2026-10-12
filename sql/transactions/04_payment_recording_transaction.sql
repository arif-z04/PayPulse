-- ============================================================================
-- PayPulse Transaction Script 04: Payment Recording Transaction
-- Database: paypulse_db | Engine: InnoDB | Domain: Financial Disbursements
-- ============================================================================
-- Objective:
-- Atomically record an electronic salary disbursement (BEFTN/Direct Deposit),
-- update the monthly payroll status to 'Disbursed', generate a cryptographically
-- unique transaction reference, enforce idempotency, and log audit history.
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_RecordPaymentTransaction`$$

CREATE PROCEDURE `sp_RecordPaymentTransaction`(
    IN p_payroll_id INT,
    IN p_payment_method VARCHAR(50),
    IN p_custom_txn_reference VARCHAR(100),
    IN p_disbursed_by_user_id INT,
    IN p_remarks VARCHAR(255),
    OUT p_out_txn_reference VARCHAR(100),
    OUT p_out_disbursed_amount DECIMAL(12, 2),
    OUT p_out_status VARCHAR(50)
)
proc_body: BEGIN
    DECLARE v_payroll_status VARCHAR(20);
    DECLARE v_net_salary DECIMAL(12, 2);
    DECLARE v_existing_disbursement_count INT DEFAULT 0;
    DECLARE v_txn_ref VARCHAR(100);

    -- Error Handling: Rollback on any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_txn_reference = NULL;
        SET p_out_disbursed_amount = 0.00;
        SET p_out_status = 'FAILED: Transaction Rolled Back on Exception';
        RESIGNAL;
    END;

    -- ========================================================================
    -- ATOMIC FINANCIAL SETTLEMENT BLOCK
    -- ========================================================================
    START TRANSACTION;

    -- 1. Lock and inspect the target Monthly_Payroll row (Pessimistic concurrency)
    SELECT `Payroll_Status`, `Net_Salary`
    INTO v_payroll_status, v_net_salary
    FROM `Monthly_Payroll`
    WHERE `Payroll_ID` = p_payroll_id
    FOR UPDATE;

    IF v_payroll_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Monthly payroll voucher record does not exist.';
    END IF;

    -- 2. State Eligibility Verification
    IF v_payroll_status = 'Disbursed' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate Payment Error: Payroll voucher has already been disbursed.';
    END IF;

    IF v_payroll_status NOT IN ('Approved', 'Finalized', 'Generated') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Business Rule Violation: Payroll voucher must be Approved or Finalized before disbursement.';
    END IF;

    -- 3. Verify no existing disbursement record exists for this payroll voucher
    SELECT COUNT(*) INTO v_existing_disbursement_count
    FROM `Disbursement_Record`
    WHERE `Payroll_ID` = p_payroll_id;

    IF v_existing_disbursement_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: A disbursement ledger entry already exists for this payroll ID.';
    END IF;

    -- 4. Generate or validate Transaction Reference (Idempotency Key)
    IF p_custom_txn_reference IS NOT NULL AND CHAR_LENGTH(TRIM(p_custom_txn_reference)) > 0 THEN
        SET v_txn_ref = TRIM(p_custom_txn_reference);
    ELSE
        SET v_txn_ref = CONCAT(
            'BEFTN-',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-P',
            LPAD(p_payroll_id, 6, '0'),
            '-',
            FLOOR(1000 + (RAND() * 9000))
        );
    END IF;

    -- 5. Insert Electronic Disbursement Settlement Record
    INSERT INTO `Disbursement_Record` (
        `Payroll_ID`,
        `Payment_Method`,
        `Transaction_Reference`,
        `Disbursement_Date`,
        `Disbursement_Status`,
        `Disbursed_Amount`,
        `Remarks`,
        `Disbursed_By_User_ID`,
        `Created_At`,
        `Updated_At`
    ) VALUES (
        p_payroll_id,
        COALESCE(p_payment_method, 'Bank Transfer (BEFTN)'),
        v_txn_ref,
        NOW(),
        'Disbursed',
        v_net_salary,
        COALESCE(p_remarks, 'Electronic Fund Transfer settled successfully via BEFTN network'),
        p_disbursed_by_user_id,
        NOW(),
        NOW()
    );

    -- 6. Update Monthly_Payroll status and finalization date
    UPDATE `Monthly_Payroll`
    SET `Payroll_Status` = 'Disbursed',
        `Finalized_Date` = COALESCE(`Finalized_Date`, NOW()),
        `Updated_At` = NOW()
    WHERE `Payroll_ID` = p_payroll_id;

    -- 7. Record System Audit Trail
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Disbursement_Record', 'INSERT', v_txn_ref, p_disbursed_by_user_id,
        CONCAT('Disbursed BDT ', v_net_salary, ' for Payroll Voucher #', p_payroll_id, ' via ', COALESCE(p_payment_method, 'BEFTN'))
    );

    -- 8. Commit entire financial transaction
    COMMIT;

    SET p_out_txn_reference = v_txn_ref;
    SET p_out_disbursed_amount = v_net_salary;
    SET p_out_status = 'SUCCESS: Payment Recorded and Disbursed';
END proc_body$$

DELIMITER ;
