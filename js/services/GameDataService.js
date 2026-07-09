/**
 * GameDataService.js
 * -----------------------------------------------------------------------
 * Loads monster and skill definitions. Baseline data ships as static JSON
 * (js/data/*.json) so the game always works; documents in the Firestore
 * `monsters` / `skills` collections (managed on the admin page) override
 * or extend the baseline by id. Firestore reads are cached briefly in
 * localStorage to keep page loads fast and quota-friendly.
 */

import { COLLECTIONS } from "../core/Constants.js";
import { db, collection, getDocs } from "../firebase/FirebaseService.js";
import { Monster } from "../game/Monster.js";
import { Skill } from "../game/Skill.js";
import { Logger } from "../utils/Logger.js";
import { Storage } from "../utils/Storage.js";

const log = new Logger("GameDataService");

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEYS = Object.freeze({ monsters: "data:monsters", skills: "data:skills" });
const JSON_URLS = Object.freeze({
  monsters: new URL("../data/monsters.json", import.meta.url),
  skills: new URL("../data/skills.json", import.meta.url),
});

export class GameDataService {
  static #monsters = null;
  static #skills = null;

  /** Loads everything once per page; subsequent calls are no-ops. */
  static async load() {
    if (GameDataService.#monsters && GameDataService.#skills) return;
    const [monsterRows, skillRows] = await Promise.all([
      GameDataService.#loadMerged("monsters", COLLECTIONS.MONSTERS, CACHE_KEYS.monsters),
      GameDataService.#loadMerged("skills", COLLECTIONS.SKILLS, CACHE_KEYS.skills),
    ]);
    GameDataService.#monsters = new Map(
      monsterRows.map((row) => [row.id, new Monster(row)]),
    );
    GameDataService.#skills = new Map(skillRows.map((row) => [row.id, new Skill(row)]));
    log.info(`Loaded ${GameDataService.#monsters.size} monsters, ${GameDataService.#skills.size} skills`);
  }

  /** Baseline JSON merged with Firestore overrides (Firestore wins by id). */
  static async #loadMerged(jsonKey, collectionName, cacheKey) {
    const response = await fetch(JSON_URLS[jsonKey]);
    if (!response.ok) throw new Error(`Failed to load ${jsonKey}.json (${response.status})`);
    const baseline = await response.json();
    const byId = new Map(baseline.map((row) => [row.id, row]));

    let overrides = Storage.get(cacheKey);
    if (!overrides) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        overrides = snapshot.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
        Storage.set(cacheKey, overrides, CACHE_TTL_MS);
      } catch (error) {
        log.warn(`Firestore ${collectionName} unavailable, using baseline JSON only`, error);
        overrides = [];
      }
    }
    for (const row of overrides) byId.set(row.id, row);
    return [...byId.values()];
  }

  /** Clears the Firestore cache (called after admin edits). */
  static invalidateCache() {
    Storage.remove(CACHE_KEYS.monsters);
    Storage.remove(CACHE_KEYS.skills);
    GameDataService.#monsters = null;
    GameDataService.#skills = null;
  }

  static #assertLoaded() {
    if (!GameDataService.#monsters) throw new Error("GameDataService.load() must run first");
  }

  /** @returns {Monster} throws on unknown ids so bad data fails loudly. */
  static getMonster(id) {
    GameDataService.#assertLoaded();
    const monster = GameDataService.#monsters.get(id);
    if (!monster) throw new Error(`Unknown monster: ${id}`);
    return monster;
  }

  static hasMonster(id) {
    GameDataService.#assertLoaded();
    return GameDataService.#monsters.has(id);
  }

  /** @returns {Skill} */
  static getSkill(id) {
    GameDataService.#assertLoaded();
    const skill = GameDataService.#skills.get(id);
    if (!skill) throw new Error(`Unknown skill: ${id}`);
    return skill;
  }

  /** @returns {Monster[]} */
  static allMonsters() {
    GameDataService.#assertLoaded();
    return [...GameDataService.#monsters.values()];
  }

  /** @returns {Skill[]} */
  static allSkills() {
    GameDataService.#assertLoaded();
    return [...GameDataService.#skills.values()];
  }
}
