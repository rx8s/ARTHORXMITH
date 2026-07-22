# ARTHORXMITH Development Skill

Version: 1.0
Project: **ARTHORXMITH** — Turn-Based Card RPG (browser, deployable to GitHub Pages)

> Working title. Replace `ARTHORXMITH` with your game's real name (find-and-replace).

---

## Mission

Build a **fully playable, production-ready browser card RPG**.

- Everything runs in the browser. No backend server.
- Deployable directly to GitHub Pages (static, no build step).
- No demo code. No TODO. No placeholders. Everything must work.
- Expandable, maintainable, responsive, mobile-friendly, dark-themed RPG UI.

---

## Tech Stack

**Frontend**

- HTML5
- CSS3 (pure CSS animations)
- Vanilla JavaScript (ES Modules, ES2024+)
- Firebase SDK v11+ (imported as ES modules from the official CDN)

**Firebase**

- Authentication — Google only, anonymous disabled
- Firestore
- Storage — card / monster images

**Hosting**

- GitHub Pages — primary target, static, no bundler, no build step
- Firebase Hosting — compatible alternative

**Not used:** backend server, Node server, Express, PHP, Docker, bundler, jQuery, CSS framework (no Bootstrap). Keep dependencies minimal.

> Note on Storage: enabling Firebase Storage on a new project may require the Blaze plan. If you must stay on Spark, serve images from external URLs or store small assets differently, and drop `/firebase` Storage wrappers accordingly.

---

## Coding Style

Use

- `const` first; `let` only when reassignment is required
- `async` / `await`
- arrow functions
- camelCase for variables and functions, PascalCase for classes
- ES Modules only (`import` / `export`) — one class per file

Never use

- `var`
- jQuery
- inline JavaScript in HTML
- duplicated code
- magic numbers (use named constants)

---

## Architecture

Object-oriented and modular. One class per file. Separate every system.

```
/
  index.html  login.html  game.html  deck.html  collection.html
  battle.html profile.html ranking.html admin.html
/assets
  /css  /images  /icons
/components
/js
  /core       BattleEngine, TurnManager, Card, Monster, Player, Skill, Deck
  /game       ElementSystem, RaceSystem, Formula, AnimationManager
  /battle     battle-flow controllers, enemy AI
  /services   UserService, BattleService, RankingService, CardService, ...
  /firebase   FirebaseService (init, auth, firestore, storage wrappers)
  /data       monsters.json, skills.json (seed data)
  /utils      Logger, Random, Storage (localStorage), Sound
```

Rules

- UI never imports `/firebase` directly. Flow is **UI → service → firebase**.
- Business logic lives in `core` / `game`, never inside page scripts.
- Each page owns its own entry script.
- File ≤ 300 lines. Split into component / service / utility when larger.
- Never create a `utils.js` / `helpers.js` dumping ground; split by domain.

Core classes: `BattleEngine`, `TurnManager`, `Card`, `Monster`, `Player`, `Skill`, `Deck`, `Formula`, `ElementSystem`, `RaceSystem`, `AnimationManager`, `FirebaseService`, `UserService`, `BattleService`.

---

## Game Design (canonical)

### Elements (10) — fixed index order

**IMPORTANT:** this order is canonical and must match the damage matrix indices below.
(This differs from the loose list in the original brief — the matrix ordering is authoritative.)

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Element | Neutral | Water | Earth | Fire | Wind | Poison | Holy | Shadow | Ghost | Undead |

### Damage Multiplier Matrix

Rows = attacker element, columns = defender element. Values are percentages. **Copy exactly.**

```
              Neu  Wat  Ear  Fir  Win  Poi  Hol  Sha  Gho  Und
Neutral       100  100  100  100  100  100  100  100    0  100
Water         100   25  100  150   75  125  100  100   75  100
Earth         100  100   25   75  150  125  100  100   75  100
Fire          100   75  150   25  100  125  100  100   75  100
Wind          100  150   75  100   25  125  100  100   75  100
Poison        100  100  100  100  100    0  100   50   75   50
Holy          100   75   75   75   75   75    0  150  125  150
Shadow        100  100  100  100  100   50  150    0   50   25
Ghost           0  100  100  100  100  100  100   75  150   75
Undead        100  100  100  125  100    0  150    0   75    0
```

`ElementSystem.getMultiplier(attackElement, defenseElement)` returns the integer percentage. No multiplier value may be inlined anywhere else.

### Races (10)

Formless, Undead, Brute, Plant, Insect, Fish, Demon, Demi-Human, Angel, Dragon.

`RaceSystem.js` returns a race bonus (default `100`) with a hook for future race-vs-race bonuses.

### Base Status — range 1..255

`STR`, `AGI`, `VIT`, `INT`, `DEX`, `LUK`

### Derived stat ownership

| Base | Contributes to |
|---|---|
| STR | ATK, status attack bonus |
| AGI | ASPD, FLEE |
| VIT | HP, DEF |
| INT | SP, MATK, MDEF |
| DEX | HIT, cast time, ranged attack |
| LUK | CRITICAL, Perfect Dodge |

Full derived set: `ATK, MATK, DEF, MDEF, HP, SP, FLEE, HIT, CRITICAL, ASPD, Perfect Dodge`.

### Canonical formulas

`Formula.js` is the **single source of truth** for all stat and damage math. These closed-forms are fixed by the brief:

```
StatusATK    = STR + floor(STR / 10)^2
MATK (min)   = INT + floor(INT / 7)^2
MATK (max)   = INT + floor(INT / 5)^2
Perfect Dodge = floor(LUK / 10)
```

The remaining derived stats (`HP, SP, DEF, MDEF, HIT, FLEE, CRITICAL, ASPD`) are defined in `Formula.js` using named constants (no magic numbers) and documented there. Do not scatter these formulas across other files.

### Damage resolution (order matters)

1. Physical raw = `ATK − DEF`. Magic raw = `MATK − MDEF`.
2. Critical: ignores DEF, then raw × `150%`.
3. Apply element multiplier: `final = floor(raw × multiplier / 100)`.
4. Minimum final damage = `1`.

### Turn system

Turn-based. Player actions: **Attack, Skill, Defend, Item, Pass**. Turn order determined by AGI (higher acts first; tiebreak rule documented in `TurnManager`).

### Card model

`id, name, image, element, race, level, hp, sp, status{STR..LUK}, skills[], rarity, description`.

Rarity: Common, Uncommon, Rare, Epic, Legendary.

### Deck / Collection

- Battle deck: **maximum 5 cards** (hard cap).
- Collection album: filter by element / race / rarity / level, search, favorite.

### Skill model

`element, power, spCost, accuracy, criticalBonus, animation, description, cooldown`.

### Enemy AI

Weighted-random: prefer weakness attacks (multiplier > 100), heal when low HP, use finishing blow when the target is killable, fall back to random otherwise.

### Animation

Pure CSS only: attack, critical, heal, damage numbers, turn indicator, card shake. Managed via `AnimationManager` (toggling classes; avoid layout thrashing).

---

## Firestore

Collections: `users`, `cards`, `decks`, `battle_logs`, `ranking`, `monsters`, `skills`.

On first login, create `users/{uid}` with `uid, displayName, photoURL, email, createdAt, lastLogin`.

- Minimize reads. Batch writes. Avoid unnecessary listeners.
- Use transactions when updating shared counters: ranking, profile stats (wins / losses / EXP), collection ownership.
- Never duplicate data. Design composite indexes for ranking queries (top wins / top level / top collection).

---

## Authentication

Google sign-in only; anonymous disabled. Enforce all access with Security Rules — never trust the client. Admin gated by `users/{uid}.role`.

---

## Data

Monster and skill definitions are authored as JSON in `/js/data`, importable and exportable through the Admin page.

---

## UI Design

Modern RPG, dark theme, responsive, mobile-first. Consistent spacing and typography. Pure CSS animations. Accessible and keyboard-friendly where practical.

---

## Performance

Update only the affected DOM (never re-render the entire battle scene). Cache derived stats. Lazy-load images. Debounce collection search. Avoid unnecessary Firestore reads and listeners.

---

## Error Handling

Wrap async and Firebase calls in `try` / `catch`. Show a friendly message to the user; log technical details separately via `Logger`.

---

## Security

- Firebase web config is **public by design** — committing it for GitHub Pages is fine.
- Real security = Firestore Rules + Storage Rules + Auth. Validate and constrain every write in Rules.
- Escape any user-provided text before rendering it to the DOM (XSS).
- Never put Admin SDK / service-account keys in the client. There are no server secrets (no backend).

---

## Naming Convention

- Files: `battle-engine.js`, `element-system.js`, `card-service.js`
- Classes: `BattleEngine`, `ElementSystem`, `CardView`
- Functions: `calculateDamage()`, `drawCard()`, `resolveTurn()`
- Variables: `currentTurn`, `activeCard`, `playerDeck`

---

## Git

Small, meaningful commits. Never mix unrelated changes.

---

## Documentation

Document every service, every class, and the combat algorithm — explain **why**, not what.

---

## Testing

Test every system before merge: element multiplier lookup, damage clamps, critical path, turn order, deck size cap, status clamping. Never merge broken code.

---

## Development Philosophy

- Readable code > clever code
- Maintainability > short code
- Scalability > temporary fix
- User experience > developer convenience
- Correctness > speed of coding
