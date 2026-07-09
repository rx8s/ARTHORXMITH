/**
 * CardView.js
 * -----------------------------------------------------------------------
 * Renders a monster card as a DOM element — the single card renderer used
 * by the collection, deck, game hub and battle-result screens so every
 * card in the game looks identical.
 */

import { ELEMENT_META, RACE_META, RARITY_META } from "../js/core/Constants.js";
import { Formula } from "../js/game/Formula.js";
import { LevelSystem } from "../js/game/LevelSystem.js";

export class CardView {
  /**
   * Artwork markup: uploaded image when the monster has one, otherwise its
   * emoji icon rendered large.
   */
  static artHtml(monster) {
    if (monster.image) {
      return `<img class="card-art-img" src="${monster.image}" alt="${monster.name}" loading="lazy">`;
    }
    return `<span class="card-art-icon">${monster.icon}</span>`;
  }

  /**
   * @param {import("../js/game/Card.js").Card} card owned instance
   * @param {import("../js/game/Monster.js").Monster} monster its species
   * @param {{onClick?: (card) => void, selected?: boolean, badge?: string,
   *          showExp?: boolean}} [options]
   * @returns {HTMLElement}
   */
  static create(card, monster, { onClick, selected = false, badge = "", showExp = false } = {}) {
    const element = ELEMENT_META[monster.element];
    const race = RACE_META[monster.race];
    const rarity = RARITY_META[monster.rarity];
    const derived = Formula.derive(card.stats, card.level);

    const view = document.createElement("article");
    view.className = `game-card rarity-${monster.rarity}${selected ? " selected" : ""}`;
    view.dataset.cardId = card.id ?? "";
    view.innerHTML = `
      ${badge ? `<span class="card-badge">${badge}</span>` : ""}
      ${card.favorite ? `<span class="card-fav">⭐</span>` : ""}
      <div class="card-art" style="--element-color:${element.color}">${CardView.artHtml(monster)}</div>
      <div class="card-body">
        <div class="card-title">
          <span class="card-name">${monster.name}</span>
          <span class="card-level">Lv.${card.level}</span>
        </div>
        <div class="card-tags">
          <span class="tag" title="Element">${element.icon} ${element.label}</span>
          <span class="tag" title="Race">${race.icon} ${race.label}</span>
        </div>
        <div class="card-stats">
          <span title="HP">❤️ ${derived.maxHp}</span>
          <span title="ATK">⚔️ ${derived.atk}</span>
          <span title="DEF">🛡️ ${derived.def}</span>
        </div>
        ${
          showExp
            ? `<div class="exp-bar" title="EXP"><div class="exp-fill" style="width:${Math.round(LevelSystem.progress(card.progressState) * 100)}%"></div></div>`
            : ""
        }
        <div class="card-rarity" style="color:${rarity.color}">${rarity.label}</div>
      </div>`;

    if (onClick) {
      view.classList.add("clickable");
      view.addEventListener("click", () => onClick(card));
    }
    return view;
  }
}
