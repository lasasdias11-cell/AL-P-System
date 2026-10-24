// Firebase SDK v11 Modular Configuration
// AL Communication - Sri Lankan Retail & Mobile Reload System
// Target Project: al-p1-fb432 | Auth Domain: al-p1-fb432.firebaseapp.com

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
  EmailAuthProvider
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

// Retrieve saved API Key if custom, or default to configured environment key
const storedApiKey = localStorage.getItem('al_firebase_api_key');
const DEFAULT_API_KEY = storedApiKey || "AIzaSy" + "DummyPlaceholderReplaceInSettingsOrLocalStorage";

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
  db = getFirestore(app);
  isFirebaseInitialized = true;
} catch (error) {
  console.warn("Firebase initialization notice:", error);
  initError = error;
}

// Function to update API key dynamically and reinitialize
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
