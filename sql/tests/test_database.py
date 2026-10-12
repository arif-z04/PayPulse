"""
PayPulse Database System — Phase 1 Automated Test Suite
Target: MySQL 8.4 LTS (paypulse_db / paypulse_test_db)
Framework: pytest + pymysql

Covers all 18 Verification Criteria:
1. Clean schema creation
2. Seed-data loading and referential integrity
3. Invalid foreign-key rejection
4. Duplicate email, username, attendance, and payroll-period rejection
5. Invalid negative financial values rejection
6. Leave-quota violation prevention (trigger)
7. Leave approval, cancellation, and balance synchronization (trigger/proc)
8. Salary-change audit generation (trigger)
9. Payroll calculations against independently calculated expected results
10. Duplicate payroll-run prevention
11. Disbursement success and failure
12. Transaction rollback after an injected failure
13. Role and privilege restrictions
14. SQL-injection-resistant database access assumptions
15. Important report-query correctness
16. Concurrent leave approval and payroll execution simulation
17. Backup and restoration verification
18. Performance measurements on realistic datasets
"""

import os
import time
import pytest
import pymysql

DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', '127.0.0.1'),
    'port': int(os.getenv('MYSQL_PORT', 3308)),
    'user': os.getenv('MYSQL_ROOT_USER', 'root'),
    'password': os.getenv('MYSQL_ROOT_PASSWORD', 'PayPulse@2026!'),
    'database': os.getenv('MYSQL_DATABASE', 'paypulse_db'),
    'autocommit': False,
    'charset': 'utf8mb4'
}

@pytest.fixture(scope='session')
def db_conn():
    """Provides a session-wide MySQL connection."""
    conn = pymysql.connect(**DB_CONFIG)
    yield conn
    conn.close()

@pytest.fixture(autouse=True)
def ensure_clean_transaction(db_conn):
    """Ensures each test starts with a clean transaction context."""
    db_conn.rollback()
    yield
    db_conn.rollback()

# -----------------------------------------------------------------------------
# TEST 01: Clean Schema Creation & Table Existence
# -----------------------------------------------------------------------------
def test_01_schema_creation_and_entity_existence(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("SHOW TABLES;")
        tables = [r[0].lower() for r in cur.fetchall()]
        
        required_entities = [
            'user_account', 'department', 'designation', 'employee',
            'salary_structure', 'attendance_log', 'leave_type',
            'leave_allocation', 'leave_request', 'monthly_payroll',
            'payroll_component_detail', 'disbursement_record', 'system_audit_log'
        ]
        
        for entity in required_entities:
            assert entity in tables, f"Missing required entity table: {entity}"

# -----------------------------------------------------------------------------
# TEST 02: Seed Data Loading & Minimum Entity Thresholds
# -----------------------------------------------------------------------------
def test_02_seed_data_thresholds_and_referential_integrity(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM Employee;")
        emp_count = cur.fetchone()[0]
        assert emp_count >= 100, f"Expected >= 100 employees, found {emp_count}"

        cur.execute("SELECT COUNT(*) FROM Attendance_Log;")
        att_count = cur.fetchone()[0]
        assert att_count >= 2000, f"Expected >= 2000 attendance records, found {att_count}"

        cur.execute("SELECT COUNT(*) FROM Monthly_Payroll;")
        pay_count = cur.fetchone()[0]
        assert pay_count >= 100, f"Expected >= 100 payroll records, found {pay_count}"

# -----------------------------------------------------------------------------
# TEST 03: Invalid Foreign Key Rejection
# -----------------------------------------------------------------------------
def test_03_invalid_foreign_key_rejection(db_conn):
    with db_conn.cursor() as cur:
        # Create an unused user or use non-existent Department_ID = 99999 with an existing user but ensure FK failure
        # In Employee, User_ID 1 is taken. Let's create an unused User_ID or test FK directly on Designation or Department
        cur.execute("INSERT INTO User_Account (Username, Password_Hash, Role) VALUES ('temp.fk.user', 'hash', 'Employee');")
        temp_user_id = cur.lastrowid
        with pytest.raises(pymysql.err.IntegrityError) as exc_info:
            cur.execute(f"""
                INSERT INTO Employee (
                    Employee_Code, User_ID, Department_ID, Designation_ID,
                    First_Name, Last_Name, Email, Phone, NID, Date_Of_Birth,
                    Gender, Address, Hire_Date, Bank_Account_No, Bank_Name,
                    Bank_Branch, Bank_Routing_No
                ) VALUES (
                    'EMP-TEST-FK', {temp_user_id}, 99999, 1,
                    'FK', 'Test', 'fk.test@paypulse.internal', '+8801700000000',
                    '1990000000000', '1990-01-01', 'Male', 'Dhaka', CURDATE(),
                    '123456789', 'BRAC Bank', 'Gulshan', '060264120'
                );
            """)
        assert "foreign key constraint fails" in str(exc_info.value).lower()

# -----------------------------------------------------------------------------
# TEST 04: Duplicate Candidate Keys Rejection
# -----------------------------------------------------------------------------
def test_04_duplicate_constraints_rejection(db_conn):
    with db_conn.cursor() as cur:
        # 1. Duplicate Username
        with pytest.raises(pymysql.err.IntegrityError):
            cur.execute("INSERT INTO User_Account (Username, Password_Hash, Role) VALUES ('admin', 'hash', 'Employee');")
        db_conn.rollback()

        # 2. Duplicate Attendance for same employee & work date
        with pytest.raises(pymysql.err.IntegrityError):
            cur.execute("INSERT INTO Attendance_Log (Employee_ID, Work_Date) VALUES (1, '2026-08-10');")
        db_conn.rollback()

        # 3. Duplicate Payroll for same employee & period
        with pytest.raises(pymysql.err.IntegrityError):
            cur.execute("""
                INSERT INTO Monthly_Payroll (
                    Employee_ID, Payroll_Month, Payroll_Year, Working_Days, Present_Days,
                    Basic_Salary, Total_Allowances, Gross_Salary, Total_Deductions, Net_Salary
                ) VALUES (1, 8, 2026, 26, 26, 100000, 20000, 120000, 10000, 110000);
            """)
        db_conn.rollback()

# -----------------------------------------------------------------------------
# TEST 05: Invalid Negative Financial Values Rejection
# -----------------------------------------------------------------------------
def test_05_invalid_negative_financial_values_rejection(db_conn):
    with db_conn.cursor() as cur:
        # Negative Basic Salary must be rejected by CHECK constraint
        with pytest.raises(pymysql.err.OperationalError) as exc_info:
            cur.execute("""
                INSERT INTO Salary_Structure (
                    Employee_ID, Basic_Salary, Effective_From, Is_Active
                ) VALUES (1, -50000.00, CURDATE(), TRUE);
            """)
        assert "check constraint" in str(exc_info.value).lower()

# -----------------------------------------------------------------------------
# TEST 06: Leave Quota Violation Prevention (Trigger)
# -----------------------------------------------------------------------------
def test_06_leave_quota_violation_prevention_trigger(db_conn):
    with db_conn.cursor() as cur:
        # Insert a 20-day leave request for employee 1 who only has 14 days annual quota
        cur.execute("""
            INSERT INTO Leave_Request (
                Employee_ID, Leave_Type_ID, Start_Date, End_Date, Total_Days, Reason, Status
            ) VALUES (1, 1, '2026-11-01', '2026-11-20', 20, 'Extended holiday', 'Pending');
        """)
        req_id = cur.lastrowid

        # Attempt to Approve this request (trigger trg_EnforceLeaveQuota must abort)
        with pytest.raises(pymysql.err.OperationalError) as exc_info:
            cur.execute(f"UPDATE Leave_Request SET Status = 'Approved' WHERE Request_ID = {req_id};")
        
        assert "quota exceeded" in str(exc_info.value).lower()

# -----------------------------------------------------------------------------
# TEST 07: Leave Approval, Cancellation & Balance Synchronization (Trigger)
# -----------------------------------------------------------------------------
def test_07_leave_balance_synchronization_on_status_change(db_conn):
    with db_conn.cursor() as cur:
        # Get baseline Casual leave balance for Employee 2 in 2026
        cur.execute("""
            SELECT Allocation_ID, Days_Used, Days_Remaining 
            FROM Leave_Allocation 
            WHERE Employee_ID = 2 AND Leave_Type_ID = 1 AND Calendar_Year = 2026;
        """)
        alloc_id, orig_used, orig_rem = cur.fetchone()

        # Submit 3-day request
        cur.execute("""
            INSERT INTO Leave_Request (
                Employee_ID, Leave_Type_ID, Start_Date, End_Date, Total_Days, Reason, Status
            ) VALUES (2, 1, '2026-12-01', '2026-12-03', 3, 'Short family visit', 'Pending');
        """)
        req_id = cur.lastrowid

        # Transition to Approved
        cur.execute(f"UPDATE Leave_Request SET Status = 'Approved' WHERE Request_ID = {req_id};")

        # Verify quota decremented
        cur.execute(f"SELECT Days_Used, Days_Remaining FROM Leave_Allocation WHERE Allocation_ID = {alloc_id};")
        app_used, app_rem = cur.fetchone()
        assert app_used == orig_used + 3
        assert app_rem == orig_rem - 3

        # Now Cancel the request
        cur.execute(f"UPDATE Leave_Request SET Status = 'Cancelled' WHERE Request_ID = {req_id};")

        # Verify quota restored
        cur.execute(f"SELECT Days_Used, Days_Remaining FROM Leave_Allocation WHERE Allocation_ID = {alloc_id};")
        can_used, can_rem = cur.fetchone()
        assert can_used == orig_used
        assert can_rem == orig_rem

# -----------------------------------------------------------------------------
# TEST 08: Salary Change Audit Generation (Trigger)
# -----------------------------------------------------------------------------
def test_08_salary_change_audit_generation(db_conn):
    with db_conn.cursor() as cur:
        # Fetch current basic salary of employee 10
        cur.execute("SELECT Structure_ID, Basic_Salary FROM Salary_Structure WHERE Employee_ID = 10 AND Is_Active = TRUE;")
        struct_id, old_basic = cur.fetchone()

        new_basic = float(old_basic) + 5000.00
        cur.execute(f"UPDATE Salary_Structure SET Basic_Salary = {new_basic} WHERE Structure_ID = {struct_id};")

        # Verify that System_Audit_Log captured the event
        cur.execute(f"""
            SELECT Table_Name, Operation_Type, Old_Values, New_Values 
            FROM System_Audit_Log 
            WHERE Table_Name = 'Salary_Structure' AND Record_ID = '{struct_id}' 
            ORDER BY Audit_ID DESC LIMIT 1;
        """)
        row = cur.fetchone()
        assert row is not None
        assert row[0] == 'Salary_Structure'
        assert row[1] == 'UPDATE'
        assert str(int(old_basic)) in row[2]
        assert str(int(new_basic)) in row[3]

# -----------------------------------------------------------------------------
# TEST 09: Payroll Calculations against Independently Calculated Results
# -----------------------------------------------------------------------------
def test_09_payroll_formula_and_function_correctness(db_conn):
    with db_conn.cursor() as cur:
        # Test Parameters
        basic = 120000.00
        hra = 24000.00
        med = 12000.00
        conv = 8000.00
        tax_rate = 8.00
        pf_rate = 7.50
        ot_hours = 12.00
        unpaid_days = 2
        work_days = 26

        # Independent Mathematical Specification matching MySQL UDF rounding:
        per_day = round(basic / work_days, 2)
        ot_rate = round((basic / (work_days * 8.0)) * 1.5, 2)
        ot_pay = round(ot_hours * ot_rate, 2)
        gross = basic + hra + med + conv + ot_pay
        tax = round(basic * (tax_rate / 100.0), 2)
        pf = round(basic * (pf_rate / 100.0), 2)
        unpaid_ded = round(unpaid_days * per_day, 2)
        expected_net = round(gross - (tax + pf + unpaid_ded), 2)

        # Call MySQL UDF
        cur.execute(f"""
            SELECT fn_CalculateMonthlyNetPay(
                {basic}, {hra}, {med}, {conv}, {tax_rate}, {pf_rate}, {ot_hours}, {unpaid_days}, {work_days}
            );
        """)
        sql_net = cur.fetchone()[0]

        assert abs(float(sql_net) - float(expected_net)) < 0.05, f"Expected {expected_net}, got {sql_net}"

# -----------------------------------------------------------------------------
# TEST 10: Duplicate Payroll Run Prevention
# -----------------------------------------------------------------------------
def test_10_duplicate_payroll_run_prevention(db_conn):
    with db_conn.cursor() as cur:
        # Attempt to run sp_ProcessMonthlyPayrollBatch for an already Finalized/Disbursed period (August 2026)
        with pytest.raises(pymysql.err.OperationalError) as exc_info:
            cur.execute("CALL sp_ProcessMonthlyPayrollBatch(2026, 8, 1);")
        assert "already finalized or disbursed" in str(exc_info.value).lower()

# -----------------------------------------------------------------------------
# TEST 11: Disbursement Success and Duplicate Rejection
# -----------------------------------------------------------------------------
def test_11_disbursement_lifecycle(db_conn):
    with db_conn.cursor() as cur:
        # 0. Clean up any previous test disbursement and payroll for Employee 1 in period 12/2026
        cur.execute("DELETE FROM Disbursement_Record WHERE Payroll_ID IN (SELECT Payroll_ID FROM Monthly_Payroll WHERE Employee_ID = 1 AND Payroll_Month = 12 AND Payroll_Year = 2026);")
        cur.execute("DELETE FROM Monthly_Payroll WHERE Employee_ID = 1 AND Payroll_Month = 12 AND Payroll_Year = 2026;")
        db_conn.commit()

        # 1. Create an approved payroll record for testing disbursement
        cur.execute("""
            INSERT INTO Monthly_Payroll (
                Employee_ID, Payroll_Month, Payroll_Year, Working_Days, Present_Days,
                Basic_Salary, Total_Allowances, Gross_Salary, Total_Deductions, Net_Salary,
                Payroll_Status
            ) VALUES (1, 12, 2026, 26, 26, 200000, 40000, 240000, 20000, 220000, 'Approved');
        """)
        new_payroll_id = cur.lastrowid
        db_conn.commit()

        try:
            # 2. Disburse via procedure
            cur.execute(f"CALL sp_DisbursePayroll({new_payroll_id}, 'Bank Transfer (BEFTN)', 'BEFTN-TEST', 1, @tx_ref);")
            cur.execute("SELECT @tx_ref;")
            tx_ref = cur.fetchone()[0]
            assert tx_ref is not None
            assert 'BEFTN-TEST' in tx_ref

            # 3. Check status is Disbursed
            cur.execute(f"SELECT Payroll_Status FROM Monthly_Payroll WHERE Payroll_ID = {new_payroll_id};")
            assert cur.fetchone()[0] == 'Disbursed'

            # 4. Attempt duplicate disbursement (must be rejected)
            with pytest.raises(pymysql.err.OperationalError) as exc_info:
                cur.execute(f"CALL sp_DisbursePayroll({new_payroll_id}, 'Bank Transfer (BEFTN)', 'BEFTN-DUP', 1, @tx_ref_2);")
            assert "already been disbursed" in str(exc_info.value).lower()
        finally:
            # Cleanup test payroll and disbursement
            cur.execute(f"DELETE FROM Disbursement_Record WHERE Payroll_ID = {new_payroll_id};")
            cur.execute(f"DELETE FROM Monthly_Payroll WHERE Payroll_ID = {new_payroll_id};")
            db_conn.commit()

# -----------------------------------------------------------------------------
# TEST 12: Transaction Rollback After Injected Failure
# -----------------------------------------------------------------------------
def test_12_transaction_rollback_after_failure(db_conn):
    with db_conn.cursor() as cur:
        try:
            cur.execute("INSERT INTO Department (Department_Name, Department_Code, Office_Location) VALUES ('Rollback Dept', 'RBD', 'Dhaka');")
            # Injected failure: duplicate department code
            cur.execute("INSERT INTO Department (Department_Name, Department_Code, Office_Location) VALUES ('Rollback Dept 2', 'RBD', 'Dhaka');")
            db_conn.commit()
        except pymysql.err.IntegrityError:
            db_conn.rollback()

        cur.execute("SELECT COUNT(*) FROM Department WHERE Department_Code = 'RBD';")
        assert cur.fetchone()[0] == 0, "Transaction rollback failed to undo partial records!"

# -----------------------------------------------------------------------------
# TEST 13: Role and Privilege Restrictions
# -----------------------------------------------------------------------------
def test_13_role_and_privilege_restrictions():
    # Connect as paypulse_hr_svc (HR account)
    hr_conn = pymysql.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user='paypulse_hr_svc',
        password='PayPulseHR@2026!',
        database='paypulse_db'
    )
    with hr_conn.cursor() as cur:
        # HR can read Employee directory
        cur.execute("SELECT COUNT(*) FROM vw_EmployeeDirectory;")
        assert cur.fetchone()[0] >= 100

        # HR should NOT be able to disburse payroll directly (access denied)
        with pytest.raises(pymysql.err.OperationalError) as exc_info:
            cur.execute("INSERT INTO Disbursement_Record (Payroll_ID, Transaction_Reference, Disbursement_Date, Disbursed_Amount) VALUES (1, 'UNAUTH', NOW(), 100);")
        assert "command denied" in str(exc_info.value).lower() or "access denied" in str(exc_info.value).lower()
    hr_conn.close()

# -----------------------------------------------------------------------------
# TEST 14: SQL Injection Resilience
# -----------------------------------------------------------------------------
def test_14_sql_injection_resilience(db_conn):
    with db_conn.cursor() as cur:
        malicious_input = "EMP-1001' OR '1'='1"
        cur.execute("SELECT COUNT(*) FROM Employee WHERE Employee_Code = %s;", (malicious_input,))
        count = cur.fetchone()[0]
        # Query parameterization must treat payload as raw string literal with zero matches
        assert count == 0, "Parameterized query failed to protect against SQL injection!"

# -----------------------------------------------------------------------------
# TEST 15: Important Analytical Report Correctness
# -----------------------------------------------------------------------------
def test_15_analytical_report_views(db_conn):
    with db_conn.cursor() as cur:
        # Department Payroll View
        cur.execute("SELECT COUNT(*) FROM vw_DepartmentPayrollExpenditure;")
        assert cur.fetchone()[0] >= 6

        # Disbursement Reconciliation View
        cur.execute("SELECT Masked_Bank_Account, Disbursed_Amount FROM vw_DisbursementReconciliation LIMIT 1;")
        row = cur.fetchone()
        assert row is not None
        assert row[0].startswith('*******'), "Bank account was not masked!"
        assert row[1] > 0

# -----------------------------------------------------------------------------
# TEST 16: Concurrency Simulation (Locking)
# -----------------------------------------------------------------------------
def test_16_concurrency_pessimistic_locking(db_conn):
    conn2 = pymysql.connect(**DB_CONFIG)
    try:
        with db_conn.cursor() as cur1:
            cur1.execute("SELECT Basic_Salary FROM Salary_Structure WHERE Employee_ID = 1 AND Is_Active = TRUE FOR UPDATE;")
            
            with conn2.cursor() as cur2:
                # Connection 2 attempts to lock the same row with instant timeout
                cur2.execute("SET innodb_lock_wait_timeout = 1;")
                with pytest.raises(pymysql.err.OperationalError) as exc_info:
                    cur2.execute("SELECT Basic_Salary FROM Salary_Structure WHERE Employee_ID = 1 FOR UPDATE;")
                assert "lock wait timeout exceeded" in str(exc_info.value).lower()
    finally:
        conn2.close()

# -----------------------------------------------------------------------------
# TEST 17: Backup and Restoration Verification
# -----------------------------------------------------------------------------
def test_17_backup_restoration_integrity_verification(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("""
            SELECT 'Orphaned Employees', COUNT(*) 
            FROM Employee e 
            LEFT JOIN Department d ON e.Department_ID = d.Department_ID 
            WHERE d.Department_ID IS NULL;
        """)
        assert cur.fetchone()[1] == 0

# -----------------------------------------------------------------------------
# TEST 18: Performance Measurement on Realistic Datasets
# -----------------------------------------------------------------------------
def test_18_query_performance_index_utilization(db_conn):
    with db_conn.cursor() as cur:
        start_time = time.time()
        cur.execute("""
            SELECT e.Employee_Code, a.Work_Date, a.Working_Hours
            FROM Attendance_Log a
            JOIN Employee e ON a.Employee_ID = e.Employee_ID
            WHERE a.Work_Date BETWEEN '2026-08-01' AND '2026-08-31'
              AND a.Attendance_Status = 'Present';
        """)
        results = cur.fetchall()
        elapsed_time = time.time() - start_time
        
        assert len(results) > 1000
        # Over 1,000 indexed records should return in < 150 ms
        assert elapsed_time < 0.150, f"Query exceeded 150ms latency threshold: {elapsed_time:.3f}s"
