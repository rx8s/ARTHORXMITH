/**
 * collection.js — the card album: filters (element/race/rarity), search,
 * sort, favorites, and a detail modal with stats, skills and evolution.
 */

import { App } from "../core/App.js";
import {
  ELEMENT_META,
  RACE_META,
  RARITY_META,
  RARITY_ORDER,
  ROUTES,
  STAT_META,
  STATS,
} from "../core/Constants.js";
import { Formula } from "../game/Formula.js";
import { LevelSystem } from "../game/LevelSystem.js";
import { EvolutionSystem } from "../game/EvolutionSystem.js";
import { PASSIVE_SKILL_DEFS } from "../game/PassiveSkills.js";
import { CardService } from "../services/CardService.js";
import { GameDataService } from "../services/GameDataService.js";
import { UserService } from "../services/UserService.js";
import { CardView } from "../../components/CardView.js";
import { Toast } from "../../components/Toast.js";
import { Sound } from "../utils/Sound.js";

const { user, profile } = await App.init({ activeRoute: ROUTES.COLLECTION });

let cards = await CardService.getCards(user.uid);

// --- filter controls ------------------------------------------------------
const controls = {
  search: document.getElementById("filter-search"),
  element: document.getElementById("filter-element"),
  race: document.getElementById("filter-race"),
  rarity: document.getElementById("filter-rarity"),
  sort: document.getElementById("filter-sort"),
  favorites: document.getElementById("filter-favorites"),
};

function fillSelect(select, entries) {
  select.innerHTML =
    `<option value="">All</option>` +
    entries.map(([id, meta]) => `<option value="${id}">${meta.icon} ${meta.label}</option>`).join("");
}
fillSelect(controls.element, Object.entries(ELEMENT_META));
fillSelect(controls.race, Object.entries(RACE_META));
controls.rarity.innerHTML =
  `<option value="">All</option>` +
  RARITY_ORDER.map((id) => `<option value="${id}">${RARITY_META[id].label}</option>`).join("");

const SORTERS = {
  level: (a, b) => b.card.level - a.card.level,
  rarity: (a, b) =>
    RARITY_ORDER.indexOf(b.monster.rarity) - RARITY_ORDER.indexOf(a.monster.rarity),
  name: (a, b) => a.monster.name.localeCompare(b.monster.name),
  newest: (a, b) => (b.card.createdAt?.seconds ?? 0) - (a.card.createdAt?.seconds ?? 0),
};

function render() {
  const grid = document.getElementById("album-grid");
  const term = controls.search.value.trim().toLowerCase();
  const rows = cards
    .map((card) => ({ card, monster: GameDataService.getMonster(card.monsterId) }))
    .filter(({ card, monster }) => {
      if (term && !monster.name.toLowerCase().includes(term)) return false;
      if (controls.element.value && monster.element !== controls.element.value) return false;
      if (controls.race.value && monster.race !== controls.race.value) return false;
      if (controls.rarity.value && monster.rarity !== controls.rarity.value) return false;
      if (controls.favorites.value === "favorites" && !card.favorite) return false;
      return true;
    })
    .sort(SORTERS[controls.sort.value] ?? SORTERS.level);

  document.getElementById("collection-count").textContent = `(${cards.length} cards)`;
  document.getElementById("album-empty").classList.toggle("hidden", rows.length > 0);
  grid.innerHTML = "";
  for (const { card, monster } of rows) {
    grid.appendChild(CardView.create(card, monster, { onClick: openModal, showExp: true }));
  }
}

for (const control of Object.values(controls)) {
  control.addEventListener("input", render);
}

// --- detail modal ---------------------------------------------------------
const modal = document.getElementById("card-modal");
const modalBody = document.getElementById("modal-body");
document.getElementById("modal-close").addEventListener("click", () => modal.close());

function openModal(card) {
  Sound.play("click");
  renderModal(card);
  modal.showModal();
}

function renderModal(card) {
  const monster = GameDataService.getMonster(card.monsterId);
  const element = ELEMENT_META[monster.element];
  const race = RACE_META[monster.race];
  const derived = Formula.derive(card.stats, card.level);
  const duplicates = cards.filter(
    (other) => other.monsterId === card.monsterId && other.id !== card.id,
  );

  const skillsHtml = monster.skills
    .map((entry) => {
      const skill = GameDataService.getSkill(entry.id);
      const unlocked = card.level >= entry.unlockLevel;
      return `<li style="opacity:${unlocked ? 1 : 0.45}">
        ${ELEMENT_META[skill.element].icon} <strong>${skill.name}</strong>
        <span class="muted">— ${skill.description}</span>
        ${unlocked ? "" : `<em class="muted">(unlocks Lv.${entry.unlockLevel})</em>`}
      </li>`;
    })
    .join("");

  const passivesHtml = monster.passives
    .map((id) => PASSIVE_SKILL_DEFS[id])
    .filter(Boolean)
    .map((def) => `<li>${def.icon} <strong>${def.label}</strong> <span class="muted">— ${def.description}</span></li>`)
    .join("");

  let evolutionHtml = `<p class="muted">This monster has no further evolution.</p>`;
  if (monster.canEvolve) {
    const target = GameDataService.getMonster(monster.evolution.to);
    const check = EvolutionSystem.check(card, monster, {
      gold: profile.gold ?? 0,
      duplicateCount: duplicates.length,
    });
    evolutionHtml = `
      <p>${monster.icon} → <strong>${target.icon} ${target.name}</strong>
        <span class="muted">(${RARITY_META[target.rarity].label})</span></p>
      <p class="muted" style="font-size:0.85rem">
        Requires Lv.${monster.evolution.level} · 🪙 ${check.cost.gold} ·
        ${check.cost.duplicates} duplicate(s) — consumed as material.
      </p>
      ${check.ok
        ? `<button class="btn btn-primary" id="evolve-btn" type="button">🧬 Evolve</button>`
        : `<ul class="muted" style="font-size:0.85rem">${check.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>`}
    `;
  }

  modalBody.innerHTML = `
    <div class="row">
      <span style="font-size:3rem">${monster.icon}</span>
      <div>
        <h2 style="margin:0">${monster.name} <span class="card-level">Lv.${card.level}</span></h2>
        <div class="card-tags">
          <span class="tag">${element.icon} ${element.label}</span>
          <span class="tag">${race.icon} ${race.label}</span>
          <span class="tag" style="color:${RARITY_META[monster.rarity].color}">${RARITY_META[monster.rarity].label}</span>
        </div>
      </div>
    </div>
    <p class="muted">${monster.description}</p>
    <div class="exp-bar"><div class="exp-fill" style="width:${Math.round(LevelSystem.progress(card.progressState) * 100)}%"></div></div>
    <p class="muted" style="font-size:0.8rem">EXP ${card.exp} / ${Formula.expToNext(card.level)}</p>

    <h3>Stats</h3>
    <div class="form-grid" style="font-size:0.9rem">
      ${STATS.map((stat) => `<div><span class="muted">${STAT_META[stat].label}</span> <strong>${card.stats[stat]}</strong></div>`).join("")}
    </div>
    <div class="form-grid" style="font-size:0.9rem;margin-top:10px">
      <div><span class="muted">HP</span> <strong>${derived.maxHp}</strong></div>
      <div><span class="muted">SP</span> <strong>${derived.maxSp}</strong></div>
      <div><span class="muted">ATK</span> <strong>${derived.atk}</strong></div>
      <div><span class="muted">MATK</span> <strong>${derived.minMatk}–${derived.maxMatk}</strong></div>
      <div><span class="muted">DEF</span> <strong>${derived.def}</strong></div>
      <div><span class="muted">MDEF</span> <strong>${derived.mdef}</strong></div>
      <div><span class="muted">HIT</span> <strong>${derived.hit}</strong></div>
      <div><span class="muted">FLEE</span> <strong>${derived.flee}</strong></div>
      <div><span class="muted">CRIT</span> <strong>${derived.critical}%</strong></div>
      <div><span class="muted">ASPD</span> <strong>${derived.aspd}</strong></div>
      <div><span class="muted">P.Dodge</span> <strong>${derived.perfectDodge}%</strong></div>
    </div>

    <h3 style="margin-top:16px">Skills</h3>
    <ul style="padding-left:18px">${skillsHtml}</ul>
    ${passivesHtml ? `<h3>Passives</h3><ul style="padding-left:18px">${passivesHtml}</ul>` : ""}

    <h3>Evolution</h3>
    ${evolutionHtml}

    <div class="row" style="margin-top:18px">
      <button class="btn" id="favorite-btn" type="button">${card.favorite ? "💔 Unfavorite" : "⭐ Favorite"}</button>
    </div>`;

  modalBody.querySelector("#favorite-btn").addEventListener("click", async () => {
    card.favorite = !card.favorite;
    await CardService.setFavorite(card.id, card.favorite);
    Sound.play("click");
    renderModal(card);
    render();
  });

  modalBody.querySelector("#evolve-btn")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      const check = EvolutionSystem.check(card, monster, {
        gold: profile.gold ?? 0,
        duplicateCount: duplicates.length,
      });
      if (!check.ok) throw new Error(check.reasons.join(" "));
      await CardService.evolve(card, duplicates, check.cost.duplicates);
      await UserService.spendGold(user.uid, check.cost.gold);
      profile.gold = (profile.gold ?? 0) - check.cost.gold;
      await CardService.syncCollectionCount(user.uid);
      cards = await CardService.getCards(user.uid);
      const evolved = cards.find((entry) => entry.id === card.id);
      Sound.play("victory");
      Toast.success(`Evolved into ${GameDataService.getMonster(evolved.monsterId).name}!`);
      App.refreshNav(profile, ROUTES.COLLECTION);
      renderModal(evolved);
      render();
    } catch (error) {
      Toast.error(`Evolution failed: ${error.message}`);
    }
  });
}

render();
