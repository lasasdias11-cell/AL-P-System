# AL Communication (Version 3.1) - Sri Lankan Retail POS, Ledger & Profit Tracker

A high-performance, mobile-first, desktop-responsive Single Page Application (SPA) designed for **AL Communication** — a retail stationery and mobile reload shop in Sri Lanka. Hosted statically on **GitHub Pages** (`AL-P-System`) with live cloud persistence via **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**.

- **Live URL:** `https://lasasdias11-cell.github.io/AL-P-System/`
- **Owner Account:** `lasasdias11@gmail.com`
- **Primary Currency:** Sri Lankan Rupees (LKR / Rs.) with exact 2-decimal cent precision (`0.00`)

---

## What's New in Version 3.1

### 1. Cost ("Getting") Price & Automated Profit Engine
- **Master Catalog Cost Tracking:** Every catalog item records both **Selling Price** (`sellingPrice`) and **Cost / Getting Price** (`costPrice`), validated to non-negative 2-decimal numbers.
- **Hidden Cost at POS:** The counter checkout screen shows *only* the Selling Price to keep cashier operations fast and confidential when customers are at the counter.
- **Transaction-Time Profit Snapshot:** When a stationery sale occurs, the system snapshots `costPrice`, `sellingPrice`, `unitProfit = sellingPrice - costPrice`, and `profit = unitProfit * quantity`. Past financial reports remain 100% accurate even if catalog prices change in the future.
- **Reload Profit Equivalence:** As mobile reloads carry zero inventory cost, reload profit strictly equals the earned commission (`profit = commissionAmount`).
- **Comprehensive Profit Metrics:**
  - **Today's Profit:** Combined stationery profit + reload commission for the current day.
  - **This Month's Profit:** Accumulated profit across the current calendar month.
  - **This Year's Profit:** Year-to-date profit across stationery and reload operations.

---

### 2. Touch & Mouse Drag-and-Drop Dashboard Customization
- **Reorderable Dashboard Grid (`#dashboardGrid`):** Cashiers can rearrange all 7 metric cards and 4 shortcut tiles to prioritize what matters most during busy counter hours.
- **Dual Mouse & Touch Engine:** Native HTML5 Drag-and-Drop for desktop pointer devices, plus high-precision touch event handling (`touchstart`, `touchmove`, `touchend` using `document.elementFromPoint` and `touch-action: none`) for mobile counter phones.
- **Cloud & Local Persistence:** Card order is saved to Firestore under `settings/dashboard` (syncing across devices) and mirrored in `localStorage` for instant offline boot.
- **Instant Layout Reset:** A dedicated "Reset Layout" action restores the default metric and tile sequence.

---

### 3. Apple iOS Frosted Glassmorphism Engine & Tactile 3D Physics
- **CSS Houdini Registered Angles:** Uses `@property --angle-1` and `@property --angle-2` for smooth, GPU-accelerated specular rim lighting without CSS reflows.
- **True Translucent Frosted Glass:** High-blur backdrops (`backdrop-filter: blur(20px) saturate(180%)`), inner specular sheen, and dynamic ambient reflections active globally when Glass UI is selected.
- **3D Tactile Button Press Physics:** Interactive buttons wrapped in `.button-wrap` use CSS `:has()` to deliver real tactile depth with spring transitions on press.
- **Keyframe Motion Graphics:** Smooth entrance transitions (`glassPageIn`) and non-distracting pulse animations (`metricCardPulse`) for updated values.
- **Adaptive Light & Dark Modes:** Glassmorphism dynamically shifts between deep frosted glass and crisp light-surface translucency across all 4 store color palettes (*Modern Slate*, *Emerald Store*, *Sapphire Blue*, *Warm Amber*).

---

### 4. Zero "Comm." Text & Clean Currency Formatting
- Completely purged the `"Comm."` suffix from all metric cards, tables, logs, and reports.
- All commissions and reload earnings display strictly as clean currency amounts (e.g. `+Rs. 10.67`).

---

### 5. Master Logs with Date Range Filtering & PDF Statement Engine
- **Flexible Date Filters:** Instant toggles for **Today**, **Yesterday**, **This Month**, **Specific Date**, and **Custom Date Range** (`startDate` to `endDate`).
- **Dedicated Profit Columns:** Both stationery logs and aggregated summaries display line-item cost and net profit.
- **Client-Side jsPDF Statement Generator:**
  - Professional commercial statement branded for **AL Communication**.
  - Executive financial summary box with period Sales, Cost of Goods Sold, Reload Volume, Earned Reload Commission, and Net Profit.
  - Formatted tables with exact column alignment for quick bookkeeping and accounting.

---

### 6. Mobile Session Stability & Auth Gate
- **Persistent Mobile Authentication:** Configured with `setPersistence(auth, browserLocalPersistence)` in [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js), keeping the store owner signed in across mobile Safari/Chrome and desktop browsers.
- **Smooth Auth Gate (`#authGateScreen`):** Eliminates form flickering while validating credentials on cold app launches.

---

## Project Structure

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/index.html) | Semantic SPA markup, Auth Gate Screen, Draggable Dashboard Grid (7 metrics + 4 shortcuts), POS with hidden cost price, Reload section with phone input, Master Logs with date filters, Settings modal with Master Catalog editor (Cost & Selling price), jsPDF generator |
| [`styles.css`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/styles.css) | iOS Frosted Glass engine, CSS Houdini `@property` angles, 3D tactile button press physics (`:has()`), motion keyframes, light/dark themes, drag-and-drop visual states |
| [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular exports, `browserLocalPersistence`, Firestore `increment` |
| [`app.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/app.js) | Core state manager, profit engine, POS Enter-key flow, reload logic, mouse/touch drag-and-drop controller, Firestore listeners, date filters, jsPDF report builder |
| [`firestore.rules`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firestore.rules) | Production security rules enforcing single-owner authorization and strict data validations for `costPrice`, `sellingPrice`, `profit`, and stock quantities |

---

## Currency & Precision Rule

All financial values enforce strict Sri Lankan Rupee two-decimal cent precision:
$$\text{roundCurrency}(x) = \frac{\text{round}((x + \varepsilon) \times 100)}{100}$$

Formatted in LKR: `Rs. 1,250.00`.

---

## Deployment to GitHub Pages

1. Stage and commit the project files:
   ```bash
   git add .
   git commit -m "AL Communication Version 3.1: Profit Engine, Drag-and-Drop Dashboard & iOS Glassmorphism"
   git push origin main
   ```
2. In your GitHub repository (`AL-P-System`):
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment**, select **Source:** `Deploy from a branch`.
   - Select branch `main` and directory `/ (root)`.
   - Click **Save**.
3. Visit the live store system:
   `https://lasasdias11-cell.github.io/AL-P-System/`
4. Sign in with the shop owner credentials (`lasasdias11@gmail.com`).
