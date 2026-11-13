// =============================================================================
// AL COMMUNICATION - PRODUCTION RETAIL MANAGEMENT SYSTEM (VERSION 5.0)
// High-Contrast Solid Modern Default UI | Branded Sticky Navigation
// Universal Global Search Engine | Service/Utility Bills (No Qty)
// Auto Title Case Formatting | Natural Numeric Inventory Sorting
// Complete Settings Backup & Restore System | Stamped PDF Reporting
// Single-Owner Persistent Session: lasasdias11@gmail.com
// =============================================================================

import {
  auth,
  db,
  secondaryAuth,
  authPersistenceReady,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction
} from './firebase-config.js';

const ADMIN_EMAIL = 'lasasdias11@gmail.com';
const DEFAULT_DASHBOARD_ORDER = {
  metrics: [
    'card-dash-stationery',
    'card-dash-reloads',
    'card-dash-commission',
    'card-dash-stationery-profit',
    'card-dash-catalog',
    'card-dash-reload-profit-total',
    'card-dash-stationery-profit-total'
  ],
  actions: ['action-stationery', 'action-reloads', 'action-stock', 'action-logs', 'action-settings', 'action-profile']
};

// =============================================================================
// 1. GLOBAL APPLICATION STATE (V5.0 ARCHITECTURE)
// =============================================================================

export const APP_STATE = {
  currentUser: null,
  currentRole: 'user',
  activeView: 'dashboard',
  previousView: 'dashboard',
  activeTheme: localStorage.getItem('al_theme_preference') || 'modern-slate',
  gradientBlurEnabled: localStorage.getItem('al_gradient_blur') !== 'false',
  dashboardOrder: DEFAULT_DASHBOARD_ORDER,
  userProfiles: [],
  inventoryCatalog: [],
  todayStationeryTransactions: [],
  todayReloadTransactions: [],
  masterStationeryRecords: [],
  masterReloadRecords: [],
  commissionRates: {
    AIRTEL: 6.80,
    DIALOG: 3.80,
    MOBITEL: 6.80,
    HUTCH: 5.00
  },
  reloadPresets: [50, 100, 200, 500, 1000],
  selectedCatalogItem: null,
  selectedOperator: 'DIALOG',
  stockSortOrder: localStorage.getItem('al_stock_sort_order') || 'name-asc',
  catalogSortOrder: localStorage.getItem('al_catalog_sort_order') || 'name-asc',
  stockFilter: 'ALL',
  logTab: 'all',
  logDateScope: 'today',
  logDateFrom: '',
  logDateTo: '',
  logSearchQuery: '',
  devLogs: []
};

// Standard Sri Lankan Retail Catalog Seed (Including Physical Products & Utility Bills)
const SAMPLE_SRI_LANKAN_CATALOG = [
  { code: '1', name: 'Atlas Cr Book 80 Pages (Single Rule)', category: 'Exercise Books', itemType: 'product', costPrice: 155.00, sellingPrice: 200.00, stockQuantity: 50, lowStockThreshold: 10 },
  { code: '2', name: 'Atlas Cr Book 120 Pages (Single Rule)', category: 'Exercise Books', itemType: 'product', costPrice: 215.00, sellingPrice: 280.00, stockQuantity: 40, lowStockThreshold: 10 },
  { code: '3', name: 'Atlas Cr Book 160 Pages (Single Rule)', category: 'Exercise Books', itemType: 'product', costPrice: 290.00, sellingPrice: 370.00, stockQuantity: 35, lowStockThreshold: 10 },
  { code: '4', name: 'Atlas Cr Book 80 Pages (Square Rule)', category: 'Exercise Books', itemType: 'product', costPrice: 155.00, sellingPrice: 200.00, stockQuantity: 45, lowStockThreshold: 10 },
  { code: '5', name: 'Atlas Chooty Pen Blue (0.5mm)', category: 'Pens & Pencils', itemType: 'product', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 200, lowStockThreshold: 25 },
  { code: '6', name: 'Atlas Chooty Pen Black (0.5mm)', category: 'Pens & Pencils', itemType: 'product', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 150, lowStockThreshold: 25 },
  { code: '7', name: 'Atlas Chooty Pen Red (0.5mm)', category: 'Pens & Pencils', itemType: 'product', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 100, lowStockThreshold: 20 },
  { code: '8', name: 'Nataraj 2b Pencil Pack (10s)', category: 'Pens & Pencils', itemType: 'product', costPrice: 200.00, sellingPrice: 260.00, stockQuantity: 30, lowStockThreshold: 8 },
  { code: '9', name: 'A4 Photocopy Paper 80gsm (Pack 500)', category: 'Paper & Files', itemType: 'product', costPrice: 1380.00, sellingPrice: 1600.00, stockQuantity: 25, lowStockThreshold: 5 },
  { code: '10', name: 'A4 Photocopy Single Page (B/W)', category: 'Photocopy & Print', itemType: 'product', costPrice: 3.50, sellingPrice: 10.00, stockQuantity: 1000, lowStockThreshold: 100 },
  { code: '11', name: 'A4 Colour Print Single Page', category: 'Photocopy & Print', itemType: 'product', costPrice: 15.00, sellingPrice: 40.00, stockQuantity: 500, lowStockThreshold: 50 },
  { code: '12', name: 'Bristol Board Sheet (White/Colours)', category: 'Art & Craft', itemType: 'product', costPrice: 42.00, sellingPrice: 60.00, stockQuantity: 80, lowStockThreshold: 15 },
  { code: '13', name: 'Atlas Colour Pastels (12 Shades)', category: 'Art & Craft', itemType: 'product', costPrice: 175.00, sellingPrice: 230.00, stockQuantity: 25, lowStockThreshold: 5 },
  { code: '14', name: 'Clear Display File Folder (A4)', category: 'Paper & Files', itemType: 'product', costPrice: 125.00, sellingPrice: 170.00, stockQuantity: 40, lowStockThreshold: 10 },
  { code: '15', name: 'Uhu / Atlas Glue Stick 15g', category: 'Adhesives', itemType: 'product', costPrice: 110.00, sellingPrice: 150.00, stockQuantity: 30, lowStockThreshold: 8 },
  // Service & Utility Bills (No Quantity Tracked)
  { code: 'BILL-01', name: 'Electricity Bill Payment (Ceb / Leco)', category: 'Utility Bills', itemType: 'service', costPrice: 0.00, sellingPrice: 0.00, stockQuantity: 0, lowStockThreshold: 0 },
  { code: 'BILL-02', name: 'Water Supply Bill Payment (Nwsdb)', category: 'Utility Bills', itemType: 'service', costPrice: 0.00, sellingPrice: 0.00, stockQuantity: 0, lowStockThreshold: 0 },
  { code: 'BILL-03', name: 'Slt / Mobitel Home Broadband Bill', category: 'Utility Bills', itemType: 'service', costPrice: 0.00, sellingPrice: 0.00, stockQuantity: 0, lowStockThreshold: 0 },
  { code: 'BILL-04', name: 'Dialog Television / Home Bill', category: 'Utility Bills', itemType: 'service', costPrice: 0.00, sellingPrice: 0.00, stockQuantity: 0, lowStockThreshold: 0 }
];

// =============================================================================
// 2. MATHEMATICAL & FORMATTING UTILITIES (Exact Cent & Title Case)
// =============================================================================

export function roundCurrency(amount) {
  const num = Number(amount) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatLKR(amount, prefix = 'Rs. ') {
  const rounded = roundCurrency(amount);
  return prefix + rounded.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  document.addEventListener('click', event => {
    if (menuDrawer && !menuDrawer.contains(event.target) && !menuToggle?.contains(event.target)) {
      menuDrawer.classList.add('hidden');
      menuDrawer.setAttribute('aria-hidden', 'true');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });
}

export function formatSignedLKR(amount) {
  const rounded = roundCurrency(amount);
  return `${rounded < 0 ? '- ' : '+ '}${formatLKR(Math.abs(rounded))}`;
}

/**
 * Requirement 4.1: Enforce Automatic Title Case Formatting
 * Capitalizes the first letter of every word (e.g., 'a4 cr books' -> 'A4 Cr Books')
 */
export function toTitleCase(str) {
  if (!str) return '';
  const acronyms = new Set(['A4', 'A5', 'LED', 'AA', 'AAA', 'USB']);
  return String(str).trim().replace(/\s+/g, ' ').toLowerCase().replace(/[a-z0-9]+/gi, word => {
    const upperWord = word.toUpperCase();
    return acronyms.has(upperWord) ? upperWord : word.charAt(0).toUpperCase() + word.slice(1);
  });
}

export function getTodayDateString() {
  const now = new Date();
  const tzOffset = 5.5 * 60; // Asia/Colombo UTC+5:30
  const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString() {
  const now = new Date();
  const tzOffset = 5.5 * 60;
  const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
  localTime.setDate(localTime.getDate() - 1);
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString() {
  const now = new Date();
  const tzOffset = 5.5 * 60;
  const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
  return localTime.toTimeString().split(' ')[0];
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function removeTransaction(type, transactionRecord) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in before deleting transactions.');
  const currentUserId = currentUser.uid;
  const isAdmin = APP_STATE.currentRole === 'admin';

  const collectionName = type === 'RELOAD' ? 'reload_transactions' : 'stationery_transactions';
  const transactionRef = doc(db, collectionName, transactionRecord.id);
  const stockRestored = await runTransaction(db, async firestoreTransaction => {
    const transactionSnapshot = await firestoreTransaction.get(transactionRef);
    if (!transactionSnapshot.exists()) throw new Error('This transaction no longer exists.');

    const data = transactionSnapshot.data();
    if (!isAdmin && data.createdBy !== currentUserId) {
      throw new Error('You can delete only transactions recorded by your account.');
    }
    const isPhysicalSale = type !== 'RELOAD' && data.itemType !== 'service';
    let restored = false;
    if (isPhysicalSale) {
      const catalogItem = data.inventoryId
        ? { id: data.inventoryId }
        : APP_STATE.inventoryCatalog.find(item => item.code === data.itemCode);

      if (catalogItem?.id) {
        const inventoryRef = doc(db, 'inventory', catalogItem.id);
        const inventorySnapshot = await firestoreTransaction.get(inventoryRef);
        if (!inventorySnapshot.exists()) {
          throw new Error('The original inventory item is missing; the transaction was not deleted.');
        }
        const quantity = Number(data.quantity ?? 1);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error('The transaction has an invalid quantity; the transaction was not deleted.');
        }
        firestoreTransaction.update(inventoryRef, {
          stockQuantity: increment(quantity),
          updatedAt: serverTimestamp()
        });
        restored = true;
      } else if (data.inventoryId) {
        throw new Error('The original inventory item is missing; the transaction was not deleted.');
      }
    }

    firestoreTransaction.delete(transactionRef);
    return restored;
  });
  return stockRestored;
}

// =============================================================================
// 3. LOGGING & TOAST ENGINE
// =============================================================================

function logDebug(message, type = 'INFO') {
  const time = getCurrentTimeString();
  const entry = `[${time}] [${type}] ${message}`;
  APP_STATE.devLogs.unshift(entry);
  if (APP_STATE.devLogs.length > 100) APP_STATE.devLogs.pop();

  const terminal = document.getElementById('dbgTerminalLogs');
  if (terminal) {
    const row = document.createElement('div');
    row.className = type === 'ERROR' ? 'text-red-400' : type === 'WARN' ? 'text-amber-400' : 'text-emerald-400';
    row.textContent = entry;
    terminal.insertBefore(row, terminal.firstChild);
  }
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const baseClasses = 'px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg transition-all transform duration-200 pointer-events-auto flex items-center gap-2.5';
  
  if (type === 'success') {
    toast.className = `${baseClasses} bg-emerald-500/15 border-emerald-500/30 text-emerald-400`;
  } else if (type === 'error') {
    toast.className = `${baseClasses} bg-red-500/15 border-red-500/30 text-red-400`;
  } else {
    toast.className = `${baseClasses} bg-sky-500/15 border-sky-500/30 text-sky-400`;
  }

  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-400' : type === 'error' ? 'bg-red-400' : 'bg-sky-400'}"></span>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// =============================================================================
// 4. THEME ENGINE & QUICK HEADER TOGGLE
// =============================================================================

export function applyTheme(themeName) {
  const allowed = ['modern-slate', 'emerald-store', 'sapphire-blue', 'warm-amber'];
  if (!allowed.includes(themeName)) themeName = 'modern-slate';

  APP_STATE.activeTheme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('al_theme_preference', themeName);

  // Sync Light Theme Helper
  if (themeName === 'emerald-store') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }

  // Update Sun/Moon icon in header
  const sunIcon = document.getElementById('themeToggleIconSun');
  const moonIcon = document.getElementById('themeToggleIconMoon');
  if (sunIcon && moonIcon) {
    if (themeName === 'emerald-store') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  // Update theme card highlights in Settings
  document.querySelectorAll('.theme-choice-card').forEach(card => {
    if (card.getAttribute('data-theme-choice') === themeName) {
      card.classList.add('border-sky-500', 'ring-2', 'ring-sky-500/30');
    } else {
      card.classList.remove('border-sky-500', 'ring-2', 'ring-sky-500/30');
    }
  });

  logDebug(`Theme active: ${themeName}`);
}

function initThemeSystem() {
  applyTheme(APP_STATE.activeTheme);
  setGradientBlurEnabled(APP_STATE.gradientBlurEnabled);

  // Quick Header Light/Dark Toggle
  const quickToggle = document.getElementById('themeQuickToggleBtn');
  if (quickToggle) {
    quickToggle.addEventListener('click', () => {
      const nextTheme = APP_STATE.activeTheme === 'emerald-store' ? 'modern-slate' : 'emerald-store';
      applyTheme(nextTheme);
      saveUserPreferences({ activeTheme: nextTheme });
      showToast(`Switched to ${nextTheme === 'emerald-store' ? 'Light Mode' : 'Dark Mode'}`, 'info');
    });
  }

  // Settings Modal Theme Cards
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.getAttribute('data-theme-choice');
      applyTheme(chosen);
      saveUserPreferences({ activeTheme: chosen });
      showToast(`Theme applied: ${chosen}`, 'success');
    });
  });

  const blurToggle = document.getElementById('gradientBlurToggle');
  if (blurToggle) {
    blurToggle.checked = APP_STATE.gradientBlurEnabled;
    blurToggle.addEventListener('change', () => {
      setGradientBlurEnabled(blurToggle.checked, true);
    });
  }

  document.getElementById('resetDashboardLayoutBtn')?.addEventListener('click', resetDashboardLayout);
}

function setGradientBlurEnabled(enabled, persist = false) {
  APP_STATE.gradientBlurEnabled = Boolean(enabled);
  document.documentElement.dataset.gradientBlur = enabled ? 'on' : 'off';
  localStorage.setItem('al_gradient_blur', String(Boolean(enabled)));
  const toggle = document.getElementById('gradientBlurToggle');
  const stateLabel = document.getElementById('gradientBlurState');
  if (toggle) toggle.checked = Boolean(enabled);
  if (stateLabel) stateLabel.textContent = enabled ? 'On' : 'Off';
  const profileToggle = document.getElementById('profileBlurToggleBtn');
  if (profileToggle) profileToggle.textContent = `Gradient Blur: ${enabled ? 'On' : 'Off'}`;
  if (persist) saveUserPreferences({ gradientBlurEnabled: Boolean(enabled) });
}

// =============================================================================
// 5. CLOCK & NETWORK DETECTION
// =============================================================================

function startLiveClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  function tick() {
    const now = new Date();
    const tzOffset = 5.5 * 60;
    const local = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);

    if (clockEl) {
      const timeStr = local.toLocaleTimeString('en-US', { hour12: false });
      clockEl.textContent = `${timeStr} LK`;
    }
    if (dateEl) {
      const year = local.getFullYear();
      const month = String(local.getMonth() + 1).padStart(2, '0');
      const day = String(local.getDate()).padStart(2, '0');
      dateEl.textContent = `${year}/${month}/${day}`;
    }
  }

  tick();
  setInterval(tick, 1000);
}

export function detectOperatorFromPrefix(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  let prefix = '';

  if (clean.startsWith('94') && clean.length >= 4) {
    prefix = '0' + clean.substring(2, 4);
  } else if (clean.startsWith('0') && clean.length >= 3) {
    prefix = clean.substring(0, 3);
  } else if (clean.length >= 2) {
    prefix = '0' + clean.substring(0, 2);
  }

  if (prefix === '077' || prefix === '076' || prefix === '074') return 'DIALOG';
  if (prefix === '071' || prefix === '070') return 'MOBITEL';
  if (prefix === '075') return 'AIRTEL';
  if (prefix === '078' || prefix === '072') return 'HUTCH';
  return null;
}

// =============================================================================
// 6. VIEW NAVIGATION & MOBILE-ADAPTIVE ROUTING (Requirement 2.2)
// =============================================================================

export function switchView(viewName) {
  if (!auth.currentUser) {
    showToast('Sign in before opening protected pages.', 'error');
    return false;
  }
  const validViews = ['dashboard', 'stationery', 'reloads', 'stock', 'logs', 'profile'];
  if (!validViews.includes(viewName)) viewName = 'dashboard';

  if (viewName !== 'profile') APP_STATE.previousView = viewName;
  APP_STATE.activeView = viewName;

  // Toggle view containers
  document.querySelectorAll('.app-view').forEach(viewEl => {
    viewEl.classList.add('hidden');
  });

  const targetView = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Synchronize Desktop Navigation Tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'nav-tab-btn active px-3.5 py-1.5 rounded-lg transition';
    } else {
      btn.className = 'nav-tab-btn px-3.5 py-1.5 rounded-lg theme-text-muted hover:theme-text-main transition';
    }
  });

  // Synchronize Mobile Bottom Navigation Bar
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'mobile-nav-btn active flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-accent';
    } else {
      btn.className = 'mobile-nav-btn flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-text-muted';
    }
  });
  document.getElementById('openProfileBtn')?.classList.toggle('active', viewName === 'profile');
  document.getElementById('mobileMenuDrawer')?.classList.add('hidden');
  document.getElementById('mobileMenuToggleBtn')?.setAttribute('aria-expanded', 'false');
  document.getElementById('mobileMenuDrawer')?.setAttribute('aria-hidden', 'true');

  // Contextual view refreshes
  if (viewName === 'stock') {
    renderStockTable();
  } else if (viewName === 'logs') {
    applyMasterLogFilters();
  } else if (viewName === 'dashboard') {
    updateDashboardMetrics();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  logDebug(`Switched active view to: ${viewName}`);
  return true;
}

function initNavigation() {
  // Desktop header links
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const target = btn.getAttribute('data-view');
    if (target) {
      btn.addEventListener('click', () => switchView(target));
    }
  });

  // Mobile bottom nav links
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    const target = btn.getAttribute('data-view');
    if (target) {
      btn.addEventListener('click', () => switchView(target));
    }
  });

  document.querySelectorAll('.mobile-menu-nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
  });

  const menuToggle = document.getElementById('mobileMenuToggleBtn');
  const menuDrawer = document.getElementById('mobileMenuDrawer');
  menuToggle?.addEventListener('click', () => {
    const opening = menuDrawer?.classList.contains('hidden');
    menuDrawer?.classList.toggle('hidden', !opening);
    menuDrawer?.setAttribute('aria-hidden', String(!opening));
    menuToggle.setAttribute('aria-expanded', String(Boolean(opening)));
  });
  document.getElementById('mobileMenuProfileBtn')?.addEventListener('click', () => switchView('profile'));
  document.getElementById('desktopSettingsNavBtn')?.addEventListener('click', openSettingsModal);
  document.getElementById('mobileMenuSettingsBtn')?.addEventListener('click', () => {
    menuDrawer?.classList.add('hidden');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuDrawer?.setAttribute('aria-hidden', 'true');
    openSettingsModal();
  });

  // Header Brand Logo link -> Dashboard
  const headerHomeBtn = document.getElementById('headerHomeBtn');
  if (headerHomeBtn) {
    headerHomeBtn.addEventListener('click', () => switchView('dashboard'));
  }
  document.querySelectorAll('#headerHomeBtn img, #settingsModal img[alt="AL Communication"]').forEach(image => {
    image.addEventListener('error', () => image.classList.add('hidden'), { once: true });
  });

  // Dashboard 4 Operational Quick Actions (Below Metrics)
  const dashTileStationery = document.getElementById('dashTileStationery');
  if (dashTileStationery) {
    dashTileStationery.addEventListener('click', () => switchView('stationery'));
  }

  const dashTileReloads = document.getElementById('dashTileReloads');
  if (dashTileReloads) {
    dashTileReloads.addEventListener('click', () => switchView('reloads'));
  }

  const dashTileStock = document.getElementById('dashTileStock');
  if (dashTileStock) {
    dashTileStock.addEventListener('click', () => switchView('stock'));
  }

  const dashTileLogs = document.getElementById('dashTileLogs');
  if (dashTileLogs) {
    dashTileLogs.addEventListener('click', () => switchView('logs'));
  }
  document.getElementById('dashTileSettings')?.addEventListener('click', openSettingsModal);
  document.getElementById('dashTileProfile')?.addEventListener('click', () => switchView('profile'));

  // Stock inventory -> Open Settings Catalog
  // Stock inventory -> Open Settings Catalog
  const stockOpenCatalogSettingsBtn = document.getElementById('stockOpenCatalogSettingsBtn');
  if (stockOpenCatalogSettingsBtn) {
    stockOpenCatalogSettingsBtn.addEventListener('click', () => {
      openSettingsModal();
      switchSettingsTab('catalog');
    });
  }

  // Reloads view -> Open Presets
  const openPresetConfigBtn = document.getElementById('openPresetConfigBtn');
  if (openPresetConfigBtn) {
    openPresetConfigBtn.addEventListener('click', () => {
      openSettingsModal();
      switchSettingsTab('presets');
    });
  }

  // Settings Modal openers
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
  if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);

  // Settings Sub-Tabs
  document.querySelectorAll('[data-settings-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      switchSettingsTab(tabBtn.getAttribute('data-settings-tab'));
    });
  });

  // Modal Backdrop Click
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
  }
}

export function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('desktopSettingsNavBtn')?.classList.add('active');
    updateBackupStatusDisplay();
  }
}

export function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('desktopSettingsNavBtn')?.classList.remove('active');
}

export function switchSettingsTab(tabId) {
  const validTabs = ['catalog', 'presets', 'rates', 'backup', 'themes', 'security', 'developer'];
  if (!validTabs.includes(tabId)) tabId = 'catalog';

  document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('[data-settings-tab]').forEach(b => {
    b.className = 'settings-tab-btn px-2.5 py-1 rounded-md border theme-border transition whitespace-nowrap font-rounded';
  });

  const targetPanel = document.getElementById(`settingsPanel${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  const targetBtn = document.querySelector(`[data-settings-tab="${tabId}"]`);

  if (targetPanel) targetPanel.classList.remove('hidden');
  if (targetBtn) {
    targetBtn.className = 'settings-tab-btn active px-2.5 py-1 rounded-md border theme-border transition whitespace-nowrap theme-bg-accent text-white font-bold font-rounded shadow-sm';
  }

  if (tabId === 'catalog') {
    renderCatalogTable();
  } else if (tabId === 'backup') {
    updateBackupStatusDisplay();
  }
}

// =============================================================================
// 7. UNIVERSAL GLOBAL SEARCH ENGINE (Requirement 2.3 & V5.1 Expandable Motion)
// =============================================================================

function initGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const results = document.getElementById('globalSearchResults');
  const toggleBtn = document.getElementById('headerSearchToggleBtn');
  const closeBtn = document.getElementById('searchCloseBtn');
  const header = document.getElementById('mainHeader');
  const searchIconOpen = document.getElementById('searchIconOpen');
  const searchIconClose = document.getElementById('searchIconClose');
  const headerSearchWrapper = document.getElementById('headerSearchWrapper');

  // Open search
  function openSearch() {
    if (!header) return;
    header.classList.add('search-active');
    if (searchIconOpen) searchIconOpen.classList.add('hidden');
    if (searchIconClose) searchIconClose.classList.remove('hidden');
    if (input) {
      input.focus();
      input.select();
      if (input.value.trim() && results) {
        performSearch(input.value.trim().toLowerCase(), results);
      }
    }
  }

  // Close search
  function closeSearch() {
    if (!header) return;
    header.classList.remove('search-active');
    if (searchIconOpen) searchIconOpen.classList.remove('hidden');
    if (searchIconClose) searchIconClose.classList.add('hidden');
    if (results) {
      results.classList.add('hidden');
      results.innerHTML = '';
    }
  }

  // Toggle button click
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (header && header.classList.contains('search-active')) {
        closeSearch();
      } else {
        openSearch();
      }
    });
  }

  // Close button inside search box
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSearch();
    });
  }

  // Keyboard shortcuts: Ctrl+K or '/' to open, Escape to close
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // Search field logic
  if (input && results) {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        results.querySelector('.search-result-item')?.click();
      }
    });
    input.addEventListener('input', () => {
      const queryStr = input.value.trim().toLowerCase();
      if (!queryStr) {
        results.classList.add('hidden');
        results.innerHTML = '';
        return;
      }
      performSearch(queryStr, results);
    });

    input.addEventListener('focus', () => {
      const queryStr = input.value.trim().toLowerCase();
      if (queryStr) performSearch(queryStr, results);
    });
  }

  // Click outside to close results and collapse search bar if empty
  document.addEventListener('click', (e) => {
    if (results && !results.contains(e.target) && e.target !== input) {
      results.classList.add('hidden');
    }
    if (headerSearchWrapper && !headerSearchWrapper.contains(e.target) && header && header.classList.contains('search-active')) {
      closeSearch();
    }
  });
  function performSearch(q, container) {
    container.innerHTML = '';
    container.classList.remove('hidden');

    const navigationTargets = [
      { label: 'Dashboard', terms: 'home metrics cards', view: 'dashboard' },
      { label: 'Stationery Entry', terms: 'stationery point of sale bills', view: 'stationery' },
      { label: 'Mobile Reloads', terms: 'reload top up mobile', view: 'reloads' },
      { label: 'Stock Inventory', terms: 'stock inventory catalog', view: 'stock' },
      { label: 'Master Logs', terms: 'logs ledger transactions report', view: 'logs' },
      { label: 'Account Profile', terms: 'profile account password security', view: 'profile' },
      { label: 'Settings: Inventory Catalog', terms: 'settings catalog inventory items', tab: 'catalog' },
      { label: 'Settings: Reload Presets', terms: 'settings reload presets amounts', tab: 'presets' },
      { label: 'Settings: Commission Rates', terms: 'settings commission rate operator', tab: 'rates' },
      { label: 'Settings: Backup & Restore', terms: 'settings backup restore export import', tab: 'backup' },
      { label: 'Settings: Themes & Header Blur', terms: 'settings theme gradient blur ui', tab: 'themes' },
      { label: 'Settings: Account Security', terms: 'settings password security account', tab: 'security' },
      { label: 'Settings: Debug Console', terms: 'settings debug developer diagnostics', tab: 'developer' }
    ];
    const matchedNavigation = navigationTargets.filter(target =>
      `${target.label} ${target.terms}`.toLowerCase().includes(q)
    );
    const dashboardCards = [...document.querySelectorAll('#dashboardGrid > [data-card-id]')]
      .map(card => ({
        label: card.querySelector('span')?.textContent?.trim() || card.textContent.trim().split('\n')[0],
        card
      }))
      .filter(target => target.label && target.label.toLowerCase().includes(q))
      .slice(0, 5);

    // 1. Search Catalog Items & Stock
    const matchedCatalog = APP_STATE.inventoryCatalog.filter(item => {
      return (item.code || '').toLowerCase().includes(q) ||
             (item.name || '').toLowerCase().includes(q) ||
             (item.category || '').toLowerCase().includes(q);
    }).slice(0, 5);

    // 2. Search Mobile Reload Transactions
    const combinedReloads = [...APP_STATE.todayReloadTransactions, ...APP_STATE.masterReloadRecords];
    const uniqueReloads = [];
    const seenRIds = new Set();
    for (const r of combinedReloads) {
      if (!seenRIds.has(r.id)) {
        seenRIds.add(r.id);
        if ((r.phone || '').includes(q) || (r.operator || '').toLowerCase().includes(q) || String(r.amount).includes(q)) {
          uniqueReloads.push(r);
          if (uniqueReloads.length >= 4) break;
        }
      }
    }

    // 3. Search Stationery & Utility Bill Transactions
    const combinedStats = [...APP_STATE.todayStationeryTransactions, ...APP_STATE.masterStationeryRecords];
    const uniqueStats = [];
    const seenSIds = new Set();
    for (const s of combinedStats) {
      if (!seenSIds.has(s.id)) {
        seenSIds.add(s.id);
        if ((s.itemName || '').toLowerCase().includes(q) || (s.itemCode || '').toLowerCase().includes(q) || String(s.totalAmount).includes(q)) {
          uniqueStats.push(s);
          if (uniqueStats.length >= 4) break;
        }
      }
    }

    const totalMatches = matchedNavigation.length + dashboardCards.length + matchedCatalog.length + uniqueReloads.length + uniqueStats.length;

    if (totalMatches === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs theme-text-dim">
          No records or transactions matching "<span class="font-semibold theme-text-main">${escapeHTML(q)}</span>"
        </div>
      `;
      return;
    }

    if (matchedNavigation.length || dashboardCards.length) {
      const header = document.createElement('div');
      header.className = 'search-section-header flex items-center justify-between';
      header.innerHTML = `<span>Pages, Settings &amp; Dashboard</span><span>${matchedNavigation.length + dashboardCards.length}</span>`;
      container.appendChild(header);
      [...matchedNavigation, ...dashboardCards.map(target => ({ ...target, card: target.card }))].forEach(target => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'search-result-item w-full text-left';
        row.innerHTML = `<div class="min-w-0"><div class="font-bold text-xs theme-text-main">${escapeHTML(target.label)}</div><div class="text-[11px] theme-text-dim">${target.tab ? 'Open settings section' : target.view ? 'Navigate to page' : 'Open dashboard card'}</div></div><span class="theme-text-dim">→</span>`;
        row.addEventListener('click', () => {
          container.classList.add('hidden');
          if (target.card) {
            const action = target.card.querySelector('button') || target.card;
            if (target.card.closest('#dashboardActionsGrid')) {
              action.click();
            } else {
              switchView('dashboard');
              requestAnimationFrame(() => target.card.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            }
          } else if (target.tab) {
            openSettingsModal();
            switchSettingsTab(target.tab);
          } else {
            switchView(target.view);
          }
        });
        container.appendChild(row);
      });
    }

    // CATEGORY 1: CATALOG & STOCK INVENTORY
    if (matchedCatalog.length > 0) {
      const header = document.createElement('div');
      header.className = 'search-section-header flex items-center justify-between';
      header.innerHTML = `<span>Catalog & Stock Inventory</span><span>${matchedCatalog.length}</span>`;
      container.appendChild(header);

      matchedCatalog.forEach(item => {
        const row = document.createElement('div');
        row.className = 'search-result-item';
        const isService = item.itemType === 'service';
        const stockBadge = isService
          ? `<span class="badge-service-bill px-2 py-0.5 rounded text-[10px] font-bold">Service/Bill</span>`
          : item.stockQuantity <= 5
          ? `<span class="badge-stock-low px-2 py-0.5 rounded text-[10px] font-bold">${escapeHTML(item.stockQuantity)} Left</span>`
          : `<span class="badge-stock-in px-2 py-0.5 rounded text-[10px] font-bold">${escapeHTML(item.stockQuantity)} in stock</span>`;

        row.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">${escapeHTML(item.code)}</span>
            <div class="truncate">
              <div class="font-bold text-xs theme-text-main truncate">${escapeHTML(toTitleCase(item.name))}</div>
              <div class="text-[11px] theme-text-dim">${escapeHTML(item.category || 'General')}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 text-right">
            <div>
              <div class="font-bold text-xs theme-text-main font-mono">${formatLKR(item.sellingPrice)}</div>
              ${stockBadge}
            </div>
            <button type="button" class="px-2 py-1 rounded bg-sky-500/15 text-sky-400 hover:bg-sky-500 text-[10px] font-bold hover:text-white transition">POS</button>
          </div>
        `;

        row.addEventListener('click', (e) => {
          container.classList.add('hidden');
          if (e.target.tagName === 'BUTTON' || isService) {
            // Jump to POS and preselect
            switchView('stationery');
            selectCatalogItemForPOS(item);
          } else {
            // Jump to Stock Inventory and search
            switchView('stock');
            const stockInput = document.getElementById('stockSearchInput');
            if (stockInput) {
              stockInput.value = item.code;
              renderStockTable();
            }
          }
        });

        container.appendChild(row);
      });
    }

    // CATEGORY 2: MOBILE RELOADS
    if (uniqueReloads.length > 0) {
      const header = document.createElement('div');
      header.className = 'search-section-header flex items-center justify-between';
      header.innerHTML = `<span>Mobile Reload Ledger</span><span>${uniqueReloads.length}</span>`;
      container.appendChild(header);

      uniqueReloads.forEach(r => {
        const row = document.createElement('div');
        row.className = 'search-result-item';
        row.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${r.operator === 'DIALOG' ? 'text-orange-400 border-orange-500/30' : r.operator === 'MOBITEL' ? 'text-blue-400 border-blue-500/30' : r.operator === 'AIRTEL' ? 'text-red-400 border-red-500/30' : 'text-amber-300 border-amber-500/30'}">${escapeHTML(r.operator)}</span>
            <div class="truncate">
              <div class="font-bold text-xs font-mono theme-text-main">${escapeHTML(r.phone || 'Walk-in')}</div>
              <div class="text-[10px] theme-text-dim">${escapeHTML(r.date || '')} ${escapeHTML(r.time || '')}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-xs text-emerald-400 font-mono">${formatLKR(r.amount)}</div>
            <div class="text-[10px] theme-text-dim font-mono">${formatSignedLKR(r.commissionAmount)}</div>
          </div>
        `;

        row.addEventListener('click', () => {
          container.classList.add('hidden');
          switchView('logs');
          setMasterLogCategoryTab('reloads');
          const filterInput = document.getElementById('logSearchFilter');
          if (filterInput) {
            filterInput.value = r.phone || r.operator;
            applyMasterLogFilters();
          }
        });

        container.appendChild(row);
      });
    }

    // CATEGORY 3: STATIONERY & BILL TRANSACTIONS
    if (uniqueStats.length > 0) {
      const header = document.createElement('div');
      header.className = 'search-section-header flex items-center justify-between';
      header.innerHTML = `<span>Stationery & Bill Ledger</span><span>${uniqueStats.length}</span>`;
      container.appendChild(header);

      uniqueStats.forEach(s => {
        const row = document.createElement('div');
        row.className = 'search-result-item';
        row.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">${escapeHTML(s.itemCode || 'ST')}</span>
            <div class="truncate">
              <div class="font-bold text-xs theme-text-main truncate">${escapeHTML(toTitleCase(s.itemName))}</div>
              <div class="text-[10px] theme-text-dim">${escapeHTML(s.date || '')} &bull; Qty: ${escapeHTML(s.quantity || 1)}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-xs theme-text-main font-mono">${formatLKR(s.totalAmount)}</div>
            <div class="text-[10px] text-sky-400 font-mono">Profit: ${formatSignedLKR(s.profit ?? ((Number(s.sellingPrice || 0) - Number(s.costPrice || 0)) * Number(s.quantity || 1)))}</div>
          </div>
        `;

        row.addEventListener('click', () => {
          container.classList.add('hidden');
          switchView('logs');
          setMasterLogCategoryTab('stationery');
          const filterInput = document.getElementById('logSearchFilter');
          if (filterInput) {
            filterInput.value = s.itemName;
            applyMasterLogFilters();
          }
        });

        container.appendChild(row);
      });
    }
  }
}

// =============================================================================
// 8. NATURAL NUMERICAL SORTING (Requirement 4.3)
// =============================================================================

/**
 * Natural numerical sort for catalog and stock items:
 * '1, 2, 3... 10, 11' naturally rather than '1, 10, 11, 2'
 */
export function sortCatalogList(items, sortKey) {
  const list = [...items];
  const compareName = (a, b) => toTitleCase(a.name).localeCompare(toTitleCase(b.name), undefined, { numeric: true, sensitivity: 'base' });
  const addedAt = item => {
    const value = item.createdAt;
    if (value?.toMillis) return value.toMillis();
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  };
  switch (sortKey) {
    case 'code-asc':
      return list.sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
    case 'code-desc':
      return list.sort((a, b) => String(b.code || '').localeCompare(String(a.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
    case 'selling-asc':
    case 'price-asc':
      return list.sort((a, b) => (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0));
    case 'selling-desc':
    case 'price-desc':
      return list.sort((a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0));
    case 'cost-asc':
      return list.sort((a, b) => (Number(a.costPrice) || 0) - (Number(b.costPrice) || 0));
    case 'cost-desc':
      return list.sort((a, b) => (Number(b.costPrice) || 0) - (Number(a.costPrice) || 0));
    case 'stock-asc':
      return list.sort((a, b) => {
        if (a.itemType === 'service' || b.itemType === 'service') {
          return a.itemType === b.itemType ? 0 : a.itemType === 'service' ? 1 : -1;
        }
        return (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0);
      });
    case 'stock-desc':
      return list.sort((a, b) => {
        if (a.itemType === 'service' || b.itemType === 'service') {
          return a.itemType === b.itemType ? 0 : a.itemType === 'service' ? 1 : -1;
        }
        return (Number(b.stockQuantity) || 0) - (Number(a.stockQuantity) || 0);
      });
    case 'name-asc':
      return list.sort(compareName);
    case 'name-desc':
      return list.sort((a, b) => compareName(b, a));
    case 'newest':
      return list.sort((a, b) => addedAt(b) - addedAt(a));
    case 'oldest':
      return list.sort((a, b) => addedAt(a) - addedAt(b));
    default:
      return list.sort(compareName);
  }
}

// =============================================================================
// 9. DASHBOARD METRICS CALCULATION (Requirement 3.1)
// =============================================================================

export function updateDashboardMetrics() {
  // 1. Today's Stationery Sales & Profit
  let statSales = 0;
  let statUnits = 0;
  let statProfitToday = 0;

  APP_STATE.todayStationeryTransactions.forEach(t => {
    const total = Number(t.totalAmount || t.sellingPrice || 0);
    const qty = Number(t.quantity || 1);
    statSales += total;
    statUnits += qty;

    if (t.profit !== undefined) {
      statProfitToday += Number(t.profit);
    } else {
      const cost = Number(t.costPrice || 0);
      const sell = Number(t.sellingPrice || 0);
      statProfitToday += (sell - cost) * qty;
    }
  });

  // 2. Today's Reloads & Commission
  let reloadVolume = 0;
  let reloadCommission = 0;

  APP_STATE.todayReloadTransactions.forEach(r => {
    reloadVolume += Number(r.amount || 0);
    reloadCommission += Number(r.commissionAmount || 0);
  });

  const lifetimeReloadCommission = roundCurrency(APP_STATE.masterReloadRecords
    .reduce((sum, record) => sum + Number(record.commissionAmount || 0), 0));
  const lifetimeStationeryProfit = roundCurrency(APP_STATE.masterStationeryRecords
    .reduce((sum, record) => sum + Number(
      record.profit !== undefined
        ? record.profit
        : (Number(record.sellingPrice || 0) - Number(record.costPrice || 0)) * Number(record.quantity || 1)
    ), 0));

  // The dashboard contains exactly the seven requested metrics.
  const elStatSales = document.getElementById('dashStationerySales');
  const elStatUnits = document.getElementById('dashStationeryUnits');
  const elReloadVol = document.getElementById('dashReloadVolume');
  const elReloadComm = document.getElementById('dashReloadCommission');
  const elStatProfit = document.getElementById('dashStationeryProfit');
  const elCatalogCount = document.getElementById('dashCatalogCount');
  const elLifetimeReloadCommission = document.getElementById('dashReloadCommissionTotal');
  const elLifetimeStationeryProfit = document.getElementById('dashStationeryProfitTotal');
  if (elStatSales) elStatSales.textContent = formatLKR(statSales);
  if (elStatUnits) elStatUnits.textContent = String(statUnits);
  if (elReloadVol) elReloadVol.textContent = formatLKR(reloadVolume);
  if (elReloadComm) elReloadComm.textContent = formatSignedLKR(reloadCommission);
  if (elStatProfit) elStatProfit.textContent = formatSignedLKR(statProfitToday);
  if (elCatalogCount) elCatalogCount.textContent = `${APP_STATE.inventoryCatalog.length} Items`;
  if (elLifetimeReloadCommission) elLifetimeReloadCommission.textContent = formatSignedLKR(lifetimeReloadCommission);
  if (elLifetimeStationeryProfit) elLifetimeStationeryProfit.textContent = formatSignedLKR(lifetimeStationeryProfit);

  // Also update paired cards in Master Logs
  updateMasterLogsPairedCards();
}

// =============================================================================
// 10. MASTER LOGS REFINEMENT & 3 DEDICATED PROFIT CARDS (V5.3)
// =============================================================================

export function updateMasterLogsPairedCards() {
  applyMasterLogFilters();
}

function initMasterLogs() {
  const specificDateInput = document.getElementById('logSpecificDate');
  const toggleMoreFiltersBtn = document.getElementById('toggleMoreFiltersBtn');
  const moreFiltersDrawer = document.getElementById('moreFiltersDrawer');
  const moreFiltersChevron = document.getElementById('moreFiltersChevron');
  const fromInput = document.getElementById('logDateFrom');
  const toInput = document.getElementById('logDateTo');
  const applyCustomDateBtn = document.getElementById('applyCustomDateBtn');
  const resetLogFiltersBtn = document.getElementById('resetLogFiltersBtn');

  // Set default specific date to today
  if (specificDateInput) {
    specificDateInput.value = getTodayDateString();
    specificDateInput.addEventListener('change', () => {
      const val = specificDateInput.value;
      if (val) {
        APP_STATE.logDateScope = 'specific';
        APP_STATE.logDateFrom = val;
        APP_STATE.logDateTo = val;
        if (fromInput) fromInput.value = '';
        if (toInput) toInput.value = '';
        document.querySelectorAll('[data-log-date]').forEach(b => {
          b.className = 'log-date-btn px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border transition font-rounded text-xs';
        });
        applyMasterLogFilters();
      }
    });
  }

  // Toggle "More Filter Options"
  if (toggleMoreFiltersBtn && moreFiltersDrawer) {
    toggleMoreFiltersBtn.addEventListener('click', () => {
      const isOpen = !moreFiltersDrawer.classList.contains('is-open');
      moreFiltersDrawer.classList.toggle('is-open', isOpen);
      moreFiltersDrawer.setAttribute('aria-hidden', String(!isOpen));
      toggleMoreFiltersBtn.setAttribute('aria-expanded', String(isOpen));
      if (moreFiltersChevron) moreFiltersChevron.classList.toggle('rotate-180', isOpen);
    });
  }

  // Preset pills (Today, All Time, Yesterday, This Month)
  document.querySelectorAll('[data-log-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-log-date]').forEach(b => {
        b.className = 'log-date-btn px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border transition font-rounded text-xs';
      });
      btn.className = 'log-date-btn active px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border theme-bg-subtle transition font-bold theme-text-main font-rounded text-xs';

      const scope = btn.getAttribute('data-log-date');
      APP_STATE.logDateScope = scope;
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';

      if (scope === 'today') {
        APP_STATE.logDateFrom = getTodayDateString();
        APP_STATE.logDateTo = getTodayDateString();
        if (specificDateInput) specificDateInput.value = getTodayDateString();
      } else if (scope === 'all-time') {
        APP_STATE.logDateFrom = '1970-01-01';
        APP_STATE.logDateTo = '2099-12-31';
        if (specificDateInput) specificDateInput.value = '';
      } else if (scope === 'yesterday') {
        APP_STATE.logDateFrom = getYesterdayDateString();
        APP_STATE.logDateTo = getYesterdayDateString();
        if (specificDateInput) specificDateInput.value = getYesterdayDateString();
      } else if (scope === 'this-month') {
        const today = getTodayDateString();
        APP_STATE.logDateFrom = today.substring(0, 8) + '01';
        APP_STATE.logDateTo = today;
        if (specificDateInput) specificDateInput.value = '';
      }
      applyMasterLogFilters();
    });
  });

  // Apply Custom Range button
  if (applyCustomDateBtn) {
    applyCustomDateBtn.addEventListener('click', () => {
      if (fromInput && fromInput.value) {
        const rangeEnd = (toInput && toInput.value) ? toInput.value : fromInput.value;
        if (rangeEnd < fromInput.value) {
          showToast('The end date must be on or after the start date.', 'error');
          return;
        }
        APP_STATE.logDateScope = 'custom';
        APP_STATE.logDateFrom = fromInput.value;
        APP_STATE.logDateTo = rangeEnd;
        if (specificDateInput) specificDateInput.value = '';
        document.querySelectorAll('[data-log-date]').forEach(b => {
          b.className = 'log-date-btn px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border transition font-rounded text-xs';
        });
        applyMasterLogFilters();
      }
    });
  }

  // Reset to Today button
  if (resetLogFiltersBtn) {
    resetLogFiltersBtn.addEventListener('click', () => {
      APP_STATE.logDateScope = 'today';
      APP_STATE.logDateFrom = getTodayDateString();
      APP_STATE.logDateTo = getTodayDateString();
      APP_STATE.logSearchQuery = '';
      if (specificDateInput) specificDateInput.value = getTodayDateString();
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      const searchInput = document.getElementById('logSearchFilter');
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('[data-log-date]').forEach(b => {
        if (b.getAttribute('data-log-date') === 'today') {
          b.className = 'log-date-btn active px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border theme-bg-subtle transition font-bold theme-text-main font-rounded text-xs';
        } else {
          b.className = 'log-date-btn px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border theme-border transition font-rounded text-xs';
        }
      });
      applyMasterLogFilters();
    });
  }

  // Category Tabs
  document.querySelectorAll('[data-log-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      setMasterLogCategoryTab(tabBtn.getAttribute('data-log-tab'));
    });
  });

  // Search filter input
  const searchInput = document.getElementById('logSearchFilter');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      APP_STATE.logSearchQuery = searchInput.value.trim().toLowerCase();
      applyMasterLogFilters();
    });
  }

  // PDF Export Stamped with Brand Logo
  const pdfBtn = document.getElementById('downloadPdfReportBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', generateProfessionalPdfReport);
  }
}

function setMasterLogCategoryTab(tabId) {
  APP_STATE.logTab = tabId;
  document.querySelectorAll('[data-log-tab]').forEach(btn => {
    if (btn.getAttribute('data-log-tab') === tabId) {
      btn.className = 'log-tab-btn active pb-2 border-b-2 border-sky-400 theme-text-main font-bold transition font-rounded';
    } else {
      btn.className = 'log-tab-btn pb-2 border-b-2 border-transparent theme-text-muted hover:theme-text-main transition font-rounded';
    }
  });
  applyMasterLogFilters();
}

export function applyMasterLogFilters() {
  const fromDate = APP_STATE.logDateFrom || getTodayDateString();
  const toDate = APP_STATE.logDateTo || fromDate;
  const isAllTime = fromDate === '1970-01-01' || APP_STATE.logDateScope === 'all-time';
  const q = APP_STATE.logSearchQuery || '';

  // Filter Stationery & Bills
  const filteredStationery = APP_STATE.masterStationeryRecords.filter(s => {
    const d = s.date || '';
    if (!isAllTime) {
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
    }
    if (!q) return true;
    return (s.itemName || '').toLowerCase().includes(q) ||
           (s.itemCode || '').toLowerCase().includes(q) ||
           String(s.totalAmount).includes(q);
  });

  // Filter Reloads
  const filteredReloads = APP_STATE.masterReloadRecords.filter(r => {
    const d = r.date || '';
    if (!isAllTime) {
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
    }
    if (!q) return true;
    return (r.phone || '').includes(q) ||
           (r.operator || '').toLowerCase().includes(q) ||
           String(r.amount).includes(q);
  });

  // Calculate Filtered Summaries
  let filteredStatSales = 0;
  let filteredStatProfit = 0;
  let filteredStatUnits = 0;
  let filteredStatCount = filteredStationery.length;

  filteredStationery.forEach(s => {
    const total = Number(s.totalAmount || s.sellingPrice || 0);
    const qty = Number(s.quantity || 1);
    filteredStatSales += total;
    filteredStatUnits += qty;

    if (s.profit !== undefined) {
      filteredStatProfit += Number(s.profit);
    } else {
      const cost = Number(s.costPrice || 0);
      const sell = Number(s.sellingPrice || 0);
      filteredStatProfit += (sell - cost) * qty;
    }
  });

  let filteredReloadVol = 0;
  let filteredReloadComm = 0;
  let filteredReloadCount = filteredReloads.length;

  filteredReloads.forEach(r => {
    filteredReloadVol += Number(r.amount || 0);
    filteredReloadComm += Number(r.commissionAmount || 0);
  });

  const filteredTotalProfit = roundCurrency(filteredStatProfit + filteredReloadComm);
  // Card 1: Filtered Reloads Card
  const elLogReloadVol = document.getElementById('logPairedReloadVol');
  const elLogReloadComm = document.getElementById('logPairedReloadComm');
  const elLogReloadStats = document.getElementById('logPairedReloadStats');

  if (elLogReloadVol) elLogReloadVol.textContent = formatLKR(filteredReloadVol);
  // Display the full currency amount without a shortened commission label.
  if (elLogReloadComm) elLogReloadComm.textContent = formatSignedLKR(filteredReloadComm);
  if (elLogReloadStats) elLogReloadStats.textContent = `${filteredReloadCount} reload transactions`;

  // Card 2: Filtered Stationery & Bills Card
  const elLogStatSales = document.getElementById('logPairedStatSales');
  const elLogStatProfit = document.getElementById('logPairedStatProfit');
  const elLogStatStats = document.getElementById('logPairedStatStats');

  if (elLogStatSales) elLogStatSales.textContent = formatLKR(filteredStatSales);
  if (elLogStatProfit) elLogStatProfit.textContent = formatSignedLKR(filteredStatProfit);
  if (elLogStatStats) elLogStatStats.textContent = `${filteredStatUnits} units sold | ${filteredStatCount} txs`;

  // Card 3: Dedicated Standalone Combined Total Profit Card
  const elLogCombinedTotalProfit = document.getElementById('logCombinedTotalProfit');
  const elLogCombinedProfitStats = document.getElementById('logCombinedProfitStats');

  if (elLogCombinedTotalProfit) elLogCombinedTotalProfit.textContent = formatSignedLKR(filteredTotalProfit);
  if (elLogCombinedProfitStats) elLogCombinedProfitStats.textContent = `Reloads (${formatSignedLKR(filteredReloadComm)}) + Stationery (${formatSignedLKR(filteredStatProfit)})`;

  // Filter Scope Label
  const scopeLabel = document.getElementById('masterLogsDateScopeLabel');
  if (scopeLabel) {
    if (isAllTime) {
      scopeLabel.textContent = 'Showing: All Time';
    } else if (fromDate === toDate) {
      scopeLabel.textContent = fromDate === getTodayDateString() ? `Showing: Today (${fromDate})` : `Showing: ${fromDate}`;
    } else {
      scopeLabel.textContent = `Showing: ${fromDate} → ${toDate}`;
    }
  }
  const specificDateWrap = document.getElementById('logSpecificDateWrap');
  specificDateWrap?.classList.toggle('filter-active', APP_STATE.logDateScope === 'specific');
  const rangeDrawer = document.getElementById('moreFiltersDrawer');
  rangeDrawer?.classList.toggle('range-active', APP_STATE.logDateScope === 'custom');
  document.querySelectorAll('[data-log-date]').forEach(button => {
    button.classList.toggle('active', button.getAttribute('data-log-date') === APP_STATE.logDateScope);
  });

  // Update Category Badge Counts
  const countAll = document.getElementById('countLogAll');
  const countStat = document.getElementById('countLogStat');
  const countReloads = document.getElementById('countLogReloads');

  if (countAll) countAll.textContent = String(filteredStationery.length + filteredReloads.length);
  if (countStat) countStat.textContent = String(filteredStationery.length);
  if (countReloads) countReloads.textContent = String(filteredReloads.length);

  // Combine & Sort by Date + Time descending
  let displayRows = [];

  if (APP_STATE.logTab === 'all' || APP_STATE.logTab === 'stationery') {
    filteredStationery.forEach(s => {
      displayRows.push({
        type: s.itemType === 'service' ? 'SERVICE' : 'STATIONERY',
        date: s.date || '',
        time: s.time || '',
        title: s.itemName,
        code: s.itemCode,
        ref: `Qty: ${s.quantity || 1}`,
        amount: Number(s.totalAmount || s.sellingPrice || 0),
        profit: Number(s.profit || 0),
        raw: s
      });
    });
  }

  if (APP_STATE.logTab === 'all' || APP_STATE.logTab === 'reloads') {
    filteredReloads.forEach(r => {
      displayRows.push({
        type: 'RELOAD',
        date: r.date || '',
        time: r.time || '',
        title: `${r.operator} Reload`,
        code: r.operator,
        ref: r.phone || 'Walk-in Customer',
        amount: Number(r.amount || 0),
        profit: Number(r.commissionAmount || 0),
        raw: r
      });
    });
  }

  displayRows.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));

  renderMasterLogsTable(displayRows);
}
function renderMasterLogsTable(rows) {
  const tbody = document.getElementById('masterLogsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center theme-text-dim text-xs">
          No transaction records found for the selected period.
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    let typeBadge = '';
    if (item.type === 'RELOAD') {
      typeBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold border ${item.code === 'DIALOG' ? 'text-orange-400 border-orange-500/30' : item.code === 'MOBITEL' ? 'text-blue-400 border-blue-500/30' : item.code === 'AIRTEL' ? 'text-red-400 border-red-500/30' : 'text-amber-300 border-amber-500/30'}">${escapeHTML(item.code)}</span>`;
    } else if (item.type === 'SERVICE') {
      typeBadge = `<span class="badge-service-bill px-2 py-0.5 rounded text-[10px] font-bold">Service / Bill</span>`;
    } else {
      typeBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">${escapeHTML(item.code || 'ST')}</span>`;
    }

    tr.innerHTML = `
      <td data-label="Time / Date" class="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
        <div class="font-bold theme-text-main">${escapeHTML(item.time || '--:--')}</div>
        <div class="text-[10px] theme-text-dim">${escapeHTML(item.date || '')}</div>
      </td>
      <td data-label="Category / Item" class="py-2.5 px-3">
        <div class="flex items-center gap-2">
          ${typeBadge}
          <span class="font-semibold text-xs theme-text-main">${escapeHTML(item.type === 'RELOAD' ? item.title : toTitleCase(item.title))}</span>
        </div>
      </td>
      <td data-label="Reference / Number" class="py-2.5 px-3 font-mono text-xs theme-text-dim">
        ${escapeHTML(item.ref)}
      </td>
      <td data-label="Amount" class="py-2.5 px-3 text-right font-mono font-bold text-xs theme-text-main currency-lkr">
        ${formatLKR(item.amount)}
      </td>
      <td data-label="Profit" class="py-2.5 px-3 text-right font-mono font-bold text-xs ${item.type === 'RELOAD' ? 'text-emerald-400' : 'text-sky-400'} currency-lkr">
        ${formatSignedLKR(item.profit)}
      </td>
      <td data-label="Action" class="py-2.5 px-3 text-center">
        <button type="button" class="delete-tx-btn min-h-11 min-w-11 p-1 text-red-400 hover:text-red-300 transition" title="Delete record" aria-label="Delete transaction">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    const deleteBtn = tr.querySelector('.delete-tx-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`Delete transaction for "${item.title}" (${formatLKR(item.amount)})?`)) return;
        try {
          const restored = await removeTransaction(item.type, item.raw);
          showToast(restored
            ? 'Transaction deleted, stock restored'
            : 'Transaction deleted', 'success');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 11. STAMPED PROFESSIONAL PDF REPORT ENGINE (Requirement 5.1)
// =============================================================================

function getLogoDataUrl() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 140;
        canvas.height = img.naturalHeight || 140;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = './images/logo.png';
  });
}

export async function generateProfessionalPdfReport() {
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    showToast('PDF generator library is initializing. Please try again.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const fromDate = APP_STATE.logDateFrom || getTodayDateString();
  const toDate = APP_STATE.logDateTo || fromDate;
  const isAllTime = fromDate === '1970-01-01' || APP_STATE.logDateScope === 'all-time';
  const dateRangeStr = isAllTime ? 'All Time Transaction Records' : (fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`);
  const searchQuery = APP_STATE.logSearchQuery || '';
  const matchesActiveSearch = record => !searchQuery ||
    (record.itemName || '').toLowerCase().includes(searchQuery) ||
    (record.itemCode || '').toLowerCase().includes(searchQuery) ||
    (record.phone || '').toLowerCase().includes(searchQuery) ||
    (record.operator || '').toLowerCase().includes(searchQuery) ||
    String(record.totalAmount ?? record.amount ?? '').includes(searchQuery);

  const stationeryList = APP_STATE.masterStationeryRecords
    .filter(s => (isAllTime || (s.date >= fromDate && s.date <= toDate)) && matchesActiveSearch(s))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const reloadList = APP_STATE.masterReloadRecords
    .filter(r => (isAllTime || (r.date >= fromDate && r.date <= toDate)) && matchesActiveSearch(r))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  let totalStatSales = 0;
  let totalUnitsSold = 0;
  let totalStatProfit = 0;

  stationeryList.forEach(s => {
    const total = Number(s.totalAmount || s.sellingPrice || 0);
    const qty = Number(s.quantity || 1);
    totalStatSales += total;
    totalUnitsSold += qty;
    if (s.profit !== undefined) {
      totalStatProfit += Number(s.profit);
    } else {
      const cost = Number(s.costPrice || 0);
      const sell = Number(s.sellingPrice || 0);
      totalStatProfit += (sell - cost) * qty;
    }
  });

  let totalReloadVol = 0;
  let totalReloadComm = 0;
  reloadList.forEach(r => {
    totalReloadVol += Number(r.amount || 0);
    totalReloadComm += Number(r.commissionAmount || 0);
  });

  const totalStoreRevenue = roundCurrency(totalStatSales + totalReloadVol);
  const totalNetProfit = roundCurrency(totalStatProfit + totalReloadComm);

  // 1. Header Banner
  pdfDoc.setFillColor(11, 17, 32); // Modern Slate #0b1120
  pdfDoc.rect(0, 0, 210, 36, 'F');

  // Load and stamp official logo
  const logoDataUri = await getLogoDataUrl();
  if (logoDataUri) {
    try {
      pdfDoc.addImage(logoDataUri, 'PNG', 168, 5, 26, 26);
    } catch (e) {
      console.warn('PDF logo stamp error:', e);
    }
  }

  pdfDoc.setTextColor(255, 255, 255);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(18);
  pdfDoc.text('AL Communication', 14, 15);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(148, 163, 184); // Slate-400
  pdfDoc.text('Retail Store Management & Counter Ledger • Official Transaction Audit Report', 14, 21);
  pdfDoc.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })} (Sri Lanka Time) • Period: ${dateRangeStr}`, 14, 26);

  // 2. Executive KPI Summary Cards (3-Box Layout)
  const boxY = 42;
  const boxW = 58;
  const boxH = 20;

  // Box 1: Reload Sales & Profit
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.setDrawColor(226, 232, 240);
  pdfDoc.roundedRect(14, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('FILTERED RELOADS', 17, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(formatLKR(totalReloadVol), 17, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(2, 132, 199);
  pdfDoc.text(`Profit: ${formatSignedLKR(totalReloadComm)} (${reloadList.length} txs)`, 17, boxY + 17);

  // Box 2: Stationery & Bills Sales and Profit
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.roundedRect(76, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('FILTERED STATIONERY & BILLS', 79, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(formatLKR(totalStatSales), 79, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(16, 185, 129);
  pdfDoc.text(`Profit: ${formatSignedLKR(totalStatProfit)} (${totalUnitsSold} units)`, 79, boxY + 17);

  // Box 3: Combined Total Profit
  pdfDoc.setFillColor(240, 253, 244);
  pdfDoc.setDrawColor(187, 247, 208);
  pdfDoc.roundedRect(138, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(22, 101, 52);
  pdfDoc.text('TOTAL PROFIT', 141, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(21, 128, 61);
  pdfDoc.text(formatSignedLKR(totalNetProfit), 141, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(`Total Turnover: ${formatLKR(totalStoreRevenue)}`, 141, boxY + 17);

  // 3. Transactions Table (autoTable)
  const tableData = [];

  stationeryList.forEach(s => {
    tableData.push([
      `${s.date || ''} ${s.time || ''}`,
      s.itemType === 'service' ? 'Service/Bill' : 'Stationery',
      toTitleCase(s.itemName || '-'),
      s.itemCode || '-',
      String(s.quantity || 1),
      formatLKR(Number(s.totalAmount || s.sellingPrice || 0)),
      formatSignedLKR(Number(s.profit ?? (Number(s.sellingPrice || 0) - Number(s.costPrice || 0)) * Number(s.quantity || 1)))
    ]);
  });

  reloadList.forEach(r => {
    tableData.push([
      `${r.date || ''} ${r.time || ''}`,
      'Mobile Reload',
      `${r.operator} Top-up`,
      r.phone || 'Walk-in',
      '1',
      formatLKR(Number(r.amount || 0)),
      formatSignedLKR(Number(r.commissionAmount || 0))
    ]);
  });

  // Sort descending by date/time
  tableData.sort((a, b) => b[0].localeCompare(a[0]));

  if (typeof pdfDoc.autoTable === 'function') {
    pdfDoc.autoTable({
      startY: boxY + boxH + 6,
      head: [['Date / Time', 'Type', 'Description / Operator', 'Reference / Code', 'Qty', 'Amount (LKR)', 'Profit (LKR)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 26, fontSize: 7 },
        1: { cellWidth: 22, fontSize: 7 },
        2: { cellWidth: 44, fontSize: 7 },
        3: { cellWidth: 26, fontSize: 7 },
        4: { cellWidth: 12, halign: 'center', fontSize: 7 },
        5: { cellWidth: 25, halign: 'right', fontSize: 7, fontStyle: 'bold' },
        6: { cellWidth: 25, halign: 'right', fontSize: 7, fontStyle: 'bold', textColor: [16, 185, 129] }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14, bottom: 18 },
      didDrawPage: function(data) {
        // Page footer
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.setFontSize(7.5);
        pdfDoc.setTextColor(148, 163, 184);
        pdfDoc.text('AL Communication Retail Management System • Confirmed Operational Record', 14, 290);
        pdfDoc.text(`Page ${data.pageNumber} of ${pdfDoc.internal.getNumberOfPages()}`, 180, 290);
      }
    });
  }

  pdfDoc.save(`AL_Communication_Ledger_${dateRangeStr.replace(/\s+/g, '_')}.pdf`);
  showToast('Stamped PDF report downloaded successfully', 'success');
}

// =============================================================================
// 12. STOCK INVENTORY & NATURAL NUMERICAL SORTING (Requirements 4.2 & 4.3)
// =============================================================================

function initStockInventory() {
  const searchInput = document.getElementById('stockSearchInput');
  const sortSelect = document.getElementById('stockSortSelect');

  if (searchInput) {
    searchInput.addEventListener('input', renderStockTable);
  }

  if (sortSelect) {
    sortSelect.value = APP_STATE.stockSortOrder;
    sortSelect.addEventListener('change', () => {
      APP_STATE.stockSortOrder = sortSelect.value;
      localStorage.setItem('al_stock_sort_order', APP_STATE.stockSortOrder);
      renderStockTable();
    });
  }

  // Stock Filter Pills
  document.querySelectorAll('.stock-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stock-filter-btn').forEach(b => {
        b.className = 'stock-filter-btn px-3 py-1.5 rounded-lg border theme-border transition';
      });
      btn.className = 'stock-filter-btn active px-3 py-1.5 rounded-lg border theme-border theme-bg-subtle transition font-bold theme-text-main';
      APP_STATE.stockFilter = btn.getAttribute('data-stock-filter');
      renderStockTable();
    });
  });
}

export function renderStockTable() {
  const tbody = document.getElementById('stockTableBody');
  const searchInput = document.getElementById('stockSearchInput');
  const queryStr = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!tbody) return;
  tbody.innerHTML = '';

  // 1. Filter
  let items = APP_STATE.inventoryCatalog.filter(item => {
    // Text search
    if (queryStr) {
      const match = (item.code || '').toLowerCase().includes(queryStr) ||
                    (item.name || '').toLowerCase().includes(queryStr) ||
                    (item.category || '').toLowerCase().includes(queryStr);
      if (!match) return false;
    }

    // Filter pill
    if (APP_STATE.stockFilter === 'LOW') {
      return item.itemType !== 'service' && item.stockQuantity > 0 && item.stockQuantity <= (item.lowStockThreshold || 5);
    }
    if (APP_STATE.stockFilter === 'OUT') {
      return item.itemType !== 'service' && item.stockQuantity <= 0;
    }
    if (APP_STATE.stockFilter === 'SERVICE') {
      return item.itemType === 'service';
    }
    return true;
  });

  // 2. Sort Naturally (Requirement 4.3)
  items = sortCatalogList(items, APP_STATE.stockSortOrder);

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center theme-text-dim text-xs">
          No inventory products found matching the active criteria.
        </td>
      </tr>
    `;
    return;
  }

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    const isService = item.itemType === 'service';

    let typeCol = isService
      ? `<span class="badge-service-bill px-2 py-0.5 rounded text-[10px] font-bold">Service / Bill</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">Physical</span>`;

    let stockCol = '';
    if (isService) {
      stockCol = `<span class="badge-service-bill px-2.5 py-1 rounded-full text-xs font-bold">Service / Bill</span>`;
    } else if (item.stockQuantity <= 0) {
      stockCol = `<span class="badge-stock-out px-2.5 py-1 rounded-full text-xs font-bold">Out of Stock (0)</span>`;
    } else if (item.stockQuantity <= (item.lowStockThreshold || 5)) {
      stockCol = `<span class="badge-stock-low px-2.5 py-1 rounded-full text-xs font-bold">${escapeHTML(item.stockQuantity)} Left (Low)</span>`;
    } else {
      stockCol = `<span class="badge-stock-in px-2.5 py-1 rounded-full text-xs font-bold">${escapeHTML(item.stockQuantity)} in stock</span>`;
    }

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono font-bold text-xs theme-text-main">${escapeHTML(item.code)}</td>
      <td class="py-3 px-3 sm:px-4">
        <div class="font-bold text-xs theme-text-main">${escapeHTML(toTitleCase(item.name))}</div>
        <div class="text-[11px] theme-text-dim">${escapeHTML(item.category || 'General')}</div>
      </td>
      <td class="py-3 px-3 sm:px-4">${typeCol}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono font-bold text-xs theme-text-main currency-lkr">
        ${formatLKR(item.sellingPrice)}
      </td>
      <td class="py-3 px-3 sm:px-4 text-center">${stockCol}</td>
      <td class="py-3 px-3 sm:px-4 text-center">
        <button type="button" class="quick-pos-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-white transition">
          ${isService ? 'Pay Bill' : 'Sell at POS'}
        </button>
      </td>
    `;

    const posBtn = tr.querySelector('.quick-pos-btn');
    if (posBtn) {
      posBtn.addEventListener('click', () => {
        switchView('stationery');
        selectCatalogItemForPOS(item);
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 13. POS STATIONERY ENTRY & SERVICE / BILLS (Requirements 4.1 & 4.2)
// =============================================================================

function selectCatalogItemForPOS(item) {
  APP_STATE.selectedCatalogItem = item;
  const input = document.getElementById('posItemInput');
  const codeBadge = document.getElementById('posItemBadge');
  const stockBadge = document.getElementById('posStockStatusBadge');
  const priceInput = document.getElementById('posSellingPrice');
  const priceLabel = document.getElementById('posSellingPriceLabel');
  const qtyInput = document.getElementById('posQuantity');
  const qtyContainer = document.getElementById('posQtyContainer');
  const submitBtnText = document.getElementById('posSubmitBtnText');

  if (input) input.value = toTitleCase(item.name);
  if (codeBadge) {
    codeBadge.textContent = item.code;
    codeBadge.classList.remove('hidden');
  }

  const isService = item.itemType === 'service';

  if (stockBadge) {
    stockBadge.classList.remove('hidden');
    if (isService) {
      stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-service-bill';
      stockBadge.textContent = 'Service / Utility Bill (No Stock Count)';
    } else if (item.stockQuantity <= 0) {
      stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-out';
      stockBadge.textContent = 'Out of Stock (0)';
    } else if (item.stockQuantity <= (item.lowStockThreshold || 5)) {
      stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-low';
      stockBadge.textContent = `Low Stock: ${item.stockQuantity} Left`;
    } else {
      stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-in';
      stockBadge.textContent = `In Stock: ${item.stockQuantity}`;
    }
  }

  if (priceLabel) {
    priceLabel.textContent = isService ? 'Bill Amount [Rs.] *' : 'Selling Price [Rs.]';
  }

  if (priceInput) {
    if (isService) {
      // Clear price and focus for user to type custom bill amount
      priceInput.value = item.sellingPrice > 0 ? item.sellingPrice.toFixed(2) : '';
      priceInput.placeholder = 'Enter Bill Amount...';
      priceInput.focus();
    } else {
      priceInput.value = item.sellingPrice.toFixed(2);
    }
  }

  if (qtyInput) {
    qtyInput.value = '1';
    qtyInput.required = !isService;
  }
  qtyContainer?.classList.toggle('hidden', isService);

  if (submitBtnText) {
    submitBtnText.textContent = isService ? 'Log Bill Payment' : 'Log Stationery Sale';
  }

  updatePOSTotalPreview();
}

function updatePOSTotalPreview() {
  const priceInput = document.getElementById('posSellingPrice');
  const qtyInput = document.getElementById('posQuantity');
  const totalPreview = document.getElementById('posTotalAmountPreview');

  const price = Number(priceInput?.value) || 0;
  const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 1);
  const total = roundCurrency(price * qty);

  if (totalPreview) {
    totalPreview.textContent = formatLKR(total);
  }
}

function initStationeryPOS() {
  const itemInput = document.getElementById('posItemInput');
  const autocompleteList = document.getElementById('posAutocompleteList');
  const priceInput = document.getElementById('posSellingPrice');
  const qtyInput = document.getElementById('posQuantity');
  const form = document.getElementById('stationeryEntryForm');

  // Title Case Formatting on Blur (Requirement 4.1)
  if (itemInput) {
    itemInput.addEventListener('blur', () => {
      if (!APP_STATE.selectedCatalogItem) {
        itemInput.value = toTitleCase(itemInput.value);
      }
    });

    itemInput.addEventListener('input', () => {
      const q = itemInput.value.trim().toLowerCase();
      if (!q) {
        if (autocompleteList) autocompleteList.classList.add('hidden');
        APP_STATE.selectedCatalogItem = null;
        const codeBadge = document.getElementById('posItemBadge');
        const stockBadge = document.getElementById('posStockStatusBadge');
        if (codeBadge) codeBadge.classList.add('hidden');
        if (stockBadge) stockBadge.classList.add('hidden');
        return;
      }

      const matches = APP_STATE.inventoryCatalog.filter(i => {
        return (i.code || '').toLowerCase().includes(q) || (i.name || '').toLowerCase().includes(q);
      }).slice(0, 6);

      if (matches.length > 0 && autocompleteList) {
        autocompleteList.innerHTML = '';
        autocompleteList.classList.remove('hidden');

        matches.forEach(item => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          const isService = item.itemType === 'service';
          div.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">${escapeHTML(item.code)}</span>
              <span class="font-bold text-xs theme-text-main">${escapeHTML(toTitleCase(item.name))}</span>
            </div>
            <div class="text-right">
              <div class="font-bold text-xs theme-text-main font-mono">${formatLKR(item.sellingPrice)}</div>
              <div class="text-[10px] theme-text-dim">${isService ? 'Service/Bill' : `${escapeHTML(item.stockQuantity)} left`}</div>
            </div>
          `;
          div.addEventListener('click', () => {
            selectCatalogItemForPOS(item);
            autocompleteList.classList.add('hidden');
          });
          autocompleteList.appendChild(div);
        });
      } else if (autocompleteList) {
        autocompleteList.classList.add('hidden');
      }
    });
  }

  // Steppers & Quantity Pills
  const decBtn = document.getElementById('posQtyDecBtn');
  const incBtn = document.getElementById('posQtyIncBtn');

  if (decBtn && qtyInput) {
    decBtn.addEventListener('click', () => {
      const cur = parseInt(qtyInput.value, 10) || 1;
      if (cur > 1) {
        qtyInput.value = cur - 1;
        updatePOSTotalPreview();
      }
    });
  }

  if (incBtn && qtyInput) {
    incBtn.addEventListener('click', () => {
      const cur = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = cur + 1;
      updatePOSTotalPreview();
    });
  }

  document.querySelectorAll('[data-qty-pill]').forEach(pill => {
    pill.addEventListener('click', () => {
      if (qtyInput) {
        qtyInput.value = pill.getAttribute('data-qty-pill');
        updatePOSTotalPreview();
      }
    });
  });

  if (priceInput) priceInput.addEventListener('input', updatePOSTotalPreview);
  if (qtyInput) qtyInput.addEventListener('input', updatePOSTotalPreview);

  // Form Submit: Log Stationery Sale or Utility Bill (Requirement 4.2)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawName = itemInput.value.trim();
      const itemName = toTitleCase(rawName); // Requirement 4.1 Auto Title Case
      const sellingPrice = roundCurrency(priceInput.value);
      const quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const totalAmount = roundCurrency(sellingPrice * quantity);

      const matchedItem = APP_STATE.selectedCatalogItem;
      const isService = matchedItem && matchedItem.itemType === 'service';
      const itemCode = matchedItem ? matchedItem.code : 'CUSTOM';
      const category = matchedItem ? (matchedItem.category || (isService ? 'Utility Bills' : 'General')) : 'Custom';
      
      // Cost price & profit handling
      let costPrice = 0;
      let unitProfit = 0;
      let lineProfit = 0;

      if (isService) {
        costPrice = matchedItem ? roundCurrency(matchedItem.costPrice || 0) : 0;
        unitProfit = roundCurrency(sellingPrice - costPrice);
        lineProfit = roundCurrency(unitProfit * quantity);
      } else {
        costPrice = matchedItem ? roundCurrency(matchedItem.costPrice || 0) : 0;
        unitProfit = roundCurrency(sellingPrice - costPrice);
        lineProfit = roundCurrency(unitProfit * quantity);
      }

      if (!itemName) {
        showToast('Please specify an item name or code', 'error');
        return;
      }
      if (sellingPrice <= 0) {
        showToast('Please enter a valid amount / selling price', 'error');
        return;
      }

      // Stock Warning for physical products
      if (!isService && matchedItem && Number(matchedItem.stockQuantity || 0) < quantity) {
        showToast(`Insufficient stock for "${matchedItem.name}". Available: ${matchedItem.stockQuantity || 0}.`, 'error');
        return;
      }

      const transactionPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        createdBy: auth.currentUser.uid,
        itemCode,
        itemName,
        ...(matchedItem?.id && !isService ? { inventoryId: matchedItem.id } : {}),
        category,
        itemType: isService ? 'service' : 'product',
        costPrice,
        sellingPrice,
        unitProfit,
        profit: lineProfit,
        quantity,
        totalAmount,
        timestamp: serverTimestamp()
      };

      try {
        if (!isService && matchedItem && matchedItem.id) {
          const itemDocRef = doc(db, 'inventory', matchedItem.id);
          const transactionRef = doc(collection(db, 'stationery_transactions'));
          await runTransaction(db, async firestoreTransaction => {
            const inventorySnapshot = await firestoreTransaction.get(itemDocRef);
            if (!inventorySnapshot.exists()) {
              throw new Error('The selected inventory item no longer exists.');
            }
            const availableStock = Number(inventorySnapshot.data().stockQuantity || 0);
            if (availableStock < quantity) {
              throw new Error(`Insufficient stock. Only ${availableStock} units are currently available.`);
            }
            firestoreTransaction.update(itemDocRef, {
              stockQuantity: increment(-quantity),
              updatedAt: serverTimestamp()
            });
            firestoreTransaction.set(transactionRef, transactionPayload);
          });
          const remainingStock = Math.max(0, matchedItem.stockQuantity - quantity);
          showToast(`Logged sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)}) | Stock left: ${remainingStock}`, 'success');
        } else {
          await addDoc(collection(db, 'stationery_transactions'), transactionPayload);
        }

        if (isService) {
          showToast(`Recorded utility bill: ${itemName} (${formatLKR(totalAmount)}) [No stock deduction]`, 'success');
        } else if (!matchedItem) {
          showToast(`Logged custom sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)})`, 'success');
        }

        // Reset Form
        form.reset();
        APP_STATE.selectedCatalogItem = null;
        const codeBadge = document.getElementById('posItemBadge');
        const stockBadge = document.getElementById('posStockStatusBadge');
        const submitBtnText = document.getElementById('posSubmitBtnText');
        const priceLabel = document.getElementById('posSellingPriceLabel');

        if (codeBadge) codeBadge.classList.add('hidden');
        if (stockBadge) stockBadge.classList.add('hidden');
        if (priceLabel) priceLabel.textContent = 'Selling Price / Amount [Rs.]';
        if (submitBtnText) submitBtnText.textContent = 'Log Stationery Sale';
        if (qtyInput) qtyInput.value = '1';
        if (qtyInput) qtyInput.required = true;
        document.getElementById('posQtyContainer')?.classList.remove('hidden');
        updatePOSTotalPreview();
        itemInput.focus();
      } catch (err) {
        logDebug(`Error recording sale: ${err.message}`, 'ERROR');
        showToast(`Failed to log sale: ${err.message}`, 'error');
      }
    });
  }

  setupEditStationeryModal();
}

function renderRecentStationeryFeed() {
  const feed = document.getElementById('statRecentFeed');
  if (!feed) return;
  feed.innerHTML = '';

  const recent = [...APP_STATE.todayStationeryTransactions].slice(0, 5);

  if (recent.length === 0) {
    feed.innerHTML = `
      <div class="p-3 text-xs text-center theme-text-dim rounded-xl border theme-border">
        No sales or utility bills recorded yet today.
      </div>
    `;
    return;
  }

  recent.forEach(item => {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl border theme-border theme-bg-subtle flex items-center justify-between text-xs';
    const isService = item.itemType === 'service';
    const badge = isService
      ? `<span class="badge-service-bill px-1.5 py-0.5 rounded text-[10px] font-bold">Bill</span>`
      : `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">${escapeHTML(item.itemCode || 'ST')}</span>`;

    div.innerHTML = `
      <div class="flex items-center gap-2">
        ${badge}
        <div>
          <span class="font-bold theme-text-main">${escapeHTML(toTitleCase(item.itemName))}</span>
          <span class="text-[11px] theme-text-dim"> &times; ${escapeHTML(item.quantity || 1)} &bull; ${escapeHTML(item.time || '')}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-right">
          <span class="font-mono font-bold text-emerald-400 currency-lkr">${formatLKR(item.totalAmount)}</span>
          <span class="text-[10px] theme-text-dim block">${formatSignedLKR(item.profit ?? ((Number(item.sellingPrice || 0) - Number(item.costPrice || 0)) * Number(item.quantity || 1)))} margin</span>
        </div>
        <button type="button" class="recent-delete-btn min-h-11 min-w-11 text-red-400 hover:text-red-300" aria-label="Delete transaction" title="Delete transaction">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    div.querySelector('.recent-delete-btn')?.addEventListener('click', async () => {
      if (!confirm(`Delete transaction for "${item.itemName}"?`)) return;
      try {
        const restored = await removeTransaction('STATIONERY', item);
        showToast(restored ? 'Transaction deleted, stock restored' : 'Transaction deleted', 'success');
      } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
      }
    });
    feed.appendChild(div);
  });
}

function setupEditStationeryModal() {
  const modal = document.getElementById('editStationeryModal');
  const closeBtn = document.getElementById('closeEditStatModalBtn');
  const cancelBtn = document.getElementById('cancelEditStatBtn');
  const form = document.getElementById('editStationeryForm');

  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const docId = document.getElementById('editStatDocId')?.value;
      const rawName = document.getElementById('editStatName')?.value.trim();
      const name = toTitleCase(rawName); // Auto Title Case
      const cost = roundCurrency(document.getElementById('editStatCost')?.value);
      const sell = roundCurrency(document.getElementById('editStatSell')?.value);
      const qty = parseInt(document.getElementById('editStatQty')?.value, 10) || 1;
      const profit = roundCurrency((sell - cost) * qty);
      const total = roundCurrency(sell * qty);

      if (!docId) return;

      try {
        await updateDoc(doc(db, 'stationery_transactions', docId), {
          itemName: name,
          costPrice: cost,
          sellingPrice: sell,
          quantity: qty,
          profit,
          totalAmount: total,
          unitProfit: roundCurrency(sell - cost),
          updatedAt: serverTimestamp()
        });
        showToast('Stationery record updated', 'success');
        if (modal) modal.classList.add('hidden');
      } catch (err) {
        showToast(`Update failed: ${err.message}`, 'error');
      }
    });
  }
}

// =============================================================================
// 14. MOBILE RELOADS & COMMISSION ENGINE
// =============================================================================

function selectOperator(operator) {
  APP_STATE.selectedOperator = operator;
  document.querySelectorAll('.op-select-btn').forEach(btn => {
    if (btn.getAttribute('data-operator') === operator) {
      btn.className = 'op-select-btn p-3 rounded-xl border border-sky-400 theme-bg-elevated ring-2 ring-sky-500/30 flex flex-col items-center justify-center gap-1 transition text-center';
    } else {
      btn.className = 'op-select-btn p-3 rounded-xl border theme-border flex flex-col items-center justify-center gap-1 transition text-center hover:theme-bg-elevated';
    }
  });
  updateReloadCommissionPreview();
}

function updateReloadCommissionPreview() {
  const amountInput = document.getElementById('reloadAmount');
  const commPreview = document.getElementById('reloadCommissionPreview');
  const totalPreview = document.getElementById('reloadTotalPreview');

  const amount = Number(amountInput?.value) || 0;
  const rate = APP_STATE.commissionRates[APP_STATE.selectedOperator] || 0;
  const commission = roundCurrency((amount * rate) / 100);

  if (commPreview) {
    commPreview.textContent = formatSignedLKR(commission);
  }
  if (totalPreview) {
    totalPreview.textContent = formatLKR(amount);
  }
}

function renderPresetPills() {
  const container = document.getElementById('quickPresetsContainer');
  if (!container) return;
  container.innerHTML = '';

  APP_STATE.reloadPresets.sort((a, b) => a - b).forEach(val => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-pill';
    btn.textContent = `Rs. ${val}`;
    btn.addEventListener('click', () => {
      const amountInput = document.getElementById('reloadAmount');
      if (amountInput) {
        amountInput.value = val;
        updateReloadCommissionPreview();
      }
    });
    container.appendChild(btn);
  });
}

function initMobileReloads() {
  // Operator buttons
  document.querySelectorAll('.op-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectOperator(btn.getAttribute('data-operator'));
    });
  });

  selectOperator('DIALOG');

  // Phone number input with auto network detection
  const phoneInput = document.getElementById('reloadPhone');
  const detectedBadge = document.getElementById('detectedOperatorBadge');

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const detected = detectOperatorFromPrefix(phoneInput.value);
      if (detected) {
        selectOperator(detected);
        if (detectedBadge) {
          detectedBadge.textContent = detected;
          detectedBadge.className = `absolute right-3 top-2.5 px-2 py-0.5 rounded text-xs font-bold border ${detected === 'DIALOG' ? 'text-orange-400 border-orange-500/30' : detected === 'MOBITEL' ? 'text-blue-400 border-blue-500/30' : detected === 'AIRTEL' ? 'text-red-400 border-red-500/30' : 'text-amber-300 border-amber-500/30'}`;
          detectedBadge.classList.remove('hidden');
        }
      } else if (detectedBadge) {
        detectedBadge.classList.add('hidden');
      }
    });
  }

  const amountInput = document.getElementById('reloadAmount');
  if (amountInput) amountInput.addEventListener('input', updateReloadCommissionPreview);

  renderPresetPills();

  // Reload Form Submit
  const form = document.getElementById('reloadEntryForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const amount = roundCurrency(amountInput ? amountInput.value : 0);
      const operator = APP_STATE.selectedOperator;
      const rate = APP_STATE.commissionRates[operator] || 0;
      const commissionAmount = roundCurrency((amount * rate) / 100);

      if (amount < 10) {
        showToast('Minimum reload amount is Rs. 10.00', 'error');
        return;
      }

      const payload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        createdBy: auth.currentUser.uid,
        operator,
        phone: phone || 'Walk-in Customer',
        amount,
        commissionRate: rate,
        commissionAmount,
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'reload_transactions'), payload);
        showToast(`Recorded ${operator} reload of ${formatLKR(amount)} (${formatSignedLKR(commissionAmount)} commission)`, 'success');
        form.reset();
        if (detectedBadge) detectedBadge.classList.add('hidden');
        selectOperator(operator);
        updateReloadCommissionPreview();
      } catch (err) {
        logDebug(`Error recording reload: ${err.message}`, 'ERROR');
        showToast(`Failed to log reload: ${err.message}`, 'error');
      }
    });
  }
}

function renderRecentReloadsFeed() {
  const feed = document.getElementById('reloadRecentFeed');
  if (!feed) return;
  feed.innerHTML = '';

  const recent = [...APP_STATE.todayReloadTransactions].slice(0, 5);

  if (recent.length === 0) {
    feed.innerHTML = `
      <div class="p-3 text-xs text-center theme-text-dim rounded-xl border theme-border">
        No mobile reloads recorded yet today.
      </div>
    `;
    return;
  }

  recent.forEach(item => {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl border theme-border theme-bg-subtle flex items-center justify-between text-xs';
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${item.operator === 'DIALOG' ? 'text-orange-400 border-orange-500/30' : item.operator === 'MOBITEL' ? 'text-blue-400 border-blue-500/30' : item.operator === 'AIRTEL' ? 'text-red-400 border-red-500/30' : 'text-amber-300 border-amber-500/30'}">${escapeHTML(item.operator)}</span>
        <div>
          <span class="font-bold font-mono theme-text-main">${escapeHTML(item.phone || 'Walk-in')}</span>
          <span class="text-[11px] theme-text-dim block">${escapeHTML(item.time || '')}</span>
        </div>
      </div>
        <div class="flex items-center gap-2">
          <div class="text-right">
            <span class="font-mono font-bold text-emerald-400 currency-lkr">${formatLKR(item.amount)}</span>
            <span class="text-[10px] theme-text-dim block font-mono">${formatSignedLKR(item.commissionAmount)} commission</span>
          </div>
          <button type="button" class="recent-delete-btn min-h-11 min-w-11 text-red-400 hover:text-red-300" aria-label="Delete transaction" title="Delete transaction">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
      </div>
    `;
      div.querySelector('.recent-delete-btn')?.addEventListener('click', async () => {
        if (!confirm(`Delete ${item.operator} reload for ${item.phone || 'Walk-in'}?`)) return;
        try {
          await removeTransaction('RELOAD', item);
          showToast('Transaction record deleted', 'success');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      });
    feed.appendChild(div);
  });
}

// =============================================================================
// 15. SETTINGS CATALOG EDITOR & SERVICE/BILL TOGGLE (Requirements 4.1 & 4.2)
// =============================================================================

function initSettingsCatalog() {
  const form = document.getElementById('catalogItemForm');
  const docIdInput = document.getElementById('catalogDocId');
  const codeInput = document.getElementById('catalogCode');
  const nameInput = document.getElementById('catalogName');
  const categoryInput = document.getElementById('catalogCategory');
  const costPriceInput = document.getElementById('catalogCostPrice');
  const sellingPriceInput = document.getElementById('catalogSellingPrice');
  const stockInput = document.getElementById('catalogStockQuantity');
  const thresholdInput = document.getElementById('catalogLowStockThreshold');
  const formTitle = document.getElementById('catalogFormTitle');
  const saveBtn = document.getElementById('catalogSaveBtn');
  const resetBtn = document.getElementById('catalogResetFormBtn');
  const searchInput = document.getElementById('catalogSearchInput');
  const sortSelect = document.getElementById('catalogSortSelect');
  const seedBtn = document.getElementById('seedCatalogBtn');

  const stockQtyContainer = document.getElementById('catalogStockQtyContainer');
  const thresholdContainer = document.getElementById('catalogThresholdContainer');
  const costPriceContainer = document.getElementById('catalogCostPriceContainer');
  const sellingPriceLabel = document.getElementById('catalogSellingPriceLabel');

  // Item Type Radio Listener (Requirement 4.2)
  const itemTypeRadios = form?.querySelectorAll('input[name="catalogItemType"]');
  function handleItemTypeChange() {
    const isService = form?.querySelector('input[name="catalogItemType"]:checked')?.value === 'service';
    if (isService) {
      if (stockQtyContainer) stockQtyContainer.classList.add('hidden');
      if (thresholdContainer) thresholdContainer.classList.add('hidden');
      if (costPriceContainer) costPriceContainer.classList.remove('hidden');
      if (sellingPriceLabel) sellingPriceLabel.textContent = 'Default Base Fee / Amount [Rs.]';
      if (costPriceInput) costPriceInput.required = true;
      if (stockInput) {
        stockInput.required = false;
        stockInput.value = '0';
      }
      if (thresholdInput) {
        thresholdInput.required = false;
        thresholdInput.value = '0';
      }
    } else {
      if (stockQtyContainer) stockQtyContainer.classList.remove('hidden');
      if (thresholdContainer) thresholdContainer.classList.remove('hidden');
      if (costPriceContainer) costPriceContainer.classList.remove('hidden');
      if (sellingPriceLabel) sellingPriceLabel.textContent = 'Selling Price [Rs.] *';
      if (costPriceInput) costPriceInput.required = true;
      if (stockInput) {
        stockInput.required = true;
        if (!stockInput.value || stockInput.value === '0') stockInput.value = '50';
      }
      if (thresholdInput) {
        thresholdInput.required = true;
        if (!thresholdInput.value || thresholdInput.value === '0') thresholdInput.value = '5';
      }
    }
  }

  if (itemTypeRadios) {
    itemTypeRadios.forEach(radio => radio.addEventListener('change', handleItemTypeChange));
  }

  // Automatic Title Case on input blur (Requirement 4.1)
  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      nameInput.value = toTitleCase(nameInput.value);
    });
  }

  function resetCatalogForm() {
    form.reset();
    docIdInput.value = '';
    const productRadio = form.querySelector('input[name="catalogItemType"][value="product"]');
    if (productRadio) productRadio.checked = true;
    handleItemTypeChange();
    if (formTitle) formTitle.textContent = 'Add New Catalog Item / Service';
    if (saveBtn) saveBtn.textContent = 'Save Item to Catalog';
    if (resetBtn) resetBtn.classList.add('hidden');
  }

  if (resetBtn) resetBtn.addEventListener('click', resetCatalogForm);

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (APP_STATE.currentRole !== 'admin') {
        showToast('Only an admin can edit the master catalog.', 'error');
        return;
      }
      const code = codeInput.value.trim().toUpperCase();
      const rawName = nameInput.value.trim();
      const name = toTitleCase(rawName); // Auto Title Case
      const category = categoryInput ? categoryInput.value.trim() || 'General' : 'General';
      const isService = form.querySelector('input[name="catalogItemType"]:checked')?.value === 'service';
      const itemType = isService ? 'service' : 'product';

      const costPrice = roundCurrency(costPriceInput.value);
      const sellingPrice = roundCurrency(sellingPriceInput.value);
      const stockQuantity = isService ? 0 : Math.max(0, parseInt(stockInput.value, 10) || 0);
      const lowStockThreshold = isService ? 0 : Math.max(0, parseInt(thresholdInput.value, 10) || 5);
      const editDocId = docIdInput.value;

      if (!code || !name) {
        showToast('Please provide both item code and name', 'error');
        return;
      }

      // Check duplicate code
      const duplicate = APP_STATE.inventoryCatalog.find(i => i.code === code && i.id !== editDocId);
      if (duplicate) {
        showToast(`Item Code "${code}" is already in use by "${duplicate.name}"`, 'error');
        return;
      }

      try {
        const itemPayload = {
          code,
          name,
          category,
          itemType,
          costPrice,
          sellingPrice,
          stockQuantity,
          lowStockThreshold,
          updatedAt: serverTimestamp()
        };

        if (editDocId) {
          await updateDoc(doc(db, 'inventory', editDocId), itemPayload);
          showToast(`Updated: ${name}`, 'success');
        } else {
          itemPayload.createdAt = serverTimestamp();
          await addDoc(collection(db, 'inventory'), itemPayload);
          showToast(`Added: ${name} (${isService ? 'Service/Bill' : 'Product'})`, 'success');
        }
        resetCatalogForm();
      } catch (err) {
        showToast(`Failed to save item: ${err.message}`, 'error');
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderCatalogTable);

  if (sortSelect) {
    sortSelect.value = APP_STATE.catalogSortOrder;
    sortSelect.addEventListener('change', () => {
      APP_STATE.catalogSortOrder = sortSelect.value;
      localStorage.setItem('al_catalog_sort_order', APP_STATE.catalogSortOrder);
      renderCatalogTable();
    });
  }

  // Seed Button
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      if (APP_STATE.currentRole !== 'admin') {
        showToast('Only an admin can add catalog items.', 'error');
        return;
      }
      if (!confirm('Seed standard Sri Lankan retail stationery and utility bills into your catalog? Existing codes will not be overwritten.')) return;

      let addedCount = 0;
      for (const item of SAMPLE_SRI_LANKAN_CATALOG) {
        const exists = APP_STATE.inventoryCatalog.some(i => i.code === item.code);
        if (!exists) {
          try {
            await addDoc(collection(db, 'inventory'), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            addedCount++;
          } catch (e) {
            console.error('Seed item error', e);
          }
        }
      }

      if (addedCount > 0) {
        showToast(`Seeded ${addedCount} standard catalog products & utility bills`, 'success');
      } else {
        showToast('Standard items are already present in catalog', 'info');
      }
    });
  }
}

export function renderCatalogTable() {
  const tbody = document.getElementById('catalogTableBody');
  const searchInput = document.getElementById('catalogSearchInput');
  const queryStr = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!tbody) return;
  tbody.innerHTML = '';

  let filtered = APP_STATE.inventoryCatalog.filter(item => {
    if (!queryStr) return true;
    return (item.code || '').toLowerCase().includes(queryStr) ||
           (item.name || '').toLowerCase().includes(queryStr) ||
           (item.category || '').toLowerCase().includes(queryStr);
  });

  // Natural Numerical Sorting (Requirement 4.3)
  filtered = sortCatalogList(filtered, APP_STATE.catalogSortOrder);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-8 text-center theme-text-dim text-xs">
          No catalog records found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    const isService = item.itemType === 'service';
    const typeBadge = isService
      ? `<span class="badge-service-bill px-2 py-0.5 rounded text-[10px] font-bold">Service/Bill</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">Product</span>`;

    const costDisplay = `<span class="font-mono font-bold text-amber-400">${formatLKR(item.costPrice)}</span>`;
    const profitDisplay = `<span class="font-mono font-bold text-sky-400">${formatSignedLKR(item.sellingPrice - item.costPrice)}</span>`;
    const stockDisplay = isService ? `<span class="badge-service-bill px-2 py-0.5 rounded text-[11px] font-bold">No Qty</span>` : `<span class="font-mono font-bold ${item.stockQuantity <= 5 ? 'text-red-400' : 'theme-text-main'}">${escapeHTML(item.stockQuantity)}</span>`;
    const actions = APP_STATE.currentRole === 'admin'
      ? `<div class="flex items-center justify-center gap-1.5">
          <button type="button" class="edit-cat-btn min-h-11 px-2 py-1 rounded bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-white text-[11px] font-bold transition">Edit</button>
          <button type="button" class="del-cat-btn min-h-11 px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold transition">Delete</button>
        </div>`
      : '<span class="text-xs theme-text-dim">Read only</span>';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-xs theme-text-main">${escapeHTML(item.code)}</td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-xs theme-text-main">${escapeHTML(toTitleCase(item.name))}</div>
        <div class="text-[10px] theme-text-dim">${escapeHTML(item.category || 'General')}</div>
      </td>
      <td class="py-2.5 px-3">${typeBadge}</td>
      <td class="py-2.5 px-3 text-right text-xs">${costDisplay}</td>
      <td class="py-2.5 px-3 text-right text-xs font-mono font-bold text-emerald-400">${formatLKR(item.sellingPrice)}</td>
      <td class="py-2.5 px-3 text-right text-xs">${profitDisplay}</td>
      <td class="py-2.5 px-3 text-center text-xs">${stockDisplay}</td>
      <td class="py-2.5 px-3 text-center">
        ${actions}
      </td>
    `;

    // Edit Item
    const editBtn = tr.querySelector('.edit-cat-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (APP_STATE.currentRole !== 'admin') return;
        document.getElementById('catalogDocId').value = item.id;
        document.getElementById('catalogCode').value = item.code;
        document.getElementById('catalogName').value = toTitleCase(item.name);
        document.getElementById('catalogCategory').value = item.category || '';
        document.getElementById('catalogCostPrice').value = item.costPrice || 0;
        document.getElementById('catalogSellingPrice').value = item.sellingPrice || 0;
        document.getElementById('catalogStockQuantity').value = item.stockQuantity || 0;
        document.getElementById('catalogLowStockThreshold').value = item.lowStockThreshold || 5;

        const isServ = item.itemType === 'service';
        const typeRadio = document.querySelector(`input[name="catalogItemType"][value="${isServ ? 'service' : 'product'}"]`);
        if (typeRadio) {
          typeRadio.checked = true;
          typeRadio.dispatchEvent(new Event('change'));
        }

        document.getElementById('catalogFormTitle').textContent = `Edit Catalog Item: ${item.code}`;
        document.getElementById('catalogSaveBtn').textContent = 'Update Item';
        document.getElementById('catalogResetFormBtn').classList.remove('hidden');
        document.getElementById('catalogCode').focus();
      });
    }

    // Delete Item
    const delBtn = tr.querySelector('.del-cat-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (APP_STATE.currentRole !== 'admin') {
          showToast('Only an admin can delete catalog items.', 'error');
          return;
        }
        if (!confirm(`Delete "${item.name}" (${item.code}) from master inventory catalog?`)) return;
        try {
          await deleteDoc(doc(db, 'inventory', item.id));
          showToast(`Deleted ${item.name}`, 'success');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 16. SETTINGS BACKUP & RESTORE SYSTEM (Requirement 6.1)
// =============================================================================

function updateBackupStatusDisplay() {
  const statCatalog = document.getElementById('backupStatCatalogCount');
  const statPresets = document.getElementById('backupStatPresetCount');
  const statLastSaved = document.getElementById('backupStatLastSaved');
  const badge = document.getElementById('backupStatusBadge');

  if (statCatalog) statCatalog.textContent = `${APP_STATE.inventoryCatalog.length} Items`;
  if (statPresets) statPresets.textContent = `${APP_STATE.reloadPresets.length} Presets`;

  const savedRaw = localStorage.getItem(backupSnapshotKey());
  if (savedRaw) {
    try {
      const snap = JSON.parse(savedRaw);
      if (statLastSaved) statLastSaved.textContent = snap.formattedDate || snap.timestamp?.substring(0, 16) || 'Saved';
      if (badge) {
        badge.textContent = `Snapshot Ready (${snap.catalog?.length || 0} items)`;
        badge.className = 'text-xs px-2.5 py-1 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
    } catch (e) {
      if (statLastSaved) statLastSaved.textContent = 'Invalid snapshot';
    }
  } else {
    if (statLastSaved) statLastSaved.textContent = 'None saved yet';
    if (badge) {
      badge.textContent = 'No Snapshot Stored';
      badge.className = 'text-xs px-2.5 py-1 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  }
}

function backupSnapshotKey() {
  return `al_settings_backup_snapshot_${auth.currentUser?.uid || 'signed-out'}`;
}

function createConfigurationSnapshot() {
  return {
    version: '5.1',
    appName: 'AL Communication',
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString(),
    catalog: APP_STATE.inventoryCatalog.map(item => ({
      code: item.code,
      name: toTitleCase(item.name),
      category: item.category || 'General',
      itemType: item.itemType || 'product',
      costPrice: Number(item.costPrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      stockQuantity: Number(item.stockQuantity) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 5
    })),
    commissionRates: { ...APP_STATE.commissionRates },
    reloadPresets: [...APP_STATE.reloadPresets],
    activeTheme: APP_STATE.activeTheme,
    preferences: {
      activeTheme: APP_STATE.activeTheme,
      gradientBlurEnabled: APP_STATE.gradientBlurEnabled,
      dashboardOrder: APP_STATE.dashboardOrder,
      stockSortOrder: APP_STATE.stockSortOrder,
      catalogSortOrder: APP_STATE.catalogSortOrder
    }
  };
}

export async function applyConfigurationBackup(snapshot) {
  if (!APP_STATE.currentUser) {
    showToast('Sign in before restoring a backup.', 'error');
    return false;
  }
  if (!snapshot || typeof snapshot !== 'object') {
    showToast('Invalid backup file or snapshot structure', 'error');
    return false;
  }

  let preferencesSynced = true;
  try {
    // 1. Restore Commission Rates
    if (snapshot.commissionRates && APP_STATE.currentRole === 'admin') {
      APP_STATE.commissionRates = { ...snapshot.commissionRates };
      await setDoc(doc(db, 'settings', 'rates'), APP_STATE.commissionRates, { merge: true });
    }

    // 2. Restore Reload Presets
    if (Array.isArray(snapshot.reloadPresets) && APP_STATE.currentRole === 'admin') {
      APP_STATE.reloadPresets = [...snapshot.reloadPresets];
      await setDoc(doc(db, 'settings', 'presets'), { list: APP_STATE.reloadPresets }, { merge: true });
      renderPresetPills();
    }

    // 3. Restore Theme
    if (snapshot.activeTheme) {
      applyTheme(snapshot.activeTheme);
    }
    if (snapshot.preferences) {
      const preferences = snapshot.preferences;
      if (preferences.activeTheme) applyTheme(preferences.activeTheme);
      if (typeof preferences.gradientBlurEnabled === 'boolean') {
        setGradientBlurEnabled(preferences.gradientBlurEnabled);
      }
      if (preferences.dashboardOrder?.metrics && preferences.dashboardOrder?.actions) {
        APP_STATE.dashboardOrder = preferences.dashboardOrder;
        applyDashboardOrder(document.getElementById('dashboardGrid'), preferences.dashboardOrder.metrics);
        applyDashboardOrder(document.getElementById('dashboardActionsGrid'), preferences.dashboardOrder.actions);
      }
      if (['name-asc', 'name-desc', 'selling-desc', 'selling-asc', 'cost-desc', 'cost-asc', 'stock-desc', 'stock-asc', 'newest', 'oldest'].includes(preferences.stockSortOrder)) {
        APP_STATE.stockSortOrder = preferences.stockSortOrder;
        localStorage.setItem('al_stock_sort_order', preferences.stockSortOrder);
        const stockSortSelect = document.getElementById('stockSortSelect');
        if (stockSortSelect) stockSortSelect.value = preferences.stockSortOrder;
      }
      if (['name-asc', 'name-desc', 'selling-desc', 'selling-asc', 'cost-desc', 'cost-asc', 'stock-desc', 'stock-asc', 'newest', 'oldest'].includes(preferences.catalogSortOrder)) {
        APP_STATE.catalogSortOrder = preferences.catalogSortOrder;
        localStorage.setItem('al_catalog_sort_order', preferences.catalogSortOrder);
        const catalogSortSelect = document.getElementById('catalogSortSelect');
        if (catalogSortSelect) catalogSortSelect.value = preferences.catalogSortOrder;
      }
      preferencesSynced = await saveUserPreferences({
        activeTheme: APP_STATE.activeTheme,
        gradientBlurEnabled: APP_STATE.gradientBlurEnabled,
        dashboardOrder: APP_STATE.dashboardOrder
      });
    }

    // 4. Restore / Sync Catalog Items in Firestore
    if (Array.isArray(snapshot.catalog) && APP_STATE.currentRole === 'admin') {
      let restoredCount = 0;
      for (const item of snapshot.catalog) {
        if (!item.code || !item.name) continue;
        const existing = APP_STATE.inventoryCatalog.find(i => i.code === item.code);
        const itemData = {
          code: item.code,
          name: toTitleCase(item.name),
          category: item.category || 'General',
          itemType: item.itemType || 'product',
          costPrice: Number(item.costPrice) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
          stockQuantity: item.itemType === 'service' ? 0 : (Number(item.stockQuantity) || 0),
          lowStockThreshold: item.itemType === 'service' ? 0 : (Number(item.lowStockThreshold) || 5),
          updatedAt: serverTimestamp()
        };

        if (existing && existing.id) {
          await updateDoc(doc(db, 'inventory', existing.id), itemData);
        } else {
          itemData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'inventory'), itemData);
        }
        restoredCount++;
      }
    }

    updateBackupStatusDisplay();
    renderCatalogTable();
    renderStockTable();
    updateDashboardMetrics();
    if (!preferencesSynced) {
      showToast('Backup applied locally, but personal preferences could not sync to Firestore.', 'error');
      return false;
    }
    showToast(APP_STATE.currentRole === 'admin'
      ? 'Backup settings restored successfully.'
      : 'Personal preferences restored. Shared catalog, presets, and rates require an admin.', 'success');
    return true;
  } catch (err) {
    logDebug(`Restore error: ${err.message}`, 'ERROR');
    showToast(`Restore failed: ${err.message}`, 'error');
    return false;
  }
}

function initBackupRestoreSystem() {
  const saveSnapshotBtn = document.getElementById('backupSaveSnapshotBtn');
  const downloadJsonBtn = document.getElementById('backupDownloadJsonBtn');
  const restoreSnapshotBtn = document.getElementById('backupRestoreSnapshotBtn');
  const uploadInput = document.getElementById('backupUploadInput');
  const restoreDefaultsBtn = document.getElementById('restoreDefaultsBtn');

  restoreDefaultsBtn?.addEventListener('click', async () => {
    const globalSettingsIncluded = APP_STATE.currentRole === 'admin';
    const confirmation = globalSettingsIncluded
      ? 'Restore the default theme, header blur, dashboard layout, sort order, reload presets, and commission rates?'
      : 'Restore your default theme, header blur, dashboard layout, and sort order?';
    if (!confirm(confirmation)) return;
    try {
      applyTheme('modern-slate');
      setGradientBlurEnabled(true);
      APP_STATE.stockSortOrder = 'name-asc';
      APP_STATE.catalogSortOrder = 'name-asc';
      localStorage.setItem('al_stock_sort_order', 'name-asc');
      localStorage.setItem('al_catalog_sort_order', 'name-asc');
      const stockSortSelect = document.getElementById('stockSortSelect');
      const catalogSortSelect = document.getElementById('catalogSortSelect');
      if (stockSortSelect) stockSortSelect.value = 'name-asc';
      if (catalogSortSelect) catalogSortSelect.value = 'name-asc';
      resetDashboardLayout();
      if (globalSettingsIncluded) {
        const defaultRates = { AIRTEL: 6.80, DIALOG: 3.80, MOBITEL: 6.80, HUTCH: 5.00 };
        const defaultPresets = [50, 100, 200, 500, 1000];
        APP_STATE.commissionRates = defaultRates;
        APP_STATE.reloadPresets = defaultPresets;
        await Promise.all([
          setDoc(doc(db, 'settings', 'rates'), defaultRates, { merge: true }),
          setDoc(doc(db, 'settings', 'presets'), { list: defaultPresets }, { merge: true })
        ]);
        renderPresetPills();
      }
      const preferencesSynced = await saveUserPreferences({
        activeTheme: 'modern-slate',
        gradientBlurEnabled: true,
        dashboardOrder: APP_STATE.dashboardOrder
      });
      if (!preferencesSynced) {
        showToast('Defaults applied locally, but preferences could not sync to Firestore.', 'error');
        return;
      }
      renderStockTable();
      renderCatalogTable();
      showToast('Default settings restored.', 'success');
    } catch (error) {
      showToast(`Could not restore defaults: ${error.message}`, 'error');
    }
  });

  // Save Snapshot to localStorage
  if (saveSnapshotBtn) {
    saveSnapshotBtn.addEventListener('click', () => {
      const snap = createConfigurationSnapshot();
      localStorage.setItem(backupSnapshotKey(), JSON.stringify(snap));
      updateBackupStatusDisplay();
      showToast(`Snapshot saved to local storage (${snap.catalog.length} items)`, 'success');
    });
  }

  // Download .JSON Backup File
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
      const snap = createConfigurationSnapshot();
      const jsonStr = JSON.stringify(snap, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AL_Communication_Backup_${getTodayDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded .JSON backup file', 'success');
    });
  }

  // Restore from localStorage Snapshot
  if (restoreSnapshotBtn) {
    restoreSnapshotBtn.addEventListener('click', async () => {
      const savedRaw = localStorage.getItem(backupSnapshotKey());
      if (!savedRaw) {
        showToast('No saved snapshot found in local storage. Save one first or upload a JSON backup file.', 'error');
        return;
      }

      try {
        const snap = JSON.parse(savedRaw);
        const confirmMsg = `Restore configuration snapshot saved on ${snap.formattedDate || 'earlier'}?\nThis will restore ${snap.catalog?.length || 0} catalog items, network commissions, and reload presets.`;
        if (!confirm(confirmMsg)) return;

        await applyConfigurationBackup(snap);
      } catch (e) {
        showToast(`Failed to parse stored snapshot: ${e.message}`, 'error');
      }
    });
  }

  // Upload and Restore from JSON file
  if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const snap = JSON.parse(evt.target.result);
          if (!snap.catalog && !snap.commissionRates && !snap.preferences && !snap.reloadPresets) {
            throw new Error('Unrecognized backup format. No supported settings were found.');
          }

          if (confirm(`Restore configuration from "${file.name}" (${snap.catalog?.length || 0} catalog items)?`)) {
            await applyConfigurationBackup(snap);
          }
        } catch (err) {
          showToast(`Invalid backup file: ${err.message}`, 'error');
        } finally {
          uploadInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }
}

// =============================================================================
// 17. SETTINGS PRESETS, COMMISSIONS & SECURITY FORMS
// =============================================================================

function initSettingsPanels() {
  // Preset Amounts Manager
  const addPresetForm = document.getElementById('addPresetForm');
  const resetPresetsBtn = document.getElementById('resetPresetsDefaultBtn');

  function renderSettingsPresetsTags() {
    const list = document.getElementById('settingsPresetsList');
    if (!list) return;
    list.innerHTML = '';

    APP_STATE.reloadPresets.sort((a, b) => a - b).forEach(val => {
      const span = document.createElement('span');
      span.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border theme-border theme-bg-surface text-xs font-bold font-mono';
      span.innerHTML = `
        <span>Rs. ${escapeHTML(val)}</span>
        <button type="button" class="del-preset-btn min-h-11 min-w-11 text-red-400 hover:text-red-300 ml-1 text-sm font-bold" aria-label="Remove preset Rs. ${escapeHTML(val)}">&times;</button>
      `;
      span.querySelector('.del-preset-btn')?.addEventListener('click', async () => {
        if (APP_STATE.currentRole !== 'admin') {
          showToast('Only an admin can change reload presets.', 'error');
          return;
        }
        APP_STATE.reloadPresets = APP_STATE.reloadPresets.filter(p => p !== val);
        await setDoc(doc(db, 'settings', 'presets'), { list: APP_STATE.reloadPresets }, { merge: true });
        renderSettingsPresetsTags();
        renderPresetPills();
        showToast(`Removed preset Rs. ${val}`, 'info');
      });
      list.appendChild(span);
    });
  }

  renderSettingsPresetsTags();

  if (addPresetForm) {
    addPresetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (APP_STATE.currentRole !== 'admin') {
        showToast('Only an admin can change reload presets.', 'error');
        return;
      }
      const input = document.getElementById('newPresetAmountInput');
      const val = parseInt(input?.value, 10);
      if (!val || val < 10) return;

      if (!APP_STATE.reloadPresets.includes(val)) {
        APP_STATE.reloadPresets.push(val);
        await setDoc(doc(db, 'settings', 'presets'), { list: APP_STATE.reloadPresets }, { merge: true });
        renderSettingsPresetsTags();
        renderPresetPills();
        showToast(`Added preset Rs. ${val}`, 'success');
      }
      input.value = '';
    });
  }

  if (resetPresetsBtn) {
    resetPresetsBtn.addEventListener('click', async () => {
      if (APP_STATE.currentRole !== 'admin') return;
      APP_STATE.reloadPresets = [50, 100, 200, 500, 1000];
      await setDoc(doc(db, 'settings', 'presets'), { list: APP_STATE.reloadPresets }, { merge: true });
      renderSettingsPresetsTags();
      renderPresetPills();
      showToast('Reset presets to default', 'info');
    });
  }

  // Commission Rates Form
  const commForm = document.getElementById('commissionsForm');
  if (commForm) {
    commForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (APP_STATE.currentRole !== 'admin') {
        showToast('Only an admin can change commission rates.', 'error');
        return;
      }
      const airtel = parseFloat(document.getElementById('rateAirtelInput')?.value) || 6.80;
      const dialog = parseFloat(document.getElementById('rateDialogInput')?.value) || 3.80;
      const mobitel = parseFloat(document.getElementById('rateMobitelInput')?.value) || 6.80;
      const hutch = parseFloat(document.getElementById('rateHutchInput')?.value) || 5.00;

      APP_STATE.commissionRates = { AIRTEL: airtel, DIALOG: dialog, MOBITEL: mobitel, HUTCH: hutch };

      try {
        await setDoc(doc(db, 'settings', 'rates'), APP_STATE.commissionRates, { merge: true });
        // Update badges in reload view
        const bAirtel = document.getElementById('rateBadgeAirtel');
        const bDialog = document.getElementById('rateBadgeDialog');
        const bMobitel = document.getElementById('rateBadgeMobitel');
        const bHutch = document.getElementById('rateBadgeHutch');
        if (bAirtel) bAirtel.textContent = `${airtel.toFixed(2)}%`;
        if (bDialog) bDialog.textContent = `${dialog.toFixed(2)}%`;
        if (bMobitel) bMobitel.textContent = `${mobitel.toFixed(2)}%`;
        if (bHutch) bHutch.textContent = `${hutch.toFixed(2)}%`;
        showToast('Commission rates saved', 'success');
      } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
      }
    });
  }

  // Account Security Form (Email & Password Updates)
  const updateEmailForm = document.getElementById('updateEmailForm');
  if (updateEmailForm) {
    updateEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('newEmailInput')?.value.trim();
      if (!newEmail || !auth.currentUser) {
        showToast('Sign in before updating account details.', 'error');
        return;
      }
      try {
        await updateEmail(auth.currentUser, newEmail);
        let profileSynced = true;
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            email: newEmail,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (syncError) {
          profileSynced = false;
          logDebug(`Updated email profile sync failed: ${syncError.message}`, 'ERROR');
        }
        showToast(profileSynced
          ? `Email updated to ${newEmail}`
          : 'Email changed, but the account profile could not be synced.', profileSynced ? 'success' : 'error');
        const badge = document.getElementById('userEmailBadge');
        if (badge) badge.textContent = newEmail;
        APP_STATE.currentUser = auth.currentUser;
        updateProfileDisplay(auth.currentUser);
        updateEmailForm.reset();
      } catch (err) {
        showToast(`Email update failed: ${err.message}`, 'error');
      }
    });
  }

  const updatePasswordForm = document.getElementById('updatePasswordForm');
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('newPasswordInput')?.value;
      const confirmPass = document.getElementById('confirmPasswordInput')?.value;
      if (!auth.currentUser) {
        showToast('Sign in before updating your password.', 'error');
        return;
      }
      if (!pass || pass.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
      }
      if (pass !== confirmPass) {
        showToast('Passwords do not match', 'error');
        return;
      }
      try {
        await updatePassword(auth.currentUser, pass);
        showToast('Master password updated successfully', 'success');
        updatePasswordForm.reset();
      } catch (err) {
        showToast(`Password update failed: ${err.message}`, 'error');
      }
    });
  }

  // Sign Out
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        showToast('Signed out of session', 'info');
      } catch (err) {
        showToast(`Sign out notice: ${err.message}`, 'error');
      }
    });
  }

  // Diagnostics Drawer
  const devToggle = document.getElementById('devConsoleToggle');
  const devBody = document.getElementById('devConsoleBody');
  if (devToggle && devBody) {
    devToggle.addEventListener('click', () => devBody.classList.toggle('hidden'));
  }

  const dbgTestWrite = document.getElementById('dbgTestWriteBtn');
  if (dbgTestWrite) {
    dbgTestWrite.addEventListener('click', async () => {
      try {
        await addDoc(collection(db, 'diagnostics'), {
          test: 'AL Communication v5.0 Cloud Write',
          timestamp: serverTimestamp()
        });
        showToast('Cloud Firestore write test passed!', 'success');
      } catch (e) {
        showToast(`Cloud write test failed: ${e.message}`, 'error');
      }
    });
  }

  const dbgClearLogs = document.getElementById('dbgClearLogsBtn');
  if (dbgClearLogs) {
    dbgClearLogs.addEventListener('click', () => {
      APP_STATE.devLogs = [];
      const terminal = document.getElementById('dbgTerminalLogs');
      if (terminal) terminal.innerHTML = '<div class="text-emerald-400">[System] Terminal cleared.</div>';
    });
  }
}

function updateProfileDisplay(user = APP_STATE.currentUser) {
  const email = document.getElementById('profileAccountEmail');
  const roleBadge = document.getElementById('profileAccountRole');
  const createAccountPanel = document.getElementById('createStaffAccountPanel');
  const usersPanel = document.getElementById('adminUsersPanel');
  const lastLogin = document.getElementById('profileLastLogin');
  const isAdmin = APP_STATE.currentRole === 'admin';
  if (email) email.textContent = user?.email || '';
  if (roleBadge) {
    roleBadge.textContent = isAdmin ? 'Admin' : 'Staff / User';
    roleBadge.className = `inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-bold border ${
      isAdmin
        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        : 'text-sky-400 border-sky-500/30 bg-sky-500/10'
    }`;
  }
  if (createAccountPanel) createAccountPanel.classList.toggle('hidden', !isAdmin);
  if (usersPanel) usersPanel.classList.toggle('hidden', !isAdmin);
  const loginTime = APP_STATE.userProfiles.find(profile => profile.id === user?.uid)?.lastLogin;
  if (lastLogin) lastLogin.textContent = loginTime?.toDate ? loginTime.toDate().toLocaleString() : 'Current session';
  renderAdminUsers();
}

function renderAdminUsers() {
  const list = document.getElementById('adminUsersList');
  if (!list || APP_STATE.currentRole !== 'admin') return;
  list.replaceChildren();
  if (!APP_STATE.userProfiles.length) {
    const empty = document.createElement('p');
    empty.className = 'text-xs theme-text-dim';
    empty.textContent = 'No account profiles have synced yet.';
    list.appendChild(empty);
    return;
  }

  APP_STATE.userProfiles
    .slice()
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')))
    .forEach(profile => {
      const row = document.createElement('div');
      row.className = 'flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border theme-border theme-bg-surface';
      const identity = document.createElement('div');
      identity.className = 'min-w-0';
      const userEmail = document.createElement('div');
      userEmail.className = 'break-all text-sm font-semibold theme-text-main';
      userEmail.textContent = profile.email || 'Email unavailable';
      const role = document.createElement('div');
      role.className = 'mt-1 text-xs theme-text-dim';
      role.textContent = profile.role === 'admin' ? 'Admin' : 'Staff / User';
      identity.append(userEmail, role);
      row.appendChild(identity);

      if (profile.id !== auth.currentUser?.uid && profile.email?.toLowerCase() !== ADMIN_EMAIL) {
        const roleButton = document.createElement('button');
        roleButton.type = 'button';
        roleButton.className = 'min-h-11 px-3 py-2 rounded-lg text-xs font-bold border theme-border hover:theme-bg-elevated';
        roleButton.textContent = profile.role === 'admin' ? 'Demote to User' : 'Promote to Admin';
        roleButton.addEventListener('click', async () => {
          if (!auth.currentUser || APP_STATE.currentRole !== 'admin') return;
          const nextRole = profile.role === 'admin' ? 'user' : 'admin';
          if (!confirm(`Set ${profile.email} role to ${nextRole === 'admin' ? 'Admin' : 'Staff / User'}?`)) return;
          try {
            await updateDoc(doc(db, 'users', profile.id), {
              role: nextRole,
              updatedAt: serverTimestamp()
            });
            showToast(`Updated role for ${profile.email}`, 'success');
          } catch (error) {
            showToast(`Role update failed: ${error.message}`, 'error');
          }
        });
        row.appendChild(roleButton);
      }
      list.appendChild(row);
    });
}

function applyRolePermissions() {
  const isAdmin = APP_STATE.currentRole === 'admin';
  document.getElementById('catalogItemForm')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('seedCatalogBtn')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('commissionsForm')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('addPresetForm')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('resetPresetsDefaultBtn')?.classList.toggle('hidden', !isAdmin);
  document.querySelectorAll('.del-preset-btn').forEach(button => button.classList.toggle('hidden', !isAdmin));
  renderCatalogTable();
  renderAdminUsers();
}

function initProfileControls() {
  const openButton = document.getElementById('openProfileBtn');
  const backButton = document.getElementById('profileBackBtn');
  const resetButton = document.getElementById('profileResetPasswordBtn');
  const securityButton = document.getElementById('profileSecurityBtn');
  const layoutButton = document.getElementById('profileResetLayoutBtn');
  const blurButton = document.getElementById('profileBlurToggleBtn');
  const themeButton = document.getElementById('profileThemeToggleBtn');
  const signOutButton = document.getElementById('profileSignOutBtn');
  const createAccountForm = document.getElementById('createStaffAccountForm');

  openButton?.addEventListener('click', () => {
    if (!auth.currentUser || !APP_STATE.currentUser) {
      showToast('Sign in to view account details.', 'error');
      return;
    }
    updateProfileDisplay();
    switchView('profile');
  });
  backButton?.addEventListener('click', () => {
    switchView(APP_STATE.previousView || 'dashboard');
  });

  resetButton?.addEventListener('click', async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      showToast('Sign in before requesting a password reset.', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Password reset link sent to ${email}`, 'success');
    } catch (error) {
      showToast(`Password reset failed: ${error.message}`, 'error');
    }
  });

  securityButton?.addEventListener('click', () => {
    openSettingsModal();
    switchSettingsTab('security');
  });
  layoutButton?.addEventListener('click', resetDashboardLayout);
  blurButton?.addEventListener('click', () => setGradientBlurEnabled(!APP_STATE.gradientBlurEnabled, true));
  themeButton?.addEventListener('click', () => {
    const nextTheme = APP_STATE.activeTheme === 'emerald-store' ? 'modern-slate' : 'emerald-store';
    applyTheme(nextTheme);
    saveUserPreferences({ activeTheme: nextTheme });
  });

  signOutButton?.addEventListener('click', async () => {
    try {
      await signOut(auth);
      clearSignedInState();
      showToast('Signed out of session', 'info');
    } catch (error) {
      showToast(`Sign out failed: ${error.message}`, 'error');
    }
  });

  createAccountForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!auth.currentUser || APP_STATE.currentRole !== 'admin') {
      showToast('Only an authenticated admin can create staff accounts.', 'error');
      return;
    }
    const email = document.getElementById('staffAccountEmail')?.value.trim();
    const password = document.getElementById('staffAccountPassword')?.value;
    const confirmPassword = document.getElementById('staffAccountPasswordConfirm')?.value;
    if (!email || !password || password.length < 8 || password !== confirmPassword) {
      showToast(password !== confirmPassword ? 'Passwords do not match.' : 'Enter an email and a password of at least 8 characters.', 'error');
      return;
    }
    if (!email.includes('@')) {
      showToast('Enter an email and a password of at least 8 characters.', 'error');
      return;
    }

    let createdUser = null;
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      createdUser = credential.user;
      await setDoc(doc(db, 'users', createdUser.uid), {
        email,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      createAccountForm.reset();
      showToast(`Standard user account created for ${email}`, 'success');
    } catch (error) {
      showToast(`Account creation failed: ${error.message}`, 'error');
    } finally {
      if (createdUser) {
        try {
          await signOut(secondaryAuth);
        } catch (error) {
          logDebug(`Secondary account sign-out failed: ${error.message}`, 'WARN');
        }
      }
    }
  });
}

// =============================================================================
// 18. AUTHENTICATION & SESSION PERSISTENCE (Requirement 7)
// =============================================================================

let loginFailureCount = 0;
let loginLockedUntil = 0;

function friendlyAuthError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already uses this email address.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/user-disabled': 'This account has been disabled. Contact the administrator.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a little before trying again.'
  };
  return messages[error?.code] || error?.message || 'Authentication could not be completed.';
}

const profileInitializationPromises = new Map();

function initializeUserProfile(user) {
  if (!auth.currentUser || auth.currentUser.uid !== user.uid) return Promise.resolve();
  if (profileInitializationPromises.has(user.uid)) return profileInitializationPromises.get(user.uid);

  const initialization = (async () => {
    const userRef = doc(db, 'users', user.uid);
    const profileSnapshot = await getDoc(userRef);
    const isOwner = user.email?.toLowerCase() === ADMIN_EMAIL;
    const profileData = profileSnapshot.data();

    if (isOwner) {
      await setDoc(userRef, {
        email: user.email || '',
        role: 'admin',
        ...(profileSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
        lastLogin: serverTimestamp()
      }, { merge: true });
    } else if (profileSnapshot.exists()) {
      await setDoc(userRef, {
        email: user.email || '',
        lastLogin: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        email: user.email || '',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }
    if (profileData?.role && profileData.role !== APP_STATE.currentRole && !isOwner) {
      APP_STATE.currentRole = profileData.role;
      applyRolePermissions();
    }
  })();
  profileInitializationPromises.set(user.uid, initialization);
  return initialization.finally(() => profileInitializationPromises.delete(user.uid));
}

function initAuthentication() {
  const gateScreen = document.getElementById('authGateScreen');
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const passInput = document.getElementById('loginPassword');
  const forgotPassBtn = document.getElementById('forgotPasswordBtn');
  const resetModal = document.getElementById('passwordResetModal');
  const closeResetBtn = document.getElementById('closeResetModalBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const resetForm = document.getElementById('passwordResetForm');
  const signupModal = document.getElementById('signupModal');
  const signupForm = document.getElementById('signupForm');
  const signupAlert = document.getElementById('signupAlert');
  const showSignupBtn = document.getElementById('showSignupBtn');
  const closeSignupBtn = document.getElementById('closeSignupBtn');

  showSignupBtn?.addEventListener('click', () => {
    signupAlert?.classList.add('hidden');
    signupModal?.classList.remove('hidden');
  });
  closeSignupBtn?.addEventListener('click', () => signupModal?.classList.add('hidden'));
  signupModal?.addEventListener('click', event => {
    if (event.target === signupModal) signupModal.classList.add('hidden');
  });

  signupForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value || '';
    const confirmPassword = document.getElementById('signupPasswordConfirm')?.value || '';
    if (!email || password.length < 8) {
      if (signupAlert) {
        signupAlert.textContent = 'Enter a valid email and a password of at least 8 characters.';
        signupAlert.className = 'p-3 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-400';
      }
      return;
    }
    if (password !== confirmPassword) {
      if (signupAlert) {
        signupAlert.textContent = 'The passwords do not match.';
        signupAlert.className = 'p-3 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-400';
      }
      return;
    }
    if (email.toLowerCase() === ADMIN_EMAIL) {
      if (signupAlert) {
        signupAlert.textContent = 'The owner account must be provisioned by the administrator.';
        signupAlert.className = 'p-3 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-400';
      }
      return;
    }

    let createdUser = null;
    try {
      await authPersistenceReady;
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = credential.user;
      await initializeUserProfile(createdUser);
      signupForm.reset();
      signupModal?.classList.add('hidden');
      showToast('Account created. You are now signed in.', 'success');
      switchView('dashboard');
    } catch (error) {
      if (createdUser && auth.currentUser?.uid === createdUser.uid) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          logDebug(`Sign-up cleanup sign-out failed: ${signOutError.message}`, 'ERROR');
        }
      }
      if (signupAlert) {
        signupAlert.textContent = friendlyAuthError(error);
        signupAlert.className = 'p-3 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-400';
      }
      showToast(`Sign-up failed: ${friendlyAuthError(error)}`, 'error');
    }
  });

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });
  }

  if (forgotPassBtn && resetModal) {
    forgotPassBtn.addEventListener('click', () => resetModal.classList.remove('hidden'));
  }
  if (closeResetBtn && resetModal) {
    closeResetBtn.addEventListener('click', () => resetModal.classList.add('hidden'));
  }
  if (cancelResetBtn && resetModal) {
    cancelResetBtn.addEventListener('click', () => resetModal.classList.add('hidden'));
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmailInput')?.value.trim();
      if (!email) return;
      try {
        await sendPasswordResetEmail(auth, email);
        showToast(`Password reset link sent to ${email}`, 'success');
        resetModal?.classList.add('hidden');
      } catch (err) {
        showToast(`Reset error: ${err.message}`, 'error');
      }
    });
  }

  // Firebase Auth State Listener (Persistent)
  authPersistenceReady.then(() => onAuthStateChanged(auth, (user) => {
    if (gateScreen) gateScreen.classList.add('hidden');

    if (user) {
      APP_STATE.currentUser = user;
      APP_STATE.currentRole = user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
      if (loginScreen) loginScreen.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');

      const userBadge = document.getElementById('userEmailBadge');
      if (userBadge) userBadge.textContent = user.email || 'Account';
      updateProfileDisplay(user);
      applyRolePermissions();

      logDebug('Persistent session confirmed.');
      if (cloudSyncUserId !== user.uid) {
        stopCloudSyncListeners();
        cloudSyncUserId = user.uid;
        roleSyncUnsubscribe = onSnapshot(doc(db, 'users', user.uid), snapshot => {
          if (auth.currentUser?.uid !== user.uid) return;
          const role = user.email?.toLowerCase() === ADMIN_EMAIL
            ? 'admin'
            : snapshot.data()?.role === 'admin' ? 'admin' : 'user';
          const roleChanged = APP_STATE.currentRole !== role;
          APP_STATE.currentRole = role;
          updateProfileDisplay(user);
          applyRolePermissions();
          if (roleChanged) initCloudSyncListeners();
        }, error => {
          logDebug(`Account role sync failed: ${error.message}`, 'ERROR');
        });
        initCloudSyncListeners();
        initializeUserProfile(user).catch(error => {
          logDebug(`Account profile initialization failed: ${error.message}`, 'ERROR');
          showToast(`Account profile could not be synced: ${error.message}`, 'error');
        });
      }
    } else {
      clearSignedInState();
      stopCloudSyncListeners();
      if (appShell) appShell.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');
      logDebug('Awaiting owner authentication...');
    }
  }, error => {
    if (gateScreen) gateScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    logDebug(`Authentication state listener failed: ${error.message}`, 'ERROR');
  })).catch(error => {
    if (gateScreen) gateScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    logDebug(`Authentication initialization failed: ${error.message}`, 'ERROR');
  });

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;
      const btnText = document.getElementById('loginBtnText');
      const spinner = document.getElementById('loginBtnSpinner');
      const submitButton = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) return;
      const remainingLock = loginLockedUntil - Date.now();
      if (remainingLock > 0) {
        const seconds = Math.ceil(remainingLock / 1000);
        const message = `Too many failed sign-in attempts. Try again in ${seconds} seconds.`;
        if (loginAlert) {
          loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/15 border border-red-500/30 text-red-400 block';
          loginAlert.textContent = message;
        }
        return;
      }

      if (loginAlert) loginAlert.classList.add('hidden');
      if (btnText) btnText.textContent = 'Verifying Credentials...';
      if (spinner) spinner.classList.remove('hidden');
      if (submitButton) submitButton.disabled = true;

      try {
        await authPersistenceReady;
        await signInWithEmailAndPassword(auth, email, password);
        loginFailureCount = 0;
        loginLockedUntil = 0;
        showToast('Login successful. Session established.', 'success');
      } catch (err) {
        loginFailureCount += 1;
        const errorMessage = friendlyAuthError(err);
        if (loginFailureCount >= 5) {
          loginLockedUntil = Date.now() + 30000;
          loginFailureCount = 0;
        }
        if (loginAlert) {
          loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/15 border border-red-500/30 text-red-400 block';
          loginAlert.textContent = loginLockedUntil
            ? 'Too many failed sign-in attempts. Sign-in is paused for 30 seconds.'
            : errorMessage;
        }
        showToast(`Login failed: ${errorMessage}`, 'error');
      } finally {
        if (btnText) btnText.textContent = 'Sign In to Counter Ledger';
        if (spinner) spinner.classList.add('hidden');
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
}

// =============================================================================
// 19. REAL-TIME FIRESTORE CLOUD LISTENERS
// =============================================================================

let cloudSyncUnsubscribers = [];
let cloudSyncUserId = null;
let roleSyncUnsubscribe = null;
let dragSaveTimer = null;
let activeDashboardDrag = null;
let dashboardPressTimer = null;
let suppressDashboardClickUntil = 0;

function dashboardPreferenceKey(uid = auth.currentUser?.uid) {
  return uid ? `al_preferences_${uid}` : null;
}

function saveUserPreferences(patch) {
  if (!patch || typeof patch !== 'object') return Promise.resolve(false);
  const uid = auth.currentUser?.uid;
  const key = dashboardPreferenceKey(uid);
  if (key) {
    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem(key) || '{}');
    } catch (error) {
      logDebug(`Stored preferences could not be read: ${error.message}`, 'WARN');
    }
    const updated = { ...cached, ...patch };
    localStorage.setItem(key, JSON.stringify(updated));
  }
  if (!uid) return Promise.resolve(false);

  return setDoc(doc(db, 'user_settings', uid), {
    ...patch,
    updatedAt: serverTimestamp()
  }, { merge: true }).then(() => true).catch(error => {
    logDebug(`Preference sync failed: ${error.message}`, 'ERROR');
    showToast(`Preference could not be synced: ${error.message}`, 'error');
    return false;
  });
}

function applyDashboardOrder(container, order) {
  if (!container || !Array.isArray(order)) return;
  const cards = new Map(
    [...container.querySelectorAll(':scope > [data-card-id]')]
      .map(card => [card.dataset.cardId, card])
  );
  order.forEach(id => {
    const card = cards.get(id);
    if (card) {
      container.appendChild(card);
      cards.delete(id);
    }
  });
  cards.forEach(card => container.appendChild(card));
}

function persistDashboardOrder() {
  if (dragSaveTimer) clearTimeout(dragSaveTimer);
  dragSaveTimer = setTimeout(() => {
    const metrics = [...document.querySelectorAll('#dashboardGrid > [data-card-id]')]
      .map(card => card.dataset.cardId);
    const actions = [...document.querySelectorAll('#dashboardActionsGrid > [data-card-id]')]
      .map(card => card.dataset.cardId);
    APP_STATE.dashboardOrder = { metrics, actions };
    saveUserPreferences({ dashboardOrder: APP_STATE.dashboardOrder });
  }, 150);
}

function resetDashboardLayout() {
  APP_STATE.dashboardOrder = {
    metrics: [...DEFAULT_DASHBOARD_ORDER.metrics],
    actions: [...DEFAULT_DASHBOARD_ORDER.actions]
  };
  applyDashboardOrder(document.getElementById('dashboardGrid'), APP_STATE.dashboardOrder.metrics);
  applyDashboardOrder(document.getElementById('dashboardActionsGrid'), APP_STATE.dashboardOrder.actions);
  persistDashboardOrder();
  showToast('Dashboard layout restored.', 'success');
}

function initDashboardReordering() {
  const containers = [
    document.getElementById('dashboardGrid'),
    document.getElementById('dashboardActionsGrid')
  ].filter(Boolean);

  const beginDrag = (card, event) => {
    activeDashboardDrag = { card, container: card.parentElement, pointerId: event.pointerId, moved: false };
    card.classList.add('is-dragging');
    card.setPointerCapture?.(event.pointerId);
  };
  const finishDrag = () => {
    if (!activeDashboardDrag) return;
    activeDashboardDrag.card.classList.remove('is-dragging');
    const moved = activeDashboardDrag.moved;
    activeDashboardDrag = null;
    if (moved) {
      persistDashboardOrder();
      suppressDashboardClickUntil = Date.now() + 250;
    }
  };

  containers.forEach(container => {
    container.addEventListener('pointerdown', event => {
      const card = event.target.closest('[data-card-id]');
      const control = event.target.closest('button,a,input,select,textarea');
      if (!card || card.parentElement !== container || (control && control !== card)) return;
      const touchInput = event.pointerType === 'touch';
      if (touchInput) {
        dashboardPressTimer = setTimeout(() => beginDrag(card, event), 350);
      } else if (event.button === 0) {
        beginDrag(card, event);
      }
    });
    container.addEventListener('pointermove', event => {
      if (!activeDashboardDrag || activeDashboardDrag.container !== container) return;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-card-id]');
      if (!target || target === activeDashboardDrag.card || target.parentElement !== container) return;
      const rect = target.getBoundingClientRect();
      const sourceRect = activeDashboardDrag.card.getBoundingClientRect();
      const sameRow = Math.abs(rect.top - sourceRect.top) < Math.min(rect.height, sourceRect.height) / 2;
      const placeAfter = sameRow
        ? event.clientX > rect.left + rect.width / 2
        : event.clientY > rect.top + rect.height / 2;
      container.insertBefore(activeDashboardDrag.card, placeAfter ? target.nextSibling : target);
      activeDashboardDrag.moved = true;
    }, { passive: false });
    container.addEventListener('pointerup', () => {
      if (dashboardPressTimer) clearTimeout(dashboardPressTimer);
      dashboardPressTimer = null;
      finishDrag();
    });
    container.addEventListener('pointercancel', () => {
      if (dashboardPressTimer) clearTimeout(dashboardPressTimer);
      dashboardPressTimer = null;
      finishDrag();
    });
    container.addEventListener('pointerleave', () => {
      if (dashboardPressTimer && !activeDashboardDrag) {
        clearTimeout(dashboardPressTimer);
        dashboardPressTimer = null;
      }
    });
    container.addEventListener('click', event => {
      if (Date.now() < suppressDashboardClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  });
}

function clearSignedInState() {
  APP_STATE.currentUser = null;
  APP_STATE.currentRole = 'user';
  APP_STATE.userProfiles = [];
  APP_STATE.todayStationeryTransactions = [];
  APP_STATE.todayReloadTransactions = [];
  APP_STATE.masterStationeryRecords = [];
  APP_STATE.masterReloadRecords = [];
  APP_STATE.inventoryCatalog = [];
  APP_STATE.activeView = 'dashboard';
  document.getElementById('viewProfile')?.classList.add('hidden');
  document.getElementById('viewDashboard')?.classList.remove('hidden');
  document.getElementById('signupModal')?.classList.add('hidden');
  document.getElementById('userEmailBadge')?.replaceChildren();
  document.getElementById('profileAccountEmail')?.replaceChildren();
  document.getElementById('profileAccountRole')?.replaceChildren();
  document.getElementById('adminUsersList')?.replaceChildren();
  applyRolePermissions();
}

function stopCloudSyncListeners() {
  cloudSyncUnsubscribers.forEach(unsubscribe => unsubscribe());
  cloudSyncUnsubscribers = [];
  roleSyncUnsubscribe?.();
  roleSyncUnsubscribe = null;
  cloudSyncUserId = null;
}

function initCloudSyncListeners() {
  cloudSyncUnsubscribers.forEach(unsubscribe => unsubscribe());
  cloudSyncUnsubscribers = [];
  const watch = (...args) => cloudSyncUnsubscribers.push(onSnapshot(...args));
  const user = auth.currentUser;
  if (!user) return;

  const prefKey = dashboardPreferenceKey(user.uid);
  if (prefKey) {
    try {
      const cached = JSON.parse(localStorage.getItem(prefKey) || '{}');
      if (cached.activeTheme) applyTheme(cached.activeTheme);
      if (typeof cached.gradientBlurEnabled === 'boolean') setGradientBlurEnabled(cached.gradientBlurEnabled);
      if (cached.dashboardOrder) APP_STATE.dashboardOrder = cached.dashboardOrder;
      applyDashboardOrder(document.getElementById('dashboardGrid'), APP_STATE.dashboardOrder.metrics);
      applyDashboardOrder(document.getElementById('dashboardActionsGrid'), APP_STATE.dashboardOrder.actions);
    } catch (error) {
      logDebug(`Stored preferences could not be applied: ${error.message}`, 'WARN');
    }
  }

  // 1. Inventory Catalog Listener
  watch(collection(db, 'inventory'), (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    APP_STATE.inventoryCatalog = items;
    renderStockTable();
    renderCatalogTable();
    updateDashboardMetrics();
    updateBackupStatusDisplay();
    logDebug(`Inventory catalog updated: ${items.length} records`);
  }, (err) => {
    logDebug(`Catalog sync notice: ${err.message}`, 'WARN');
  });

  // 2. Real-time stationery history, scoped to the signed-in user for standard accounts.
  const stationeryQuery = APP_STATE.currentRole === 'admin'
    ? collection(db, 'stationery_transactions')
    : query(collection(db, 'stationery_transactions'), where('createdBy', '==', user.uid));
  watch(stationeryQuery, snapshot => {
    const records = [];
    snapshot.forEach(docSnap => records.push({ id: docSnap.id, ...docSnap.data() }));
    APP_STATE.masterStationeryRecords = records;
    APP_STATE.todayStationeryTransactions = records.filter(record => record.date === getTodayDateString());
    APP_STATE.todayStationeryTransactions.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    renderRecentStationeryFeed();
    applyMasterLogFilters();
    updateDashboardMetrics();
  }, (err) => {
    logDebug(`Stationery sync notice: ${err.message}`, 'WARN');
  });

  // 3. Real-time reload history, scoped to the signed-in user for standard accounts.
  const reloadQuery = APP_STATE.currentRole === 'admin'
    ? collection(db, 'reload_transactions')
    : query(collection(db, 'reload_transactions'), where('createdBy', '==', user.uid));
  watch(reloadQuery, snapshot => {
    const records = [];
    snapshot.forEach(docSnap => records.push({ id: docSnap.id, ...docSnap.data() }));
    APP_STATE.masterReloadRecords = records;
    APP_STATE.todayReloadTransactions = records.filter(record => record.date === getTodayDateString());
    APP_STATE.todayReloadTransactions.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    renderRecentReloadsFeed();
    applyMasterLogFilters();
    updateDashboardMetrics();
  }, (err) => {
    logDebug(`Reloads sync notice: ${err.message}`, 'WARN');
  });

  // 4. System settings and per-user profile/preferences.
  watch(doc(db, 'settings', 'rates'), (docSnap) => {
    if (docSnap.exists()) {
      APP_STATE.commissionRates = { ...APP_STATE.commissionRates, ...docSnap.data() };
      const bA = document.getElementById('rateBadgeAirtel');
      const bD = document.getElementById('rateBadgeDialog');
      const bM = document.getElementById('rateBadgeMobitel');
      const bH = document.getElementById('rateBadgeHutch');
      if (bA) bA.textContent = `${(APP_STATE.commissionRates.AIRTEL || 6.8).toFixed(2)}%`;
      if (bD) bD.textContent = `${(APP_STATE.commissionRates.DIALOG || 3.8).toFixed(2)}%`;
      if (bM) bM.textContent = `${(APP_STATE.commissionRates.MOBITEL || 6.8).toFixed(2)}%`;
      if (bH) bH.textContent = `${(APP_STATE.commissionRates.HUTCH || 5.0).toFixed(2)}%`;
      updateReloadCommissionPreview();
    }
  });

  watch(doc(db, 'settings', 'presets'), (docSnap) => {
    if (docSnap.exists() && Array.isArray(docSnap.data()?.list)) {
      APP_STATE.reloadPresets = docSnap.data().list;
      renderPresetPills();
    }
  });

  watch(doc(db, 'user_settings', user.uid), snapshot => {
    if (!snapshot.exists()) return;
    const preferences = snapshot.data();
    const localKey = dashboardPreferenceKey(user.uid);
    if (localKey) localStorage.setItem(localKey, JSON.stringify(preferences));
    if (preferences.activeTheme) applyTheme(preferences.activeTheme);
    if (typeof preferences.gradientBlurEnabled === 'boolean') setGradientBlurEnabled(preferences.gradientBlurEnabled);
    if (preferences.dashboardOrder?.metrics && preferences.dashboardOrder?.actions) {
      APP_STATE.dashboardOrder = preferences.dashboardOrder;
      applyDashboardOrder(document.getElementById('dashboardGrid'), preferences.dashboardOrder.metrics);
      applyDashboardOrder(document.getElementById('dashboardActionsGrid'), preferences.dashboardOrder.actions);
    }
  }, error => logDebug(`User preferences sync failed: ${error.message}`, 'ERROR'));

  if (APP_STATE.currentRole === 'admin') {
    watch(collection(db, 'users'), snapshot => {
      APP_STATE.userProfiles = snapshot.docs.map(userDoc => ({ id: userDoc.id, ...userDoc.data() }));
      updateProfileDisplay();
    }, error => logDebug(`Account list sync failed: ${error.message}`, 'ERROR'));
  } else {
    APP_STATE.userProfiles = [];
  }
}

// =============================================================================
// 20. BOOTSTRAP INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  logDebug('AL Communication System Initializing (V5.0 High-Contrast Modern Default UI)...', 'INFO');

  initThemeSystem();
  startLiveClock();
  initNavigation();
  initDashboardReordering();
  initGlobalSearch();
  initStationeryPOS();
  initMobileReloads();
  initStockInventory();
  initMasterLogs();
  initSettingsCatalog();
  initSettingsPanels();
  initBackupRestoreSystem();
  initProfileControls();
  initAuthentication();

  logDebug('AL Communication System v5.0 Ready.', 'SUCCESS');
});