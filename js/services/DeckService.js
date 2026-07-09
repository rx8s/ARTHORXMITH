/**
 * DeckService.js
 * -----------------------------------------------------------------------
 * Battle deck persistence: `decks/{uid}` holds the ordered card-id list.
 */

import { COLLECTIONS } from "../core/Constants.js";
import { db, doc, getDoc, setDoc, serverTimestamp } from "../firebase/FirebaseService.js";
import { Deck } from "../game/Deck.js";

export class DeckService {
  /** @returns {Promise<Deck>} empty deck when none is saved yet. */
  static async getDeck(uid) {
    const snapshot = await getDoc(doc(db, COLLECTIONS.DECKS, uid));
    return new Deck(snapshot.exists() ? snapshot.data().cardIds ?? [] : []);
  }

  static saveDeck(uid, deck) {
    return DeckService.saveDeckIds(uid, deck.cardIds);
  }

  static saveDeckIds(uid, cardIds) {
    return setDoc(doc(db, COLLECTIONS.DECKS, uid), {
      ownerUid: uid,
      cardIds,
      updatedAt: serverTimestamp(),
    });
  }
}
