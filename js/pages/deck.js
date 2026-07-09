/**
 * deck.js — battle deck builder: toggle owned cards in/out of the deck
 * (max 5), then persist to Firestore.
 */

import { App } from "../core/App.js";
import { ROUTES } from "../core/Constants.js";
import { Deck } from "../game/Deck.js";
import { CardService } from "../services/CardService.js";
import { DeckService } from "../services/DeckService.js";
import { GameDataService } from "../services/GameDataService.js";
import { CardView } from "../../components/CardView.js";
import { Toast } from "../../components/Toast.js";
import { Sound } from "../utils/Sound.js";

const { user } = await App.init({ activeRoute: ROUTES.DECK });

const [cards, deck] = await Promise.all([
  CardService.getCards(user.uid),
  DeckService.getDeck(user.uid),
]);
deck.prune(cards.map((card) => card.id));
const cardById = new Map(cards.map((card) => [card.id, card]));

const deckGrid = document.getElementById("deck-grid");
const collectionGrid = document.getElementById("collection-grid");
const deckCount = document.getElementById("deck-count");

function toggleCard(card) {
  if (!deck.contains(card.id) && deck.isFull) {
    Toast.error(`Deck is full (max ${Deck.maxSize} cards).`);
    return;
  }
  deck.toggle(card.id);
  Sound.play("click");
  render();
}

function render() {
  deckCount.textContent = `Deck (${deck.size}/${Deck.maxSize})`;

  deckGrid.innerHTML = "";
  if (deck.isEmpty) {
    deckGrid.innerHTML = `<p class="muted">No cards in your deck yet.</p>`;
  }
  deck.cardIds.forEach((cardId, index) => {
    const card = cardById.get(cardId);
    deckGrid.appendChild(
      CardView.create(card, GameDataService.getMonster(card.monsterId), {
        onClick: toggleCard,
        selected: true,
        badge: `#${index + 1}`,
      }),
    );
  });

  collectionGrid.innerHTML = "";
  const sorted = [...cards].sort((a, b) => b.level - a.level);
  for (const card of sorted) {
    collectionGrid.appendChild(
      CardView.create(card, GameDataService.getMonster(card.monsterId), {
        onClick: toggleCard,
        selected: deck.contains(card.id),
        showExp: true,
      }),
    );
  }
}

document.getElementById("save-deck").addEventListener("click", async () => {
  if (deck.isEmpty) {
    Toast.error("Add at least one card before saving.");
    return;
  }
  try {
    await DeckService.saveDeck(user.uid, deck);
    Toast.success("Deck saved!");
  } catch (error) {
    Toast.error(`Save failed: ${error.message}`);
  }
});

render();
