import * as _t from "./types";
import * as _l from "./literals";

// Helper to get initial theme from localStorage
export const getInitialTheme = (): _t.Theme => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(_l.THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "light";
};

// Helper to get initial store from localStorage
export const getInitialStore = (): _t.ThemeStore => {
  if (typeof window === "undefined") {
    return { theme: "light", isManual: false };
  }
  try {
    const stored = localStorage.getItem(_l.THEME_STORE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        theme: parsed.theme ?? getInitialTheme(),
        isManual: parsed.isManual ?? false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return {
    theme: getInitialTheme(),
    isManual: false,
  };
};

// Helper to save store to localStorage
export const saveStore = (store: _t.ThemeStore) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(_l.THEME_STORAGE_KEY, store.theme);
    localStorage.setItem(_l.THEME_STORE_STORAGE_KEY, JSON.stringify(store));
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(
      new CustomEvent(_l.THEME_CHANGE_EVENT, { detail: store })
    );
  } catch {
    // Ignore storage errors (e.g., in private browsing)
  }
};

