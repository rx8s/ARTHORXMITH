/**
 * Combatant.js
 * -----------------------------------------------------------------------
 * Live battle wrapper around a card (player side) or a raw species+level
 * (enemy side): current HP/SP, active status effects, skill cooldowns and
 * a defend flag. All stat reads flow through `stat()` so passives, party
 * auras and status-effect modifiers are always applied consistently.
 */

import { Random } from "../utils/Random.js";
import { Formula } from "../game/Formula.js";
import { PassiveSkillSystem } from "../game/PassiveSkills.js";
import { StatusEffectManager, STATUS_EFFECT_DEFS } from "../game/StatusEffects.js";

export class Combatant {
  /**
   * @param {{name: string, monster: import("../game/Monster.js").Monster,
   *          level: number, stats: object,
   *          skills: import("../game/Skill.js").Skill[],
   *          side: "player"|"enemy", cardId?: string|null}} init
   */
  constructor({ name, monster, level, stats, skills, side, cardId = null }) {
    this.name = name;
    this.monster = monster;
    this.level = level;
    this.stats = { ...stats };
    this.skills = skills;
    this.side = side;
    this.cardId = cardId;

    this.statuses = new StatusEffectManager();
    /** @type {Map<string, number>} skillId → turns until usable again */
    this.cooldowns = new Map();
    this.defending = false;
    /** Aura passive ids contributed by living allies; set by the engine. */
    this.partyAuraIds = [];

    const derived = Formula.derive(this.stats, this.level);
    this.hp = derived.maxHp;
    this.sp = derived.maxSp;
  }

  /** Player-side combatant from an owned card. */
  static fromCard(card, monster, skills) {
    return new Combatant({
      name: monster.name,
      monster,
      level: card.level,
      stats: card.stats,
      skills,
      side: "player",
      cardId: card.id,
    });
  }

  /** Enemy-side combatant built from a species at a target level. */
  static fromSpecies(monster, level, skills) {
    const stats = {};
    for (const [stat, value] of Object.entries(monster.effectiveBaseStats)) {
      stats[stat] = Formula.clampStat(value + (monster.growth[stat] ?? 0) * (level - 1));
    }
    return new Combatant({ name: monster.name, monster, level, stats, skills, side: "enemy" });
  }

  /**
   * A derived stat with passives, party auras and status effects applied.
   * @param {"atk"|"matk"|"def"|"mdef"|"hit"|"flee"|"critical"|"perfectDodge"|"aspd"} key
   */
  stat(key) {
    const derived = Formula.derive(this.stats, this.level);
    const base = key === "matk" ? Random.int(derived.minMatk, derived.maxMatk) : derived[key];
    const withPassives = PassiveSkillSystem.modifyStat(
      key, base, this.monster.passives, this.partyAuraIds,
    );
    return this.statuses.modifyStat(key, withPassives);
  }

  get maxHp() {
    return Formula.maxHp(this.stats.vit, this.level);
  }

  get maxSp() {
    return Formula.maxSp(this.stats.int, this.level);
  }

  get isAlive() {
    return this.hp > 0;
  }

  /** Skills currently usable: affordable SP, off cooldown, not silenced. */
  usableSkills() {
    if (this.statuses.blocksSkills()) return [];
    return this.skills.filter(
      (skill) => skill.spCost <= this.sp && (this.cooldowns.get(skill.id) ?? 0) <= 0,
    );
  }

  /**
   * Applies damage; clears wake-on-hit effects (sleep).
   * @returns {{woke: string[]}} ids of effects removed by the hit
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    const woke = amount > 0 ? this.statuses.onDamaged() : [];
    if (!this.isAlive) this.statuses.clear();
    return { woke };
  }

  /** @returns {number} HP actually restored. */
  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, Math.floor(amount)));
    return this.hp - before;
  }

  spendSp(amount) {
    this.sp = Math.max(0, this.sp - amount);
  }

  /** @returns {number} SP actually restored. */
  gainSp(amount) {
    const before = this.sp;
    this.sp = Math.min(this.maxSp, this.sp + Math.max(0, Math.floor(amount)));
    return this.sp - before;
  }

  startCooldown(skill) {
    if (skill.cooldown > 0) this.cooldowns.set(skill.id, skill.cooldown + 1);
  }

  tickCooldowns() {
    for (const [skillId, remaining] of this.cooldowns) {
      if (remaining <= 1) this.cooldowns.delete(skillId);
      else this.cooldowns.set(skillId, remaining - 1);
    }
  }

  /** First active effect that blocks the whole turn, or null. */
  blockingEffect() {
    for (const entry of this.statuses.list()) {
      if (STATUS_EFFECT_DEFS[entry.id].blocksAction) return entry;
    }
    return null;
  }

  /** UI snapshot. */
  snapshot() {
    return {
      name: this.name,
      monster: this.monster,
      level: this.level,
      hp: this.hp,
      maxHp: this.maxHp,
      sp: this.sp,
      maxSp: this.maxSp,
      side: this.side,
      defending: this.defending,
      statuses: this.statuses.list(),
      isAlive: this.isAlive,
    };
  }
}
