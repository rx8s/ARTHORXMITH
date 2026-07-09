/**
 * Formula.js
 * -----------------------------------------------------------------------
 * Every derived-stat and progression formula in one place.
 *
 * Primary stats:  STR AGI VIT INT DEX LUK  (1–255)
 * Derived:        ATK MATK DEF MDEF HP SP FLEE HIT CRITICAL ASPD
 *                 Perfect Dodge, cast time
 *
 * Specified formulas:
 *   StatusATK      = STR + floor(STR/10)^2
 *   Minimum MATK   = INT + floor(INT/7)^2
 *   Maximum MATK   = INT + floor(INT/5)^2
 *   Perfect Dodge  = floor(LUK/10)
 */

import { FORMULA, LEVEL, PLAYER_LEVEL, STAT_RANGE } from "../core/Constants.js";

export class Formula {
  /** Clamp a primary stat into its legal 1–255 range. */
  static clampStat(value) {
    return Math.max(STAT_RANGE.MIN, Math.min(STAT_RANGE.MAX, Math.floor(value)));
  }

  /** StatusATK = STR + floor(STR/10)^2 */
  static statusAtk(str) {
    return str + Math.floor(str / 10) ** 2;
  }

  /** Total physical ATK: StatusATK plus small DEX/LUK contributions. */
  static atk({ str, dex, luk }) {
    return (
      Formula.statusAtk(str) +
      Math.floor(dex / FORMULA.ATK_DEX_DIVISOR) +
      Math.floor(luk / FORMULA.ATK_LUK_DIVISOR)
    );
  }

  /** Minimum MATK = INT + floor(INT/7)^2 */
  static minMatk(int) {
    return int + Math.floor(int / 7) ** 2;
  }

  /** Maximum MATK = INT + floor(INT/5)^2 */
  static maxMatk(int) {
    return int + Math.floor(int / 5) ** 2;
  }

  static def(vit, level) {
    return Math.floor(vit * FORMULA.DEF_VIT_FACTOR) + Math.floor(level / FORMULA.DEF_LEVEL_DIVISOR);
  }

  static mdef(int, vit) {
    return Math.floor(int / FORMULA.MDEF_INT_DIVISOR) + Math.floor(vit / FORMULA.MDEF_VIT_DIVISOR);
  }

  static maxHp(vit, level) {
    return FORMULA.BASE_HP + level * FORMULA.HP_PER_LEVEL + vit * FORMULA.HP_PER_VIT;
  }

  static maxSp(int, level) {
    return FORMULA.BASE_SP + level * FORMULA.SP_PER_LEVEL + int * FORMULA.SP_PER_INT;
  }

  static hit(dex, level) {
    return level + dex;
  }

  static flee(agi, level) {
    return level + agi;
  }

  /** Critical chance in percent. */
  static critical(luk) {
    return FORMULA.CRIT_BASE + Math.floor(luk * FORMULA.CRIT_PER_LUK);
  }

  /** Perfect Dodge chance in percent = floor(LUK/10). */
  static perfectDodge(luk) {
    return Math.floor(luk / 10);
  }

  /** Attack speed — used as the turn-order key (higher acts first). */
  static aspd(agi, dex) {
    return FORMULA.BASE_ASPD + agi + Math.floor(dex / FORMULA.ASPD_DEX_DIVISOR);
  }

  /** Cast time multiplier — DEX shortens casts (reserved for channelled skills). */
  static castTimeFactor(dex) {
    return Math.max(0, 1 - (dex * FORMULA.CAST_DEX_FACTOR) / STAT_RANGE.MAX);
  }

  /**
   * All derived combat stats for a stat block at a level.
   * @param {{str:number,agi:number,vit:number,int:number,dex:number,luk:number}} stats
   * @param {number} level
   */
  static derive(stats, level) {
    return {
      atk: Formula.atk(stats),
      minMatk: Formula.minMatk(stats.int),
      maxMatk: Formula.maxMatk(stats.int),
      def: Formula.def(stats.vit, level),
      mdef: Formula.mdef(stats.int, stats.vit),
      maxHp: Formula.maxHp(stats.vit, level),
      maxSp: Formula.maxSp(stats.int, level),
      hit: Formula.hit(stats.dex, level),
      flee: Formula.flee(stats.agi, level),
      critical: Formula.critical(stats.luk),
      perfectDodge: Formula.perfectDodge(stats.luk),
      aspd: Formula.aspd(stats.agi, stats.dex),
    };
  }

  /** Card EXP required to advance FROM `level` to `level + 1`. */
  static expToNext(level) {
    return Math.floor(LEVEL.BASE_EXP * level ** LEVEL.EXP_EXPONENT);
  }

  /** Account EXP required to advance FROM `level` to `level + 1`. */
  static playerExpToNext(level) {
    return Math.floor(PLAYER_LEVEL.BASE_EXP * level ** PLAYER_LEVEL.EXP_EXPONENT);
  }
}
