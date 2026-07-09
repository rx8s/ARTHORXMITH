/**
 * EvolutionSystem.js
 * -----------------------------------------------------------------------
 * Evolution rules. A monster's `evolution` field declares:
 *   { to: targetMonsterId, level: requiredLevel,
 *     materials: { gold: number, duplicates: number } }
 *
 * Evolving keeps the card's level/exp, swaps the species (artwork, skills,
 * element/race/rarity) and rebuilds stats from the target species' base +
 * fixed growth per level already earned — so evolution is always an upgrade.
 * Duplicate cards of the SAME species are consumed as material.
 */

import { EVOLUTION } from "../core/Constants.js";
import { Formula } from "./Formula.js";

export class EvolutionSystem {
  /**
   * Checks every evolution requirement.
   * @param {import("./Card.js").Card} card
   * @param {import("./Monster.js").Monster} monster the card's CURRENT species
   * @param {{gold: number, duplicateCount: number}} owned player resources;
   *        duplicateCount counts OTHER owned cards of the same species.
   * @returns {{ok: boolean, reasons: string[], cost: {gold: number, duplicates: number}}}
   */
  static check(card, monster, { gold, duplicateCount }) {
    const reasons = [];
    if (!monster.canEvolve) {
      return { ok: false, reasons: ["This monster has no further evolution."], cost: null };
    }
    const evolution = monster.evolution;
    const cost = {
      gold: Math.max(EVOLUTION.MIN_GOLD_COST, evolution.materials.gold ?? 0),
      duplicates: evolution.materials.duplicates ?? 0,
    };
    if (card.level < evolution.level) {
      reasons.push(`Requires level ${evolution.level} (currently ${card.level}).`);
    }
    if (gold < cost.gold) {
      reasons.push(`Requires ${cost.gold} gold (you have ${gold}).`);
    }
    if (duplicateCount < cost.duplicates) {
      reasons.push(`Requires ${cost.duplicates} duplicate card(s) as material (you have ${duplicateCount}).`);
    }
    return { ok: reasons.length === 0, reasons, cost };
  }

  /**
   * Computes the evolved card state. Stats are rebuilt from the TARGET
   * species: base (with rarity bonus) + fixed growth for each level gained.
   * @param {import("./Card.js").Card} card
   * @param {import("./Monster.js").Monster} target the evolved species
   * @returns {{monsterId: string, level: number, exp: number, stats: object}}
   */
  static evolvedState(card, target) {
    const stats = {};
    const base = target.effectiveBaseStats;
    for (const [stat, value] of Object.entries(base)) {
      const growth = target.growth[stat] ?? 0;
      stats[stat] = Formula.clampStat(value + growth * (card.level - 1));
    }
    return { monsterId: target.id, level: card.level, exp: card.exp, stats };
  }
}
