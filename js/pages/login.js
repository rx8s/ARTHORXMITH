/**
 * login.js — Google sign-in page.
 * On success the user document is created/refreshed (starter pack on first
 * login) and the player is redirected to the game hub.
 */

import { ROUTES } from "../core/Constants.js";
import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { Logger } from "../utils/Logger.js";

const log = new Logger("LoginPage");
const button = document.getElementById("google-login");
const status = document.getElementById("login-status");

async function completeLogin(user) {
  status.textContent = "Preparing your account…";
  await UserService.ensureUserDocument(user);
  window.location.replace(ROUTES.GAME);
}

// Already signed in (or returning from a redirect flow)? Go straight in.
const existing = await AuthService.currentUser();
if (existing) {
  await completeLogin(existing);
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Opening Google sign-in…";
  try {
    const user = await AuthService.loginWithGoogle();
    await completeLogin(user);
  } catch (error) {
    log.error("Login failed", error);
    status.textContent =
      error.code === "auth/popup-closed-by-user"
        ? "Sign-in cancelled."
        : `Sign-in failed: ${error.message}`;
    button.disabled = false;
  }
});
