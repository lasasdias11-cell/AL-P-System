# AL Communication (Version 5.1) — Retail POS, Global Search & Store Ledger

A production-ready, ultra-polished, high-performance Single Page Application (SPA) designed for **AL Communication** — a retail stationery, utility bill collection, and mobile reload store in Sri Lanka. Hosted on **GitHub Pages** (`https://lasasdias11-cell.github.io/AL-P-System/`) and backed by **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**.

- **Live URL:** `https://lasasdias11-cell.github.io/AL-P-System/`
- **Store Owner Account:** `lasasdias11@gmail.com`
- **Primary Currency:** Sri Lankan Rupees (LKR / Rs.) with exact 2-decimal cent precision (`0.00`)

---

## What's New in Version 5.1

### 1. Refined Default UI
- **Default UI only:** No Glass UI option or frosted modal treatment. The optional gradient blur is limited to the branded header and Profile surface.
- **Theme-matched header:** Sticky header gradients adapt to the selected theme; the blur can be disabled in Settings and respects reduced-motion preferences.
- **Typography:** Inter body text with Outfit headings and tabular numeric precision for Sri Lankan currency.

### 2. Sticky Branded Header & Official Logo
- **Sticky Navigation:** Header remains fixed at the top (`position: sticky; top: 0; z-index: 50;`) across all scroll positions.
- **Official Brand Logo:** Stamped with official `images/logo.png` alongside the **AL Communication** brand title on the header, login screen, and exported PDF reports.
- **One-Thumb Mobile Navigation:** Active-state highlighting, touch-friendly bottom navigation, and a collapsible navigation drawer on mobile and tablet devices.
- **Audited Navigation Routes:** 100% of buttons, quick tiles, and modal triggers route accurately to their intended sections without dead links.

### 3. Universal Global Search Engine
- **Instant Interactive Search:** Integrated into the sticky header with `Ctrl + K` (or `/`) keyboard shortcut and mobile toggle.
- **Multi-Collection Scope:** Searches dynamically across:
  1. **Catalog Items & Stock Inventory** (Item code, name, category)
  2. **Mobile Reload Logs** (Phone numbers, operators, amounts)
  3. **Stationery & Utility Bill Transactions** (Item names, codes, reference numbers)
  4. **Pages, dashboard cards, and Settings sections**
- **Instant Jumps:** Click or press Enter to open the first matching page, settings panel, or record.

### 4. Support for Service / Utility Bill Items (No Quantity)
- **Item Classification Toggle:** Added an item type selector in Master Catalog:
  - **Physical Product (Track Stock):** Requires stock quantity and deducts stock on sale.
  - **Service / Utility Bill (No Quantity):** Designed for Electricity (CEB/LECO), Water Board (NWSDB), and Broadband bill payments. Does *not* require or track stock, displays `"Service / Bill"` badge, and allows entering custom bill amounts directly at the POS counter without stock deduction.

### 5. Automatic Title Case Formatting
- Automatically formats item names so the first letter of every word is capitalized (e.g. typing `a4 cr books` or `A4 CR BOOKS` automatically formats and saves as `A4 Cr Books`).

### 6. Alphabetical Catalog & Advanced Sorting
- Catalog and inventory default to **Name: A → Z**.
- Sort options cover both name directions, selling price, cost price, stock quantity, and newest/oldest added. Each page remembers its selection locally.

### 7. Dashboard with Exactly 7 Metric Cards
Displayed alongside quick-action navigation buttons:
1. **Today's Stationery Sales** (Total LKR amount)
2. **Today's Reload Sales** (Total LKR volume)
3. **Today's Reload Commissions** (Clean signed LKR amount)
4. **Today's Stationery Profit** (Calculated net margin in LKR)
5. **Total Active Catalog** (Count of active items & services)
6. **All Reload Commissions (Total)** (Lifetime)
7. **Stationery Profit (Total)** (Lifetime)

Operational quick-access buttons neatly arranged below:
- Stationery Entry (`#dashTileStationery`)
- Mobile Reloads (`#dashTileReloads`)
- Stock Inventory (`#dashTileStock`)
- Master Logs (`#dashTileLogs`)
- Settings and Profile

### 8. Filtered Master Logs & Stamped PDF
- Today, All Time, specific-date, custom-range, and text filters update the ledger and three summary cards in real time.
- Summary cards show filtered reload sales/profit, stationery and bill sales/profit, and combined total profit.
- PDF reports include the selected date range, filtered summaries, and transaction rows.

### 9. Settings Backup & Restore System
- **Save / Export Backup:** Saves a per-user snapshot of preferences, sort order, dashboard layout, catalog items, commission rates, and reload presets to `localStorage` and downloads a `.json` backup file.
- **Restore Previous Settings:** One-click restore button and `.json` file upload to safely roll back catalog data, rates, and preferences.
- **Restore Defaults:** A separately confirmed action resets the applicable user and administrator preferences.

### 10. Deployment Security Note
- Enable **Firebase App Check** in the Firebase Console for additional abuse protection. App Check complements—not replaces—Firebase Authentication and the deployed Firestore security rules.

---

## File Architecture

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/INTEL/Documents/AL-P1/index.html) | Responsive SPA layout, sticky branded header, global search, seven dashboard cards, POS, inventory, filtered logs, Profile, and Settings |
| [`styles.css`](file:///c:/Users/INTEL/Documents/AL-P1/styles.css) | Theme tokens, tabular LKR numerics, header/Profile gradient blur, responsive navigation and layouts |
| [`firebase-config.js`](file:///c:/Users/INTEL/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular exports, `browserLocalPersistence`, Firestore `increment` |
| [`app.js`](file:///c:/Users/INTEL/Documents/AL-P1/app.js) | Core system logic, global search, catalog sorting, title-case formatting, stock recovery, backup/restore, and filtered PDF reports |
| [`firestore.rules`](file:///c:/Users/INTEL/Documents/AL-P1/firestore.rules) | Production security rules supporting physical products, utility bills, reloads, and settings backups |
| [`images/logo.png`](file:///c:/Users/INTEL/Documents/AL-P1/images/logo.png) | Official AL Communication brand logo asset |
