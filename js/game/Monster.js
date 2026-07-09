/**
 * Monster.js
 * -----------------------------------------------------------------------
 * Immutable monster species definition (the "card template"). Owned cards
 * (Card.js) reference a Monster by id and add level/exp/instance state.
 *
 * Fields:
 *   id, name, icon (emoji artwork), image (optional URL — Storage upload),
 *   element, race, rarity, description,
 *   baseStats {str,agi,vit,int,dex,luk} at level 1,
 *   growth {str,...} fixed per-level gains,
 *   growthMode "fixed" | "random",
 *   skills [{ id, unlockLevel }],
 *   passives [passiveId],
 *   evolution { to, level, materials { gold, duplicates } } | null
 */

import { RARITY_META } from "../core/Constants.js";

export class Monster {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.icon = data.icon;
    this.image = data.image ?? "";
    this.element = data.element;
    this.race = data.race;
    this.rarity = data.rarity;
    this.description = data.description ?? "";
    this.baseStats = { ...data.baseStats };
    this.growth = { ...data.growth };
    this.growthMode = data.growthMode ?? "fixed";
    this.skills = (data.skills ?? []).map((entry) => ({ ...entry }));
    this.passives = [...(data.passives ?? [])];
    this.evolution = data.evolution ? { ...data.evolution, materials: { ...data.evolution.materials } } : null;
    Object.freeze(this.baseStats);
    Object.freeze(this.growth);
    Object.freeze(this);
  }

  /** Base stats including the rarity flat bonus. */
  get effectiveBaseStats() {
    const bonus = RARITY_META[this.rarity]?.statBonus ?? 0;
    const stats = {};
    for (const [key, value] of Object.entries(this.baseStats)) {
      stats[key] = value + bonus;
    }
    return stats;
  }

  /** Skill ids unlocked at a given level. */
  skillIdsAtLevel(level) {
    return this.skills
      .filter((entry) => level >= entry.unlockLevel)
      .map((entry) => entry.id);
  }

  get canEvolve() {
    return this.evolution !== null;
  }

  /** Plain object for Firestore/JSON export. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      image: this.image,
      element: this.element,
      race: this.race,
      rarity: this.rarity,
      description: this.description,
      baseStats: { ...this.baseStats },
      growth: { ...this.growth },
      growthMode: this.growthMode,
      skills: this.skills.map((entry) => ({ ...entry })),
      passives: [...this.passives],
      evolution: this.evolution
        ? { ...this.evolution, materials: { ...this.evolution.materials } }
        : null,
    };
  }
}
