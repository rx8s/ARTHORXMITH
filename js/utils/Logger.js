/**
 * Logger.js
 * -----------------------------------------------------------------------
 * Leveled, tagged logger. Level is persisted so it can be raised in
 * production from the console: `localStorage.setItem("arx:logLevel","debug")`.
 */

const LEVELS = Object.freeze({ debug: 0, info: 1, warn: 2, error: 3, silent: 4 });
const STORAGE_KEY = "arx:logLevel";
const DEFAULT_LEVEL = "info";

export class Logger {
  /**
   * @param {string} tag Prefix shown on every message, e.g. "BattleEngine".
   */
  constructor(tag) {
    this.tag = tag;
  }

  static get level() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LEVEL;
    } catch {
      return DEFAULT_LEVEL;
    }
  }

  static set level(value) {
    if (!(value in LEVELS)) throw new Error(`Unknown log level: ${value}`);
    localStorage.setItem(STORAGE_KEY, value);
  }

  #enabled(level) {
    return LEVELS[level] >= LEVELS[Logger.level];
  }

  #emit(level, args) {
    if (!this.#enabled(level)) return;
    const method = level === "debug" ? "log" : level;
    console[method](`[${this.tag}]`, ...args);
  }

  debug(...args) { this.#emit("debug", args); }
  info(...args) { this.#emit("info", args); }
  warn(...args) { this.#emit("warn", args); }
  error(...args) { this.#emit("error", args); }
}
