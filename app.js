// =============================================================================
// AL COMMUNICATION - SYSTEM LOGIC CORE (V1.0)
// Professional Retail Stationery & Mobile Reload POS System
// GitHub Pages SPA | Firebase Cloud Firestore v11 | Auth Guard
// Project ID: al-p1-fb432 | Primary Currency: LKR (Rs. 0.00 exact precision)
// =============================================================================

import {
  auth,
  db,
  isFirebaseInitialized,
  initError,
  updateFirebaseApiKey,
  // Auth Functions
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  // Firestore Functions
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
// 1. APPLICATION STATE & SAMPLE DATA (V1.0 RESTRUCTURED)
// =============================================================================

const APP_STATE = {
  currentUser: null,
  activeTheme: 'modern-slate',
  activeView: 'dashboard',
  currentDate: '',
  commissionRates: {
    AIRTEL: 6.80,
    DIALOG: 3.80,
    MOBITEL: 6.80,
    HUTCH: 5.00
  },
  inventoryCatalog: [],
  selectedCatalogItem: null,
  activeReloadOperator: 'MOBITEL',
  
  // Real-time feeds for today
  todayStationeryTransactions: [],
  todayReloadTransactions: [],

  // Master Logs Filter State
  logCategoryFilter: 'ALL', // 'ALL' | 'STATIONERY' | 'RELOAD'
  logDateMode: 'TODAY',     // 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'RANGE'
  logDateFrom: '',
  logDateTo: '',
  masterStationeryRecords: [],
  masterReloadRecords: [],

  // Stock View Filter
  stockFilter: 'ALL', // 'ALL' | 'LOW' | 'OUT'

  // Analytics Month (YYYY-MM)
  analyticsMonth: '',

  unsubscribers: {
    commissions: null,
    inventory: null,
    todayStationery: null,
    todayReloads: null,
    masterStationery: null,
    masterReloads: null
  },
  devLogs: []
};

// Standard Sri Lankan Stationery Catalog - Strictly Selling Price & Initial Stock
const SAMPLE_SRI_LANKAN_CATALOG = [
  { code: 'ST-001', name: 'Atlas CR Book 80 Pages (Single Rule)', sellingPrice: 200.00, stockQuantity: 50 },
  { code: 'ST-002', name: 'Atlas CR Book 120 Pages (Single Rule)', sellingPrice: 280.00, stockQuantity: 40 },
  { code: 'ST-003', name: 'Atlas CR Book 160 Pages (Single Rule)', sellingPrice: 370.00, stockQuantity: 35 },
  { code: 'ST-004', name: 'CR Book 80 Pages (Square Rule)', sellingPrice: 200.00, stockQuantity: 45 },
  { code: 'ST-005', name: 'Atlas Chooty Pen Blue (0.5mm)', sellingPrice: 30.00, stockQuantity: 200 },
  { code: 'ST-006', name: 'Atlas Chooty Pen Black (0.5mm)', sellingPrice: 30.00, stockQuantity: 150 },
  { code: 'ST-007', name: 'Atlas Chooty Pen Red (0.5mm)', sellingPrice: 30.00, stockQuantity: 100 },
  { code: 'ST-008', name: 'Nataraj 2B Pencil Pack (10s)', sellingPrice: 260.00, stockQuantity: 30 },
  { code: 'ST-009', name: 'A4 Photocopy Paper 80gsm (Pack 500)', sellingPrice: 1600.00, stockQuantity: 20 },
  { code: 'ST-010', name: 'A4 Photocopy Single Page (B/W)', sellingPrice: 10.00, stockQuantity: 1000 },
  { code: 'ST-011', name: 'A4 Colour Print Single Page', sellingPrice: 40.00, stockQuantity: 500 },
  { code: 'ST-012', name: 'Bristol Board Sheet (White/Colours)', sellingPrice: 60.00, stockQuantity: 80 },
  { code: 'ST-013', name: 'Atlas Colour Pastels (12 Shades)', sellingPrice: 230.00, stockQuantity: 25 },
  { code: 'ST-014', name: 'Clear Display File Folder (A4)', sellingPrice: 170.00, stockQuantity: 40 },
  { code: 'ST-015', name: 'UHU / Atlas Glue Stick 15g', sellingPrice: 150.00, stockQuantity: 30 }
];

// =============================================================================
// 2. MATHEMATICAL & FORMATTING UTILITIES (Exact Cent Precision)
// =============================================================================

export function roundCurrency(amount) {
  const num = Number(amount) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatLKR(amount) {
  const rounded = roundCurrency(amount);
  return 'Rs. ' + rounded.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

// =============================================================================
// 3. LOGGING & TOAST ALERTS (Zero Emoji Enterprise Style)
// =============================================================================

function logDebug(message, type = 'INFO') {
  const time = getCurrentTimeString();
  const entry = `[${time}] [${type}] ${message}`;
  APP_STATE.devLogs.unshift(entry);
  if (APP_STATE.devLogs.length > 200) APP_STATE.devLogs.pop();

  const terminalEl = document.getElementById('dbgTerminalLogs');
  if (terminalEl) {
    const logDiv = document.createElement('div');
    if (type === 'ERROR') logDiv.className = 'text-red-400 font-bold';
    else if (type === 'SUCCESS') logDiv.className = 'text-emerald-400';
    else if (type === 'WARN') logDiv.className = 'text-amber-400';
    else logDiv.className = 'text-gray-300';
    logDiv.textContent = entry;
    terminalEl.insertBefore(logDiv, terminalEl.firstChild);
  }
  console.log(entry);
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-red-600 text-white border-red-500',
    info: 'theme-bg-surface theme-text-main theme-border'
  };

  toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold border pointer-events-auto flex items-center gap-2 transform transition-all duration-200 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  } else {
    iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `<span>${iconSvg}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// =============================================================================
// 4. THEME ENGINE & SWITCHER
// =============================================================================

export function setTheme(themeName) {
  const validThemes = ['modern-slate', 'emerald-store', 'sapphire-blue', 'warm-amber'];
  if (!validThemes.includes(themeName)) themeName = 'modern-slate';

  document.documentElement.setAttribute('data-theme', themeName);
  APP_STATE.activeTheme = themeName;
  localStorage.setItem('al_theme', themeName);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const themeColors = {
      'modern-slate': '#0b1120',
      'emerald-store': '#f0fdf4',
      'sapphire-blue': '#060d1f',
      'warm-amber': '#fffbeb'
    };
    metaTheme.setAttribute('content', themeColors[themeName] || '#0b1120');
  }

  document.querySelectorAll('.theme-choice-card').forEach(card => {
    const choice = card.getAttribute('data-theme-choice');
    if (choice === themeName) {
      card.classList.add('ring-2', 'ring-sky-400');
    } else {
      card.classList.remove('ring-2', 'ring-sky-400');
    }
  });

  logDebug(`Theme applied: ${themeName}`);
}

function initTheme() {
  const savedTheme = localStorage.getItem('al_theme') || 'modern-slate';
  setTheme(savedTheme);

  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const choice = button.getAttribute('data-theme-choice');
      setTheme(choice);
      showToast(`Switched theme to ${button.querySelector('.font-bold').textContent}`, 'info');
    });
  });
}

// =============================================================================
// 5. LIVE LKR CLOCK & NETWORK STATUS
// =============================================================================

function startLiveClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  function update() {
    const now = new Date();
    const tzOffset = 5.5 * 60;
    const lkTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
    
    const timeStr = lkTime.toTimeString().split(' ')[0] + ' LK';
    const dateStr = lkTime.toISOString().split('T')[0];

    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
  }

  update();
  setInterval(update, 1000);
}

function initNetworkMonitor() {
  const syncBadge = document.getElementById('syncBadge');
  const syncText = document.getElementById('syncStatusText');
  const mobileSyncBadge = document.getElementById('mobileSyncBadge');

  function updateStatus(isOnline) {
    if (isOnline) {
      if (syncBadge) {
        syncBadge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        syncText.textContent = 'Cloud Live';
      }
      if (mobileSyncBadge) {
        mobileSyncBadge.className = 'sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
      logDebug('Network online: Sync active', 'SUCCESS');
    } else {
      if (syncBadge) {
        syncBadge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20';
        syncText.textContent = 'Offline Cache';
      }
      if (mobileSyncBadge) {
        mobileSyncBadge.className = 'sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20';
      }
      logDebug('Network offline: Using local cache', 'WARN');
    }
  }

  window.addEventListener('online', () => updateStatus(true));
  window.addEventListener('offline', () => updateStatus(false));
  updateStatus(navigator.onLine);
}

// =============================================================================
// 6. AUTHENTICATION GUARD & FLOWS
// =============================================================================

function setupAuth() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtnSpinner = document.getElementById('loginBtnSpinner');
  const loginBtnText = document.getElementById('loginBtnText');
  const userEmailBadge = document.getElementById('userEmailBadge');
  const signOutBtn = document.getElementById('signOutBtn');

  // Toggle Password Visibility
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginPassword = document.getElementById('loginPassword');
  if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = loginPassword.type === 'password';
      loginPassword.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  // Handle Custom Firebase API Key
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const customApiKeyInput = document.getElementById('customApiKeyInput');
  const savedKey = localStorage.getItem('al_firebase_api_key');
  if (savedKey && customApiKeyInput) {
    customApiKeyInput.value = savedKey;
  }
  if (saveApiKeyBtn && customApiKeyInput) {
    saveApiKeyBtn.addEventListener('click', () => {
      const newKey = customApiKeyInput.value.trim();
      if (!newKey) {
        showToast('Please enter a valid Firebase API Key', 'error');
        return;
      }
      updateFirebaseApiKey(newKey);
    });
  }

  // Firebase Auth State Observer
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        APP_STATE.currentUser = user;
        logDebug(`Authenticated as: ${user.email}`, 'SUCCESS');
        
        loginScreen.classList.add('hidden');
        appShell.classList.remove('hidden');

        if (userEmailBadge) userEmailBadge.textContent = user.email;

        // Initialize Firestore Data Listeners
        initRealtimeListeners();
      } else {
        APP_STATE.currentUser = null;
        logDebug('No active session. Presenting Login Screen.');

        appShell.classList.add('hidden');
        loginScreen.classList.remove('hidden');

        detachAllListeners();
      }
    });
  } else {
    logDebug('Firebase Auth not initialized. Verify API key.', 'ERROR');
  }

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlert.classList.add('hidden');
      loginAlert.textContent = '';

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!auth) {
        loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/10 text-red-400 border border-red-500/20 block';
        loginAlert.textContent = 'Firebase is not initialized. Please configure your Web API Key below.';
        return;
      }

      loginBtnSpinner.classList.remove('hidden');
      loginBtnText.textContent = 'Verifying Credentials...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast(`Signed in: ${email}`, 'success');
      } catch (error) {
        logDebug(`Authentication failed: ${error.code}`, 'ERROR');
        loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/10 text-red-400 border border-red-500/20 block';
        
        let errorMsg = 'Failed to sign in. Please verify your email and password.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          errorMsg = 'Invalid email or password.';
        } else if (error.code === 'auth/user-not-found') {
          errorMsg = 'No user record found for this email address.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = 'Account temporarily blocked due to repeated failures. Try again later or reset password.';
        }
        loginAlert.textContent = errorMsg;
      } finally {
        loginBtnSpinner.classList.add('hidden');
        loginBtnText.textContent = 'Sign In to Counter Ledger';
      }
    });
  }

  // Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out of the AL Communication counter?')) {
        try {
          await signOut(auth);
          closeSettingsModal();
          showToast('Signed out successfully', 'info');
        } catch (err) {
          showToast(`Error signing out: ${err.message}`, 'error');
        }
      }
    });
  }

  // Password Reset Flow
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const passwordResetModal = document.getElementById('passwordResetModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const passwordResetForm = document.getElementById('passwordResetForm');

  if (forgotPasswordBtn && passwordResetModal) {
    forgotPasswordBtn.addEventListener('click', () => {
      passwordResetModal.classList.remove('hidden');
    });
  }
  if (cancelResetBtn && passwordResetModal) {
    cancelResetBtn.addEventListener('click', () => {
      passwordResetModal.classList.add('hidden');
    });
  }
  if (passwordResetForm) {
    passwordResetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmailInput').value.trim();
      try {
        await sendPasswordResetEmail(auth, email);
        showToast(`Reset link sent to ${email}`, 'success');
        passwordResetModal.classList.add('hidden');
      } catch (err) {
        showToast(`Reset error: ${err.message}`, 'error');
      }
    });
  }

  // Account Security inside Settings
  setupAccountSecurity();
}

function setupAccountSecurity() {
  const updateEmailForm = document.getElementById('updateEmailForm');
  const updatePasswordForm = document.getElementById('updatePasswordForm');

  if (updateEmailForm) {
    updateEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('newEmailInput').value.trim();
      if (!newEmail || !auth.currentUser) return;

      try {
        await updateEmail(auth.currentUser, newEmail);
        showToast(`Account email updated to ${newEmail}`, 'success');
        updateEmailForm.reset();
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
          promptReauthAndRetry(() => updateEmail(auth.currentUser, newEmail));
        } else {
          showToast(`Failed to update email: ${err.message}`, 'error');
        }
      }
    });
  }

  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPass = document.getElementById('newPasswordInput').value;
      const confirmPass = document.getElementById('confirmPasswordInput').value;

      if (newPass !== confirmPass) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (newPass.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        await updatePassword(auth.currentUser, newPass);
        showToast('Password successfully updated', 'success');
        updatePasswordForm.reset();
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
          promptReauthAndRetry(() => updatePassword(auth.currentUser, newPass));
        } else {
          showToast(`Failed to change password: ${err.message}`, 'error');
        }
      }
    });
  }
}

async function promptReauthAndRetry(actionCallback) {
  const currentPassword = prompt('Security Verification: Please re-enter your current password to authorize this update:');
  if (!currentPassword) return;

  try {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await actionCallback();
    showToast('Credentials verified and update applied', 'success');
  } catch (err) {
    showToast(`Verification failed: ${err.message}`, 'error');
  }
}

// =============================================================================
// 7. NAVIGATION & VIEW SWITCHING
// =============================================================================

export function switchView(viewName) {
  const views = ['dashboard', 'stationery', 'reloads', 'stock', 'logs'];
  if (!views.includes(viewName)) viewName = 'dashboard';

  APP_STATE.activeView = viewName;

  document.querySelectorAll('.app-view').forEach(viewEl => {
    viewEl.classList.add('hidden');
  });

  const targetView = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (targetView) targetView.classList.remove('hidden');

  // Desktop Header Nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'nav-tab-btn active px-3.5 py-1.5 rounded-lg theme-bg-accent text-white transition';
    } else {
      btn.className = 'nav-tab-btn px-3.5 py-1.5 rounded-lg theme-text-muted hover:theme-text-main transition';
    }
  });

  // Mobile Bottom Nav buttons
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'mobile-nav-btn active flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-accent';
    } else {
      btn.className = 'mobile-nav-btn flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-text-muted';
    }
  });

  // View specific triggers
  if (viewName === 'stock') {
    renderStockTable();
  } else if (viewName === 'logs') {
    applyMasterLogFilters();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  logDebug(`Switched view to: ${viewName}`);
}

function initNavigation() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
  });

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
  });

  const headerHomeBtn = document.getElementById('headerHomeBtn');
  if (headerHomeBtn) {
    headerHomeBtn.addEventListener('click', () => switchView('dashboard'));
  }

  // Dashboard Operational Shortcut Tiles
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

  // Settings Modal Controls
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
  if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);

  const stockOpenCatalogSettingsBtn = document.getElementById('stockOpenCatalogSettingsBtn');
  if (stockOpenCatalogSettingsBtn) {
    stockOpenCatalogSettingsBtn.addEventListener('click', () => {
      openSettingsModal();
      switchSettingsTab('catalog');
    });
  }

  // Settings Sub-panel Tabs
  document.querySelectorAll('[data-settings-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => switchSettingsTab(tabBtn.getAttribute('data-settings-tab')));
  });

  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.remove('hidden');
    updateCacheMetrics();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
}

function switchSettingsTab(tabName) {
  const tabs = ['catalog', 'rates', 'security', 'themes', 'developer'];
  if (!tabs.includes(tabName)) tabName = 'catalog';

  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const targetPanel = document.getElementById(`settingsPanel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetPanel) targetPanel.classList.remove('hidden');

  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-settings-tab') === tabName) {
      btn.className = 'settings-tab-btn active px-3 py-1.5 rounded-lg border theme-border theme-bg-accent text-white transition whitespace-nowrap';
    } else {
      btn.className = 'settings-tab-btn px-3 py-1.5 rounded-lg border theme-border theme-text-muted hover:theme-text-main transition whitespace-nowrap';
    }
  });
}

// =============================================================================
// 8. FIRESTORE REAL-TIME LISTENERS & DATA SYNC
// =============================================================================

function detachAllListeners() {
  Object.keys(APP_STATE.unsubscribers).forEach(key => {
    if (typeof APP_STATE.unsubscribers[key] === 'function') {
      APP_STATE.unsubscribers[key]();
      APP_STATE.unsubscribers[key] = null;
    }
  });
}

function initRealtimeListeners() {
  detachAllListeners();

  const today = getTodayDateString();
  APP_STATE.currentDate = today;

  // Set default analytics month to current (YYYY-MM)
  const currentMonth = today.substring(0, 7);
  APP_STATE.analyticsMonth = currentMonth;
  const monthPicker = document.getElementById('analyticsMonthPicker');
  if (monthPicker) monthPicker.value = currentMonth;

  // Set default log dates
  APP_STATE.logDateFrom = today;
  APP_STATE.logDateTo = today;
  const logFrom = document.getElementById('logDateFrom');
  const logTo = document.getElementById('logDateTo');
  if (logFrom) logFrom.value = today;
  if (logTo) logTo.value = today;

  // 1. Commission Rates Listener
  listenToCommissions();

  // 2. Master Inventory Catalog Listener
  listenToInventory();

  // 3. Today's Stationery Feed Listener
  listenToTodayStationery(today);

  // 4. Today's Reload Feed Listener
  listenToTodayReloads(today);

  // 5. Master Stationery & Reload Collections for Logs and Analytics
  listenToMasterLogs();
}

function listenToCommissions() {
  if (!db) return;
  const commissionsDocRef = doc(db, 'settings', 'commissions');

  APP_STATE.unsubscribers.commissions = onSnapshot(commissionsDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      APP_STATE.commissionRates = {
        AIRTEL: Number(data.airtel ?? 6.80),
        DIALOG: Number(data.dialog ?? 3.80),
        MOBITEL: Number(data.mobitel ?? 6.80),
        HUTCH: Number(data.hutch ?? 5.00)
      };
      logDebug('Commission rates synced from Firestore', 'SUCCESS');
    } else {
      setDoc(commissionsDocRef, {
        airtel: 6.80,
        dialog: 3.80,
        mobitel: 6.80,
        hutch: 5.00,
        updatedAt: serverTimestamp()
      }).catch(err => logDebug(`Init commissions failed: ${err.message}`, 'WARN'));
    }
    updateCommissionUI();
  }, (err) => {
    logDebug(`Commissions listener error: ${err.message}`, 'ERROR');
  });
}

function listenToInventory() {
  if (!db) return;
  const invColRef = collection(db, 'inventory');

  APP_STATE.unsubscribers.inventory = onSnapshot(invColRef, (snap) => {
    const items = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        code: data.code || '',
        name: data.name || '',
        sellingPrice: Number(data.sellingPrice || 0),
        stockQuantity: Number(data.stockQuantity || 0)
      });
    });

    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    APP_STATE.inventoryCatalog = items;

    // Refresh stock previews, stock table, catalog table, and dashboard KPIs
    updateStockPreviews();
    renderStockTable();
    renderCatalogTable();
    updateDashboardCatalogKPIs();
    logDebug(`Inventory catalog synced: ${items.length} items`);
  }, (err) => {
    logDebug(`Inventory listener error: ${err.message}`, 'ERROR');
  });
}

function listenToTodayStationery(todayDate) {
  if (!db) return;
  const statColRef = collection(db, 'stationery_transactions');
  const q = query(statColRef, where('date', '==', todayDate));

  APP_STATE.unsubscribers.todayStationery = onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.todayStationeryTransactions = list;

    updateStationeryConsolidatedSummary();
    updateDashboardFinancialKPIs();
  }, (err) => {
    logDebug(`Today stationery listener error: ${err.message}`, 'ERROR');
  });
}

function listenToTodayReloads(todayDate) {
  if (!db) return;
  const reloadColRef = collection(db, 'reload_transactions');
  const q = query(reloadColRef, where('date', '==', todayDate));

  APP_STATE.unsubscribers.todayReloads = onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.todayReloadTransactions = list;

    updateReloadConsolidatedSummary();
    updateDashboardFinancialKPIs();
  }, (err) => {
    logDebug(`Today reloads listener error: ${err.message}`, 'ERROR');
  });
}

function listenToMasterLogs() {
  if (!db) return;

  // Listen to all stationery transactions
  const statColRef = collection(db, 'stationery_transactions');
  APP_STATE.unsubscribers.masterStationery = onSnapshot(statColRef, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    APP_STATE.masterStationeryRecords = list;
    applyMasterLogFilters();
    calculateFinancialAnalytics();
  });

  // Listen to all reload transactions
  const reloadColRef = collection(db, 'reload_transactions');
  APP_STATE.unsubscribers.masterReloads = onSnapshot(reloadColRef, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    APP_STATE.masterReloadRecords = list;
    applyMasterLogFilters();
    calculateFinancialAnalytics();
  });
}

// =============================================================================
// 9. MODULE 2: STATIONERY ENTRY & QUANTITY ADDER
// =============================================================================

function setupStationeryModule() {
  const posItemInput = document.getElementById('posItemInput');
  const posAutocompleteList = document.getElementById('posAutocompleteList');
  const posSellingPrice = document.getElementById('posSellingPrice');
  const posQuantity = document.getElementById('posQuantity');
  const posTotalAmountPreview = document.getElementById('posTotalAmountPreview');
  const posStockStatusBadge = document.getElementById('posStockStatusBadge');
  const posItemBadge = document.getElementById('posItemBadge');
  const stationeryEntryForm = document.getElementById('stationeryEntryForm');
  const posQtyDecBtn = document.getElementById('posQtyDecBtn');
  const posQtyIncBtn = document.getElementById('posQtyIncBtn');

  // Quantity Stepper Handlers
  if (posQtyDecBtn && posQuantity) {
    posQtyDecBtn.addEventListener('click', () => {
      const current = Math.max(1, (parseInt(posQuantity.value, 10) || 1) - 1);
      posQuantity.value = current;
      calculatePosTotal();
    });
  }

  if (posQtyIncBtn && posQuantity) {
    posQtyIncBtn.addEventListener('click', () => {
      const current = (parseInt(posQuantity.value, 10) || 1) + 1;
      posQuantity.value = current;
      calculatePosTotal();
    });
  }

  // Quick Quantity Pills (1, 2, 5, 10)
  document.querySelectorAll('[data-qty-pill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qty = parseInt(btn.getAttribute('data-qty-pill'), 10) || 1;
      if (posQuantity) {
        posQuantity.value = qty;
        calculatePosTotal();
      }
    });
  });

  function calculatePosTotal() {
    const price = Number(posSellingPrice.value) || 0;
    const qty = Math.max(1, parseInt(posQuantity.value, 10) || 1);
    const total = roundCurrency(price * qty);
    if (posTotalAmountPreview) posTotalAmountPreview.textContent = formatLKR(total);
  }

  if (posSellingPrice) posSellingPrice.addEventListener('input', calculatePosTotal);
  if (posQuantity) posQuantity.addEventListener('input', calculatePosTotal);

  // Autocomplete Filtering with Full Keyboard Navigation
  let highlightedIndex = -1;
  let currentMatches = [];

  function updateAutocompleteHighlight() {
    const items = posAutocompleteList.querySelectorAll('.autocomplete-item');
    items.forEach((itemEl, idx) => {
      if (idx === highlightedIndex) {
        itemEl.classList.add('bg-sky-500/20');
        itemEl.scrollIntoView({ block: 'nearest' });
      } else {
        itemEl.classList.remove('bg-sky-500/20');
      }
    });
  }

  function selectCatalogItem(item) {
    posItemInput.value = item.name;
    posSellingPrice.value = Number(item.sellingPrice).toFixed(2);
    APP_STATE.selectedCatalogItem = item;

    if (posItemBadge) {
      posItemBadge.textContent = item.code;
      posItemBadge.classList.remove('hidden');
    }

    renderPosStockBadge(item.stockQuantity);
    posAutocompleteList.classList.add('hidden');
    calculatePosTotal();
  }

  function renderPosStockBadge(stockQty) {
    if (!posStockStatusBadge) return;
    posStockStatusBadge.classList.remove('hidden');

    if (stockQty > 5) {
      posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-in';
      posStockStatusBadge.textContent = `In Stock: ${stockQty} units`;
    } else if (stockQty > 0) {
      posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-low';
      posStockStatusBadge.textContent = `Low Stock: ${stockQty} units`;
    } else {
      posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-out';
      posStockStatusBadge.textContent = `Out of Stock (0 units)`;
    }
  }

  if (posItemInput && posAutocompleteList) {
    posItemInput.addEventListener('input', () => {
      const queryStr = posItemInput.value.trim().toLowerCase();
      highlightedIndex = -1;

      if (!queryStr) {
        posAutocompleteList.classList.add('hidden');
        posAutocompleteList.innerHTML = '';
        currentMatches = [];
        if (posItemBadge) posItemBadge.classList.add('hidden');
        if (posStockStatusBadge) posStockStatusBadge.classList.add('hidden');
        APP_STATE.selectedCatalogItem = null;
        return;
      }

      currentMatches = APP_STATE.inventoryCatalog.filter(item => {
        const cMatch = (item.code || '').toLowerCase().includes(queryStr);
        const nMatch = (item.name || '').toLowerCase().includes(queryStr);
        return cMatch || nMatch;
      }).slice(0, 8);

      if (currentMatches.length === 0) {
        posAutocompleteList.innerHTML = `
          <div class="p-3 text-xs theme-text-dim text-center">
            No matching inventory item found. Custom sale entry.
          </div>
        `;
        posAutocompleteList.classList.remove('hidden');
        if (posStockStatusBadge) {
          posStockStatusBadge.className = 'text-xs font-semibold px-2 py-0.5 rounded-full theme-bg-subtle theme-text-dim';
          posStockStatusBadge.textContent = 'Custom Item';
          posStockStatusBadge.classList.remove('hidden');
        }
        return;
      }

      posAutocompleteList.innerHTML = '';
      currentMatches.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'autocomplete-item flex items-center justify-between gap-2';

        let stockPill = item.stockQuantity > 5 
          ? `<span class="badge-stock-in px-1.5 py-0.5 rounded text-[10px] font-bold">${item.stockQuantity} in stock</span>`
          : (item.stockQuantity > 0 
              ? `<span class="badge-stock-low px-1.5 py-0.5 rounded text-[10px] font-bold">${item.stockQuantity} left</span>`
              : `<span class="badge-stock-out px-1.5 py-0.5 rounded text-[10px] font-bold">Out of stock</span>`);

        itemRow.innerHTML = `
          <div>
            <div class="font-bold text-xs theme-text-main">${item.name}</div>
            <div class="text-[11px] font-mono theme-text-muted">Code: <span class="text-sky-400 font-bold">${item.code}</span></div>
          </div>
          <div class="text-right flex flex-col items-end gap-1">
            <div class="text-xs font-mono font-bold text-emerald-400">${formatLKR(item.sellingPrice)}</div>
            ${stockPill}
          </div>
        `;

        itemRow.addEventListener('click', () => {
          selectCatalogItem(item);
          posSellingPrice.focus();
        });
        posAutocompleteList.appendChild(itemRow);
      });

      posAutocompleteList.classList.remove('hidden');
    });

    // Enter-Key Auto-Add Bug Fix & Keyboard Stepping
    posItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        if (!posAutocompleteList.classList.contains('hidden') && currentMatches.length > 0) {
          e.preventDefault();
          highlightedIndex = (highlightedIndex + 1) % currentMatches.length;
          updateAutocompleteHighlight();
        }
      } else if (e.key === 'ArrowUp') {
        if (!posAutocompleteList.classList.contains('hidden') && currentMatches.length > 0) {
          e.preventDefault();
          highlightedIndex = (highlightedIndex - 1 + currentMatches.length) % currentMatches.length;
          updateAutocompleteHighlight();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        
        // 1. If dropdown is open and an item is highlighted, select it
        if (!posAutocompleteList.classList.contains('hidden') && highlightedIndex >= 0 && currentMatches[highlightedIndex]) {
          selectCatalogItem(currentMatches[highlightedIndex]);
          posAutocompleteList.classList.add('hidden');
          return;
        }

        // 2. Check if the typed string exactly matches an item code or name
        const inputVal = posItemInput.value.trim().toLowerCase();
        const exactMatch = APP_STATE.inventoryCatalog.find(i => 
          (i.code || '').toLowerCase() === inputVal || 
          (i.name || '').toLowerCase() === inputVal
        );

        if (exactMatch && (!APP_STATE.selectedCatalogItem || APP_STATE.selectedCatalogItem.code !== exactMatch.code)) {
          selectCatalogItem(exactMatch);
          posAutocompleteList.classList.add('hidden');
          return;
        }

        // 3. If first match exists in autocomplete list, auto-select it
        if (!APP_STATE.selectedCatalogItem && currentMatches.length > 0) {
          selectCatalogItem(currentMatches[0]);
          posAutocompleteList.classList.add('hidden');
          return;
        }

        // 4. If an item is already selected or form is ready, submit directly!
        if (posItemInput.value.trim() && Number(posSellingPrice.value) > 0) {
          posAutocompleteList.classList.add('hidden');
          stationeryEntryForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      } else if (e.key === 'Escape') {
        posAutocompleteList.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!posItemInput.contains(e.target) && !posAutocompleteList.contains(e.target)) {
        posAutocompleteList.classList.add('hidden');
      }
    });
  }

  // Stationery Sale Submission & Real-Time Stock Deduction
  if (stationeryEntryForm) {
    stationeryEntryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemName = posItemInput.value.trim();
      const sellingPrice = roundCurrency(posSellingPrice.value);
      const quantity = Math.max(1, parseInt(posQuantity.value, 10) || 1);
      const totalAmount = roundCurrency(sellingPrice * quantity);
      const matchedItem = APP_STATE.selectedCatalogItem;
      const itemCode = matchedItem ? matchedItem.code : 'CUSTOM';

      if (!itemName) {
        showToast('Please specify an item name or code', 'error');
        return;
      }
      if (sellingPrice <= 0) {
        showToast('Please enter a valid selling price', 'error');
        return;
      }

      // Check stock level if matched to catalog item
      if (matchedItem && matchedItem.stockQuantity < quantity) {
        if (!confirm(`Warning: Only ${matchedItem.stockQuantity} units available in stock for "${matchedItem.name}". Proceed with logging sale of ${quantity} units?`)) {
          return;
        }
      }

      const transactionPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        itemCode: itemCode,
        itemName: itemName,
        quantity: quantity,
        sellingPrice: sellingPrice,
        totalAmount: totalAmount,
        timestamp: serverTimestamp()
      };

      try {
        // 1. Add Stationery Transaction Record to Firestore
        await addDoc(collection(db, 'stationery_transactions'), transactionPayload);

        // 2. Automatically Deduct Sold Quantity from Inventory in Firestore
        if (matchedItem && matchedItem.id) {
          const itemDocRef = doc(db, 'inventory', matchedItem.id);
          await updateDoc(itemDocRef, {
            stockQuantity: increment(-quantity),
            updatedAt: serverTimestamp()
          });
          const remainingStock = Math.max(0, matchedItem.stockQuantity - quantity);
          showToast(`Logged sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)}) • Stock: ${remainingStock}`, 'success');
        } else {
          showToast(`Logged custom sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)})`, 'success');
        }

        // Reset Entry Form
        stationeryEntryForm.reset();
        APP_STATE.selectedCatalogItem = null;
        if (posItemBadge) posItemBadge.classList.add('hidden');
        if (posStockStatusBadge) posStockStatusBadge.classList.add('hidden');
        if (posQuantity) posQuantity.value = '1';
        if (posTotalAmountPreview) posTotalAmountPreview.textContent = 'Rs. 0.00';
        posItemInput.focus();
      } catch (err) {
        logDebug(`Error recording stationery sale: ${err.message}`, 'ERROR');
        showToast(`Failed to log sale: ${err.message}`, 'error');
      }
    });
  }

  // Setup Edit Stationery Transaction Modal
  setupEditStationeryModal();
}

function updateStockPreviews() {
  if (APP_STATE.selectedCatalogItem) {
    const updated = APP_STATE.inventoryCatalog.find(i => i.id === APP_STATE.selectedCatalogItem.id);
    if (updated) {
      APP_STATE.selectedCatalogItem = updated;
      const posStockStatusBadge = document.getElementById('posStockStatusBadge');
      if (posStockStatusBadge) {
        if (updated.stockQuantity > 5) {
          posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-in';
          posStockStatusBadge.textContent = `In Stock: ${updated.stockQuantity} units`;
        } else if (updated.stockQuantity > 0) {
          posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-low';
          posStockStatusBadge.textContent = `Low Stock: ${updated.stockQuantity} units`;
        } else {
          posStockStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full badge-stock-out';
          posStockStatusBadge.textContent = `Out of Stock (0 units)`;
        }
      }
    }
  }
}

function updateStationeryConsolidatedSummary() {
  let totalSales = 0;
  let totalUnits = 0;
  const count = APP_STATE.todayStationeryTransactions.length;

  APP_STATE.todayStationeryTransactions.forEach(t => {
    totalSales += Number(t.totalAmount || t.sellingPrice || 0);
    totalUnits += Number(t.quantity || 1);
  });

  const statTodayTotalSales = document.getElementById('statTodayTotalSales');
  const statTodayUnitsSold = document.getElementById('statTodayUnitsSold');
  const statTodayTxCount = document.getElementById('statTodayTxCount');
  const statRecentFeed = document.getElementById('statRecentFeed');

  if (statTodayTotalSales) statTodayTotalSales.textContent = formatLKR(roundCurrency(totalSales));
  if (statTodayUnitsSold) statTodayUnitsSold.textContent = totalUnits.toLocaleString();
  if (statTodayTxCount) statTodayTxCount.textContent = count.toLocaleString();

  // Render Recent 5 Sales Feed
  if (statRecentFeed) {
    if (count === 0) {
      statRecentFeed.innerHTML = `
        <div class="p-3 text-xs text-center theme-text-dim rounded-xl border theme-border">
          No stationery sales recorded yet today.
        </div>
      `;
      return;
    }

    statRecentFeed.innerHTML = '';
    APP_STATE.todayStationeryTransactions.slice(0, 5).forEach(item => {
      const row = document.createElement('div');
      row.className = 'p-2.5 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs';
      row.innerHTML = `
        <div>
          <div class="font-bold theme-text-main">${item.itemName}</div>
          <div class="text-[11px] theme-text-dim font-mono">${item.time || '--:--'} • Code: ${item.itemCode || 'ST'} • Qty: ${item.quantity || 1}</div>
        </div>
        <div class="font-mono font-bold text-emerald-400">
          ${formatLKR(item.totalAmount || item.sellingPrice)}
        </div>
      `;
      statRecentFeed.appendChild(row);
    });
  }
}

// =============================================================================
// 10. MODULE 3: MOBILE RELOADS
// =============================================================================

function setupReloadModule() {
  const reloadEntryForm = document.getElementById('reloadEntryForm');
  const reloadAmountInput = document.getElementById('reloadAmountInput');
  const reloadCommissionPreview = document.getElementById('reloadCommissionPreview');
  const reloadActiveRatePreview = document.getElementById('reloadActiveRatePreview');

  // Operator Select Buttons
  document.querySelectorAll('[data-select-op]').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.getAttribute('data-select-op');
      APP_STATE.activeReloadOperator = op;

      document.querySelectorAll('[data-select-op]').forEach(b => {
        b.classList.remove('ring-2', 'ring-sky-400', 'theme-bg-elevated');
      });
      btn.classList.add('ring-2', 'ring-sky-400', 'theme-bg-elevated');

      updateReloadRatePreview();
    });
  });

  // Preset Buttons (50, 100, 200, 500, 1000, 2000)
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-preset');
      if (reloadAmountInput) {
        reloadAmountInput.value = val;
        updateReloadRatePreview();
        reloadAmountInput.focus();
      }
    });
  });

  function updateReloadRatePreview() {
    const op = APP_STATE.activeReloadOperator;
    const rate = Number(APP_STATE.commissionRates[op]) || 0;
    const amount = Number(reloadAmountInput.value) || 0;
    const earned = roundCurrency((amount * rate) / 100);

    if (reloadActiveRatePreview) reloadActiveRatePreview.textContent = `${rate.toFixed(2)}%`;
    if (reloadCommissionPreview) reloadCommissionPreview.textContent = formatLKR(earned);
  }

  if (reloadAmountInput) {
    reloadAmountInput.addEventListener('input', updateReloadRatePreview);
  }

  // Submit Reload
  if (reloadEntryForm) {
    reloadEntryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = roundCurrency(reloadAmountInput.value);
      if (amount <= 0) {
        showToast('Please enter a valid reload amount', 'error');
        return;
      }

      const op = APP_STATE.activeReloadOperator;
      const rate = Number(APP_STATE.commissionRates[op]) || 0;
      const commissionAmount = roundCurrency((amount * rate) / 100);

      const reloadPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        operator: op,
        amount: amount,
        commissionRate: rate,
        commissionAmount: commissionAmount,
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'reload_transactions'), reloadPayload);
        showToast(`Recorded ${op} Reload: ${formatLKR(amount)} (Commission: ${formatLKR(commissionAmount)})`, 'success');

        reloadAmountInput.value = '';
        updateReloadRatePreview();
        reloadAmountInput.focus();
      } catch (err) {
        logDebug(`Error recording reload: ${err.message}`, 'ERROR');
        showToast(`Failed to record reload: ${err.message}`, 'error');
      }
    });
  }

  updateReloadRatePreview();
}

function updateReloadConsolidatedSummary() {
  let totalVolume = 0;
  let totalCommission = 0;
  const opTotals = { AIRTEL: 0, DIALOG: 0, MOBITEL: 0, HUTCH: 0 };

  APP_STATE.todayReloadTransactions.forEach(r => {
    const amt = Number(r.amount || 0);
    const comm = Number(r.commissionAmount || 0);
    totalVolume += amt;
    totalCommission += comm;

    if (opTotals[r.operator] !== undefined) {
      opTotals[r.operator] += amt;
    }
  });

  const reloadTodayVolume = document.getElementById('reloadTodayVolume');
  const reloadTodayCommission = document.getElementById('reloadTodayCommission');
  const reloadTodayAirtel = document.getElementById('reloadTodayAirtel');
  const reloadTodayDialog = document.getElementById('reloadTodayDialog');
  const reloadTodayMobitel = document.getElementById('reloadTodayMobitel');
  const reloadTodayHutch = document.getElementById('reloadTodayHutch');

  if (reloadTodayVolume) reloadTodayVolume.textContent = formatLKR(roundCurrency(totalVolume));
  if (reloadTodayCommission) reloadTodayCommission.textContent = formatLKR(roundCurrency(totalCommission));
  if (reloadTodayAirtel) reloadTodayAirtel.textContent = formatLKR(roundCurrency(opTotals.AIRTEL));
  if (reloadTodayDialog) reloadTodayDialog.textContent = formatLKR(roundCurrency(opTotals.DIALOG));
  if (reloadTodayMobitel) reloadTodayMobitel.textContent = formatLKR(roundCurrency(opTotals.MOBITEL));
  if (reloadTodayHutch) reloadTodayHutch.textContent = formatLKR(roundCurrency(opTotals.HUTCH));
}

// =============================================================================
// 11. MODULE 4: STOCK INVENTORY LEVELS VIEW
// =============================================================================

function setupStockModule() {
  const stockSearchInput = document.getElementById('stockSearchInput');
  if (stockSearchInput) {
    stockSearchInput.addEventListener('input', renderStockTable);
  }

  document.querySelectorAll('.stock-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-stock-filter');
      APP_STATE.stockFilter = filter;

      document.querySelectorAll('.stock-filter-btn').forEach(b => {
        b.classList.remove('active', 'theme-bg-subtle');
      });
      btn.classList.add('active', 'theme-bg-subtle');

      renderStockTable();
    });
  });
}

function renderStockTable() {
  const tbody = document.getElementById('stockTableBody');
  const searchInput = document.getElementById('stockSearchInput');
  const queryStr = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!tbody) return;
  tbody.innerHTML = '';

  let filtered = APP_STATE.inventoryCatalog.filter(item => {
    if (!queryStr) return true;
    return (item.code || '').toLowerCase().includes(queryStr) ||
           (item.name || '').toLowerCase().includes(queryStr);
  });

  // Apply Stock level filter
  if (APP_STATE.stockFilter === 'LOW') {
    filtered = filtered.filter(i => i.stockQuantity > 0 && i.stockQuantity <= 5);
  } else if (APP_STATE.stockFilter === 'OUT') {
    filtered = filtered.filter(i => i.stockQuantity <= 0);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center theme-text-dim">
          No stock items matching current filter.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    let statusBadge = '';
    if (item.stockQuantity > 5) {
      statusBadge = '<span class="badge-stock-in px-2.5 py-0.5 rounded-full font-bold">In Stock</span>';
    } else if (item.stockQuantity > 0) {
      statusBadge = '<span class="badge-stock-low px-2.5 py-0.5 rounded-full font-bold">Low Stock</span>';
    } else {
      statusBadge = '<span class="badge-stock-out px-2.5 py-0.5 rounded-full font-bold">Out of Stock</span>';
    }

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono font-bold text-sky-400 whitespace-nowrap">${item.code}</td>
      <td class="py-3 px-3 sm:px-4 font-medium theme-text-main">${item.name}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono font-bold theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-3 px-3 sm:px-4 text-center font-mono font-bold text-sm ${item.stockQuantity <= 5 ? 'text-amber-400' : 'theme-text-main'}">
        ${item.stockQuantity}
      </td>
      <td class="py-3 px-3 sm:px-4 text-center">${statusBadge}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap space-x-1">
        <button type="button" data-stock-add="5" data-item-id="${item.id}" class="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-mono font-bold text-xs" title="Add 5 units">+5</button>
        <button type="button" data-stock-add="10" data-item-id="${item.id}" class="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-mono font-bold text-xs" title="Add 10 units">+10</button>
        <button type="button" data-stock-custom="${item.id}" class="px-2 py-1 rounded theme-bg-subtle border theme-border hover:theme-bg-elevated text-xs font-semibold" title="Custom Restock">Custom</button>
      </td>
    `;

    // Quick restock handlers
    tr.querySelectorAll('[data-stock-add]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const addAmount = parseInt(btn.getAttribute('data-stock-add'), 10);
        await quickRestockItem(item.id, item.name, addAmount);
      });
    });

    const customBtn = tr.querySelector(`[data-stock-custom="${item.id}"]`);
    if (customBtn) {
      customBtn.addEventListener('click', async () => {
        const input = prompt(`Enter quantity to add to stock for "${item.name}":`, '20');
        if (input !== null) {
          const qty = parseInt(input, 10);
          if (!isNaN(qty) && qty > 0) {
            await quickRestockItem(item.id, item.name, qty);
          } else {
            showToast('Invalid quantity entered', 'error');
          }
        }
      });
    }

    tbody.appendChild(tr);
  });
}

async function quickRestockItem(itemId, itemName, quantityToAdd) {
  try {
    await updateDoc(doc(db, 'inventory', itemId), {
      stockQuantity: increment(quantityToAdd),
      updatedAt: serverTimestamp()
    });
    showToast(`Restocked ${itemName} (+${quantityToAdd} units)`, 'success');
  } catch (err) {
    showToast(`Restock error: ${err.message}`, 'error');
  }
}

// =============================================================================
// 12. MODULE 5: UNIFIED MASTER LOGS & PROFESSIONAL PDF GENERATION
// =============================================================================

function setupMasterLogsModule() {
  const logCatButtons = document.querySelectorAll('.log-cat-btn');
  const logFilterTodayBtn = document.getElementById('logFilterTodayBtn');
  const logFilterYesterdayBtn = document.getElementById('logFilterYesterdayBtn');
  const logFilterThisMonthBtn = document.getElementById('logFilterThisMonthBtn');
  const applyLogDateRangeBtn = document.getElementById('applyLogDateRangeBtn');
  const downloadPdfReportBtn = document.getElementById('downloadPdfReportBtn');

  // Category Filter
  logCatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-log-cat');
      APP_STATE.logCategoryFilter = cat;

      logCatButtons.forEach(b => {
        b.className = 'log-cat-btn px-3 py-1.5 rounded-lg border theme-border theme-text-muted hover:theme-text-main';
      });
      btn.className = 'log-cat-btn active px-3 py-1.5 rounded-lg border theme-border theme-bg-accent text-white';

      applyMasterLogFilters();
    });
  });

  // Quick Date Buttons
  if (logFilterTodayBtn) {
    logFilterTodayBtn.addEventListener('click', () => {
      const today = getTodayDateString();
      APP_STATE.logDateMode = 'TODAY';
      APP_STATE.logDateFrom = today;
      APP_STATE.logDateTo = today;
      document.getElementById('logDateFrom').value = today;
      document.getElementById('logDateTo').value = today;
      applyMasterLogFilters();
    });
  }

  if (logFilterYesterdayBtn) {
    logFilterYesterdayBtn.addEventListener('click', () => {
      const yesterday = getYesterdayDateString();
      APP_STATE.logDateMode = 'YESTERDAY';
      APP_STATE.logDateFrom = yesterday;
      APP_STATE.logDateTo = yesterday;
      document.getElementById('logDateFrom').value = yesterday;
      document.getElementById('logDateTo').value = yesterday;
      applyMasterLogFilters();
    });
  }

  if (logFilterThisMonthBtn) {
    logFilterThisMonthBtn.addEventListener('click', () => {
      const today = getTodayDateString();
      const firstDay = today.substring(0, 8) + '01';
      APP_STATE.logDateMode = 'THIS_MONTH';
      APP_STATE.logDateFrom = firstDay;
      APP_STATE.logDateTo = today;
      document.getElementById('logDateFrom').value = firstDay;
      document.getElementById('logDateTo').value = today;
      applyMasterLogFilters();
    });
  }

  // Apply Range Button
  if (applyLogDateRangeBtn) {
    applyLogDateRangeBtn.addEventListener('click', () => {
      const from = document.getElementById('logDateFrom').value;
      const to = document.getElementById('logDateTo').value;

      if (!from || !to) {
        showToast('Please select both From and To dates', 'error');
        return;
      }
      if (from > to) {
        showToast('From Date cannot be later than To Date', 'error');
        return;
      }

      APP_STATE.logDateMode = 'RANGE';
      APP_STATE.logDateFrom = from;
      APP_STATE.logDateTo = to;
      applyMasterLogFilters();
    });
  }

  // Download PDF Report
  if (downloadPdfReportBtn) {
    downloadPdfReportBtn.addEventListener('click', generateProfessionalPdfReport);
  }
}

function applyMasterLogFilters() {
  const fromDate = APP_STATE.logDateFrom || getTodayDateString();
  const toDate = APP_STATE.logDateTo || fromDate;

  // Filter stationery
  let filteredStationery = APP_STATE.masterStationeryRecords.filter(t => {
    return (t.date >= fromDate && t.date <= toDate);
  });

  // Filter reloads
  let filteredReloads = APP_STATE.masterReloadRecords.filter(r => {
    return (r.date >= fromDate && r.date <= toDate);
  });

  // Calculate filtered totals
  let statSales = 0;
  let unitsSold = 0;
  filteredStationery.forEach(s => {
    statSales += Number(s.totalAmount || s.sellingPrice || 0);
    unitsSold += Number(s.quantity || 1);
  });

  let reloadVol = 0;
  let reloadComm = 0;
  filteredReloads.forEach(r => {
    reloadVol += Number(r.amount || 0);
    reloadComm += Number(r.commissionAmount || 0);
  });

  const totalPeriodRevenue = roundCurrency(statSales + reloadComm);

  // Update Summary KPI Bar
  const sStatSales = document.getElementById('logSummaryStatSales');
  const sUnitsSold = document.getElementById('logSummaryUnitsSold');
  const sReloadVol = document.getElementById('logSummaryReloadVol');
  const sReloadComm = document.getElementById('logSummaryReloadComm');
  const sTotalRevenue = document.getElementById('logSummaryTotalRevenue');
  const filterLabel = document.getElementById('masterLogFilterLabel');

  if (sStatSales) sStatSales.textContent = formatLKR(roundCurrency(statSales));
  if (sUnitsSold) sUnitsSold.textContent = unitsSold.toLocaleString();
  if (sReloadVol) sReloadVol.textContent = formatLKR(roundCurrency(reloadVol));
  if (sReloadComm) sReloadComm.textContent = formatLKR(roundCurrency(reloadComm));
  if (sTotalRevenue) sTotalRevenue.textContent = formatLKR(totalPeriodRevenue);

  if (filterLabel) {
    filterLabel.textContent = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;
  }

  // Combine records chronologically
  let combinedRows = [];

  if (APP_STATE.logCategoryFilter === 'ALL' || APP_STATE.logCategoryFilter === 'STATIONERY') {
    filteredStationery.forEach(s => {
      combinedRows.push({
        id: s.id,
        category: 'STATIONERY',
        date: s.date || '',
        time: s.time || '',
        identifier: s.itemCode || 'ST',
        title: s.itemName || '',
        qtyOrRate: `${s.quantity || 1} units`,
        amount: Number(s.totalAmount || s.sellingPrice || 0),
        earnings: Number(s.totalAmount || s.sellingPrice || 0),
        rawRecord: s
      });
    });
  }

  if (APP_STATE.logCategoryFilter === 'ALL' || APP_STATE.logCategoryFilter === 'RELOAD') {
    filteredReloads.forEach(r => {
      combinedRows.push({
        id: r.id,
        category: 'RELOAD',
        date: r.date || '',
        time: r.time || '',
        identifier: r.operator || 'RELOAD',
        title: `${r.operator} Mobile Top-Up`,
        qtyOrRate: `${Number(r.commissionRate || 0).toFixed(2)}%`,
        amount: Number(r.amount || 0),
        earnings: Number(r.commissionAmount || 0),
        rawRecord: r
      });
    });
  }

  // Sort by Date descending, then Time descending
  combinedRows.sort((a, b) => {
    if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
    return (b.time || '').localeCompare(a.time || '');
  });

  const countBadge = document.getElementById('masterLogCountBadge');
  if (countBadge) countBadge.textContent = `${combinedRows.length} Records`;

  renderMasterLogTable(combinedRows);
}

function renderMasterLogTable(records) {
  const tbody = document.getElementById('masterLogTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center theme-text-dim">
          No records found for the selected date range and category.
        </td>
      </tr>
    `;
    return;
  }

  records.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    let typePill = row.category === 'STATIONERY'
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">Stationery</span>'
      : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Reload</span>';

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono text-xs whitespace-nowrap">
        <span class="theme-text-main font-semibold">${row.date}</span>
        <span class="theme-text-dim ml-1 font-normal">${row.time}</span>
      </td>
      <td class="py-3 px-3 sm:px-4 whitespace-nowrap">${typePill}</td>
      <td class="py-3 px-3 sm:px-4 font-mono text-xs font-bold text-sky-400 whitespace-nowrap">${row.identifier}</td>
      <td class="py-3 px-3 sm:px-4 font-medium theme-text-main">${row.title}</td>
      <td class="py-3 px-3 sm:px-4 text-center font-mono text-xs theme-text-muted">${row.qtyOrRate}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold theme-text-main">${formatLKR(row.amount)}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold text-emerald-400">${formatLKR(row.earnings)}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap space-x-1">
        ${row.category === 'STATIONERY' 
          ? `<button type="button" data-edit-log="${row.id}" class="p-1 text-sky-400 hover:text-sky-300 transition" title="Edit Record">
              <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
             </button>`
          : ''}
        <button type="button" data-delete-log="${row.id}" data-cat="${row.category}" class="p-1 text-red-400 hover:text-red-300 transition" title="Delete Record">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    // Edit button
    const editBtn = tr.querySelector(`[data-edit-log="${row.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => openEditStationeryModal(row.rawRecord));
    }

    // Delete button
    const delBtn = tr.querySelector(`[data-delete-log="${row.id}"]`);
    if (delBtn) {
      delBtn.addEventListener('click', () => deleteTransactionRecord(row.id, row.category, row.title));
    }

    tbody.appendChild(tr);
  });
}

async function deleteTransactionRecord(id, category, title) {
  if (!confirm(`Permanently delete ${category.toLowerCase()} record "${title}"?`)) return;

  const collectionName = category === 'STATIONERY' ? 'stationery_transactions' : 'reload_transactions';
  try {
    await deleteDoc(doc(db, collectionName, id));
    showToast(`Deleted ${title}`, 'info');
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// =============================================================================
// PROFESSIONAL PDF REPORT EXPORT ENGINE (jsPDF + AutoTable)
// =============================================================================

function generateProfessionalPdfReport() {
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    showToast('PDF generator library is loading, please try again in a moment.', 'error');
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
  const dateRangeStr = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;

  // Filter records
  const stationeryList = APP_STATE.masterStationeryRecords
    .filter(s => s.date >= fromDate && s.date <= toDate)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const reloadList = APP_STATE.masterReloadRecords
    .filter(r => r.date >= fromDate && r.date <= toDate)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Compute Totals
  let totalStatSales = 0;
  let totalUnitsSold = 0;
  stationeryList.forEach(s => {
    totalStatSales += Number(s.totalAmount || s.sellingPrice || 0);
    totalUnitsSold += Number(s.quantity || 1);
  });

  let totalReloadVolume = 0;
  let totalReloadCommission = 0;
  const opBreakdown = { AIRTEL: { vol: 0, comm: 0 }, DIALOG: { vol: 0, comm: 0 }, MOBITEL: { vol: 0, comm: 0 }, HUTCH: { vol: 0, comm: 0 } };

  reloadList.forEach(r => {
    const amt = Number(r.amount || 0);
    const comm = Number(r.commissionAmount || 0);
    totalReloadVolume += amt;
    totalReloadCommission += comm;

    if (opBreakdown[r.operator]) {
      opBreakdown[r.operator].vol += amt;
      opBreakdown[r.operator].comm += comm;
    }
  });

  const totalStoreRevenue = roundCurrency(totalStatSales + totalReloadCommission);

  // 1. PDF Header Banner
  pdfDoc.setFillColor(15, 23, 42); // Navy Slate
  pdfDoc.rect(0, 0, 210, 35, 'F');

  pdfDoc.setTextColor(255, 255, 255);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(20);
  pdfDoc.text('AL Communication', 14, 15);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor(203, 213, 225);
  pdfDoc.text('Retail Stationery & Mobile Reload Hub • Cloud Ledger al-p1-fb432', 14, 21);
  pdfDoc.text(`Statement Period: ${dateRangeStr} | Generated: ${new Date().toLocaleString()}`, 14, 27);

  // 2. Executive Financial Summary Cards (Draw Box)
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.setDrawColor(226, 232, 240);
  pdfDoc.roundedRect(14, 40, 182, 26, 3, 3, 'FD');

  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(10);
  pdfDoc.text('FINANCIAL STATEMENT SUMMARY', 18, 46);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(`Stationery Sales: ${formatLKR(totalStatSales)} (${totalUnitsSold} items)`, 18, 53);
  pdfDoc.text(`Reload Volume: ${formatLKR(totalReloadVolume)}`, 18, 59);

  pdfDoc.text(`Earned Reload Commission: ${formatLKR(totalReloadCommission)}`, 105, 53);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(5, 150, 105); // Emerald Green
  pdfDoc.text(`Total Period Revenue: ${formatLKR(totalStoreRevenue)}`, 105, 59);

  let currentY = 72;

  // 3. Stationery Sales Table
  if (stationeryList.length > 0) {
    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.text(`1. Stationery Sales Breakdown (${stationeryList.length} Transactions)`, 14, currentY);

    const statRows = stationeryList.map(s => [
      s.date,
      s.time,
      s.itemCode || 'ST',
      s.itemName,
      String(s.quantity || 1),
      formatLKR(s.sellingPrice),
      formatLKR(s.totalAmount || s.sellingPrice)
    ]);

    pdfDoc.autoTable({
      startY: currentY + 3,
      head: [['Date', 'Time', 'Code', 'Product / Item Name', 'Qty', 'Unit Price', 'Total Amount']],
      body: statRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 12;
  }

  // 4. Mobile Reload Table
  if (reloadList.length > 0) {
    if (currentY > 240) {
      pdfDoc.addPage();
      currentY = 20;
    }

    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.text(`2. Mobile Reload Log (${reloadList.length} Top-Ups)`, 14, currentY);

    const reloadRows = reloadList.map(r => [
      r.date,
      r.time,
      r.operator,
      formatLKR(r.amount),
      `${Number(r.commissionRate || 0).toFixed(2)}%`,
      formatLKR(r.commissionAmount)
    ]);

    pdfDoc.autoTable({
      startY: currentY + 3,
      head: [['Date', 'Time', 'Operator Network', 'Reload Amount', 'Commission Rate', 'Earned Commission']],
      body: reloadRows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 10;

    // Operator Breakdown Table
    if (currentY > 245) {
      pdfDoc.addPage();
      currentY = 20;
    }

    const opRows = [
      ['Airtel', `${APP_STATE.commissionRates.AIRTEL.toFixed(2)}%`, formatLKR(opBreakdown.AIRTEL.vol), formatLKR(opBreakdown.AIRTEL.comm)],
      ['Dialog', `${APP_STATE.commissionRates.DIALOG.toFixed(2)}%`, formatLKR(opBreakdown.DIALOG.vol), formatLKR(opBreakdown.DIALOG.comm)],
      ['Mobitel', `${APP_STATE.commissionRates.MOBITEL.toFixed(2)}%`, formatLKR(opBreakdown.MOBITEL.vol), formatLKR(opBreakdown.MOBITEL.comm)],
      ['Hutch', `${APP_STATE.commissionRates.HUTCH.toFixed(2)}%`, formatLKR(opBreakdown.HUTCH.vol), formatLKR(opBreakdown.HUTCH.comm)]
    ];

    pdfDoc.autoTable({
      startY: currentY,
      head: [['Network Operator', 'Applied Rate', 'Total Reload Volume', 'Total Earned Commission']],
      body: opRows,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // 5. Page Numbering Footer
  const pageCount = pdfDoc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdfDoc.setPage(i);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(148, 163, 184);
    pdfDoc.text(`AL Communication POS System • Page ${i} of ${pageCount}`, 14, 290);
  }

  // Save PDF
  const filename = `AL_Communication_Report_${dateRangeStr.replace(/\s+/g, '_')}.pdf`;
  pdfDoc.save(filename);
  showToast(`Downloaded statement: ${filename}`, 'success');
}

// =============================================================================
// 13. STORE FINANCIAL ANALYTICS (MONTHLY & YEARLY)
// =============================================================================

function setupAnalyticsModule() {
  const monthPicker = document.getElementById('analyticsMonthPicker');
  const refreshBtn = document.getElementById('refreshAnalyticsBtn');

  if (monthPicker) {
    monthPicker.addEventListener('change', () => {
      APP_STATE.analyticsMonth = monthPicker.value;
      calculateFinancialAnalytics();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', calculateFinancialAnalytics);
  }
}

function calculateFinancialAnalytics() {
  const selectedMonth = APP_STATE.analyticsMonth || getTodayDateString().substring(0, 7);
  const selectedYear = selectedMonth.substring(0, 4);

  // 1. Monthly Computations
  let mStatSales = 0;
  let mReloadVol = 0;
  let mReloadComm = 0;

  APP_STATE.masterStationeryRecords.forEach(s => {
    if ((s.date || '').startsWith(selectedMonth)) {
      mStatSales += Number(s.totalAmount || s.sellingPrice || 0);
    }
  });

  APP_STATE.masterReloadRecords.forEach(r => {
    if ((r.date || '').startsWith(selectedMonth)) {
      mReloadVol += Number(r.amount || 0);
      mReloadComm += Number(r.commissionAmount || 0);
    }
  });

  const mCombined = roundCurrency(mStatSales + mReloadComm);

  // 2. Yearly Computations (YTD)
  let yStatSales = 0;
  let yReloadVol = 0;
  let yReloadComm = 0;

  APP_STATE.masterStationeryRecords.forEach(s => {
    if ((s.date || '').startsWith(selectedYear)) {
      yStatSales += Number(s.totalAmount || s.sellingPrice || 0);
    }
  });

  APP_STATE.masterReloadRecords.forEach(r => {
    if ((r.date || '').startsWith(selectedYear)) {
      yReloadVol += Number(r.amount || 0);
      yReloadComm += Number(r.commissionAmount || 0);
    }
  });

  const yCombined = roundCurrency(yStatSales + yReloadComm);

  // Update DOM Elements
  const aMonthLabel = document.getElementById('analyticsMonthLabel');
  const aYearLabel = document.getElementById('analyticsYearLabel');
  const aMStat = document.getElementById('analyticsMonthlyStationery');
  const aMReload = document.getElementById('analyticsMonthlyReload');
  const aMComm = document.getElementById('analyticsMonthlyCommission');
  const aMCombined = document.getElementById('analyticsMonthlyCombined');

  const aYStat = document.getElementById('analyticsYearlyStationery');
  const aYReload = document.getElementById('analyticsYearlyReload');
  const aYComm = document.getElementById('analyticsYearlyCommission');
  const aYCombined = document.getElementById('analyticsYearlyCombined');

  if (aMonthLabel) aMonthLabel.textContent = selectedMonth;
  if (aYearLabel) aYearLabel.textContent = selectedYear;

  if (aMStat) aMStat.textContent = formatLKR(roundCurrency(mStatSales));
  if (aMReload) aMReload.textContent = formatLKR(roundCurrency(mReloadVol));
  if (aMComm) aMComm.textContent = formatLKR(roundCurrency(mReloadComm));
  if (aMCombined) aMCombined.textContent = formatLKR(mCombined);

  if (aYStat) aYStat.textContent = formatLKR(roundCurrency(yStatSales));
  if (aYReload) aYReload.textContent = formatLKR(roundCurrency(yReloadVol));
  if (aYComm) aYComm.textContent = formatLKR(roundCurrency(yReloadComm));
  if (aYCombined) aYCombined.textContent = formatLKR(yCombined);
}

// =============================================================================
// 14. DASHBOARD FINANCIAL OVERVIEW & KPIS
// =============================================================================

function updateDashboardFinancialKPIs() {
  let statSales = 0;
  let statItems = 0;
  APP_STATE.todayStationeryTransactions.forEach(s => {
    statSales += Number(s.totalAmount || s.sellingPrice || 0);
    statItems += Number(s.quantity || 1);
  });

  let reloadVol = 0;
  let reloadComm = 0;
  APP_STATE.todayReloadTransactions.forEach(r => {
    reloadVol += Number(r.amount || 0);
    reloadComm += Number(r.commissionAmount || 0);
  });

  const combinedRevenue = roundCurrency(statSales + reloadComm);

  const dSales = document.getElementById('dashStationerySales');
  const dItems = document.getElementById('dashStationeryItemsSold');
  const dVol = document.getElementById('dashReloadVolume');
  const dCount = document.getElementById('dashReloadCount');
  const dComm = document.getElementById('dashReloadCommission');
  const dRevenue = document.getElementById('dashTodayCombinedRevenue');

  if (dSales) dSales.textContent = formatLKR(roundCurrency(statSales));
  if (dItems) dItems.textContent = statItems.toLocaleString();
  if (dVol) dVol.textContent = formatLKR(roundCurrency(reloadVol));
  if (dCount) dCount.textContent = APP_STATE.todayReloadTransactions.length.toLocaleString();
  if (dComm) dComm.textContent = formatLKR(roundCurrency(reloadComm));
  if (dRevenue) dRevenue.textContent = formatLKR(combinedRevenue);
}

function updateDashboardCatalogKPIs() {
  const dCount = document.getElementById('dashCatalogCount');
  const dLow = document.getElementById('dashLowStockCount');

  if (dCount) dCount.textContent = `${APP_STATE.inventoryCatalog.length} Items`;

  const lowCount = APP_STATE.inventoryCatalog.filter(i => i.stockQuantity <= 5).length;
  if (dLow) dLow.textContent = lowCount.toLocaleString();
}

function updateCommissionUI() {
  const rates = APP_STATE.commissionRates;

  const fAirtel = document.getElementById('formRateAirtel');
  const fDialog = document.getElementById('formRateDialog');
  const fMobitel = document.getElementById('formRateMobitel');
  const fHutch = document.getElementById('formRateHutch');

  if (fAirtel) fAirtel.textContent = `${rates.AIRTEL.toFixed(2)}%`;
  if (fDialog) fDialog.textContent = `${rates.DIALOG.toFixed(2)}%`;
  if (fMobitel) fMobitel.textContent = `${rates.MOBITEL.toFixed(2)}%`;
  if (fHutch) fHutch.textContent = `${rates.HUTCH.toFixed(2)}%`;

  const inAirtel = document.getElementById('rateAirtelInput');
  const inDialog = document.getElementById('rateDialogInput');
  const inMobitel = document.getElementById('rateMobitelInput');
  const inHutch = document.getElementById('rateHutchInput');

  if (inAirtel) inAirtel.value = rates.AIRTEL.toFixed(2);
  if (inDialog) inDialog.value = rates.DIALOG.toFixed(2);
  if (inMobitel) inMobitel.value = rates.MOBITEL.toFixed(2);
  if (inHutch) inHutch.value = rates.HUTCH.toFixed(2);
}

// =============================================================================
// 15. MASTER INVENTORY CATALOG & SETTINGS (V1.0 RESTRUCTURED)
// =============================================================================

function setupCatalogAndSettings() {
  const catalogItemForm = document.getElementById('catalogItemForm');
  const catalogDocId = document.getElementById('catalogDocId');
  const catalogCode = document.getElementById('catalogCode');
  const catalogName = document.getElementById('catalogName');
  const catalogSellingPrice = document.getElementById('catalogSellingPrice');
  const catalogStockQuantity = document.getElementById('catalogStockQuantity');
  const catalogSaveBtn = document.getElementById('catalogSaveBtn');
  const catalogFormTitle = document.getElementById('catalogFormTitle');
  const catalogResetFormBtn = document.getElementById('catalogResetFormBtn');
  const seedCatalogBtn = document.getElementById('seedCatalogBtn');
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const commissionsForm = document.getElementById('commissionsForm');

  function resetCatalogForm() {
    catalogItemForm.reset();
    catalogDocId.value = '';
    catalogStockQuantity.value = '50';
    catalogFormTitle.textContent = 'Add New Catalog Item';
    catalogSaveBtn.textContent = 'Save Item to Catalog';
    catalogResetFormBtn.classList.add('hidden');
  }

  if (catalogResetFormBtn) catalogResetFormBtn.addEventListener('click', resetCatalogForm);

  if (catalogItemForm) {
    catalogItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = catalogCode.value.trim().toUpperCase();
      const name = catalogName.value.trim();
      const sell = roundCurrency(catalogSellingPrice.value);
      const stock = parseInt(catalogStockQuantity.value, 10) || 0;
      const docId = catalogDocId.value;

      if (!code || !name) {
        showToast('Please provide an Item Code and Name', 'error');
        return;
      }
      if (sell <= 0) {
        showToast('Please specify a valid selling price', 'error');
        return;
      }

      const itemPayload = {
        code,
        name,
        sellingPrice: sell,
        stockQuantity: stock,
        updatedAt: serverTimestamp()
      };

      try {
        if (docId) {
          await updateDoc(doc(db, 'inventory', docId), itemPayload);
          showToast(`Updated: ${name}`, 'success');
        } else {
          await addDoc(collection(db, 'inventory'), itemPayload);
          showToast(`Added ${name} to Master Catalog`, 'success');
        }
        resetCatalogForm();
      } catch (err) {
        showToast(`Catalog error: ${err.message}`, 'error');
      }
    });
  }

  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', renderCatalogTable);
  }

  // Seed sample stationery catalog with stock
  if (seedCatalogBtn) {
    seedCatalogBtn.addEventListener('click', async () => {
      if (!confirm('Populate standard Sri Lankan stationery catalog with stock levels?')) return;
      try {
        let addedCount = 0;
        for (const item of SAMPLE_SRI_LANKAN_CATALOG) {
          const exists = APP_STATE.inventoryCatalog.some(c => c.code === item.code);
          if (!exists) {
            await addDoc(collection(db, 'inventory'), {
              ...item,
              updatedAt: serverTimestamp()
            });
            addedCount++;
          }
        }
        showToast(`Seeded ${addedCount} standard stationery products`, 'success');
      } catch (err) {
        showToast(`Seeding error: ${err.message}`, 'error');
      }
    });
  }

  // Save Commission Rates
  if (commissionsForm) {
    commissionsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const airtel = roundCurrency(document.getElementById('rateAirtelInput').value);
      const dialog = roundCurrency(document.getElementById('rateDialogInput').value);
      const mobitel = roundCurrency(document.getElementById('rateMobitelInput').value);
      const hutch = roundCurrency(document.getElementById('rateHutchInput').value);

      try {
        await setDoc(doc(db, 'settings', 'commissions'), {
          airtel,
          dialog,
          mobitel,
          hutch,
          updatedAt: serverTimestamp()
        }, { merge: true });

        showToast('Commission rates updated across all modules', 'success');
      } catch (err) {
        showToast(`Failed to save rates: ${err.message}`, 'error');
      }
    });
  }
}

function renderCatalogTable() {
  const tbody = document.getElementById('catalogTableBody');
  const searchInput = document.getElementById('catalogSearchInput');
  const queryStr = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = APP_STATE.inventoryCatalog.filter(item => {
    if (!queryStr) return true;
    return (item.code || '').toLowerCase().includes(queryStr) ||
           (item.name || '').toLowerCase().includes(queryStr);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-6 text-center theme-text-dim">
          No inventory items match "${queryStr}".
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-sky-400 whitespace-nowrap">${item.code}</td>
      <td class="py-2.5 px-3 font-medium theme-text-main">${item.name}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-2.5 px-3 text-center font-mono font-bold text-xs ${item.stockQuantity <= 5 ? 'text-amber-400' : 'theme-text-main'}">
        ${item.stockQuantity}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap space-x-1">
        <button type="button" data-edit-item="${item.id}" class="p-1 text-sky-400 hover:text-sky-300" title="Edit Item">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" data-delete-item="${item.id}" class="p-1 text-red-400 hover:text-red-300" title="Delete Item">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    const editBtn = tr.querySelector(`[data-edit-item="${item.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        document.getElementById('catalogDocId').value = item.id;
        document.getElementById('catalogCode').value = item.code;
        document.getElementById('catalogName').value = item.name;
        document.getElementById('catalogSellingPrice').value = Number(item.sellingPrice).toFixed(2);
        document.getElementById('catalogStockQuantity').value = item.stockQuantity;
        document.getElementById('catalogFormTitle').textContent = `Edit Item: ${item.name}`;
        document.getElementById('catalogSaveBtn').textContent = 'Update Catalog Item';
        document.getElementById('catalogResetFormBtn').classList.remove('hidden');
        document.getElementById('catalogCode').focus();
      });
    }

    const delBtn = tr.querySelector(`[data-delete-item="${item.id}"]`);
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete product "${item.name}" from master inventory?`)) return;
        try {
          await deleteDoc(doc(db, 'inventory', item.id));
          showToast(`Deleted ${item.name}`, 'info');
        } catch (err) {
          showToast(`Failed to delete: ${err.message}`, 'error');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 16. EDIT STATIONERY TRANSACTION MODAL
// =============================================================================

function setupEditStationeryModal() {
  const modal = document.getElementById('editStationeryModal');
  const form = document.getElementById('editStationeryForm');
  const closeBtn = document.getElementById('closeEditStatModalBtn');
  const cancelBtn = document.getElementById('cancelEditStatBtn');
  const editSelling = document.getElementById('editStatSelling');
  const editQty = document.getElementById('editStatQty');
  const editTotalPreview = document.getElementById('editStatTotalPreview');

  function calculateEditTotal() {
    const price = Number(editSelling.value) || 0;
    const qty = parseInt(editQty.value, 10) || 1;
    editTotalPreview.textContent = formatLKR(roundCurrency(price * qty));
  }

  if (editSelling) editSelling.addEventListener('input', calculateEditTotal);
  if (editQty) editQty.addEventListener('input', calculateEditTotal);

  function closeModal() {
    if (modal) modal.classList.add('hidden');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editStatDocId').value;
      const name = document.getElementById('editStatName').value.trim();
      const code = document.getElementById('editStatCode').value.trim() || 'ST';
      const sell = roundCurrency(editSelling.value);
      const qty = parseInt(editQty.value, 10) || 1;
      const total = roundCurrency(sell * qty);

      try {
        await updateDoc(doc(db, 'stationery_transactions', id), {
          itemName: name,
          itemCode: code,
          sellingPrice: sell,
          quantity: qty,
          totalAmount: total,
          updatedAt: serverTimestamp()
        });
        showToast(`Updated record: ${name}`, 'success');
        closeModal();
      } catch (err) {
        showToast(`Update error: ${err.message}`, 'error');
      }
    });
  }
}

function openEditStationeryModal(item) {
  const modal = document.getElementById('editStationeryModal');
  if (!modal) return;

  document.getElementById('editStatDocId').value = item.id;
  document.getElementById('editStatName').value = item.itemName || '';
  document.getElementById('editStatCode').value = item.itemCode || '';
  document.getElementById('editStatSelling').value = Number(item.sellingPrice || 0).toFixed(2);
  document.getElementById('editStatQty').value = item.quantity || 1;

  const total = roundCurrency((item.sellingPrice || 0) * (item.quantity || 1));
  document.getElementById('editStatTotalPreview').textContent = formatLKR(total);

  modal.classList.remove('hidden');
}

// =============================================================================
// 17. DEVELOPER DEBUGGER CONSOLE
// =============================================================================

function setupDeveloperConsole() {
  const devConsoleToggle = document.getElementById('devConsoleToggle');
  const devConsoleBody = document.getElementById('devConsoleBody');
  const dbgFirestoreHealth = document.getElementById('dbgFirestoreHealth');
  const dbgTestWriteBtn = document.getElementById('dbgTestWriteBtn');
  const dbgExportDataBtn = document.getElementById('dbgExportDataBtn');
  const dbgClearCacheBtn = document.getElementById('dbgClearCacheBtn');
  const dbgClearLogsBtn = document.getElementById('dbgClearLogsBtn');

  if (devConsoleToggle && devConsoleBody) {
    devConsoleToggle.addEventListener('change', () => {
      if (devConsoleToggle.checked) {
        devConsoleBody.classList.remove('hidden');
        updateCacheMetrics();
        logDebug('Developer debug console opened');
      } else {
        devConsoleBody.classList.add('hidden');
      }
    });
  }

  if (dbgTestWriteBtn) {
    dbgTestWriteBtn.addEventListener('click', async () => {
      logDebug('Testing Firestore ping and latency...');
      const start = performance.now();
      try {
        const pingRef = doc(db, 'system_health', 'ping');
        await setDoc(pingRef, { ping: Date.now(), timestamp: serverTimestamp() });
        const elapsed = Math.round(performance.now() - start);
        logDebug(`Firestore ping successful! Latency: ${elapsed}ms`, 'SUCCESS');
        if (dbgFirestoreHealth) {
          dbgFirestoreHealth.textContent = `Online (${elapsed}ms)`;
          dbgFirestoreHealth.className = 'font-bold font-mono text-emerald-400';
        }
        showToast(`Firestore connection healthy (${elapsed}ms)`, 'success');
      } catch (err) {
        logDebug(`Firestore ping test failed: ${err.message}`, 'ERROR');
        if (dbgFirestoreHealth) {
          dbgFirestoreHealth.textContent = 'Error';
          dbgFirestoreHealth.className = 'font-bold font-mono text-red-400';
        }
        showToast(`Ping failed: ${err.message}`, 'error');
      }
    });
  }

  if (dbgClearCacheBtn) {
    dbgClearCacheBtn.addEventListener('click', () => {
      if (confirm('Clear local browser storage cache? Cloud data will remain safe.')) {
        localStorage.clear();
        updateCacheMetrics();
        showToast('Local browser storage cache cleared', 'info');
      }
    });
  }

  if (dbgClearLogsBtn) {
    dbgClearLogsBtn.addEventListener('click', () => {
      APP_STATE.devLogs = [];
      const terminalEl = document.getElementById('dbgTerminalLogs');
      if (terminalEl) terminalEl.innerHTML = '<div class="text-sky-400 font-bold">[SYSTEM] Logs Cleared.</div>';
    });
  }

  if (dbgExportDataBtn) {
    dbgExportDataBtn.addEventListener('click', exportCompleteBackup);
  }
}

function updateCacheMetrics() {
  const dbgCacheMetrics = document.getElementById('dbgCacheMetrics');
  if (!dbgCacheMetrics) return;

  let totalBytes = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalBytes += (localStorage[key].length + key.length) * 2;
    }
  }
  const kb = (totalBytes / 1024).toFixed(2);
  dbgCacheMetrics.textContent = `${kb} KB`;
}

function exportCompleteBackup() {
  const backupData = {
    system: 'AL Communication',
    exportedAt: new Date().toISOString(),
    projectId: 'al-p1-fb432',
    user: APP_STATE.currentUser ? APP_STATE.currentUser.email : 'anonymous',
    commissionRates: APP_STATE.commissionRates,
    inventoryCatalog: APP_STATE.inventoryCatalog,
    stationeryTransactions: APP_STATE.masterStationeryRecords,
    reloadTransactions: APP_STATE.masterReloadRecords
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AL_Communication_Backup_${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported complete data JSON backup', 'success');
}

// =============================================================================
// 18. INITIALIZATION LIFECYCLE ENTRY
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  logDebug('AL Communication System initializing for GitHub Pages (al-p1-fb432)...');

  initTheme();
  startLiveClock();
  initNetworkMonitor();
  setupAuth();
  initNavigation();
  setupStationeryModule();
  setupReloadModule();
  setupStockModule();
  setupMasterLogsModule();
  setupAnalyticsModule();
  setupCatalogAndSettings();
  setupDeveloperConsole();

  logDebug('AL Communication V1.0 Lifecycle Initialization Complete.');
});
