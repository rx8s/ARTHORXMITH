/**
 * Card.js
 * -----------------------------------------------------------------------
 * An OWNED card instance. References a Monster species by id and carries
 * mutable per-instance state (level, exp, grown stats, favorite flag).
 * Persisted in the top-level `cards` Firestore collection.
 */

import { Formula } from "./Formula.js";

export class Card {
  /**
   * @param {object} data Firestore document data (plus its `id`).
   */
  constructor(data) {
    this.id = data.id;
    this.ownerUid = data.ownerUid;
    this.monsterId = data.monsterId;
    this.level = data.level ?? 1;
    this.exp = data.exp ?? 0;
    this.stats = { ...data.stats };
    this.favorite = data.favorite ?? false;
    this.createdAt = data.createdAt ?? null;
  }

  /**
   * Builds the initial state for a freshly acquired card of a species.
   * Stats start at the species base (including rarity bonus).
   * @param {import("./Monster.js").Monster} monster
   * @param {string} ownerUid
   * @returns {object} plain object ready for Firestore `addDoc`
   */
  static newInstanceData(monster, ownerUid) {
    return {
      ownerUid,
      monsterId: monster.id,
      level: 1,
      exp: 0,
      stats: monster.effectiveBaseStats,
      favorite: false,
    };
  }

  /** Derived combat stats (ATK, HP, ...) for this instance. */
  get derived() {
    return Formula.derive(this.stats, this.level);
  }

  /** Skill ids this card has unlocked, given its species definition. */
  unlockedSkillIds(monster) {
    return monster.skillIdsAtLevel(this.level);
  }

  /** Mutable state slice consumed by LevelSystem.addExp. */
  get progressState() {
    return { level: this.level, exp: this.exp, stats: this.stats };
  }

  /** Writes a LevelSystem-mutated state slice back onto the card. */
  applyProgressState(state) {
    this.level = state.level;
    this.exp = state.exp;
    this.stats = state.stats;
  }

  /** Plain object for Firestore updates. */
  toJSON() {
    return {
      ownerUid: this.ownerUid,
      monsterId: this.monsterId,
      level: this.level,
      exp: this.exp,
      stats: { ...this.stats },
      favorite: this.favorite,
    };
  }
}
