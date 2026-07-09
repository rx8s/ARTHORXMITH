/**
 * AdminService.js
 * -----------------------------------------------------------------------
 * Admin-page operations: monster/skill CRUD in Firestore, artwork uploads
 * to Cloud Storage, and JSON import/export. All writes require the caller
 * to hold role "admin" (enforced by the Firestore/Storage rules).
 */

import { COLLECTIONS } from "../core/Constants.js";
import {
  db,
  storage,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../firebase/FirebaseService.js";
import { Logger } from "../utils/Logger.js";
import { GameDataService } from "./GameDataService.js";

const log = new Logger("AdminService");

const IMPORT_BATCH_LIMIT = 400;

export class AdminService {
  static #collectionFor(kind) {
    if (kind === "monster") return COLLECTIONS.MONSTERS;
    if (kind === "skill") return COLLECTIONS.SKILLS;
    throw new Error(`Unknown data kind: ${kind}`);
  }

  /**
   * Creates or replaces one definition document.
   * @param {"monster"|"skill"} kind
   * @param {object} data must include a non-empty `id`
   */
  static async save(kind, data) {
    if (!data.id) throw new Error("Definition requires an id");
    await setDoc(doc(db, AdminService.#collectionFor(kind), data.id), data);
    GameDataService.invalidateCache();
    log.info(`Saved ${kind} ${data.id}`);
  }

  static async remove(kind, id) {
    await deleteDoc(doc(db, AdminService.#collectionFor(kind), id));
    GameDataService.invalidateCache();
    log.info(`Deleted ${kind} ${id}`);
  }

  /**
   * Bulk-imports an array of definitions (from a JSON file) in batches.
   * @returns {Promise<number>} number of imported documents
   */
  static async importAll(kind, rows) {
    if (!Array.isArray(rows)) throw new Error("Import file must contain a JSON array");
    const collectionName = AdminService.#collectionFor(kind);
    for (let start = 0; start < rows.length; start += IMPORT_BATCH_LIMIT) {
      const batch = writeBatch(db);
      for (const row of rows.slice(start, start + IMPORT_BATCH_LIMIT)) {
        if (!row.id) throw new Error("Every imported row requires an id");
        batch.set(doc(db, collectionName, row.id), row);
      }
      await batch.commit();
    }
    GameDataService.invalidateCache();
    log.info(`Imported ${rows.length} ${kind}(s)`);
    return rows.length;
  }

  /** Serialises current merged definitions and triggers a file download. */
  static exportAll(kind) {
    const rows =
      kind === "monster"
        ? GameDataService.allMonsters().map((monster) => monster.toJSON())
        : GameDataService.allSkills().map((skill) => skill.toJSON());
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${kind}s.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    return rows.length;
  }

  /**
   * Uploads monster artwork to Storage.
   * @param {string} monsterId
   * @param {File} file image chosen in the admin form
   * @returns {Promise<string>} public download URL to store on the monster
   */
  static async uploadArtwork(monsterId, file) {
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const storageRef = ref(storage, `monsters/${monsterId}.${extension}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    log.info(`Uploaded artwork for ${monsterId}`);
    return url;
  }
}
