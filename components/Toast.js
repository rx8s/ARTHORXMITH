/**
 * Toast.js
 * -----------------------------------------------------------------------
 * Lightweight toast notifications. Creates its own container on first use;
 * no page markup required.
 */

const LIFETIME_MS = 3200;

export class Toast {
  static #container() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * @param {string} message
   * @param {"info"|"success"|"error"} [type]
   */
  static show(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    Toast.#container().appendChild(toast);
    setTimeout(() => {
      toast.classList.add("toast-out");
      setTimeout(() => toast.remove(), 400);
    }, LIFETIME_MS);
  }

  static success(message) {
    Toast.show(message, "success");
  }

  static error(message) {
    Toast.show(message, "error");
  }
}
