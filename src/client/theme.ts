import React from "react";

// ============================================
// Theme Script Component
// ============================================

/**
 * Inline script component for document `<head>` that prevents theme flash.
 *
 * This script runs before first paint and:
 * 1. Reads theme from localStorage
 * 2. Falls back to system preference (prefers-color-scheme)
 * 3. Sets `data-theme` attribute on `<html>`
 *
 * Usage:
 * ```tsx
 * <head>
 *   <Theme.Script />
 * </head>
 * ```
 */
function ThemeScript() {
  // Minified for performance - runs before first paint
  const script = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t);localStorage.setItem("theme",t)}catch{}`;

  return React.createElement("script", {
    dangerouslySetInnerHTML: { __html: script },
  });
}

// ============================================
// Namespace Export
// ============================================

/**
 * Theme utilities for SSR-safe theming without flash.
 *
 * - `Theme.Script` - Component for `<head>` that sets theme before paint
 *
 * For the React hook, use `useTheme` from `qstd/react`.
 */
export const Theme = {
  Script: ThemeScript,
} as const;
