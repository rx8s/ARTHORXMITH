/**
 * ElementSystem.js
 * -----------------------------------------------------------------------
 * Elemental damage multiplier table. Rows are the ATTACKING element,
 * columns are the DEFENDING element, both in ELEMENT_ORDER. Values are
 * percentages: 100 = neutral, 150 = strong, 25 = weak, 0 = immune.
 */

import { ELEMENT_ORDER, ELEMENT_META } from "../core/Constants.js";

/** Damage multiplier matrix (percent), axes in ELEMENT_ORDER. */
const MATRIX = Object.freeze([
  //            neu  wat  ear  fir  win  poi  hol  sha  gho  und
  /* neutral */ [100, 100, 100, 100, 100, 100, 100, 100, 0, 100],
  /* water   */ [100, 25, 100, 150, 75, 125, 100, 100, 75, 100],
  /* earth   */ [100, 100, 25, 75, 150, 125, 100, 100, 75, 100],
  /* fire    */ [100, 75, 150, 25, 100, 125, 100, 100, 75, 100],
  /* wind    */ [100, 150, 75, 100, 25, 125, 100, 100, 75, 100],
  /* poison  */ [100, 100, 100, 100, 100, 0, 100, 50, 75, 50],
  /* holy    */ [100, 75, 75, 75, 75, 75, 0, 150, 125, 150],
  /* shadow  */ [100, 100, 100, 100, 100, 50, 150, 0, 50, 25],
  /* ghost   */ [0, 100, 100, 100, 100, 100, 100, 75, 150, 75],
  /* undead  */ [100, 100, 100, 125, 100, 0, 150, 0, 75, 0],
]);

const PERCENT = 100;

export class ElementSystem {
  /** @returns {number} matrix index for an element id, throws on unknown ids. */
  static #index(element) {
    const index = ELEMENT_ORDER.indexOf(element);
    if (index === -1) throw new Error(`Unknown element: ${element}`);
    return index;
  }

  /**
   * Damage multiplier for an attack.
   * @param {string} attackElement
   * @param {string} defendElement
   * @returns {number} e.g. 1.5, 1, 0.25, 0
   */
  static getMultiplier(attackElement, defendElement) {
    return MATRIX[ElementSystem.#index(attackElement)][ElementSystem.#index(defendElement)] / PERCENT;
  }

  /**
   * Applies the element multiplier to a raw damage value.
   * FinalDamage = Damage × ElementMultiplier (floored).
   */
  static applyElement(damage, attackElement, defendElement) {
    return Math.floor(damage * ElementSystem.getMultiplier(attackElement, defendElement));
  }

  /** Effectiveness bucket used by UI and AI ("strong" | "neutral" | "weak" | "immune"). */
  static effectiveness(attackElement, defendElement) {
    const multiplier = ElementSystem.getMultiplier(attackElement, defendElement);
    if (multiplier === 0) return "immune";
    if (multiplier > 1) return "strong";
    if (multiplier < 1) return "weak";
    return "neutral";
  }

  /** Elements that hit `defendElement` for more than 100%. Used by enemy AI. */
  static strongAgainst(defendElement) {
    return ELEMENT_ORDER.filter(
      (attack) => ElementSystem.getMultiplier(attack, defendElement) > 1,
    );
  }

  /** Display metadata passthrough so UI code needs only this class. */
  static meta(element) {
    return ELEMENT_META[element];
  }

  /** Full list of element ids. */
  static all() {
    return [...ELEMENT_ORDER];
  }
}
