# PayPulse REST API Endpoints Specification

This document provides a comprehensive inventory of all RESTful API endpoints implemented in the PayPulse backend.

All endpoints adhere to JSON transport formats, standard HTTP response status codes, and JWT Bearer token authorization (unless marked as Public).

---

## 1. Authentication & Security Endpoints (`AuthController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | **Public** | Authenticate with username/email & password | `LoginRequestDto` `{ emailOrUsername, password }` | `200 OK` → `LoginResponseDto` `{ token, expiresAt, user }` |
| `GET` | `/api/auth/me` | **All Authenticated** | Retrieve authenticated user profile | None | `200 OK` → `UserDto` `{ id, username, role, employee }` |
| `POST` | `/api/auth/change-password` | **All Authenticated** | Update account password | `ChangePasswordRequestDto` `{ currentPassword, newPassword }` | `200 OK` → `ApiResponse<bool>` |

---

## 2. Workforce Management Endpoints (`EmployeesController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | **All Authenticated** | Paginated employee directory | Query: `page`, `pageSize`, `departmentId`, `search`, `status` | `200 OK` → `PaginatedResponse<EmployeeDto>` |
| `GET` | `/api/employees/{id}` | **All Authenticated** | Detailed employee profile | Path: `id` (int) | `200 OK` → `EmployeeDto` |
| `POST` | `/api/employees` | **Admin, HR Manager** | Onboard new employee & user account | `CreateEmployeeDto` | `201 Created` → `EmployeeDto` |
| `PUT` | `/api/employees/{id}` | **Admin, HR Manager** | Update employee details | Path: `id`, Body: `UpdateEmployeeDto` | `200 OK` → `EmployeeDto` |
| `GET` | `/api/employees/{id}/salary-structure` | **Admin, HR, Payroll, Self** | Retrieve active salary structure | Path: `id` | `200 OK` → `SalaryStructureDto` |

---

## 3. Organizational Structure Endpoints

### Departments (`DepartmentsController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | **All Authenticated** | List all departments | None | `200 OK` → `List<DepartmentDto>` |
| `GET` | `/api/departments/{id}` | **All Authenticated** | Get department details | Path: `id` | `200 OK` → `DepartmentDto` |

### Designations (`DesignationsController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/designations` | **All Authenticated** | List designations (optional dept filter) | Query: `departmentId` | `200 OK` → `List<DesignationDto>` |
| `GET` | `/api/designations/{id}` | **All Authenticated** | Get designation salary bands | Path: `id` | `200 OK` → `DesignationDto` |

---

## 4. Compensation & Salary Structure Endpoints (`SalariesController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/salaries/calculate-preview` | **Admin, HR, Payroll** | Preview compensation calculation | `CalculateSalaryPreviewDto` `{ basicSalary, hra, ... }` | `200 OK` → `SalaryCalculationResultDto` |
| `GET` | `/api/salaries/{employeeId}/current` | **Admin, HR, Payroll, Self** | Current active salary structure | Path: `employeeId` | `200 OK` → `SalaryStructureDto` |
| `PUT` | `/api/salaries/{employeeId}` | **Admin, HR Manager** | Revise compensation package | Path: `employeeId`, Body: `UpdateSalaryStructureDto` | `200 OK` → `SalaryStructureDto` |

---

## 5. Attendance & Biometric Logging Endpoints (`AttendanceController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | **All Authenticated** | Filter attendance logs | Query: `employeeId`, `date`, `month`, `year`, `page` | `200 OK` → `PaginatedResponse<AttendanceDto>` |
| `GET` | `/api/attendance/summary` | **All Authenticated** | Monthly attendance metrics | Query: `employeeId`, `month`, `year` | `200 OK` → `AttendanceSummaryDto` |
| `POST` | `/api/attendance/check-in` | **All Authenticated** | Biometric / web check-in | None (infers current employee) | `200 OK` → `AttendanceDto` |
| `POST` | `/api/attendance/check-out` | **All Authenticated** | Biometric / web check-out | None (calculates hours & OT) | `200 OK` → `AttendanceDto` |
| `POST` | `/api/attendance/manual` | **Admin, HR, Supervisor** | Log manual attendance record | `ManualAttendanceDto` | `200 OK` → `AttendanceDto` |

---

## 6. Leave Management Endpoints (`LeaveController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/leave/types` | **All Authenticated** | Master statutory leave policies | None | `200 OK` → `List<LeaveTypeDto>` |
| `GET` | `/api/leave/allocations` | **All Authenticated** | Employee leave balances & quotas | Query: `employeeId` | `200 OK` → `List<LeaveAllocationDto>` |
| `GET` | `/api/leave/requests` | **All Authenticated** | Filter leave applications | Query: `employeeId`, `status`, `page`, `pageSize` | `200 OK` → `PaginatedResponse<LeaveRequestDto>` |
| `POST` | `/api/leave/requests` | **All Authenticated** | Submit leave application | `SubmitLeaveRequestDto` | `200 OK` → `LeaveRequestDto` |
| `POST` | `/api/leave/requests/{id}/approve` | **Admin, HR, Supervisor** | Approve leave & deduct quota | Path: `id`, Body: `ApproveLeaveRequestDto` | `200 OK` → `LeaveRequestDto` |

---

## 7. Payroll Processing & Settlement Endpoints (`PayrollController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/payroll` | **Admin, HR, Payroll** | Paginated monthly payroll list | Query: `period` (YYYY-MM), `status`, `page` | `200 OK` → `PaginatedResponse<PayrollDto>` |
| `GET` | `/api/payroll/{id}` | **Admin, HR, Payroll, Self** | Detailed payslip & component lines| Path: `id` | `200 OK` → `PayrollDto` |
| `POST` | `/api/payroll/process-batch` | **Admin, Payroll Officer** | Execute automated monthly run | `ProcessPayrollBatchDto` `{ period: "YYYY-MM" }` | `200 OK` → `BatchPayrollResultDto` |
| `POST` | `/api/payroll/{id}/finalize` | **Admin, Payroll Officer** | Finalize payslip for disbursement | Path: `id` | `200 OK` → `PayrollDto` |
| `GET` | `/api/payroll/{id}/payslip-pdf` | **Admin, HR, Payroll, Self** | Generate / download payslip document| Path: `id` | `200 OK` → `application/pdf` |

---

## 8. Banking Disbursement Endpoints (`DisbursementsController`)

| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/disbursements` | **Admin, Payroll Officer** | List disbursement settlement log | Query: `period`, `status`, `page`, `pageSize` | `200 OK` → `PaginatedResponse<DisbursementRecordDto>` |
| `GET` | `/api/disbursements/{id}` | **Admin, Payroll Officer** | Disbursement audit detail | Path: `id` | `200 OK` → `DisbursementRecordDto` |
| `POST` | `/api/disbursements/batch` | **Admin, Payroll Officer** | Authorize BEFTN batch disbursement| `BatchDisbursementDto` `{ period: "YYYY-MM" }` | `200 OK` → `BatchDisbursementResultDto` |
| `POST` | `/api/disbursements/{id}/status` | **Admin, Payroll Officer** | Update settlement status | Path: `id`, Body: `UpdateDisbursementStatusDto` | `200 OK` → `DisbursementRecordDto` |

---

## 9. Security Audit & Analytics Endpoints

### Audit Trail (`AuditController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit` | **System Administrator** | Query immutable audit ledger | Query: `tableName`, `action`, `startDate`, `page` | `200 OK` → `PaginatedResponse<AuditLogDto>` |

### Executive & Financial Reports (`ReportsController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/payroll-cost` | **Admin, HR, Payroll** | Departmental payroll expenditure | Query: `period` (YYYY-MM) | `200 OK` → `List<DepartmentPayrollCostDto>` |
| `GET` | `/api/reports/tax-deduction` | **Admin, HR, Payroll** | Statutory withholding summary | Query: `period` (YYYY-MM) | `200 OK` → `TaxDeductionReportDto` |
| `GET` | `/api/reports/attendance-summary` | **Admin, HR, Supervisor** | Aggregate attendance trends | Query: `month`, `year`, `departmentId` | `200 OK` → `AttendanceReportDto` |
| `GET` | `/api/reports/leave-utilization` | **Admin, HR, Supervisor** | Department leave quota consumption | Query: `year` | `200 OK` → `List<LeaveUtilizationDto>` |

---

## 10. Search & Notification Endpoints

### Global Search (`SearchController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/search` | **All Authenticated** | Unified cross-entity search | Query: `q` (keyword string) | `200 OK` → `GlobalSearchResultDto` |

### System Notifications (`NotificationsController`)
| Method | Endpoint Route | Authorized Roles | Description | Request Body / Parameters | Success Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | **All Authenticated** | User notification stream | Query: `unreadOnly` (bool) | `200 OK` → `List<NotificationDto>` |
| `POST` | `/api/notifications/{id}/read` | **All Authenticated** | Mark notification as read | Path: `id` | `200 OK` → `ApiResponse<bool>` |
| `POST` | `/api/notifications/read-all` | **All Authenticated** | Mark all notifications read | None | `200 OK` → `ApiResponse<bool>` |
