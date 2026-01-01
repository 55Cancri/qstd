/**
 * Throttle a function call
 * @param fn
 * @param ms
 * @returns
 */
export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
) => {
  let time = Date.now();
  return (...args: Args) => {
    if (time + ms - Date.now() < 0) {
      fn(...args);
      time = Date.now();
    }
  };
};

/**
 * Ensure code is only triggered once per user input.
 * The debounce forces another function to wait a certain amount of time before running again.
 * Its purpose is to prevent a function from being called several times in succession.
 * @param fn
 * @param timeout
 * @returns
 */
export const debounce = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
  timeout: number
): ((...args: Args) => void) => {
  let timer: NodeJS.Timeout;

  return (...args: Args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, timeout);
  };
};

/**
 * Sleep for x milliseconds.
 * @param ms
 * @returns
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

/**
 * Async pool for concurrent iteration with concurrency limit
 * @example
 * ```
 * for await (const ms of asyncPool(2, [1000, 5000, 3000, 2000], ms => sleep(ms))) {
 *   console.log(ms);
 * }
 * ```
 * @param concurrency
 * @param iterable
 * @param iteratorFn
 */
export async function* asyncPool<T, R>(
  concurrency: number,
  iterable: T[],
  iteratorFn: (x: T, xs: T[]) => PromiseLike<R> | R
): AsyncGenerator<R> {
  const executing = new Set<Promise<R>>();
  for (const item of iterable) {
    const promise = Promise.resolve().then(() => iteratorFn(item, iterable));
    executing.add(promise);
    // Remove the promise from the pool once it settles (both resolve and reject).
    void promise.then(
      () => {
        executing.delete(promise);
      },
      () => {
        executing.delete(promise);
      }
    );
    if (executing.size >= concurrency) {
      yield await Promise.race(executing);
    }
  }
  while (executing.size) {
    yield await Promise.race(executing);
  }
}
