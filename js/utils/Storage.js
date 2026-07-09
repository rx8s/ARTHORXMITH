/**
 * Storage.js
 * -----------------------------------------------------------------------
 * Namespaced localStorage wrapper with JSON (de)serialisation and optional
 * time-to-live, used for caching game data (monsters/skills) client-side.
 */

const NAMESPACE = "arx";

export class Storage {
  static #key(key) {
    return `${NAMESPACE}:${key}`;
  }

  /**
   * @param {string} key
   * @param {*} value JSON-serialisable value.
   * @param {number} [ttlMs] Optional expiry in milliseconds.
   */
  static set(key, value, ttlMs) {
    const record = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };
    try {
      localStorage.setItem(Storage.#key(key), JSON.stringify(record));
    } catch {
      /* quota exceeded or private mode — caching is best-effort */
    }
  }

  /**
   * @param {string} key
   * @param {*} [fallback] Returned when missing/expired/corrupt.
   */
  static get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(Storage.#key(key));
      if (raw === null) return fallback;
      const record = JSON.parse(raw);
      if (record.expiresAt && Date.now() > record.expiresAt) {
        Storage.remove(key);
        return fallback;
      }
      return record.value;
    } catch {
      return fallback;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(Storage.#key(key));
    } catch {
      /* ignore */
    }
  }
}
