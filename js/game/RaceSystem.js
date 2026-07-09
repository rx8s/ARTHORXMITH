/**
 * RaceSystem.js
 * -----------------------------------------------------------------------
 * Race registry and hook point for race-vs-race damage bonuses. The bonus
 * table ships neutral (all 1.0) but the API is already consumed by the
 * BattleEngine, so future balance patches only touch RACE_BONUS below.
 */

import { RACES, RACE_META } from "../core/Constants.js";

/**
 * Attacker-race → defender-race damage multipliers. Only non-1.0 entries
 * need to be listed; everything else defaults to 1.0.
 * Example future entry: { [RACES.DRAGON]: { [RACES.INSECT]: 1.25 } }
 */
const RACE_BONUS = Object.freeze({});

const DEFAULT_MULTIPLIER = 1;

export class RaceSystem {
  static isValid(race) {
    return Object.values(RACES).includes(race);
  }

  /**
   * Damage multiplier for attacker race vs defender race.
   * @returns {number} 1.0 unless a bonus is configured.
   */
  static getMultiplier(attackRace, defendRace) {
    return RACE_BONUS[attackRace]?.[defendRace] ?? DEFAULT_MULTIPLIER;
  }

  /** Applies the race multiplier to a raw damage value (floored). */
  static applyRace(damage, attackRace, defendRace) {
    return Math.floor(damage * RaceSystem.getMultiplier(attackRace, defendRace));
  }

  /** Display metadata passthrough. */
  static meta(race) {
    return RACE_META[race];
  }

  /** Full list of race ids. */
  static all() {
    return Object.values(RACES);
  }
}
