import * as _t from "./types";
import * as _l from "./literals";

// helper to get initial theme from localStorage
export const getInitialTheme = (): _t.Theme => {
  const stored = localStorage.getItem(_l.THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "light";
};

// helper to get initial store from localStorage
export const getInitialStore = (): _t.ThemeStore => {
  try {
    const stored = localStorage.getItem(_l.THEME_STORE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        value: parsed.value ?? getInitialTheme(),
        isManual: parsed.isManual ?? false,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    value: getInitialTheme(),
    isManual: false,
  };
};

// helper to save store to localStorage
export const saveStore = (store: _t.ThemeStore) => {
  try {
    localStorage.setItem(_l.THEME_STORAGE_KEY, store.value);
    localStorage.setItem(_l.THEME_STORE_STORAGE_KEY, JSON.stringify(store));
    // dispatch custom event for same-tab sync
    window.dispatchEvent(
      new CustomEvent(_l.THEME_CHANGE_EVENT, { detail: store })
    );
  } catch {
    // ignore storage errors (e.g., in private browsing)
  }
};






















