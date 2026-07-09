/**
 * AuthService.js
 * -----------------------------------------------------------------------
 * Google-only authentication. Anonymous sign-in is intentionally not
 * offered anywhere in this service.
 */

import {
  auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "../firebase/FirebaseService.js";
import { Logger } from "../utils/Logger.js";

const log = new Logger("AuthService");

export class AuthService {
  /**
   * Resolves once Firebase has restored the session.
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js").User|null>}
   */
  static currentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  /**
   * Starts Google sign-in. Uses a popup, falling back to a full-page
   * redirect when the popup is blocked (common on mobile browsers).
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js").User>}
   */
  static async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/operation-not-supported-in-this-environment"
      ) {
        log.warn("Popup unavailable, falling back to redirect flow");
        await signInWithRedirect(auth, provider);
        return AuthService.currentUser();
      }
      throw error;
    }
  }

  static logout() {
    return signOut(auth);
  }
}
