// =============================================================================
// AL COMMUNICATION — FIREBASE SDK v11 MODULAR CONFIGURATION
// Project ID: al-p1-fb432 | Auth Domain: al-p1-fb432.firebaseapp.com
// High-Reliability Mobile Session Persistence & Real-time Cloud Sync
// =============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateEmail, 
  updatePassword, 
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, 
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
  enableNetwork,
  disableNetwork,
  increment,
  runTransaction
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Retrieve custom API key if stored, or fallback to configured key
const storedApiKey = localStorage.getItem('al_firebase_api_key');

export const firebaseConfig = {
  apiKey: storedApiKey || window.__FIREBASE_API_KEY__ || "AIzaSyB_REPLACE_WITH_FIREBASE_CONSOLE_API_KEY",
  authDomain: "al-p1-fb432.firebaseapp.com",
  projectId: "al-p1-fb432",
  storageBucket: "al-p1-fb432.firebasestorage.app",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:al-p1-fb432-frontend"
};

let app;
let auth;
let db;
let isFirebaseInitialized = false;
let initError = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  
  // Explicitly enforce IndexedDB/localStorage persistent auth across mobile and desktop
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("[Firebase Auth] Local persistence successfully active.");
    })
    .catch((persErr) => {
      console.warn("[Firebase Auth] Persistence setup notice:", persErr.message);
    });

  db = getFirestore(app);
  isFirebaseInitialized = true;
} catch (error) {
  console.warn("[Firebase Init Error]:", error);
  initError = error;
}

// Function to update API key dynamically and reload
export function updateFirebaseApiKey(newApiKey) {
  if (!newApiKey) return false;
  localStorage.setItem('al_firebase_api_key', newApiKey.trim());
  window.location.reload();
  return true;
}

export {
  app,
  auth,
  db,
  isFirebaseInitialized,
  initError,
  // Auth Exports
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
  // Firestore Exports
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
  enableNetwork,
  disableNetwork,
  increment,
  runTransaction
};
