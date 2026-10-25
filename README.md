# AL Communication (Version 2.0) - Sri Lankan Retail & Mobile Reload POS System

A high-performance, mobile-first, desktop-responsive Single Page Application (SPA) designed for **AL Communication** retail stationery and mobile reload operations in Sri Lanka. Hosted statically on **GitHub Pages** with live cloud persistence via **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**.

---

## What's New in Version 2.0

### 1. Mobile Session Stability & Smooth Auth Gate Transition
- **Persistent Mobile Authentication:** Configured explicit `setPersistence(auth, browserLocalPersistence)` in [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js) ensuring reliable login sessions across mobile Safari/Chrome and desktop browsers.
- **Smooth Startup Gate Screen (`#authGateScreen`):** Eliminates jarring login form flashes on initial load. Users with active sessions transition seamlessly into the store counter ledger within a smooth ~1.5s verification window.

### 2. Apple iOS-Inspired Frosted Glass Effect & UI Style Engine
- **iOS Frosted Glass UI:** Implemented translucent backdrops with high-density backdrop blur (`backdrop-filter: blur(16px)`), specular light highlights, and sleek borders.
- **UI Style Toggle in Settings:** Switch between **Glass UI** (iOS Frosted Glass) and **Default UI** (Clean Solid Minimal) across all 4 color palettes (*Modern Slate*, *Emerald Store*, *Sapphire Blue*, *Warm Amber*).
- **Subtle Glass Ripple Feedback:** Lightweight, non-blocking click ripple feedback (`.glass-ripple`) on interactive buttons.

### 3. Reload Section Upgrades & Dynamic Presets
- **Dedicated Mobile Number Field:** Input bar alongside the reload amount for capturing customer phone numbers (`07X XXX XXXX`).
- **Prompt Simplification:** Reload amount label prompt strictly renamed to **"Amount"**.
- **Dynamic Quick Presets:** Configurable reload preset buttons (e.g. Rs. 50, 100, 200, 500, 1000, 2000) managed live from Settings (`settings/presets` in Firestore).
- **Mobile Number in Logs & Reports:** Displayed in Master Logs table and included in client-side PDF export statements.

### 4. Consolidated Master Logs & Customizable Performance Overview
- **Zero-Distraction Counter:** Removed secondary analytics and paragraphs from Dashboard, Stationery, and Reloads views to maintain an ultra-clean, straightforward cashier experience for shop staff and family members.
- **Consolidated Performance Grid in Master Logs:** Centralizes 6 metric cards:
  1. *Today's Stationery* (Sales, Units Sold, Transaction Count)
  2. *Today's Reloads* (Reload Volume, Earned Commissions)
  3. *Total Today Revenue* (Combined Store Net)
  4. *Monthly Statement* (Dynamic Month-Picker Analytics)
  5. *Annual YTD Statement* (Year-to-Date Store Net)
  6. *Operator Breakdown* (Airtel, Dialog, Mobitel, Hutch Volume)
- **Interactive Drag & Drop Reordering:** HTML5 drag-and-drop to arrange cards in custom sequence, persisted in `localStorage`.
- **Card Resizing:** One-click resize button toggles individual cards between normal (1-column) and wide (2-column) span, persisted in `localStorage`.
- **Layout Reset:** Dedicated button to restore default card ordering and dimensions at any time.

### 5. Stationery Entry & Real-Time Stock Engine
- **Quantity Steppers & Presets:** Stepper controls (`+`/`-`) and quick pills (`1`, `2`, `5`, `10`) with live total calculation (`Price × Quantity`).
- **Real-Time Stock Preview Badge:** Instant indicators (`In Stock`, `Low Stock ≤ 5`, `Out of Stock`) fetched on item code or name input.
- **Automatic Stock Deduction:** Submitting a sale decrements `stockQuantity` in Firestore via `increment(-quantity)`.
- **Enter-Key Rapid Checkout:** Instant autocomplete matching and entry submission on `Enter`.

### 6. Client-Side PDF Report Engine (`jsPDF` + `autoTable`)
- Clean commercial statement branded for **AL Communication**.
- Executive financial summary box with period sales, reload volume, earned commissions, and total revenue.
- Detailed tables for Stationery Sales and Mobile Reloads (including Mobile Number and operator breakdown).

---

## Project Structure

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/index.html) | Semantic SPA markup, Auth Gate Screen, Minimalist Banners, Draggable Cards Grid, Settings Modals |
| [`styles.css`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/styles.css) | iOS glassmorphism definitions, 4 color palettes, drag-and-drop states, card sizing rules |
| [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular exports, `browserLocalPersistence`, Firestore `increment` |
| [`app.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/app.js) | State management, dynamic presets, drag-and-drop layout engine, cent rounding, PDF generation |
| [`firestore.rules`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firestore.rules) | Production security rules restricting data access strictly to authenticated shop staff |

---

## Currency & Precision Rule

All financial calculations enforce strict Sri Lankan Rupee two-decimal cent precision:
$$\text{roundCurrency}(x) = \frac{\text{round}((x + \varepsilon) \times 100)}{100}$$

Formatted in LKR: `Rs. 1,250.00`.

---

## Deployment to GitHub Pages

1. Commit and push the updated files:
   ```bash
   git add .
   git commit -m "AL Communication Version 2.0 Release"
   git push origin main
   ```
2. Open your GitHub Pages URL: `https://<username>.github.io/AL-P1/`
3. Sign in using the store owner credentials (`lasasdias11@gmail.com`).
