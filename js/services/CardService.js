/**
 * CardService.js
 * -----------------------------------------------------------------------
 * CRUD for owned cards (top-level `cards` collection, one document per
 * owned card instance, keyed by ownerUid).
 */

import { COLLECTIONS, STARTER_PACK } from "../core/Constants.js";
import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "../firebase/FirebaseService.js";
import { Card } from "../game/Card.js";
import { EvolutionSystem } from "../game/EvolutionSystem.js";
import { Logger } from "../utils/Logger.js";
import { GameDataService } from "./GameDataService.js";
import { RankingService } from "./RankingService.js";

const log = new Logger("CardService");

export class CardService {
  /** @returns {Promise<Card[]>} every card the player owns. */
  static async getCards(uid) {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.CARDS), where("ownerUid", "==", uid)),
    );
    return snapshot.docs.map((docSnap) => new Card({ ...docSnap.data(), id: docSnap.id }));
  }

  /**
   * Grants one card of a species to a player.
   * @returns {Promise<Card>}
   */
  static async grantCard(uid, monsterId) {
    const monster = GameDataService.getMonster(monsterId);
    const data = { ...Card.newInstanceData(monster, uid), createdAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, COLLECTIONS.CARDS), data);
    log.info(`Granted ${monsterId} to ${uid}`);
    return new Card({ ...data, id: docRef.id });
  }

  /** Grants the STARTER_PACK species to a brand-new account. */
  static async grantStarterPack(uid) {
    const cards = [];
    for (const monsterId of STARTER_PACK) {
      cards.push(await CardService.grantCard(uid, monsterId));
    }
    return cards;
  }

  /** Persists level/exp/stats after battles. */
  static saveProgress(card) {
    return updateDoc(doc(db, COLLECTIONS.CARDS, card.id), {
      level: card.level,
      exp: card.exp,
      stats: { ...card.stats },
    });
  }

  static setFavorite(cardId, favorite) {
    return updateDoc(doc(db, COLLECTIONS.CARDS, cardId), { favorite });
  }

  /**
   * Evolves a card: swaps its species and stats, and consumes duplicate
   * material cards in a single batch. Gold is spent by the CALLER via
   * UserService.spendGold after this succeeds validation.
   * @param {Card} card
   * @param {Card[]} duplicates other owned cards of the same species
   * @param {number} duplicatesNeeded
   * @returns {Promise<Card>} the evolved card
   */
  static async evolve(card, duplicates, duplicatesNeeded) {
    const monster = GameDataService.getMonster(card.monsterId);
    const target = GameDataService.getMonster(monster.evolution.to);
    const evolved = EvolutionSystem.evolvedState(card, target);

    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTIONS.CARDS, card.id), evolved);
    const consumed = duplicates.slice(0, duplicatesNeeded);
    for (const material of consumed) {
      batch.delete(doc(db, COLLECTIONS.CARDS, material.id));
    }
    await batch.commit();
    log.info(`Evolved ${monster.id} → ${target.id}, consumed ${consumed.length} material card(s)`);

    card.monsterId = evolved.monsterId;
    card.stats = evolved.stats;
    return card;
  }

  /** Mirrors the owned-card count into the player's ranking entry. */
  static async syncCollectionCount(uid) {
    const cards = await CardService.getCards(uid);
    await RankingService.syncEntry(uid, { cardsCount: cards.length });
    return cards.length;
  }
}
