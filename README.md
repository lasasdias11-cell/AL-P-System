# AL Communication (Version 4.0) - High-End Sri Lankan Retail POS, Three.js & Motion Ledger

A next-generation, high-performance, mobile-first, desktop-responsive Single Page Application (SPA) designed for **AL Communication** — a retail stationery and mobile reload shop in Sri Lanka. Hosted statically on **GitHub Pages** (`AL-P-System`) with real-time cloud persistence via **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**.

- **Live URL:** `https://lasasdias11-cell.github.io/AL-P-System/`
- **Owner Account:** `lasasdias11@gmail.com`
- **Primary Currency:** Sri Lankan Rupees (LKR / Rs.) with exact 2-decimal cent precision (`0.00`)

---

## What's New in Version 4.0

### 1. Three.js / WebGL Interactive Anti-Gravity Canvas
- **Anti-Gravity Particle Engine:** 380 luminous floating particles drifting continuously upwards (`+vy`) through 3D space with harmonic wave oscillations.
- **Dynamic Glow Textures:** Canvas-generated radial soft glow textures for GPU-efficient, asset-free rendering.
- **Pointer & Touch Parallax:** Gentle camera deflection that tracks pointer movement and touch dragging on mobile devices.
- **Dynamic Theme Synchronization:** Particle color automatically transitions (via GSAP interpolations) when switching between store color themes (*Modern Slate*, *Emerald Store*, *Sapphire Blue*, *Warm Amber*).
- **Battery-Friendly Lifecycle:** Automatic render loop suspension when the browser tab is hidden or backgrounded.

---

### 2. Lenis Momentum Smooth Scroll
- **Momentum-Based Floating Feel:** Physics-driven smooth scrolling with exponential easing (`1.001 - 2^(-10t)`), eliminating choppy mousewheel jumps.
- **GSAP ScrollTrigger Sync:** Lenis scroll position is synced directly into GSAP's RAF ticker and ScrollTrigger update cycle.
- **Zero-Conflict Nested Scrolling:** Interactive modals, master logs tables, and catalog drawers include `data-lenis-prevent` to allow native high-speed scrolling without event trapping.

---

### 3. GSAP Timeline Transitions & Smooth Number Rollups
- **Rolling Metric Number Counters (`animateMetricValue`):** Financial totals (Today's Profit, Sales, Reloads, Monthly Profit, Annual Net) smoothly roll up with GSAP `power2.out` ease instead of abrupt text replacement.
- **View Transitions (`animateViewTransition`):** Switching tabs orchestrates a smooth fade-and-float entrance with subtle staggered card animations.
- **Modal Dynamics (`animateModalOpen`):** Settings, editing drawers, and password reset dialogs pop open with a tactile `back.out(1.5)` spring effect.
- **Button Micro-Interactions (`animateButtonPress`):** Tactile scale responses on preset pills, network operator tabs, and quantity steppers.

---

### 4. Apple iOS Frosted Glassmorphism & CSS Houdini
- **Registered CSS Houdini Properties:** Uses `@property --angle-1` and `@property --angle-2` for smooth, GPU-accelerated specular rim lighting without CSS reflows.
- **True Translucent Frosted Glass:** Multi-layer blur (`backdrop-filter: blur(20px) saturate(180%)`) positioned above the WebGL canvas, allowing the floating anti-gravity particles to subtly refract behind the glass cards.
- **3D Tactile Button Press Physics:** Interactive buttons wrapped in `.button-wrap` use CSS `:has()` selector physics to deliver real tactile depth on press.

---

### 5. Cost ("Getting") Price & Automated Profit Engine
- **Master Catalog Cost Tracking:** Every catalog item records both **Selling Price** (`sellingPrice`) and **Cost / Getting Price** (`costPrice`), validated to non-negative 2-decimal numbers.
- **Hidden Cost at POS:** Counter checkout screen displays *only* the Selling Price to keep shop margins confidential.
- **Transaction-Time Profit Snapshot:** When a stationery sale occurs, the system snapshots `costPrice`, `sellingPrice`, `unitProfit = sellingPrice - costPrice`, and `profit = unitProfit * quantity`. Past financial reports remain 100% accurate even if catalog prices change in the future.
- **Reload Profit Equivalence:** Mobile reload profit strictly equals the reload commission (`profit = commissionAmount`).
- **Comprehensive Profit Metrics:** Real-time KPI cards for **Today's Profit**, **This Month's Profit**, and **This Year's Profit**.

---

### 6. Zero "Comm." Text & Clean Currency Formatting
- Completely purged the `"Comm."` suffix from all metric cards, tables, logs, and reports.
- All commissions and reload earnings display strictly as clean currency amounts (e.g. `+Rs. 10.67`).

---

### 7. Reorderable Drag-and-Drop Dashboard (Desktop & Mobile Touch)
- Arrange all 7 metric cards and 4 shortcut tiles with mouse drag or mobile touch handles (`.drag-handle`).
- Card layout sequence persists both to Firestore (`settings/dashboard`) and `localStorage`.
- Dedicated "Reset Dashboard Layout" option in Settings.

---

### 8. Master Logs with Date Filtering & jsPDF Statement Generator
- Quick toggles for **Today**, **Yesterday**, **This Month**, **Specific Date**, and **Custom Date Range** (`startDate` to `endDate`).
- Client-side PDF export with executive profit breakdown and branded "AL Communication" formatting.

---

## Project Structure

| File | Description |
|---|---|
| [`index.html`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/index.html) | Semantic SPA markup, Lenis, GSAP, ScrollTrigger, Three.js, jsPDF CDNs, WebGL canvas, Draggable Dashboard Grid, POS counter, Reload section, Master Logs, Settings modal |
| [`styles.css`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/styles.css) | Lenis smooth scroll styles, WebGL canvas layer, iOS frosted glass engine, Houdini `@property` angles, 3D button physics, 4 color palettes |
| [`firebase-config.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firebase-config.js) | Firebase SDK v11 modular exports, `browserLocalPersistence`, Firestore `increment` |
| [`app.js`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/app.js) | Three.js particle engine, Lenis scroll controller, GSAP animations & counter rollups, profit engine, POS Enter-key flow, reload logic, drag-and-drop controller, jsPDF engine |
| [`firestore.rules`](file:///c:/Users/lasas/OneDrive/Documents/AL-P1/firestore.rules) | Production security rules enforcing single-owner authorization (`lasasdias11@gmail.com`) and strict numeric data validations |

---

## Deployment to GitHub Pages

1. Stage and commit the project files:
   ```bash
   git add .
   git commit -m "AL Communication V4.0: Three.js WebGL, Lenis Scroll, GSAP Motion & Glass POS"
   git push origin main
   ```
2. In your GitHub repository (`AL-P-System`):
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment**, ensure **Source:** `Deploy from a branch`.
   - Select branch `main` and directory `/ (root)`.
   - Click **Save**.
3. Visit the live store system:
   `https://lasasdias11-cell.github.io/AL-P-System/`
4. Sign in with the shop owner credentials (`lasasdias11@gmail.com`).
