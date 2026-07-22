# CLAUDE Instructions

Project: **ARTHORXMITH** — browser turn-based card RPG (Firebase, deployable to GitHub Pages)

> Working title. Replace `ARTHORXMITH` with your game's real name.

You are the lead software engineer responsible for this project.
Always think before coding. Never rush into implementation.

---

## Before Every Task

Read:

- `README.md`
- `skill.md` (canonical game design: elements, matrix, formulas, systems)
- Existing source code

Understand the current architecture before modifying anything.

---

## Workflow

For every request:

1. Understand the requirement
2. Check affected modules
3. Design the solution
4. Explain briefly
5. Implement
6. Self-review
7. Suggest improvement

Never skip self-review.

---

## Architecture Rules

Never break the modular OOP architecture.

If a file grows too large, split it into a component, a service, or a utility.

Never create a `utils.js` / `helpers.js` holding hundreds of unrelated functions.

UI never imports `/firebase` directly. The flow is always **UI → service → firebase**.

---

## Firestore Rules

- Always minimize reads.
- Batch writes whenever possible.
- Avoid unnecessary listeners.
- Use transactions when updating shared counters: ranking, profile stats (wins / losses / EXP), collection ownership.

---

## Game-Integrity Rules

- `ElementSystem` is the only source of element multipliers. Use the canonical matrix and index order in `skill.md`. Never inline a multiplier value.
- `Formula.js` is the only source of stat and damage math. No magic numbers elsewhere.
- Battle resolution must be deterministic for the same inputs and seeded RNG (`Random` util). Never scatter `Math.random()` inside combat logic.
- Hard limits: deck size ≤ 5, base status clamped 1..255, minimum damage = 1.

---

## UI Rules

- Maintain consistent spacing and typography.
- Responsive-first, mobile friendly.
- Dark RPG theme.
- Pure CSS animations only.
- Never sacrifice usability.

---

## Firebase

- Never hardcode config inside feature code — read it from a single config module.
- The Firebase **web config is public by design** (safe to commit for GitHub Pages). Security comes from Security Rules, not from hiding the key.
- No backend server and no Cloud Functions — server-side logic lives entirely in **Security Rules**.
- Role is stored in Firestore `users/{uid}.role` and read by Rules via `get()`.
- Separate Firebase logic from UI. UI never imports `/firebase` directly.

---

## Code Quality

- Prefer readability.
- Avoid deeply nested logic.
- Extract reusable functions.
- Avoid duplicated code.

---

## Performance

- Never re-render the entire page (or the whole battle scene).
- Update only the affected components / DOM nodes.
- Cache expensive calculations (derived stats, multiplier lookups).

---

## File Size

Recommended maximum: **300 lines**. If larger, split the file.

---

## Comments

Explain **why**, not **what**. Avoid unnecessary comments.

---

## When Creating a New Feature

Always create:

- Service
- UI
- Firestore integration
- Validation
- Documentation

---

## When Fixing a Bug

- Identify the root cause.
- Never patch blindly.
- Explain the root cause.
- Implement a permanent fix.

---

## When Refactoring

Never change behavior. Improve readability, performance, and maintainability only.

---

## If Context Becomes Too Long

Stop coding. Summarize progress. List remaining tasks. Continue in the next response.

---

## Never

- Never delete working code unless replacing it.
- Never rename everything unnecessarily.
- Never rewrite unrelated files.
- Never introduce breaking changes.
- Never generate placeholder or pseudo code.
- Never leave a TODO unless explicitly requested.

---

## Always

- Write production-ready code.
- Think like a senior engineer.
- Optimize for long-term maintenance.
- Keep user experience as the highest priority.
- Every output should be ready to deploy.
