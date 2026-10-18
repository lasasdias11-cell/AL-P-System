// =============================================================================
// SRI LANKAN RETAIL & STATIONERY TRANSACTION LOG SYSTEM - APP CORE LOGIC
// Target: GitHub Pages SPA | Firebase Cloud Firestore v11 | Auth Guard
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
  serverTimestamp
} from './firebase-config.js';

// =============================================================================
// 1. APPLICATION STATE & CONSTANTS
// =============================================================================

const APP_STATE = {
  currentUser: null,
  activeTheme: 'modern-slate',
  activeView: 'dashboard',
  currentStationeryDate: '',
  currentReloadDate: '',
  activeReloadOperator: 'MOBITEL',
  activeReloadFilter: 'ALL',
  commissionRates: {
    AIRTEL: 6.80,
    DIALOG: 3.80,
    MOBITEL: 6.80,
    HUTCH: 5.00
  },
  inventoryCatalog: [],
  stationeryTransactions: [],
  reloadTransactions: [],
  selectedCatalogItem: null,
  unsubscribers: {
    commissions: null,
    inventory: null,
    stationery: null,
    reloads: null
  },
  devLogs: []
};

// Default sample stationery items for Sri Lankan retail shop
const SAMPLE_SRI_LANKAN_CATALOG = [
  { code: 'ST-001', name: 'Atlas CR Book 80 Pages (Single Rule)', costPrice: 160.00, sellingPrice: 200.00 },
  { code: 'ST-002', name: 'Atlas CR Book 120 Pages (Single Rule)', costPrice: 230.00, sellingPrice: 280.00 },
  { code: 'ST-003', name: 'Atlas CR Book 160 Pages (Single Rule)', costPrice: 300.00, sellingPrice: 370.00 },
  { code: 'ST-004', name: 'CR Book 80 Pages (Square Rule)', costPrice: 160.00, sellingPrice: 200.00 },
  { code: 'ST-005', name: 'Atlas Chooty Pen Blue (0.5mm)', costPrice: 22.00, sellingPrice: 30.00 },
  { code: 'ST-006', name: 'Atlas Chooty Pen Black (0.5mm)', costPrice: 22.00, sellingPrice: 30.00 },
  { code: 'ST-007', name: 'Atlas Chooty Pen Red (0.5mm)', costPrice: 22.00, sellingPrice: 30.00 },
  { code: 'ST-008', name: 'Nataraj 2B Pencil Pack (10s)', costPrice: 210.00, sellingPrice: 260.00 },
  { code: 'ST-009', name: 'A4 Photocopy Paper 80gsm (Pack 500)', costPrice: 1350.00, sellingPrice: 1600.00 },
  { code: 'ST-010', name: 'A4 Photocopy Single Page (B/W)', costPrice: 3.50, sellingPrice: 10.00 },
  { code: 'ST-011', name: 'A4 Colour Print Single Page', costPrice: 15.00, sellingPrice: 40.00 },
  { code: 'ST-012', name: 'Bristol Board Sheet (White/Colours)', costPrice: 40.00, sellingPrice: 60.00 },
  { code: 'ST-013', name: 'Atlas Colour Pastels (12 Shades)', costPrice: 180.00, sellingPrice: 230.00 },
  { code: 'ST-014', name: 'Clear Display File Folder (A4)', costPrice: 120.00, sellingPrice: 170.00 },
  { code: 'ST-015', name: 'UHU / Atlas Glue Stick 15g', costPrice: 110.00, sellingPrice: 150.00 }
];

// =============================================================================
// 2. MATHEMATICAL & FORMATTING UTILITIES (Exact Cent Precision)
// =============================================================================

/**
 * Standard rounding to 2 decimal places per specification:
 * Math.round((amount + Number.EPSILON) * 100) / 100
 */
export function roundCurrency(amount) {
  const num = Number(amount) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a number to Sri Lankan Rupee currency string: "Rs. 1,250.00"
 */
export function formatLKR(amount) {
  const rounded = roundCurrency(amount);
  return 'Rs. ' + rounded.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Returns Sri Lankan local date string formatted as YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  // Using Asia/Colombo timezone offset (UTC+5:30)
  const tzOffset = 5.5 * 60; // in minutes
  const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted 24hr time string: HH:MM:SS
 */
export function getCurrentTimeString() {
  const now = new Date();
  const tzOffset = 5.5 * 60;
  const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000);
  return localTime.toTimeString().split(' ')[0];
}

// =============================================================================
// 3. LOGGING & DIAGNOSTICS HELPER
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

// Toast Alert System
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-red-600 text-white border-red-500',
    info: 'theme-bg-surface theme-text-main theme-border'
  };

  toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold border pointer-events-auto flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Remove toast after 3.5s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
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

  // Update theme meta color for mobile browser navbars
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

  // Update active border in settings theme cards
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
// 5. LIVE LKR DIGITAL CLOCK & NETWORK STATUS
// =============================================================================

function startLiveClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  function update() {
    const now = new Date();
    // Sri Lanka Time UTC+5:30
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
        syncBadge.className = 'hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        syncText.textContent = 'Cloud Live';
      }
      if (mobileSyncBadge) {
        mobileSyncBadge.className = 'sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
      logDebug('Network online: Sync active', 'SUCCESS');
    } else {
      if (syncBadge) {
        syncBadge.className = 'hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20';
        syncText.textContent = 'Offline Cache';
      }
      if (mobileSyncBadge) {
        mobileSyncBadge.className = 'sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20';
      }
      logDebug('Network offline: Working locally', 'WARN');
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

  // Handle Custom Firebase API Key input
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
        logDebug(`User authenticated: ${user.email} (UID: ${user.uid})`, 'SUCCESS');
        
        // Show App Shell, Hide Login
        loginScreen.classList.add('hidden');
        appShell.classList.remove('hidden');

        if (userEmailBadge) userEmailBadge.textContent = user.email;

        // Initialize Firestore Data Listeners
        initRealtimeListeners();
      } else {
        APP_STATE.currentUser = null;
        logDebug('No active session. Presenting Login Screen.');

        // Lock UI Behind Login Screen
        appShell.classList.add('hidden');
        loginScreen.classList.remove('hidden');

        // Detach Firestore listeners to conserve memory and maintain security
        detachAllListeners();
      }
    });
  } else {
    logDebug('Firebase Auth not initialized. Check API configuration.', 'ERROR');
    if (loginAlert) {
      loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 block';
      loginAlert.innerHTML = `⚠️ <strong>Notice:</strong> Please configure your Firebase Web API Key for project <code>al-p1-fb432</code> in the drawer below.`;
    }
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
        loginAlert.textContent = 'Firebase is not initialized. Please paste your Firebase Web API Key below.';
        return;
      }

      // Show Spinner
      loginBtnSpinner.classList.remove('hidden');
      loginBtnText.textContent = 'Verifying Credentials...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast(`Welcome back, ${email}`, 'success');
      } catch (error) {
        logDebug(`Authentication failed: ${error.code} - ${error.message}`, 'ERROR');
        loginAlert.className = 'mb-4 p-3 rounded-xl text-xs bg-red-500/10 text-red-400 border border-red-500/20 block';
        
        let errorMsg = 'Failed to sign in. Please verify your email and password.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/user-not-found') {
          errorMsg = 'No registered user found with this email.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = 'Access blocked temporarily due to multiple failed attempts. Try again later or reset password.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = 'Network error. Please check your internet connection.';
        } else if (error.code === 'auth/invalid-api-key') {
          errorMsg = 'Invalid Firebase API Key. Please provide your Web API Key in the box below.';
        }
        loginAlert.innerHTML = `⚠️ ${errorMsg}`;
      } finally {
        loginBtnSpinner.classList.add('hidden');
        loginBtnText.textContent = 'Sign In to Store Ledger';
      }
    });
  }

  // Sign Out Button
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out of the Store Ledger?')) {
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

  // Forgot Password Modal Flow
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

  // Account Security Updates inside Settings
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
        showToast('New passwords do not match!', 'error');
        return;
      }
      if (newPass.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      try {
        await updatePassword(auth.currentUser, newPass);
        showToast('Password successfully changed!', 'success');
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
  const currentPassword = prompt('Firebase Security Notice: Please re-enter your CURRENT password to authorize this sensitive change:');
  if (!currentPassword) return;

  try {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await actionCallback();
    showToast('Credential verified and change applied!', 'success');
  } catch (err) {
    showToast(`Verification failed: ${err.message}`, 'error');
  }
}

// =============================================================================
// 7. NAVIGATION & VIEW SWITCHING
// =============================================================================

function switchView(viewName) {
  const views = ['dashboard', 'stationery', 'reloads'];
  if (!views.includes(viewName)) viewName = 'dashboard';

  APP_STATE.activeView = viewName;

  // Toggle Section Views
  document.querySelectorAll('.app-view').forEach(viewEl => {
    viewEl.classList.add('hidden');
  });

  const targetView = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (targetView) targetView.classList.remove('hidden');

  // Update Desktop Tab Buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'nav-tab-btn active px-3.5 py-1.5 rounded-lg theme-bg-accent text-white transition';
    } else {
      btn.className = 'nav-tab-btn px-3.5 py-1.5 rounded-lg theme-text-muted hover:theme-text-main transition';
    }
  });

  // Update Mobile Bottom Nav Buttons
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = 'mobile-nav-btn active flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-accent';
    } else {
      btn.className = 'mobile-nav-btn flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold theme-text-muted';
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  logDebug(`Navigated to view: ${viewName}`);
}

function initNavigation() {
  // Desktop Nav Buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
  });

  // Mobile Bottom Nav Buttons
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
  });

  // Header Brand Home Button
  const headerHomeBtn = document.getElementById('headerHomeBtn');
  if (headerHomeBtn) {
    headerHomeBtn.addEventListener('click', () => switchView('dashboard'));
  }

  // Dashboard Large Operational Cards
  const dashStationeryCard = document.getElementById('dashStationeryCard');
  if (dashStationeryCard) {
    dashStationeryCard.addEventListener('click', () => switchView('stationery'));
  }

  const dashReloadCard = document.getElementById('dashReloadCard');
  if (dashReloadCard) {
    dashReloadCard.addEventListener('click', () => switchView('reloads'));
  }

  // Settings Modal Open / Close
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
  if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);

  // Quick Open Catalog from POS Bar
  const openAddCatalogItemBtn = document.getElementById('openAddCatalogItemBtn');
  if (openAddCatalogItemBtn) {
    openAddCatalogItemBtn.addEventListener('click', () => {
      openSettingsModal();
      switchSettingsTab('catalog');
    });
  }

  // Settings Sub-panel Tabs
  document.querySelectorAll('[data-settings-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => switchSettingsTab(tabBtn.getAttribute('data-settings-tab')));
  });

  // Settings backdrop click to close
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

  // Toggle Panels
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const targetPanel = document.getElementById(`settingsPanel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetPanel) targetPanel.classList.remove('hidden');

  // Toggle Button styles
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-settings-tab') === tabName) {
      btn.className = 'settings-tab-btn active px-3 py-1.5 rounded-lg border theme-border theme-bg-accent text-white transition whitespace-nowrap';
    } else {
      btn.className = 'settings-tab-btn px-3 py-1.5 rounded-lg border theme-border theme-text-muted hover:theme-text-main transition whitespace-nowrap';
    }
  });
}

// =============================================================================
// 8. FIRESTORE REAL-TIME LISTENERS
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
  APP_STATE.currentStationeryDate = today;
  APP_STATE.currentReloadDate = today;

  // Set date pickers to today
  const statDateInput = document.getElementById('stationeryDateInput');
  if (statDateInput) statDateInput.value = today;

  const reloadDateInput = document.getElementById('reloadDateInput');
  if (reloadDateInput) reloadDateInput.value = today;

  // 1. Commission Rates Listener
  listenToCommissions();

  // 2. Inventory Catalog Listener
  listenToInventory();

  // 3. Stationery Transactions Listener (Current selected date)
  listenToStationery(APP_STATE.currentStationeryDate);

  // 4. Reload Transactions Listener (Current selected date)
  listenToReloads(APP_STATE.currentReloadDate);
}

// Listener: Commissions
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
      // First-time setup: write defaults to Firestore
      logDebug('Writing initial commission rates to Firestore...');
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

// Listener: Inventory Catalog
function listenToInventory() {
  if (!db) return;
  const invColRef = collection(db, 'inventory');

  APP_STATE.unsubscribers.inventory = onSnapshot(invColRef, (snap) => {
    const items = [];
    snap.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort alphabetically by Code / Name
    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    APP_STATE.inventoryCatalog = items;

    renderInventoryTable();
    logDebug(`Inventory catalog updated: ${items.length} items`);
  }, (err) => {
    logDebug(`Inventory listener error: ${err.message}`, 'ERROR');
  });
}

// Listener: Stationery Transactions
function listenToStationery(dateStr) {
  if (!db) return;
  if (typeof APP_STATE.unsubscribers.stationery === 'function') {
    APP_STATE.unsubscribers.stationery();
  }

  const statColRef = collection(db, 'stationery_transactions');
  const q = query(statColRef, where('date', '==', dateStr));

  APP_STATE.unsubscribers.stationery = onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort chronologically by time descending (newest on top)
    list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.stationeryTransactions = list;

    renderStationeryTable();
    updateStationerySummary();
    updateDashboardKPIs();
    logDebug(`Stationery transactions loaded for ${dateStr}: ${list.length} rows`);
  }, (err) => {
    logDebug(`Stationery listener error: ${err.message}`, 'ERROR');
  });
}

// Listener: Reload Transactions
function listenToReloads(dateStr) {
  if (!db) return;
  if (typeof APP_STATE.unsubscribers.reloads === 'function') {
    APP_STATE.unsubscribers.reloads();
  }

  const reloadColRef = collection(db, 'reload_transactions');
  const q = query(reloadColRef, where('date', '==', dateStr));

  APP_STATE.unsubscribers.reloads = onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort chronologically by time descending
    list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    APP_STATE.reloadTransactions = list;

    renderReloadTable();
    updateReloadSummary();
    updateDashboardKPIs();
    logDebug(`Reload transactions loaded for ${dateStr}: ${list.length} rows`);
  }, (err) => {
    logDebug(`Reload listener error: ${err.message}`, 'ERROR');
  });
}

// =============================================================================
// 9. MODULE 2: STATIONERY TRANSACTION LEDGER LOGIC
// =============================================================================

function setupStationeryModule() {
  const statDateInput = document.getElementById('stationeryDateInput');
  const statTodayBtn = document.getElementById('stationeryTodayBtn');
  const statPrevDayBtn = document.getElementById('stationeryPrevDayBtn');
  const statNextDayBtn = document.getElementById('stationeryNextDayBtn');

  // Date Change Handlers
  if (statDateInput) {
    statDateInput.addEventListener('change', () => {
      APP_STATE.currentStationeryDate = statDateInput.value;
      listenToStationery(APP_STATE.currentStationeryDate);
    });
  }

  if (statTodayBtn) {
    statTodayBtn.addEventListener('click', () => {
      const today = getTodayDateString();
      if (statDateInput) statDateInput.value = today;
      APP_STATE.currentStationeryDate = today;
      listenToStationery(today);
    });
  }

  if (statPrevDayBtn) {
    statPrevDayBtn.addEventListener('click', () => {
      const d = new Date(APP_STATE.currentStationeryDate);
      d.setDate(d.getDate() - 1);
      const prev = d.toISOString().split('T')[0];
      if (statDateInput) statDateInput.value = prev;
      APP_STATE.currentStationeryDate = prev;
      listenToStationery(prev);
    });
  }

  if (statNextDayBtn) {
    statNextDayBtn.addEventListener('click', () => {
      const d = new Date(APP_STATE.currentStationeryDate);
      d.setDate(d.getDate() + 1);
      const next = d.toISOString().split('T')[0];
      if (statDateInput) statDateInput.value = next;
      APP_STATE.currentStationeryDate = next;
      listenToStationery(next);
    });
  }

  // POS Autocomplete Type-Ahead Search Input
  const posItemInput = document.getElementById('posItemInput');
  const posAutocompleteList = document.getElementById('posAutocompleteList');
  const posCostPrice = document.getElementById('posCostPrice');
  const posSellingPrice = document.getElementById('posSellingPrice');
  const posProfitPreview = document.getElementById('posProfitPreview');
  const posMarginPreview = document.getElementById('posMarginPreview');
  const posItemBadge = document.getElementById('posItemBadge');
  const stationeryEntryForm = document.getElementById('stationeryEntryForm');

  function calculatePosPreview() {
    const cost = Number(posCostPrice.value) || 0;
    const sell = Number(posSellingPrice.value) || 0;
    const profit = roundCurrency(sell - cost);

    posProfitPreview.textContent = formatLKR(profit);
    if (profit < 0) {
      posProfitPreview.className = 'text-base font-bold text-red-400 currency-lkr';
    } else {
      posProfitPreview.className = 'text-base font-bold text-emerald-400 currency-lkr';
    }

    const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : '0';
    posMarginPreview.textContent = `${margin}% Margin`;
  }

  if (posCostPrice) posCostPrice.addEventListener('input', calculatePosPreview);
  if (posSellingPrice) posSellingPrice.addEventListener('input', calculatePosPreview);
  // Autocomplete Filtering with Keyboard Navigation
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
    posCostPrice.value = Number(item.costPrice).toFixed(2);
    posSellingPrice.value = Number(item.sellingPrice).toFixed(2);
    APP_STATE.selectedCatalogItem = item;

    if (posItemBadge) {
      posItemBadge.textContent = item.code;
      posItemBadge.classList.remove('hidden');
    }

    posAutocompleteList.classList.add('hidden');
    calculatePosPreview();
    posSellingPrice.focus();
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
        return;
      }

      // Filter catalog by Code or Name
      currentMatches = APP_STATE.inventoryCatalog.filter(item => {
        const cMatch = (item.code || '').toLowerCase().includes(queryStr);
        const nMatch = (item.name || '').toLowerCase().includes(queryStr);
        return cMatch || nMatch;
      }).slice(0, 8);

      if (currentMatches.length === 0) {
        posAutocompleteList.innerHTML = `
          <div class="p-3 text-xs theme-text-dim text-center">
            No matching inventory item found. Custom item entry will be logged.
          </div>
        `;
        posAutocompleteList.classList.remove('hidden');
        return;
      }

      posAutocompleteList.innerHTML = '';
      currentMatches.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'autocomplete-item flex items-center justify-between gap-2';
        itemRow.innerHTML = `
          <div>
            <div class="font-bold text-xs theme-text-main">${item.name}</div>
            <div class="text-[11px] font-mono theme-text-muted">Code: <span class="text-sky-400">${item.code}</span></div>
          </div>
          <div class="text-right">
            <div class="text-xs font-mono font-bold text-emerald-400">${formatLKR(item.sellingPrice)}</div>
            <div class="text-[10px] font-mono theme-text-dim">Cost: ${formatLKR(item.costPrice)}</div>
          </div>
        `;

        itemRow.addEventListener('click', () => selectCatalogItem(item));
        posAutocompleteList.appendChild(itemRow);
      });

      posAutocompleteList.classList.remove('hidden');
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    posItemInput.addEventListener('keydown', (e) => {
      if (posAutocompleteList.classList.contains('hidden') || currentMatches.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % currentMatches.length;
        updateAutocompleteHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + currentMatches.length) % currentMatches.length;
        updateAutocompleteHighlight();
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < currentMatches.length) {
          e.preventDefault();
          selectCatalogItem(currentMatches[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        posAutocompleteList.classList.add('hidden');
      }
    });

    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
      if (!posItemInput.contains(e.target) && !posAutocompleteList.contains(e.target)) {
        posAutocompleteList.classList.add('hidden');
      }
    });
  }

  // Setup Edit Stationery Modal handlers
  setupEditStationeryModal();

  // Add Stationery Sale Submission
  if (stationeryEntryForm) {
    stationeryEntryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemName = posItemInput.value.trim();
      const costPrice = roundCurrency(posCostPrice.value);
      const sellingPrice = roundCurrency(posSellingPrice.value);
      const profit = roundCurrency(sellingPrice - costPrice);
      const itemCode = APP_STATE.selectedCatalogItem ? APP_STATE.selectedCatalogItem.code : 'CUSTOM';

      if (!itemName) {
        showToast('Please specify an item name or code', 'error');
        return;
      }

      const transactionPayload = {
        date: APP_STATE.currentStationeryDate,
        time: getCurrentTimeString(),
        itemCode: itemCode,
        itemName: itemName,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        profit: profit,
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'stationery_transactions'), transactionPayload);
        showToast(`Logged sale: ${itemName} (${formatLKR(sellingPrice)})`, 'success');

        // Reset Entry Form
        stationeryEntryForm.reset();
        APP_STATE.selectedCatalogItem = null;
        if (posItemBadge) posItemBadge.classList.add('hidden');
        posProfitPreview.textContent = 'Rs. 0.00';
        posMarginPreview.textContent = '0% Margin';
        posItemInput.focus();
      } catch (err) {
        logDebug(`Error adding stationery transaction: ${err.message}`, 'ERROR');
        showToast(`Failed to log sale: ${err.message}`, 'error');
      }
    });
  }
}

function setupEditStationeryModal() {
  const modal = document.getElementById('editStationeryModal');
  const form = document.getElementById('editStationeryForm');
  const closeBtn = document.getElementById('closeEditStatModalBtn');
  const cancelBtn = document.getElementById('cancelEditStatBtn');
  const editCost = document.getElementById('editStatCost');
  const editSelling = document.getElementById('editStatSelling');
  const editProfit = document.getElementById('editStatProfitPreview');

  function updateEditProfit() {
    const cost = Number(editCost.value) || 0;
    const sell = Number(editSelling.value) || 0;
    editProfit.textContent = formatLKR(roundCurrency(sell - cost));
  }

  if (editCost) editCost.addEventListener('input', updateEditProfit);
  if (editSelling) editSelling.addEventListener('input', updateEditProfit);

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
      const cost = roundCurrency(editCost.value);
      const sell = roundCurrency(editSelling.value);
      const profit = roundCurrency(sell - cost);

      try {
        await updateDoc(doc(db, 'stationery_transactions', id), {
          itemName: name,
          itemCode: code,
          costPrice: cost,
          sellingPrice: sell,
          profit: profit
        });
        showToast(`Updated entry: ${name}`, 'success');
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
  document.getElementById('editStatCost').value = Number(item.costPrice || 0).toFixed(2);
  document.getElementById('editStatSelling').value = Number(item.sellingPrice || 0).toFixed(2);

  const profit = roundCurrency((item.sellingPrice || 0) - (item.costPrice || 0));
  document.getElementById('editStatProfitPreview').textContent = formatLKR(profit);

  modal.classList.remove('hidden');
}

function renderStationeryTable() {
  const tbody = document.getElementById('stationeryTableBody');
  const countBadge = document.getElementById('stationeryCountBadge');
  const dateLabel = document.getElementById('stationeryTableDateLabel');

  if (dateLabel) {
    dateLabel.textContent = APP_STATE.currentStationeryDate === getTodayDateString() 
      ? `Today (${APP_STATE.currentStationeryDate})` 
      : APP_STATE.currentStationeryDate;
  }

  if (countBadge) {
    countBadge.textContent = `${APP_STATE.stationeryTransactions.length} Entries`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (APP_STATE.stationeryTransactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center theme-text-dim">
          <span class="text-3xl block mb-2">📦</span>
          No stationery transactions recorded for ${APP_STATE.currentStationeryDate}.
        </td>
      </tr>
    `;
    return;
  }

  APP_STATE.stationeryTransactions.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';
    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono text-xs whitespace-nowrap">
        <span class="theme-text-muted">${item.time || '--:--'}</span>
        <span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">${item.itemCode || 'ST'}</span>
      </td>
      <td class="py-3 px-3 sm:px-4 font-medium theme-text-main">${item.itemName}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs theme-text-muted">${formatLKR(item.costPrice)}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold text-emerald-400">${formatLKR(item.profit)}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap space-x-1">
        <button type="button" data-edit-stat="${item.id}" class="tap-target p-1 text-sky-400 hover:text-sky-300 transition" title="Edit Sale">
          ✏️
        </button>
        <button type="button" data-delete-stat="${item.id}" class="tap-target p-1 text-red-400 hover:text-red-300 transition" title="Delete Sale">
          🗑️
        </button>
      </td>
    `;

    const editBtn = tr.querySelector(`[data-edit-stat="${item.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => openEditStationeryModal(item));
    }

    const deleteBtn = tr.querySelector(`[data-delete-stat="${item.id}"]`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteStationeryTransaction(item.id, item.itemName));
    }

    tbody.appendChild(tr);
  });
}

async function deleteStationeryTransaction(id, name) {
  if (!confirm(`Delete stationery entry "${name}"?`)) return;
  try {
    await deleteDoc(doc(db, 'stationery_transactions', id));
    showToast(`Removed entry: ${name}`, 'info');
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

function updateStationerySummary() {
  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;

  APP_STATE.stationeryTransactions.forEach(t => {
    totalSales += Number(t.sellingPrice) || 0;
    totalCost += Number(t.costPrice) || 0;
    totalProfit += Number(t.profit) || 0;
  });

  totalSales = roundCurrency(totalSales);
  totalCost = roundCurrency(totalCost);
  totalProfit = roundCurrency(totalProfit);

  const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : '0.00';

  const statTotalSales = document.getElementById('statTotalSales');
  const statTotalCost = document.getElementById('statTotalCost');
  const statTotalProfit = document.getElementById('statTotalProfit');
  const statOverallMargin = document.getElementById('statOverallMargin');

  if (statTotalSales) statTotalSales.textContent = formatLKR(totalSales);
  if (statTotalCost) statTotalCost.textContent = formatLKR(totalCost);
  if (statTotalProfit) statTotalProfit.textContent = formatLKR(totalProfit);
  if (statOverallMargin) statOverallMargin.textContent = `${overallMargin}%`;
}

// =============================================================================
// 10. MODULE 3: MOBILE RELOAD & COMMISSION LEDGER LOGIC
// =============================================================================

function setupReloadModule() {
  const reloadDateInput = document.getElementById('reloadDateInput');
  const reloadTodayBtn = document.getElementById('reloadTodayBtn');
  const reloadEntryForm = document.getElementById('reloadEntryForm');
  const reloadAmountInput = document.getElementById('reloadAmountInput');
  const reloadCommissionPreview = document.getElementById('reloadCommissionPreview');
  const reloadActiveRatePreview = document.getElementById('reloadActiveRatePreview');

  // Date Change Handlers
  if (reloadDateInput) {
    reloadDateInput.addEventListener('change', () => {
      APP_STATE.currentReloadDate = reloadDateInput.value;
      listenToReloads(APP_STATE.currentReloadDate);
    });
  }

  if (reloadTodayBtn) {
    reloadTodayBtn.addEventListener('click', () => {
      const today = getTodayDateString();
      if (reloadDateInput) reloadDateInput.value = today;
      APP_STATE.currentReloadDate = today;
      listenToReloads(today);
    });
  }

  // Operator Select Buttons in Reload Entry Card
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

  // Quick Amount Preset Buttons (50, 100, 200, 500, 1000, 2000)
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

  // Calculate Commission Preview on Amount input
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

  // Operator Sub-tabs / Filters for Log Table
  document.querySelectorAll('.reload-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const opFilter = btn.getAttribute('data-operator');
      APP_STATE.activeReloadFilter = opFilter;

      document.querySelectorAll('.reload-filter-btn').forEach(b => {
        b.classList.remove('active', 'theme-bg-accent', 'text-white');
      });
      btn.classList.add('active', 'theme-bg-accent', 'text-white');

      renderReloadTable();
      updateReloadSummary();
    });
  });

  // Submit Reload Form
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
        date: APP_STATE.currentReloadDate,
        time: getCurrentTimeString(),
        operator: op,
        amount: amount,
        commissionRate: rate,
        commissionAmount: commissionAmount,
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'reload_transactions'), reloadPayload);
        showToast(`Recorded ${op} Reload: ${formatLKR(amount)} (+${formatLKR(commissionAmount)})`, 'success');

        reloadAmountInput.value = '';
        updateReloadRatePreview();
        reloadAmountInput.focus();
      } catch (err) {
        logDebug(`Error adding reload transaction: ${err.message}`, 'ERROR');
        showToast(`Failed to record reload: ${err.message}`, 'error');
      }
    });
  }

  // Set default active button
  const defaultOpBtn = document.querySelector('[data-select-op="MOBITEL"]');
  if (defaultOpBtn) defaultOpBtn.click();
}

function renderReloadTable() {
  const tbody = document.getElementById('reloadTableBody');
  const countBadge = document.getElementById('reloadCountBadge');
  const dateLabel = document.getElementById('reloadTableDateLabel');

  if (dateLabel) {
    dateLabel.textContent = APP_STATE.currentReloadDate === getTodayDateString() 
      ? `Today (${APP_STATE.currentReloadDate})` 
      : APP_STATE.currentReloadDate;
  }

  // Filter list by selected operator tab
  const filtered = APP_STATE.activeReloadFilter === 'ALL'
    ? APP_STATE.reloadTransactions
    : APP_STATE.reloadTransactions.filter(r => r.operator === APP_STATE.activeReloadFilter);

  if (countBadge) countBadge.textContent = `${filtered.length} Entries`;

  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center theme-text-dim">
          <span class="text-3xl block mb-2">📱</span>
          No mobile reloads recorded for this date and filter.
        </td>
      </tr>
    `;
    return;
  }

  const opBadges = {
    AIRTEL: '<span class="px-2 py-0.5 rounded text-[11px] font-bold badge-airtel">Airtel</span>',
    DIALOG: '<span class="px-2 py-0.5 rounded text-[11px] font-bold badge-dialog">Dialog</span>',
    MOBITEL: '<span class="px-2 py-0.5 rounded text-[11px] font-bold badge-mobitel">Mobitel</span>',
    HUTCH: '<span class="px-2 py-0.5 rounded text-[11px] font-bold badge-hutch">Hutch</span>'
  };

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';
    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono text-xs whitespace-nowrap theme-text-muted">${item.time || '--:--'}</td>
      <td class="py-3 px-3 sm:px-4 font-medium">${opBadges[item.operator] || item.operator}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold theme-text-main">${formatLKR(item.amount)}</td>
      <td class="py-3 px-3 sm:px-4 text-center font-mono text-xs theme-text-dim">${Number(item.commissionRate || 0).toFixed(2)}%</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold text-emerald-400">${formatLKR(item.commissionAmount)}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
        <button type="button" data-delete-reload="${item.id}" class="tap-target p-1 text-red-400 hover:text-red-300 transition" title="Delete Reload">
          🗑️
        </button>
      </td>
    `;

    const deleteBtn = tr.querySelector(`[data-delete-reload="${item.id}"]`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteReloadTransaction(item.id, item.operator, item.amount));
    }

    tbody.appendChild(tr);
  });
}

async function deleteReloadTransaction(id, operator, amount) {
  if (!confirm(`Delete reload record for ${operator} (${formatLKR(amount)})?`)) return;
  try {
    await deleteDoc(doc(db, 'reload_transactions', id));
    showToast(`Removed ${operator} reload record`, 'info');
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

function updateReloadSummary() {
  const filtered = APP_STATE.activeReloadFilter === 'ALL'
    ? APP_STATE.reloadTransactions
    : APP_STATE.reloadTransactions.filter(r => r.operator === APP_STATE.activeReloadFilter);

  let totalVolume = 0;
  let totalCommission = 0;

  filtered.forEach(r => {
    totalVolume += Number(r.amount) || 0;
    totalCommission += Number(r.commissionAmount) || 0;
  });

  const reloadTotalVolume = document.getElementById('reloadTotalVolume');
  const reloadTotalCommission = document.getElementById('reloadTotalCommission');

  if (reloadTotalVolume) reloadTotalVolume.textContent = formatLKR(roundCurrency(totalVolume));
  if (reloadTotalCommission) reloadTotalCommission.textContent = formatLKR(roundCurrency(totalCommission));
}

// =============================================================================
// 11. DASHBOARD OVERVIEW & FINANCIAL PULSE KPIS
// =============================================================================

function updateDashboardKPIs() {
  // Compute Stationery Stats for Today
  let stationerySales = 0;
  let stationeryProfit = 0;
  APP_STATE.stationeryTransactions.forEach(s => {
    stationerySales += Number(s.sellingPrice) || 0;
    stationeryProfit += Number(s.profit) || 0;
  });

  // Compute Reload Stats for Today
  let reloadVolume = 0;
  let reloadCommission = 0;
  const opTotals = { AIRTEL: 0, DIALOG: 0, MOBITEL: 0, HUTCH: 0 };

  APP_STATE.reloadTransactions.forEach(r => {
    const amt = Number(r.amount) || 0;
    const comm = Number(r.commissionAmount) || 0;
    reloadVolume += amt;
    reloadCommission += comm;

    if (opTotals[r.operator] !== undefined) {
      opTotals[r.operator] += comm;
    }
  });

  const combinedProfit = roundCurrency(stationeryProfit + reloadCommission);

  // Update DOM Elements
  const dashStationerySales = document.getElementById('dashStationerySales');
  const dashStationeryProfit = document.getElementById('dashStationeryProfit');
  const dashReloadVolume = document.getElementById('dashReloadVolume');
  const dashReloadCommission = document.getElementById('dashReloadCommission');
  const dashTodayCombinedProfit = document.getElementById('dashTodayCombinedProfit');

  if (dashStationerySales) dashStationerySales.textContent = formatLKR(roundCurrency(stationerySales));
  if (dashStationeryProfit) dashStationeryProfit.textContent = formatLKR(roundCurrency(stationeryProfit));
  if (dashReloadVolume) dashReloadVolume.textContent = formatLKR(roundCurrency(reloadVolume));
  if (dashReloadCommission) dashReloadCommission.textContent = formatLKR(roundCurrency(reloadCommission));
  if (dashTodayCombinedProfit) dashTodayCombinedProfit.textContent = formatLKR(combinedProfit);

  // Operator pulse cards
  const dashAirtelComm = document.getElementById('dashAirtelComm');
  const dashDialogComm = document.getElementById('dashDialogComm');
  const dashMobitelComm = document.getElementById('dashMobitelComm');
  const dashHutchComm = document.getElementById('dashHutchComm');

  if (dashAirtelComm) dashAirtelComm.textContent = formatLKR(roundCurrency(opTotals.AIRTEL));
  if (dashDialogComm) dashDialogComm.textContent = formatLKR(roundCurrency(opTotals.DIALOG));
  if (dashMobitelComm) dashMobitelComm.textContent = formatLKR(roundCurrency(opTotals.MOBITEL));
  if (dashHutchComm) dashHutchComm.textContent = formatLKR(roundCurrency(opTotals.HUTCH));
}

function updateCommissionUI() {
  const rates = APP_STATE.commissionRates;

  // Header and Dashboard Badges
  const rAirtel = document.getElementById('rateAirtelBadge');
  const rDialog = document.getElementById('rateDialogBadge');
  const rMobitel = document.getElementById('rateMobitelBadge');
  const rHutch = document.getElementById('rateHutchBadge');

  if (rAirtel) rAirtel.textContent = `${rates.AIRTEL.toFixed(2)}%`;
  if (rDialog) rDialog.textContent = `${rates.DIALOG.toFixed(2)}%`;
  if (rMobitel) rMobitel.textContent = `${rates.MOBITEL.toFixed(2)}%`;
  if (rHutch) rHutch.textContent = `${rates.HUTCH.toFixed(2)}%`;

  // Reload Entry form labels
  const fAirtel = document.getElementById('formRateAirtel');
  const fDialog = document.getElementById('formRateDialog');
  const fMobitel = document.getElementById('formRateMobitel');
  const fHutch = document.getElementById('formRateHutch');

  if (fAirtel) fAirtel.textContent = `${rates.AIRTEL.toFixed(2)}%`;
  if (fDialog) fDialog.textContent = `${rates.DIALOG.toFixed(2)}%`;
  if (fMobitel) fMobitel.textContent = `${rates.MOBITEL.toFixed(2)}%`;
  if (fHutch) fHutch.textContent = `${rates.HUTCH.toFixed(2)}%`;

  // Settings form input values
  const inAirtel = document.getElementById('rateAirtelInput');
  const inDialog = document.getElementById('rateDialogInput');
  const inMobitel = document.getElementById('rateMobitelInput');
  const inHutch = document.getElementById('rateHutchInput');

  if (inAirtel) inAirtel.value = rates.AIRTEL.toFixed(2);
  if (inDialog) inDialog.value = rates.DIALOG.toFixed(2);
  if (inMobitel) inMobitel.value = rates.MOBITEL.toFixed(2);
  if (inHutch) inHutch.value = rates.HUTCH.toFixed(2);

  // Trigger preview update if reload input is open
  const reloadAmountInput = document.getElementById('reloadAmountInput');
  if (reloadAmountInput) {
    reloadAmountInput.dispatchEvent(new Event('input'));
  }
}

// =============================================================================
// 12. MODULE 4: MASTER INVENTORY CATALOG & SETTINGS
// =============================================================================

function setupCatalogAndSettings() {
  const catalogItemForm = document.getElementById('catalogItemForm');
  const catalogDocId = document.getElementById('catalogDocId');
  const catalogCode = document.getElementById('catalogCode');
  const catalogName = document.getElementById('catalogName');
  const catalogCostPrice = document.getElementById('catalogCostPrice');
  const catalogSellingPrice = document.getElementById('catalogSellingPrice');
  const catalogSaveBtn = document.getElementById('catalogSaveBtn');
  const catalogFormTitle = document.getElementById('catalogFormTitle');
  const catalogResetFormBtn = document.getElementById('catalogResetFormBtn');
  const seedCatalogBtn = document.getElementById('seedCatalogBtn');
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const commissionsForm = document.getElementById('commissionsForm');

  // Reset catalog edit form
  function resetCatalogForm() {
    catalogItemForm.reset();
    catalogDocId.value = '';
    catalogFormTitle.textContent = 'Add New Catalog Item';
    catalogSaveBtn.textContent = 'Save Item to Catalog';
    catalogResetFormBtn.classList.add('hidden');
  }

  if (catalogResetFormBtn) catalogResetFormBtn.addEventListener('click', resetCatalogForm);

  // Add or Edit Catalog Item
  if (catalogItemForm) {
    catalogItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = catalogCode.value.trim().toUpperCase();
      const name = catalogName.value.trim();
      const cost = roundCurrency(catalogCostPrice.value);
      const sell = roundCurrency(catalogSellingPrice.value);
      const docId = catalogDocId.value;

      if (!code || !name) {
        showToast('Please provide an Item Code and Name', 'error');
        return;
      }

      const itemPayload = {
        code,
        name,
        costPrice: cost,
        sellingPrice: sell,
        updatedAt: serverTimestamp()
      };

      try {
        if (docId) {
          // Edit existing item
          await updateDoc(doc(db, 'inventory', docId), itemPayload);
          showToast(`Updated catalog item: ${name}`, 'success');
        } else {
          // Add new item
          await addDoc(collection(db, 'inventory'), itemPayload);
          showToast(`Added ${name} to Master Catalog`, 'success');
        }
        resetCatalogForm();
      } catch (err) {
        showToast(`Catalog error: ${err.message}`, 'error');
      }
    });
  }

  // Filter Inventory Table in Settings
  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', renderInventoryTable);
  }

  // Seed standard Sri Lankan stationery catalog
  if (seedCatalogBtn) {
    seedCatalogBtn.addEventListener('click', async () => {
      if (!confirm('Populate standard Sri Lankan stationery catalog items?')) return;
      try {
        let addedCount = 0;
        for (const item of SAMPLE_SRI_LANKAN_CATALOG) {
          // Check if item code already exists in catalog
          const exists = APP_STATE.inventoryCatalog.some(c => c.code === item.code);
          if (!exists) {
            await addDoc(collection(db, 'inventory'), {
              ...item,
              updatedAt: serverTimestamp()
            });
            addedCount++;
          }
        }
        showToast(`Successfully seeded ${addedCount} stationery items!`, 'success');
      } catch (err) {
        showToast(`Error seeding catalog: ${err.message}`, 'error');
      }
    });
  }

  // Commission Rates Form Submission
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

        showToast('Commission rates updated across all modules!', 'success');
      } catch (err) {
        showToast(`Failed to save rates: ${err.message}`, 'error');
      }
    });
  }
}

function renderInventoryTable() {
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
        <td colspan="6" class="py-6 text-center theme-text-dim">
          No inventory items match "${queryStr}".
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const profit = roundCurrency((item.sellingPrice || 0) - (item.costPrice || 0));
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-sky-400 whitespace-nowrap">${item.code}</td>
      <td class="py-2.5 px-3 font-medium theme-text-main">${item.name}</td>
      <td class="py-2.5 px-3 text-right font-mono theme-text-muted">${formatLKR(item.costPrice)}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${formatLKR(profit)}</td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap space-x-1">
        <button type="button" data-edit-item="${item.id}" class="p-1 text-sky-400 hover:text-sky-300" title="Edit Item">
          ✏️
        </button>
        <button type="button" data-delete-item="${item.id}" class="p-1 text-red-400 hover:text-red-300" title="Delete Item">
          🗑️
        </button>
      </td>
    `;

    // Edit button click
    const editBtn = tr.querySelector(`[data-edit-item="${item.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        document.getElementById('catalogDocId').value = item.id;
        document.getElementById('catalogCode').value = item.code;
        document.getElementById('catalogName').value = item.name;
        document.getElementById('catalogCostPrice').value = Number(item.costPrice).toFixed(2);
        document.getElementById('catalogSellingPrice').value = Number(item.sellingPrice).toFixed(2);
        document.getElementById('catalogFormTitle').textContent = `Edit Item: ${item.name}`;
        document.getElementById('catalogSaveBtn').textContent = 'Update Catalog Item';
        document.getElementById('catalogResetFormBtn').classList.remove('hidden');
        document.getElementById('catalogCode').focus();
      });
    }

    // Delete button click
    const delBtn = tr.querySelector(`[data-delete-item="${item.id}"]`);
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete item "${item.name}" from master inventory?`)) return;
        try {
          await deleteDoc(doc(db, 'inventory', item.id));
          showToast(`Deleted ${item.name} from catalog`, 'info');
        } catch (err) {
          showToast(`Failed to delete: ${err.message}`, 'error');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 13. HIDDEN DEVELOPER DEBUGGER CONSOLE
// =============================================================================

function setupDeveloperConsole() {
  const devConsoleToggle = document.getElementById('devConsoleToggle');
  const devConsoleBody = document.getElementById('devConsoleBody');
  const dbgFirestoreHealth = document.getElementById('dbgFirestoreHealth');
  const dbgAuthState = document.getElementById('dbgAuthState');
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

  // Latency & Firestore Ping Test
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
          dbgFirestoreHealth.textContent = 'Degraded / Error';
          dbgFirestoreHealth.className = 'font-bold font-mono text-red-400';
        }
        showToast(`Ping failed: ${err.message}`, 'error');
      }
    });
  }

  // Clear LocalStorage Cache
  if (dbgClearCacheBtn) {
    dbgClearCacheBtn.addEventListener('click', () => {
      if (confirm('Clear local theme & API key storage cache? (Firestore cloud data will remain untouched)')) {
        localStorage.clear();
        updateCacheMetrics();
        showToast('Local browser storage cache cleared', 'info');
        logDebug('LocalStorage cache purged by developer action');
      }
    });
  }

  // Clear Debug Logs
  if (dbgClearLogsBtn) {
    dbgClearLogsBtn.addEventListener('click', () => {
      APP_STATE.devLogs = [];
      const terminalEl = document.getElementById('dbgTerminalLogs');
      if (terminalEl) terminalEl.innerHTML = '<div class="text-sky-400 font-bold">[SYSTEM] Logs Cleared.</div>';
    });
  }

  // Export JSON Backup
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
    exportedAt: new Date().toISOString(),
    projectId: 'al-p1-fb432',
    user: APP_STATE.currentUser ? APP_STATE.currentUser.email : 'anonymous',
    commissionRates: APP_STATE.commissionRates,
    inventoryCatalog: APP_STATE.inventoryCatalog,
    stationeryTransactions: APP_STATE.stationeryTransactions,
    reloadTransactions: APP_STATE.reloadTransactions
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sri-lankan-pos-backup-${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported complete data JSON backup', 'success');
  logDebug('JSON database backup downloaded', 'SUCCESS');
}

// =============================================================================
// 14. APPLICATION INITIALIZATION LIFECYCLE
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  logDebug('POS System initializing for GitHub Pages (Project: al-p1-fb432)...');

  // 1. Initialize Theme Engine
  initTheme();

  // 2. Start Live Digital Clock
  startLiveClock();

  // 3. Start Cloud / Network Monitor
  initNetworkMonitor();

  // 4. Setup Authentication Guard & Forms
  setupAuth();

  // 5. Setup View Navigation & Modals
  initNavigation();

  // 6. Setup Stationery POS Module
  setupStationeryModule();

  // 7. Setup Reload & Commission Module
  setupReloadModule();

  // 8. Setup Catalog & Settings Sub-panels
  setupCatalogAndSettings();

  // 9. Setup Developer Debug Console
  setupDeveloperConsole();

  logDebug('Application Lifecycle initialization complete.');
});
