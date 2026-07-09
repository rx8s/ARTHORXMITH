/**
 * Constants.js
 * -----------------------------------------------------------------------
 * Single source of truth for every game-wide constant.
 * No other file may contain magic numbers — everything tunable lives here.
 */

/** Element identifiers. Order here is ALSO the axis order of the damage matrix. */
export const ELEMENTS = Object.freeze({
  NEUTRAL: "neutral",
  WATER: "water",
  EARTH: "earth",
  FIRE: "fire",
  WIND: "wind",
  POISON: "poison",
  HOLY: "holy",
  SHADOW: "shadow",
  GHOST: "ghost",
  UNDEAD: "undead",
});

/** Matrix axis order (attacker rows / defender columns). */
export const ELEMENT_ORDER = Object.freeze([
  ELEMENTS.NEUTRAL,
  ELEMENTS.WATER,
  ELEMENTS.EARTH,
  ELEMENTS.FIRE,
  ELEMENTS.WIND,
  ELEMENTS.POISON,
  ELEMENTS.HOLY,
  ELEMENTS.SHADOW,
  ELEMENTS.GHOST,
  ELEMENTS.UNDEAD,
]);

/** Display metadata for each element (label, icon, theme colour). */
export const ELEMENT_META = Object.freeze({
  [ELEMENTS.NEUTRAL]: { label: "Neutral", icon: "⚪", color: "#9aa5b1" },
  [ELEMENTS.WATER]: { label: "Water", icon: "💧", color: "#38bdf8" },
  [ELEMENTS.EARTH]: { label: "Earth", icon: "🪨", color: "#a3852c" },
  [ELEMENTS.FIRE]: { label: "Fire", icon: "🔥", color: "#f97316" },
  [ELEMENTS.WIND]: { label: "Wind", icon: "🌪️", color: "#4ade80" },
  [ELEMENTS.POISON]: { label: "Poison", icon: "☠️", color: "#a855f7" },
  [ELEMENTS.HOLY]: { label: "Holy", icon: "✨", color: "#facc15" },
  [ELEMENTS.SHADOW]: { label: "Shadow", icon: "🌑", color: "#6366f1" },
  [ELEMENTS.GHOST]: { label: "Ghost", icon: "👻", color: "#94a3b8" },
  [ELEMENTS.UNDEAD]: { label: "Undead", icon: "💀", color: "#84cc16" },
});

/** Race identifiers. */
export const RACES = Object.freeze({
  FORMLESS: "formless",
  UNDEAD: "undead",
  BRUTE: "brute",
  PLANT: "plant",
  INSECT: "insect",
  FISH: "fish",
  DEMON: "demon",
  DEMI_HUMAN: "demi-human",
  ANGEL: "angel",
  DRAGON: "dragon",
});

/** Display metadata for each race. */
export const RACE_META = Object.freeze({
  [RACES.FORMLESS]: { label: "Formless", icon: "🔮" },
  [RACES.UNDEAD]: { label: "Undead", icon: "🧟" },
  [RACES.BRUTE]: { label: "Brute", icon: "🐺" },
  [RACES.PLANT]: { label: "Plant", icon: "🌿" },
  [RACES.INSECT]: { label: "Insect", icon: "🐝" },
  [RACES.FISH]: { label: "Fish", icon: "🐟" },
  [RACES.DEMON]: { label: "Demon", icon: "😈" },
  [RACES.DEMI_HUMAN]: { label: "Demi-Human", icon: "🧝" },
  [RACES.ANGEL]: { label: "Angel", icon: "👼" },
  [RACES.DRAGON]: { label: "Dragon", icon: "🐲" },
});

/** Rarity identifiers, ordered from lowest to highest. */
export const RARITIES = Object.freeze({
  COMMON: "common",
  UNCOMMON: "uncommon",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
});

export const RARITY_ORDER = Object.freeze([
  RARITIES.COMMON,
  RARITIES.UNCOMMON,
  RARITIES.RARE,
  RARITIES.EPIC,
  RARITIES.LEGENDARY,
]);

/**
 * Rarity metadata:
 *  - dropWeight : relative weight when rolling random card rewards.
 *  - statBonus  : flat bonus added to every base stat of that monster.
 *  - color      : UI accent colour.
 */
export const RARITY_META = Object.freeze({
  [RARITIES.COMMON]: { label: "Common", dropWeight: 55, statBonus: 0, color: "#9aa5b1" },
  [RARITIES.UNCOMMON]: { label: "Uncommon", dropWeight: 25, statBonus: 3, color: "#4ade80" },
  [RARITIES.RARE]: { label: "Rare", dropWeight: 13, statBonus: 7, color: "#38bdf8" },
  [RARITIES.EPIC]: { label: "Epic", dropWeight: 5, statBonus: 12, color: "#a855f7" },
  [RARITIES.LEGENDARY]: { label: "Legendary", dropWeight: 2, statBonus: 20, color: "#facc15" },
});

/** The six primary stats. */
export const STATS = Object.freeze(["str", "agi", "vit", "int", "dex", "luk"]);

export const STAT_META = Object.freeze({
  str: { label: "STR", hint: "Physical attack" },
  agi: { label: "AGI", hint: "Speed & dodge" },
  vit: { label: "VIT", hint: "HP & defense" },
  int: { label: "INT", hint: "Magic attack & SP" },
  dex: { label: "DEX", hint: "Accuracy" },
  luk: { label: "LUK", hint: "Critical & perfect dodge" },
});

/** Primary stat legal range. */
export const STAT_RANGE = Object.freeze({ MIN: 1, MAX: 255 });

/** Level system tuning. */
export const LEVEL = Object.freeze({
  MIN: 1,
  MAX: 99,
  /** exp needed to go from `level` to `level+1` = BASE_EXP * level^EXP_EXPONENT */
  BASE_EXP: 25,
  EXP_EXPONENT: 1.6,
  /** random growth adds Random.int(0, RANDOM_GROWTH_VARIANCE) on top of fixed growth */
  RANDOM_GROWTH_VARIANCE: 2,
});

/** Player (account) level tuning. */
export const PLAYER_LEVEL = Object.freeze({
  BASE_EXP: 100,
  EXP_EXPONENT: 1.5,
  MAX: 99,
});

/** Formula tuning (see js/game/Formula.js for usage). */
export const FORMULA = Object.freeze({
  BASE_HP: 50,
  HP_PER_LEVEL: 8,
  HP_PER_VIT: 10,
  BASE_SP: 20,
  SP_PER_LEVEL: 3,
  SP_PER_INT: 5,
  DEF_VIT_FACTOR: 0.7,
  DEF_LEVEL_DIVISOR: 4,
  MDEF_INT_DIVISOR: 2,
  MDEF_VIT_DIVISOR: 5,
  ATK_DEX_DIVISOR: 5,
  ATK_LUK_DIVISOR: 3,
  BASE_ASPD: 100,
  ASPD_DEX_DIVISOR: 4,
  CRIT_BASE: 1,
  CRIT_PER_LUK: 0.3,
  CAST_DEX_FACTOR: 0.5,
});

/** Battle engine tuning. */
export const BATTLE = Object.freeze({
  MAX_DECK_SIZE: 5,
  MIN_DAMAGE: 1,
  CRIT_MULTIPLIER: 1.5,
  BASE_ACCURACY: 80,
  MIN_ACCURACY: 10,
  MAX_ACCURACY: 100,
  /** basic attack behaves like a physical skill with this power (percent). */
  BASIC_ATTACK_POWER: 100,
  BASIC_ATTACK_ACCURACY: 95,
  DEFEND_DAMAGE_FACTOR: 0.5,
  PASS_SP_REGEN_PERCENT: 15,
  SP_REGEN_PER_TURN: 4,
  /** anti-stall guard only (e.g. element-immune deadlocks) — real 5v5
   *  fights need well over 60 rounds, so keep this generous. */
  MAX_ROUNDS: 150,
  /** sudden death: from this round, attack damage ramps up so healing
   *  stalls can never drag a fight to the round cap. */
  SUDDEN_DEATH_ROUND: 30,
  SUDDEN_DEATH_RAMP_PER_ROUND: 0.04,
  /** consumable loadout every player brings into battle */
  ITEMS: {
    potion: { id: "potion", label: "Potion", icon: "🧪", count: 3, healPercent: 35, target: "hp" },
    ether: { id: "ether", label: "Ether", icon: "💎", count: 2, healPercent: 40, target: "sp" },
  },
});

/**
 * Battle difficulty presets.
 *  - levelOffset  : enemy level relative to the player's average card level.
 *  - rewardFactor : multiplies gold/EXP rewards.
 *  - aiMode       : EnemyAI strategy ("random" | "weighted" | "smart").
 */
export const DIFFICULTY = Object.freeze({
  easy: { id: "easy", label: "Easy", icon: "🌿", levelOffset: -3, rewardFactor: 0.8, aiMode: "random" },
  normal: { id: "normal", label: "Normal", icon: "⚔️", levelOffset: 0, rewardFactor: 1, aiMode: "weighted" },
  hard: { id: "hard", label: "Hard", icon: "🔥", levelOffset: 4, rewardFactor: 1.5, aiMode: "smart" },
});

/** Battle reward tuning. */
export const REWARDS = Object.freeze({
  BASE_GOLD: 100,
  GOLD_PER_ENEMY_LEVEL: 12,
  BASE_PLAYER_EXP: 40,
  PLAYER_EXP_PER_ENEMY_LEVEL: 6,
  BASE_CARD_EXP: 30,
  CARD_EXP_PER_ENEMY_LEVEL: 8,
  CARD_DROP_CHANCE: 0.35,
  LOSS_GOLD: 20,
  LOSS_PLAYER_EXP: 10,
  LOSS_CARD_EXP: 8,
});

/** Economy tuning. */
export const ECONOMY = Object.freeze({
  STARTING_GOLD: 1000,
});

/** Evolution: consumes gold + duplicate cards of the same monster. */
export const EVOLUTION = Object.freeze({
  /** hard floor so evolutions can never be free even if data is misconfigured */
  MIN_GOLD_COST: 100,
});

/** Firestore collection names. */
export const COLLECTIONS = Object.freeze({
  USERS: "users",
  CARDS: "cards",
  DECKS: "decks",
  BATTLE_LOGS: "battle_logs",
  RANKING: "ranking",
  MONSTERS: "monsters",
  SKILLS: "skills",
});

/** Emails that receive the admin role on first login. */
export const ADMIN_EMAILS = Object.freeze([
  "rtiix8@gmail.com",
  "artit-g@asefa.co.th",
]);

/** Monster ids granted to every new account. */
export const STARTER_PACK = Object.freeze([
  "flamepup",
  "tideling",
  "mossling",
  "zephyrling",
  "ironclad",
]);

/** Page routes so redirects are never hard-coded twice. */
export const ROUTES = Object.freeze({
  INDEX: "index.html",
  LOGIN: "login.html",
  GAME: "game.html",
  DECK: "deck.html",
  COLLECTION: "collection.html",
  BATTLE: "battle.html",
  PROFILE: "profile.html",
  RANKING: "ranking.html",
  ADMIN: "admin.html",
});
