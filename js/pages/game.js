/**
 * game.js — main hub: account summary, deck preview, battle launcher.
 */

import { App } from "../core/App.js";
import { DIFFICULTY, ROUTES } from "../core/Constants.js";
import { Formula } from "../game/Formula.js";
import { CardService } from "../services/CardService.js";
import { DeckService } from "../services/DeckService.js";
import { GameDataService } from "../services/GameDataService.js";
import { CardView } from "../../components/CardView.js";
import { Toast } from "../../components/Toast.js";
import { Sound } from "../utils/Sound.js";

const { user, profile } = await App.init({ activeRoute: ROUTES.GAME });

document.getElementById("welcome-title").textContent =
  `Welcome back, ${profile.displayName}`;

// --- account summary -----------------------------------------------------
const tiles = [
  { label: "Level", value: profile.level ?? 1 },
  { label: "Gold", value: `🪙 ${Number(profile.gold ?? 0).toLocaleString()}` },
  { label: "Wins", value: profile.wins ?? 0 },
  { label: "Losses", value: profile.losses ?? 0 },
];
document.getElementById("stat-tiles").innerHTML = tiles
  .map((tile) => `<div class="stat-tile"><div class="value">${tile.value}</div><div class="label">${tile.label}</div></div>`)
  .join("");

const expNeeded = Formula.playerExpToNext(profile.level ?? 1);
const expPercent = Math.min(100, Math.round(((profile.exp ?? 0) / expNeeded) * 100));
document.getElementById("account-exp").style.width = `${expPercent}%`;
document.getElementById("exp-caption").textContent =
  `Account EXP ${profile.exp ?? 0} / ${expNeeded} to level ${(profile.level ?? 1) + 1}`;

// --- deck preview + battle launcher --------------------------------------
const [cards, deck] = await Promise.all([
  CardService.getCards(user.uid),
  DeckService.getDeck(user.uid),
]);
const cardById = new Map(cards.map((card) => [card.id, card]));
deck.prune(cards.map((card) => card.id));

const preview = document.getElementById("deck-preview");
const deckCards = deck.cardIds.map((id) => cardById.get(id)).filter(Boolean);
if (deckCards.length === 0) {
  preview.innerHTML = `<p class="muted">Your deck is empty — add cards before battling.</p>`;
} else {
  for (const card of deckCards) {
    preview.appendChild(CardView.create(card, GameDataService.getMonster(card.monsterId), { showExp: true }));
  }
}

document.getElementById("deck-hint").textContent =
  deckCards.length === 0
    ? "You need at least one card in your deck to battle."
    : `Fighting with ${deckCards.length} card(s). Enemies scale to your deck's level.`;

const difficultyRow = document.getElementById("difficulty-row");
const DESCRIPTIONS = {
  easy: "Weaker foes, smaller rewards",
  normal: "A fair fight, fair rewards",
  hard: "Stronger, smarter foes — 1.5× rewards",
};
for (const preset of Object.values(DIFFICULTY)) {
  const button = document.createElement("button");
  button.className = "difficulty-btn";
  button.type = "button";
  button.innerHTML = `<span class="icon">${preset.icon}</span><strong>${preset.label}</strong><span class="desc">${DESCRIPTIONS[preset.id]}</span>`;
  button.addEventListener("click", () => {
    if (deckCards.length === 0) {
      Toast.error("Your deck is empty — build it first!");
      return;
    }
    Sound.play("click");
    window.location.href = `${ROUTES.BATTLE}?difficulty=${preset.id}`;
  });
  difficultyRow.appendChild(button);
}
