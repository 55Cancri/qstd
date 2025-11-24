const stringify = (value: unknown) => JSON.stringify(value, null, 2);

export const log = (...values: unknown[]) => {
  console.log(...values.map(stringify));
};

export const info = (...values: unknown[]) => {
  console.log("[info]", ...values.map(stringify));
};

export const warn = (...values: unknown[]) => {
  console.log("[warn]", ...values.map(stringify));
};

export const error = (...values: unknown[]) => {
  console.log("[error]", ...values.map(stringify));
};
