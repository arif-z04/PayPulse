# PayPulse UI Design System & Component Library

This document outlines the visual design system, design tokens, color palette, typography, and reusable UI components implemented in the **PayPulse** frontend.

---

## 1. Visual Design Principles

PayPulse embodies a clean, modern enterprise SaaS aesthetic inspired by leading financial and human resources platforms:
- **Light Theme Default**: Crisp white cards (`bg-white`), subtle neutral backgrounds (`bg-slate-50`), and defined border lines (`border-slate-200`).
- **Restrained Primary Accent**: Professional deep indigo-blue (`brand` palette: `#4f46e5` / `rgb(79, 70, 229)`) for primary actions, active navigation states, and key data highlights.
- **Clear Information Density**: Balanced spacing, clear visual hierarchy, legible financial amounts (`BDT ৳`), and scan-friendly tabular layouts.
- **Accessible State Feedback**: Status communication pairs color with text labels and iconography to ensure WCAG AA compliance.

---

## 2. Design Tokens & Color Palette

### Primary Brand Palette
```css
/* Tailwind brand configuration */
--color-brand-50:  #eef2ff;
--color-brand-100: #e0e7ff;
--color-brand-500: #6366f1;
--color-brand-600: #4f46e5; /* Primary CTA Button */
--color-brand-700: #4338ca;
--color-brand-950: #1e1b4b; /* Dark Banner Accents */
```

### Semantic Status Indicators

| Status Category | Background | Border | Text | Example Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Active / Approved / Present** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` | Active Employee, Approved Leave, On-Time Attendance |
| **Pending / Late / Half-Day** | `bg-amber-50` | `border-amber-200` | `text-amber-700` | Pending Leave, Biometric Late Arrival, Draft Payroll |
| **Terminated / Rejected / Absent**| `bg-rose-50` | `border-rose-200` | `text-rose-700` | Rejected Leave, Absent Biometric, Disapproved Request |
| **Processing / Informational** | `bg-sky-50` | `border-sky-200` | `text-sky-700` | Processing Disbursement, System Informational Notice |

---

## 3. Reusable UI Components Catalog (`src/components/common/`)

### 1. `Badge.tsx`
Renders compact status indicators with semantic styling.
- **Variants**: `success`, `warning`, `danger`, `info`, `neutral`, `brand`.
- **Sizes**: `sm`, `md`.

### 2. `StatCard.tsx`
KPI metric summary card featuring:
- Value title and formatted amount (`৳`).
- Trend pill with positive/negative icon and percentage.
- Configurable icon with tinted background badge.

### 3. `DataTable.tsx`
Generic, fully accessible, high-performance table component:
- Type-safe column definitions (`key`, `header`, `render`).
- Column-based ascending / descending sorting.
- Search query filtering.
- Pagination controls (Page numbers, Next/Previous, rows per page selector).
- Built-in empty and loading states.

### 4. `Modal.tsx` & `ConfirmDialog.tsx`
Accessible modal dialog primitives:
- Backdrop blur (`bg-slate-900/40 backdrop-blur-sm`).
- ESC keyboard listener and backdrop click-to-dismiss.
- Explicit confirmation workflows for sensitive operations (e.g., payroll disbursement, employee termination).

### 5. `FormField.tsx`, `Input.tsx`, & `Select.tsx`
Standardized form controls:
- Semantic `<label>` with required indicator (`*`).
- Distinct focus states (`focus:ring-2 focus:ring-brand-500 focus:border-brand-500`).
- Inline error messages mapping server-side validation dictionaries.

### 6. `Skeleton.tsx`
Smooth pulse animation placeholders mimicking component geometry during asynchronous data fetching.

### 7. `EmptyState.tsx` & `ErrorState.tsx`
Informative recovery surfaces featuring contextual icons, explanatory descriptions, and actionable recovery buttons.
