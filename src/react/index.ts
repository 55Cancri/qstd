/**
 * React module - Block component, hooks, and types
 *
 * Usage:
 * import Block, { useDebounce, useThrottle, useMatchMedia, ImageFile } from "qstd/react";
 */

// Import pre-generated Panda CSS styles for Block's internal styling
// tsup will extract this CSS and output it as dist/react/index.css
// @ts-expect-error - CSS import for bundler
import "../../styled-system/styles.css";

import React from "react";

// Re-export Block component as default
export { default } from "../block/index";

// Re-export types
export type { RadioOption } from "../block/types";

// Note: ImageFile, AudioFile, VideoFile, MediaFile are globally declared
// They're automatically available when qstd is installed - no need to import!

// React Hooks
export type MediaQuery = string[];
export type MatchedMedia = boolean[];

/**
 * Debounce a value
 * @param value
 * @param delay
 * @returns
 */
export function useDebounce(value: string, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle a value
 * @param value
 * @param interval
 * @returns
 */
export function useThrottle(value: string, interval: number = 500) {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastUpdate = React.useRef<number>(0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= interval) {
      // Enough time has passed, update immediately
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      // Not enough time has passed, schedule an update for the remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, interval - timeSinceLastUpdate);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, interval]);

  return throttledValue;
}

/**
 * Use like:
 * ```typescript
 * const queries = [
 *   '(max-width: 400px)',
 *   '(min-width: 800px)'
 * ]
 *
 * const Component = () => {
 *   const [mobile, desktop] = useMatchMedia(queries)
 *   // ...
 * }
 * ```
 * @param queries
 * @param defaultValues
 * @returns
 */
export function useMatchMedia(
  queries: MediaQuery,
  defaultValues: MatchedMedia = []
): MatchedMedia {
  const initialValues = defaultValues.length
    ? defaultValues
    : Array(queries.length).fill(false);

  const mediaQueryLists = queries.map((q) => window.matchMedia(q));

  const getValue = () => {
    // Return the value for the given queries
    const matchedQueries = mediaQueryLists.map((mql) => mql.matches);

    return matchedQueries;
  };

  // State and setter for matched value
  const [value, setValue] = React.useState(getValue);

  React.useLayoutEffect(() => {
    // Event listener callback
    // Note: By defining getValue outside of useEffect we ensure that it has ...
    // ... current values of hook args (as this hook only runs on mount/dismount).
    const handler = () => setValue(getValue);

    // Set a listener for each media query with above handler as callback.
    mediaQueryLists.forEach((mql) => mql.addListener(handler));

    // Remove listeners on cleanup
    return () => mediaQueryLists.forEach((mql) => mql.removeListener(handler));
  }, []);

  // nextjs
  if (typeof window === "undefined") return initialValues;

  return value;
}

export * from "./use-theme";
