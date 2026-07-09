/**
 * DamageCalculator.js
 * -----------------------------------------------------------------------
 * All to-hit and damage math, shared by the BattleEngine (real rolls) and
 * the EnemyAI (expected-value estimates).
 *
 * Damage pipeline (per spec):
 *   raw            = ATK|MATK × power%          (skill power, or 100 basic)
 *   normal hit     = raw − DEF|MDEF
 *   critical hit   = raw × CRIT_MULTIPLIER      (ignores DEF entirely)
 *   then           × ElementMultiplier × RaceMultiplier
 *   then           × defender passives (element resist) and defend stance
 *   floor, minimum 1 (unless element-immune → 0)
 */

import { BATTLE } from "../core/Constants.js";
import { ElementSystem } from "../game/ElementSystem.js";
import { RaceSystem } from "../game/RaceSystem.js";
import { PassiveSkillSystem } from "../game/PassiveSkills.js";
import { Random } from "../utils/Random.js";

export class DamageCalculator {
  /** Attack element: the skill's, or the attacker's own element for basics. */
  static attackElement(attacker, skill) {
    return skill?.element ?? attacker.monster.element;
  }

  /** Chance (0–100) for the attack to connect, before perfect dodge. */
  static hitChance(attacker, defender, skill) {
    const accuracy = skill?.accuracy ?? BATTLE.BASIC_ATTACK_ACCURACY;
    const chance = accuracy + attacker.stat("hit") - defender.stat("flee");
    return Math.max(BATTLE.MIN_ACCURACY, Math.min(BATTLE.MAX_ACCURACY, chance));
  }

  /** Critical chance (0–100) for this attack. */
  static critChance(attacker, skill) {
    return Math.min(BATTLE.MAX_ACCURACY, attacker.stat("critical") + (skill?.critBonus ?? 0));
  }

  static #computeDamage(attacker, defender, skill, crit) {
    const isMagic = skill?.type === "magic";
    const power = skill?.power ?? BATTLE.BASIC_ATTACK_POWER;
    const offense = attacker.stat(isMagic ? "matk" : "atk");
    const raw = Math.floor((offense * power) / 100);

    let damage = crit
      ? raw * BATTLE.CRIT_MULTIPLIER
      : raw - defender.stat(isMagic ? "mdef" : "def");

    const element = DamageCalculator.attackElement(attacker, skill);
    const elementMultiplier = ElementSystem.getMultiplier(element, defender.monster.element);
    damage *= elementMultiplier;
    damage = RaceSystem.applyRace(damage, attacker.monster.race, defender.monster.race);
    damage *= PassiveSkillSystem.incomingElementFactor(element, defender.monster.passives);
    if (defender.defending) damage *= BATTLE.DEFEND_DAMAGE_FACTOR;

    if (elementMultiplier === 0) return { damage: 0, elementMultiplier };
    return { damage: Math.max(BATTLE.MIN_DAMAGE, Math.floor(damage)), elementMultiplier };
  }

  /**
   * Full attack roll: perfect dodge → hit → crit → damage.
   * @param {import("./Combatant.js").Combatant} attacker
   * @param {import("./Combatant.js").Combatant} defender
   * @param {import("../game/Skill.js").Skill|null} skill null = basic attack
   * @returns {{hit: boolean, perfectDodge: boolean, crit: boolean,
   *            damage: number, effectiveness: string}}
   */
  static roll(attacker, defender, skill) {
    const element = DamageCalculator.attackElement(attacker, skill);
    const effectiveness = ElementSystem.effectiveness(element, defender.monster.element);

    if (Random.chance(defender.stat("perfectDodge"))) {
      return { hit: false, perfectDodge: true, crit: false, damage: 0, effectiveness };
    }
    if (!Random.chance(DamageCalculator.hitChance(attacker, defender, skill))) {
      return { hit: false, perfectDodge: false, crit: false, damage: 0, effectiveness };
    }
    const crit = Random.chance(DamageCalculator.critChance(attacker, skill));
    const { damage } = DamageCalculator.#computeDamage(attacker, defender, skill, crit);
    return { hit: true, perfectDodge: false, crit, damage, effectiveness };
  }

  /** Deterministic expected damage (no crit, average MATK) for AI planning. */
  static estimate(attacker, defender, skill) {
    const { damage } = DamageCalculator.#computeDamage(attacker, defender, skill, false);
    const hitChance = DamageCalculator.hitChance(attacker, defender, skill);
    return Math.floor((damage * hitChance) / 100);
  }
}
