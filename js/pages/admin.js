/**
 * admin.js — game-data management: monster/skill CRUD (as JSON documents
 * written to Firestore), artwork upload to Storage, JSON import/export.
 * Guarded by App.init({requireAdmin: true}).
 */

import { App } from "../core/App.js";
import { ELEMENT_META, RARITY_META, ROUTES } from "../core/Constants.js";
import { AdminService } from "../services/AdminService.js";
import { GameDataService } from "../services/GameDataService.js";
import { Toast } from "../../components/Toast.js";

await App.init({ requireAdmin: true, activeRoute: ROUTES.ADMIN });

/** Blank templates used by the "New" button. */
const TEMPLATES = Object.freeze({
  monster: {
    id: "new_monster",
    name: "New Monster",
    icon: "🐾",
    image: "",
    element: "neutral",
    race: "formless",
    rarity: "common",
    description: "",
    baseStats: { str: 25, agi: 25, vit: 25, int: 25, dex: 25, luk: 25 },
    growth: { str: 2, agi: 2, vit: 2, int: 2, dex: 2, luk: 2 },
    growthMode: "fixed",
    skills: [{ id: "tackle", unlockLevel: 1 }],
    passives: [],
    evolution: null,
  },
  skill: {
    id: "new_skill",
    name: "New Skill",
    element: "neutral",
    type: "physical",
    power: 100,
    spCost: 5,
    accuracy: 95,
    critBonus: 0,
    cooldown: 0,
    animation: "slash",
    description: "",
    statusEffect: null,
    drainPercent: 0,
    target: "enemy",
  },
});

let kind = "monster";
let selectedId = null;

const dom = {
  tabMonsters: document.getElementById("tab-monsters"),
  tabSkills: document.getElementById("tab-skills"),
  tableHead: document.getElementById("admin-table-head"),
  tableBody: document.getElementById("admin-table-body"),
  editorTitle: document.getElementById("editor-title"),
  editorJson: document.getElementById("editor-json"),
  artworkField: document.getElementById("artwork-field"),
  artworkFile: document.getElementById("artwork-file"),
  importFile: document.getElementById("import-file"),
};

function rows() {
  return kind === "monster"
    ? GameDataService.allMonsters().map((monster) => monster.toJSON())
    : GameDataService.allSkills().map((skill) => skill.toJSON());
}

function renderTable() {
  if (kind === "monster") {
    dom.tableHead.innerHTML = `<tr><th>ID</th><th>Name</th><th>Element</th><th>Rarity</th></tr>`;
    dom.tableBody.innerHTML = rows()
      .map(
        (row) => `<tr data-id="${row.id}" style="cursor:pointer">
          <td class="muted">${row.id}</td>
          <td>${row.icon} ${row.name}</td>
          <td>${ELEMENT_META[row.element]?.icon ?? ""} ${row.element}</td>
          <td style="color:${RARITY_META[row.rarity]?.color ?? "inherit"}">${row.rarity}</td>
        </tr>`,
      )
      .join("");
  } else {
    dom.tableHead.innerHTML = `<tr><th>ID</th><th>Name</th><th>Type</th><th>Power</th><th>SP</th></tr>`;
    dom.tableBody.innerHTML = rows()
      .map(
        (row) => `<tr data-id="${row.id}" style="cursor:pointer">
          <td class="muted">${row.id}</td>
          <td>${ELEMENT_META[row.element]?.icon ?? ""} ${row.name}</td>
          <td>${row.type}</td>
          <td>${row.power}</td>
          <td>${row.spCost}</td>
        </tr>`,
      )
      .join("");
  }
}

function select(id) {
  selectedId = id;
  const row = rows().find((entry) => entry.id === id);
  dom.editorTitle.textContent = row ? `Editing: ${id}` : "Editor";
  dom.editorJson.value = row ? JSON.stringify(row, null, 2) : "";
  dom.artworkField.classList.toggle("hidden", kind !== "monster");
}

function switchKind(next) {
  kind = next;
  selectedId = null;
  dom.tabMonsters.classList.toggle("active", kind === "monster");
  dom.tabSkills.classList.toggle("active", kind === "skill");
  dom.editorTitle.textContent = "Editor";
  dom.editorJson.value = "";
  dom.artworkField.classList.toggle("hidden", kind !== "monster");
  renderTable();
}

async function reload() {
  GameDataService.invalidateCache();
  await GameDataService.load();
  renderTable();
}

// --- events -----------------------------------------------------------------
dom.tabMonsters.addEventListener("click", () => switchKind("monster"));
dom.tabSkills.addEventListener("click", () => switchKind("skill"));

dom.tableBody.addEventListener("click", (event) => {
  const tr = event.target.closest("tr[data-id]");
  if (tr) select(tr.dataset.id);
});

document.getElementById("btn-new").addEventListener("click", () => {
  selectedId = null;
  dom.editorTitle.textContent = `New ${kind}`;
  dom.editorJson.value = JSON.stringify(TEMPLATES[kind], null, 2);
  dom.artworkField.classList.toggle("hidden", kind !== "monster");
});

document.getElementById("btn-save").addEventListener("click", async () => {
  try {
    const data = JSON.parse(dom.editorJson.value);
    await AdminService.save(kind, data);
    await reload();
    select(data.id);
    Toast.success(`Saved ${kind} "${data.id}".`);
  } catch (error) {
    Toast.error(`Save failed: ${error.message}`);
  }
});

document.getElementById("btn-delete").addEventListener("click", async () => {
  const id = selectedId ?? JSON.parse(dom.editorJson.value || "{}").id;
  if (!id) {
    Toast.error("Select a definition first.");
    return;
  }
  if (!window.confirm(`Delete the Firestore override for "${id}"? Built-in JSON data is unaffected.`)) return;
  try {
    await AdminService.remove(kind, id);
    await reload();
    Toast.success(`Deleted override "${id}".`);
  } catch (error) {
    Toast.error(`Delete failed: ${error.message}`);
  }
});

document.getElementById("btn-export").addEventListener("click", () => {
  const count = AdminService.exportAll(kind);
  Toast.success(`Exported ${count} ${kind}(s) as JSON.`);
});

dom.importFile.addEventListener("change", async () => {
  const file = dom.importFile.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    const count = await AdminService.importAll(kind, imported);
    await reload();
    Toast.success(`Imported ${count} ${kind}(s) to Firestore.`);
  } catch (error) {
    Toast.error(`Import failed: ${error.message}`);
  } finally {
    dom.importFile.value = "";
  }
});

dom.artworkFile.addEventListener("change", async () => {
  const file = dom.artworkFile.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(dom.editorJson.value || "{}");
    if (!data.id) throw new Error("Editor must contain a monster with an id");
    data.image = await AdminService.uploadArtwork(data.id, file);
    dom.editorJson.value = JSON.stringify(data, null, 2);
    Toast.success("Artwork uploaded — save to apply the new image URL.");
  } catch (error) {
    Toast.error(`Upload failed: ${error.message}`);
  } finally {
    dom.artworkFile.value = "";
  }
});

renderTable();
