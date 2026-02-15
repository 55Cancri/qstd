import * as _t from "./types";
import * as _l from "./literals";
import * as _f from "./fns";

/**
 * Generate a new sort key between two adjacent items.
 *
 * Given the order strings of the previous and next items, produces a
 * string that sorts lexicographically between them. Pass empty strings
 * for boundaries (insert at start or end).
 *
 * Algorithm uses lowercase a-z (char codes 96-123) as the alphabet:
 * - 96 = boundary before 'a'
 * - 123 = boundary after 'z'
 *
 * @example
 * createOrderStr("b", "d")   // "c"
 * createOrderStr("", "b")    // "a" (or similar, insert at start)
 * createOrderStr("n", "")    // "t" (or similar, insert at end)
 * createOrderStr("az", "b")  // "an" (midpoint between "az" and "b")
 */
export const createOrderStr = (prev = "", next = "") => {
  let p: number | undefined;
  let n: number | undefined;
  let pos: number;
  let str: string;

  for (pos = 0; p === n; pos++) {
    p = pos < prev.length ? prev.charCodeAt(pos) : _l.LOWER_BOUND;
    n = pos < next.length ? next.charCodeAt(pos) : _l.UPPER_BOUND;
  }

  str = prev.slice(0, pos - 1);

  if (p === _l.LOWER_BOUND) {
    // prev exhausted — walk through leading 'a's in next
    while (n === _l.CHAR_A) {
      n = pos < next.length ? next.charCodeAt(pos++) : _l.UPPER_BOUND;
      str += "a";
    }
    if (n === _l.CHAR_A + 1) {
      // next char is 'b' — append 'a' and widen to upper bound
      str += "a";
      n = _l.UPPER_BOUND;
    }
  } else if (p !== undefined && n !== undefined && p + 1 === n) {
    // consecutive characters — carry prev and walk through trailing 'z's
    str += String.fromCharCode(p);
    n = _l.UPPER_BOUND;
    while (
      (p = pos < prev.length ? prev.charCodeAt(pos++) : _l.LOWER_BOUND) ===
      _l.CHAR_Z
    ) {
      str += "z";
    }
  }

  return (
    str +
    String.fromCharCode(
      Math.ceil(((p ?? _l.LOWER_BOUND) + (n ?? _l.UPPER_BOUND)) / 2)
    )
  );
};

/**
 * Generate evenly-spaced order keys for a list of a given size.
 *
 * Used for initial list creation and periodic rebalancing. Produces
 * `num` strings that are roughly evenly distributed across the a-z
 * alphabet space, minimizing future string growth.
 *
 * @example
 * createRebalancedOrderList(3)  // ["i", "r", "z"] (roughly evenly spaced)
 * createRebalancedOrderList(5)  // ["e", "j", "o", "t", "y"]
 */
export const createRebalancedOrderList = (num: number) => {
  const chars = Math.floor(Math.log(num) / Math.log(_l.ALPHABET_SIZE)) + 1;
  const prev = Math.pow(_l.ALPHABET_SIZE, chars - 1);
  const ratio = chars > 1 ? (num + 1 - prev) / prev : num;
  const part = Math.floor(ratio);
  const alpha = [_f.partialAlphabet(part), _f.partialAlphabet(part + 1)];

  const leapStep = ratio % 1;
  let leapTotal = 0.5;
  let first = true;

  const strings: string[] = [];

  const generate = (full: number, str: string) => {
    if (full) {
      for (let i = 0; i < _l.ALPHABET_SIZE; i++) {
        generate(full - 1, str + String.fromCharCode(_l.CHAR_A + i));
      }
    } else {
      if (!first) strings.push(_f.stripTrailingAs(str));
      else first = false;

      const leap = Math.floor((leapTotal += leapStep));
      leapTotal %= 1;

      for (let i = 0; i < part + leap; i++) {
        strings.push(str + (alpha[leap]?.[i] ?? ""));
      }
    }
  };

  generate(chars - 1, "");
  return strings;
};

/**
 * Check if the order strings in a list need rebalancing.
 *
 * Returns true when the longest order string exceeds half the list size.
 * This indicates too many consecutive edge insertions have caused string
 * growth. Rebalancing is rare in normal usage patterns.
 *
 * @example
 * checkBalance([{ order: "b" }, { order: "n" }])       // false (1 < 1)
 * checkBalance([{ order: "aaaaax" }, { order: "b" }])   // true  (6 > 1)
 */
export const checkBalance = <T extends _t.Ordered>(xs: T[]) => {
  let largestOrderStr = 0;
  xs.forEach(
    (x) => (largestOrderStr = Math.max(largestOrderStr, x.order.length))
  );
  return largestOrderStr > xs.length / 2;
};

/**
 * Rebalance a list by recomputing evenly-spaced order keys for every item.
 *
 * Eliminates long order strings caused by repeated edge insertions.
 * Returns new items with fresh `order` values. Does not mutate input.
 *
 * @example
 * const items = [
 *   { id: "a", order: "aaaaax" },
 *   { id: "b", order: "b" },
 *   { id: "c", order: "n" },
 * ];
 * rebalance(items);
 * // [{ id: "a", order: "i" }, { id: "b", order: "r" }, { id: "c", order: "z" }]
 */
export const rebalance = <T extends _t.Ordered>(xs: T[]) => {
  const rebalancedOrderList = createRebalancedOrderList(xs.length);
  return xs.map((x, i) => ({ ...x, order: rebalancedOrderList[i] ?? x.order }));
};

/**
 * Sort items by their lexicographic order strings.
 *
 * Returns a new sorted array (immutable). Items without an order
 * field sort to the beginning.
 */
export const sortByOrder = <T extends { order?: string }>(xs: T[]) =>
  xs.toSorted((a, b) => (a.order ?? "").localeCompare(b.order ?? ""));
