/** Char code for the lower bound sentinel (one below 'a') */
export const LOWER_BOUND = 96;

/** Char code for the upper bound sentinel (one above 'z') */
export const UPPER_BOUND = 123;

/** Char code for 'a' — first character in the usable alphabet */
export const CHAR_A = 97;

/** Char code for 'z' — last character in the usable alphabet */
export const CHAR_Z = 122;

/** Size of the a-z alphabet */
export const ALPHABET_SIZE = 26;

/**
 * Bit-packed lookup table for selecting well-distributed characters
 * from the a-z range when generating evenly-spaced order keys.
 *
 * Each entry encodes which of the 25 non-'a' characters to include
 * when distributing `n` keys across the alphabet. For n >= 13, the
 * table is mirrored using a 25-bit mask (2^25 - 1 = 33554431).
 */
export const DISTRIBUTION_TABLE = [
  0, 4096, 65792, 528416, 1081872, 2167048, 2376776, 4756004, 4794660,
  5411476, 9775442, 11097386, 11184810, 22369621,
] as const;
