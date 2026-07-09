/**
 * AnimationManager.js
 * -----------------------------------------------------------------------
 * Pure-CSS battle animations. Adds a CSS class, waits for `animationend`
 * (with a safety timeout), removes the class — plus floating damage/heal
 * numbers spawned into a combatant's stage slot.
 */

const SAFETY_TIMEOUT_MS = 1200;
const FLOAT_LIFETIME_MS = 1100;

export class AnimationManager {
  /** Simple awaitable pause used to pace the battle log. */
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Plays a one-shot CSS animation class on an element.
   * @param {HTMLElement|null} element
   * @param {string} className e.g. "anim-attack", "anim-shake"
   */
  static play(element, className) {
    if (!element) return Promise.resolve();
    return new Promise((resolve) => {
      const cleanup = () => {
        element.classList.remove(className);
        element.removeEventListener("animationend", cleanup);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(cleanup, SAFETY_TIMEOUT_MS);
      element.addEventListener("animationend", cleanup);
      // restart the animation even if the class was applied moments ago
      element.classList.remove(className);
      void element.offsetWidth;
      element.classList.add(className);
    });
  }

  /**
   * Spawns a floating combat number above a stage slot.
   * @param {HTMLElement|null} container position:relative stage slot
   * @param {string} text e.g. "-42", "+18", "MISS"
   * @param {"damage"|"crit"|"heal"|"miss"|"status"} type styles the float
   */
  static floatNumber(container, text, type) {
    if (!container) return;
    const float = document.createElement("span");
    float.className = `float-number float-${type}`;
    float.textContent = text;
    container.appendChild(float);
    setTimeout(() => float.remove(), FLOAT_LIFETIME_MS);
  }
}
