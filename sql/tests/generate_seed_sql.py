"""
Generator script to produce deterministic, high-quality, normalized seed data
for PayPulse MySQL Database System (sql/10_seed_test_data.sql).
Generates:
- 105 Employees & User Accounts with 5 RBAC roles
- Organizational reporting hierarchy (CEO -> Dept Heads -> Leads -> Staff)
- Active & historical Salary Structures within Designation pay bands
- Leave Allocations for 2026 (Casual, Medical, Earned)
- 2,500+ Daily Biometric Attendance Logs (July, August, September, October 2026)
- Diverse Leave Requests (Approved, Pending, Rejected, Cancelled)
- 3 Months of Finalized/Disbursed Monthly Payroll Records (July, August, September 2026)
- Granular Payroll Component Details for every payroll record
- Banking Disbursement Records (BEFTN settlement, Pending, Failed)
- Initial System Audit Logs
"""

import os
import random
from datetime import date, datetime, timedelta

# Set deterministic seed
random.seed(20261011)

# Realistic Bangladeshi Names
FIRST_NAMES_MALE = [
    "Tanvir", "Mahbubur", "Rafiqul", "Kabir", "Kamrul", "Nazmul", "Anisur", "Mohammad", 
    "Arif", "Zahid", "Tariq", "Saiful", "Mehedi", "Faisal", "Imran", "Hasan", "Shakil", 
    "Ashiq", "Mustafa", "Rashid", "Shahadat", "Jamil", "Sohail", "Nasir", "Enamul", 
    "Rashed", "Shafiq", "Mizanur", "Khaled", "Rezaul", "Masud", "Asaduzzaman", "Monirul",
    "Habibur", "Sharif", "Babar", "Farid", "Golam", "Abdur", "Harun", "Mahmud", "Sabbir"
]

FIRST_NAMES_FEMALE = [
    "Farzana", "Nusrat", "Sadia", "Sharmin", "Tasnim", "Nazneen", "Shamima", "Roksana", 
    "Sabrina", "Fariha", "Samira", "Tahmina", "Sultana", "Ayesha", "Fatema", "Afroza", 
    "Salma", "Nabila", "Shirin", "Dilruba", "Farhana", "Tanzila", "Mehnaz", "Rumana",
    "Jannatul", "Laila", "Maksuda", "Hasina", "Marufa", "Nasima", "Parveen", "Suraiya"
]

LAST_NAMES = [
    "Ahmed", "Rahman", "Islam", "Hossain", "Hassan", "Yeasmin", "Jahan", "Afroz", 
    "Sultana", "Chowdhury", "Khan", "Ali", "Sikder", "Miah", "Bhuiyan", "Akter", 
    "Khatun", "Talukder", "Mahmood", "Quader", "Begum", "Dewan", "Mallick", "Molla",
    "Howlader", "Majumder", "Tarafdar", "Pramanik", "Barua", "Sarker", "Patwary"
]

BANKS = [
    ("BRAC Bank PLC", "060264120", "Gulshan Branch"),
    ("Dutch-Bangla Bank PLC", "090261890", "Banani Branch"),
    ("The City Bank PLC", "225273180", "Kawran Bazar Branch"),
    ("Eastern Bank PLC", "095261399", "Principal Branch"),
    ("Mutual Trust Bank PLC", "145261234", "Dhanmondi Branch"),
    ("Prime Bank PLC", "170261567", "Uttara Branch"),
    ("Dhaka Bank PLC", "085261899", "Mohakhali Branch")
]

# Standard BCrypt hash for development demo accounts: 'Password@123'
DEMO_BCRYPT_HASH = "$2a$12$7EaxV4/GGEYWYeDHAZxU2.5BT1H0g8QKFNzjaY76Xeb1HbvBrThVm"

# Department & Designation mappings
# (DeptID, DesigID, Title, MinSalary, MaxSalary, Role)
DESIG_INFO = {
    1:  (1, 1, 'Lead Software Architect', 180000.0, 260000.0, 'Department Supervisor'),
    2:  (1, 2, 'Senior Software Engineer', 120000.0, 175000.0, 'Employee'),
    3:  (1, 3, 'Frontend Engineer', 85000.0, 130000.0, 'Employee'),
    4:  (1, 4, 'Junior Software Engineer', 50000.0, 80000.0, 'Employee'),
    5:  (1, 5, 'DevOps Specialist', 110000.0, 165000.0, 'Employee'),
    6:  (2, 6, 'HR Director', 160000.0, 230000.0, 'Department Supervisor'),
    7:  (2, 7, 'HR Manager', 100000.0, 150000.0, 'HR Manager'),
    8:  (2, 8, 'Talent Acquisition Executive', 55000.0, 80000.0, 'Employee'),
    9:  (2, 9, 'HR Operations Associate', 40000.0, 65000.0, 'Employee'),
    10: (3, 10, 'Chief Financial Officer', 200000.0, 300000.0, 'Department Supervisor'),
    11: (3, 11, 'Lead Payroll Officer', 95000.0, 140000.0, 'Payroll Officer'),
    12: (3, 12, 'Accounts Officer', 60000.0, 90000.0, 'Employee'),
    13: (3, 13, 'Billing & Disbursement Clerk', 45000.0, 70000.0, 'Employee'),
    14: (4, 14, 'Operations Supervisor', 75000.0, 110000.0, 'Department Supervisor'),
    15: (4, 15, 'Logistics Coordinator', 45000.0, 70000.0, 'Employee'),
    16: (5, 16, 'QA Lead Engineer', 110000.0, 160000.0, 'Department Supervisor'),
    17: (5, 17, 'QA Automation Analyst', 65000.0, 95000.0, 'Employee'),
    18: (6, 18, 'Lead Product Manager', 140000.0, 210000.0, 'Department Supervisor'),
    19: (6, 19, 'UI/UX Design Lead', 95000.0, 145000.0, 'Employee'),
}

def generate_seed_data():
    lines = []
    lines.append("-- ============================================================================")
    lines.append("-- PayPulse Database System — Phase 1")
    lines.append("-- Script 10: Deterministic Bulk Synthetic Test Data (105 Employees)")
    lines.append("-- Database: paypulse_db")
    lines.append("-- Generates complete workforce, hierarchies, attendance, leaves, payroll & audits")
    lines.append("-- ============================================================================")
    lines.append("\nUSE `paypulse_db`;\n")
    lines.append("SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;\n")

    # 1. Truncate test tables
    lines.append("-- Truncate dynamic tables for repeatable seeding")
    tables_to_truncate = [
        "System_Audit_Log", "Disbursement_Record", "Payroll_Component_Detail",
        "Monthly_Payroll", "Leave_Request", "Leave_Allocation", "Attendance_Log",
        "Salary_Structure", "Employee", "User_Account"
    ]
    for tbl in tables_to_truncate:
        lines.append(f"TRUNCATE TABLE `{tbl}`;")
    lines.append("")

    # Build 105 Employees
    # First 5 correspond to the system's key demo logins:
    # 1: admin (System Administrator)
    # 2: farzana.hr (HR Manager)
    # 3: rafiq.payroll (Payroll Officer)
    # 4: mahbub.supervisor (Department Supervisor)
    # 5: nusrat.employee (Employee)

    employees = []
    
    # Predefined 5 Demo Staff
    demo_staff = [
        {
            "id": 1, "code": "EMP-1001", "username": "admin", "role": "System Administrator",
            "first": "Tanvir", "last": "Ahmed", "gender": "Male", "email": "admin@paypulse.internal",
            "phone": "+8801711001001", "nid": "19882691234567890", "dob": "1988-05-12",
            "dept_id": 1, "desig_id": 1, "manager_id": None, "hire_date": "2020-01-15",
            "basic": 240000.0, "hra": 48000.0, "med": 24000.0, "conv": 12000.0, "tax": 10.0, "pf": 8.0,
            "bank": ("BRAC Bank PLC", "060264120", "Gulshan Branch", "1501201982736")
        },
        {
            "id": 2, "code": "EMP-1002", "username": "farzana.hr", "role": "HR Manager",
            "first": "Farzana", "last": "Yeasmin", "gender": "Female", "email": "farzana.hr@paypulse.internal",
            "phone": "+8801812002002", "nid": "19922692345678901", "dob": "1992-08-24",
            "dept_id": 2, "desig_id": 7, "manager_id": 1, "hire_date": "2021-06-01",
            "basic": 135000.0, "hra": 27000.0, "med": 13500.0, "conv": 8000.0, "tax": 8.0, "pf": 7.5,
            "bank": ("BRAC Bank PLC", "060264120", "Uttara Branch", "1501204859603")
        },
        {
            "id": 3, "code": "EMP-1003", "username": "rafiq.payroll", "role": "Payroll Officer",
            "first": "Rafiqul", "last": "Islam", "gender": "Male", "email": "rafiq.payroll@paypulse.internal",
            "phone": "+8801914003003", "nid": "19892695678901234", "dob": "1989-11-03",
            "dept_id": 3, "desig_id": 11, "manager_id": 1, "hire_date": "2021-09-15",
            "basic": 125000.0, "hra": 25000.0, "med": 12500.0, "conv": 8000.0, "tax": 8.0, "pf": 7.5,
            "bank": ("The City Bank PLC", "225273180", "Kawran Bazar Branch", "1102589632145")
        },
        {
            "id": 4, "code": "EMP-1004", "username": "mahbub.supervisor", "role": "Department Supervisor",
            "first": "Mahbubur", "last": "Rahman", "gender": "Male", "email": "mahbub.tech@paypulse.internal",
            "phone": "+8801715004004", "nid": "19902697890123456", "dob": "1990-02-18",
            "dept_id": 1, "desig_id": 2, "manager_id": 1, "hire_date": "2022-01-10",
            "basic": 160000.0, "hra": 32000.0, "med": 16000.0, "conv": 10000.0, "tax": 9.0, "pf": 8.0,
            "bank": ("Dutch-Bangla Bank PLC", "090261890", "Banani Branch", "1161200987456")
        },
        {
            "id": 5, "code": "EMP-1005", "username": "nusrat.employee", "role": "Employee",
            "first": "Nusrat", "last": "Jahan", "gender": "Female", "email": "nusrat.eng@paypulse.internal",
            "phone": "+8801618005005", "nid": "19962699012345678", "dob": "1996-07-14",
            "dept_id": 1, "desig_id": 3, "manager_id": 4, "hire_date": "2023-02-01",
            "basic": 110000.0, "hra": 22000.0, "med": 11000.0, "conv": 7000.0, "tax": 7.0, "pf": 7.0,
            "bank": ("Eastern Bank PLC", "095261399", "Principal Branch", "1041060987654")
        }
    ]
    employees.extend(demo_staff)

    # Department Heads mapping:
    # Dept 1 (ENG) -> Emp 1 (Tanvir)
    # Dept 2 (HRD) -> Emp 2 (Farzana)
    # Dept 3 (FIN) -> Emp 3 (Rafiqul)
    # Dept 4 (OPS) -> Emp 8 (Kabir Hossain, created below)
    # Dept 5 (QAD) -> Emp 10 (Sharmin Sultana, created below)
    # Dept 6 (PMD) -> Emp 12 (Mustafa Kamal, created below)

    # Designations assignment cycle for remaining 100 employees (IDs 6 to 105)
    desig_pool = list(range(1, 20)) # 1 to 19

    for i in range(6, 106):
        emp_code = f"EMP-{1000 + i}"
        gender = "Female" if (i % 3 == 0) else "Male"
        first = random.choice(FIRST_NAMES_FEMALE if gender == "Female" else FIRST_NAMES_MALE)
        last = random.choice(LAST_NAMES)
        username = f"{first.lower()}.{last.lower()}{i}"
        email = f"{first.lower()}.{last.lower()}{i}@paypulse.internal"
        phone = f"+8801{random.choice(['7', '8', '9', '6', '5'])}{random.randint(10000000, 99999999)}"
        nid = f"19{random.randint(80, 99)}{random.randint(1000000000000, 9999999999999)}"
        birth_year = random.randint(1982, 2001)
        dob = f"{birth_year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        hire_year = random.randint(2021, 2025)
        hire_date = f"{hire_year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        
        # Pick designation
        desig_id = desig_pool[(i - 6) % len(desig_pool)]
        dept_id, _, title, min_sal, max_sal, default_role = DESIG_INFO[desig_id]
        
        # Manager hierarchy:
        # Dept heads report to Emp 1 (CEO / Lead Architect)
        # Others report to their Dept Head or Supervisors
        if i in [6, 8, 10, 12]: # Dept leads
            manager_id = 1
            role = "Department Supervisor"
        elif dept_id == 1:
            manager_id = 4 if i % 2 == 0 else 1
            role = "Employee"
        elif dept_id == 2:
            manager_id = 2
            role = "Employee"
        elif dept_id == 3:
            manager_id = 3
            role = "Employee"
        elif dept_id == 4:
            manager_id = 8
            role = "Employee"
        elif dept_id == 5:
            manager_id = 10
            role = "Employee"
        else: # Dept 6
            manager_id = 12
            role = "Employee"

        # Basic salary within band
        basic = round(random.uniform(min_sal, max_sal) / 1000.0) * 1000.0
        hra = round(basic * 0.20, 2)
        med = round(basic * 0.10, 2)
        conv = 8000.00
        tax = 7.50 if basic > 100000 else 5.00
        pf = 7.00
        
        b_name, b_routing, b_branch = random.choice(BANKS)
        b_acc = f"{random.randint(100, 999)}{random.randint(1000000000, 9999999999)}"

        employees.append({
            "id": i, "code": emp_code, "username": username, "role": role,
            "first": first, "last": last, "gender": gender, "email": email,
            "phone": phone, "nid": nid, "dob": dob, "dept_id": dept_id,
            "desig_id": desig_id, "manager_id": manager_id, "hire_date": hire_date,
            "basic": basic, "hra": hra, "med": med, "conv": conv, "tax": tax, "pf": pf,
            "bank": (b_name, b_routing, b_branch, b_acc)
        })

    # 2. Insert User_Account records
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 1. Insert User_Account Records (105 Accounts)")
    lines.append("-- ----------------------------------------------------------------------------")
    user_rows = []
    for emp in employees:
        user_rows.append(
            f"({emp['id']}, '{emp['username']}', '{DEMO_BCRYPT_HASH}', '{emp['role']}', TRUE, '{emp['hire_date']} 09:00:00')"
        )
    lines.append("INSERT INTO `User_Account` (`User_ID`, `Username`, `Password_Hash`, `Role`, `Is_Active`, `Created_At`) VALUES\n" + ",\n".join(user_rows) + ";\n")

    # 3. Insert Employee records
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 2. Insert Employee Records (105 Profiles)")
    lines.append("-- ----------------------------------------------------------------------------")
    emp_rows = []
    for emp in employees:
        mgr = str(emp['manager_id']) if emp['manager_id'] is not None else "NULL"
        b_name, b_routing, b_branch, b_acc = emp['bank']
        emp_rows.append(
            f"({emp['id']}, '{emp['code']}', {emp['id']}, {emp['dept_id']}, {emp['desig_id']}, {mgr}, "
            f"'{emp['first']}', '{emp['last']}', '{emp['email']}', '{emp['phone']}', '{emp['nid']}', "
            f"'{emp['dob']}', '{emp['gender']}', 'Dhaka, Bangladesh', '{emp['hire_date']}', "
            f"'{b_acc}', '{b_name}', '{b_branch}', '{b_routing}', 'Active')"
        )
    lines.append("INSERT INTO `Employee` (`Employee_ID`, `Employee_Code`, `User_ID`, `Department_ID`, `Designation_ID`, `Manager_ID`, `First_Name`, `Last_Name`, `Email`, `Phone`, `NID`, `Date_Of_Birth`, `Gender`, `Address`, `Hire_Date`, `Bank_Account_No`, `Bank_Name`, `Bank_Branch`, `Bank_Routing_No`, `Employment_Status`) VALUES\n" + ",\n".join(emp_rows) + ";\n")

    # 4. Update Department Head references
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 3. Update Department Heads")
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 1 WHERE `Department_ID` = 1;")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 2 WHERE `Department_ID` = 2;")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 3 WHERE `Department_ID` = 3;")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 8 WHERE `Department_ID` = 4;")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 10 WHERE `Department_ID` = 5;")
    lines.append("UPDATE `Department` SET `Head_Of_Department_ID` = 12 WHERE `Department_ID` = 6;\n")

    # 5. Insert Salary_Structure records
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 4. Insert Salary_Structure Records (Active & Historical Revisions)")
    lines.append("-- ----------------------------------------------------------------------------")
    sal_rows = []
    struct_id = 1
    for emp in employees:
        # If hired before 2023, create an older historical revision to demonstrate effective dating
        if emp['hire_date'] < "2023-01-01":
            old_basic = round(emp['basic'] * 0.85, 2)
            sal_rows.append(
                f"({struct_id}, {emp['id']}, {old_basic}, {round(old_basic*0.2,2)}, {round(old_basic*0.1,2)}, "
                f"6000.00, {emp['tax']}, {emp['pf']}, '{emp['hire_date']}', '2023-12-31', FALSE)"
            )
            struct_id += 1
            sal_rows.append(
                f"({struct_id}, {emp['id']}, {emp['basic']}, {emp['hra']}, {emp['med']}, "
                f"{emp['conv']}, {emp['tax']}, {emp['pf']}, '2024-01-01', NULL, TRUE)"
            )
            struct_id += 1
        else:
            sal_rows.append(
                f"({struct_id}, {emp['id']}, {emp['basic']}, {emp['hra']}, {emp['med']}, "
                f"{emp['conv']}, {emp['tax']}, {emp['pf']}, '{emp['hire_date']}', NULL, TRUE)"
            )
            struct_id += 1
            
    lines.append("INSERT INTO `Salary_Structure` (`Structure_ID`, `Employee_ID`, `Basic_Salary`, `House_Rent_Allowance`, `Medical_Allowance`, `Conveyance_Allowance`, `Tax_Deduction_Rate`, `Provident_Fund_Rate`, `Effective_From`, `Effective_To`, `Is_Active`) VALUES\n" + ",\n".join(sal_rows) + ";\n")

    # 6. Insert Leave_Allocation records for 2026
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 5. Insert Leave_Allocation Quotas for Calendar Year 2026")
    lines.append("-- ----------------------------------------------------------------------------")
    alloc_rows = []
    alloc_id = 1
    # Types: 1: Casual (14), 2: Medical (14), 3: Earned (15)
    for emp in employees:
        c_used = random.randint(0, 5)
        m_used = random.randint(0, 3)
        e_used = random.randint(0, 4)
        alloc_rows.append(f"({alloc_id}, {emp['id']}, 1, 2026, 14, {c_used}, {14 - c_used})")
        alloc_id += 1
        alloc_rows.append(f"({alloc_id}, {emp['id']}, 2, 2026, 14, {m_used}, {14 - m_used})")
        alloc_id += 1
        alloc_rows.append(f"({alloc_id}, {emp['id']}, 3, 2026, 15, {e_used}, {15 - e_used})")
        alloc_id += 1
    lines.append("INSERT INTO `Leave_Allocation` (`Allocation_ID`, `Employee_ID`, `Leave_Type_ID`, `Calendar_Year`, `Total_Allocated`, `Days_Used`, `Days_Remaining`) VALUES\n" + ",\n".join(alloc_rows) + ";\n")

    # 7. Insert Leave_Request records
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 6. Insert Leave_Request Records (Diverse Scenarios)")
    lines.append("-- ----------------------------------------------------------------------------")
    req_rows = []
    req_id = 1
    sample_reasons = [
        "Family function in hometown", "Severe viral fever and flu", "Personal annual vacation",
        "Medical treatment for parents", "Urgent apartment relocation", "Dental emergency"
    ]
    # Create ~60 requests
    for emp in employees[:60]:
        r_type = random.choice([1, 2, 3])
        r_status = random.choice(['Approved', 'Approved', 'Pending', 'Rejected', 'Cancelled'])
        dur = random.randint(1, 4)
        s_day = random.randint(1, 20)
        s_date = f"2026-08-{s_day:02d}"
        e_date = f"2026-08-{s_day + dur - 1:02d}"
        approver = "2" if r_status in ['Approved', 'Rejected'] else "NULL"
        app_date = f"2026-08-{max(1, s_day - 3):02d} 10:00:00"
        app_at = f"'{s_date} 14:00:00'" if r_status in ['Approved', 'Rejected'] else "NULL"
        remarks = "'Approved per departmental policy'" if r_status == 'Approved' else ("'Rejected due to sprint delivery'" if r_status == 'Rejected' else "NULL")
        reason = random.choice(sample_reasons)

        req_rows.append(
            f"({req_id}, {emp['id']}, {r_type}, {approver}, '{s_date}', '{e_date}', {dur}, "
            f"'{reason}', '{r_status}', '{app_date}', {remarks}, {app_at})"
        )
        req_id += 1
    lines.append("INSERT INTO `Leave_Request` (`Request_ID`, `Employee_ID`, `Leave_Type_ID`, `Approved_By_User_ID`, `Start_Date`, `End_Date`, `Total_Days`, `Reason`, `Status`, `Applied_Date`, `Approval_Remarks`, `Approved_At`) VALUES\n" + ",\n".join(req_rows) + ";\n")

    # 8. Generate 2,200+ Attendance_Log records
    # Dates: 22 work dates in August 2026 (Aug 2 to Aug 31, excluding Fridays/Saturdays)
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 7. Insert Attendance_Log Records (2,200+ Daily Biometric Entries)")
    lines.append("-- ----------------------------------------------------------------------------")
    
    # Collect work dates in August and September 2026
    work_dates = []
    # August 2026: weekdays
    curr = date(2026, 8, 1)
    while curr <= date(2026, 8, 31):
        if curr.weekday() not in [4, 5]: # In BD, Friday=4, Saturday=5 are weekends
            work_dates.append(curr.strftime("%Y-%m-%d"))
        curr += timedelta(days=1)
    
    # Also add 5 days in September 2026 for recent trend analysis
    curr = date(2026, 9, 1)
    while curr <= date(2026, 9, 8):
        if curr.weekday() not in [4, 5]:
            work_dates.append(curr.strftime("%Y-%m-%d"))
        curr += timedelta(days=1)
    
    # 26 total work dates * 100 employees = 2,600 attendance records
    att_rows = []
    log_id = 1
    for w_date in work_dates:
        for emp in employees:
            # Determine attendance profile
            dice = random.random()
            if dice < 0.85: # 85% Present on time
                status = "Present"
                check_in = f"'{w_date} 09:00:00'"
                check_out = f"'{w_date} 18:00:00'"
                hours = 9.00
                ot = 2.00 if random.random() < 0.20 else 0.00
                if ot > 0:
                    check_out = f"'{w_date} 20:00:00'"
                    hours = 11.00
                remarks = "NULL"
            elif dice < 0.93: # 8% Late
                status = "Late"
                check_in = f"'{w_date} 09:45:00'"
                check_out = f"'{w_date} 18:30:00'"
                hours = 8.75
                ot = 0.00
                remarks = "'Traffic congestion on Dhaka highway'"
            elif dice < 0.96: # 3% Half-Day
                status = "Half-Day"
                check_in = f"'{w_date} 09:00:00'"
                check_out = f"'{w_date} 13:30:00'"
                hours = 4.50
                ot = 0.00
                remarks = "'Doctor appointment post-lunch'"
            elif dice < 0.98: # 2% On-Leave
                status = "On-Leave"
                check_in = "NULL"
                check_out = "NULL"
                hours = 0.00
                ot = 0.00
                remarks = "'Approved casual/medical leave'"
            else: # 2% Absent
                status = "Absent"
                check_in = "NULL"
                check_out = "NULL"
                hours = 0.00
                ot = 0.00
                remarks = "'Unexcused absence without notice'"

            rem_sql = f"{remarks}" if remarks == "NULL" else f"{remarks}"
            att_rows.append(
                f"({log_id}, {emp['id']}, '{w_date}', {check_in}, {check_out}, {hours}, {ot}, '{status}', {rem_sql})"
            )
            log_id += 1

    # Chunk attendance inserts by 500 rows to keep SQL statements manageable
    for chunk_start in range(0, len(att_rows), 500):
        chunk = att_rows[chunk_start:chunk_start+500]
        lines.append(
            "INSERT INTO `Attendance_Log` (`Log_ID`, `Employee_ID`, `Work_Date`, `Check_In_Time`, `Check_Out_Time`, `Working_Hours`, `Overtime_Hours`, `Attendance_Status`, `Remarks`) VALUES\n"
            + ",\n".join(chunk) + ";\n"
        )

    # 9. Generate Monthly_Payroll & Payroll_Component_Detail for July & August 2026
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 8. Insert Monthly_Payroll & Payroll_Component_Detail (July & August 2026)")
    lines.append("-- ----------------------------------------------------------------------------")
    
    payroll_rows = []
    comp_rows = []
    disb_rows = []
    payroll_id = 1
    detail_id = 1
    disb_id = 1

    for p_year, p_month, p_status in [(2026, 7, 'Disbursed'), (2026, 8, 'Disbursed')]:
        gen_date = f"{p_year}-{p_month:02d}-28 17:00:00"
        fin_date = f"{p_year}-{p_month:02d}-30 18:00:00"
        disb_date = f"{p_year}-{(p_month+1):02d}-01 11:30:00" if p_month < 12 else f"{p_year+1}-01-01 11:30:00"

        for emp in employees:
            w_days = 26
            p_days = random.randint(24, 26)
            paid_l = 26 - p_days
            unpaid_l = 0 if random.random() > 0.05 else 1 # 5% chance of 1 unpaid day
            
            basic = emp['basic']
            hra = emp['hra']
            med = emp['med']
            conv = emp['conv']
            ot_hours = random.choice([0.0, 0.0, 2.0, 4.0, 8.0])
            ot_rate = round((basic / (w_days * 8.0)) * 1.5, 2)
            ot_pay = round(ot_hours * ot_rate, 2)

            unpaid_ded = round(unpaid_l * (basic / w_days), 2)
            tax_ded = round(basic * (emp['tax'] / 100.0), 2)
            pf_ded = round(basic * (emp['pf'] / 100.0), 2)

            tot_allow = round(hra + med + conv + ot_pay, 2)
            gross = round(basic + tot_allow, 2)
            tot_ded = round(tax_ded + pf_ded + unpaid_ded, 2)
            net = round(gross - tot_ded, 2)

            payroll_rows.append(
                f"({payroll_id}, {emp['id']}, {p_month}, {p_year}, {w_days}, {p_days}, {paid_l}, {unpaid_l}, "
                f"{basic}, {tot_allow}, {gross}, {tot_ded}, {net}, '{gen_date}', '{fin_date}', '{p_status}', 3)"
            )

            # Components
            comp_rows.append(f"({detail_id}, {payroll_id}, 'Basic Salary', 'Earning', {basic}, NULL)")
            detail_id += 1
            comp_rows.append(f"({detail_id}, {payroll_id}, 'House Rent Allowance', 'Earning', {hra}, NULL)")
            detail_id += 1
            comp_rows.append(f"({detail_id}, {payroll_id}, 'Medical Allowance', 'Earning', {med}, NULL)")
            detail_id += 1
            comp_rows.append(f"({detail_id}, {payroll_id}, 'Conveyance Allowance', 'Earning', {conv}, NULL)")
            detail_id += 1
            if ot_pay > 0:
                comp_rows.append(f"({detail_id}, {payroll_id}, 'Overtime Pay', 'Earning', {ot_pay}, '{ot_hours} hrs OT')")
                detail_id += 1
            if tax_ded > 0:
                comp_rows.append(f"({detail_id}, {payroll_id}, 'Income Tax Withholding', 'Deduction', {tax_ded}, '{emp['tax']}% slab')")
                detail_id += 1
            if pf_ded > 0:
                comp_rows.append(f"({detail_id}, {payroll_id}, 'Provident Fund Contribution', 'Deduction', {pf_ded}, '{emp['pf']}% matching')")
                detail_id += 1
            if unpaid_ded > 0:
                comp_rows.append(f"({detail_id}, {payroll_id}, 'Unpaid Leave Penalty', 'Deduction', {unpaid_ded}, '{unpaid_l} days')")
                detail_id += 1

            # Disbursement record
            tx_ref = f"BEFTN-{p_year}{p_month:02d}{payroll_id:04d}-{random.randint(1000, 9999)}"
            disb_status = 'Disbursed'
            disb_rows.append(
                f"({disb_id}, {payroll_id}, 'Bank Transfer (BEFTN)', '{tx_ref}', '{disb_date}', '{disb_status}', "
                f"{net}, 'BEFTN Electronic batch settlement completed', 3)"
            )
            disb_id += 1

            payroll_id += 1

    # Insert Payroll in chunks
    for chunk_start in range(0, len(payroll_rows), 200):
        chunk = payroll_rows[chunk_start:chunk_start+200]
        lines.append(
            "INSERT INTO `Monthly_Payroll` (`Payroll_ID`, `Employee_ID`, `Payroll_Month`, `Payroll_Year`, `Working_Days`, `Present_Days`, `Paid_Leave_Days`, `Unpaid_Leave_Days`, `Basic_Salary`, `Total_Allowances`, `Gross_Salary`, `Total_Deductions`, `Net_Salary`, `Generation_Date`, `Finalized_Date`, `Payroll_Status`, `Generated_By_User_ID`) VALUES\n"
            + ",\n".join(chunk) + ";\n"
        )

    # Insert Components in chunks
    for chunk_start in range(0, len(comp_rows), 500):
        chunk = comp_rows[chunk_start:chunk_start+500]
        lines.append(
            "INSERT INTO `Payroll_Component_Detail` (`Detail_ID`, `Payroll_ID`, `Component_Name`, `Component_Type`, `Amount`, `Remarks`) VALUES\n"
            + ",\n".join(chunk) + ";\n"
        )

    # Insert Disbursements
    for chunk_start in range(0, len(disb_rows), 200):
        chunk = disb_rows[chunk_start:chunk_start+200]
        lines.append(
            "INSERT INTO `Disbursement_Record` (`Disbursement_ID`, `Payroll_ID`, `Payment_Method`, `Transaction_Reference`, `Disbursement_Date`, `Disbursement_Status`, `Disbursed_Amount`, `Remarks`, `Disbursed_By_User_ID`) VALUES\n"
            + ",\n".join(chunk) + ";\n"
        )

    # 10. System Audit Log Entries
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("-- 9. Insert Initial System_Audit_Log Records")
    lines.append("-- ----------------------------------------------------------------------------")
    lines.append("""INSERT INTO `System_Audit_Log` (`Audit_ID`, `Table_Name`, `Operation_Type`, `Record_ID`, `Changed_By_User`, `Action_Timestamp`, `Description`) VALUES
(1, 'User_Account', 'INSERT', '1', 1, '2026-07-01 09:00:00', 'Initial System Administrator account provisioned'),
(2, 'Department', 'INSERT', 'ENG', 1, '2026-07-01 09:05:00', 'Created core organizational department: Software Engineering'),
(3, 'Department', 'INSERT', 'HRD', 1, '2026-07-01 09:06:00', 'Created core organizational department: Human Resources & Talent'),
(4, 'Monthly_Payroll', 'INSERT', '2026-07', 3, '2026-07-28 17:00:00', 'Processed monthly batch payroll for July 2026 (105 employees)'),
(5, 'Disbursement_Record', 'INSERT', 'BATCH-202607', 3, '2026-08-01 11:30:00', 'BEFTN Electronic bank transfer batch dispatched for July 2026'),
(6, 'Monthly_Payroll', 'INSERT', '2026-08', 3, '2026-08-28 17:00:00', 'Processed monthly batch payroll for August 2026 (105 employees)'),
(7, 'Disbursement_Record', 'INSERT', 'BATCH-202608', 3, '2026-09-01 11:30:00', 'BEFTN Electronic bank transfer batch dispatched for August 2026');
""")

    lines.append("SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;\n")

    return "\n".join(lines)

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_sql = os.path.join(out_dir, "10_seed_test_data.sql")
    content = generate_seed_data()
    with open(target_sql, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully generated {target_sql} (Length: {len(content)} chars)")
