# PayPulse Relational Normalization Analysis (UNF to BCNF)

This document provides a formal database normalization analysis for the **PayPulse** database schema, detailing the step-by-step transformation from an Unnormalized Legacy Payroll Spreadsheet (UNF) through First (1NF), Second (2NF), Third (3NF), and Boyce-Codd Normal Form (BCNF), concluding with justified point-in-time denormalizations.

---

## 1. Case Study: The Legacy Payroll Spreadsheet (UNF)

Prior to PayPulse, workforce data, time tracking, and monthly salary calculations were recorded in an unnormalized spreadsheet table:

```text
UNF_Payroll_Spreadsheet (
    Emp_ID, Full_Name, Dept_Name, Dept_Code, Office_Loc, Desig_Title, 
    Min_Sal, Max_Sal, Basic_Pay, Allowances_List, Leave_History, 
    Month, Year, Present_Days, Working_Days, Gross_Pay, Net_Pay
)
```

### Critical Anomalies Present in UNF:
1. **Multi-Valued Repeating Groups**:
   - `Allowances_List` contains composite text strings: `"Rent:32000, Med:16000, Conv:10000"`.
   - `Leave_History` contains concatenated entries: `"Casual:2, Medical:1"`.
2. **Insertion Anomalies**:
   - Cannot create a new department or job title without simultaneously hiring and onboarding an employee.
3. **Update Anomalies**:
   - If an office location or department code changes, hundreds of employee rows must be individually updated. Any missed row causes catastrophic data divergence.
4. **Deletion Anomalies**:
   - If the sole employee in a department resigns and their row is deleted, the department's title, office location, and designation pay bands are permanently erased.

---

## 2. Conversion to First Normal Form (1NF)

### 2.1 Formal Definition of 1NF
A relation $R$ is in First Normal Form (1NF) if and only if:
1. The domain of all attributes contains strictly atomic, indivisible scalar values.
2. There are no repeating groups or multi-valued arrays.
3. An explicit primary key uniquely identifies each record.

### 2.2 Decomposition into 1NF
- Multi-valued text columns are decomposed into individual atomic scalar attributes (`House_Rent_Allowance`, `Medical_Allowance`, `Conveyance_Allowance`).
- Composite candidate key identified for monthly records: `Candidate Key = {Emp_ID, Month, Year}`.

```text
1NF_Payroll_Relation (
    Emp_ID, Month, Year, Full_Name, Dept_Name, Dept_Code, Office_Loc, 
    Desig_Title, Min_Sal, Max_Sal, Basic_Pay, House_Rent, Medical_Allow, 
    Conveyance, Present_Days, Working_Days, Gross_Pay, Net_Pay
)
```

### 2.3 Remaining Defects in 1NF: Partial Functional Dependencies
Let candidate key be $K = \{Emp\_ID, Month, Year\}$.
Observe the functional dependencies:
- $FD_1: \{Emp\_ID, Month, Year\} \rightarrow \{Present\_Days, Working\_Days, Gross\_Pay, Net\_Pay\}$ (Full dependency)
- $FD_2: \{Emp\_ID\} \rightarrow \{Full\_Name, Dept\_Name, Dept\_Code, Office\_Loc, Desig\_Title, Min\_Sal, Max\_Sal, Basic\_Pay, House\_Rent, Medical\_Allow, Conveyance\}$ (Partial dependency!)

Attributes in $FD_2$ depend only on a proper subset of the candidate key ($\{Emp\_ID\}$), violating 2NF.

---

## 3. Conversion to Second Normal Form (2NF)

### 3.1 Formal Definition of 2NF
A relation $R$ is in Second Normal Form (2NF) if:
1. It is in 1NF.
2. Every non-prime attribute is fully functionally dependent on every candidate key (no partial functional dependencies).

### 3.2 Decomposition into 2NF
We decompose the 1NF relation into two separate relations based on determinants:

1. **`Employee_Master`** (Primary Key: `Emp_ID`):
   ```text
   Employee_Master (
       Emp_ID [PK], Full_Name, Dept_Name, Dept_Code, Office_Loc, 
       Desig_Title, Min_Sal, Max_Sal, Basic_Pay, House_Rent, Medical_Allow, Conveyance
   )
   ```
2. **`Monthly_Payroll`** (Primary Key: `{Emp_ID, Month, Year}`):
   ```text
   Monthly_Payroll (
       Emp_ID [FK], Month, Year, Present_Days, Working_Days, Gross_Pay, Net_Pay
   )
   ```

### 3.3 Remaining Defects in 2NF: Transitive Functional Dependencies
In `Employee_Master`, observe:
- $Emp\_ID \rightarrow Dept\_Name$
- $Dept\_Name \rightarrow \{Dept\_Code, Office\_Loc\}$
- Therefore, $Emp\_ID \rightarrow \{Dept\_Code, Office\_Loc\}$ is a **transitive dependency** through a non-key attribute!
- Likewise, $Emp\_ID \rightarrow Desig\_Title \rightarrow \{Min\_Sal, Max\_Sal\}$.

Updating a department's office location still presents an update anomaly in `Employee_Master`.

---

## 4. Conversion to Third Normal Form (3NF)

### 4.1 Formal Definition of 3NF
A relation $R$ is in Third Normal Form (3NF) if:
1. It is in 2NF.
2. For every non-trivial functional dependency $X \rightarrow Y$, either:
   - $X$ is a superkey of $R$, OR
   - $Y$ is a prime attribute (part of a candidate key).
*(In plain terms: "Every non-key attribute must depend on the key, the whole key, and nothing but the key" - Bill Kent).*

### 4.2 Decomposition into 3NF
We eliminate transitive dependencies by extracting intermediate determinants into dedicated entities:

1. **`Department`**:
   - Functional Dependency: $Department\_ID \rightarrow \{Department\_Name, Department\_Code, Office\_Location\}$
   - Primary Key: `Department_ID`
2. **`Designation`**:
   - Functional Dependency: $Designation\_ID \rightarrow \{Department\_ID, Title, Base\_Salary\_Min, Base\_Salary\_Max\}$
   - Primary Key: `Designation_ID`
3. **`Employee`**:
   - Functional Dependency: $Employee\_ID \rightarrow \{User\_ID, Department\_ID, Designation\_ID, First\_Name, Last\_Name, Email, Phone, NID, ...\}$
   - Primary Key: `Employee_ID`
4. **`Salary_Structure`**:
   - Functional Dependency: $Structure\_ID \rightarrow \{Employee\_ID, Basic\_Salary, House\_Rent\_Allowance, Medical\_Allowance, Conveyance\_Allowance, Effective\_From, ...\}$
   - Primary Key: `Structure_ID`
5. **`Monthly_Payroll`**:
   - Functional Dependency: $Payroll\_ID \rightarrow \{Employee\_ID, Payroll\_Month, Payroll\_Year, Working\_Days, Present\_Days, ...\}$
   - Primary Key: `Payroll_ID`, Alternate Unique Key: `{Employee_ID, Payroll_Year, Payroll_Month}`

### 4.3 Lossless Join & Dependency Preservation Proof
- Every decomposition preserves all functional dependencies ($F = F_1 \cup F_2 \cup \dots$).
- For every decomposed pair $R_1 \cap R_2 \rightarrow R_1$ or $R_1 \cap R_2 \rightarrow R_2$, guaranteeing that natural joins losslessly reconstruct the original relation.

---

## 5. Boyce-Codd Normal Form (BCNF) & Architectural Snapshot Justification

### 5.1 Formal Definition of BCNF
A relation $R$ is in Boyce-Codd Normal Form (BCNF) if:
- For every non-trivial functional dependency $X \rightarrow Y$, **$X$ is a superkey**.

### 5.2 Verification Across PayPulse Entities

1. **`User_Account`**: Determinants are `User_ID` (PK) and `Username` (UK). Both are candidate keys. $\Rightarrow$ **BCNF**.
2. **`Department`**: Determinants are `Department_ID` (PK), `Department_Name` (UK), `Department_Code` (UK). All are candidate keys. $\Rightarrow$ **BCNF**.
3. **`Designation`**: Determinants are `Designation_ID` (PK) and `{Department_ID, Title}` (UK). Both are candidate keys. $\Rightarrow$ **BCNF**.
4. **`Employee`**: Determinants are `Employee_ID` (PK), `Employee_Code` (UK), `User_ID` (UK), `Email` (UK), `NID` (UK). All are candidate keys. $\Rightarrow$ **BCNF**.
5. **`Attendance_Log`**: Determinants are `Log_ID` (PK) and `{Employee_ID, Work_Date}` (UK). Both are candidate keys. $\Rightarrow$ **BCNF**.
6. **`Leave_Allocation`**: Determinants are `Allocation_ID` (PK) and `{Employee_ID, Leave_Type_ID, Calendar_Year}` (UK). Both are candidate keys. $\Rightarrow$ **BCNF**.
7. **`Monthly_Payroll`**: Determinants are `Payroll_ID` (PK) and `{Employee_ID, Payroll_Year, Payroll_Month}` (UK). Both are candidate keys. $\Rightarrow$ **BCNF**.

---

## 6. Justification for Storing Computed Financial Snapshots & Balances

In strict academic normalization theory, storing derived values (such as `Gross_Salary` and `Net_Salary` in `Monthly_Payroll`, or `Days_Remaining` in `Leave_Allocation`) is sometimes flagged as redundant because:
- $Net\_Salary = Gross\_Salary - Total\_Deductions$
- $Days\_Remaining = Total\_Allocated - Days\_Used$

In enterprise software engineering, however, these persistences represent **justified point-in-time snapshots**:

1. **Auditing & Regulatory Invariance**:
   - A payroll record is an immutable legal voucher. If tax slabs, overtime multipliers, or an employee's base salary change in the future, a purely dynamic view would retroactively distort what was actually paid out in prior years.
   - Capturing `Basic_Salary`, `Total_Allowances`, `Total_Deductions`, and `Net_Salary` at the exact moment of batch processing ensures that historical financial records remain fixed and audit-proof.
2. **Real-Time High-Throughput Reads**:
   - Employees frequently inspect their remaining leave balances via the web dashboard. Recalculating remaining leave on every dashboard load by scanning and aggregating all historical approved leave records would create unnecessary table scan overhead on high-traffic days.
   - Instead, `Days_Remaining` is stored as an integer attribute with an explicit integrity CHECK constraint:
     ```sql
     CONSTRAINT chk_alloc_balance_identity CHECK (Days_Remaining = Total_Allocated - Days_Used)
     ```
     and synchronized atomically via database triggers (`trg_SyncLeaveAllocationOnStatusChange`).
