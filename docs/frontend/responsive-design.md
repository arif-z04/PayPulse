# Responsive Design & Multi-Device Layout Guide

This document outlines the responsive architecture, breakpoint specifications, and multi-device usability considerations implemented in the **PayPulse** frontend.

---

## 1. Breakpoint Architecture

PayPulse utilizes standard Tailwind CSS responsive breakpoints tailored to modern enterprise form factors:

| Breakpoint | Viewport Width | Typical Target Hardware | Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile (`< sm`)** | `360px – 639px` | iPhone SE, iPhone 14/15, Samsung Galaxy | Collapsible slide-over drawer, single-column KPI grid, stacked forms, scrollable data tables |
| **Tablet (`sm – md`)** | `640px – 1023px` | iPad Mini, iPad 10th Gen, Galaxy Tab | 2-column KPI grid, collapsible navigation, adaptable form field pairs |
| **Laptop / Desktop (`lg`)**| `1024px – 1279px`| MacBook Air, ThinkPad, 1080p Laptops | Persistent sidebar navigation, 4-column KPI grid, multi-column analytics charts |
| **Large Desktop (`xl+`)** | `>= 1280px / 1440px` | 1440p / 4K Monitors, Ultrawide | Maximized content container with contained max-width (`max-w-7xl`) |

---

## 2. Adaptive Component Implementations

### A. Navigation Shell (`Sidebar.tsx` & `Header.tsx`)
- **Desktop (`lg:`)**:
  - Persistent left sidebar (`w-64`) with fixed viewport pinning.
  - The main workspace adopts a permanent left padding (`lg:pl-64`).
- **Mobile / Tablet (`< lg`)**:
  - The sidebar collapses off-screen (`-translate-x-full`).
  - A hamburger menu trigger in the sticky header toggles a sliding drawer with a dark backdrop overlay (`bg-slate-900/50 backdrop-blur-sm`).
  - Clicking outside the drawer or tapping any navigation link automatically closes the drawer.

### B. Dashboard KPI Cards (`StatCard.tsx`)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stat Cards */}
</div>
```
- **1 Column** on compact mobile viewports to prevent squishing text.
- **2 Columns** on tablet screens.
- **4 Columns** on standard desktop viewports.

### C. Tabular Data Presentation (`DataTable.tsx`)
- Data tables are wrapped inside an accessible horizontal scrolling container (`overflow-x-auto` with subtle scrollbar styling).
- Text truncation and minimum column widths ensure that complex payroll line items and employee codes never cause accidental full-page horizontal overflow.
- Interactive action buttons (View, Edit, Approve) maintain touch-friendly heights (`min-h-[38px]`).

### D. Modal Dialogs (`Modal.tsx`)
- Mobile viewports enforce `max-w-[95vw]` with vertical scrolling (`max-h-[90vh] overflow-y-auto`) to guarantee dialogs never clip outside mobile screens.
- On desktop, dialogs expand smoothly to `max-w-lg`, `max-w-2xl`, or `max-w-4xl` depending on form complexity.

---

## 3. Viewport Verification Matrix

| Target Viewport | Screen Width | Verification Observations | Status |
| :--- | :---: | :--- | :---: |
| **Mobile Compact** | `360px` | Zero horizontal page scrolling; single-column KPI stack; touch targets accessible | **Verified** |
| **Mobile Standard**| `390px` | Header actions stack neatly; search modal fits viewport; forms readable | **Verified** |
| **Tablet Portrait**| `768px` | 2-column dashboard layout; charts resize with container; sidebar collapses smoothly | **Verified** |
| **Tablet Landscape**| `1024px` | Persistent sidebar engages; 4-column KPI grid renders; table columns fully visible | **Verified** |
| **Desktop High-Res**| `1440px` | Balanced whitespace; chart tooltips track smoothly; no visual distortion | **Verified** |
