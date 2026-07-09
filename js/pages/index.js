/**
 * index.js — landing page.
 * Signed-in players skip straight to the game hub.
 */

import { ROUTES } from "../core/Constants.js";
import { AuthService } from "../services/AuthService.js";

const user = await AuthService.currentUser();
if (user) {
  window.location.replace(ROUTES.GAME);
} else {
  document.getElementById("play-btn").href = ROUTES.LOGIN;
}
