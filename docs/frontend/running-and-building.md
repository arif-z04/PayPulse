# Frontend Setup, Development & Production Build Runbook

This document provides setup instructions for running, testing, building, and deploying the **PayPulse** React frontend application.

---

## 1. Prerequisites & Environment

- **Node.js**: Version 18.18+ or 20+ (`node --version`).
- **npm**: Version 9+ (`npm --version`).
- **Backend API**: ASP.NET Core Web API running on `http://localhost:5000` (Phase 2).
- **Modern Browser**: Chrome, Firefox, Safari, or Edge.

---

## 2. Environment Variables Configuration

Copy `.env.example` to create your local `.env.development` or `.env.production` file:

```bash
cp .env.example .env.development
```

### Configuration Options

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_APP_NAME` | `"PayPulse Enterprise"` | Header title and application branding |
| `VITE_API_BASE_URL` | `"http://localhost:5000/api"` | Base URL of the backend ASP.NET Core API |
| `VITE_ENABLE_MOCK_API`| `"false"` | When `false`, connects to real backend; when `true`, uses mock DB |
| `VITE_CURRENCY` | `"BDT"` | Default currency code |
| `VITE_CURRENCY_SYMBOL`| `"৳"` | Default currency symbol prefix |

---

## 3. Step-by-Step Execution Guide

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```
By default, the Vite dev server starts at:
`http://localhost:5173`

### Step 3: Run the Frontend Test Suite
```bash
# Run unit and component tests once
npm test

# Run tests in interactive watch mode
npx vitest
```

### Step 4: Run Code Quality Checks
```bash
# Run ESLint
npm run lint

# Check code formatting with Prettier
npm run format
```

### Step 5: Build for Production
```bash
npm run build
```
The output files will be compiled and bundled into the `dist/` directory.

### Step 6: Preview Production Build
```bash
npx vite preview
```
Runs a local web server to test the production artifacts at `http://localhost:4173`.

---

## 4. Full-Stack End-to-End Execution (Frontend + Backend)

To test the complete system with the real backend and MySQL database:

1. **Start the MySQL Docker container**:
   ```bash
   docker start paypulse-mysql
   ```
2. **Start the ASP.NET Core API server**:
   ```bash
   dotnet run --project src/PayPulse.Api --urls "http://127.0.0.1:5000"
   ```
3. **Start the Vite frontend**:
   ```bash
   npm run dev
   ```
4. **Open your browser** to `http://localhost:5173`.

---

## 5. Pre-Configured Test Credentials

| Username / Email | Role | Password |
| :--- | :--- | :--- |
| `admin` or `admin@paypulse.internal` | **System Administrator** | `Password@123` |
| `farzana.hr` or `farzana.rahman@paypulse.internal` | **HR Manager** | `Password@123` |
| `rafiq.payroll` or `rafiqul.islam@paypulse.internal` | **Payroll Officer** | `Password@123` |
| `mahbub.supervisor` or `mahbub.alam@paypulse.internal` | **Department Supervisor**| `Password@123` |
| `nusrat.employee` or `nusrat.jahan@paypulse.internal` | **Employee** | `Password@123` |
