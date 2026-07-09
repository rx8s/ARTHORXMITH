/**
 * ranking.js — leaderboards: Top Wins / Top Level / Top Collection.
 */

import { App } from "../core/App.js";
import { ROUTES } from "../core/Constants.js";
import { RankingService } from "../services/RankingService.js";
import { Toast } from "../../components/Toast.js";

const METRIC_LABELS = Object.freeze({ wins: "Wins", level: "Level", cardsCount: "Cards" });
const MEDALS = Object.freeze(["🥇", "🥈", "🥉"]);

const { user } = await App.init({ activeRoute: ROUTES.RANKING });

const tabs = document.getElementById("ranking-tabs");
const body = document.getElementById("ranking-body");
const empty = document.getElementById("ranking-empty");
const metricHead = document.getElementById("ranking-metric");

function escapeHtml(text) {
  const span = document.createElement("span");
  span.textContent = text ?? "";
  return span.innerHTML;
}

async function renderBoard(field) {
  metricHead.textContent = METRIC_LABELS[field];
  body.innerHTML = `<tr><td colspan="3" class="muted">Loading…</td></tr>`;
  try {
    const entries = await RankingService.top(field);
    empty.classList.toggle("hidden", entries.length > 0);
    body.innerHTML = entries
      .map(
        (entry, index) => `
        <tr class="${entry.uid === user.uid ? "rank-row-me" : ""}">
          <td><span class="rank-medal">${MEDALS[index] ?? index + 1}</span></td>
          <td>
            ${entry.photoURL ? `<img class="rank-avatar" src="${entry.photoURL}" alt="" referrerpolicy="no-referrer">` : ""}
            ${escapeHtml(entry.displayName ?? "Adventurer")}
          </td>
          <td><strong>${Number(entry[field] ?? 0).toLocaleString()}</strong></td>
        </tr>`,
      )
      .join("");
  } catch (error) {
    body.innerHTML = "";
    Toast.error(`Could not load ranking: ${error.message}`);
  }
}

tabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (!tab) return;
  tabs.querySelectorAll(".tab").forEach((element) => element.classList.remove("active"));
  tab.classList.add("active");
  renderBoard(tab.dataset.field);
});

await renderBoard("wins");
