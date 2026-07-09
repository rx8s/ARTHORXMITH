# ⚜️ ARTHORXMITH — Monster Card RPG

A complete turn-based monster card RPG that runs entirely in the browser —
no backend server. Vanilla JavaScript (ES Modules), Firebase v12
(Authentication + Firestore + Storage), deployable to GitHub Pages or
Firebase Hosting as-is.

- **Collect** 30 monsters across 10 elements, 10 races and 5 rarities
- **Build** a battle deck of up to 5 cards
- **Fight** turn-based battles against an element-aware AI (3 difficulties)
- **Grow** cards with EXP, random/fixed stat growth and evolutions
- **Compete** on global leaderboards (wins / level / collection)
- **Manage** game data live from the built-in admin page

---

## Table of Contents

1. [Installation](#installation)
2. [Firebase Setup](#firebase-setup)
3. [Firestore Rules](#firestore-rules)
4. [Storage Rules](#storage-rules)
5. [Deploy to GitHub Pages](#deploy-to-github-pages)
6. [Folder Structure](#folder-structure)
7. [Game Systems](#game-systems)
8. [Admin Page](#admin-page)
9. [Extending the Game](#extending-the-game)

---

## Installation

The game is 100% static files — you only need a local web server (ES
modules and `fetch` do not work from `file://`).

```bash
git clone <your-repo-url> arthorxmith
cd arthorxmith

# any static server works, e.g.:
python3 -m http.server 8080
# or
npx serve .
```

Open <http://localhost:8080>. Add `localhost` to Firebase **Authorized
domains** (see below) for Google login to work locally.

## Firebase Setup

The project ships configured for the `arthorxmith` Firebase project in
[`js/firebase/FirebaseConfig.js`](js/firebase/FirebaseConfig.js). To use
your own project, replace that config object and follow these steps:

### 1. Create the project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Add a **Web app** (`</>` icon) and copy its config into
   `js/firebase/FirebaseConfig.js`.

### 2. Authentication (Google login only)

1. **Build → Authentication → Get started**.
2. **Sign-in method** → enable **Google** (set a support email).
3. Leave **Anonymous** disabled — the game never uses it.
4. **Settings → Authorized domains** → add:
   - `localhost` (development)
   - `<your-username>.github.io` (GitHub Pages)

### 3. Firestore

1. **Build → Firestore Database → Create database** (production mode,
   pick a region close to your players).
2. Paste the contents of [`firestore.rules`](firestore.rules) into
   **Rules** and publish.
3. Collections are created automatically at runtime:
   `users`, `cards`, `decks`, `battle_logs`, `ranking`, `monsters`, `skills`.
4. **Composite index** — the profile page queries battle history with
   `where("uid", "==", …)` + `orderBy("createdAt", "desc")`. The first
   time it runs, the browser console prints a link that creates the
   required index with one click (Firestore → Indexes):
   `battle_logs: uid ASC, createdAt DESC`.

### 4. Storage (admin artwork uploads)

1. **Build → Storage → Get started**.
2. Paste the contents of [`storage.rules`](storage.rules) into **Rules**
   and publish.

### 5. Admin accounts

Admin emails are declared in two places (keep them in sync):

- `ADMIN_EMAILS` in [`js/core/Constants.js`](js/core/Constants.js) —
  grants the `admin` role on **first login**.
- `isAdminEmail()` in [`firestore.rules`](firestore.rules) — lets that
  role be written.

If an account already exists before being added, set its
`users/{uid}.role` field to `"admin"` manually in the Firestore console.

## Firestore Rules

See [`firestore.rules`](firestore.rules). Summary:

| Collection    | Read          | Write                                          |
|---------------|---------------|------------------------------------------------|
| `users`       | any signed-in | owner only; `role` can never be self-escalated |
| `cards`       | any signed-in | owner (`ownerUid`) only                        |
| `decks`       | any signed-in | owner (doc id = uid) only                      |
| `battle_logs` | owner only    | owner create; append-only                      |
| `ranking`     | any signed-in | owner (doc id = uid) only                      |
| `monsters`    | any signed-in | admins only                                    |
| `skills`      | any signed-in | admins only                                    |

## Storage Rules

See [`storage.rules`](storage.rules): `monsters/**` artwork is publicly
readable, writable only by admins (role verified against Firestore via
cross-service rules). Everything else is denied.

## Deploy to GitHub Pages

```bash
git add -A
git commit -m "Deploy ARTHORXMITH"
git push origin master
```

1. GitHub repo → **Settings → Pages**.
2. **Source**: *Deploy from a branch* → branch `master`, folder `/ (root)`.
3. Wait for the deploy, then open `https://<username>.github.io/<repo>/`.
4. Add `<username>.github.io` to Firebase **Authentication → Authorized
   domains**.

Notes:

- A `.nojekyll` file is included so GitHub Pages serves everything as-is.
- All asset/module paths are **relative**, so the game works from a
  project subpath (`/repo-name/`) without changes.
- Firebase Hosting works too: `firebase init hosting` (public dir `.`,
  no SPA rewrite) then `firebase deploy`.

## Folder Structure

```
/
├── index.html            Landing page (redirects signed-in players)
├── login.html            Google sign-in
├── game.html             Hub: stats, deck preview, battle launcher
├── deck.html             Deck builder (max 5 cards)
├── collection.html       Card album: filters, search, favorites, evolution
├── battle.html           Turn-based battle screen
├── profile.html          Account stats + battle history
├── ranking.html          Leaderboards (wins / level / collection)
├── admin.html            Game-data management (admins only)
├── firestore.rules       Firestore security rules
├── storage.rules         Cloud Storage security rules
├── css/
│   └── style.css         Dark RPG theme + pure-CSS battle animations
├── components/           Reusable DOM components
│   ├── NavBar.js         Shared navigation bar
│   ├── CardView.js       The one card renderer used everywhere
│   └── Toast.js          Toast notifications
├── assets/  images/  icons/   Static assets (artwork can also live in Storage)
└── js/
    ├── core/
    │   ├── App.js            Page bootstrap: auth guard, data load, nav
    │   └── Constants.js      Every game constant — no magic numbers elsewhere
    ├── firebase/
    │   ├── FirebaseConfig.js  Project credentials
    │   └── FirebaseService.js Single SDK init + re-exported helpers
    ├── services/             Firestore/Storage access layer
    │   ├── AuthService.js       Google login/logout
    │   ├── UserService.js       users/{uid} lifecycle + battle rewards
    │   ├── CardService.js       owned cards CRUD, starter pack, evolution
    │   ├── DeckService.js       decks/{uid}
    │   ├── BattleService.js     battle_logs
    │   ├── RankingService.js    ranking/{uid} + leaderboards
    │   ├── GameDataService.js   monsters/skills: JSON baseline ⊕ Firestore
    │   └── AdminService.js      admin CRUD, JSON import/export, uploads
    ├── game/                  Pure game logic (no DOM, no Firebase)
    │   ├── Monster.js           Species definition (card template)
    │   ├── Card.js              Owned card instance
    │   ├── Skill.js             Active skill model
    │   ├── Deck.js              Deck model (max size, toggling)
    │   ├── Formula.js           All derived-stat / EXP formulas
    │   ├── ElementSystem.js     10×10 damage multiplier matrix
    │   ├── RaceSystem.js        Race registry + future bonus hook
    │   ├── LevelSystem.js       Card EXP, level-ups, stat growth
    │   ├── EvolutionSystem.js   Evolution requirements + stat rebuild
    │   ├── StatusEffects.js     9 debuffs + buffs, stacking, DoT
    │   └── PassiveSkills.js     Stat/resist/regen/aura passives
    ├── battle/                Battle engine
    │   ├── BattleEngine.js      Turn orchestrator (emits render events)
    │   ├── Combatant.js         Live HP/SP/status wrapper
    │   ├── DamageCalculator.js  Hit/crit/damage pipeline
    │   ├── TurnManager.js       Rounds + ASPD initiative
    │   ├── EnemyAI.js           Team generation + 3 decision strategies
    │   └── AnimationManager.js  CSS animation await + floating numbers
    ├── data/
    │   ├── monsters.json        30 baseline monsters
    │   └── skills.json          34 baseline skills
    ├── pages/                 One controller per HTML page
    └── utils/
        ├── Logger.js  Random.js  Storage.js  Sound.js
```

## Game Systems

### Elements

10 elements with the exact multiplier matrix in
[`js/game/ElementSystem.js`](js/game/ElementSystem.js) (rows attack,
columns defend, percent): Neutral, Water, Earth, Fire, Wind, Poison,
Holy, Shadow, Ghost, Undead. `FinalDamage = Damage × ElementMultiplier`.

### Stats & Formulas

Primary stats `STR AGI VIT INT DEX LUK` (1–255). Derived stats (ATK,
MATK min/max, DEF, MDEF, HP, SP, HIT, FLEE, CRITICAL, ASPD, Perfect
Dodge) come from [`js/game/Formula.js`](js/game/Formula.js), including:

```
StatusATK     = STR + floor(STR/10)²
MinimumMATK   = INT + floor(INT/7)²
MaximumMATK   = INT + floor(INT/5)²
PerfectDodge  = floor(LUK/10)
```

### Combat

- `PhysicalDamage = ATK − DEF`, `MagicDamage = MATK − MDEF`, minimum 1
- Critical hits **ignore DEF**, deal ×1.5, then the element multiplier
- Turn order by ASPD (AGI-driven); actions: Attack / Skill / Defend /
  Item / Pass
- Status effects: Poison, Burn, Freeze, Blind, Sleep, Stun, Curse,
  Silence, Confusion — each with duration and stacking rules
- Passives: ATK/MATK/crit/dodge boosts, element resists, HP regen and
  party-wide support auras

### Progression

Cards gain EXP from battles (levels 1–99, fixed or random growth per
species). Evolutions require level + gold + duplicate cards as material
and change artwork, stats and skill list. Account levels, gold, win/loss
and battle history are stored per player; a 35% post-victory card drop
grows the collection.

## Admin Page

`admin.html` (admins only): browse/edit monsters and skills as JSON,
create new definitions, upload artwork to Storage, import/export whole
data sets as JSON files. Saved definitions go to the `monsters`/`skills`
Firestore collections and **override the baseline JSON by id** for all
players (baseline files in `js/data/` remain untouched as a fallback).

## Extending the Game

- **New monster/skill**: add via the admin page, or append to
  `js/data/*.json`.
- **Race bonuses**: fill the `RACE_BONUS` table in
  [`js/game/RaceSystem.js`](js/game/RaceSystem.js) — the battle engine
  already applies it.
- **Balance tuning**: every number lives in
  [`js/core/Constants.js`](js/core/Constants.js).
- **New status effect / passive**: add a definition to
  `StatusEffects.js` / `PassiveSkills.js`; the engine and UI pick it up.
