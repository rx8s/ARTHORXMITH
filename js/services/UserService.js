/**
 * UserService.js
 * -----------------------------------------------------------------------
 * `users/{uid}` document lifecycle: creation on first login, profile
 * reads, and battle-reward application (gold, account EXP, win/loss).
 */

import {
  ADMIN_EMAILS,
  COLLECTIONS,
  ECONOMY,
  PLAYER_LEVEL,
} from "../core/Constants.js";
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "../firebase/FirebaseService.js";
import { Formula } from "../game/Formula.js";
import { Logger } from "../utils/Logger.js";
import { CardService } from "./CardService.js";
import { DeckService } from "./DeckService.js";
import { RankingService } from "./RankingService.js";

const log = new Logger("UserService");

export class UserService {
  /**
   * Creates the user document on first login (with starter cards, deck and
   * ranking entry) or refreshes profile fields + lastLogin on returning
   * logins.
   * @param {import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js").User} user
   * @returns {Promise<object>} the up-to-date profile
   */
  static async ensureUserDocument(user) {
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const snapshot = await getDoc(userRef);
    const identity = {
      uid: user.uid,
      displayName: user.displayName ?? "Adventurer",
      photoURL: user.photoURL ?? "",
      email: user.email ?? "",
      lastLogin: serverTimestamp(),
    };

    if (!snapshot.exists()) {
      log.info("First login — creating account", user.uid);
      const profile = {
        ...identity,
        createdAt: serverTimestamp(),
        role: ADMIN_EMAILS.includes(user.email) ? "admin" : "player",
        level: 1,
        exp: 0,
        gold: ECONOMY.STARTING_GOLD,
        wins: 0,
        losses: 0,
      };
      await setDoc(userRef, profile);
      const starterCards = await CardService.grantStarterPack(user.uid);
      await DeckService.saveDeckIds(user.uid, starterCards.map((card) => card.id));
      await RankingService.syncEntry(user.uid, {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        level: 1,
        wins: 0,
        cardsCount: starterCards.length,
      });
      return UserService.getProfile(user.uid);
    }

    await updateDoc(userRef, identity);
    return { ...snapshot.data(), ...identity, lastLogin: new Date() };
  }

  /** @returns {Promise<object|null>} the `users/{uid}` document data. */
  static async getProfile(uid) {
    const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    return snapshot.exists() ? snapshot.data() : null;
  }

  static isAdmin(profile) {
    return profile?.role === "admin";
  }

  /**
   * Applies battle rewards to the account: gold, account EXP (with level
   * ups), win/loss tally — then mirrors level/wins into the ranking entry.
   * @param {string} uid
   * @param {object} profile current profile (for level-up math)
   * @param {{gold: number, exp: number, won: boolean}} rewards
   * @returns {Promise<{level: number, levelsGained: number}>}
   */
  static async applyBattleResult(uid, profile, rewards) {
    let level = profile.level ?? 1;
    let exp = (profile.exp ?? 0) + rewards.exp;
    let levelsGained = 0;
    while (level < PLAYER_LEVEL.MAX && exp >= Formula.playerExpToNext(level)) {
      exp -= Formula.playerExpToNext(level);
      level += 1;
      levelsGained += 1;
    }
    if (level >= PLAYER_LEVEL.MAX) exp = 0;

    const wins = (profile.wins ?? 0) + (rewards.won ? 1 : 0);
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      gold: increment(rewards.gold),
      exp,
      level,
      wins,
      losses: (profile.losses ?? 0) + (rewards.won ? 0 : 1),
    });
    await RankingService.syncEntry(uid, {
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      level,
      wins,
    });
    return { level, levelsGained };
  }

  /** Spends gold (evolution cost). Caller must have validated the balance. */
  static spendGold(uid, amount) {
    return updateDoc(doc(db, COLLECTIONS.USERS, uid), { gold: increment(-amount) });
  }
}
