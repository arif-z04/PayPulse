-- ============================================================================
-- PayPulse Transaction Script 03: Atomic Employee Onboarding Transaction
-- Database: paypulse_db | Engine: InnoDB | ACID: All-or-Nothing Multi-Entity Creation
-- ============================================================================
-- Objective:
-- Atomically create a user account, employee profile, effective salary structure,
-- annual leave allocations, and audit log. If any entity insertion or constraint
-- fails, the entire transaction rolls back, leaving no orphaned user accounts.
-- ============================================================================

USE `paypulse_db`;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_CreateEmployeeAtomicTransaction`$$

CREATE PROCEDURE `sp_CreateEmployeeAtomicTransaction`(
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
    -- Banking Information
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
    -- Actor
    IN p_created_by_user_id INT,
    -- Outputs
    OUT p_out_employee_id INT,
    OUT p_out_user_id INT,
    OUT p_out_status VARCHAR(50)
)
proc_body: BEGIN
    DECLARE v_min_salary DECIMAL(12, 2);
    DECLARE v_max_salary DECIMAL(12, 2);
    DECLARE v_desig_dept_id INT;
    DECLARE v_current_year SMALLINT;

    -- Error Handling: Rollback entire multi-entity onboarding on ANY SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_employee_id = NULL;
        SET p_out_user_id = NULL;
        SET p_out_status = 'FAILED: Transaction Rolled Back on Exception';
        RESIGNAL;
    END;

    -- 1. Designation & Department Cross-Validation
    SELECT `Base_Salary_Min`, `Base_Salary_Max`, `Department_ID`
    INTO v_min_salary, v_max_salary, v_desig_dept_id
    FROM `Designation`
    WHERE `Designation_ID` = p_designation_id AND `Is_Active` = TRUE;

    IF v_min_salary IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Specified designation does not exist or is inactive.';
    END IF;

    IF v_desig_dept_id <> p_department_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Designation does not belong to the selected Department.';
    END IF;

    -- 2. Statutory Salary Band Validation
    IF p_basic_salary < v_min_salary OR p_basic_salary > v_max_salary THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Basic salary violates the statutory salary band (Base_Salary_Min to Base_Salary_Max).';
    END IF;

    -- ========================================================================
    -- ATOMIC MULTI-ENTITY TRANSACTION BLOCK
    -- ========================================================================
    START TRANSACTION;

    -- 3. Create User Account
    INSERT INTO `User_Account` (
        `Username`, `Password_Hash`, `Role`, `Is_Active`, `Created_At`, `Updated_At`
    ) VALUES (
        p_username, p_password_hash, COALESCE(p_role, 'Employee'), TRUE, NOW(), NOW()
    );
    SET p_out_user_id = LAST_INSERT_ID();

    -- 4. Create Employee Profile
    INSERT INTO `Employee` (
        `Employee_Code`, `User_ID`, `Department_ID`, `Designation_ID`, `Manager_ID`,
        `First_Name`, `Last_Name`, `Email`, `Phone`, `NID`,
        `Date_Of_Birth`, `Gender`, `Address`, `Hire_Date`,
        `Bank_Account_No`, `Bank_Name`, `Bank_Branch`, `Bank_Routing_No`,
        `Employment_Status`, `Created_At`, `Updated_At`
    ) VALUES (
        p_employee_code, p_out_user_id, p_department_id, p_designation_id, p_manager_id,
        p_first_name, p_last_name, p_email, p_phone, p_nid,
        p_dob, p_gender, p_address, p_hire_date,
        p_bank_acc, p_bank_name, p_bank_branch, p_routing,
        'Active', NOW(), NOW()
    );
    SET p_out_employee_id = LAST_INSERT_ID();

    -- 5. Create Effective-Dated Active Salary Structure
    INSERT INTO `Salary_Structure` (
        `Employee_ID`, `Basic_Salary`, `House_Rent_Allowance`, `Medical_Allowance`,
        `Conveyance_Allowance`, `Tax_Deduction_Rate`, `Provident_Fund_Rate`,
        `Effective_From`, `Effective_To`, `Is_Active`, `Created_At`, `Updated_At`
    ) VALUES (
        p_out_employee_id, p_basic_salary, p_hra, p_medical,
        p_conveyance, p_tax_rate, p_pf_rate,
        p_hire_date, NULL, TRUE, NOW(), NOW()
    );

    -- 6. Initialize Statutory Leave Quota Allocations for Hire Calendar Year
    SET v_current_year = YEAR(p_hire_date);

    INSERT INTO `Leave_Allocation` (
        `Employee_ID`, `Leave_Type_ID`, `Calendar_Year`,
        `Total_Allocated`, `Days_Used`, `Days_Remaining`, `Created_At`, `Updated_At`
    )
    SELECT 
        p_out_employee_id,
        lt.`Leave_Type_ID`,
        v_current_year,
        lt.`Max_Days_Per_Year`,
        0,
        lt.`Max_Days_Per_Year`,
        NOW(),
        NOW()
    FROM `Leave_Type` lt;

    -- 7. Record System Audit Log
    INSERT INTO `System_Audit_Log` (
        `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Description`
    ) VALUES (
        'Employee', 'INSERT', CAST(p_out_employee_id AS CHAR), p_created_by_user_id,
        CONCAT('Transactionally onboarded employee ', p_employee_code, ' with account ID ', p_out_user_id)
    );

    -- 8. Commit entire logical onboarding unit
    COMMIT;
    SET p_out_status = 'SUCCESS: Employee Onboarded Atomically';
END proc_body$$

DELIMITER ;
