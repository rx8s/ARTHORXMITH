/**
 * Deck.js
 * -----------------------------------------------------------------------
 * Battle deck model: an ordered list of owned-card ids, capped at
 * BATTLE.MAX_DECK_SIZE. Persisted as `decks/{uid}` in Firestore.
 */

import { BATTLE } from "../core/Constants.js";

export class Deck {
  /**
   * @param {string[]} [cardIds]
   */
  constructor(cardIds = []) {
    this.cardIds = cardIds.slice(0, BATTLE.MAX_DECK_SIZE);
  }

  static get maxSize() {
    return BATTLE.MAX_DECK_SIZE;
  }

  get size() {
    return this.cardIds.length;
  }

  get isEmpty() {
    return this.cardIds.length === 0;
  }

  get isFull() {
    return this.cardIds.length >= BATTLE.MAX_DECK_SIZE;
  }

  contains(cardId) {
    return this.cardIds.includes(cardId);
  }

  /** @returns {boolean} true if the card was added. */
  add(cardId) {
    if (this.isFull || this.contains(cardId)) return false;
    this.cardIds.push(cardId);
    return true;
  }

  /** @returns {boolean} true if the card was removed. */
  remove(cardId) {
    const index = this.cardIds.indexOf(cardId);
    if (index === -1) return false;
    this.cardIds.splice(index, 1);
    return true;
  }

  toggle(cardId) {
    return this.contains(cardId) ? !this.remove(cardId) : this.add(cardId);
  }

  /** Drops ids of cards the player no longer owns (e.g. consumed by evolution). */
  prune(ownedCardIds) {
    const owned = new Set(ownedCardIds);
    this.cardIds = this.cardIds.filter((id) => owned.has(id));
  }

  toJSON() {
    return { cardIds: [...this.cardIds] };
  }
}
