/**
 * Sound.js
 * -----------------------------------------------------------------------
 * Zero-asset sound effects via the Web Audio API. Every effect is a short
 * synthesised tone sequence, so the game ships no audio files and works
 * offline. Mute preference persists via Storage.
 */

import { Storage } from "./Storage.js";

const MUTE_KEY = "muted";

/** Each effect is a list of [frequencyHz, durationSec, type, delaySec] notes. */
const EFFECTS = Object.freeze({
  click: [[520, 0.05, "square", 0]],
  attack: [[220, 0.08, "sawtooth", 0], [160, 0.1, "sawtooth", 0.06]],
  critical: [[880, 0.06, "square", 0], [660, 0.06, "square", 0.05], [990, 0.12, "square", 0.1]],
  heal: [[440, 0.1, "sine", 0], [660, 0.1, "sine", 0.09], [880, 0.16, "sine", 0.18]],
  status: [[330, 0.12, "triangle", 0], [280, 0.14, "triangle", 0.1]],
  ko: [[300, 0.1, "sawtooth", 0], [200, 0.14, "sawtooth", 0.09], [120, 0.3, "sawtooth", 0.2]],
  victory: [[523, 0.12, "square", 0], [659, 0.12, "square", 0.12], [784, 0.12, "square", 0.24], [1046, 0.3, "square", 0.36]],
  defeat: [[392, 0.2, "triangle", 0], [330, 0.2, "triangle", 0.2], [262, 0.4, "triangle", 0.4]],
  miss: [[180, 0.12, "sine", 0]],
});

const GAIN = 0.08;

export class Sound {
  static #context = null;

  static #ctx() {
    if (!Sound.#context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      Sound.#context = AudioContextClass ? new AudioContextClass() : null;
    }
    return Sound.#context;
  }

  static get muted() {
    return Storage.get(MUTE_KEY, false);
  }

  static set muted(value) {
    Storage.set(MUTE_KEY, Boolean(value));
  }

  static toggleMute() {
    Sound.muted = !Sound.muted;
    return Sound.muted;
  }

  /** @param {keyof typeof EFFECTS} name */
  static play(name) {
    if (Sound.muted) return;
    const ctx = Sound.#ctx();
    const notes = EFFECTS[name];
    if (!ctx || !notes) return;
    if (ctx.state === "suspended") ctx.resume();
    for (const [frequency, duration, type, delay] of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(GAIN, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    }
  }
}
