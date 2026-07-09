/**
 * profile.js — account overview: avatar, level/EXP, record, collection
 * size and recent battle history.
 */

import { App } from "../core/App.js";
import { DIFFICULTY, ROUTES } from "../core/Constants.js";
import { Formula } from "../game/Formula.js";
import { BattleService } from "../services/BattleService.js";
import { CardService } from "../services/CardService.js";

const { user, profile } = await App.init({ activeRoute: ROUTES.PROFILE });

function escapeHtml(text) {
  const span = document.createElement("span");
  span.textContent = text ?? "";
  return span.innerHTML;
}

document.getElementById("profile-head").innerHTML = `
  ${profile.photoURL ? `<img class="profile-avatar" src="${profile.photoURL}" alt="" referrerpolicy="no-referrer">` : `<span style="font-size:4rem">🧙</span>`}
  <div>
    <h2 style="margin:0">${escapeHtml(profile.displayName)}</h2>
    <p class="muted" style="margin:4px 0 0">${escapeHtml(profile.email)}</p>
    <p class="muted" style="margin:4px 0 0;font-size:0.85rem">
      Joined ${profile.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString() : "—"}
    </p>
  </div>`;

const level = profile.level ?? 1;
const expNeeded = Formula.playerExpToNext(level);
document.getElementById("profile-exp").style.width =
  `${Math.min(100, Math.round(((profile.exp ?? 0) / expNeeded) * 100))}%`;
document.getElementById("profile-exp-caption").textContent =
  `Level ${level} — ${profile.exp ?? 0} / ${expNeeded} EXP to next level`;

const [cards, logs] = await Promise.all([
  CardService.getCards(user.uid),
  BattleService.getRecentLogs(user.uid),
]);

const wins = profile.wins ?? 0;
const losses = profile.losses ?? 0;
const total = wins + losses;
const tiles = [
  { label: "Level", value: level },
  { label: "Gold", value: `🪙 ${Number(profile.gold ?? 0).toLocaleString()}` },
  { label: "Owned Cards", value: cards.length },
  { label: "Wins", value: wins },
  { label: "Losses", value: losses },
  { label: "Win Rate", value: total ? `${Math.round((wins / total) * 100)}%` : "—" },
];
document.getElementById("profile-tiles").innerHTML = tiles
  .map((tile) => `<div class="stat-tile"><div class="value">${tile.value}</div><div class="label">${tile.label}</div></div>`)
  .join("");

const history = document.getElementById("battle-history");
document.getElementById("history-empty").classList.toggle("hidden", logs.length > 0);
history.innerHTML = logs
  .map((log) => {
    const difficulty = DIFFICULTY[log.difficulty] ?? DIFFICULTY.normal;
    const when = log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : "—";
    return `<tr>
      <td>${log.won ? `<strong style="color:var(--success)">Victory</strong>` : `<span style="color:var(--danger)">Defeat</span>`}</td>
      <td>${difficulty.icon} ${difficulty.label}</td>
      <td>${log.rounds}</td>
      <td>🪙 ${log.rewards?.gold ?? 0} · ✨ ${log.rewards?.exp ?? 0} EXP${log.rewards?.cardDrop ? ` · 🃏 ${escapeHtml(log.rewards.cardDrop)}` : ""}</td>
      <td class="muted">${when}</td>
    </tr>`;
  })
  .join("");
