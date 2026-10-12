# Configuration, Deployment & Operational Runbook

This document provides instructions for configuring, building, testing, and running the **PayPulse** backend Web API.

---

## 1. System Requirements & Prerequisites

- **Operating System**: Linux, macOS, or Windows.
- **.NET SDK**: .NET 10.0 SDK (`dotnet --version` >= 10.0.100).
- **Database Engine**: MySQL 8.4 LTS (or compatible MySQL 8.0+ instance).
- **Container Runtime**: Docker / Docker Compose (optional, for hosting the database container).

---

## 2. Configuration Settings Reference

The application configuration is managed via `appsettings.json` and `appsettings.Development.json`.

### Configuration Structure (`src/PayPulse.Api/appsettings.json`)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=127.0.0.1;Port=3308;Database=paypulse_db;User=paypulse_user;Password=PayPulseUser@2026!;CharSet=utf8mb4;"
  },
  "Jwt": {
    "SecretKey": "PayPulse_SuperSecretEnterpriseKey_2026!#SecureAuthTokenKeyMustBeLongEnough",
    "Issuer": "PayPulse",
    "Audience": "PayPulseApp",
    "ExpiryMinutes": 480
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ]
  }
}
```

### Environment Variable Overrides

Any setting in `appsettings.json` can be overridden in production using standard ASP.NET Core double-underscore (`__`) notation:

```bash
export ConnectionStrings__DefaultConnection="Server=prod-db.internal;Port=3306;Database=paypulse_db;User=app_user;Password=ComplexPassword123!;CharSet=utf8mb4;"
export Jwt__SecretKey="ProductionSecretKeyWithSufficientLengthAndEntropy2026!#"
export Jwt__ExpiryMinutes="120"
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Ensure MySQL Database is Running

If running via the repository Docker container:
```bash
docker start paypulse-mysql
```
Verify the connection and seed state:
```bash
docker exec paypulse-mysql mysql -upaypulse_user -pPayPulseUser@2026! paypulse_db -e "SELECT COUNT(*) AS total_employees FROM Employee;"
```

### Step 2: Build the Solution

Restore dependencies and compile all projects with zero errors:
```bash
dotnet build
```

### Step 3: Run the Automated Test Suites

Execute both Unit and Integration tests:
```bash
dotnet test
```
To run only unit tests:
```bash
dotnet test tests/PayPulse.UnitTests/PayPulse.UnitTests.csproj
```
To run only integration tests:
```bash
dotnet test tests/PayPulse.IntegrationTests/PayPulse.IntegrationTests.csproj
```

### Step 4: Launch the API Server

Start the Web API host:
```bash
dotnet run --project src/PayPulse.Api
```
By default, the server listens on:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001` (if developer SSL cert is configured)

### Step 5: Explore the Interactive Swagger UI

Open your browser to:
`http://localhost:5000/swagger`

To authenticate in Swagger UI:
1. Call `POST /api/auth/login` with admin credentials (`admin` / `Password@123`).
2. Copy the `accessToken` string from the JSON response.
3. Click the green **Authorize** button at the top right of the Swagger page.
4. Enter `Bearer <your_token>` and click **Authorize**.
5. All protected endpoints are now accessible directly from Swagger.

---

## 4. Pre-Configured Seed User Credentials

The database contains pre-seeded accounts corresponding to each RBAC role:

| Username | Role | Password | Associated Employee Email |
| :--- | :--- | :--- | :--- |
| **`admin`** | System Administrator | `Password@123` | `admin@paypulse.internal` |
| **`farzana.hr`** | HR Manager | `Password@123` | `farzana.rahman@paypulse.internal` |
| **`rafiq.payroll`** | Payroll Officer | `Password@123` | `rafiqul.islam@paypulse.internal` |
| **`mahbub.supervisor`** | Department Supervisor| `Password@123` | `mahbub.alam@paypulse.internal` |
| **`nusrat.employee`** | Employee | `Password@123` | `nusrat.jahan@paypulse.internal` |

---

## 5. Phase 3 (Frontend React UI) Handover Contract

For Phase 3 frontend integration:
- The API is CORS-enabled for Vite (`localhost:5173`) and Create-React-App (`localhost:3000`).
- Token transport: Bearer header format (`Authorization: Bearer <accessToken>`).
- API payload models match the frontend TypeScript types in `src/types/index.ts`.
- Date representations are ISO-8601 strings (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm:ssZ` for timestamps).
- Monetary fields are standard JSON floating numbers or fixed decimals.
