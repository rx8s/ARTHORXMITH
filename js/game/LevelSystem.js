/**
 * LevelSystem.js
 * -----------------------------------------------------------------------
 * Card EXP / level-up handling, including per-level stat growth.
 *
 * Growth modes (monster.growthMode):
 *   "fixed"  — each level adds exactly monster.growth[stat]
 *   "random" — each level adds monster.growth[stat] + Random.int(0, VARIANCE)
 */

import { LEVEL } from "../core/Constants.js";
import { Random } from "../utils/Random.js";
import { Formula } from "./Formula.js";

export class LevelSystem {
  /**
   * Adds EXP to a mutable card-state object, applying any level-ups.
   * @param {{level:number, exp:number, stats:object}} state card instance state (mutated)
   * @param {import("./Monster.js").Monster} monster the card's species
   * @param {number} amount EXP gained
   * @returns {{levelsGained:number, statGains:object}} summary for UI
   */
  static addExp(state, monster, amount) {
    const statGains = {};
    let levelsGained = 0;
    if (state.level >= LEVEL.MAX) return { levelsGained, statGains };

    state.exp += Math.max(0, Math.floor(amount));
    while (state.level < LEVEL.MAX && state.exp >= Formula.expToNext(state.level)) {
      state.exp -= Formula.expToNext(state.level);
      state.level += 1;
      levelsGained += 1;
      for (const [stat, base] of Object.entries(monster.growth)) {
        const gain =
          monster.growthMode === "random"
            ? base + Random.int(0, LEVEL.RANDOM_GROWTH_VARIANCE)
            : base;
        state.stats[stat] = Formula.clampStat((state.stats[stat] ?? 1) + gain);
        statGains[stat] = (statGains[stat] ?? 0) + gain;
      }
    }
    if (state.level >= LEVEL.MAX) state.exp = 0;
    return { levelsGained, statGains };
  }

  /** Progress toward next level as a 0–1 fraction (1 at level cap). */
  static progress(state) {
    if (state.level >= LEVEL.MAX) return 1;
    return Math.min(1, state.exp / Formula.expToNext(state.level));
  }
}
