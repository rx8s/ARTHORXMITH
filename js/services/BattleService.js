/**
 * BattleService.js
 * -----------------------------------------------------------------------
 * Battle history persistence (`battle_logs` collection).
 */

import { COLLECTIONS } from "../core/Constants.js";
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "../firebase/FirebaseService.js";

const RECENT_LIMIT = 10;

export class BattleService {
  /**
   * @param {string} uid
   * @param {{won: boolean, difficulty: string, rounds: number,
   *          playerTeam: string[], enemyTeam: string[],
   *          rewards: {gold: number, exp: number, cardDrop: string|null}}} result
   */
  static saveBattleLog(uid, result) {
    return addDoc(collection(db, COLLECTIONS.BATTLE_LOGS), {
      uid,
      ...result,
      createdAt: serverTimestamp(),
    });
  }

  /** @returns {Promise<object[]>} newest-first recent battles for a player. */
  static async getRecentLogs(uid, count = RECENT_LIMIT) {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.BATTLE_LOGS),
        where("uid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(count),
      ),
    );
    return snapshot.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
  }
}
