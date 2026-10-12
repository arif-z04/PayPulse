# PayPulse Entity-Relationship Diagram (ERD)

This document provides the complete, authoritative **Mermaid Entity-Relationship Diagram (ERD)** for the PayPulse database system (`paypulse_db`). The diagram uses Crow's Foot notation and accurately depicts all 13 core relational entities, primary keys, alternate keys, foreign keys, and cardinalities implemented in MySQL 8.4 LTS.

---

## 1. Complete Mermaid Crow's Foot ER Diagram

```mermaid
erDiagram
    %% ========================================================================
    %% PayPulse Database System — Phase 1 Complete ER Diagram
    %% Notation: Crow's Foot ER Diagram (13 Core Entities)
    %% DBMS: MySQL 8.4 LTS InnoDB
    %% ========================================================================

    User_Account ||--|| Employee : "authenticates (1:1)"
    User_Account ||--o{ Leave_Request : "approves (1:N)"
    User_Account ||--o{ Monthly_Payroll : "generates (1:N)"
    User_Account ||--o{ Disbursement_Record : "authorizes (1:N)"
    User_Account ||--o{ System_Audit_Log : "triggers (1:N)"

    Department ||--|{ Designation : "offers (1:N)"
    Department ||--|{ Employee : "employs (1:N)"
    Employee |o--o| Department : "heads (1:1)"

    Designation ||--|{ Employee : "classifies (1:N)"
    Employee ||--o{ Employee : "supervises (recursive 1:N)"

    Employee ||--|{ Salary_Structure : "accumulates history (1:N)"
    Employee ||--o{ Attendance_Log : "logs daily (1:N)"
    Employee ||--|{ Leave_Allocation : "entitled to (1:N)"
    Leave_Type ||--|{ Leave_Allocation : "governs (1:N)"

    Employee ||--o{ Leave_Request : "applies for (1:N)"
    Leave_Type ||--|{ Leave_Request : "categorizes (1:N)"

    Employee ||--o{ Monthly_Payroll : "receives (1:N)"
    Monthly_Payroll ||--|{ Payroll_Component_Detail : "itemizes (1:N)"
    Monthly_Payroll ||--o| Disbursement_Record : "settled via (1:1)"

    User_Account {
        int User_ID PK
        varchar Username UK
        varchar Password_Hash
        enum Role
        boolean Is_Active
        datetime Created_At
        datetime Updated_At
    }

    Department {
        int Department_ID PK
        varchar Department_Name UK
        varchar Department_Code UK
        varchar Office_Location
        int Head_Of_Department_ID FK
        text Description
        boolean Is_Active
        datetime Created_At
        datetime Updated_At
    }

    Designation {
        int Designation_ID PK
        int Department_ID FK
        varchar Title
        decimal Base_Salary_Min
        decimal Base_Salary_Max
        text Description
        boolean Is_Active
        datetime Created_At
        datetime Updated_At
    }

    Employee {
        int Employee_ID PK
        varchar Employee_Code UK
        int User_ID FK,UK
        int Department_ID FK
        int Designation_ID FK
        int Manager_ID FK
        varchar First_Name
        varchar Last_Name
        varchar Email UK
        varchar Phone
        varchar NID UK
        date Date_Of_Birth
        enum Gender
        varchar Address
        date Hire_Date
        varchar Bank_Account_No
        varchar Bank_Name
        varchar Bank_Branch
        varchar Bank_Routing_No
        enum Employment_Status
        datetime Created_At
        datetime Updated_At
    }

    Salary_Structure {
        int Structure_ID PK
        int Employee_ID FK
        decimal Basic_Salary
        decimal House_Rent_Allowance
        decimal Medical_Allowance
        decimal Conveyance_Allowance
        decimal Tax_Deduction_Rate
        decimal Provident_Fund_Rate
        date Effective_From
        date Effective_To
        boolean Is_Active
        datetime Created_At
        datetime Updated_At
    }

    Attendance_Log {
        int Log_ID PK
        int Employee_ID FK
        date Work_Date
        datetime Check_In_Time
        datetime Check_Out_Time
        decimal Working_Hours
        decimal Overtime_Hours
        enum Attendance_Status
        varchar Remarks
        datetime Created_At
    }

    Leave_Type {
        int Leave_Type_ID PK
        varchar Type_Name UK
        int Max_Days_Per_Year
        boolean Is_Carry_Forward
        boolean Is_Paid
        varchar Description
        datetime Created_At
    }

    Leave_Allocation {
        int Allocation_ID PK
        int Employee_ID FK
        int Leave_Type_ID FK
        smallint Calendar_Year
        int Total_Allocated
        int Days_Used
        int Days_Remaining
        datetime Created_At
        datetime Updated_At
    }

    Leave_Request {
        int Request_ID PK
        int Employee_ID FK
        int Leave_Type_ID FK
        int Approved_By_User_ID FK
        date Start_Date
        date End_Date
        int Total_Days
        varchar Reason
        enum Status
        datetime Applied_Date
        varchar Approval_Remarks
        datetime Approved_At
    }

    Monthly_Payroll {
        int Payroll_ID PK
        int Employee_ID FK
        tinyint Payroll_Month
        smallint Payroll_Year
        tinyint Working_Days
        tinyint Present_Days
        tinyint Paid_Leave_Days
        tinyint Unpaid_Leave_Days
        decimal Basic_Salary
        decimal Total_Allowances
        decimal Gross_Salary
        decimal Total_Deductions
        decimal Net_Salary
        datetime Generation_Date
        datetime Finalized_Date
        enum Payroll_Status
        int Generated_By_User_ID FK
        datetime Updated_At
    }

    Payroll_Component_Detail {
        int Detail_ID PK
        int Payroll_ID FK
        varchar Component_Name
        enum Component_Type
        decimal Amount
        varchar Remarks
    }

    Disbursement_Record {
        int Disbursement_ID PK
        int Payroll_ID FK,UK
        enum Payment_Method
        varchar Transaction_Reference UK
        datetime Disbursement_Date
        enum Disbursement_Status
        decimal Disbursed_Amount
        varchar Remarks
        int Disbursed_By_User_ID FK
        datetime Created_At
        datetime Updated_At
    }

    System_Audit_Log {
        bigint Audit_ID PK
        varchar Table_Name
        enum Operation_Type
        varchar Record_ID
        int Changed_By_User FK
        datetime Action_Timestamp
        json Old_Values
        json New_Values
        varchar Description
    }
```

---

## 2. Relational Summary Table

| Source Entity | Relationship Description | Target Entity | Cardinality | Parent-Child Hierarchy |
|---|---|---|---|---|
| `User_Account` | Authenticates identity for | `Employee` | 1 : 1 | Parent : Child |
| `User_Account` | Approves leave applications in | `Leave_Request` | 1 : N | Parent : Child |
| `User_Account` | Generates batch vouchers in | `Monthly_Payroll` | 1 : N | Parent : Child |
| `User_Account` | Authorizes fund disbursement in | `Disbursement_Record` | 1 : N | Parent : Child |
| `User_Account` | Causes audited security actions in | `System_Audit_Log` | 1 : N | Parent : Child |
| `Department` | Offers professional positions in | `Designation` | 1 : N | Parent : Child |
| `Department` | Employs workforce members in | `Employee` | 1 : N | Parent : Child |
| `Employee` | Acts as executive head of | `Department` | 1 : 1 (circular) | Parent : Child |
| `Designation` | Classifies employees into pay bands | `Employee` | 1 : N | Parent : Child |
| `Employee` | Supervises subordinates via | `Employee` (Self) | 1 : N (recursive) | Parent : Child |
| `Employee` | Accumulates compensation revisions | `Salary_Structure` | 1 : N | Parent : Child |
| `Employee` | Logs daily punch entries in | `Attendance_Log` | 1 : N | Parent : Child |
| `Employee` | Holds annual statutory balance in | `Leave_Allocation` | 1 : N | Parent : Child |
| `Leave_Type` | Dictates entitlement rules for | `Leave_Allocation` | 1 : N | Parent : Child |
| `Employee` | Submits formal applications in | `Leave_Request` | 1 : N | Parent : Child |
| `Leave_Type` | Classifies leave reasons in | `Leave_Request` | 1 : N | Parent : Child |
| `Employee` | Receives monthly financial ledger | `Monthly_Payroll` | 1 : N | Parent : Child |
| `Monthly_Payroll` | Decomposes itemized earnings in | `Payroll_Component_Detail` | 1 : N | Parent : Child |
| `Monthly_Payroll` | Dispatched via BEFTN bank transfer | `Disbursement_Record` | 1 : 1 | Parent : Child |
