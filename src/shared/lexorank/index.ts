/**
 * LexoRank Ordering
 *
 * Lexicographic string-based ordering for collection items.
 * Enables O(1) reorder operations: moving an item between two others
 * generates a new order string between their existing orders.
 *
 * Key functions:
 * - `createOrderStr(prev, next)` - Generate key between two adjacent items
 * - `createRebalancedOrderList(num)` - Generate evenly-spaced keys for a list
 * - `checkBalance(xs)` - Detect when rebalancing is needed
 * - `rebalance(xs)` - Recompute all orders
 * - `sortByOrder(xs)` - Sort items by lexicographic order
 */
export type * from "./types";
export * from "./domain";
