/**
 * EnemyAI.js
 * -----------------------------------------------------------------------
 * Enemy team generation and per-turn decision making.
 *
 * Decision strategies (chosen by difficulty preset):
 *   random   — uniform pick among affordable actions
 *   weighted — actions weighted by expected damage / usefulness
 *   smart    — weighted, plus hard preferences: finish off a dying foe,
 *              heal when hurt, exploit elemental weakness
 */

import { BATTLE, DIFFICULTY, LEVEL } from "../core/Constants.js";
import { ElementSystem } from "../game/ElementSystem.js";
import { Random } from "../utils/Random.js";
import { Combatant } from "./Combatant.js";
import { DamageCalculator } from "./DamageCalculator.js";

/** Tuning for the weighted strategies (relative weights, thresholds). */
const AI = Object.freeze({
  BASIC_ATTACK_WEIGHT: 30,
  DEFEND_WEIGHT: 8,
  DEFEND_HURT_WEIGHT: 20,
  SKILL_DAMAGE_WEIGHT_FACTOR: 1.2,
  HEAL_WEIGHT: 25,
  HEAL_URGENT_WEIGHT: 120,
  BUFF_WEIGHT: 14,
  WEAKNESS_BONUS_FACTOR: 2,
  HURT_THRESHOLD: 0.5,
  URGENT_THRESHOLD: 0.35,
  FINISHER_WEIGHT: 500,
});

export class EnemyAI {
  /**
   * @param {"easy"|"normal"|"hard"} difficultyId
   */
  constructor(difficultyId) {
    this.difficulty = DIFFICULTY[difficultyId] ?? DIFFICULTY.normal;
  }

  /**
   * Builds an enemy team matched to the player's deck.
   * @param {import("../game/Monster.js").Monster[]} pool all species
   * @param {number} averageLevel player deck average card level
   * @param {number} teamSize player deck size
   * @param {(monster, level: number) => import("../game/Skill.js").Skill[]} skillResolver
   * @returns {Combatant[]}
   */
  generateTeam(pool, averageLevel, teamSize, skillResolver) {
    const level = Math.max(
      LEVEL.MIN,
      Math.min(LEVEL.MAX, Math.round(averageLevel) + this.difficulty.levelOffset),
    );
    const picks = Random.shuffle(pool).slice(0, teamSize);
    return picks.map((monster) =>
      Combatant.fromSpecies(monster, level, skillResolver(monster, level)),
    );
  }

  /**
   * Chooses this turn's action for the active enemy.
   * @param {Combatant} self
   * @param {Combatant} opponent the player's active combatant
   * @returns {{type: "attack"|"skill"|"defend", skill?: import("../game/Skill.js").Skill}}
   */
  chooseAction(self, opponent) {
    const usable = self.usableSkills();
    if (this.difficulty.aiMode === "random") {
      const options = [
        { type: "attack" },
        { type: "defend" },
        ...usable.map((skill) => ({ type: "skill", skill })),
      ];
      return Random.pick(options);
    }
    return this.#weightedChoice(self, opponent, usable, this.difficulty.aiMode === "smart");
  }

  #weightedChoice(self, opponent, usable, smart) {
    const hpRatio = self.hp / self.maxHp;
    const items = [];

    const basicDamage = DamageCalculator.estimate(self, opponent, null);
    items.push({
      value: { type: "attack" },
      weight: AI.BASIC_ATTACK_WEIGHT + (smart && basicDamage >= opponent.hp ? AI.FINISHER_WEIGHT : 0),
    });

    items.push({
      value: { type: "defend" },
      weight: hpRatio < AI.HURT_THRESHOLD ? AI.DEFEND_HURT_WEIGHT : AI.DEFEND_WEIGHT,
    });

    for (const skill of usable) {
      let weight;
      if (skill.isHeal) {
        if (hpRatio >= 1) continue;
        weight = hpRatio < AI.URGENT_THRESHOLD ? AI.HEAL_URGENT_WEIGHT : AI.HEAL_WEIGHT;
      } else if (skill.isBuff) {
        if (self.statuses.has(skill.statusEffect?.id)) continue;
        weight = AI.BUFF_WEIGHT;
      } else {
        const damage = DamageCalculator.estimate(self, opponent, skill);
        weight = Math.max(1, Math.floor(damage * AI.SKILL_DAMAGE_WEIGHT_FACTOR));
        const strong =
          ElementSystem.effectiveness(skill.element, opponent.monster.element) === "strong";
        if (smart && strong) weight *= AI.WEAKNESS_BONUS_FACTOR;
        if (smart && damage >= opponent.hp) weight += AI.FINISHER_WEIGHT;
      }
      items.push({ value: { type: "skill", skill }, weight });
    }

    return Random.weighted(items);
  }
}
