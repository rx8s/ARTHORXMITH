/**
 * BattleEngine.js
 * -----------------------------------------------------------------------
 * Turn-based battle orchestrator. Pure game logic, zero DOM: every state
 * change is pushed as an event object so the battle page can render and
 * animate the fight one event at a time.
 *
 * Teams fight with one ACTIVE combatant per side; when it falls, the next
 * living card is sent out automatically. Each round both actives act in
 * ASPD order. Player actions: attack | skill | defend | item | pass.
 *
 * Event shapes (field `type`):
 *   round   { round }
 *   action  { side, name, kind, detail?, skillName?, element? }
 *   damage  { side, amount, crit, effectiveness, hp, maxHp, source }
 *   miss    { side, perfectDodge }
 *   heal    { side, amount, hp, maxHp, source }
 *   spGain  { side, amount, sp, maxSp }
 *   status  { side, effectId, label, icon, change: "applied"|"expired"|"removed" }
 *   ko      { side, name }
 *   switch  { side, index, name }
 *   end     { won, rounds }
 */

import { BATTLE } from "../core/Constants.js";
import { PassiveSkillSystem } from "../game/PassiveSkills.js";
import { StatusEffectManager, STATUS_EFFECT_DEFS } from "../game/StatusEffects.js";
import { Random } from "../utils/Random.js";
import { DamageCalculator } from "./DamageCalculator.js";
import { TurnManager } from "./TurnManager.js";

export class BattleEngine {
  /**
   * @param {{playerTeam: import("./Combatant.js").Combatant[],
   *          enemyTeam: import("./Combatant.js").Combatant[],
   *          ai: import("./EnemyAI.js").EnemyAI}} init
   */
  constructor({ playerTeam, enemyTeam, ai }) {
    this.playerTeam = playerTeam;
    this.enemyTeam = enemyTeam;
    this.ai = ai;
    this.turns = new TurnManager();
    this.playerIndex = 0;
    this.enemyIndex = 0;
    this.over = false;
    this.result = null;
    /** Player consumables for this battle, from the standard loadout. */
    this.items = Object.fromEntries(
      Object.values(BATTLE.ITEMS).map((item) => [item.id, { ...item }]),
    );
    this.events = [];
  }

  get playerActive() {
    return this.playerTeam[this.playerIndex];
  }

  get enemyActive() {
    return this.enemyTeam[this.enemyIndex];
  }

  #active(side) {
    return side === "player" ? this.playerActive : this.enemyActive;
  }

  #emit(event) {
    this.events.push(event);
  }

  /** Options the battle UI should offer right now. */
  availablePlayerActions() {
    const active = this.playerActive;
    return {
      skills: active.usableSkills(),
      allSkills: active.skills,
      cooldowns: new Map(active.cooldowns),
      items: Object.values(this.items).filter((item) => item.count > 0),
      blockedBySilence: active.statuses.blocksSkills(),
    };
  }

  /** Living team cards contribute their aura passives to the active card. */
  #refreshAuras() {
    for (const [team, active] of [
      [this.playerTeam, this.playerActive],
      [this.enemyTeam, this.enemyActive],
    ]) {
      const auras = team
        .filter((member) => member.isAlive)
        .flatMap((member) => PassiveSkillSystem.auraIds(member.monster.passives));
      active.partyAuraIds = [...new Set(auras)];
    }
  }

  /**
   * Plays one full round driven by the player's chosen action.
   * @param {{type: "attack"|"skill"|"defend"|"item"|"pass",
   *          skillId?: string, itemId?: string}} playerAction
   * @returns {object[]} ordered events to render
   */
  playRound(playerAction) {
    if (this.over) throw new Error("Battle is already over");
    this.events = [];
    this.#emit({ type: "round", round: this.turns.nextRound() });
    this.#refreshAuras();

    for (const actor of this.turns.order(this.playerActive, this.enemyActive)) {
      if (this.over || !actor.isAlive) continue;
      const opponent = actor.side === "player" ? this.enemyActive : this.playerActive;
      const action =
        actor.side === "player" ? playerAction : this.ai.chooseAction(actor, opponent);
      this.#performAction(actor, opponent, action);
    }

    if (!this.over) this.#endOfRound();
    return this.events;
  }

  #performAction(actor, opponent, action) {
    actor.defending = false;

    const blocking = actor.blockingEffect();
    if (blocking) {
      this.#emit({
        type: "action", side: actor.side, name: actor.name,
        kind: "blocked", detail: blocking.label,
      });
      return;
    }
    if (actor.statuses.rollsSelfHit()) {
      const selfDamage = Math.max(
        BATTLE.MIN_DAMAGE,
        Math.floor((actor.maxHp * StatusEffectManager.confusionSelfDamagePercent) / 100),
      );
      actor.takeDamage(selfDamage);
      this.#emit({ type: "action", side: actor.side, name: actor.name, kind: "selfHit" });
      this.#emitDamage(actor, selfDamage, { crit: false, effectiveness: "neutral", source: "confusion" });
      this.#checkKo(actor);
      return;
    }

    switch (action.type) {
      case "attack":
        this.#attack(actor, opponent, null);
        break;
      case "skill":
        this.#useSkill(actor, opponent, action);
        break;
      case "defend":
        actor.defending = true;
        this.#emit({ type: "action", side: actor.side, name: actor.name, kind: "defend" });
        break;
      case "item":
        this.#useItem(actor, action.itemId);
        break;
      case "pass": {
        const gained = actor.gainSp(Math.floor((actor.maxSp * BATTLE.PASS_SP_REGEN_PERCENT) / 100));
        this.#emit({ type: "action", side: actor.side, name: actor.name, kind: "pass" });
        this.#emit({ type: "spGain", side: actor.side, amount: gained, sp: actor.sp, maxSp: actor.maxSp });
        break;
      }
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  #useSkill(actor, opponent, action) {
    const skill = actor.usableSkills().find((entry) => entry.id === action.skillId);
    if (!skill) {
      // Not usable (SP/cooldown/silence) — treat as a pass so the turn is never lost silently.
      this.#performAction(actor, opponent, { type: "pass" });
      return;
    }
    actor.spendSp(skill.spCost);
    actor.startCooldown(skill);

    if (skill.isOffensive) {
      this.#attack(actor, opponent, skill);
      return;
    }
    this.#emit({
      type: "action", side: actor.side, name: actor.name,
      kind: "skill", skillName: skill.name, element: skill.element,
    });
    if (skill.isHeal) {
      const healed = actor.heal((actor.maxHp * skill.power) / 100);
      this.#emit({ type: "heal", side: actor.side, amount: healed, hp: actor.hp, maxHp: actor.maxHp, source: skill.name });
    }
    if (skill.statusEffect) {
      const target = skill.target === "self" ? actor : opponent;
      if (Random.chance(skill.statusEffect.chance)) {
        this.#applyStatus(target, skill.statusEffect);
      }
    }
  }

  #useItem(actor, itemId) {
    const item = this.items[itemId];
    if (!item || item.count <= 0) {
      this.#emit({ type: "action", side: actor.side, name: actor.name, kind: "pass" });
      return;
    }
    item.count -= 1;
    this.#emit({
      type: "action", side: actor.side, name: actor.name,
      kind: "item", detail: item.label,
    });
    if (item.target === "hp") {
      const healed = actor.heal((actor.maxHp * item.healPercent) / 100);
      this.#emit({ type: "heal", side: actor.side, amount: healed, hp: actor.hp, maxHp: actor.maxHp, source: item.label });
    } else {
      const gained = actor.gainSp((actor.maxSp * item.healPercent) / 100);
      this.#emit({ type: "spGain", side: actor.side, amount: gained, sp: actor.sp, maxSp: actor.maxSp });
    }
  }

  #attack(actor, defender, skill) {
    this.#emit({
      type: "action", side: actor.side, name: actor.name,
      kind: skill ? "skill" : "attack",
      skillName: skill?.name,
      element: DamageCalculator.attackElement(actor, skill),
      animation: skill?.animation ?? "slash",
    });

    const roll = DamageCalculator.roll(actor, defender, skill);
    if (!roll.hit) {
      this.#emit({ type: "miss", side: defender.side, perfectDodge: roll.perfectDodge });
      return;
    }
    roll.damage = Math.floor(roll.damage * this.#suddenDeathFactor());

    const { woke } = defender.takeDamage(roll.damage);
    this.#emitDamage(defender, roll.damage, {
      crit: roll.crit, effectiveness: roll.effectiveness, source: skill?.name ?? "attack",
    });
    for (const effectId of woke) this.#emitStatus(defender, effectId, "removed");

    if (skill?.drainPercent) {
      const healed = actor.heal((roll.damage * skill.drainPercent) / 100);
      if (healed > 0) {
        this.#emit({ type: "heal", side: actor.side, amount: healed, hp: actor.hp, maxHp: actor.maxHp, source: skill.name });
      }
    }
    if (skill?.statusEffect && skill.target !== "self" && defender.isAlive) {
      if (Random.chance(skill.statusEffect.chance)) {
        this.#applyStatus(defender, skill.statusEffect);
      }
    }
    this.#checkKo(defender);
  }

  /** ≥1; grows once the fight drags past SUDDEN_DEATH_ROUND so healing
   *  stalls always converge. Immune hits (0 damage) stay 0. */
  #suddenDeathFactor() {
    const overtime = this.turns.round - BATTLE.SUDDEN_DEATH_ROUND;
    return overtime <= 0 ? 1 : 1 + BATTLE.SUDDEN_DEATH_RAMP_PER_ROUND * overtime;
  }

  #applyStatus(target, statusEffect) {
    if (!target.isAlive) return;
    const changed = target.statuses.apply(statusEffect.id, statusEffect.duration);
    if (changed) this.#emitStatus(target, statusEffect.id, "applied");
  }

  #emitStatus(target, effectId, change) {
    const def = STATUS_EFFECT_DEFS[effectId];
    this.#emit({
      type: "status", side: target.side, effectId,
      label: def.label, icon: def.icon, change,
    });
  }

  #emitDamage(victim, amount, { crit, effectiveness, source }) {
    this.#emit({
      type: "damage", side: victim.side, amount, crit, effectiveness,
      hp: victim.hp, maxHp: victim.maxHp, source,
    });
  }

  #checkKo(combatant) {
    if (combatant.isAlive || this.over) return;
    this.#emit({ type: "ko", side: combatant.side, name: combatant.name });

    const team = combatant.side === "player" ? this.playerTeam : this.enemyTeam;
    const nextIndex = team.findIndex((member) => member.isAlive);
    if (nextIndex === -1) {
      this.#finish(combatant.side === "enemy");
      return;
    }
    if (combatant.side === "player") this.playerIndex = nextIndex;
    else this.enemyIndex = nextIndex;
    const next = this.#active(combatant.side);
    this.#emit({ type: "switch", side: combatant.side, index: nextIndex, name: next.name });
    this.#refreshAuras();
  }

  #endOfRound() {
    for (const side of ["player", "enemy"]) {
      const active = this.#active(side);
      if (!active.isAlive || this.over) continue;

      const { dotDamage, expired } = active.statuses.tick(active.maxHp);
      if (dotDamage > 0) {
        active.takeDamage(dotDamage);
        this.#emitDamage(active, dotDamage, { crit: false, effectiveness: "neutral", source: "status" });
      }
      for (const effectId of expired) this.#emitStatus(active, effectId, "expired");
      this.#checkKo(active);
      if (!active.isAlive || this.over) continue;

      const regenPercent = PassiveSkillSystem.regenPercent(active.monster.passives);
      if (regenPercent > 0 && active.hp < active.maxHp) {
        const healed = active.heal((active.maxHp * regenPercent) / 100);
        this.#emit({ type: "heal", side, amount: healed, hp: active.hp, maxHp: active.maxHp, source: "passive" });
      }
      active.gainSp(BATTLE.SP_REGEN_PER_TURN);
      active.tickCooldowns();
    }

    if (!this.over && this.turns.limitReached) {
      // Round cap: side with the higher share of surviving HP wins; ties lose.
      const ratio = (team) =>
        team.reduce((sum, member) => sum + member.hp / member.maxHp, 0);
      this.#finish(ratio(this.playerTeam) > ratio(this.enemyTeam));
    }
  }

  #finish(won) {
    this.over = true;
    this.result = { won, rounds: this.turns.round };
    this.#emit({ type: "end", won, rounds: this.turns.round });
  }
}
