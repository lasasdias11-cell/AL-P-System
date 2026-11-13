// =============================================================================
// AL COMMUNICATION — FIREBASE SDK v11 MODULAR CONFIGURATION (VERSION 4.0)
// Project ID: al-p1-fb432 | Auth Domain: al-p1-fb432.firebaseapp.com
// High-Reliability Mobile Session Persistence & Real-time Cloud Sync
// =============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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

export const firebaseConfig = {
  apiKey: "AIzaSyCPl4RNDqJy8GFPR1Ixcs_maAhPKK_iIm0",
  authDomain: "al-p1-fb432.firebaseapp.com",
  projectId: "al-p1-fb432",
  storageBucket: "al-p1-fb432.firebasestorage.app",
  messagingSenderId: "627092911084",
  appId: "1:627092911084:web:80de6c0a270957842086c9"
};

let app;
let auth;
let db;
let isFirebaseInitialized = false;
let initError = null;
export let authPersistenceReady = Promise.resolve(false);

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  
  // Explicitly enforce persistent auth across mobile and desktop.
  authPersistenceReady = setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("[Firebase Auth] Local persistence successfully active.");
      return true;
    })
    .catch((persErr) => {
      console.warn("[Firebase Auth] Persistence setup notice:", persErr.message);
      return false;
    });

  db = getFirestore(app);
  isFirebaseInitialized = true;
} catch (error) {
  console.warn("[Firebase Init Error]:", error);
  initError = error;
}

export const secondaryApp = getApps().find(existingApp => existingApp.name === 'Secondary')
  || initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);

export {
  initializeApp,
  getAuth,
  getFirestore,
  app,
  auth,
  db,
  isFirebaseInitialized,
  initError,
  // Auth Exports
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
