/**
 * Usage Examples:
 *
 * ```typescript // Basic logging
 * Log.info("stuff");              // [info] "stuff"
 * Log.warn("uh oh");              // [warn] "uh oh"
 * Log.error("bad");               // [error] "bad"
 *
 * // Standalone header
 * Log.header("STARTING");         // ========== STARTING ==========
 *
 * // Scoped logger
 * const log = Log.label("audio-processor");
 * log.info("something");          // [audio-processor] "something"
 * log.warn("hmm");                // [audio-processor] [warn] "hmm"
 * log.error("failed");            // [audio-processor] [error] "failed"
 * log.header("HANDLER START");    // [audio-processor] ========== HANDLER START ==========
 *
 */

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

const isBrowser = typeof window !== "undefined";

/**
 * Logs values to the console (no prefix).
 * @param values - Values to log (will be JSON stringified)
 * @example
 * ```typescript
 * log("hello"); // "hello"
 * ```
 */
export const log = (...values: unknown[]) => {
  console.log(...values.map(stringify));
};

/**
 * Logs values with [info] prefix.
 * @param values - Values to log (will be JSON stringified)
 * @example
 * ```typescript
 * info("stuff"); // [info] "stuff"
 * ```
 */
export const info = (...values: unknown[]) => {
  console.log("[info]", ...values.map(stringify));
};

/**
 * Logs values with [warn] prefix.
 * @param values - Values to log (will be JSON stringified)
 * @example
 * ```typescript
 * warn("uh oh"); // [warn] "uh oh"
 * ```
 */
export const warn = (...values: unknown[]) => {
  console.log("[warn]", ...values.map(stringify));
};

/**
 * Logs values with [error] prefix.
 * @param values - Values to log (will be JSON stringified)
 * @example
 * ```typescript
 * error("bad"); // [error] "bad"
 * ```
 */
export const error = (...values: unknown[]) => {
  const stringified = values.map(stringify);
  console.log("[error]", ...stringified);
  if (isBrowser) console.error("[error]", ...stringified);
};

/**
 * Logs a message wrapped in header decoration.
 * @param message - The header message
 * @example
 * ```typescript
 * header("STARTING"); // ========== STARTING ==========
 * ```
 */
export const header = (message: string) => {
  console.log(`========== ${message} ==========`);
};

/**
 * Creates a scoped logger with a label prefix.
 * @param name - The label to prefix all log messages with
 * @returns A logger object with info, warn, error, and header methods
 * @example
 * ```typescript
 * const log = label("audio-processor");
 * log.info("something");        // [audio-processor] "something"
 * log.warn("hmm");              // [audio-processor] [warn] "hmm"
 * log.error("failed");          // [audio-processor] [error] "failed"
 * log.header("HANDLER START");  // [audio-processor] ========== HANDLER START ==========
 * ```
 */
export const label = (name: string) => ({
  /** Logs values with [label] prefix. Output: `[label] "value"` */
  info: (...values: unknown[]) => {
    console.log(`[${name}]`, ...values.map(stringify));
  },
  /** Logs values with [label] [warn] prefix. Output: `[label] [warn] "value"` */
  warn: (...values: unknown[]) => {
    console.log(`[${name}]`, "[warn]", ...values.map(stringify));
  },
  /** Logs values with [label] [error] prefix. Output: `[label] [error] "value"` */
  error: (...values: unknown[]) => {
    const stringified = values.map(stringify);
    console.log(`[${name}]`, "[error]", ...stringified);
    if (isBrowser) console.error(`[${name}]`, "[error]", ...stringified);
  },
  /** Logs a header message with [label] prefix. Output: `[label] ========== MESSAGE ==========` */
  header: (message: string) => {
    console.log(`[${name}] ========== ${message} ==========`);
  },
});

/**
 * Typed shape of the object returned from `Log.label(...)`.
 *
 * Exported so downstream packages can accept a logger dependency without
 * re-declaring the method surface.
 */
export type LabeledLogger = ReturnType<typeof label>;
