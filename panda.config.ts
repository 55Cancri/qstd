import { defineConfig } from "@pandacss/dev";
import qstdPreset from "./src/preset/index.js";

/**
 * QSTD Panda Config
 *
 * This config uses the exported preset from src/preset/index.ts to avoid duplicating
 * style definitions. The preset contains all the shared configuration that consumers
 * will also use (globalCss, theme, conditions, utilities).
 *
 * ARCHITECTURE:
 * - src/preset/index.ts: Single source of truth for all styles (exported to consumers)
 * - panda.config.ts: Uses the preset + adds build-specific config (include, outdir, etc.)
 *
 * DEPENDENCIES:
 * - The preset MUST be in the presets array alongside Panda's base preset
 * - Order matters: ["@pandacss/dev/presets", qstdPreset] ensures base colors/tokens load first
 * - Any config defined here will extend/override preset values if needed
 */
export default defineConfig({
  // Include Panda's base preset for default tokens (colors, spacing, etc.)
  // Then include our qstd preset for custom utilities and semantic tokens
  presets: ["@pandacss/dev/presets", qstdPreset],

  // Whether to use css reset
  preflight: true,

  /**
   * SOURCE FILES TO SCAN
   *
   * Panda scans these files to extract utility usage and generate CSS.
   * For qstd development, we scan the source files (not dist) to enable:
   * - Static extraction of utilities used in Block components
   * - Type generation for TypeScript
   * - CSS generation for the development environment
   *
   * NOTE: The commented line below would enable the css() function to work
   * inside the qstd package itself (for runtime CSS generation).
   * Uncomment if you need to use: import { css } from 'panda/css'
   */
  include: [
    "./src/**/*.{ts,tsx,js,jsx}",
    // "./dist/**/*.{js,mjs}", // Uncomment to enable css() function within qstd package
  ],

  exclude: [],

  /**
   * ALL STYLE DEFINITIONS COME FROM THE PRESET
   *
   * The preset (src/preset/index.ts) contains:
   * - globalCss: Root styles and html defaults
   * - theme: Semantic tokens, breakpoints, keyframes
   * - conditions: Custom selectors (dark mode, hover, focus, etc.)
   * - utilities: All custom utilities (flex, grid, rounded, etc.)
   *
   * By importing the preset in the presets array above, all these definitions
   * are automatically included. No need to duplicate them here.
   *
   * If you need to add development-only utilities (like test utilities),
   * you can extend them below in the utilities.extend section.
   */

  // The output directory for your css system
  outdir: "styled-system",

  jsxFramework: "react",
});
