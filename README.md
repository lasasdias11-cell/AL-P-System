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

