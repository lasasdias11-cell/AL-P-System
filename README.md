# Sri Lankan Retail Stationery & Mobile Reload Transaction Log System

A mobile-first, desktop-responsive Single Page Application (SPA) designed for retail stationery shops and mobile reload counters in Sri Lanka. Powered by **Firebase Cloud Firestore (SDK v11)** and **Firebase Authentication**, running on **GitHub Pages**.

---

## 🏬 Features Overview

### 1. Security & Authentication Guard
- Full-screen login gate enforcing single-user authentication (`lasasdias11@gmail.com`).
- No financial or transaction data is rendered or stored in DOM before verified Firebase login.
- In-app Account & Security Manager to update login email and password directly via Firebase Auth.
- Password reset link delivery.

### 2. Module 1: Store Counter Dashboard
- Live Sri Lanka Time clock (Asia/Colombo UTC+5:30) with real-time digital seconds display.
- Today's Combined Net Profit summary (Stationery Profit + Reload Commissions).
- Two high-contrast, touch-optimized operational cards:
  1. 📝 **Stationery Ledger** (Sales & Profit tracking)
  2. 📱 **Mobile Reloads** (Airtel, Dialog, Mobitel, Hutch top-ups)
- Live pulse indicators for network commissions earned today.

### 3. Module 2: Stationery Transaction Ledger
- **Daily Table Architecture:** Automatically defaults to today (`YYYY-MM-DD`), with quick navigation between historical dates and past days.
- **Fast POS Bar (Type-Ahead Search):**
  - Autocomplete search by **Item Code** (e.g. `ST-001`) or **Item Name** (e.g. `CR Book 80 Pages`).
  - Full keyboard navigation: `ArrowDown`, `ArrowUp`, `Enter` to select, `Escape` to dismiss.
  - Auto-populates Cost Price (Taken) and Selling Price from Firestore master catalog.
  - Live profit & margin percentage preview: `Selling Price - Cost Price`.
- **Transaction Table:** Time, Item Name, Item Code, Cost Price, Selling Price, Profit Realized, with Edit (✏️) and Delete (🗑️) actions.
- **Live Summary Footer:** Net Daily Total Sales, Net Daily Cost, Net Daily Profit, and Overall Margin %.

### 4. Module 3: Mobile Reload & Commission Ledger
- **Operator Sub-Tabs / Filters:**
  - 🔴 **Airtel** (Default: `6.80%`)
  - 🟠 **Dialog** (Default: `3.80%`)
  - 💙 **Mobitel** (Default: `6.80%`)
  - 🟠 **Hutch** (Configurable in Settings, default: `5.00%`)
- **Fast Entry Bar:**
  - Quick amount preset buttons: **Rs. 50, Rs. 100, Rs. 200, Rs. 500, Rs. 1,000, Rs. 2,000**.
  - Real-time earned commission calculation: `(Reload Amount * Operator Rate) / 100`.
- **Live Summary Footer:** Total Reload Volume (Rs.) and Total Earned Commission (Rs.) per operator and combined daily.

### 5. Module 4: Settings & Master Catalog Modal (⚙️)
- **Master Inventory Catalog:** Add, edit, delete, and search items with Code, Name, Cost Price, and Selling Price.
- **Seed Sample Catalog:** One-click button to populate 15 standard Sri Lankan stationery items (CR Books, Chooty Pens, Photocopy paper, etc.).
- **Commission Rate Manager:** Live adjustments to operator percentage rates saved to Firestore.
- **Multi-Theme Switcher:**
  1. *Modern Slate* (Default High-Contrast Dark Mode)
  2. *Emerald Store* (Fresh Light Theme with Green Accent)
  3. *Sapphire Blue* (Professional Midnight Navy Dark Mode)
  4. *Warm Amber* (Parchment Cream Light Theme with Gold Accent)
- **Developer Debug Console:** Real-time Firestore connection health, latency test, auth state, local cache metric, error logs stream, and JSON backup export.

---

## 🗄️ File Structure

| File | Purpose |
|---|---|
| `index.html` | Semantic HTML5 SPA markup, responsive grid, modals, POS bar, debug console |
| `styles.css` | Custom theme CSS variables, mobile touch targets, autocomplete styles, print rules |
| `firebase-config.js` | Firebase SDK v11 modular imports, config for `al-p1-fb432`, and auth/db initialization |
| `app.js` | App state management, Firestore live listeners (`onSnapshot`), exact cent math, DOM handlers |
| `firestore.rules` | Security rules restricting read/write strictly to authenticated store owner |
| `README.md` | Deployment and configuration documentation |

---

## 🪙 Currency Math & Exact Cent Precision

All monetary math enforces exact 2-decimal cent rounding per specification:
```javascript
const roundCurrency = (amount) => Math.round((Number(amount || 0) + Number.EPSILON) * 100) / 100;
```
Formatted in Sri Lankan Rupees: `Rs. 1,250.00`.

---

## 🚀 Setup & GitHub Pages Deployment Guide

### STEP 1: Firebase Project Configuration

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select or create project: **`al-p1-fb432`**.
3. **Enable Firebase Authentication:**
   - Go to **Build** > **Authentication** > **Sign-in method**.
   - Enable **Email/Password**.
   - Go to the **Users** tab and click **Add user**:
     - Email: `lasasdias11@gmail.com`
     - Set a secure password for the store counter.
4. **Enable Cloud Firestore Database:**
   - Go to **Build** > **Firestore Database** > **Create database**.
   - Choose a location (e.g., `asia-south1` or `nam5`).
   - Choose **Start in production mode**.
5. **Apply Security Rules:**
   - Open the **Rules** tab in Cloud Firestore.
   - Copy and paste the contents of `firestore.rules` and click **Publish**.
6. **Obtain Web API Key & Authorize Domains:**
   - Go to **Project Settings** (⚙️ gear icon) > **General** > **Your apps** > Add Web App (`</>`).
   - Copy the `apiKey` string (starts with `AIzaSy...`).
   - Go to **Authentication** > **Settings** > **Authorized domains** and ensure:
     - `localhost`
     - `127.0.0.1`
     - `<your-github-username>.github.io`
     are listed.

---

### STEP 2: Configure Firebase API Key

You can configure your Firebase Web API Key in any of the following 3 ways:

1. **Option A (Instant in Browser):**
   Open the web app in your browser. On the Login Screen, click **"⚙️ Firebase Web API Key Setup"**, paste your `apiKey`, and click **"Save Key"**. It will persist in `localStorage`.
2. **Option B (In Code):**
   Open `firebase-config.js` and paste your API key in `firebaseConfig.apiKey`.
3. **Option C (Developer Debug Console):**
   Open Settings (⚙️) > **Debug Console** to inspect live connection health and latency.

---

### STEP 3: Deploy to GitHub Pages

1. **Push files to your GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Sri Lankan Retail & Stationery POS Ledger"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - In your GitHub repository, click **Settings**.
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Branch**:
     - Select `main` branch.
     - Select `/ (root)` folder.
     - Click **Save**.

3. **Access Your Live POS System:**
   - Your application will be live at:
     `https://<your-username>.github.io/<repo-name>/`
   - Log in with `lasasdias11@gmail.com` and your password.

---

## 📋 Commission Rates Reference

| Operator | Default Commission Rate | Calculation Formula |
|---|---|---|
| **Airtel** | `6.80%` | `(Amount * 6.80) / 100` |
| **Dialog** | `3.80%` | `(Amount * 3.80) / 100` |
| **Mobitel** | `6.80%` | `(Amount * 6.80) / 100` |
| **Hutch** | `5.00%` (Configurable) | `(Amount * Rate) / 100` |

*All commission rates can be adjusted anytime under Settings (⚙️) > Commission Rates, syncing immediately with Firestore.*
