# AL Communication (Version 5.0) — High-Contrast Modern Retail POS, Global Search & Store Ledger

A production-ready, ultra-polished, high-performance Single Page Application (SPA) designed for **AL Communication** — a retail stationery, utility bill collection, and mobile reload store in Sri Lanka. Hosted on **GitHub Pages** (`https://lasasdias11-cell.github.io/AL-P-System/`) and backed by **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**.

- **Live URL:** `https://lasasdias11-cell.github.io/AL-P-System/`
- **Store Owner Account:** `lasasdias11@gmail.com`
- **Primary Currency:** Sri Lankan Rupees (LKR / Rs.) with exact 2-decimal cent precision (`0.00`)

---

## What's New in Version 5.0

### 1. Polished Solid Default UI (Glassmorphism Purged)
- **Glass UI Completely Removed:** All experimental `backdrop-filter` blur effects, `.glass-ui-active` toggles, WebGL particle layers, and translucent glass overlays have been completely removed.
- **High-Contrast Modern Theme:** Upgraded to crisp solid cards (`1px solid var(--border-color)`), solid sticky headers, subtle shadows, fast native performance, and high-contrast typography optimized for both **Dark Mode** (Default Modern Slate) and **Light Mode** (Emerald Clean).
- **Inter Typography:** High-contrast legible typography with clear visual hierarchy and tabular numeric precision (`font-variant-numeric: tabular-nums;`) for Sri Lankan currency.

### 2. Sticky Branded Header & Official Logo
- **Sticky Navigation:** Header remains fixed at the top (`position: sticky; top: 0; z-index: 50;`) across all scroll positions.
- **Official Brand Logo:** Stamped with official `images/logo.png` alongside the **AL Communication** brand title on the header, login screen, and exported PDF reports.
- **One-Thumb Mobile Navigation:** Clean active-state highlighting for current views and tactile bottom navigation on mobile devices.
- **Audited Navigation Routes:** 100% of buttons, quick tiles, and modal triggers route accurately to their intended sections without dead links.

### 3. Universal Global Search Engine
- **Instant Interactive Search:** Integrated into the sticky header with `Ctrl + K` (or `/`) keyboard shortcut and mobile toggle.
- **Multi-Collection Scope:** Searches dynamically across:
  1. **Catalog Items & Stock Inventory** (Item code, name, category)
  2. **Mobile Reload Logs** (Phone numbers, operators, amounts)
  3. **Stationery & Utility Bill Transactions** (Item names, codes, reference numbers)
- **Instant Jumps:** Categorized dropdown jumps directly to the selected record or POS transaction upon click.

### 4. Support for Service / Utility Bill Items (No Quantity)
- **Item Classification Toggle:** Added an item type selector in Master Catalog:
  - **Physical Product (Track Stock):** Requires stock quantity and deducts stock on sale.
  - **Service / Utility Bill (No Quantity):** Designed for Electricity (CEB/LECO), Water Board (NWSDB), and Broadband bill payments. Does *not* require or track stock, displays `"Service / Bill"` badge, and allows entering custom bill amounts directly at the POS counter without stock deduction.

### 5. Automatic Title Case Formatting
- Automatically formats item names so the first letter of every word is capitalized (e.g. typing `a4 cr books` or `A4 CR BOOKS` automatically formats and saves as `A4 Cr Books`).

### 6. Natural Numerical Ordering & Advanced Sorting
- **Natural Numeric Sort (Default):** Item numbers and codes automatically sort in ascending order (`1, 2, 3... 10, 11...` using `localeCompare(..., undefined, { numeric: true })`) in both Stock Inventory and Settings Catalog.
- **Interactive Sort Selector:**
  - Item Number: Low to High (Default)
  - Item Number: High to Low
  - Price: Low to High
  - Price: High to Low
  - Stock Quantity: Low to High (Low Stock First)
  - Stock Quantity: High to Low
  - Name: A to Z

### 7. Clean Dashboard with Strictly 6 Metric Cards
Displayed alongside quick-action navigation buttons:
1. **Today's Stationery Sales** (Total LKR amount)
2. **Today's Reload Sales** (Total LKR volume)
3. **Today's Reload Commissions** (Clean LKR amount only — strictly NO `"Comm."` text)
4. **Today's Stationery Profit** (Calculated net margin in LKR)
5. **Total Active Catalog** (Count of active items & services)
6. **Combined Total Profit** (Today's Reload Commissions + Today's Stationery Profit combined)

Operational quick-access buttons neatly arranged below:
- Stationery Entry (`#dashTileStationery`)
- Mobile Reloads (`#dashTileReloads`)
- Stock Inventory (`#dashTileStock`)
- Master Logs (`#dashTileLogs`)

### 8. Master Logs Paired Summary Cards & Stamped PDF
- **Two Unified Summary Blocks:**
  - **Today's Reloads Card:** Total Reload Sales on top with Reload Profit (Commission) displayed cleanly directly below it.
  - **Today's Stationery & Bills Card:** Total Stationery/Bill Amount on top with Stationery Profit displayed cleanly directly below it.
- **Stamped PDF Statement Export:** Stamped with official `images/logo.png`, store header, and itemized transaction tables.

### 9. Settings Backup & Restore System
- **Save / Export Backup:** Saves a timestamped snapshot of the user's settings (catalog items, commission rates, reload presets, theme preferences) to `localStorage` and downloads a `.json` backup file.
- **Restore Previous Settings:** One-click restore button and `.json` file upload to safely roll back catalog data, rates, and preferences.

---

## File Architecture

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/INTEL/Documents/AL-P1/index.html) | High-contrast semantic SPA layout, sticky branded header, global search bar, 6 dashboard cards, POS, Reloads, Stock Inventory, Master Logs, and Settings Backup modal |
| [`styles.css`](file:///c:/Users/INTEL/Documents/AL-P1/styles.css) | Solid modern theme tokens, tabular LKR numerics, purged blur effects, sticky header, search dropdown, paired summary blocks |
| [`firebase-config.js`](file:///c:/Users/INTEL/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular exports, `browserLocalPersistence`, Firestore `increment` |
| [`app.js`](file:///c:/Users/INTEL/Documents/AL-P1/app.js) | Core system logic, global search engine, natural numeric sorting, title case formatter, service/bill POS flow, backup & restore engine, stamped PDF generator |
| [`firestore.rules`](file:///c:/Users/INTEL/Documents/AL-P1/firestore.rules) | Production security rules supporting physical products, utility bills, reloads, and settings backups |
| [`images/logo.png`](file:///c:/Users/INTEL/Documents/AL-P1/images/logo.png) | Official AL Communication brand logo asset |
