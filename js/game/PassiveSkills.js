/**
 * PassiveSkills.js
 * -----------------------------------------------------------------------
 * Passive skill definitions + resolver. Passives are attached to monsters
 * in monsters.json via `passives: ["atk_up_10", ...]`.
 *
 * Kinds:
 *   statBonus       — multiplies one derived stat of the owner
 *   elementResist   — reduces incoming damage of one element
 *   hpRegen         — heals % max HP at end of the owner's turn
 *   aura            — statBonus applied to the WHOLE party (support aura)
 */

export const PASSIVE_SKILL_DEFS = Object.freeze({
  atk_up_10: {
    id: "atk_up_10", label: "Mighty Arms", icon: "💪",
    kind: "statBonus", stat: "atk", multiplier: 1.1,
    description: "Increases ATK by 10%.",
  },
  matk_up_10: {
    id: "matk_up_10", label: "Arcane Mind", icon: "🧠",
    kind: "statBonus", stat: "matk", multiplier: 1.1,
    description: "Increases MATK by 10%.",
  },
  crit_up_5: {
    id: "crit_up_5", label: "Keen Eye", icon: "🎯",
    kind: "statBonus", stat: "critical", flat: 5,
    description: "Increases Critical chance by 5%.",
  },
  dodge_up_10: {
    id: "dodge_up_10", label: "Wind Step", icon: "🍃",
    kind: "statBonus", stat: "flee", multiplier: 1.1,
    description: "Increases FLEE by 10%.",
  },
  fire_resist_25: {
    id: "fire_resist_25", label: "Ember Ward", icon: "🧯",
    kind: "elementResist", element: "fire", reduction: 0.25,
    description: "Reduces incoming Fire damage by 25%.",
  },
  hp_regen_5: {
    id: "hp_regen_5", label: "Troll Blood", icon: "💗",
    kind: "hpRegen", percent: 5,
    description: "Recovers 5% max HP at the end of each turn.",
  },
  party_atk_aura_5: {
    id: "party_atk_aura_5", label: "War Banner", icon: "🚩",
    kind: "aura", stat: "atk", multiplier: 1.05,
    description: "Support aura: whole party gains 5% ATK.",
  },
  party_def_aura_5: {
    id: "party_def_aura_5", label: "Guardian Aura", icon: "🛡️",
    kind: "aura", stat: "def", multiplier: 1.05,
    description: "Support aura: whole party gains 5% DEF.",
  },
});

export class PassiveSkillSystem {
  /** @returns {object[]} resolved definitions for a list of passive ids. */
  static resolve(passiveIds = []) {
    return passiveIds
      .map((id) => PASSIVE_SKILL_DEFS[id])
      .filter((def) => def !== undefined);
  }

  /**
   * Applies passive stat bonuses to one derived stat.
   * @param {string} statKey    derived stat name (atk, matk, def, flee, critical, ...)
   * @param {number} value      base value
   * @param {string[]} ownIds   the combatant's own passives
   * @param {string[]} partyIds union of aura passives from all living allies
   */
  static modifyStat(statKey, value, ownIds = [], partyIds = []) {
    let result = value;
    for (const def of PassiveSkillSystem.resolve(ownIds)) {
      if (def.kind === "statBonus" && def.stat === statKey) {
        if (def.multiplier) result *= def.multiplier;
        if (def.flat) result += def.flat;
      }
    }
    for (const def of PassiveSkillSystem.resolve(partyIds)) {
      if (def.kind === "aura" && def.stat === statKey) {
        if (def.multiplier) result *= def.multiplier;
        if (def.flat) result += def.flat;
      }
    }
    return Math.floor(result);
  }

  /** Multiplier (≤1) for incoming damage of `element` given the defender's passives. */
  static incomingElementFactor(element, passiveIds = []) {
    let factor = 1;
    for (const def of PassiveSkillSystem.resolve(passiveIds)) {
      if (def.kind === "elementResist" && def.element === element) {
        factor *= 1 - def.reduction;
      }
    }
    return factor;
  }

  /** Total % max HP regenerated at end of turn from passives. */
  static regenPercent(passiveIds = []) {
    return PassiveSkillSystem.resolve(passiveIds)
      .filter((def) => def.kind === "hpRegen")
      .reduce((sum, def) => sum + def.percent, 0);
  }

  /** Aura passive ids contributed by a combatant to its party. */
  static auraIds(passiveIds = []) {
    return PassiveSkillSystem.resolve(passiveIds)
      .filter((def) => def.kind === "aura")
      .map((def) => def.id);
  }
}
