/**
 * Random.js
 * -----------------------------------------------------------------------
 * Central randomness helper. All game rolls go through this class so the
 * source can later be swapped for a seeded PRNG (replays, tests).
 */

export class Random {
  /** Float in [0, 1). */
  static float() {
    return Math.random();
  }

  /** Integer in [min, max] inclusive. */
  static int(min, max) {
    return Math.floor(Random.float() * (max - min + 1)) + min;
  }

  /** True with probability `percent` (0–100). */
  static chance(percent) {
    return Random.float() * 100 < percent;
  }

  /** Random element of an array (undefined when empty). */
  static pick(array) {
    if (!array || array.length === 0) return undefined;
    return array[Random.int(0, array.length - 1)];
  }

  /** Fisher–Yates shuffle returning a NEW array. */
  static shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Random.int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Weighted pick. `items` is an array of { value, weight } entries.
   * @returns {*} the chosen `value`.
   */
  static weighted(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Random.float() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item.value;
    }
    return items[items.length - 1]?.value;
  }
}
