import * as _l from "./literals";

/**
 * Strip trailing 'a' characters from a string.
 *
 * During order list generation, intermediate strings can end with runs
 * of 'a's that add length without information. Stripping them produces
 * shorter, cleaner keys that still sort correctly.
 *
 * @example
 * stripTrailingAs("naaa") // "n"
 * stripTrailingAs("abc")  // "abc"
 * stripTrailingAs("a")    // ""
 */
export const stripTrailingAs = (str: string) => {
  let last = str.length - 1;
  while (str.charAt(last) === "a") --last;
  return str.slice(0, last + 1);
};

/**
 * Generate a partial alphabet for evenly distributing keys.
 *
 * Uses a bit-packed lookup table to select well-distributed
 * characters from the a-z range based on the desired count.
 * For counts >= 13, the table mirrors to cover the full range.
 *
 * @example
 * partialAlphabet(3) // ["d", "n", "x"] (roughly evenly spaced)
 */
export const partialAlphabet = (num: number) => {
  // 33554431 = 2^25 - 1 (all 25 bits set, for mirroring)
  let bits =
    num < 13
      ? (_l.DISTRIBUTION_TABLE[num] ?? 0)
      : 33554431 - (_l.DISTRIBUTION_TABLE[25 - num] ?? 0);
  const chars: string[] = [];
  for (let i = 1; i < _l.ALPHABET_SIZE; i++, bits >>= 1) {
    if (bits & 1) chars.push(String.fromCharCode(_l.CHAR_A + i));
  }
  return chars;
};
