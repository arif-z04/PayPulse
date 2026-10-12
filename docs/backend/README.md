# PayPulse Backend — Technical Documentation & Architecture Reference

Welcome to the **PayPulse Backend** documentation. PayPulse is an enterprise-grade Employee Payroll, Attendance, and Leave Management System designed to provide automated compensation processing, biometric attendance logging, leave quota tracking, and audit trails.

The backend is developed in **ASP.NET Core Web API (.NET 10)** utilizing **Entity Framework Core** with the **Pomelo MySQL Provider**, backed by an authoritative **MySQL 8.4 LTS** database.

---

## 1. Technology Stack

| Layer / Concern | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | C# / ASP.NET Core Web API | .NET 10.0 | High-performance, asynchronous RESTful API framework |
| **ORM & Data Access** | Entity Framework Core / Pomelo MySQL | 9.0.0 (Pomelo) / 10.0 | Object-Relational Mapping to authoritative MySQL schema |
| **Database Engine** | MySQL Server (InnoDB) | 8.4 LTS | Relational storage, ACID transactions, triggers, and views |
| **Security & Cryptography** | BCrypt.Net-Next | 4.2.0 | Password hashing with work factor 12 |
| **Authentication** | JWT Bearer Authentication | 10.0.12 | Stateless token issuance with HMAC-SHA256 signature |
| **API Documentation** | Swashbuckle OpenAPI / Swagger UI | 10.3.0 | Interactive API specification and contract testing |
| **Testing Framework** | xUnit & FluentAssertions | 2.9.3 / 8.0.0 | Unit and real-world integration testing suites |

---

## 2. Solution Structure

The backend follows the principles of **Clean Architecture** (Separation of Concerns and Dependency Inversion).

```
PayPulse/
├── src/
│   ├── PayPulse.Domain/               # Pure domain models, enums, custom exceptions
│   │   ├── Entities/                  # 13 core database entity definitions
│   │   ├── Enums/                     # UserRoles and business status constants
│   │   └── Exceptions/                # Domain exceptions (NotFound, BusinessRule, etc.)
│   ├── PayPulse.Application/          # Application business logic & use cases
│   │   ├── Common/                    # API envelopes, pagination, shared interfaces
│   │   ├── DTOs/                      # Request and response data transfer objects
│   │   ├── Services/                  # 13 complete business domain service implementations
│   │   └── DependencyInjection.cs     # Application service collection registrations
│   ├── PayPulse.Infrastructure/       # Persistence, external tools & adapters
│   │   ├── Persistence/               # AppDbContext, EntityConfigurations (Fluent API)
│   │   ├── Services/                  # BCrypt password hasher, JWT token generator
│   │   └── DependencyInjection.cs     # Infrastructure service collection registrations
│   └── PayPulse.Api/                  # HTTP Host, middleware, presentation layer
│       ├── Controllers/               # 13 RESTful API controllers
│       ├── Middleware/                # Global ExceptionHandlingMiddleware
│       ├── Services/                  # HttpContext CurrentUserService implementation
│       ├── Program.cs                 # API entry point, pipeline configuration, Swagger
│       └── appsettings.json           # Connection strings, JWT secrets, CORS settings
├── tests/
│   ├── PayPulse.UnitTests/            # Isolated business formula, tax & leave quota tests
│   └── PayPulse.IntegrationTests/     # End-to-end HTTP tests against MySQL 8.4 container
└── docs/
    ├── database/                      # Phase 1 Database Design & SQL Documentation
    └── backend/                       # Phase 2 Backend Architecture & API Documentation
```

---

## 3. Documentation Index

The technical documentation for the PayPulse backend is organized into the following specialized documents:

1. [**Architecture & Design**](file:///home/noir/Projects/PayPulse/docs/backend/architecture.md)
   * Clean Architecture layers and dependency directions
   * Dependency Injection topology and service lifetimes
   * HTTP middleware pipeline and centralized exception handling
2. [**API Endpoints Inventory**](file:///home/noir/Projects/PayPulse/docs/backend/api-endpoints.md)
   * Complete catalog of all endpoints across all 13 controllers
   * Request/response formats, URL query filters, and HTTP status codes
   * Swagger / OpenAPI schema alignment
3. [**Authentication & Authorization**](file:///home/noir/Projects/PayPulse/docs/backend/authentication-and-authorization.md)
   * JWT bearer token lifecycle and HMAC-SHA256 claims
   * BCrypt password hashing strategy
   * Role-Based Access Control (RBAC) matrix and horizontal permission checks
4. [**Database Integration**](file:///home/noir/Projects/PayPulse/docs/backend/database-integration.md)
   * EF Core entity mappings to Phase 1 MySQL schema
   * Fluent API configuration details, precision, and relationship constraints
   * Transaction management and trigger coordination
5. [**Business Logic & Calculation Rules**](file:///home/noir/Projects/PayPulse/docs/backend/business-logic.md)
   * Salary calculation formulas, allowances, tax, and provident fund
   * Overtime calculation (1.5x multiplier) and biometric status rules
   * Leave quota enforcement, balance deductions, and payroll periods
6. [**Testing Report & Verification**](file:///home/noir/Projects/PayPulse/docs/backend/testing-report.md)
   * Test suite structure: Unit tests and Integration tests
   * Automated test execution outcomes (100% pass rate: 25/25 passed)
   * Edge-case verification and security assertions
7. [**Configuration & Runbook**](file:///home/noir/Projects/PayPulse/docs/backend/configuration-and-running.md)
   * Environment requirements and database container setup
   * Configuration keys (`appsettings.json`, environment variables)
   * Build, run, and Swagger verification instructions
   * Pre-configured seed user credentials

---

## 4. Quick Verification Commands

```bash
# Build the solution
dotnet build

# Execute all Unit and Integration tests
dotnet test

# Run the Web API backend
dotnet run --project src/PayPulse.Api
```

Once running, the Swagger interactive API explorer is accessible at:
`http://localhost:5000/swagger` (or configured HTTPS port).
