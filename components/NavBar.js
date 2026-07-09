/**
 * NavBar.js
 * -----------------------------------------------------------------------
 * Shared top navigation. Rendered into the `<header id="app-nav">`
 * element present on every page. Shows game links, the player's gold and
 * avatar, a sound toggle and logout. Collapses to a hamburger on mobile.
 */

import { ROUTES } from "../js/core/Constants.js";
import { AuthService } from "../js/services/AuthService.js";
import { UserService } from "../js/services/UserService.js";
import { Sound } from "../js/utils/Sound.js";

const LINKS = Object.freeze([
  { route: ROUTES.GAME, label: "Home", icon: "🏰" },
  { route: ROUTES.BATTLE, label: "Battle", icon: "⚔️" },
  { route: ROUTES.DECK, label: "Deck", icon: "🃏" },
  { route: ROUTES.COLLECTION, label: "Collection", icon: "📚" },
  { route: ROUTES.RANKING, label: "Ranking", icon: "🏆" },
  { route: ROUTES.PROFILE, label: "Profile", icon: "🧙" },
]);

export class NavBar {
  /**
   * @param {{profile: object|null, activeRoute: string}} options
   */
  static render({ profile, activeRoute }) {
    const host = document.getElementById("app-nav");
    if (!host) return;

    const links = [...LINKS];
    if (UserService.isAdmin(profile)) {
      links.push({ route: ROUTES.ADMIN, label: "Admin", icon: "🛠️" });
    }

    host.innerHTML = `
      <nav class="nav">
        <a class="nav-brand" href="${ROUTES.GAME}">⚜️ <span>ARTHORXMITH</span></a>
        <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false">☰</button>
        <div class="nav-links">
          ${links
            .map(
              (link) => `
            <a class="nav-link ${link.route === activeRoute ? "active" : ""}" href="${link.route}">
              <span class="nav-link-icon">${link.icon}</span>${link.label}
            </a>`,
            )
            .join("")}
        </div>
        <div class="nav-user">
          ${profile ? `<span class="nav-gold" title="Gold">🪙 ${Number(profile.gold ?? 0).toLocaleString()}</span>` : ""}
          <button class="nav-sound" type="button" title="Toggle sound">${Sound.muted ? "🔇" : "🔊"}</button>
          ${
            profile
              ? `
            <img class="nav-avatar" src="${profile.photoURL || ""}" alt="" referrerpolicy="no-referrer"
                 onerror="this.style.display='none'">
            <span class="nav-name">${NavBar.#escape(profile.displayName)}</span>
            <button class="nav-logout" type="button" title="Log out">⎋</button>`
              : ""
          }
        </div>
      </nav>`;

    host.querySelector(".nav-burger").addEventListener("click", (event) => {
      const expanded = host.querySelector(".nav-links").classList.toggle("open");
      event.currentTarget.setAttribute("aria-expanded", String(expanded));
    });
    host.querySelector(".nav-sound").addEventListener("click", (event) => {
      event.currentTarget.textContent = Sound.toggleMute() ? "🔇" : "🔊";
      Sound.play("click");
    });
    host.querySelector(".nav-logout")?.addEventListener("click", async () => {
      await AuthService.logout();
      window.location.replace(ROUTES.INDEX);
    });
  }

  static #escape(text) {
    const span = document.createElement("span");
    span.textContent = text ?? "";
    return span.innerHTML;
  }
}
