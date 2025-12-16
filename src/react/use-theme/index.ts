import React from "react";

// ============================================
// Types
// ============================================

export type Theme = "light" | "dark";

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "qstd:theme-change";

// ============================================
// Helpers
// ============================================

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const getStoredTheme = (): Theme | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
};

const getDomTheme = (): Theme | null => {
  if (typeof document === "undefined") return null;
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : null;
};

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

const saveTheme = (theme: Theme) => {
  if (typeof localStorage === "undefined" || typeof window === "undefined")
    return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: theme }));
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
};

// ============================================
// Hook
// ============================================

/**
 * Hook to manage light/dark theme using localStorage.
 * Syncs across components via events and across tabs via storage events.
 *
 * On SSR apps, pair with `<Theme.Script />` in `<head>` to prevent flash.
 * The hook reads the already-set `data-theme` attribute on first render.
 */
export function useTheme() {
  const [value, setValue] = React.useState<Theme>(() => {
    // Priority: DOM (set by head script) > localStorage > default
    // This ensures first render matches what the head script already applied.
    return getDomTheme() ?? getStoredTheme() ?? "light";
  });

  const valueRef = React.useRef(value);
  const isInternalRef = React.useRef(false);

  // Keep ref in sync
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Sync on mount (in case DOM differs from state, e.g., SSR hydration edge cases)
  React.useLayoutEffect(() => {
    const domTheme = getDomTheme();
    if (domTheme && domTheme !== valueRef.current) {
      valueRef.current = domTheme;
      setValue(domTheme);
    }
  }, []);

  // Listen for storage changes (other tabs) and custom events (same tab)
  React.useEffect(() => {
    const ac = new AbortController();

    window.addEventListener(
      "storage",
      (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) {
          const next = getStoredTheme() ?? getDomTheme() ?? "light";
          valueRef.current = next;
          setValue(next);
          applyTheme(next);
        }
      },
      { signal: ac.signal }
    );

    window.addEventListener(
      CHANGE_EVENT,
      (e: Event) => {
        if (isInternalRef.current) {
          isInternalRef.current = false;
          return;
        }
        const theme = (e as CustomEvent<Theme>).detail;
        if (isTheme(theme)) {
          valueRef.current = theme;
          setValue(theme);
          applyTheme(theme);
        }
      },
      { signal: ac.signal }
    );

    return () => ac.abort();
  }, []);

  const toggle = React.useCallback((theme?: Theme) => {
    const next = theme ?? (valueRef.current === "light" ? "dark" : "light");
    valueRef.current = next;
    setValue(next);
    applyTheme(next);
    isInternalRef.current = true;
    saveTheme(next);
  }, []);

  return { value, toggle };
}
