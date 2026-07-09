/**
 * RankingService.js
 * -----------------------------------------------------------------------
 * Denormalised leaderboard: one `ranking/{uid}` document per player with
 * the fields the ranking page sorts on (wins, level, cardsCount).
 */

import { COLLECTIONS } from "../core/Constants.js";
import {
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "../firebase/FirebaseService.js";

const TOP_LIMIT = 20;

export class RankingService {
  /** Merges the given fields into the player's ranking entry. */
  static syncEntry(uid, fields) {
    return setDoc(
      doc(db, COLLECTIONS.RANKING, uid),
      { uid, ...fields, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  /**
   * @param {"wins"|"level"|"cardsCount"} field
   * @returns {Promise<object[]>} top entries, highest first.
   */
  static async top(field, count = TOP_LIMIT) {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.RANKING), orderBy(field, "desc"), limit(count)),
    );
    return snapshot.docs.map((docSnap) => docSnap.data());
  }
}
