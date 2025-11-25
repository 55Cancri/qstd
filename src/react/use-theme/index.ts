import React from "react";
import * as _t from "./types";
import * as _l from "./literals";
import * as _f from "./fns";

export type { Theme, ThemeStore } from "./types";

/**
 * Hook to manage light/dark theme
 * Syncs with localStorage and across components using events
 */
export function useTheme() {
  const [store, setStore] = React.useState<_t.ThemeStore>(_f.getInitialStore);
  const storeRef = React.useRef(store);
  const isInternalUpdateRef = React.useRef(false);

  // Keep ref in sync with state
  React.useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Apply theme to HTML element whenever store changes
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", store.value);
  }, [store.value]);

  // Sync with localStorage changes (from other tabs/windows) and custom events (same-tab)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === _l.THEME_STORAGE_KEY ||
        e.key === _l.THEME_STORE_STORAGE_KEY
      ) {
        setStore(_f.getInitialStore());
      }
    };

    const handleThemeChange = (e: Event) => {
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false;
        return;
      }
      const customEvent = e as CustomEvent<_t.ThemeStore>;
      if (customEvent.detail) {
        setStore(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(_l.THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(_l.THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  const update = (updates: Partial<_t.ThemeStore>) => {
    const newStore = { ...storeRef.current, ...updates };
    setStore(newStore);
    isInternalUpdateRef.current = true;
    _f.saveStore(newStore);
  };

  const toggle = (theme?: "light" | "dark") => {
    console.log("toggle theme");
    const newStore: _t.ThemeStore = {
      value: theme ?? (storeRef.current.value === "light" ? "dark" : "light"),
      isManual: true,
    };
    setStore(newStore);
    isInternalUpdateRef.current = true;
    _f.saveStore(newStore);
  };

  return { ...store, update, toggle };
}
