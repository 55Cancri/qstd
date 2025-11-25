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
  const [shouldSave, setShouldSave] = React.useState(false);

  // Apply theme to HTML element whenever store changes
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", store.value);
  }, [store.value]);

  // Save to localStorage after state changes (when triggered by user actions)
  React.useEffect(() => {
    if (shouldSave) {
      _f.saveStore(store);
      setShouldSave(false);
    }
  }, [store, shouldSave]);

  // Sync with localStorage changes (from other tabs/windows)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === _l.THEME_STORAGE_KEY ||
        e.key === _l.THEME_STORE_STORAGE_KEY
      ) {
        setStore(_f.getInitialStore());
      }
    };

    // Listen for custom event (same-tab sync)
    const handleThemeChange = (e: Event) => {
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
    setStore((prev) => ({ ...prev, ...updates }));
    setShouldSave(true);
  };

  const toggle = (theme?: "light" | "dark") => {
    setStore((prev) => ({
      value: theme ?? (prev.value === "light" ? "dark" : "light"),
      isManual: true,
    }));
    setShouldSave(true);
  };

  return { ...store, update, toggle };
}
