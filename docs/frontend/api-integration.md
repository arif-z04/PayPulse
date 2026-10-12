# Frontend API Integration & Service Architecture

This document details the API integration layer, endpoint mappings, dual-mode execution architecture, and network error handling in the **PayPulse** frontend.

---

## 1. Centralized API Client (`ApiClient`)

The frontend interacts with the ASP.NET Core Web API through a strongly typed, centralized HTTP client [`src/services/api/apiClient.ts`](file:///home/noir/Projects/PayPulse/src/services/api/apiClient.ts).

### Core Features

1. **Base URL Resolution**: Defaults to `http://localhost:5000/api` via `VITE_API_BASE_URL`.
2. **Bearer Authentication**: Automatically retrieves the JWT access token from `localStorage.getItem('paypulse_token')` and appends `Authorization: Bearer <token>`.
3. **Structured Error Handling**: Parses ASP.NET Core error payloads and converts them into standardized `ApiError` instances:
   - Status 400: `BusinessRuleException` messages.
   - Status 401: Clears stored credentials and dispatches `paypulse_auth_unauthorized` to redirect the user to `/login`.
   - Status 403: Forbidden access warnings.
   - Status 404: Missing entity notifications.
   - Status 409: Duplicate key conflicts.
4. **Network Resilience**: Traps connection refusal errors (e.g., if the backend server is stopped) and provides user-friendly diagnostic guidance.

---

## 2. Dual-Mode Architecture (Real API vs. Mock Database)

PayPulse implements a dual-mode service architecture to support both real full-stack integration and isolated offline testing:

- **Real API Integration (`VITE_ENABLE_MOCK_API="false"`)**:
  - The client dispatches HTTP requests directly to the live ASP.NET Core Web API at `http://localhost:5000/api`.
  - Backed by the MySQL 8.4 database (`paypulse_db`) containing 105 seeded employees, payroll records, and attendance logs.
- **Isolated Testing Mode (`import.meta.env.MODE === 'test'` or `VITE_ENABLE_MOCK_API="true"`)**:
  - Automatically activated during `vitest` unit test execution to provide zero-network test repeatability against in-memory `mockDb`.

---

## 3. Feature Service to Backend Endpoint Mapping

| Service Module | Service Method | HTTP Verb | Backend API Endpoint |
| :--- | :--- | :---: | :--- |
| **`authService`** | `login(credentials)` | `POST` | `/api/auth/login` |
| | `logout()` | `POST` | `/api/auth/logout` |
| | `getCurrentUser()` | `GET` | `/api/auth/me` |
| | `forgotPassword(email)` | `POST` | `/api/auth/forgot-password` |
| **`employeeService`** | `getEmployees(params)` | `GET` | `/api/employees` |
| | `getEmployeeById(id)` | `GET` | `/api/employees/{id}` |
| | `createEmployee(data)` | `POST` | `/api/employees` |
| | `updateEmployee(id, data)` | `PUT` | `/api/employees/{id}` |
| | `deleteEmployee(id)` | `DELETE`| `/api/employees/{id}` |
| **`departmentService`** | `getDepartments()` | `GET` | `/api/departments` |
| | `getDepartmentById(id)` | `GET` | `/api/departments/{id}` |
| | `createDepartment(data)` | `POST` | `/api/departments` |
| | `updateDepartment(id, data)` | `PUT` | `/api/departments/{id}` |
| **`designationService`** | `getDesignations(deptId)` | `GET` | `/api/designations` |
| | `createDesignation(data)` | `POST` | `/api/designations` |
| | `updateDesignation(id, data)` | `PUT` | `/api/designations/{id}` |
| **`attendanceService`** | `getAttendance(params)` | `GET` | `/api/attendance` |
| | `getAttendanceSummary(date)` | `GET` | `/api/attendance/summary` |
| | `checkIn(employeeId)` | `POST` | `/api/attendance/check-in` |
| | `checkOut(employeeId)` | `POST` | `/api/attendance/check-out` |
| **`leaveService`** | `getLeaveTypes()` | `GET` | `/api/leave/types` |
| | `getLeaveAllocations(empId)`| `GET` | `/api/leave/allocations` |
| | `getLeaveRequests(params)` | `GET` | `/api/leave/requests` |
| | `submitLeaveRequest(data)` | `POST` | `/api/leave/requests` |
| | `approveLeaveRequest(id)` | `POST` | `/api/leave/requests/{id}/approve` |
| | `rejectLeaveRequest(id)` | `POST` | `/api/leave/requests/{id}/reject` |
| **`salaryService`** | `getSalaries(params)` | `GET` | `/api/salaries` |
| | `getSalaryByEmployeeId(id)`| `GET` | `/api/salaries/employee/{id}` |
| | `updateSalaryStructure(id)` | `PUT` | `/api/salaries/employee/{id}` |
| **`payrollService`** | `getPayrolls(params)` | `GET` | `/api/payroll` |
| | `getPayrollById(id)` | `GET` | `/api/payroll/{id}` |
| | `approvePayroll(id)` | `POST` | `/api/payroll/{id}/approve` |
| | `disbursePayroll(id)` | `POST` | `/api/payroll/{id}/disburse` |
| **`disbursementService`**| `getDisbursements(params)` | `GET` | `/api/disbursements` |
| | `getDisbursementById(id)` | `GET` | `/api/disbursements/{id}` |
| | `retryDisbursement(id)` | `POST` | `/api/disbursements/{id}/retry` |
| **`auditService`** | `getAuditLogs(params)` | `GET` | `/api/audit` |
| **`reportService`** | `getDepartmentPayrollCost(p)`| `GET` | `/api/reports/payroll-cost` |
| | `getAttendanceTrend()` | `GET` | `/api/reports/attendance-trend` |
| | `getLeaveUtilization()` | `GET` | `/api/reports/leave-utilization` |
| | `getTaxProvidentSummary(p)` | `GET` | `/api/reports/tax-provident` |
| | `getSalaryBandCompliance()` | `GET` | `/api/reports/salary-band-compliance` |
| **`searchService`** | `searchGlobal(query)` | `GET` | `/api/search` |
| **`notificationService`**| `getNotifications()` | `GET` | `/api/notifications` |
| | `markAsRead(id)` | `POST` | `/api/notifications/{id}/read` |
| | `markAllAsRead()` | `POST` | `/api/notifications/read-all` |

---

## 4. Live Verification Output

Testing with active backend daemon on `http://127.0.0.1:5000`:
- **Auth Token Generation**: `POST /api/auth/login` returned signed HMAC-SHA256 JWT access token and user metadata for `admin`.
- **Protected Endpoint Access**: `GET /api/employees?page=1&pageSize=2` with Bearer token successfully returned 105 total records from MySQL (`Tanvir Ahmed`, `Software Engineering`).
