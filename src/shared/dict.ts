/**
 * dicts are homogeneous- their values must be of the same type
 * records can hold values of different types
 */
type t = Record<string, unknown> | object;

/**
 * Calculate the byte size of an object
 * @param o
 * @returns
 */
export function byteSizeOfObj(o: any) {
  const objectList = [];
  const stack = [o];
  let bytes = 0;
  while (stack.length) {
    const value = stack.pop();
    if (value == null) bytes += 4;
    else if (typeof value === "boolean") bytes += 4;
    else if (typeof value === "string") bytes += value.length * 2;
    else if (typeof value === "number") bytes += 8;
    else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);
      if (typeof value.byteLength === "number") bytes += value.byteLength;
      else if (value[Symbol.iterator]) {
        for (const v of value) stack.push(v);
      } else {
        Object.keys(value).forEach((k) => {
          bytes += k.length * 2;
          stack.push(value[k]);
        });
      }
    }
  }
  return bytes;
}

/**
 * Return an object filter with a subset of properties.
 * @param r
 * @param predicate
 */
export const filter = <R extends t>(
  r: R,
  predicate: (value: R[keyof R]) => boolean
) =>
  Object.entries(r).reduce(
    (store, [key, value]) =>
      predicate(value as R[keyof R]) ? { ...store, [key]: value } : store,
    {} as R
  );

/**
 * Transform the values on an object
 * @param r
 * @param transformFn
 */
export const transform = <R extends t>(
  r: R,
  transformFn: (key: keyof R, value: R[keyof R]) => Record<string, any>
) =>
  Object.entries(r).reduce(
    (store, [key, value]) => ({
      ...store,
      ...transformFn(key as keyof R, value as R[keyof R]),
    }),
    {} as R
  );

/**
 * First object contains key/value pairs that pass the predicate.
 * Second object contains key/value pairs that failed.
 * @param r
 * @param predicate
 * @returns
 */
export const partition = <R extends t>(
  r: R,
  predicate: (key: keyof R) => boolean
) => {
  const passed = {} as R;
  const failed = {} as R;
  for (const key in r) {
    if (predicate(key)) passed[key] = r[key];
    else failed[key] = r[key];
  }
  return [passed, failed] as const;
};

/**
 * Check if an object exists and has keys
 * @param obj
 * @returns
 */
export const exists = <O>(obj: O) => {
  return obj && typeof obj === "object" && Object.keys(obj).length > 0;
};

/**
 * Determine if an object is empty.
 * @param obj
 * @returns
 */
export const isEmpty = <T extends t>(obj: T) => {
  return (
    !obj ||
    (Object.keys(obj).length === 0 && (obj as any).constructor === Object)
  );
};

/**
 * Return an object with a subset of properties.
 * @param r
 * @param paths
 */
export const pick = <R extends t, U extends keyof R>(
  r: R,
  paths: Array<U>
): Pick<R, U> =>
  Object.entries(r).reduce(
    (store, [key, value]) =>
      paths.includes(key as U) ? { ...store, [key]: value } : store,
    {} as Pick<R, U>
  );

/**
 * Return an object with a subset of properties omitted.
 * @param r
 * @param paths
 */
export const omit = <R extends Record<string, any>, U extends keyof R>(
  r: R,
  paths: Array<U>
): Omit<R, U> => {
  if (!r) {
    throw new Error("[omit] item was not an object");
  }
  return Object.entries(r).reduce((store, [key, value]) => {
    if (paths.includes(key as U)) {
      return store;
    } else {
      store[key as keyof Omit<R, U>] = value as any;
      return store;
    }
  }, {} as Omit<R, U>);
};

