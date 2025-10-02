type Opts = {
  symbol?: boolean;
};

/**
 * Convert cents to USD currency string
 * @param cents
 * @param opts
 * @returns
 */
export const convertToUsd = (cents?: number | string, opts: Opts = {}) => {
  if (!cents) return;

  const dollars = (Number(cents) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const showSymbol = opts.symbol ?? true;
  return showSymbol ? dollars : dollars.slice(1);
};

/**
 * Convert dollars to cents
 * @param dollars
 * @returns
 */
export const convertToCents = (dollars: string | number) => {
  const str = dollars.toString().replaceAll(/[\$,]+/g, "");
  return Number(str) * 100;
};

