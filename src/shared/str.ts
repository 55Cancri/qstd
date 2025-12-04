type ParseJsonResult<T> = { ok: true; data: T } | { ok: false; error: Error };

/**
 * Parse a JSON string into an object
 * - Safe by default: returns { ok, data/error }
 * - Strict mode: throws on error, returns data directly
 * - If input is already an object, returns it as-is
 * - If input is null/undefined/empty string, returns error (or throws if strict)
 * - Optional generic for typed output (no runtime validation)
 *
 * @example
 * // Safe mode (default)
 * const result = parseJson(event.body);
 * if (result.ok) console.log(result.data);
 *
 * @example
 * // Safe mode with type
 * const result = parseJson<{ name: string }>(event.body);
 * if (result.ok) console.log(result.data.name);
 *
 * @example
 * // Strict mode - throws on error
 * const data = parseJson<MyType>(event.body, { strict: true });
 */
export function parseJson<T = Record<string, unknown>>(
  input: string | object | null | undefined,
  opts: { strict: true }
): T;
export function parseJson<T = Record<string, unknown>>(
  input: string | object | null | undefined,
  opts?: { strict?: false }
): ParseJsonResult<T>;
export function parseJson<T = Record<string, unknown>>(
  input: string | object | null | undefined,
  opts?: { strict?: boolean }
) {
  const strict = opts?.strict ?? false;

  // Handle null/undefined
  if (input === null || input === undefined) {
    const error = new Error("[parseJson] input is null or undefined");
    if (strict) throw error;
    return { ok: false, error };
  }

  // Handle empty string
  if (input === "") {
    const error = new Error("[parseJson] input is empty string");
    if (strict) throw error;
    return { ok: false, error };
  }

  // Already an object - return as-is
  if (typeof input === "object") {
    if (strict) return input;
    return { ok: true, data: input };
  }

  // Parse string
  try {
    const data = JSON.parse(input) as T;
    if (strict) return data;
    return { ok: true, data };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("[parseJson] failed to parse JSON");
    if (strict) throw error;
    return { ok: false, error };
  }
}

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
