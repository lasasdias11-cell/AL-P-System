# AL Communication (V1.0) - Retail Stationery & Mobile Reload POS System

A professional, enterprise-grade Single Page Application (SPA) designed for **AL Communication** retail stationery and mobile reload operations in Sri Lanka. Powered by **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**, hosted seamlessly on **GitHub Pages**.

---

## 🏬 What's New in V1.0 System Upgrade

### 1. Global UI & Branding Re-polish
- **Official Brand:** Upgraded to **AL Communication** across headers, statements, and documentation.
- **Clean Enterprise Interface:** Complete elimination of emojis in favor of crisp inline SVG vector icons and clean commercial typography.
- **Mobile & Desktop Optimization:** Minimum 44x48px touch targets for rapid counter checkout, no horizontal viewport scrolling, and high-density desktop views.

### 2. Restructured Master Inventory Catalog
- **Selling Price & Stock Focus:** Completely removed the `Cost Price (Taken)` field. The catalog now operates strictly on **Selling Price** and **Stock Quantity**.
- **Mandatory Stock Adder:** Master catalog form enforces initial stock quantities for all new and edited products.
- **Live Stock Table:** Catalog table clearly displays Item Code, Item Name, Selling Price (Rs.), Current Stock Quantity, and Actions.

### 3. Stationery Entry & Real-Time Stock Deduction
- **Quantity Adder:** Stepper buttons (`+`/`-`) and quick presets (`1`, `2`, `5`, `10`) with live total calculation (`Price × Quantity`).
- **Real-Time Stock Preview:** Instant badge indicators showing live remaining units (`In Stock`, `Low Stock ≤ 5`, `Out of Stock`).
- **Automatic Stock Deduction:** Submitting a stationery sale automatically decrements the item's `stockQuantity` in Cloud Firestore in real time.
- **Enter-Key Auto-Add Fix:** Instant matching and auto-submission upon pressing `Enter`—no mouse clicks required at the checkout counter.

### 4. Dedicated Stock Inventory Levels Module
- High-visibility dashboard shortcut tile to inspect product stock balances.
- Real-time stock search and filters (`All Items`, `Low Stock`, `Out of Stock`).
- Rapid counter replenishment buttons (`+5`, `+10`, or custom restock amount).

### 5. Consolidated Master Logs & Advanced Filtering
- Unified master transaction ledger combining Stationery Sales and Mobile Reloads.
- Dynamic filtering by **Today**, **Yesterday**, **This Month**, or custom **Date Range** (`From Date` to `To Date`).
- Summary KPI bar for the filtered period (Stationery Sales, Units Sold, Reload Volume, Commissions, Total Period Revenue).

### 6. Professional Client-Side PDF Report Engine
- **"Download PDF Report"** button inside the Master Log section powered by `jsPDF` and `jspdf-autotable`.
- Formatted commercial PDF statement with:
  - Header: **AL Communication**
  - Statement period metadata and generation timestamps
  - Financial KPI Executive Summary box
  - Detailed Stationery Sales Table with itemized quantities and totals
  - Mobile Reload Log with operator breakdown and commission calculations
  - Auto page numbering (`Page X of Y`).

### 7. Monthly & Yearly Financial Analytics
- Store-wide aggregated analytics combining Stationery Sales and Mobile Reload Commissions.
- Month-picker selector for dynamic Monthly Statements and Annual Year-to-Date (YTD) financial cards.

---

## 🗄️ File Deliverables

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/index.html) | Semantic SPA layout, clean SVG icons, POS counter bar, Master Logs, PDF exporter |
| [`styles.css`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/styles.css) | 4 dynamic themes, stock status pills, quantity steppers, mobile touch optimizations |
| [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular initialization, `increment`, Auth & Firestore exports |
| [`app.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/app.js) | State manager, Firestore live sync, exact cent math, PDF compiler, stock deduction |
| [`firestore.rules`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firestore.rules) | Production security rules restricting read/write strictly to authenticated store owner |

---

## 🪙 Currency Math Rule

All monetary math enforces exact two decimal cent precision:
$$\text{roundCurrency}(x) = \frac{\lfloor(x + \varepsilon) \times 100\rfloor}{100}$$
Formatted in Sri Lankan Rupees: `Rs. 1,250.00`.

---

## 🚀 GitHub Pages Deployment Guide

1. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Upgrade: AL Communication V1.0 System Release"
   git push origin main
   ```
2. **Access App:**
   - Open `https://<your-username>.github.io/AL-P1/`
   - Log in with `lasasdias11@gmail.com`
