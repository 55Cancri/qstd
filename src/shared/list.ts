/**
 * Robust variadic zipWith with full type inference
 */
export function zipWith<T extends readonly any[], R>(
  fn: (...args: T) => R,
  ...arrays: { [K in keyof T]: T[K][] }
): R[] {
  if (arrays.length === 0) return [];

  const minLength = Math.min(...arrays.map((arr) => arr.length));
  const result: R[] = [];

  for (let i = 0; i < minLength; i++) {
    const args = arrays.map((arr) => arr[i]) as any as T;
    result.push(fn(...args));
  }

  return result;
}

/**
 * Create an array of x length filled with items of type y.
 * @param size
 * @param fn
 * @returns
 */
export const create = <T>(
  size: number,
  fn?: (_: unknown, x: number) => T
): T[] => (fn ? Array(size).fill(null).map(fn) : Array(size).fill(null));

/**
 * First list includes items that pass the predicate.
 * Second list includes items that failed.
 * @param xs
 * @param predicate
 * @returns
 */
export const partition = <T>(xs: T[], predicate: (x: T) => boolean) =>
  xs.reduce<[T[], T[]]>(
    ([truthList, falseList], x) => {
      const passes = predicate(x);
      if (passes) truthList.push(x);
      else falseList.push(x);
      return [truthList, falseList];
    },
    [[], []]
  );

/**
 * Split an array into chunks of a specific size
 * @param list
 * @param chunkSize
 * @returns
 */
export const chunk = <T>(list: T[], chunkSize: number) => {
  // 100 item list with 25 chunk_size will result in 4 arrays
  const totalChunks = Math.ceil(list.length / chunkSize);
  return Array.from({ length: totalChunks }, (_, i) => {
    const start = i * chunkSize;
    const end = i * chunkSize + chunkSize;
    return list.slice(start, end);
  });
};

