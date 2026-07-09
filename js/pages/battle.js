/**
 * battle.js — the battle screen. Builds both teams, drives the
 * BattleEngine one player action at a time, renders every engine event
 * with CSS animations and synthesised sound, then persists rewards.
 */

import { App } from "../core/App.js";
import {
  DIFFICULTY,
  ELEMENT_META,
  RARITY_META,
  REWARDS,
  ROUTES,
} from "../core/Constants.js";
import { LevelSystem } from "../game/LevelSystem.js";
import { Combatant } from "../battle/Combatant.js";
import { BattleEngine } from "../battle/BattleEngine.js";
import { EnemyAI } from "../battle/EnemyAI.js";
import { AnimationManager } from "../battle/AnimationManager.js";
import { CardService } from "../services/CardService.js";
import { DeckService } from "../services/DeckService.js";
import { GameDataService } from "../services/GameDataService.js";
import { UserService } from "../services/UserService.js";
import { BattleService } from "../services/BattleService.js";
import { Toast } from "../../components/Toast.js";
import { Random } from "../utils/Random.js";
import { Sound } from "../utils/Sound.js";

const EVENT_PACING_MS = 420;

const { user, profile } = await App.init({ activeRoute: ROUTES.BATTLE });

// --- setup ----------------------------------------------------------------
const difficultyId = new URLSearchParams(window.location.search).get("difficulty");
const difficulty = DIFFICULTY[difficultyId] ?? DIFFICULTY.normal;

const [cards, deck] = await Promise.all([
  CardService.getCards(user.uid),
  DeckService.getDeck(user.uid),
]);
deck.prune(cards.map((card) => card.id));
const cardById = new Map(cards.map((card) => [card.id, card]));
const deckCards = deck.cardIds.map((id) => cardById.get(id)).filter(Boolean);

if (deckCards.length === 0) {
  Toast.error("Your deck is empty — build it first.");
  setTimeout(() => window.location.replace(ROUTES.DECK), 1200);
  throw new Error("Empty deck");
}

const resolveSkills = (monster, level) =>
  monster.skillIdsAtLevel(level).map((id) => GameDataService.getSkill(id));

const playerTeam = deckCards.map((card) => {
  const monster = GameDataService.getMonster(card.monsterId);
  return Combatant.fromCard(card, monster, resolveSkills(monster, card.level));
});

const averageLevel =
  deckCards.reduce((sum, card) => sum + card.level, 0) / deckCards.length;
const ai = new EnemyAI(difficulty.id);
const enemyTeam = ai.generateTeam(
  GameDataService.allMonsters(),
  averageLevel,
  deckCards.length,
  resolveSkills,
);

const engine = new BattleEngine({ playerTeam, enemyTeam, ai });

// --- DOM references ---------------------------------------------------------
const el = {
  turn: document.getElementById("turn-indicator"),
  log: document.getElementById("battle-log"),
  actionBar: document.getElementById("action-bar"),
  skillList: document.getElementById("skill-list"),
  itemList: document.getElementById("item-list"),
  side: (side) => ({
    slot: document.getElementById(`slot-${side}`),
    sprite: document.getElementById(`sprite-${side}`),
    name: document.getElementById(`name-${side}`),
    level: document.getElementById(`level-${side}`),
    hpBar: document.getElementById(`hpbar-${side}`),
    hpFill: document.querySelector(`#hpbar-${side} .bar-fill`),
    hpLabel: document.getElementById(`hplabel-${side}`),
    spFill: document.getElementById(`spfill-${side}`),
    spLabel: document.getElementById(`splabel-${side}`),
    statuses: document.getElementById(`status-${side}`),
    dots: document.getElementById(`dots-${side}`),
  }),
};

function activeOf(side) {
  return side === "player" ? engine.playerActive : engine.enemyActive;
}

function teamOf(side) {
  return side === "player" ? engine.playerTeam : engine.enemyTeam;
}

function spriteHtml(monster) {
  return monster.image
    ? `<img src="${monster.image}" alt="${monster.name}">`
    : monster.icon;
}

function renderSide(side) {
  const combatant = activeOf(side);
  const dom = el.side(side);
  dom.sprite.innerHTML = spriteHtml(combatant.monster);
  dom.name.textContent = `${ELEMENT_META[combatant.monster.element].icon} ${combatant.name}`;
  dom.level.textContent = `Lv.${combatant.level}`;
  const hpPercent = Math.round((combatant.hp / combatant.maxHp) * 100);
  dom.hpFill.style.width = `${hpPercent}%`;
  dom.hpBar.classList.toggle("low", hpPercent <= 30);
  dom.hpLabel.textContent = `${combatant.hp} / ${combatant.maxHp}`;
  dom.spFill.style.width = `${Math.round((combatant.sp / combatant.maxSp) * 100)}%`;
  dom.spLabel.textContent = `SP ${combatant.sp} / ${combatant.maxSp}`;
  dom.statuses.innerHTML = combatant.statuses
    .list()
    .map(
      (status) =>
        `<span class="status-chip ${status.kind}" title="${status.label}">${status.icon} ${status.remaining}${status.stacks > 1 ? ` ×${status.stacks}` : ""}</span>`,
    )
    .join("");
  const activeIndex = teamOf(side).indexOf(combatant);
  dom.dots.innerHTML = teamOf(side)
    .map(
      (member, index) =>
        `<span class="team-dot ${member.isAlive ? "" : "dead"} ${index === activeIndex ? "active" : ""}"></span>`,
    )
    .join("");
}

function renderAll() {
  renderSide("player");
  renderSide("enemy");
}

function addLog(message, cssClass = "") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${cssClass}`;
  entry.textContent = message;
  el.log.prepend(entry);
}

// --- event playback ---------------------------------------------------------
async function playEvent(event) {
  const dom = event.side ? el.side(event.side) : null;
  switch (event.type) {
    case "round":
      el.turn.textContent = `ROUND ${event.round}`;
      addLog(`— Round ${event.round} —`);
      break;
    case "action": {
      const who = event.side === "player" ? "Your" : "Enemy";
      if (event.kind === "attack" || event.kind === "skill") {
        addLog(
          `${who} ${event.name} uses ${event.skillName ?? "Attack"}!`,
          event.side,
        );
        const magicLike = ["burst", "glow", "heal", "buff"].includes(event.animation);
        await AnimationManager.play(
          dom.sprite,
          magicLike ? "anim-cast" : `anim-attack-${event.side}`,
        );
      } else if (event.kind === "defend") {
        addLog(`${who} ${event.name} braces for impact.`, event.side);
        await AnimationManager.play(dom.sprite, "anim-status");
      } else if (event.kind === "item") {
        addLog(`${who} ${event.name} uses a ${event.detail}.`, event.side);
      } else if (event.kind === "pass") {
        addLog(`${who} ${event.name} waits and recovers SP.`, event.side);
      } else if (event.kind === "blocked") {
        addLog(`${who} ${event.name} can't move (${event.detail})!`, "important");
        await AnimationManager.play(dom.sprite, "anim-status");
      } else if (event.kind === "selfHit") {
        addLog(`${who} ${event.name} hurts itself in confusion!`, "important");
      }
      break;
    }
    case "damage": {
      const crit = event.crit;
      AnimationManager.floatNumber(dom.slot, `-${event.amount}`, crit ? "crit" : "damage");
      Sound.play(crit ? "critical" : "attack");
      await AnimationManager.play(dom.sprite, crit ? "anim-crit" : "anim-shake");
      if (crit) addLog(`Critical hit! ${event.amount} damage.`, "important");
      else addLog(`${event.amount} damage${event.source === "status" ? " from status effects" : ""}.`);
      if (event.effectiveness === "strong") addLog("It's super effective!", "important");
      if (event.effectiveness === "weak") addLog("It's not very effective…");
      if (event.effectiveness === "immune") addLog("It had no effect!", "important");
      renderAll();
      break;
    }
    case "miss":
      AnimationManager.floatNumber(dom.slot, event.perfectDodge ? "DODGE" : "MISS", "miss");
      Sound.play("miss");
      addLog(event.perfectDodge ? "Perfect dodge!" : "The attack missed!");
      break;
    case "heal":
      AnimationManager.floatNumber(dom.slot, `+${event.amount}`, "heal");
      Sound.play("heal");
      await AnimationManager.play(dom.sprite, "anim-heal");
      addLog(`Recovered ${event.amount} HP (${event.source}).`, event.side);
      renderAll();
      break;
    case "spGain":
      renderAll();
      break;
    case "status":
      if (event.change === "applied") {
        AnimationManager.floatNumber(dom.slot, `${event.icon} ${event.label}`, "status");
        Sound.play("status");
        await AnimationManager.play(dom.sprite, "anim-status");
        addLog(`${event.label} was inflicted!`, "important");
      } else {
        addLog(`${event.label} wore off.`);
      }
      renderAll();
      break;
    case "ko":
      Sound.play("ko");
      await AnimationManager.play(dom.sprite, "anim-ko");
      addLog(`${event.name} was knocked out!`, "important");
      break;
    case "switch":
      renderAll();
      await AnimationManager.play(dom.sprite, "anim-enter");
      addLog(`${event.side === "player" ? "Go" : "Enemy sends out"}, ${event.name}!`, "important");
      break;
    case "end":
      break;
    default:
      break;
  }
  await AnimationManager.delay(EVENT_PACING_MS);
}

// --- player input -----------------------------------------------------------
let inputLocked = false;

function setInputLocked(locked) {
  inputLocked = locked;
  el.actionBar.querySelectorAll("button").forEach((button) => {
    button.disabled = locked;
  });
  if (locked) {
    el.skillList.classList.add("hidden");
    el.itemList.classList.add("hidden");
  }
}

function renderSkillList() {
  const { allSkills, cooldowns, blockedBySilence } = engine.availablePlayerActions();
  const active = engine.playerActive;
  el.skillList.innerHTML = "";
  if (allSkills.length === 0) {
    el.skillList.innerHTML = `<p class="muted">No skills learned yet.</p>`;
  }
  for (const skill of allSkills) {
    const cooldown = cooldowns.get(skill.id) ?? 0;
    const affordable = skill.spCost <= active.sp;
    const usable = affordable && cooldown <= 0 && !blockedBySilence;
    const button = document.createElement("button");
    button.className = "skill-option";
    button.type = "button";
    button.disabled = !usable;
    const blockReason = blockedBySilence
      ? "Silenced!"
      : cooldown > 0
        ? `Cooldown ${cooldown - 1 > 0 ? cooldown - 1 : 1} turn(s)`
        : !affordable
          ? "Not enough SP"
          : `${skill.description}`;
    button.innerHTML = `
      <span>${ELEMENT_META[skill.element].icon} <strong>${skill.name}</strong>
        <span class="meta">${blockReason}</span></span>
      <span class="meta">SP ${skill.spCost}${skill.cooldown ? ` · CD ${skill.cooldown}` : ""}</span>`;
    button.addEventListener("click", () => submitAction({ type: "skill", skillId: skill.id }));
    el.skillList.appendChild(button);
  }
}

function renderItemList() {
  const { items } = engine.availablePlayerActions();
  el.itemList.innerHTML = "";
  if (items.length === 0) {
    el.itemList.innerHTML = `<p class="muted">No items left.</p>`;
  }
  for (const item of items) {
    const button = document.createElement("button");
    button.className = "skill-option";
    button.type = "button";
    button.innerHTML = `
      <span>${item.icon} <strong>${item.label}</strong>
        <span class="meta">Restores ${item.healPercent}% ${item.target.toUpperCase()}</span></span>
      <span class="meta">×${item.count}</span>`;
    button.addEventListener("click", () => submitAction({ type: "item", itemId: item.id }));
    el.itemList.appendChild(button);
  }
}

el.actionBar.addEventListener("click", (event) => {
  const button = event.target.closest(".action-btn");
  if (!button || inputLocked) return;
  Sound.play("click");
  const action = button.dataset.action;
  if (action === "skill") {
    el.itemList.classList.add("hidden");
    el.skillList.classList.toggle("hidden");
    if (!el.skillList.classList.contains("hidden")) renderSkillList();
    return;
  }
  if (action === "item") {
    el.skillList.classList.add("hidden");
    el.itemList.classList.toggle("hidden");
    if (!el.itemList.classList.contains("hidden")) renderItemList();
    return;
  }
  submitAction({ type: action });
});

async function submitAction(action) {
  if (inputLocked || engine.over) return;
  setInputLocked(true);
  const events = engine.playRound(action);
  for (const event of events) {
    await playEvent(event);
  }
  if (engine.over) {
    await finishBattle();
  } else {
    setInputLocked(false);
  }
}

// --- rewards & persistence ----------------------------------------------------
function computeRewards(won, enemyLevel) {
  const factor = difficulty.rewardFactor;
  if (!won) {
    return {
      gold: REWARDS.LOSS_GOLD,
      exp: REWARDS.LOSS_PLAYER_EXP,
      cardExp: REWARDS.LOSS_CARD_EXP,
      cardDrop: null,
    };
  }
  return {
    gold: Math.floor((REWARDS.BASE_GOLD + REWARDS.GOLD_PER_ENEMY_LEVEL * enemyLevel) * factor),
    exp: Math.floor((REWARDS.BASE_PLAYER_EXP + REWARDS.PLAYER_EXP_PER_ENEMY_LEVEL * enemyLevel) * factor),
    cardExp: Math.floor((REWARDS.BASE_CARD_EXP + REWARDS.CARD_EXP_PER_ENEMY_LEVEL * enemyLevel) * factor),
    cardDrop:
      Random.float() < REWARDS.CARD_DROP_CHANCE
        ? Random.weighted(
            GameDataService.allMonsters().map((monster) => ({
              value: monster.id,
              weight: RARITY_META[monster.rarity].dropWeight,
            })),
          )
        : null,
  };
}

async function finishBattle() {
  const { won, rounds } = engine.result;
  Sound.play(won ? "victory" : "defeat");
  const enemyLevel = enemyTeam[0].level;
  const rewards = computeRewards(won, enemyLevel);

  // Card EXP + level ups for every deck card.
  const levelUps = [];
  for (const card of deckCards) {
    const monster = GameDataService.getMonster(card.monsterId);
    const state = card.progressState;
    const { levelsGained } = LevelSystem.addExp(state, monster, rewards.cardExp);
    card.applyProgressState(state);
    if (levelsGained > 0) levelUps.push(`${monster.name} → Lv.${card.level}`);
  }

  let persistError = null;
  try {
    await Promise.all(deckCards.map((card) => CardService.saveProgress(card)));
    const account = await UserService.applyBattleResult(user.uid, profile, {
      gold: rewards.gold,
      exp: rewards.exp,
      won,
    });
    if (account.levelsGained > 0) levelUps.push(`Account → Lv.${account.level}`);
    let dropName = null;
    if (rewards.cardDrop) {
      await CardService.grantCard(user.uid, rewards.cardDrop);
      await CardService.syncCollectionCount(user.uid);
      dropName = GameDataService.getMonster(rewards.cardDrop).name;
    }
    await BattleService.saveBattleLog(user.uid, {
      won,
      difficulty: difficulty.id,
      rounds,
      playerTeam: playerTeam.map((combatant) => combatant.monster.id),
      enemyTeam: enemyTeam.map((combatant) => combatant.monster.id),
      rewards: { gold: rewards.gold, exp: rewards.exp, cardDrop: dropName },
    });
    rewards.cardDropName = dropName;
  } catch (error) {
    persistError = error;
  }

  showResult(won, rounds, rewards, levelUps, persistError);
}

function showResult(won, rounds, rewards, levelUps, persistError) {
  const overlay = document.createElement("div");
  overlay.className = "result-overlay";
  overlay.innerHTML = `
    <div class="panel result-panel">
      <div class="result-title ${won ? "win" : "lose"}">${won ? "VICTORY!" : "DEFEAT"}</div>
      <p class="muted">${won ? "The enemy team was routed" : "Your team fought bravely"} in ${rounds} round(s).</p>
      <div class="result-rewards">
        <div class="stat-tile"><div class="value">🪙 ${rewards.gold}</div><div class="label">Gold</div></div>
        <div class="stat-tile"><div class="value">✨ ${rewards.exp}</div><div class="label">Account EXP</div></div>
        <div class="stat-tile"><div class="value">📈 ${rewards.cardExp}</div><div class="label">EXP per card</div></div>
        ${rewards.cardDropName ? `<div class="stat-tile"><div class="value">🃏 ${rewards.cardDropName}</div><div class="label">New card!</div></div>` : ""}
      </div>
      ${levelUps.length ? `<p style="color:var(--success)">Level up! ${levelUps.join(" · ")}</p>` : ""}
      ${persistError ? `<p style="color:var(--danger)">Warning: saving results failed (${persistError.message}).</p>` : ""}
      <div class="row" style="justify-content:center">
        <button class="btn btn-primary" id="result-again" type="button">⚔️ Fight Again</button>
        <a class="btn" href="${ROUTES.GAME}">🏰 Home</a>
      </div>
    </div>`;
  overlay.querySelector("#result-again").addEventListener("click", () => {
    window.location.href = `${ROUTES.BATTLE}?difficulty=${difficulty.id}`;
  });
  document.body.appendChild(overlay);
}

// --- kick off ---------------------------------------------------------------
renderAll();
addLog(`A ${difficulty.label} battle begins! (${difficulty.icon})`, "important");
await AnimationManager.play(el.side("player").sprite, "anim-enter");
await AnimationManager.play(el.side("enemy").sprite, "anim-enter");
setInputLocked(false);
