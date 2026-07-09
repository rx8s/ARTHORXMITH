/**
 * FirebaseService.js
 * -----------------------------------------------------------------------
 * Single Firebase initialisation point. Every other module imports `auth`,
 * `db`, `storage` and the SDK helpers from HERE, never from gstatic
 * directly — so upgrading the SDK version is a one-file change.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import { firebaseConfig } from "./FirebaseConfig.js";

const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance (Google provider only). */
export const auth = getAuth(app);

/** Cloud Firestore instance — the game's only persistence layer. */
export const db = getFirestore(app);

/** Cloud Storage instance — monster artwork uploads from the admin page. */
export const storage = getStorage(app);

// Re-exported SDK helpers so the rest of the codebase has one import root.
export {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
  ref,
  uploadBytes,
  getDownloadURL,
};
