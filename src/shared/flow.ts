/**
 * Throttle a function call
 * @param fn
 * @param ms
 * @returns
 */
export const throttle = (fn: any, ms: number) => {
  let time = Date.now();
  return (...args: any[]) => {
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
export const debounce = <T extends any[]>(
  fn: (...args: T) => any,
  timeout: number
): ((...args: T) => void) => {
  let timer: NodeJS.Timeout;

  return (...args: T) => {
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
 * @param iterator_fn
 */
export async function* asyncPool<T>(
  concurrency: number,
  iterable: T[],
  iterator_fn: (x: T, xs: T[]) => any
) {
  const executing = new Set();
  const consume = async () => {
    // @ts-ignore
    const [promise, value] = await Promise.race(executing);
    executing.delete(promise);
    return value;
  };
  for (const item of iterable) {
    // Wrap iteratorFn() in an async fn to ensure we get a promise.
    // Then expose such promise, so it's possible to later reference and
    // remove it from the executing pool.
    // @ts-ignore
    const promise = (async () => await iterator_fn(item, iterable))().then(
      (value) => [promise, value]
    );
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }
  while (executing.size) {
    yield await consume();
  }
}

