// =============================================================================
// AL COMMUNICATION — SYSTEM LOGIC CORE (VERSION 4.0)
// High-End Retail Stationery & Mobile Reload POS, Inventory & Profit Engine
// GitHub Pages SPA | Three.js WebGL | Lenis Smooth Scroll | GSAP Motion Engine
// Firebase Cloud Firestore v11 | Auth Guard (lasasdias11@gmail.com)
// Project ID: al-p1-fb432 | Primary Currency: LKR (Rs. 0.00 exact cent precision)
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
// 1. APPLICATION STATE & CONSTANTS
// =============================================================================

const DEFAULT_PRESETS = [100, 250, 500, 1000];

const DEFAULT_DASHBOARD_CARDS = [
  'card-dash-stationery',
  'card-dash-reloads',
  'card-dash-commission',
  'card-dash-profit-today',
  'card-dash-profit-month',
  'card-dash-profit-year',
  'card-dash-catalog',
  'card-dash-tile-stationery',
  'card-dash-tile-reloads',
  'card-dash-tile-stock',
  'card-dash-tile-logs'
];

const DEFAULT_LOG_METRIC_CARDS = [
  'card-today-stationery',
  'card-today-reloads',
  'card-combined-revenue',
  'card-today-profit',
  'card-monthly-analytics',
  'card-yearly-analytics',
  'card-operator-breakdown'
];

const APP_STATE = {
  currentUser: null,
  activeTheme: 'modern-slate',
  activeUiStyle: 'glass', // 'glass' | 'default'
  activeView: 'dashboard',
  currentDate: '',
  commissionRates: {
    AIRTEL: 6.80,
    DIALOG: 3.80,
    MOBITEL: 6.80,
    HUTCH: 5.00
  },
  reloadPresets: [...DEFAULT_PRESETS],
  inventoryCatalog: [],
  selectedCatalogItem: null,
  activeReloadOperator: 'MOBITEL',

  // Real-time feeds for today
  todayStationeryTransactions: [],
  todayReloadTransactions: [],

  // Master Logs Filter State
  logCategoryFilter: 'ALL', // 'ALL' | 'STATIONERY' | 'RELOAD'
  logDateMode: 'TODAY',     // 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'SPECIFIC' | 'RANGE'
  logDateFrom: '',
  logDateTo: '',
  masterStationeryRecords: [],
  masterReloadRecords: [],

  // Stock View Filter
  stockFilter: 'ALL', // 'ALL' | 'LOW' | 'OUT'

  // Analytics Month (YYYY-MM)
  analyticsMonth: '',

  // Dashboard & Metrics Layouts
  dashboardCardOrder: [...DEFAULT_DASHBOARD_CARDS],
  metricsCardOrder: [...DEFAULT_LOG_METRIC_CARDS],
  metricsCardSizes: {},

  unsubscribers: {
    commissions: null,
    presets: null,
    inventory: null,
    todayStationery: null,
    todayReloads: null,
    masterStationery: null,
    masterReloads: null,
    userSettings: null
  },
  devLogs: []
};

// Standard Sri Lankan Stationery Catalog with Getting (Cost) Prices & Selling Prices
const SAMPLE_SRI_LANKAN_CATALOG = [
  { code: 'ST-001', name: 'Atlas CR Book 80 Pages (Single Rule)', category: 'Exercise Books', costPrice: 155.00, sellingPrice: 200.00, stockQuantity: 50, lowStockThreshold: 10 },
  { code: 'ST-002', name: 'Atlas CR Book 120 Pages (Single Rule)', category: 'Exercise Books', costPrice: 215.00, sellingPrice: 280.00, stockQuantity: 40, lowStockThreshold: 10 },
  { code: 'ST-003', name: 'Atlas CR Book 160 Pages (Single Rule)', category: 'Exercise Books', costPrice: 290.00, sellingPrice: 370.00, stockQuantity: 35, lowStockThreshold: 10 },
  { code: 'ST-004', name: 'Atlas CR Book 80 Pages (Square Rule)', category: 'Exercise Books', costPrice: 155.00, sellingPrice: 200.00, stockQuantity: 45, lowStockThreshold: 10 },
  { code: 'ST-005', name: 'Atlas Chooty Pen Blue (0.5mm)', category: 'Pens & Pencils', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 200, lowStockThreshold: 25 },
  { code: 'ST-006', name: 'Atlas Chooty Pen Black (0.5mm)', category: 'Pens & Pencils', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 150, lowStockThreshold: 25 },
  { code: 'ST-007', name: 'Atlas Chooty Pen Red (0.5mm)', category: 'Pens & Pencils', costPrice: 22.00, sellingPrice: 30.00, stockQuantity: 100, lowStockThreshold: 20 },
  { code: 'ST-008', name: 'Nataraj 2B Pencil Pack (10s)', category: 'Pens & Pencils', costPrice: 200.00, sellingPrice: 260.00, stockQuantity: 30, lowStockThreshold: 8 },
  { code: 'ST-009', name: 'A4 Photocopy Paper 80gsm (Pack 500)', category: 'Paper & Files', costPrice: 1380.00, sellingPrice: 1600.00, stockQuantity: 25, lowStockThreshold: 5 },
  { code: 'ST-010', name: 'A4 Photocopy Single Page (B/W)', category: 'Photocopy & Print', costPrice: 3.50, sellingPrice: 10.00, stockQuantity: 1000, lowStockThreshold: 100 },
  { code: 'ST-011', name: 'A4 Colour Print Single Page', category: 'Photocopy & Print', costPrice: 15.00, sellingPrice: 40.00, stockQuantity: 500, lowStockThreshold: 50 },
  { code: 'ST-012', name: 'Bristol Board Sheet (White/Colours)', category: 'Art & Craft', costPrice: 42.00, sellingPrice: 60.00, stockQuantity: 80, lowStockThreshold: 15 },
  { code: 'ST-013', name: 'Atlas Colour Pastels (12 Shades)', category: 'Art & Craft', costPrice: 175.00, sellingPrice: 230.00, stockQuantity: 25, lowStockThreshold: 5 },
  { code: 'ST-014', name: 'Clear Display File Folder (A4)', category: 'Paper & Files', costPrice: 125.00, sellingPrice: 170.00, stockQuantity: 40, lowStockThreshold: 10 },
  { code: 'ST-015', name: 'UHU / Atlas Glue Stick 15g', category: 'Adhesives', costPrice: 110.00, sellingPrice: 150.00, stockQuantity: 30, lowStockThreshold: 8 }
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
// 3. LOGGING, TOASTS & GLASS RIPPLE ENGINE
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

function initGlassRippleFeedback() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.glass-btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'glass-ripple';
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 550);
  });
}

function pulseCard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const card = el.closest('.dash-card, .metric-card');
  if (card) {
    card.classList.remove('updated');
    void card.offsetWidth; // Trigger reflow
    card.classList.add('updated');
  }
}

// =============================================================================
// 3A. THREE.JS INTERACTIVE ANTI-GRAVITY CANVAS BACKGROUND
// =============================================================================

let threeScene, threeCamera, threeRenderer, threeParticlesGeometry, threeParticlesMaterial, threePoints;
let threeAnimId = null;
let threeMouseX = 0;
let threeMouseY = 0;
let threeParticlePositions, threeParticleVelocities, threeParticlePhases;
const THREE_PARTICLE_COUNT = 380;

function createSoftGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function getThemeParticleColor(themeName) {
  switch (themeName) {
    case 'emerald-store':
      return 0x10b981; // Emerald green
    case 'sapphire-blue':
      return 0x3b82f6; // Sapphire blue
    case 'warm-amber':
      return 0xf59e0b; // Warm amber gold
    case 'modern-slate':
    default:
      return 0x38bdf8; // Sky cyan
  }
}

export function initThreeBackground() {
  if (typeof THREE === 'undefined') {
    logDebug('Three.js not available; background canvas omitted', 'INFO');
    return;
  }

  const canvas = document.getElementById('webglCanvas');
  if (!canvas) return;

  try {
    threeScene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    threeCamera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    threeCamera.position.z = 160;

    threeRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    threeParticlesGeometry = new THREE.BufferGeometry();
    threeParticlePositions = new Float32Array(THREE_PARTICLE_COUNT * 3);
    threeParticleVelocities = new Float32Array(THREE_PARTICLE_COUNT * 3);
    threeParticlePhases = new Float32Array(THREE_PARTICLE_COUNT);

    for (let i = 0; i < THREE_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      threeParticlePositions[i3] = (Math.random() - 0.5) * 360;      // x
      threeParticlePositions[i3 + 1] = (Math.random() - 0.5) * 280;  // y
      threeParticlePositions[i3 + 2] = (Math.random() - 0.5) * 240;  // z

      // Anti-gravity upward drift: positive vy
      threeParticleVelocities[i3] = (Math.random() - 0.5) * 0.08;     // vx
      threeParticleVelocities[i3 + 1] = 0.12 + Math.random() * 0.28;  // vy (upward float!)
      threeParticleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.08; // vz

      threeParticlePhases[i] = Math.random() * Math.PI * 2;
    }

    threeParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(threeParticlePositions, 3));

    const glowTex = createSoftGlowTexture();
    const initColor = getThemeParticleColor(APP_STATE.activeTheme);

    threeParticlesMaterial = new THREE.PointsMaterial({
      size: 5.2,
      map: glowTex,
      color: initColor,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    threePoints = new THREE.Points(threeParticlesGeometry, threeParticlesMaterial);
    threeScene.add(threePoints);

    // Mouse & Touch Tracking
    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      threeMouseX = (clientX / window.innerWidth - 0.5) * 2;
      threeMouseY = (clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Window Resize Handler
    const onWindowResize = () => {
      if (!threeCamera || !threeRenderer) return;
      threeCamera.aspect = window.innerWidth / window.innerHeight;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // Visibility Listener to save battery when tab is backgrounded
    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = (document.visibilityState === 'visible');
    });

    // Animation Render Loop
    let clock = 0;
    const animateThree = () => {
      threeAnimId = requestAnimationFrame(animateThree);
      if (!isVisible) return;

      clock += 0.015;
      const positions = threeParticlesGeometry.attributes.position.array;

      for (let i = 0; i < THREE_PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Apply anti-gravity upward movement
        positions[i3 + 1] += threeParticleVelocities[i3 + 1];
        positions[i3] += Math.sin(threeParticlePhases[i] + clock) * 0.05 + threeParticleVelocities[i3];
        positions[i3 + 2] += Math.cos(threeParticlePhases[i] + clock) * 0.04;

        // Reset if drifted above top bound
        if (positions[i3 + 1] > 150) {
          positions[i3 + 1] = -150;
          positions[i3] = (Math.random() - 0.5) * 360;
          positions[i3 + 2] = (Math.random() - 0.5) * 240;
        }
      }

      threeParticlesGeometry.attributes.position.needsUpdate = true;

      // Subtle camera tilt following pointer
      threeCamera.position.x += (threeMouseX * 12 - threeCamera.position.x) * 0.03;
      threeCamera.position.y += (-threeMouseY * 10 - threeCamera.position.y) * 0.03;
      threeCamera.lookAt(0, 0, 0);

      threeRenderer.render(threeScene, threeCamera);
    };

    animateThree();
    logDebug('Three.js interactive anti-gravity particle engine initialized', 'SUCCESS');
  } catch (err) {
    console.warn('Three.js WebGL initialization caught:', err);
    logDebug(`Three.js initialization notice: ${err.message}`, 'WARN');
  }
}

export function updateThreeTheme(themeName) {
  if (!threeParticlesMaterial) return;
  const newColor = getThemeParticleColor(themeName);
  if (typeof gsap !== 'undefined') {
    const currentColor = threeParticlesMaterial.color;
    const targetColor = new THREE.Color(newColor);
    gsap.to(currentColor, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        threeParticlesMaterial.needsUpdate = true;
      }
    });
  } else {
    threeParticlesMaterial.color.setHex(newColor);
  }
}

// =============================================================================
// 3B. LENIS MOMENTUM SMOOTH SCROLL ENGINE
// =============================================================================

let lenisInstance = null;

export function initLenisScroll() {
  if (typeof Lenis === 'undefined') {
    logDebug('Lenis smooth scroll library not present; using standard scroll', 'INFO');
    return;
  }

  try {
    lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    window.lenis = lenisInstance;
    logDebug('Lenis momentum smooth scrolling engine initialized', 'SUCCESS');
  } catch (lenisErr) {
    console.warn('Lenis initialization notice:', lenisErr);
  }
}

// =============================================================================
// 3C. GSAP MOTION & COUNTERS ENGINE
// =============================================================================

export function animateMetricValue(element, targetVal, isCurrency = true, prefix = '', suffix = '') {
  if (!element) return;
  const numTarget = Number(targetVal) || 0;

  if (typeof gsap === 'undefined') {
    element.textContent = isCurrency 
      ? (prefix + formatLKR(roundCurrency(numTarget)) + suffix) 
      : (prefix + Math.round(numTarget).toLocaleString('en-US') + suffix);
    element.setAttribute('data-numeric-val', numTarget);
    return;
  }

  const prevVal = parseFloat(element.getAttribute('data-numeric-val') || '0');
  if (prevVal === numTarget && element.textContent) {
    return;
  }

  const tweenObj = { val: prevVal };
  gsap.to(tweenObj, {
    val: numTarget,
    duration: 0.7,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = isCurrency 
        ? (prefix + formatLKR(roundCurrency(tweenObj.val)) + suffix) 
        : (prefix + Math.round(tweenObj.val).toLocaleString('en-US') + suffix);
    },
    onComplete: () => {
      element.setAttribute('data-numeric-val', numTarget);
      element.textContent = isCurrency 
        ? (prefix + formatLKR(roundCurrency(numTarget)) + suffix) 
        : (prefix + Math.round(numTarget).toLocaleString('en-US') + suffix);
    }
  });
}

export function animateViewTransition(targetView) {
  if (typeof gsap === 'undefined' || !targetView) return;
  gsap.fromTo(targetView, 
    { opacity: 0, y: 16 }, 
    { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
  );
  const cards = targetView.querySelectorAll('.dash-card, .kpi-card, .stationery-form-card, .reload-form-card');
  if (cards.length > 0) {
    gsap.fromTo(cards, 
      { opacity: 0, y: 12 }, 
      { opacity: 1, y: 0, duration: 0.32, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  }
}

export function animateModalOpen(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('hidden');
  const content = modalEl.querySelector('.modal-content') || modalEl.firstElementChild;
  if (content && typeof gsap !== 'undefined') {
    gsap.fromTo(content,
      { opacity: 0, scale: 0.93, y: 14 },
      { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'back.out(1.5)', clearProps: 'transform' }
    );
  }
}

export function animateButtonPress(btn) {
  if (!btn || typeof gsap === 'undefined') return;
  gsap.fromTo(btn,
    { scale: 0.94 },
    { scale: 1, duration: 0.24, ease: 'back.out(2)' }
  );
}

// =============================================================================
// 4. THEME & UI STYLE ENGINE
// =============================================================================

export function setTheme(themeName) {
  const validThemes = ['modern-slate', 'emerald-store', 'sapphire-blue', 'warm-amber'];
  if (!validThemes.includes(themeName)) themeName = 'modern-slate';

  document.documentElement.setAttribute('data-theme', themeName);
  APP_STATE.activeTheme = themeName;
  localStorage.setItem('al_theme', themeName);

  const isLight = (themeName === 'emerald-store' || themeName === 'warm-amber');
  if (isLight) {
    document.body?.classList.add('light-theme');
    document.documentElement.classList.add('light-theme');
  } else {
    document.body?.classList.remove('light-theme');
    document.documentElement.classList.remove('light-theme');
  }

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

  // Synchronize Three.js particle color with the chosen theme
  updateThreeTheme(themeName);

  logDebug(`Theme applied: ${themeName}`);
}

export function setUiStyle(uiStyle) {
  const validStyles = ['glass', 'default'];
  if (!validStyles.includes(uiStyle)) uiStyle = 'glass';

  document.documentElement.setAttribute('data-ui-style', uiStyle);
  APP_STATE.activeUiStyle = uiStyle;
  localStorage.setItem('al_ui_style', uiStyle);

  if (uiStyle === 'glass') {
    document.body?.classList.add('glass-ui-active');
    document.documentElement.classList.add('glass-ui-active');
  } else {
    document.body?.classList.remove('glass-ui-active');
    document.documentElement.classList.remove('glass-ui-active');
  }

  const toggle = document.getElementById('uiStyleGlassToggle');
  if (toggle) {
    toggle.checked = (uiStyle === 'glass');
  }

  logDebug(`UI style applied: ${uiStyle}`);
}

function initThemeAndStyle() {
  const savedTheme = localStorage.getItem('al_theme') || 'modern-slate';
  setTheme(savedTheme);

  const savedUiStyle = localStorage.getItem('al_ui_style') || 'glass';
  setUiStyle(savedUiStyle);

  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const choice = button.getAttribute('data-theme-choice');
      setTheme(choice);
      showToast(`Theme switched to ${button.querySelector('.font-bold')?.textContent || choice}`, 'info');
    });
  });

  const uiStyleToggle = document.getElementById('uiStyleGlassToggle');
  if (uiStyleToggle) {
    uiStyleToggle.addEventListener('change', (e) => {
      const newStyle = e.target.checked ? 'glass' : 'default';
      setUiStyle(newStyle);
      showToast(`Switched to ${newStyle === 'glass' ? 'iOS Glass UI' : 'Clean Solid UI'}`, 'info');
    });
  }
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
      logDebug('Network online: Cloud sync active', 'SUCCESS');
    } else {
      if (syncBadge) {
        syncBadge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20';
        syncText.textContent = 'Offline Cache';
      }
      if (mobileSyncBadge) {
        mobileSyncBadge.className = 'sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20';
      }
      logDebug('Network offline: Local offline cache engaged', 'WARN');
    }
  }

  window.addEventListener('online', () => updateStatus(true));
  window.addEventListener('offline', () => updateStatus(false));
  updateStatus(navigator.onLine);
}

// =============================================================================
// 6. AUTH GATE & SESSION RESOLUTION (Flash Suppression)
// =============================================================================

let authGateDismissed = false;

function dismissAuthGate(isAuthenticated) {
  if (authGateDismissed) return;
  authGateDismissed = true;

  const authGate = document.getElementById('authGateScreen');
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');

  if (authGate) {
    authGate.classList.add('opacity-0');
    setTimeout(() => {
      authGate.classList.add('hidden');
      authGate.classList.remove('opacity-0');
    }, 300);
  }

  if (isAuthenticated) {
    loginScreen?.classList.add('hidden');
    appShell?.classList.remove('hidden');
  } else {
    appShell?.classList.add('hidden');
    loginScreen?.classList.remove('hidden');
  }
}

function setupAuth() {
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtnSpinner = document.getElementById('loginBtnSpinner');
  const loginBtnText = document.getElementById('loginBtnText');
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

  // Custom Firebase API Key Handler
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

  // Safety Fallback Timer for Auth Gate (~2.2s transition window)
  setTimeout(() => {
    if (!authGateDismissed) {
      logDebug('Auth check resolution fallback engaged.');
      dismissAuthGate(Boolean(APP_STATE.currentUser));
    }
  }, 2200);

  // Firebase Auth State Observer
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        APP_STATE.currentUser = user;
        logDebug(`Authenticated as: ${user.email}`, 'SUCCESS');
        dismissAuthGate(true);
        initRealtimeListeners();
        loadSavedDashboardOrder();
      } else {
        APP_STATE.currentUser = null;
        logDebug('No active session. Presenting Login Screen.');
        dismissAuthGate(false);
        detachAllListeners();
      }
    });
  } else {
    logDebug('Firebase Auth not initialized. Verify API key.', 'ERROR');
    dismissAuthGate(false);
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
        showToast(`Signed in as ${email}`, 'success');
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

  // Sign Out Flow
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

  const closeResetModal = () => {
    if (!passwordResetModal) return;
    const content = passwordResetModal.querySelector('.modal-content');
    if (content && typeof gsap !== 'undefined') {
      gsap.to(content, {
        opacity: 0,
        scale: 0.94,
        y: 8,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          passwordResetModal.classList.add('hidden');
          gsap.set(content, { opacity: 1, scale: 1, y: 0 });
        }
      });
    } else {
      passwordResetModal.classList.add('hidden');
    }
  };

  if (forgotPasswordBtn && passwordResetModal) {
    forgotPasswordBtn.addEventListener('click', () => {
      animateModalOpen(passwordResetModal);
    });
  }
  if (cancelResetBtn && passwordResetModal) {
    cancelResetBtn.addEventListener('click', closeResetModal);
  }
  if (passwordResetForm) {
    passwordResetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmailInput').value.trim();
      try {
        await sendPasswordResetEmail(auth, email);
        showToast(`Password reset link sent to ${email}`, 'success');
        closeResetModal();
      } catch (err) {
        showToast(`Reset error: ${err.message}`, 'error');
      }
    });
  }

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
// 7. NAVIGATION & VIEW ROUTING
// =============================================================================

export function switchView(viewName) {
  const views = ['dashboard', 'stationery', 'reloads', 'stock', 'logs'];
  if (!views.includes(viewName)) viewName = 'dashboard';

  APP_STATE.activeView = viewName;

  document.querySelectorAll('.app-view').forEach(viewEl => {
    viewEl.classList.add('hidden');
  });

  const targetView = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (targetView) {
    targetView.classList.remove('hidden');
    animateViewTransition(targetView);
  }

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

  if (viewName === 'stock') {
    renderStockTable();
  } else if (viewName === 'logs') {
    applyMasterLogFilters();
    calculateFinancialAnalytics();
  }

  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

  // Dashboard Shortcut Tiles
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

  const openPresetConfigBtn = document.getElementById('openPresetConfigBtn');
  if (openPresetConfigBtn) {
    openPresetConfigBtn.addEventListener('click', () => {
      openSettingsModal();
      switchSettingsTab('presets');
    });
  }

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
    animateModalOpen(modal);
    updateCacheMetrics();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    const content = modal.querySelector('.modal-content');
    if (content && typeof gsap !== 'undefined') {
      gsap.to(content, {
        opacity: 0,
        scale: 0.94,
        y: 8,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          modal.classList.add('hidden');
          gsap.set(content, { opacity: 1, scale: 1, y: 0 });
        }
      });
    } else {
      modal.classList.add('hidden');
    }
  }
}

function switchSettingsTab(tabName) {
  const tabs = ['catalog', 'presets', 'rates', 'themes', 'security', 'developer'];
  if (!tabs.includes(tabName)) tabName = 'catalog';

  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const targetPanel = document.getElementById(`settingsPanel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(targetPanel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    }
  }

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
  APP_STATE.currentDate = today;

  const currentMonth = today.substring(0, 7);
  APP_STATE.analyticsMonth = currentMonth;
  const monthPicker = document.getElementById('logAnalyticsMonthPicker');
  if (monthPicker) monthPicker.value = currentMonth;

  APP_STATE.logDateFrom = today;
  APP_STATE.logDateTo = today;
  const logFrom = document.getElementById('logDateFrom');
  const logTo = document.getElementById('logDateTo');
  if (logFrom) logFrom.value = today;
  if (logTo) logTo.value = today;

  listenToCommissions();
  listenToPresets();
  listenToInventory();
  listenToTodayStationery(today);
  listenToTodayReloads(today);
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

function listenToPresets() {
  if (!db) return;
  const presetsDocRef = doc(db, 'settings', 'presets');

  APP_STATE.unsubscribers.presets = onSnapshot(presetsDocRef, (snap) => {
    if (snap.exists() && Array.isArray(snap.data().amounts) && snap.data().amounts.length > 0) {
      APP_STATE.reloadPresets = snap.data().amounts.map(Number).sort((a, b) => a - b);
      logDebug(`Reload presets synced: ${APP_STATE.reloadPresets.join(', ')}`, 'SUCCESS');
    } else {
      APP_STATE.reloadPresets = [...DEFAULT_PRESETS];
      setDoc(presetsDocRef, {
        amounts: DEFAULT_PRESETS,
        updatedAt: serverTimestamp()
      }).catch(err => logDebug(`Init presets doc failed: ${err.message}`, 'WARN'));
    }
    renderReloadPresets();
    renderSettingsPresets();
  }, (err) => {
    logDebug(`Presets listener error: ${err.message}`, 'ERROR');
    renderReloadPresets();
    renderSettingsPresets();
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
        category: data.category || 'General',
        costPrice: Number(data.costPrice ?? 0),
        sellingPrice: Number(data.sellingPrice || 0),
        stockQuantity: Number(data.stockQuantity || 0),
        lowStockThreshold: Number(data.lowStockThreshold ?? 5)
      });
    });

    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    APP_STATE.inventoryCatalog = items;

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

    renderStationeryRecentFeed();
    updateDashboardOverviewKPIs();
    updateMasterLogsTodayCards();
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

    updateDashboardOverviewKPIs();
    updateMasterLogsTodayCards();
  }, (err) => {
    logDebug(`Today reloads listener error: ${err.message}`, 'ERROR');
  });
}

function listenToMasterLogs() {
  if (!db) return;

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
// 9. DASHBOARD DRAG-AND-DROP REORDERABLE GRID (MOUSE & TOUCH SUPPORT)
// =============================================================================

function setupDashboardDragAndDrop() {
  const grid = document.getElementById('dashboardGrid');
  const resetBtn = document.getElementById('resetDashboardLayoutSettingsBtn');
  if (!grid) return;

  let draggedItem = null;
  let touchStartY = 0;
  let touchStartX = 0;
  let isTouchDragging = false;

  // --- Desktop Mouse Drag ---
  grid.querySelectorAll('.dash-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedItem = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      grid.querySelectorAll('.dash-card').forEach(c => c.classList.remove('drag-over'));
      saveDashboardLayout();
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetCard = card;
      if (draggedItem && targetCard !== draggedItem) {
        const bounding = targetCard.getBoundingClientRect();
        const offset = e.clientY - bounding.top - (bounding.height / 2);
        if (offset > 0) {
          targetCard.after(draggedItem);
        } else {
          targetCard.before(draggedItem);
        }
      }
    });

    // --- Mobile Touch Drag via .drag-handle ---
    const handle = card.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
        draggedItem = card;
        isTouchDragging = true;
        card.classList.add('dragging');
        // Prevent window scrolling while dragging card
        e.stopPropagation();
      }, { passive: false });

      handle.addEventListener('touchmove', (e) => {
        if (!isTouchDragging || !draggedItem) return;
        e.preventDefault(); // Prevent page scroll while dragging

        const touch = e.touches[0];
        const elemUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elemUnder) return;

        const targetCard = elemUnder.closest('.dash-card');
        if (targetCard && targetCard !== draggedItem && targetCard.parentNode === grid) {
          const bounding = targetCard.getBoundingClientRect();
          const offset = touch.clientY - bounding.top - (bounding.height / 2);
          if (offset > 0) {
            targetCard.after(draggedItem);
          } else {
            targetCard.before(draggedItem);
          }
        }
      }, { passive: false });

      const endTouch = () => {
        if (isTouchDragging && draggedItem) {
          draggedItem.classList.remove('dragging');
          grid.querySelectorAll('.dash-card').forEach(c => c.classList.remove('drag-over'));
          saveDashboardLayout();
          draggedItem = null;
          isTouchDragging = false;
        }
      };

      handle.addEventListener('touchend', endTouch);
      handle.addEventListener('touchcancel', endTouch);
    }
  });

  // Settings Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('al_dashboard_order');
      if (db && auth.currentUser) {
        setDoc(doc(db, 'settings', 'dashboard'), {
          order: DEFAULT_DASHBOARD_CARDS,
          updatedAt: serverTimestamp()
        }).catch(e => console.warn(e));
      }

      DEFAULT_DASHBOARD_CARDS.forEach(id => {
        const c = grid.querySelector(`[data-card-id="${id}"]`);
        if (c) grid.appendChild(c);
      });
      showToast('Dashboard card order restored to default', 'success');
    });
  }
}

function saveDashboardLayout() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  const order = [];
  grid.querySelectorAll('.dash-card').forEach(card => {
    const id = card.getAttribute('data-card-id');
    if (id) order.push(id);
  });

  APP_STATE.dashboardCardOrder = order;
  localStorage.setItem('al_dashboard_order', JSON.stringify(order));

  // Sync to Firestore settings document
  if (db && auth?.currentUser) {
    setDoc(doc(db, 'settings', 'dashboard'), {
      order: order,
      updatedAt: serverTimestamp()
    }).catch(err => console.warn('Sync dashboard order failed:', err.message));
  }
}

function loadSavedDashboardOrder() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  // 1. Try local storage first for instant layout without network hop
  const localOrder = localStorage.getItem('al_dashboard_order');
  if (localOrder) {
    try {
      const order = JSON.parse(localOrder);
      if (Array.isArray(order) && order.length > 0) {
        order.forEach(id => {
          const card = grid.querySelector(`[data-card-id="${id}"]`);
          if (card) grid.appendChild(card);
        });
      }
    } catch (e) {
      console.warn('Error parsing local dashboard order', e);
    }
  }

  // 2. Fetch from Firestore for cross-device sync
  if (db) {
    getDoc(doc(db, 'settings', 'dashboard')).then(snap => {
      if (snap.exists() && Array.isArray(snap.data().order)) {
        const firestoreOrder = snap.data().order;
        APP_STATE.dashboardCardOrder = firestoreOrder;
        localStorage.setItem('al_dashboard_order', JSON.stringify(firestoreOrder));
        firestoreOrder.forEach(id => {
          const card = grid.querySelector(`[data-card-id="${id}"]`);
          if (card) grid.appendChild(card);
        });
      }
    }).catch(e => console.warn('Fetch cloud dashboard order failed:', e));
  }
}

// =============================================================================
// 10. REAL-TIME PROFIT TRACKING & DASHBOARD KPIS
// =============================================================================

function updateDashboardOverviewKPIs() {
  // 1. Today's Stationery Sales & Profit
  let statSales = 0;
  let statUnits = 0;
  let statProfitToday = 0;

  APP_STATE.todayStationeryTransactions.forEach(t => {
    const total = Number(t.totalAmount || t.sellingPrice || 0);
    const qty = Number(t.quantity || 1);
    statSales += total;
    statUnits += qty;

    // Use stored profit, or compute dynamically if missing
    if (t.profit !== undefined) {
      statProfitToday += Number(t.profit);
    } else {
      const cost = Number(t.costPrice || 0);
      const sell = Number(t.sellingPrice || 0);
      statProfitToday += (sell - cost) * qty;
    }
  });

  // 2. Today's Reloads & Commission (Reload commission = reload profit)
  let reloadVolume = 0;
  let reloadCommission = 0;

  APP_STATE.todayReloadTransactions.forEach(r => {
    reloadVolume += Number(r.amount || 0);
    reloadCommission += Number(r.commissionAmount || 0);
  });

  const totalRevenue = roundCurrency(statSales + reloadCommission);
  const totalProfitToday = roundCurrency(statProfitToday + reloadCommission);

  // Update DOM Elements
  const dashCombined = document.getElementById('dashTodayCombinedRevenue');
  const dashStat = document.getElementById('dashStationerySales');
  const dashStatUnits = document.getElementById('dashStationeryUnits');
  const dashReloadVol = document.getElementById('dashReloadVolume');
  const dashReloadComm = document.getElementById('dashReloadCommission');
  const dashProfitToday = document.getElementById('dashProfitToday');

  if (dashCombined) animateMetricValue(dashCombined, totalRevenue, true);
  if (dashStat) animateMetricValue(dashStat, roundCurrency(statSales), true);
  if (dashStatUnits) animateMetricValue(dashStatUnits, statUnits, false);
  if (dashReloadVol) animateMetricValue(dashReloadVol, roundCurrency(reloadVolume), true);
  // Clean currency format: Strictly NO "Comm." text
  if (dashReloadComm) animateMetricValue(dashReloadComm, roundCurrency(reloadCommission), true, '+');
  if (dashProfitToday) animateMetricValue(dashProfitToday, totalProfitToday, true);

  // Trigger subtle pulse animations on updated KPI cards
  pulseCard('dashTodayCombinedRevenue');
  pulseCard('dashProfitToday');

  // Compute Month and Year Profits
  calculateProfitOverview();
}

function calculateProfitOverview() {
  const currentMonth = getTodayDateString().substring(0, 7);
  const currentYear = currentMonth.substring(0, 4);

  let monthProfit = 0;
  let yearProfit = 0;

  // Monthly & Yearly Stationery Profit
  APP_STATE.masterStationeryRecords.forEach(s => {
    if (!s.date) return;
    const qty = Number(s.quantity || 1);
    let p = 0;
    if (s.profit !== undefined) {
      p = Number(s.profit);
    } else {
      const cost = Number(s.costPrice || 0);
      const sell = Number(s.sellingPrice || 0);
      p = (sell - cost) * qty;
    }

    if (s.date.startsWith(currentMonth)) monthProfit += p;
    if (s.date.startsWith(currentYear)) yearProfit += p;
  });

  // Monthly & Yearly Reload Commissions (Treated as Profit)
  APP_STATE.masterReloadRecords.forEach(r => {
    if (!r.date) return;
    const comm = Number(r.commissionAmount || 0);
    if (r.date.startsWith(currentMonth)) monthProfit += comm;
    if (r.date.startsWith(currentYear)) yearProfit += comm;
  });

  const elMonth = document.getElementById('dashProfitMonth');
  const elYear = document.getElementById('dashProfitYear');

  if (elMonth) animateMetricValue(elMonth, roundCurrency(monthProfit), true);
  if (elYear) animateMetricValue(elYear, roundCurrency(yearProfit), true);
}

function updateDashboardCatalogKPIs() {
  const dashCatalogCount = document.getElementById('dashCatalogCount');
  if (dashCatalogCount) {
    animateMetricValue(dashCatalogCount, APP_STATE.inventoryCatalog.length, false, '', ' Items');
  }
}

// =============================================================================
// 11. STATIONERY POS ENTRY (WITH ENTER-KEY AUTO-FLOW)
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
      animateButtonPress(posQtyDecBtn);
      const current = Math.max(1, (parseInt(posQuantity.value, 10) || 1) - 1);
      posQuantity.value = current;
      calculatePosTotal();
    });
  }

  if (posQtyIncBtn && posQuantity) {
    posQtyIncBtn.addEventListener('click', () => {
      animateButtonPress(posQtyIncBtn);
      const current = (parseInt(posQuantity.value, 10) || 1) + 1;
      posQuantity.value = current;
      calculatePosTotal();
    });
  }

  // Quick Quantity Presets
  document.querySelectorAll('[data-qty-pill]').forEach(btn => {
    btn.addEventListener('click', () => {
      animateButtonPress(btn);
      const qty = parseInt(btn.getAttribute('data-qty-pill'), 10) || 1;
      if (posQuantity) {
        posQuantity.value = qty;
        calculatePosTotal();
      }
    });
  });

  function calculatePosTotal() {
    const price = Number(posSellingPrice?.value) || 0;
    const qty = Math.max(1, parseInt(posQuantity?.value, 10) || 1);
    const total = roundCurrency(price * qty);
    if (posTotalAmountPreview) posTotalAmountPreview.textContent = formatLKR(total);
  }

  if (posSellingPrice) posSellingPrice.addEventListener('input', calculatePosTotal);
  if (posQuantity) posQuantity.addEventListener('input', calculatePosTotal);

  // Autocomplete Filtering & Enter-Key Flow
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
      posStockStatusBadge.textContent = `Low Stock: ${stockQty} units left`;
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
            No matching item in catalog. Custom item entry.
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
      currentMatches.forEach((item) => {
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
          posQuantity.focus();
          posQuantity.select();
        });
        posAutocompleteList.appendChild(itemRow);
      });

      posAutocompleteList.classList.remove('hidden');
    });

    // Enter-Key Rapid Checkout Flow:
    // 1. Select matching item
    // 2. Update price and total
    // 3. Move focus to quantity
    // 4. Pressing Enter in quantity posts transaction
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

        // If an item in dropdown is highlighted, select it
        if (!posAutocompleteList.classList.contains('hidden') && highlightedIndex >= 0 && currentMatches[highlightedIndex]) {
          selectCatalogItem(currentMatches[highlightedIndex]);
          posAutocompleteList.classList.add('hidden');
          posQuantity.focus();
          posQuantity.select();
          return;
        }

        // Exact match check
        const inputVal = posItemInput.value.trim().toLowerCase();
        const exactMatch = APP_STATE.inventoryCatalog.find(i =>
          (i.code || '').toLowerCase() === inputVal ||
          (i.name || '').toLowerCase() === inputVal
        );

        if (exactMatch) {
          selectCatalogItem(exactMatch);
          posAutocompleteList.classList.add('hidden');
          posQuantity.focus();
          posQuantity.select();
          return;
        }

        // Auto-select top match if available
        if (currentMatches.length > 0) {
          selectCatalogItem(currentMatches[0]);
          posAutocompleteList.classList.add('hidden');
          posQuantity.focus();
          posQuantity.select();
          return;
        }

        // If item name & price are already valid, advance focus to quantity
        if (posItemInput.value.trim() && Number(posSellingPrice.value) > 0) {
          posQuantity.focus();
          posQuantity.select();
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

  // Pressing Enter inside quantity input directly submits sale
  if (posQuantity) {
    posQuantity.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        stationeryEntryForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  // Stationery Sale Submission & Real-Time Stock & Profit Logging
  if (stationeryEntryForm) {
    stationeryEntryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemName = posItemInput.value.trim();
      const sellingPrice = roundCurrency(posSellingPrice.value);
      const quantity = Math.max(1, parseInt(posQuantity.value, 10) || 1);
      const totalAmount = roundCurrency(sellingPrice * quantity);

      const matchedItem = APP_STATE.selectedCatalogItem;
      const itemCode = matchedItem ? matchedItem.code : 'CUSTOM';
      const category = matchedItem ? (matchedItem.category || 'General') : 'Custom';
      // Getting (Cost) Price snapshot
      const costPrice = matchedItem ? roundCurrency(matchedItem.costPrice || 0) : 0;
      const unitProfit = roundCurrency(sellingPrice - costPrice);
      const lineProfit = roundCurrency(unitProfit * quantity);

      if (!itemName) {
        showToast('Please specify an item name or code', 'error');
        return;
      }
      if (sellingPrice <= 0) {
        showToast('Please enter a valid selling price', 'error');
        return;
      }

      // Stock check warning
      if (matchedItem && matchedItem.stockQuantity < quantity) {
        if (!confirm(`Warning: Only ${matchedItem.stockQuantity} units in stock for "${matchedItem.name}". Proceed with logging sale of ${quantity} units?`)) {
          return;
        }
      }

      const transactionPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        itemCode: itemCode,
        itemName: itemName,
        category: category,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        unitProfit: unitProfit,
        profit: lineProfit,
        quantity: quantity,
        totalAmount: totalAmount,
        timestamp: serverTimestamp()
      };

      try {
        // 1. Add Stationery Transaction Record to Firestore
        await addDoc(collection(db, 'stationery_transactions'), transactionPayload);

        // 2. Automatically Deduct Sold Quantity in Firestore
        if (matchedItem && matchedItem.id) {
          const itemDocRef = doc(db, 'inventory', matchedItem.id);
          await updateDoc(itemDocRef, {
            stockQuantity: increment(-quantity),
            updatedAt: serverTimestamp()
          });
          const remainingStock = Math.max(0, matchedItem.stockQuantity - quantity);
          showToast(`Logged sale: ${quantity}x ${itemName} (${formatLKR(totalAmount)}) • Stock left: ${remainingStock}`, 'success');
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

function renderStationeryRecentFeed() {
  const feed = document.getElementById('statRecentFeed');
  if (!feed) return;

  const count = APP_STATE.todayStationeryTransactions.length;
  if (count === 0) {
    feed.innerHTML = `
      <div class="p-3 text-xs text-center theme-text-dim rounded-xl border theme-border">
        No stationery sales recorded yet today.
      </div>
    `;
    return;
  }

  feed.innerHTML = '';
  APP_STATE.todayStationeryTransactions.slice(0, 5).forEach(item => {
    const row = document.createElement('div');
    row.className = 'p-2.5 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs';
    const profitDisplay = item.profit !== undefined ? ` • Profit: +${formatLKR(item.profit)}` : '';

    row.innerHTML = `
      <div>
        <div class="font-bold theme-text-main">${item.itemName}</div>
        <div class="text-[11px] theme-text-dim font-mono">${item.time || '--:--'} • Code: ${item.itemCode || 'ST'} • Qty: ${item.quantity || 1}${profitDisplay}</div>
      </div>
      <div class="font-mono font-bold text-emerald-400">
        ${formatLKR(item.totalAmount || item.sellingPrice)}
      </div>
    `;
    feed.appendChild(row);
  });
}

// =============================================================================
// 12. MOBILE RELOADS MODULE & CLEAN COMMISSION
// =============================================================================

function setupReloadModule() {
  const reloadEntryForm = document.getElementById('reloadEntryForm');
  const reloadMobileInput = document.getElementById('reloadMobileInput');
  const reloadAmountInput = document.getElementById('reloadAmountInput');

  // Operator Select Buttons
  document.querySelectorAll('[data-select-op]').forEach(btn => {
    btn.addEventListener('click', () => {
      animateButtonPress(btn);
      const op = btn.getAttribute('data-select-op');
      APP_STATE.activeReloadOperator = op;

      document.querySelectorAll('[data-select-op]').forEach(b => {
        b.classList.remove('ring-2', 'ring-sky-400', 'theme-bg-elevated');
      });
      btn.classList.add('ring-2', 'ring-sky-400', 'theme-bg-elevated');

      updateReloadRatePreview();
    });
  });

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

      const mobileNumber = (reloadMobileInput?.value || '').trim() || '-';
      const op = APP_STATE.activeReloadOperator;
      const rate = Number(APP_STATE.commissionRates[op]) || 0;
      const commissionAmount = roundCurrency((amount * rate) / 100);

      const reloadPayload = {
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        operator: op,
        mobileNumber: mobileNumber,
        amount: amount,
        commissionRate: rate,
        commissionAmount: commissionAmount,
        profit: commissionAmount, // Reload commission is treated as profit
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'reload_transactions'), reloadPayload);
        const mobileTag = mobileNumber !== '-' ? ` to ${mobileNumber}` : '';
        // Zero occurrences of "Comm." text: clean currency output
        showToast(`Recorded ${op} Reload ${formatLKR(amount)}${mobileTag} (+${formatLKR(commissionAmount)})`, 'success');

        reloadAmountInput.value = '';
        if (reloadMobileInput) reloadMobileInput.value = '';
        updateReloadRatePreview();
        reloadMobileInput ? reloadMobileInput.focus() : reloadAmountInput.focus();
      } catch (err) {
        logDebug(`Error recording reload: ${err.message}`, 'ERROR');
        showToast(`Failed to record reload: ${err.message}`, 'error');
      }
    });
  }

  updateReloadRatePreview();
}

function updateReloadRatePreview() {
  const reloadAmountInput = document.getElementById('reloadAmountInput');
  const reloadCommissionPreview = document.getElementById('reloadCommissionPreview');
  const reloadActiveRatePreview = document.getElementById('reloadActiveRatePreview');

  const op = APP_STATE.activeReloadOperator;
  const rate = Number(APP_STATE.commissionRates[op]) || 0;
  const amount = Number(reloadAmountInput?.value) || 0;
  const earned = roundCurrency((amount * rate) / 100);

  if (reloadActiveRatePreview) reloadActiveRatePreview.textContent = `${rate.toFixed(2)}%`;
  // Clean currency only: NO "Comm." text
  if (reloadCommissionPreview) reloadCommissionPreview.textContent = formatLKR(earned);
}

function updateCommissionUI() {
  const formAirtel = document.getElementById('formRateAirtel');
  const formDialog = document.getElementById('formRateDialog');
  const formMobitel = document.getElementById('formRateMobitel');
  const formHutch = document.getElementById('formRateHutch');

  if (formAirtel) formAirtel.textContent = `${APP_STATE.commissionRates.AIRTEL.toFixed(2)}%`;
  if (formDialog) formDialog.textContent = `${APP_STATE.commissionRates.DIALOG.toFixed(2)}%`;
  if (formMobitel) formMobitel.textContent = `${APP_STATE.commissionRates.MOBITEL.toFixed(2)}%`;
  if (formHutch) formHutch.textContent = `${APP_STATE.commissionRates.HUTCH.toFixed(2)}%`;

  const inputAirtel = document.getElementById('rateAirtelInput');
  const inputDialog = document.getElementById('rateDialogInput');
  const inputMobitel = document.getElementById('rateMobitelInput');
  const inputHutch = document.getElementById('rateHutchInput');

  if (inputAirtel) inputAirtel.value = APP_STATE.commissionRates.AIRTEL.toFixed(2);
  if (inputDialog) inputDialog.value = APP_STATE.commissionRates.DIALOG.toFixed(2);
  if (inputMobitel) inputMobitel.value = APP_STATE.commissionRates.MOBITEL.toFixed(2);
  if (inputHutch) inputHutch.value = APP_STATE.commissionRates.HUTCH.toFixed(2);

  updateReloadRatePreview();
}

function renderReloadPresets() {
  const container = document.getElementById('reloadPresetsContainer');
  if (!container) return;

  container.innerHTML = '';
  const reloadAmountInput = document.getElementById('reloadAmountInput');

  APP_STATE.reloadPresets.forEach(amount => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn px-3.5 py-2 rounded-xl theme-bg-subtle border theme-border font-mono font-bold text-xs hover:theme-bg-elevated transition glass-btn';
    btn.textContent = `Rs. ${amount}`;
    btn.addEventListener('click', () => {
      animateButtonPress(btn);
      if (reloadAmountInput) {
        reloadAmountInput.value = amount;
        updateReloadRatePreview();
        reloadAmountInput.focus();
      }
    });
    container.appendChild(btn);
  });
}

function renderSettingsPresets() {
  const listContainer = document.getElementById('settingsPresetsList');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (APP_STATE.reloadPresets.length === 0) {
    listContainer.innerHTML = `<span class="text-xs theme-text-dim">No active presets configured.</span>`;
    return;
  }

  APP_STATE.reloadPresets.forEach(amount => {
    const tag = document.createElement('div');
    tag.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-surface border theme-border text-xs font-mono font-bold theme-text-main shadow-sm';
    tag.innerHTML = `
      <span>Rs. ${amount}</span>
      <button type="button" class="text-red-400 hover:text-red-300 font-bold ml-1 transition" title="Delete preset">✕</button>
    `;

    const delBtn = tag.querySelector('button');
    delBtn.addEventListener('click', () => removePresetAmount(amount));

    listContainer.appendChild(tag);
  });
}

async function removePresetAmount(amountToRemove) {
  if (APP_STATE.reloadPresets.length <= 1) {
    showToast('At least one preset amount must remain configured', 'error');
    return;
  }

  const updated = APP_STATE.reloadPresets.filter(a => a !== amountToRemove);
  try {
    await setDoc(doc(db, 'settings', 'presets'), {
      amounts: updated,
      updatedAt: serverTimestamp()
    });
    showToast(`Removed preset Rs. ${amountToRemove}`, 'info');
  } catch (err) {
    showToast(`Failed to remove preset: ${err.message}`, 'error');
  }
}

function setupPresetControls() {
  const addPresetForm = document.getElementById('addPresetForm');
  const newPresetInput = document.getElementById('newPresetAmountInput');
  const resetPresetsBtn = document.getElementById('resetPresetsDefaultBtn');

  if (addPresetForm) {
    addPresetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = parseInt(newPresetInput.value, 10);
      if (!val || val <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }
      if (APP_STATE.reloadPresets.includes(val)) {
        showToast(`Preset Rs. ${val} already exists`, 'error');
        return;
      }

      const updated = [...APP_STATE.reloadPresets, val].sort((a, b) => a - b);
      try {
        await setDoc(doc(db, 'settings', 'presets'), {
          amounts: updated,
          updatedAt: serverTimestamp()
        });
        showToast(`Added preset Rs. ${val}`, 'success');
        newPresetInput.value = '';
      } catch (err) {
        showToast(`Failed to add preset: ${err.message}`, 'error');
      }
    });
  }

  if (resetPresetsBtn) {
    resetPresetsBtn.addEventListener('click', async () => {
      if (!confirm('Reset quick presets back to defaults (Rs. 100, 250, 500, 1000)?')) return;
      try {
        await setDoc(doc(db, 'settings', 'presets'), {
          amounts: DEFAULT_PRESETS,
          updatedAt: serverTimestamp()
        });
        showToast('Presets reset to defaults', 'success');
      } catch (err) {
        showToast(`Reset failed: ${err.message}`, 'error');
      }
    });
  }
}

// =============================================================================
// 13. STOCK INVENTORY VIEW
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
           (item.name || '').toLowerCase().includes(queryStr) ||
           (item.category || '').toLowerCase().includes(queryStr);
  });

  if (APP_STATE.stockFilter === 'LOW') {
    filtered = filtered.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold);
  } else if (APP_STATE.stockFilter === 'OUT') {
    filtered = filtered.filter(item => item.stockQuantity <= 0);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-10 text-center theme-text-dim text-xs">
          No inventory items match the current query/filter.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    let badgeHtml = '';
    if (item.stockQuantity > item.lowStockThreshold) {
      badgeHtml = `<span class="badge-stock-in px-2.5 py-0.5 rounded text-[11px] font-bold">${item.stockQuantity} units</span>`;
    } else if (item.stockQuantity > 0) {
      badgeHtml = `<span class="badge-stock-low px-2.5 py-0.5 rounded text-[11px] font-bold">Low (${item.stockQuantity})</span>`;
    } else {
      badgeHtml = `<span class="badge-stock-out px-2.5 py-0.5 rounded text-[11px] font-bold">Out of Stock</span>`;
    }

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono font-bold text-sky-400 whitespace-nowrap text-xs">${item.code}</td>
      <td class="py-3 px-3 sm:px-4 font-medium theme-text-main text-xs">
        <div>${item.name}</div>
        <div class="text-[10px] theme-text-dim">${item.category || 'General'}</div>
      </td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono font-bold text-xs theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap">${badgeHtml}</td>
      <td class="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
        <button type="button" data-pos-quick="${item.id}" class="px-3 py-1 rounded-lg text-xs font-semibold theme-bg-accent text-white hover:opacity-90 transition glass-btn">
          Sell
        </button>
      </td>
    `;

    const sellBtn = tr.querySelector(`[data-pos-quick="${item.id}"]`);
    if (sellBtn) {
      sellBtn.addEventListener('click', () => {
        switchView('stationery');
        const posItemInput = document.getElementById('posItemInput');
        if (posItemInput) {
          posItemInput.value = item.name;
          posItemInput.dispatchEvent(new Event('input'));
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 14. MASTER LOGS, CONSOLIDATED METRICS & PROFIT FILTERING
// =============================================================================

function setupMasterLogsModule() {
  // Category Filtering Pills
  document.querySelectorAll('[data-log-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-log-cat');
      APP_STATE.logCategoryFilter = cat;

      document.querySelectorAll('[data-log-cat]').forEach(b => {
        b.className = 'log-cat-btn px-3 py-1.5 rounded-lg border theme-border theme-text-muted hover:theme-text-main transition glass-btn';
      });
      btn.className = 'log-cat-btn active px-3 py-1.5 rounded-lg border theme-border theme-bg-accent text-white transition glass-btn';

      applyMasterLogFilters();
    });
  });

  // Date Filter Quick Buttons
  const btnToday = document.getElementById('logFilterTodayBtn');
  const btnYesterday = document.getElementById('logFilterYesterdayBtn');
  const btnMonth = document.getElementById('logFilterThisMonthBtn');
  const inputSpecificDate = document.getElementById('logFilterSpecificDate');
  const logFrom = document.getElementById('logDateFrom');
  const logTo = document.getElementById('logDateTo');
  const btnApplyRange = document.getElementById('applyLogDateRangeBtn');

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      const today = getTodayDateString();
      if (logFrom) logFrom.value = today;
      if (logTo) logTo.value = today;
      if (inputSpecificDate) inputSpecificDate.value = '';
      APP_STATE.logDateFrom = today;
      APP_STATE.logDateTo = today;
      applyMasterLogFilters();
    });
  }

  if (btnYesterday) {
    btnYesterday.addEventListener('click', () => {
      const yest = getYesterdayDateString();
      if (logFrom) logFrom.value = yest;
      if (logTo) logTo.value = yest;
      if (inputSpecificDate) inputSpecificDate.value = '';
      APP_STATE.logDateFrom = yest;
      APP_STATE.logDateTo = yest;
      applyMasterLogFilters();
    });
  }

  if (btnMonth) {
    btnMonth.addEventListener('click', () => {
      const today = getTodayDateString();
      const firstOfMonth = `${today.substring(0, 7)}-01`;
      if (logFrom) logFrom.value = firstOfMonth;
      if (logTo) logTo.value = today;
      if (inputSpecificDate) inputSpecificDate.value = '';
      APP_STATE.logDateFrom = firstOfMonth;
      APP_STATE.logDateTo = today;
      applyMasterLogFilters();
    });
  }

  if (inputSpecificDate) {
    inputSpecificDate.addEventListener('change', () => {
      const pickedDate = inputSpecificDate.value;
      if (!pickedDate) return;
      if (logFrom) logFrom.value = pickedDate;
      if (logTo) logTo.value = pickedDate;
      APP_STATE.logDateFrom = pickedDate;
      APP_STATE.logDateTo = pickedDate;
      applyMasterLogFilters();
    });
  }

  if (btnApplyRange && logFrom && logTo) {
    btnApplyRange.addEventListener('click', () => {
      APP_STATE.logDateFrom = logFrom.value || getTodayDateString();
      APP_STATE.logDateTo = logTo.value || logFrom.value || getTodayDateString();
      if (inputSpecificDate) inputSpecificDate.value = '';
      applyMasterLogFilters();
    });
  }

  // Monthly Analytics Month Picker
  const monthPicker = document.getElementById('logAnalyticsMonthPicker');
  if (monthPicker) {
    monthPicker.addEventListener('change', () => {
      APP_STATE.analyticsMonth = monthPicker.value;
      calculateFinancialAnalytics();
    });
  }

  // PDF Download Button
  const downloadPdfBtn = document.getElementById('downloadPdfReportBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generateProfessionalPdfReport);
  }

  initMetricCardsLayoutEngine();
}

function initMetricCardsLayoutEngine() {
  const grid = document.getElementById('masterLogsMetricsGrid');
  const resetBtn = document.getElementById('resetMetricCardsLayoutBtn');
  if (!grid) return;

  applySavedCardLayout();

  let draggedCard = null;

  grid.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      grid.querySelectorAll('.metric-card').forEach(c => c.classList.remove('drag-over'));
      saveCardLayout();
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetCard = card;
      if (draggedCard && targetCard !== draggedCard) {
        const bounding = targetCard.getBoundingClientRect();
        const offset = e.clientY - bounding.top - (bounding.height / 2);
        if (offset > 0) {
          targetCard.after(draggedCard);
        } else {
          targetCard.before(draggedCard);
        }
      }
    });
  });

  // Card Resize Toggle Buttons
  grid.querySelectorAll('.card-resize-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.metric-card');
      if (!card) return;

      const isWide = card.classList.contains('metric-card-wide');
      if (isWide) {
        card.classList.remove('metric-card-wide');
        card.classList.add('metric-card-normal');
      } else {
        card.classList.remove('metric-card-normal');
        card.classList.add('metric-card-wide');
      }
      saveCardLayout();
      showToast('Card size updated', 'info');
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('al_metrics_order');
      localStorage.removeItem('al_metrics_sizes');

      DEFAULT_LOG_METRIC_CARDS.forEach(cardId => {
        const card = grid.querySelector(`[data-card-id="${cardId}"]`);
        if (card) {
          card.classList.remove('metric-card-wide');
          card.classList.add('metric-card-normal');
          grid.appendChild(card);
        }
      });
      showToast('Master Logs card layout restored to default', 'success');
    });
  }
}

function saveCardLayout() {
  const grid = document.getElementById('masterLogsMetricsGrid');
  if (!grid) return;

  const order = [];
  const sizes = {};

  grid.querySelectorAll('.metric-card').forEach(card => {
    const cardId = card.getAttribute('data-card-id');
    if (cardId) {
      order.push(cardId);
      sizes[cardId] = card.classList.contains('metric-card-wide') ? 'wide' : 'normal';
    }
  });

  localStorage.setItem('al_metrics_order', JSON.stringify(order));
  localStorage.setItem('al_metrics_sizes', JSON.stringify(sizes));
}

function applySavedCardLayout() {
  const grid = document.getElementById('masterLogsMetricsGrid');
  if (!grid) return;

  try {
    const savedOrder = JSON.parse(localStorage.getItem('al_metrics_order'));
    const savedSizes = JSON.parse(localStorage.getItem('al_metrics_sizes'));

    if (savedSizes) {
      Object.keys(savedSizes).forEach(cardId => {
        const card = grid.querySelector(`[data-card-id="${cardId}"]`);
        if (card) {
          if (savedSizes[cardId] === 'wide') {
            card.classList.remove('metric-card-normal');
            card.classList.add('metric-card-wide');
          } else {
            card.classList.remove('metric-card-wide');
            card.classList.add('metric-card-normal');
          }
        }
      });
    }

    if (Array.isArray(savedOrder)) {
      savedOrder.forEach(cardId => {
        const card = grid.querySelector(`[data-card-id="${cardId}"]`);
        if (card) grid.appendChild(card);
      });
    }
  } catch (e) {
    console.warn('Failed restoring metrics card layout', e);
  }
}

function updateMasterLogsTodayCards() {
  // Card 1: Today's Stationery
  let statSales = 0;
  let statUnits = 0;
  let statProfit = 0;
  const statTx = APP_STATE.todayStationeryTransactions.length;

  APP_STATE.todayStationeryTransactions.forEach(t => {
    const total = Number(t.totalAmount || t.sellingPrice || 0);
    const qty = Number(t.quantity || 1);
    statSales += total;
    statUnits += qty;

    if (t.profit !== undefined) {
      statProfit += Number(t.profit);
    } else {
      const cost = Number(t.costPrice || 0);
      const sell = Number(t.sellingPrice || 0);
      statProfit += (sell - cost) * qty;
    }
  });

  const cardStatSales = document.getElementById('logCardStatSales');
  const cardStatUnits = document.getElementById('logCardStatUnits');
  const cardStatTx = document.getElementById('logCardStatTx');

  if (cardStatSales) animateMetricValue(cardStatSales, roundCurrency(statSales), true);
  if (cardStatUnits) animateMetricValue(cardStatUnits, statUnits, false);
  if (cardStatTx) animateMetricValue(cardStatTx, statTx, false);

  // Card 2: Today's Reloads
  let reloadVol = 0;
  let reloadComm = 0;
  const opTotals = { AIRTEL: 0, DIALOG: 0, MOBITEL: 0, HUTCH: 0 };

  APP_STATE.todayReloadTransactions.forEach(r => {
    const amt = Number(r.amount || 0);
    const comm = Number(r.commissionAmount || 0);
    reloadVol += amt;
    reloadComm += comm;
    if (opTotals[r.operator] !== undefined) {
      opTotals[r.operator] += amt;
    }
  });

  const cardReloadVol = document.getElementById('logCardReloadVol');
  const cardReloadComm = document.getElementById('logCardReloadComm');

  if (cardReloadVol) animateMetricValue(cardReloadVol, roundCurrency(reloadVol), true);
  // Clean currency only: NO "Comm." text
  if (cardReloadComm) animateMetricValue(cardReloadComm, roundCurrency(reloadComm), true, '+');

  // Card 3: Combined Store Revenue
  const combinedRev = roundCurrency(statSales + reloadComm);
  const cardCombinedRev = document.getElementById('logCardCombinedRevenue');
  if (cardCombinedRev) animateMetricValue(cardCombinedRev, combinedRev, true);

  // Card 4: Today Net Profit (NEW)
  const totalTodayProfit = roundCurrency(statProfit + reloadComm);
  const cardTodayProfit = document.getElementById('logCardTodayProfit');
  const cardTodayMargin = document.getElementById('logCardTodayMargin');
  if (cardTodayProfit) animateMetricValue(cardTodayProfit, totalTodayProfit, true);
  if (cardTodayMargin) {
    const margin = combinedRev > 0 ? (totalTodayProfit / combinedRev) * 100 : 0;
    cardTodayMargin.textContent = `${margin.toFixed(1)}%`;
  }

  // Card 7: Operator Reload Breakdown
  const opAirtel = document.getElementById('logCardAirtelVol');
  const opDialog = document.getElementById('logCardDialogVol');
  const opMobitel = document.getElementById('logCardMobitelVol');
  const opHutch = document.getElementById('logCardHutchVol');

  if (opAirtel) animateMetricValue(opAirtel, roundCurrency(opTotals.AIRTEL), true);
  if (opDialog) animateMetricValue(opDialog, roundCurrency(opTotals.DIALOG), true);
  if (opMobitel) animateMetricValue(opMobitel, roundCurrency(opTotals.MOBITEL), true);
  if (opHutch) animateMetricValue(opHutch, roundCurrency(opTotals.HUTCH), true);
}

function calculateFinancialAnalytics() {
  updateMasterLogsTodayCards();

  // Card 5: Monthly Performance Statement
  const activeMonth = APP_STATE.analyticsMonth || getTodayDateString().substring(0, 7);
  let monthStatSales = 0;
  let monthReloadVol = 0;
  let monthReloadComm = 0;
  let monthProfit = 0;

  APP_STATE.masterStationeryRecords.forEach(s => {
    if (s.date && s.date.startsWith(activeMonth)) {
      monthStatSales += Number(s.totalAmount || s.sellingPrice || 0);
      const qty = Number(s.quantity || 1);
      if (s.profit !== undefined) {
        monthProfit += Number(s.profit);
      } else {
        const cost = Number(s.costPrice || 0);
        const sell = Number(s.sellingPrice || 0);
        monthProfit += (sell - cost) * qty;
      }
    }
  });

  APP_STATE.masterReloadRecords.forEach(r => {
    if (r.date && r.date.startsWith(activeMonth)) {
      monthReloadVol += Number(r.amount || 0);
      const comm = Number(r.commissionAmount || 0);
      monthReloadComm += comm;
      monthProfit += comm; // Reload profit
    }
  });

  const cardMSales = document.getElementById('logCardMonthSales');
  const cardMReload = document.getElementById('logCardMonthReload');
  const cardMComm = document.getElementById('logCardMonthComm');
  const cardMNet = document.getElementById('logCardMonthNet');

  if (cardMSales) animateMetricValue(cardMSales, roundCurrency(monthStatSales), true);
  if (cardMReload) animateMetricValue(cardMReload, roundCurrency(monthReloadVol), true);
  if (cardMComm) animateMetricValue(cardMComm, roundCurrency(monthReloadComm), true);
  if (cardMNet) animateMetricValue(cardMNet, roundCurrency(monthProfit), true);

  // Card 6: Annual YTD Statement
  const activeYear = activeMonth.substring(0, 4);
  const cardYearLabel = document.getElementById('logCardYearLabel');
  if (cardYearLabel) cardYearLabel.textContent = activeYear;

  let yearStatSales = 0;
  let yearReloadVol = 0;
  let yearReloadComm = 0;
  let yearProfit = 0;

  APP_STATE.masterStationeryRecords.forEach(s => {
    if (s.date && s.date.startsWith(activeYear)) {
      yearStatSales += Number(s.totalAmount || s.sellingPrice || 0);
      const qty = Number(s.quantity || 1);
      if (s.profit !== undefined) {
        yearProfit += Number(s.profit);
      } else {
        const cost = Number(s.costPrice || 0);
        const sell = Number(s.sellingPrice || 0);
        yearProfit += (sell - cost) * qty;
      }
    }
  });

  APP_STATE.masterReloadRecords.forEach(r => {
    if (r.date && r.date.startsWith(activeYear)) {
      yearReloadVol += Number(r.amount || 0);
      const comm = Number(r.commissionAmount || 0);
      yearReloadComm += comm;
      yearProfit += comm;
    }
  });

  const cardYSales = document.getElementById('logCardYearSales');
  const cardYReload = document.getElementById('logCardYearReload');
  const cardYComm = document.getElementById('logCardYearComm');
  const cardYNet = document.getElementById('logCardYearNet');

  if (cardYSales) animateMetricValue(cardYSales, roundCurrency(yearStatSales), true);
  if (cardYReload) animateMetricValue(cardYReload, roundCurrency(yearReloadVol), true);
  if (cardYComm) animateMetricValue(cardYComm, roundCurrency(yearReloadComm), true);
  if (cardYNet) animateMetricValue(cardYNet, roundCurrency(yearProfit), true);
}

// -----------------------------------------------------------------------------
// MASTER LOGS FILTERING & TABLE RENDERING
// -----------------------------------------------------------------------------

function applyMasterLogFilters() {
  const fromDate = APP_STATE.logDateFrom || getTodayDateString();
  const toDate = APP_STATE.logDateTo || fromDate;

  const filteredStationery = APP_STATE.masterStationeryRecords.filter(s => {
    if (!s.date) return false;
    return s.date >= fromDate && s.date <= toDate;
  });

  const filteredReloads = APP_STATE.masterReloadRecords.filter(r => {
    if (!r.date) return false;
    return r.date >= fromDate && r.date <= toDate;
  });

  // Calculate filtered summary KPIs & Profit
  let statSales = 0;
  let unitsSold = 0;
  let statProfit = 0;

  filteredStationery.forEach(s => {
    const total = Number(s.totalAmount || s.sellingPrice || 0);
    const qty = Number(s.quantity || 1);
    statSales += total;
    unitsSold += qty;

    if (s.profit !== undefined) {
      statProfit += Number(s.profit);
    } else {
      const cost = Number(s.costPrice || 0);
      const sell = Number(s.sellingPrice || 0);
      statProfit += (sell - cost) * qty;
    }
  });

  let reloadVol = 0;
  let reloadComm = 0;
  filteredReloads.forEach(r => {
    reloadVol += Number(r.amount || 0);
    reloadComm += Number(r.commissionAmount || 0);
  });

  const totalPeriodRevenue = roundCurrency(statSales + reloadComm);
  const totalPeriodProfit = roundCurrency(statProfit + reloadComm);

  // Update Summary Bar Elements
  const sStatSales = document.getElementById('logSummaryStatSales');
  const sUnitsSold = document.getElementById('logSummaryUnitsSold');
  const sReloadVol = document.getElementById('logSummaryReloadVol');
  const sReloadComm = document.getElementById('logSummaryReloadComm');
  const sTotalRevenue = document.getElementById('logSummaryTotalRevenue');
  const sTotalProfit = document.getElementById('logSummaryTotalProfit');
  const filterLabel = document.getElementById('masterLogFilterLabel');

  if (sStatSales) animateMetricValue(sStatSales, roundCurrency(statSales), true);
  if (sUnitsSold) animateMetricValue(sUnitsSold, unitsSold, false);
  if (sReloadVol) animateMetricValue(sReloadVol, roundCurrency(reloadVol), true);
  if (sReloadComm) animateMetricValue(sReloadComm, roundCurrency(reloadComm), true);
  if (sTotalRevenue) animateMetricValue(sTotalRevenue, totalPeriodRevenue, true);
  if (sTotalProfit) animateMetricValue(sTotalProfit, totalPeriodProfit, true);

  if (filterLabel) {
    filterLabel.textContent = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;
  }

  // Combine rows for table display
  let combinedRows = [];

  if (APP_STATE.logCategoryFilter === 'ALL' || APP_STATE.logCategoryFilter === 'STATIONERY') {
    filteredStationery.forEach(s => {
      const qty = Number(s.quantity || 1);
      const sell = Number(s.totalAmount || s.sellingPrice || 0);
      let p = 0;
      if (s.profit !== undefined) {
        p = Number(s.profit);
      } else {
        const cost = Number(s.costPrice || 0);
        p = (Number(s.sellingPrice || 0) - cost) * qty;
      }

      combinedRows.push({
        id: s.id,
        category: 'STATIONERY',
        date: s.date || '',
        time: s.time || '',
        itemOrOp: `${s.itemName || ''} (${s.itemCode || 'ST'})`,
        mobileNumber: '-',
        qtyOrRate: `${qty} units`,
        amount: sell,
        profit: p,
        rawRecord: s
      });
    });
  }

  if (APP_STATE.logCategoryFilter === 'ALL' || APP_STATE.logCategoryFilter === 'RELOAD') {
    filteredReloads.forEach(r => {
      const comm = Number(r.commissionAmount || 0);
      combinedRows.push({
        id: r.id,
        category: 'RELOAD',
        date: r.date || '',
        time: r.time || '',
        itemOrOp: `${r.operator} Top-Up`,
        mobileNumber: r.mobileNumber || '-',
        qtyOrRate: `${Number(r.commissionRate || 0).toFixed(2)}%`,
        amount: Number(r.amount || 0),
        profit: comm,
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
        <td colspan="8" class="py-12 text-center theme-text-dim text-xs">
          No records found for the selected date filter and category.
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

    let mobileDisplay = row.mobileNumber !== '-'
      ? `<span class="font-mono font-bold text-sky-400">${row.mobileNumber}</span>`
      : `<span class="theme-text-dim text-center block">-</span>`;

    tr.innerHTML = `
      <td class="py-3 px-3 sm:px-4 font-mono text-xs whitespace-nowrap">
        <span class="theme-text-main font-semibold">${row.date}</span>
        <span class="theme-text-dim ml-1 font-normal">${row.time}</span>
      </td>
      <td class="py-3 px-3 sm:px-4 whitespace-nowrap">${typePill}</td>
      <td class="py-3 px-3 sm:px-4 font-medium theme-text-main text-xs">${row.itemOrOp}</td>
      <td class="py-3 px-3 sm:px-4 whitespace-nowrap text-xs">${mobileDisplay}</td>
      <td class="py-3 px-3 sm:px-4 text-center font-mono text-xs theme-text-muted whitespace-nowrap">${row.qtyOrRate}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold theme-text-main whitespace-nowrap">${formatLKR(row.amount)}</td>
      <td class="py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold text-emerald-400 whitespace-nowrap">+${formatLKR(row.profit)}</td>
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

    const editBtn = tr.querySelector(`[data-edit-log="${row.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => openEditStationeryModal(row.rawRecord));
    }

    const delBtn = tr.querySelector(`[data-delete-log="${row.id}"]`);
    if (delBtn) {
      delBtn.addEventListener('click', () => deleteTransactionRecord(row.id, row.category, row.itemOrOp, row.rawRecord));
    }

    tbody.appendChild(tr);
  });
}

async function deleteTransactionRecord(id, category, title, rawRecord) {
  if (!confirm(`Permanently delete ${category.toLowerCase()} record "${title}"?`)) return;

  const collectionName = category === 'STATIONERY' ? 'stationery_transactions' : 'reload_transactions';
  try {
    await deleteDoc(doc(db, collectionName, id));

    // Restore stock if stationery transaction
    if (category === 'STATIONERY' && rawRecord && rawRecord.itemCode && rawRecord.itemCode !== 'CUSTOM') {
      const catalogItem = APP_STATE.inventoryCatalog.find(i => i.code === rawRecord.itemCode);
      if (catalogItem && catalogItem.id) {
        await updateDoc(doc(db, 'inventory', catalogItem.id), {
          stockQuantity: increment(rawRecord.quantity || 1),
          updatedAt: serverTimestamp()
        });
      }
    }

    showToast(`Deleted ${title}`, 'info');
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// -----------------------------------------------------------------------------
// EDIT STATIONERY TRANSACTION MODAL
// -----------------------------------------------------------------------------

function setupEditStationeryModal() {
  const modal = document.getElementById('editStationeryModal');
  const closeBtn = document.getElementById('closeEditStatModalBtn');
  const cancelBtn = document.getElementById('cancelEditStatBtn');
  const form = document.getElementById('editStationeryForm');
  const priceInput = document.getElementById('editStatSelling');
  const costInput = document.getElementById('editStatCost');
  const qtyInput = document.getElementById('editStatQty');
  const preview = document.getElementById('editStatTotalPreview');

  function calculateEditTotal() {
    const p = Number(priceInput.value) || 0;
    const q = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    if (preview) preview.textContent = formatLKR(roundCurrency(p * q));
  }

  if (priceInput) priceInput.addEventListener('input', calculateEditTotal);
  if (qtyInput) qtyInput.addEventListener('input', calculateEditTotal);

  const closeModal = () => {
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (content && typeof gsap !== 'undefined') {
      gsap.to(content, {
        opacity: 0,
        scale: 0.94,
        y: 8,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          modal.classList.add('hidden');
          gsap.set(content, { opacity: 1, scale: 1, y: 0 });
        }
      });
    } else {
      modal.classList.add('hidden');
    }
  };

  if (closeBtn && modal) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn && modal) cancelBtn.addEventListener('click', closeModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const docId = document.getElementById('editStatDocId').value;
      const originalRecord = APP_STATE.masterStationeryRecords.find(r => r.id === docId);
      if (!originalRecord) return;

      const newName = document.getElementById('editStatName').value.trim();
      const newCode = document.getElementById('editStatCode').value.trim();
      const newCost = roundCurrency(costInput.value);
      const newSelling = roundCurrency(priceInput.value);
      const newQty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const newTotal = roundCurrency(newSelling * newQty);
      const newProfit = roundCurrency((newSelling - newCost) * newQty);

      const oldQty = originalRecord.quantity || 1;
      const qtyDiff = newQty - oldQty;

      try {
        await updateDoc(doc(db, 'stationery_transactions', docId), {
          itemName: newName,
          itemCode: newCode,
          costPrice: newCost,
          sellingPrice: newSelling,
          quantity: newQty,
          totalAmount: newTotal,
          profit: newProfit,
          unitProfit: roundCurrency(newSelling - newCost),
          updatedAt: serverTimestamp()
        });

        if (newCode && newCode !== 'CUSTOM') {
          const catalogItem = APP_STATE.inventoryCatalog.find(i => i.code === newCode);
          if (catalogItem && catalogItem.id && qtyDiff !== 0) {
            await updateDoc(doc(db, 'inventory', catalogItem.id), {
              stockQuantity: increment(-qtyDiff),
              updatedAt: serverTimestamp()
            });
          }
        }

        closeModal();
        showToast('Stationery transaction updated', 'success');
      } catch (err) {
        showToast(`Update failed: ${err.message}`, 'error');
      }
    });
  }
}

function openEditStationeryModal(record) {
  const modal = document.getElementById('editStationeryModal');
  if (!modal || !record) return;

  document.getElementById('editStatDocId').value = record.id;
  document.getElementById('editStatName').value = record.itemName || '';
  document.getElementById('editStatCode').value = record.itemCode || '';
  document.getElementById('editStatCost').value = (record.costPrice || 0).toFixed(2);
  document.getElementById('editStatSelling').value = (record.sellingPrice || 0).toFixed(2);
  document.getElementById('editStatQty').value = record.quantity || 1;

  const total = roundCurrency((record.sellingPrice || 0) * (record.quantity || 1));
  const preview = document.getElementById('editStatTotalPreview');
  if (preview) preview.textContent = formatLKR(total);

  animateModalOpen(modal);
}

// =============================================================================
// 15. CLIENT-SIDE PDF REPORT ENGINE WITH PROFIT TOTALS
// =============================================================================

function generateProfessionalPdfReport() {
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
  const dateRangeStr = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;

  const stationeryList = APP_STATE.masterStationeryRecords
    .filter(s => s.date >= fromDate && s.date <= toDate)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const reloadList = APP_STATE.masterReloadRecords
    .filter(r => r.date >= fromDate && r.date <= toDate)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Compute Totals & Profit
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

  let totalReloadVolume = 0;
  let totalReloadCommission = 0;
  const opBreakdown = {
    AIRTEL: { vol: 0, comm: 0 },
    DIALOG: { vol: 0, comm: 0 },
    MOBITEL: { vol: 0, comm: 0 },
    HUTCH: { vol: 0, comm: 0 }
  };

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
  const totalNetProfit = roundCurrency(totalStatProfit + totalReloadCommission);

  // 1. Header Banner
  pdfDoc.setFillColor(15, 23, 42); // Slate 900
  pdfDoc.rect(0, 0, 210, 36, 'F');

  pdfDoc.setTextColor(255, 255, 255);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(20);
  pdfDoc.text('AL Communication', 14, 15);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor(203, 213, 225);
  pdfDoc.text('Sri Lankan Retail Stationery POS, Mobile Reload Ledger & Profit Tracker', 14, 22);
  pdfDoc.text(`Statement Period: ${dateRangeStr} | Generated: ${new Date().toLocaleString()}`, 14, 28);

  // 2. Financial Summary Box (Including Net Profit)
  pdfDoc.setFillColor(248, 250, 252);
  pdfDoc.setDrawColor(226, 232, 240);
  pdfDoc.roundedRect(14, 42, 182, 30, 3, 3, 'FD');

  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(10);
  pdfDoc.text('EXECUTIVE FINANCIAL & PROFIT SUMMARY', 18, 48);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(`Stationery Sales: ${formatLKR(totalStatSales)} (${totalUnitsSold} items)`, 18, 55);
  pdfDoc.text(`Reload Volume: ${formatLKR(totalReloadVolume)}`, 18, 61);
  pdfDoc.text(`Stationery Net Profit: ${formatLKR(totalStatProfit)}`, 18, 67);

  pdfDoc.text(`Earned Reload Commission: ${formatLKR(totalReloadCommission)}`, 105, 55);
  pdfDoc.text(`Total Period Revenue: ${formatLKR(totalStoreRevenue)}`, 105, 61);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(5, 150, 105); // Emerald Green
  pdfDoc.text(`Total Period Net Profit: ${formatLKR(totalNetProfit)}`, 105, 67);

  let currentY = 78;

  // 3. Stationery Sales Table with Cost & Profit
  if (stationeryList.length > 0) {
    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.text(`1. Stationery Sales & Margin Breakdown (${stationeryList.length} Transactions)`, 14, currentY);

    const statRows = stationeryList.map(s => {
      const qty = Number(s.quantity || 1);
      const sell = Number(s.totalAmount || s.sellingPrice || 0);
      let p = 0;
      if (s.profit !== undefined) {
        p = Number(s.profit);
      } else {
        const cost = Number(s.costPrice || 0);
        p = (Number(s.sellingPrice || 0) - cost) * qty;
      }

      return [
        s.date,
        s.time,
        s.itemCode || 'ST',
        s.itemName,
        String(qty),
        formatLKR(s.costPrice || 0),
        formatLKR(s.sellingPrice || 0),
        formatLKR(sell),
        `+${formatLKR(p)}`
      ];
    });

    pdfDoc.autoTable({
      startY: currentY + 3,
      head: [['Date', 'Time', 'Code', 'Item Name', 'Qty', 'Cost Price', 'Sell Price', 'Total Sales', 'Profit']],
      body: statRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold' },
        8: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 12;
  }

  // 4. Mobile Reload Table
  if (reloadList.length > 0) {
    if (currentY > 235) {
      pdfDoc.addPage();
      currentY = 20;
    }

    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.text(`2. Mobile Reload Log & Commissions (${reloadList.length} Top-Ups)`, 14, currentY);

    const reloadRows = reloadList.map(r => [
      r.date,
      r.time,
      r.operator,
      r.mobileNumber || '-',
      formatLKR(r.amount),
      `${Number(r.commissionRate || 0).toFixed(2)}%`,
      formatLKR(r.commissionAmount)
    ]);

    pdfDoc.autoTable({
      startY: currentY + 3,
      head: [['Date', 'Time', 'Network Operator', 'Mobile Number', 'Reload Amount', 'Commission Rate', 'Earned Commission']],
      body: reloadRows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'center' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 10;

    // Operator Breakdown Table
    if (currentY > 240) {
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
      head: [['Network Operator', 'Applied Rate', 'Total Reload Volume', 'Earned Commission']],
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

  // Page Numbers
  const pageCount = pdfDoc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdfDoc.setPage(i);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(148, 163, 184);
    pdfDoc.text(
      `AL Communication • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  pdfDoc.save(`AL-Communication-Report-${dateRangeStr}.pdf`);
  showToast('PDF Report generated and downloaded', 'success');
}

// =============================================================================
// 16. MASTER INVENTORY CATALOG & GETTING PRICE MANAGER
// =============================================================================

function setupCatalogManager() {
  const form = document.getElementById('catalogItemForm');
  const codeInput = document.getElementById('catalogCode');
  const nameInput = document.getElementById('catalogName');
  const categoryInput = document.getElementById('catalogCategory');
  const costPriceInput = document.getElementById('catalogCostPrice');
  const sellingPriceInput = document.getElementById('catalogSellingPrice');
  const stockInput = document.getElementById('catalogStockQuantity');
  const thresholdInput = document.getElementById('catalogLowStockThreshold');
  const docIdInput = document.getElementById('catalogDocId');
  const formTitle = document.getElementById('catalogFormTitle');
  const saveBtn = document.getElementById('catalogSaveBtn');
  const resetBtn = document.getElementById('catalogResetFormBtn');
  const searchInput = document.getElementById('catalogSearchInput');
  const seedBtn = document.getElementById('seedCatalogBtn');

  function resetCatalogForm() {
    form.reset();
    docIdInput.value = '';
    if (formTitle) formTitle.textContent = 'Add New Catalog Item';
    if (saveBtn) saveBtn.textContent = 'Save Item to Catalog';
    if (resetBtn) resetBtn.classList.add('hidden');
    if (stockInput) stockInput.value = '50';
    if (thresholdInput) thresholdInput.value = '5';
  }

  if (resetBtn) resetBtn.addEventListener('click', resetCatalogForm);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = codeInput.value.trim().toUpperCase();
      const name = nameInput.value.trim();
      const category = categoryInput ? categoryInput.value.trim() || 'General' : 'General';
      const costPrice = roundCurrency(costPriceInput.value);
      const sellingPrice = roundCurrency(sellingPriceInput.value);
      const stockQuantity = Math.max(0, parseInt(stockInput.value, 10) || 0);
      const lowStockThreshold = Math.max(0, parseInt(thresholdInput.value, 10) || 5);
      const editDocId = docIdInput.value;

      if (!code || !name) {
        showToast('Please provide both item code and name', 'error');
        return;
      }
      if (costPrice < 0) {
        showToast('Getting/Cost price cannot be negative', 'error');
        return;
      }
      if (sellingPrice <= 0) {
        showToast('Selling price must be greater than zero', 'error');
        return;
      }

      // Check unique code
      const duplicate = APP_STATE.inventoryCatalog.find(i => i.code === code && i.id !== editDocId);
      if (duplicate) {
        showToast(`Item Code "${code}" is already assigned to "${duplicate.name}"`, 'error');
        return;
      }

      try {
        const itemPayload = {
          code,
          name,
          category,
          costPrice,
          sellingPrice,
          stockQuantity,
          lowStockThreshold,
          updatedAt: serverTimestamp()
        };

        if (editDocId) {
          await updateDoc(doc(db, 'inventory', editDocId), itemPayload);
          showToast(`Updated item: ${name}`, 'success');
        } else {
          itemPayload.createdAt = serverTimestamp();
          await addDoc(collection(db, 'inventory'), itemPayload);
          showToast(`Added item: ${name} (Cost: ${formatLKR(costPrice)} | Sell: ${formatLKR(sellingPrice)})`, 'success');
        }
        resetCatalogForm();
      } catch (err) {
        showToast(`Failed to save catalog item: ${err.message}`, 'error');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderCatalogTable);
  }

  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      if (!confirm('Seed standard Sri Lankan retail stationery items into catalog with costs & stock? Existing items will not be overwritten.')) return;

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
            console.error('Seed error', e);
          }
        }
      }

      if (addedCount > 0) {
        showToast(`Successfully seeded ${addedCount} standard stationery products`, 'success');
      } else {
        showToast('Standard stationery items are already in catalog', 'info');
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
           (item.name || '').toLowerCase().includes(queryStr) ||
           (item.category || '').toLowerCase().includes(queryStr);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center theme-text-dim text-xs">
          No catalog records found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:theme-bg-subtle transition';

    const costDisplay = (item.costPrice !== undefined && item.costPrice > 0)
      ? `<span class="font-mono font-bold text-amber-400">${formatLKR(item.costPrice)}</span>`
      : `<span class="badge-cost-missing px-2 py-0.5 rounded text-[10px] font-bold" title="Cost price missing! Please edit to ensure accurate profit tracking.">Cost missing</span>`;

    const unitProfit = roundCurrency(item.sellingPrice - (item.costPrice || 0));
    const profitClass = unitProfit >= 0 ? 'text-emerald-400' : 'text-red-400';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-sky-400 text-xs">${item.code}</td>
      <td class="py-2.5 px-3 font-medium theme-text-main text-xs">
        <div>${item.name}</div>
        <div class="text-[10px] theme-text-dim">${item.category || 'General'}</div>
      </td>
      <td class="py-2.5 px-3 text-right font-mono text-xs">${costDisplay}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-xs theme-text-main">${formatLKR(item.sellingPrice)}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-xs ${profitClass}">+${formatLKR(unitProfit)}</td>
      <td class="py-2.5 px-3 text-center font-mono font-bold text-xs">${item.stockQuantity}</td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap space-x-1">
        <button type="button" data-edit-catalog="${item.id}" class="p-1 text-sky-400 hover:text-sky-300 transition" title="Edit Catalog Item">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" data-delete-catalog="${item.id}" class="p-1 text-red-400 hover:text-red-300 transition" title="Delete Catalog Item">
          <svg class="icon-svg-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    // Edit Item
    const editBtn = tr.querySelector(`[data-edit-catalog="${item.id}"]`);
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        document.getElementById('catalogDocId').value = item.id;
        document.getElementById('catalogCode').value = item.code;
        document.getElementById('catalogName').value = item.name;
        document.getElementById('catalogCategory').value = item.category || 'General';
        document.getElementById('catalogCostPrice').value = Number(item.costPrice || 0).toFixed(2);
        document.getElementById('catalogSellingPrice').value = Number(item.sellingPrice).toFixed(2);
        document.getElementById('catalogStockQuantity').value = item.stockQuantity;
        document.getElementById('catalogLowStockThreshold').value = item.lowStockThreshold || 5;

        const formTitle = document.getElementById('catalogFormTitle');
        const saveBtn = document.getElementById('catalogSaveBtn');
        const resetBtn = document.getElementById('catalogResetFormBtn');

        if (formTitle) formTitle.textContent = `Edit Catalog Item (${item.code})`;
        if (saveBtn) saveBtn.textContent = 'Update Catalog Item';
        if (resetBtn) resetBtn.classList.remove('hidden');

        document.getElementById('catalogCode').focus();
      });
    }

    // Delete Item
    const delBtn = tr.querySelector(`[data-delete-catalog="${item.id}"]`);
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete catalog item "${item.name}" (${item.code})? Historical transaction logs will remain preserved.`)) return;
        try {
          await deleteDoc(doc(db, 'inventory', item.id));
          showToast(`Deleted ${item.name}`, 'info');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 17. COMMISSION RATES & DEVELOPER DIAGNOSTICS
// =============================================================================

function setupRatesManager() {
  const form = document.getElementById('commissionsForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
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
        });
        showToast('Commission percentages saved', 'success');
      } catch (err) {
        showToast(`Failed to save rates: ${err.message}`, 'error');
      }
    });
  }
}

function setupDeveloperConsole() {
  const devToggle = document.getElementById('devConsoleToggle');
  const devBody = document.getElementById('devConsoleBody');
  const testWriteBtn = document.getElementById('dbgTestWriteBtn');
  const exportDataBtn = document.getElementById('dbgExportDataBtn');
  const clearCacheBtn = document.getElementById('dbgClearCacheBtn');
  const clearLogsBtn = document.getElementById('dbgClearLogsBtn');

  if (devToggle && devBody) {
    devToggle.addEventListener('click', () => {
      devBody.classList.toggle('hidden');
    });
  }

  if (testWriteBtn) {
    testWriteBtn.addEventListener('click', async () => {
      try {
        const start = performance.now();
        const testRef = await addDoc(collection(db, 'diagnostics'), {
          test: true,
          timestamp: serverTimestamp(),
          agent: navigator.userAgent
        });
        await deleteDoc(testRef);
        const latency = Math.round(performance.now() - start);
        showToast(`Cloud round-trip test successful (${latency}ms)`, 'success');
        logDebug(`Diagnostic test write succeeded in ${latency}ms`, 'SUCCESS');
      } catch (err) {
        showToast(`Diagnostic test failed: ${err.message}`, 'error');
        logDebug(`Diagnostic test failed: ${err.message}`, 'ERROR');
      }
    });
  }

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        system: 'AL Communication Ledger v3.1',
        catalog: APP_STATE.inventoryCatalog,
        stationeryTransactions: APP_STATE.masterStationeryRecords,
        reloadTransactions: APP_STATE.masterReloadRecords,
        commissionRates: APP_STATE.commissionRates,
        reloadPresets: APP_STATE.reloadPresets,
        dashboardCardOrder: APP_STATE.dashboardCardOrder
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `al-communication-backup-${getTodayDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Exported full database backup (JSON)', 'success');
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      if (confirm('Clear local application cache and layout preferences?')) {
        localStorage.removeItem('al_dashboard_order');
        localStorage.removeItem('al_metrics_order');
        localStorage.removeItem('al_metrics_sizes');
        localStorage.removeItem('al_theme');
        localStorage.removeItem('al_ui_style');
        showToast('Local application storage preferences cleared', 'info');
      }
    });
  }

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      APP_STATE.devLogs = [];
      const term = document.getElementById('dbgTerminalLogs');
      if (term) term.innerHTML = '<div class="text-gray-500">[System] Logs cleared.</div>';
    });
  }
}

function updateCacheMetrics() {
  const healthEl = document.getElementById('dbgFirestoreHealth');
  const authEl = document.getElementById('dbgAuthState');
  const cacheEl = document.getElementById('dbgCacheMetrics');

  if (healthEl) {
    healthEl.textContent = isFirebaseInitialized ? 'Online & Connected' : `Init Failure: ${initError || 'Config error'}`;
    healthEl.className = isFirebaseInitialized ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
  }

  if (authEl) {
    authEl.textContent = APP_STATE.currentUser ? `Logged In (${APP_STATE.currentUser.email})` : 'Unauthenticated';
  }

  if (cacheEl) {
    const totalRecords = APP_STATE.masterStationeryRecords.length + APP_STATE.masterReloadRecords.length;
    cacheEl.textContent = `${APP_STATE.inventoryCatalog.length} catalog items • ${totalRecords} cached logs`;
  }
}

// =============================================================================
// 18. APPLICATION BOOTSTRAP INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  logDebug('AL Communication System Initializing (V4.0 Three.js, Lenis, GSAP & Glass)...', 'INFO');

  // 0A. Three.js Interactive Anti-Gravity Particle Background
  initThreeBackground();

  // 0B. Lenis Momentum Smooth Scrolling Engine
  initLenisScroll();

  // 1. Theme and UI Style Setup
  initThemeAndStyle();

  // 2. Glass Click Ripple
  initGlassRippleFeedback();

  // 3. Live Clock & Online Status
  startLiveClock();
  initNetworkMonitor();

  // 4. Navigation & View Routing
  initNavigation();

  // 5. Presets Management Controls
  setupPresetControls();

  // 6. Stationery POS Module
  setupStationeryModule();

  // 7. Mobile Reloads Module
  setupReloadModule();

  // 8. Stock Inventory Module
  setupStockModule();

  // 9. Dashboard Drag-and-Drop Controller
  setupDashboardDragAndDrop();

  // 10. Master Logs & Consolidated Financials
  setupMasterLogsModule();

  // 11. Settings Managers (Catalog, Rates, Developer)
  setupCatalogManager();
  setupRatesManager();
  setupDeveloperConsole();

  // 12. Auth Flow Initiation
  setupAuth();

  logDebug('AL Communication System Bootstrap Complete (V4.0).', 'SUCCESS');
});
