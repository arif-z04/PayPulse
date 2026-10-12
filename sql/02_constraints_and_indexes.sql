-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 02: Constraints, Foreign Keys & Performance Indexes
-- Database: paypulse_db
-- Storage Engine: InnoDB
-- Formalizes 16+ Relational Pathways and B-Tree Performance Indexes
-- ============================================================================

USE `paypulse_db`;

-- ============================================================================
-- PART 1: FOREIGN KEY CONSTRAINTS & REFERENTIAL INTEGRITY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Designation -> Department (1 : N)
-- Department offers multiple job designations.
-- Deleting a department with active designations is RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Designation`
    ADD CONSTRAINT `fk_designation_department`
    FOREIGN KEY (`Department_ID`)
    REFERENCES `Department` (`Department_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 2. Employee -> Department (1 : N)
-- Department employs multiple staff members.
-- Deleting an active department with employees is RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Employee`
    ADD CONSTRAINT `fk_employee_department`
    FOREIGN KEY (`Department_ID`)
    REFERENCES `Department` (`Department_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 3. Employee -> Designation (1 : N)
-- Designation classifies employees into standardized pay bands.
-- Deleting a designation assigned to employees is RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Employee`
    ADD CONSTRAINT `fk_employee_designation`
    FOREIGN KEY (`Designation_ID`)
    REFERENCES `Designation` (`Designation_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. Employee -> User_Account (1 : 1 Mandatory Relationship)
-- Login credential identity binds strictly to one employee profile.
-- If user account is purged, cascade deletion to profile.
-- ----------------------------------------------------------------------------
ALTER TABLE `Employee`
    ADD CONSTRAINT `fk_employee_user`
    FOREIGN KEY (`User_ID`)
    REFERENCES `User_Account` (`User_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 5. Employee -> Employee (Self-Referencing 1 : N Recursive Hierarchy)
-- Subordinate reports to a Manager. CEO / Executive director has Manager_ID = NULL.
-- If manager record is removed, subordinates' manager reference is SET NULL.
-- ----------------------------------------------------------------------------
ALTER TABLE `Employee`
    ADD CONSTRAINT `fk_employee_manager`
    FOREIGN KEY (`Manager_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 6. Department -> Employee (Circular 1 : 1 / 1 : N Head of Department)
-- Department head is an active employee.
-- If employee departs, Head_Of_Department_ID is SET NULL to prevent broken refs.
-- ----------------------------------------------------------------------------
ALTER TABLE `Department`
    ADD CONSTRAINT `fk_department_head`
    FOREIGN KEY (`Head_Of_Department_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 7. Salary_Structure -> Employee (1 : N Effective-Dated Compensation History)
-- Employee accumulates compensation versions over their career.
-- Cascade removal if employee profile is deleted.
-- ----------------------------------------------------------------------------
ALTER TABLE `Salary_Structure`
    ADD CONSTRAINT `fk_salary_structure_employee`
    FOREIGN KEY (`Employee_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 8. Attendance_Log -> Employee (1 : N Timekeeping Stream)
-- Daily biometric attendance entries belong to an employee.
-- ----------------------------------------------------------------------------
ALTER TABLE `Attendance_Log`
    ADD CONSTRAINT `fk_attendance_employee`
    FOREIGN KEY (`Employee_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 9. Leave_Allocation -> Employee (1 : N Quota Ledger)
-- Annual leave allocations per employee.
-- ----------------------------------------------------------------------------
ALTER TABLE `Leave_Allocation`
    ADD CONSTRAINT `fk_leave_allocation_employee`
    FOREIGN KEY (`Employee_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 10. Leave_Allocation -> Leave_Type (1 : N Policy Master)
-- Deleting a statutory leave type with active allocations is RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Leave_Allocation`
    ADD CONSTRAINT `fk_leave_allocation_type`
    FOREIGN KEY (`Leave_Type_ID`)
    REFERENCES `Leave_Type` (`Leave_Type_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 11. Leave_Request -> Employee (1 : N Application Stream)
-- Subordinate submits leave applications.
-- ----------------------------------------------------------------------------
ALTER TABLE `Leave_Request`
    ADD CONSTRAINT `fk_leave_request_employee`
    FOREIGN KEY (`Employee_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 12. Leave_Request -> Leave_Type (1 : N Policy Category)
-- Deleting leave type referenced by historical applications is RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Leave_Request`
    ADD CONSTRAINT `fk_leave_request_type`
    FOREIGN KEY (`Leave_Type_ID`)
    REFERENCES `Leave_Type` (`Leave_Type_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 13. Leave_Request -> User_Account (1 : N Approval Sign-off)
-- Approver is an authorized user (Supervisor, HR, Admin).
-- If approver user is removed, preserve history by setting to NULL.
-- ----------------------------------------------------------------------------
ALTER TABLE `Leave_Request`
    ADD CONSTRAINT `fk_leave_request_approver`
    FOREIGN KEY (`Approved_By_User_ID`)
    REFERENCES `User_Account` (`User_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 14. Monthly_Payroll -> Employee (1 : N Financial Ledger)
-- Critical Financial Integrity: Deleting an employee with finalized payroll
-- is RESTRICTED to prevent destroying historical tax and compensation records.
-- ----------------------------------------------------------------------------
ALTER TABLE `Monthly_Payroll`
    ADD CONSTRAINT `fk_monthly_payroll_employee`
    FOREIGN KEY (`Employee_ID`)
    REFERENCES `Employee` (`Employee_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 15. Monthly_Payroll -> User_Account (1 : N Processing Sign-off)
-- Track officer who triggered batch payroll run. SET NULL on user removal.
-- ----------------------------------------------------------------------------
ALTER TABLE `Monthly_Payroll`
    ADD CONSTRAINT `fk_monthly_payroll_user`
    FOREIGN KEY (`Generated_By_User_ID`)
    REFERENCES `User_Account` (`User_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 16. Payroll_Component_Detail -> Monthly_Payroll (1 : N Payslip Line Items)
-- Itemized additions/deductions belong to a monthly payroll record.
-- Cascades on payroll record deletion.
-- ----------------------------------------------------------------------------
ALTER TABLE `Payroll_Component_Detail`
    ADD CONSTRAINT `fk_payroll_component_payroll`
    FOREIGN KEY (`Payroll_ID`)
    REFERENCES `Monthly_Payroll` (`Payroll_ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 17. Disbursement_Record -> Monthly_Payroll (1 : 1 Settlement Link)
-- Electronic payment settlement record for finalized payroll.
-- Deleting payroll with active disbursement record is strictly RESTRICTED.
-- ----------------------------------------------------------------------------
ALTER TABLE `Disbursement_Record`
    ADD CONSTRAINT `fk_disbursement_payroll`
    FOREIGN KEY (`Payroll_ID`)
    REFERENCES `Monthly_Payroll` (`Payroll_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 18. Disbursement_Record -> User_Account (1 : N Settlement Officer)
-- Officer authorizing BEFTN disbursement. SET NULL on user deletion.
-- ----------------------------------------------------------------------------
ALTER TABLE `Disbursement_Record`
    ADD CONSTRAINT `fk_disbursement_user`
    FOREIGN KEY (`Disbursed_By_User_ID`)
    REFERENCES `User_Account` (`User_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 19. System_Audit_Log -> User_Account (1 : N Audit Subject)
-- Set to NULL if user is removed so historical audit trails remain immutable.
-- ----------------------------------------------------------------------------
ALTER TABLE `System_Audit_Log`
    ADD CONSTRAINT `fk_audit_user`
    FOREIGN KEY (`Changed_By_User`)
    REFERENCES `User_Account` (`User_ID`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


-- ============================================================================
-- PART 2: PERFORMANCE B-TREE INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Employee Entity Indexes
-- Optimize organizational filtering, manager hierarchy, and status filtering.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_employee_department_status`
    ON `Employee` (`Department_ID`, `Employment_Status`);

CREATE INDEX `idx_employee_designation_status`
    ON `Employee` (`Designation_ID`, `Employment_Status`);

CREATE INDEX `idx_employee_manager`
    ON `Employee` (`Manager_ID`);

CREATE INDEX `idx_employee_hire_date`
    ON `Employee` (`Hire_Date`);

-- ----------------------------------------------------------------------------
-- 2. Attendance_Log Indexes
-- Optimize daily biometric queries, monthly rollups, and late/absent tracking.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_attendance_workdate_status`
    ON `Attendance_Log` (`Work_Date`, `Attendance_Status`);

CREATE INDEX `idx_attendance_emp_date_status`
    ON `Attendance_Log` (`Employee_ID`, `Work_Date`, `Attendance_Status`);

-- ----------------------------------------------------------------------------
-- 3. Salary_Structure Indexes
-- Optimize effective-dated active structure lookup and employee history.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_salary_structure_emp_active`
    ON `Salary_Structure` (`Employee_ID`, `Is_Active`, `Effective_From`);

-- ----------------------------------------------------------------------------
-- 4. Leave Management Indexes
-- Optimize pending approval workflow queues, calendar allocations, and audits.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_leave_request_status_emp`
    ON `Leave_Request` (`Status`, `Employee_ID`);

CREATE INDEX `idx_leave_request_dates_status`
    ON `Leave_Request` (`Start_Date`, `End_Date`, `Status`);

CREATE INDEX `idx_leave_allocation_year_emp`
    ON `Leave_Allocation` (`Calendar_Year`, `Employee_ID`);

-- ----------------------------------------------------------------------------
-- 5. Monthly_Payroll Indexes
-- Optimize period lookups, batch finalization, and departmental cost aggregation.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_monthly_payroll_period_status`
    ON `Monthly_Payroll` (`Payroll_Year`, `Payroll_Month`, `Payroll_Status`);

CREATE INDEX `idx_monthly_payroll_emp_period`
    ON `Monthly_Payroll` (`Employee_ID`, `Payroll_Year`, `Payroll_Month`);

-- ----------------------------------------------------------------------------
-- 6. Payroll_Component_Detail Indexes
-- Optimize itemized payslip generation and component rollup queries.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_payroll_component_type_name`
    ON `Payroll_Component_Detail` (`Payroll_ID`, `Component_Type`, `Component_Name`);

-- ----------------------------------------------------------------------------
-- 7. Disbursement_Record Indexes
-- Optimize banking reconciliation and BEFTN batch settlement status reports.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_disbursement_status_date`
    ON `Disbursement_Record` (`Disbursement_Status`, `Disbursement_Date`);

-- ----------------------------------------------------------------------------
-- 8. System_Audit_Log Indexes
-- Optimize entity history audits and administrative timeline reviews.
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_audit_table_record`
    ON `System_Audit_Log` (`Table_Name`, `Record_ID`);

CREATE INDEX `idx_audit_timestamp_user`
    ON `System_Audit_Log` (`Action_Timestamp`, `Changed_By_User`);
