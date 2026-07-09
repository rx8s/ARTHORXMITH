/**
 * App.js
 * -----------------------------------------------------------------------
 * Per-page bootstrap: restores the Firebase session, enforces auth/admin
 * guards, loads game data and renders the shared navigation bar. Every
 * page module calls `App.init(...)` first and receives the signed-in user
 * and profile.
 */

import { ROUTES } from "./Constants.js";
import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { GameDataService } from "../services/GameDataService.js";
import { NavBar } from "../../components/NavBar.js";
import { Logger } from "../utils/Logger.js";

const log = new Logger("App");

export class App {
  /**
   * @param {{requireAuth?: boolean, requireAdmin?: boolean, activeRoute?: string}} options
   * @returns {Promise<{user: object|null, profile: object|null}>}
   *          Never resolves when a guard redirects away.
   */
  static async init({ requireAuth = true, requireAdmin = false, activeRoute = "" } = {}) {
    const user = await AuthService.currentUser();

    if (!user && requireAuth) {
      log.info("Not signed in — redirecting to login");
      window.location.replace(ROUTES.LOGIN);
      return new Promise(() => {});
    }

    let profile = null;
    if (user) {
      profile = await UserService.getProfile(user.uid);
      if (!profile) profile = await UserService.ensureUserDocument(user);
    }

    if (requireAdmin && !UserService.isAdmin(profile)) {
      log.warn("Admin page requested without admin role");
      window.location.replace(ROUTES.GAME);
      return new Promise(() => {});
    }

    await GameDataService.load();
    NavBar.render({ profile, activeRoute });
    document.body.classList.add("app-ready");
    return { user, profile };
  }

  /** Re-renders the nav (e.g. after the gold balance changes). */
  static refreshNav(profile, activeRoute) {
    NavBar.render({ profile, activeRoute });
  }
}
