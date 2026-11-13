// =============================================================================
// AL COMMUNICATION â€” PRODUCTION RETAIL MANAGEMENT SYSTEM (VERSION 5.0)
// High-Contrast Solid Modern Default UI | Branded Sticky Navigation
// Universal Global Search Engine | Service/Utility Bills (No Qty)
// Auto Title Case Formatting | Natural Numeric Inventory Sorting
// Complete Settings Backup & Restore System | Stamped PDF Reporting
// Single-Owner Persistent Session: lasasdias11@gmail.com
// =============================================================================

import {
  auth,
  db,
  signInWithEmailAndPassword,
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
  increment
} from './firebase-config.js';

// =============================================================================
// 1. GLOBAL APPLICATION STATE (V5.0 ARCHITECTURE)
// =============================================================================

export const APP_STATE = {
  currentUser: null,
  activeView: 'dashboard',
  activeTheme: localStorage.getItem('al_theme_preference') || 'modern-slate',
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
  stockSortOrder: 'code-asc',
  catalogSortOrder: 'code-asc',
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
}

/**
 * Requirement 4.1: Enforce Automatic Title Case Formatting
 * Capitalizes the first letter of every word (e.g., 'a4 cr books' -> 'A4 Cr Books')
 */
export function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/(?:^|\s|[-/()&])([a-z0-9])/gi, (match) => match.toUpperCase());
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

  // Quick Header Light/Dark Toggle
  const quickToggle = document.getElementById('themeQuickToggleBtn');
  if (quickToggle) {
    quickToggle.addEventListener('click', () => {
      const nextTheme = APP_STATE.activeTheme === 'emerald-store' ? 'modern-slate' : 'emerald-store';
      applyTheme(nextTheme);
      showToast(`Switched to ${nextTheme === 'emerald-store' ? 'Light Mode' : 'Dark Mode'}`, 'info');
    });
  }

  // Settings Modal Theme Cards
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.getAttribute('data-theme-choice');
      applyTheme(chosen);
      showToast(`Theme applied: ${chosen}`, 'success');
    });
  });
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
  const validViews = ['dashboard', 'stationery', 'reloads', 'stock', 'logs'];
  if (!validViews.includes(viewName)) viewName = 'dashboard';

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

  // Header Brand Logo link -> Dashboard
  const headerHomeBtn = document.getElementById('headerHomeBtn');
  if (headerHomeBtn) {
    headerHomeBtn.addEventListener('click', () => switchView('dashboard'));
  }

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
    updateBackupStatusDisplay();
  }
}

export function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
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

    const totalMatches = matchedCatalog.length + uniqueReloads.length + uniqueStats.length;

    if (totalMatches === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs theme-text-dim">
          No records or transactions matching "<span class="font-semibold theme-text-main">${escapeHTML(q)}</span>"
        </div>
      `;
      return;
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
          ? `<span class="badge-stock-low px-2 py-0.5 rounded text-[10px] font-bold">${item.stockQuantity} Left</span>`
          : `<span class="badge-stock-in px-2 py-0.5 rounded text-[10px] font-bold">${item.stockQuantity} in stock</span>`;

        row.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">${escapeHTML(item.code)}</span>
            <div class="truncate">
              <div class="font-bold text-xs theme-text-main truncate">${escapeHTML(item.name)}</div>
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
            <div class="text-[10px] theme-text-dim font-mono">+${formatLKR(r.commissionAmount)}</div>
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
              <div class="font-bold text-xs theme-text-main truncate">${escapeHTML(s.itemName)}</div>
              <div class="text-[10px] theme-text-dim">${escapeHTML(s.date || '')} â€¢ Qty: ${s.quantity || 1}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-xs theme-text-main font-mono">${formatLKR(s.totalAmount)}</div>
            <div class="text-[10px] text-sky-400 font-mono">Profit: +${formatLKR(s.profit || 0)}</div>
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
  switch (sortKey) {
    case 'code-asc':
      return list.sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
    case 'code-desc':
      return list.sort((a, b) => String(b.code || '').localeCompare(String(a.code || ''), undefined, { numeric: true, sensitivity: 'base' }));
    case 'price-asc':
      return list.sort((a, b) => (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0));
    case 'price-desc':
      return list.sort((a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0));
    case 'stock-asc':
      return list.sort((a, b) => {
        if (a.itemType === 'service') return 1;
        if (b.itemType === 'service') return -1;
        return (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0);
      });
    case 'stock-desc':
      return list.sort((a, b) => {
        if (a.itemType === 'service') return 1;
        if (b.itemType === 'service') return -1;
        return (Number(b.stockQuantity) || 0) - (Number(a.stockQuantity) || 0);
      });
    case 'name-asc':
      return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
    default:
      return list;
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

  // Combined Totals
  const combinedRevenue = roundCurrency(statSales + reloadVolume);
  const combinedTotalProfit = roundCurrency(statProfitToday + reloadCommission);

  // Exact 6 Dashboard Metric Cards
  const elCombinedRevenue = document.getElementById('dashTodayCombinedRevenue');
  const elStatSales = document.getElementById('dashStationerySales');
  const elStatUnits = document.getElementById('dashStationeryUnits');
  const elReloadVol = document.getElementById('dashReloadVolume');
  const elReloadComm = document.getElementById('dashReloadCommission');
  const elStatProfit = document.getElementById('dashStationeryProfit');
  const elCatalogCount = document.getElementById('dashCatalogCount');
  const elCombinedProfit = document.getElementById('dashCombinedTotalProfit');

  if (elCombinedRevenue) elCombinedRevenue.textContent = formatLKR(combinedRevenue);
  if (elStatSales) elStatSales.textContent = formatLKR(statSales);
  if (elStatUnits) elStatUnits.textContent = String(statUnits);
  if (elReloadVol) elReloadVol.textContent = formatLKR(reloadVolume);
  // Clean LKR amount only â€” Strictly NO "Comm." text
  if (elReloadComm) elReloadComm.textContent = formatLKR(reloadCommission);
  if (elStatProfit) elStatProfit.textContent = formatLKR(statProfitToday);
  if (elCatalogCount) elCatalogCount.textContent = `${APP_STATE.inventoryCatalog.length} Items`;
  if (elCombinedProfit) elCombinedProfit.textContent = formatLKR(combinedTotalProfit);

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
      const isHidden = moreFiltersDrawer.classList.contains('hidden');
      if (isHidden) {
        moreFiltersDrawer.classList.remove('hidden');
        toggleMoreFiltersBtn.setAttribute('aria-expanded', 'true');
        if (moreFiltersChevron) moreFiltersChevron.classList.add('rotate-180');
      } else {
        moreFiltersDrawer.classList.add('hidden');
        toggleMoreFiltersBtn.setAttribute('aria-expanded', 'false');
        if (moreFiltersChevron) moreFiltersChevron.classList.remove('rotate-180');
      }
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
        APP_STATE.logDateScope = 'custom';
        APP_STATE.logDateFrom = fromInput.value;
        APP_STATE.logDateTo = (toInput && toInput.value) ? toInput.value : fromInput.value;
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
  const filteredCombinedRevenue = roundCurrency(filteredStatSales + filteredReloadVol);

  // Card 1: Filtered Reloads Card
  const elLogReloadVol = document.getElementById('logPairedReloadVol');
  const elLogReloadComm = document.getElementById('logPairedReloadComm');
  const elLogReloadStats = document.getElementById('logPairedReloadStats');

  if (elLogReloadVol) elLogReloadVol.textContent = formatLKR(filteredReloadVol);
  // Clean LKR amount only - strictly NO "Comm." text
  if (elLogReloadComm) elLogReloadComm.textContent = `+${formatLKR(filteredReloadComm)}`;
  if (elLogReloadStats) elLogReloadStats.textContent = `${filteredReloadCount} reload transactions`;

  // Card 2: Filtered Stationery & Bills Card
  const elLogStatSales = document.getElementById('logPairedStatSales');
  const elLogStatProfit = document.getElementById('logPairedStatProfit');
  const elLogStatStats = document.getElementById('logPairedStatStats');

  if (elLogStatSales) elLogStatSales.textContent = formatLKR(filteredStatSales);
  if (elLogStatProfit) elLogStatProfit.textContent = `+${formatLKR(filteredStatProfit)}`;
  if (elLogStatStats) elLogStatStats.textContent = `${filteredStatUnits} units sold • ${filteredStatCount} txs`;

  // Card 3: Dedicated Standalone Combined Total Profit Card
  const elLogCombinedTotalProfit = document.getElementById('logCombinedTotalProfit');
  const elLogCombinedRevenue = document.getElementById('logCombinedRevenue');
  const elLogCombinedProfitStats = document.getElementById('logCombinedProfitStats');

  if (elLogCombinedTotalProfit) elLogCombinedTotalProfit.textContent = formatLKR(filteredTotalProfit);
  if (elLogCombinedRevenue) elLogCombinedRevenue.textContent = formatLKR(filteredCombinedRevenue);
  if (elLogCombinedProfitStats) elLogCombinedProfitStats.textContent = `Reloads (${formatLKR(filteredReloadComm)}) + Stationery (${formatLKR(filteredStatProfit)})`;

  // Filter Scope Label
  const scopeLabel = document.getElementById('masterLogsDateScopeLabel');
  if (scopeLabel) {
    if (isAllTime) {
      scopeLabel.textContent = 'All Time Records';
    } else if (fromDate === toDate) {
      scopeLabel.textContent = fromDate === getTodayDateString() ? `Today (${fromDate})` : fromDate;
    } else {
      scopeLabel.textContent = `${fromDate} to ${toDate}`;
    }
  }

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
      <td class="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
        <div class="font-bold theme-text-main">${escapeHTML(item.time || '--:--')}</div>
        <div class="text-[10px] theme-text-dim">${escapeHTML(item.date || '')}</div>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-2">
          ${typeBadge}
          <span class="font-semibold text-xs theme-text-main">${escapeHTML(item.title)}</span>
        </div>
      </td>
      <td class="py-2.5 px-3 font-mono text-xs theme-text-dim">
        ${escapeHTML(item.ref)}
      </td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-xs theme-text-main currency-lkr">
        ${formatLKR(item.amount)}
      </td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-xs ${item.type === 'RELOAD' ? 'text-emerald-400' : 'text-sky-400'} currency-lkr">
        +${formatLKR(item.profit)}
      </td>
      <td class="py-2.5 px-3 text-center">
        <button type="button" class="delete-tx-btn p-1 text-red-400 hover:text-red-300 transition" title="Delete record">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    const deleteBtn = tr.querySelector('.delete-tx-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`Delete transaction for "${item.title}" (${formatLKR(item.amount)})?`)) return;
        try {
          const colName = item.type === 'RELOAD' ? 'reload_transactions' : 'stationery_transactions';
          await deleteDoc(doc(db, colName, item.raw.id));
          showToast('Transaction record deleted', 'success');
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

  const stationeryList = APP_STATE.masterStationeryRecords
    .filter(s => isAllTime || (s.date >= fromDate && s.date <= toDate))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const reloadList = APP_STATE.masterReloadRecords
    .filter(r => isAllTime || (r.date >= fromDate && r.date <= toDate))
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

  // Box 1: Stationery Sales & Profit
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.setDrawColor(226, 232, 240);
  pdfDoc.roundedRect(14, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('STATIONERY & BILLS REVENUE', 17, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(formatLKR(totalStatSales), 17, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(2, 132, 199);
  pdfDoc.text(`Profit: +${formatLKR(totalStatProfit)} (${totalUnitsSold} items)`, 17, boxY + 17);

  // Box 2: Reload Sales & Profit
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.roundedRect(76, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('MOBILE RELOADS VOLUME', 79, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(formatLKR(totalReloadVol), 79, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(16, 185, 129);
  pdfDoc.text(`Profit: +${formatLKR(totalReloadComm)} (${reloadList.length} txs)`, 79, boxY + 17);

  // Box 3: Combined Total Profit
  pdfDoc.setFillColor(240, 253, 244);
  pdfDoc.setDrawColor(187, 247, 208);
  pdfDoc.roundedRect(138, boxY, boxW, boxH, 2, 2, 'FD');
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(22, 101, 52);
  pdfDoc.text('COMBINED TOTAL PROFIT', 141, boxY + 5);
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(21, 128, 61);
  pdfDoc.text(formatLKR(totalNetProfit), 141, boxY + 12);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(`Total Turnover: ${formatLKR(totalStoreRevenue)}`, 141, boxY + 17);

  // 3. Transactions Table (autoTable)
  const tableData = [];

  stationeryList.forEach(s => {
    tableData.push([
      `${s.date || ''} ${s.time || ''}`,
      s.itemType === 'service' ? 'Service/Bill' : 'Stationery',
      s.itemName || '-',
      s.itemCode || '-',
      String(s.quantity || 1),
      formatLKR(Number(s.totalAmount || s.sellingPrice || 0)),
      `+${formatLKR(Number(s.profit || 0))}`
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
      `+${formatLKR(Number(r.commissionAmount || 0))}`
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
      stockCol = `<span class="badge-stock-low px-2.5 py-1 rounded-full text-xs font-bold">${item.stockQuantity} Left (Low)</span>`;
    } else {
      stockCol = `<span class="badge-stock-in px-2.5 py-1 rounded-full text-xs font-bold">${item.stockQuantity} in stock</span>`;
    }

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono font-bold text-xs theme-text-main">${escapeHTML(item.code)}</td>
      <td class="py-3 px-3 sm:px-4">
        <div class="font-bold text-xs theme-text-main">${escapeHTML(item.name)}</div>
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
  const submitBtnText = document.getElementById('posSubmitBtnText');

  if (input) input.value = item.name;
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
  }

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
              <span class="font-bold text-xs theme-text-main">${escapeHTML(item.name)}</span>
            </div>
            <div class="text-right">
              <div class="font-bold text-xs theme-text-main font-mono">${formatLKR(item.sellingPrice)}</div>
              <div class="text-[10px] theme-text-dim">${isService ? 'Service/Bill' : item.stockQuantity + ' left'}</div>
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
        // Utility bills: No stock count. Profit is service fee or margin if defined, else 0
        costPrice = matchedItem ? roundCurrency(matchedItem.costPrice || 0) : 0;
        unitProfit = roundCurrency(costPrice > 0 ? sellingPrice - costPrice : 0);
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
      if (!isService && matchedItem && matchedItem.stockQuantity < quantity) {
        if (!confirm(`Warning: Only ${matchedItem.stockQuantity} units in stock for "${matchedItem.name}". Proceed with logging sale of ${quantity} units?`)) {
          return;
        }
      }

      const transactionPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        itemCode,
        itemName,
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
        // 1. Add Transaction to Firestore
        await addDoc(collection(db, 'stationery_transactions'), transactionPayload);

        // 2. Deduct Stock strictly for Physical Products (Requirement 4.2)
        if (!isService && matchedItem && matchedItem.id) {
          const itemDocRef = doc(db, 'inventory', matchedItem.id);
          await updateDoc(itemDocRef, {
            stockQuantity: increment(-quantity),
            updatedAt: serverTimestamp()
          });
          const remainingStock = Math.max(0, matchedItem.stockQuantity - quantity);
          showToast(`Logged sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)}) â€¢ Stock left: ${remainingStock}`, 'success');
        } else if (isService) {
          showToast(`Recorded utility bill: ${itemName} (${formatLKR(totalAmount)}) [No stock deduction]`, 'success');
        } else {
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
          <span class="font-bold theme-text-main">${escapeHTML(item.itemName)}</span>
          <span class="text-[11px] theme-text-dim"> Ã— ${item.quantity || 1} â€¢ ${escapeHTML(item.time || '')}</span>
        </div>
      </div>
      <div class="text-right">
        <span class="font-mono font-bold text-emerald-400 currency-lkr">${formatLKR(item.totalAmount)}</span>
        <span class="text-[10px] theme-text-dim block">+${formatLKR(item.profit || 0)} margin</span>
      </div>
    `;
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
    commPreview.textContent = formatLKR(commission);
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
        operator,
        phone: phone || 'Walk-in Customer',
        amount,
        commissionRate: rate,
        commissionAmount,
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'reload_transactions'), payload);
        showToast(`Recorded ${operator} reload of ${formatLKR(amount)} (+${formatLKR(commissionAmount)} comm.)`, 'success');
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
      <div class="text-right">
        <span class="font-mono font-bold text-emerald-400 currency-lkr">${formatLKR(item.amount)}</span>
        <span class="text-[10px] theme-text-dim block font-mono">+${formatLKR(item.commissionAmount)} comm.</span>
      </div>
    `;
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
      if (costPriceContainer) costPriceContainer.classList.add('hidden');
      if (sellingPriceLabel) sellingPriceLabel.textContent = 'Default Base Fee / Amount [Rs.]';
      if (costPriceInput) {
        costPriceInput.required = false;
        costPriceInput.value = '0.00';
      }
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
      const code = codeInput.value.trim().toUpperCase();
      const rawName = nameInput.value.trim();
      const name = toTitleCase(rawName); // Auto Title Case
      const category = categoryInput ? categoryInput.value.trim() || 'General' : 'General';
      const isService = form.querySelector('input[name="catalogItemType"]:checked')?.value === 'service';
      const itemType = isService ? 'service' : 'product';

      const costPrice = isService ? 0 : roundCurrency(costPriceInput.value);
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
      renderCatalogTable();
    });
  }

  // Seed Button
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
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

    const costDisplay = isService ? '<span class="theme-text-dim font-mono">N/A</span>' : `<span class="font-mono font-bold text-amber-400">${formatLKR(item.costPrice)}</span>`;
    const profitDisplay = isService ? '<span class="theme-text-dim font-mono">Custom</span>' : `<span class="font-mono font-bold text-sky-400">+${formatLKR(item.sellingPrice - item.costPrice)}</span>`;
    const stockDisplay = isService ? `<span class="badge-service-bill px-2 py-0.5 rounded text-[11px] font-bold">No Qty</span>` : `<span class="font-mono font-bold ${item.stockQuantity <= 5 ? 'text-red-400' : 'theme-text-main'}">${item.stockQuantity}</span>`;

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-xs theme-text-main">${escapeHTML(item.code)}</td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-xs theme-text-main">${escapeHTML(item.name)}</div>
        <div class="text-[10px] theme-text-dim">${escapeHTML(item.category || 'General')}</div>
      </td>
      <td class="py-2.5 px-3">${typeBadge}</td>
      <td class="py-2.5 px-3 text-right text-xs">${costDisplay}</td>
      <td class="py-2.5 px-3 text-right text-xs font-mono font-bold text-emerald-400">${formatLKR(item.sellingPrice)}</td>
      <td class="py-2.5 px-3 text-right text-xs">${profitDisplay}</td>
      <td class="py-2.5 px-3 text-center text-xs">${stockDisplay}</td>
      <td class="py-2.5 px-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button type="button" class="edit-cat-btn px-2 py-1 rounded bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-white text-[11px] font-bold transition">Edit</button>
          <button type="button" class="del-cat-btn px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold transition">Delete</button>
        </div>
      </td>
    `;

    // Edit Item
    const editBtn = tr.querySelector('.edit-cat-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        document.getElementById('catalogDocId').value = item.id;
        document.getElementById('catalogCode').value = item.code;
        document.getElementById('catalogName').value = item.name;
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

  const savedRaw = localStorage.getItem('al_settings_backup_snapshot');
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

function createConfigurationSnapshot() {
  return {
    version: '5.0',
    appName: 'AL Communication',
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString(),
    catalog: APP_STATE.inventoryCatalog.map(item => ({
      code: item.code,
      name: item.name,
      category: item.category || 'General',
      itemType: item.itemType || 'product',
      costPrice: Number(item.costPrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      stockQuantity: Number(item.stockQuantity) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 5
    })),
    commissionRates: { ...APP_STATE.commissionRates },
    reloadPresets: [...APP_STATE.reloadPresets],
    activeTheme: APP_STATE.activeTheme
  };
}

export async function applyConfigurationBackup(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    showToast('Invalid backup file or snapshot structure', 'error');
    return false;
  }

  try {
    // 1. Restore Commission Rates
    if (snapshot.commissionRates) {
      APP_STATE.commissionRates = { ...snapshot.commissionRates };
      await setDoc(doc(db, 'settings', 'rates'), APP_STATE.commissionRates, { merge: true });
    }

    // 2. Restore Reload Presets
    if (Array.isArray(snapshot.reloadPresets)) {
      APP_STATE.reloadPresets = [...snapshot.reloadPresets];
      await setDoc(doc(db, 'settings', 'presets'), { list: APP_STATE.reloadPresets }, { merge: true });
      renderPresetPills();
    }

    // 3. Restore Theme
    if (snapshot.activeTheme) {
      applyTheme(snapshot.activeTheme);
    }

    // 4. Restore / Sync Catalog Items in Firestore
    if (Array.isArray(snapshot.catalog)) {
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
      showToast(`Restored configuration: ${restoredCount} catalog items, rates & presets`, 'success');
    }

    updateBackupStatusDisplay();
    renderCatalogTable();
    renderStockTable();
    updateDashboardMetrics();
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

  // Save Snapshot to localStorage
  if (saveSnapshotBtn) {
    saveSnapshotBtn.addEventListener('click', () => {
      const snap = createConfigurationSnapshot();
      localStorage.setItem('al_settings_backup_snapshot', JSON.stringify(snap));
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
      const savedRaw = localStorage.getItem('al_settings_backup_snapshot');
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
          if (!snap.catalog && !snap.commissionRates) {
            throw new Error('Unrecognized backup format. Missing catalog or rates.');
          }

          if (confirm(`Restore configuration from "${file.name}" (${snap.catalog?.length || 0} items)?`)) {
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
        <span>Rs. ${val}</span>
        <button type="button" class="del-preset-btn text-red-400 hover:text-red-300 ml-1 text-sm font-bold">âœ•</button>
      `;
      span.querySelector('.del-preset-btn')?.addEventListener('click', async () => {
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
      if (!newEmail || !auth.currentUser) return;
      try {
        await updateEmail(auth.currentUser, newEmail);
        showToast(`Email updated to ${newEmail}`, 'success');
        const badge = document.getElementById('userEmailBadge');
        if (badge) badge.textContent = newEmail;
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

// =============================================================================
// 18. AUTHENTICATION & SESSION PERSISTENCE (Requirement 7)
// =============================================================================

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
  onAuthStateChanged(auth, (user) => {
    if (gateScreen) gateScreen.classList.add('hidden');

    if (user) {
      APP_STATE.currentUser = user;
      if (loginScreen) loginScreen.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');

      const userBadge = document.getElementById('userEmailBadge');
      if (userBadge) userBadge.textContent = user.email || 'Store Owner';

      logDebug(`Persistent session confirmed: ${user.email}`);
      initCloudSyncListeners();
    } else {
      APP_STATE.currentUser = null;
      if (appShell) appShell.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');
      logDebug('Awaiting owner authentication...');
    }
  });

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;
      const btnText = document.getElementById('loginBtnText');
      const spinner = document.getElementById('loginBtnSpinner');

      if (!email || !password) return;

      if (loginAlert) loginAlert.classList.add('hidden');
      if (btnText) btnText.textContent = 'Verifying Credentials...';
      if (spinner) spinner.classList.remove('hidden');

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful. Session established.', 'success');
      } catch (err) {
        if (loginAlert) {
          loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/15 border border-red-500/30 text-red-400 block';
          loginAlert.textContent = `Authentication Failed: ${err.message}`;
        }
        showToast(`Login failed: ${err.message}`, 'error');
      } finally {
        if (btnText) btnText.textContent = 'Sign In to Counter Ledger';
        if (spinner) spinner.classList.add('hidden');
      }
    });
  }
}

// =============================================================================
// 19. REAL-TIME FIRESTORE CLOUD LISTENERS
// =============================================================================

function initCloudSyncListeners() {
  const todayStr = getTodayDateString();

  // 1. Inventory Catalog Listener
  onSnapshot(collection(db, 'inventory'), (snapshot) => {
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

  // 2. Today's Stationery & Bills Listener
  const statQuery = query(
    collection(db, 'stationery_transactions'),
    where('date', '==', todayStr)
  );
  onSnapshot(statQuery, (snapshot) => {
    const txs = [];
    snapshot.forEach(docSnap => {
      txs.push({ id: docSnap.id, ...docSnap.data() });
    });
    txs.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.todayStationeryTransactions = txs;
    renderRecentStationeryFeed();
    updateDashboardMetrics();
  }, (err) => {
    logDebug(`Stationery sync notice: ${err.message}`, 'WARN');
  });

  // 3. Today's Reloads Listener
  const reloadQuery = query(
    collection(db, 'reload_transactions'),
    where('date', '==', todayStr)
  );
  onSnapshot(reloadQuery, (snapshot) => {
    const reloads = [];
    snapshot.forEach(docSnap => {
      reloads.push({ id: docSnap.id, ...docSnap.data() });
    });
    reloads.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.todayReloadTransactions = reloads;
    renderRecentReloadsFeed();
    updateDashboardMetrics();
  }, (err) => {
    logDebug(`Reloads sync notice: ${err.message}`, 'WARN');
  });

  // 4. Master All-Time Records (For Ledger & PDF)
  onSnapshot(collection(db, 'stationery_transactions'), (snapshot) => {
    const list = [];
    snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
    APP_STATE.masterStationeryRecords = list;
    applyMasterLogFilters();
  });

  onSnapshot(collection(db, 'reload_transactions'), (snapshot) => {
    const list = [];
    snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
    APP_STATE.masterReloadRecords = list;
    applyMasterLogFilters();
  });

  // 5. System Settings Listener (Rates & Presets)
  onSnapshot(doc(db, 'settings', 'rates'), (docSnap) => {
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

  onSnapshot(doc(db, 'settings', 'presets'), (docSnap) => {
    if (docSnap.exists() && Array.isArray(docSnap.data()?.list)) {
      APP_STATE.reloadPresets = docSnap.data().list;
      renderPresetPills();
    }
  });
}

// =============================================================================
// 20. BOOTSTRAP INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  logDebug('AL Communication System Initializing (V5.0 High-Contrast Modern Default UI)...', 'INFO');

  initThemeSystem();
  startLiveClock();
  initNavigation();
  initGlobalSearch();
  initStationeryPOS();
  initMobileReloads();
  initStockInventory();
  initMasterLogs();
  initSettingsCatalog();
  initSettingsPanels();
  initBackupRestoreSystem();
  initAuthentication();

  logDebug('AL Communication System v5.0 Ready.', 'SUCCESS');
});