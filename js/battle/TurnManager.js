/**
 * TurnManager.js
 * -----------------------------------------------------------------------
 * Round counter and initiative ordering. Higher ASPD (driven by AGI) acts
 * first; ties are broken randomly each round.
 */

import { BATTLE } from "../core/Constants.js";
import { Random } from "../utils/Random.js";

export class TurnManager {
  constructor() {
    this.round = 0;
  }

  nextRound() {
    this.round += 1;
    return this.round;
  }

  get limitReached() {
    return this.round >= BATTLE.MAX_ROUNDS;
  }

  /**
   * Orders the two active combatants for this round.
   * @returns {import("./Combatant.js").Combatant[]} fastest first
   */
  order(first, second) {
    const a = first.stat("aspd");
    const b = second.stat("aspd");
    if (a === b) return Random.chance(50) ? [first, second] : [second, first];
    return a > b ? [first, second] : [second, first];
  }
}
