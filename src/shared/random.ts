/**
 * Randomly pick an item from an array.
 * @param xs
 * @returns
 */
export const item = <T>(xs: T[]) => {
  const rand = Math.random() * xs.length;
  const flooredRand = Math.floor(rand);
  return xs[flooredRand];
};

type RandProps = {
  min?: number;
  max?: number;
};

/**
 * Generate a random number (supposedly more random than v1)
 * @param props
 * @returns
 */
export const num = (props: RandProps = {}) => {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = props;
  return (
    (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) %
      (max - min + 1)) +
    min
  );
};

/**
 * The Fisher-Yates shuffle is the most efficient algorithm for that purpose.
 * @param xs
 * @returns
 */
export const shuffle = <T>(xs: T[]) => {
  return xs.reduceRight((r, _, __, s) => {
    const randomItem = s.splice(0 | (Math.random() * s.length), 1)[0]!;
    return r.push(randomItem), r;
  }, [] as T[]);
};

/**
 * Randomly return true or false.
 * @returns
 */
export const coinFlip = () => {
  return Math.random() < 0.5;
};

/**
 * Generate a random date.
 * 10000000000 keeps the date to within the current year.
 * The more 0s, the greater the range.
 * @returns
 */
export const date = () => {
  return new Date(+new Date() - Math.floor(Math.random() * 10000000000000));
};

/**
 * Generate a random hex color.
 * @returns
 */
export const hexColor = (): string => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  if (hex.length !== 6) {
    console.warn(`${hex} was not 6 characters. Regenerating.`);
    return hexColor();
  }
  return hex;
};

