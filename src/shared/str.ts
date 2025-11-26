type CaseOpts = {
  to: "title" | "snake" | "kebab";
  clean?: boolean;
};

/**
 * Split text into sentences
 * @param text
 * @returns
 */
export const createSentences = (text?: string) => {
  if (!text) return [];
  return text?.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
};

/**
 * Count words in text
 * @param text
 * @returns
 */
export const countWords = (text: string) => {
  text = text.trim();
  if (text.length === 0) {
    return 0;
  }

  const wordPattern = /\w+/g;
  const matches = text.match(wordPattern);
  return matches ? matches.length : 0;
};

/**
 * Concatenate strings with optional delimiter
 * @param xs
 * @param delimiter
 * @returns
 */
export const concat = (xs: (string | undefined)[], delimiter?: string) => {
  return xs.filter((x) => !!x).join(delimiter);
};

/**
 * The number of times a character appears in a string
 * @param str
 * @param ch
 * @returns
 */
export const countChar = (str: string, ch: string) => {
  return str.split("").reduce((x, y) => (y === ch ? x + 1 : x), 0);
};

/**
 * Convert a str to specific casing
 * @param text
 * @param opts
 * @returns
 */
export const changeCase = <T extends string>(text: string, opts: CaseOpts) => {
  switch (opts.to) {
    case "title":
      return (text.charAt(0).toUpperCase() + text.slice(1)) as T;

    case "snake":
      return text.replace(/[A-Z]/g, (l, idx) =>
        idx === 0 ? l.toLowerCase() : "_" + l.toLowerCase()
      ) as T;

    case "kebab": {
      const lowered = text.toLowerCase().trim();
      const cleaned = opts.clean ? lowered.replaceAll(/[:,]/g, "") : lowered;
      return cleaned.replaceAll(/\s+/g, "-");
    }

    default:
      return text as T;
  }
};
