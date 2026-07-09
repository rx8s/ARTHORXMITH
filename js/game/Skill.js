/**
 * Skill.js
 * -----------------------------------------------------------------------
 * Active skill model. Instances are created from skills.json / Firestore
 * documents by GameDataService and shared read-only across the game.
 *
 * Fields:
 *   id, name, element, type (physical|magic|heal|buff), power (percent of
 *   ATK/MATK, or heal strength), spCost, accuracy, critBonus, cooldown,
 *   animation (CSS class suffix), description,
 *   statusEffect { id, chance, duration } (optional),
 *   drainPercent (optional — % of dealt damage healed back),
 *   target ("enemy" | "self")
 */

export class Skill {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.element = data.element;
    this.type = data.type;
    this.power = data.power;
    this.spCost = data.spCost;
    this.accuracy = data.accuracy;
    this.critBonus = data.critBonus ?? 0;
    this.cooldown = data.cooldown ?? 0;
    this.animation = data.animation ?? "slash";
    this.description = data.description ?? "";
    this.statusEffect = data.statusEffect ?? null;
    this.drainPercent = data.drainPercent ?? 0;
    this.target = data.target ?? (data.type === "heal" || data.type === "buff" ? "self" : "enemy");
    Object.freeze(this);
  }

  get isOffensive() {
    return this.type === "physical" || this.type === "magic";
  }

  get isHeal() {
    return this.type === "heal";
  }

  get isBuff() {
    return this.type === "buff";
  }

  /** Plain object for Firestore/JSON export. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      element: this.element,
      type: this.type,
      power: this.power,
      spCost: this.spCost,
      accuracy: this.accuracy,
      critBonus: this.critBonus,
      cooldown: this.cooldown,
      animation: this.animation,
      description: this.description,
      statusEffect: this.statusEffect,
      drainPercent: this.drainPercent,
      target: this.target,
    };
  }
}
