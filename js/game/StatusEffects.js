/**
 * StatusEffects.js
 * -----------------------------------------------------------------------
 * Status effect definitions + per-combatant StatusEffectManager.
 *
 * Debuffs: poison, burn, freeze, blind, sleep, stun, curse, silence,
 *          confusion. Buffs (atk_up, def_up) reuse the same machinery.
 *
 * Stacking rules per effect:
 *   "refresh" — re-applying resets the duration (single instance)
 *   "stack"   — re-applying adds a stack up to maxStacks (damage scales)
 *   "ignore"  — re-applying while active does nothing
 */

import { Random } from "../utils/Random.js";

/**
 * dotPercent    — % of max HP lost at end of the victim's turn (per stack).
 * blocksAction  — victim skips its turn entirely.
 * blocksSkills  — victim may still basic-attack but not use skills.
 * wakeOnHit     — effect is removed when the victim takes damage.
 * selfHitChance — % chance the victim hits itself instead of acting.
 * statModifiers — multiplicative modifiers applied to derived stats.
 */
export const STATUS_EFFECT_DEFS = Object.freeze({
  poison: {
    id: "poison", label: "Poison", icon: "☠️", kind: "debuff",
    stacking: "stack", maxStacks: 3, defaultDuration: 3, dotPercent: 5,
  },
  burn: {
    id: "burn", label: "Burn", icon: "🔥", kind: "debuff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 2, dotPercent: 8,
    statModifiers: { atk: 0.9 },
  },
  freeze: {
    id: "freeze", label: "Freeze", icon: "🧊", kind: "debuff",
    stacking: "ignore", maxStacks: 1, defaultDuration: 1, blocksAction: true,
    statModifiers: { def: 0.75 },
  },
  blind: {
    id: "blind", label: "Blind", icon: "🌫️", kind: "debuff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 3,
    statModifiers: { hit: 0.5 },
  },
  sleep: {
    id: "sleep", label: "Sleep", icon: "💤", kind: "debuff",
    stacking: "ignore", maxStacks: 1, defaultDuration: 2,
    blocksAction: true, wakeOnHit: true,
  },
  stun: {
    id: "stun", label: "Stun", icon: "💫", kind: "debuff",
    stacking: "ignore", maxStacks: 1, defaultDuration: 1, blocksAction: true,
  },
  curse: {
    id: "curse", label: "Curse", icon: "🕯️", kind: "debuff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 3,
    statModifiers: { atk: 0.75, aspd: 0.75 },
  },
  silence: {
    id: "silence", label: "Silence", icon: "🤐", kind: "debuff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 2, blocksSkills: true,
  },
  confusion: {
    id: "confusion", label: "Confusion", icon: "😵", kind: "debuff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 2, selfHitChance: 40,
  },
  atk_up: {
    id: "atk_up", label: "ATK Up", icon: "⚔️", kind: "buff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 3,
    statModifiers: { atk: 1.3, matk: 1.3 },
  },
  def_up: {
    id: "def_up", label: "DEF Up", icon: "🛡️", kind: "buff",
    stacking: "refresh", maxStacks: 1, defaultDuration: 3,
    statModifiers: { def: 1.5, mdef: 1.5 },
  },
});

/** % of max HP dealt when a confused combatant hits itself. */
const CONFUSION_SELF_DAMAGE_PERCENT = 8;

export class StatusEffectManager {
  constructor() {
    /** @type {Map<string, {def: object, stacks: number, remaining: number}>} */
    this.active = new Map();
  }

  /**
   * Applies (or re-applies, following stacking rules) an effect.
   * @param {string} effectId key of STATUS_EFFECT_DEFS
   * @param {number} [duration] turns; defaults to the definition's duration
   * @returns {boolean} true if the state changed
   */
  apply(effectId, duration) {
    const def = STATUS_EFFECT_DEFS[effectId];
    if (!def) throw new Error(`Unknown status effect: ${effectId}`);
    const turns = duration ?? def.defaultDuration;
    const existing = this.active.get(effectId);

    if (!existing) {
      this.active.set(effectId, { def, stacks: 1, remaining: turns });
      return true;
    }
    if (def.stacking === "ignore") return false;
    if (def.stacking === "stack") {
      existing.stacks = Math.min(def.maxStacks, existing.stacks + 1);
    }
    existing.remaining = Math.max(existing.remaining, turns);
    return true;
  }

  remove(effectId) {
    return this.active.delete(effectId);
  }

  clear() {
    this.active.clear();
  }

  has(effectId) {
    return this.active.has(effectId);
  }

  /** Snapshot for UI rendering: [{id, label, icon, kind, stacks, remaining}]. */
  list() {
    return [...this.active.values()].map(({ def, stacks, remaining }) => ({
      id: def.id, label: def.label, icon: def.icon, kind: def.kind, stacks, remaining,
    }));
  }

  /** True if any active effect blocks the whole turn (freeze/sleep/stun). */
  blocksAction() {
    return [...this.active.values()].some(({ def }) => def.blocksAction);
  }

  /** True if skills specifically are blocked (silence). */
  blocksSkills() {
    return [...this.active.values()].some(({ def }) => def.blocksSkills);
  }

  /** Rolls confusion: returns true when the combatant hurts itself this turn. */
  rollsSelfHit() {
    for (const { def } of this.active.values()) {
      if (def.selfHitChance && Random.chance(def.selfHitChance)) return true;
    }
    return false;
  }

  /** % of max HP a confusion self-hit deals. */
  static get confusionSelfDamagePercent() {
    return CONFUSION_SELF_DAMAGE_PERCENT;
  }

  /** Applies every active stat modifier to a derived-stat value. */
  modifyStat(statKey, value) {
    let result = value;
    for (const { def } of this.active.values()) {
      const modifier = def.statModifiers?.[statKey];
      if (modifier !== undefined) result *= modifier;
    }
    return Math.floor(result);
  }

  /** Removes wake-on-hit effects (sleep). @returns {string[]} removed ids */
  onDamaged() {
    const removed = [];
    for (const [id, { def }] of this.active) {
      if (def.wakeOnHit) {
        this.active.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  /**
   * End-of-turn tick: applies damage-over-time and decrements durations.
   * @param {number} maxHp victim's max HP, for DoT percentages
   * @returns {{dotDamage: number, expired: string[]}}
   */
  tick(maxHp) {
    let dotDamage = 0;
    const expired = [];
    for (const [id, entry] of this.active) {
      if (entry.def.dotPercent) {
        dotDamage += Math.max(1, Math.floor((maxHp * entry.def.dotPercent * entry.stacks) / 100));
      }
      entry.remaining -= 1;
      if (entry.remaining <= 0) {
        this.active.delete(id);
        expired.push(id);
      }
    }
    return { dotDamage, expired };
  }
}
