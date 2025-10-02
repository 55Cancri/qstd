import { defineConfig } from "tsup";
import * as path from "node:path"; // Use namespace import to avoid esModuleInterop issues

/**
 * tsup - Build configuration for npm package distribution
 *
 * TROUBLESHOOTING COMMON ERROR:
 * If you see: "Module 'node:path' can only be default-imported using 'esModuleInterop'"
 * → Use: import * as path from "node:path" (namespace import)
 * → NOT: import path from "node:path" (default import)
 * → Why: tsup.config.ts isn't covered by tsconfig.json's include array
 *
 * WHY TSUP IS NEEDED:
 * - Your other projects (gpt-v2) use Vite, which bundles for the BROWSER
 * - This is an NPM PACKAGE that needs to work in multiple environments (browser, Node.js, CJS, ESM)
 * - tsup bundles TypeScript → JavaScript for distribution to consumers
 * - Without it: Consumers would get raw .ts files (won't work) or you'd need to run tsc manually
 *
 * WHAT TSUP DOES:
 * 1. Compiles TypeScript → JavaScript
 * 2. Generates type definitions (.d.ts files)
 * 3. Creates both ESM (.js) and CommonJS (.cjs) formats
 * 4. Handles externals (doesn't bundle peer dependencies)
 * 5. Tree-shakes unused code
 */
export default defineConfig({
  /**
   * ENTRY POINTS - What to build
   *
   * WHY SPECIFY index.ts:
   * - Each entry becomes a separate output file in dist/
   * - "react/index" → dist/react/index.js + dist/react/index.cjs + dist/react/index.d.ts
   * - Without "/index": would be dist/react.js (flat structure, harder to organize)
   *
   * WHAT HAPPENS:
   * - tsup reads each entry file
   * - Bundles it with all its imports
   * - Creates output in dist/ with same folder structure
   */
  entry: {
    "react/index": "src/react/index.ts",
    "client/index": "src/client/index.ts",
    "server/index": "src/server/index.ts",
    "preset/index": "src/preset/index.ts",
  },

  /**
   * FORMAT - Output module formats
   *
   * WHAT THEY DO:
   * - "esm" → Creates .js files with ES modules (import/export)
   * - "cjs" → Creates .cjs files with CommonJS (require/module.exports)
   *
   * WHY BOTH:
   * - Modern bundlers (Vite, Webpack 5+) use ESM
   * - Older Node.js projects use CommonJS
   * - Consumers automatically get the right one based on their setup
   *
   * WITHOUT CJS:
   * - Older projects would fail with "require() of ES Module not supported"
   *
   * WITHOUT ESM:
   * - No tree-shaking (entire package bundled)
   * - Larger bundle sizes for consumers
   */
  format: ["esm", "cjs"],

  /**
   * DTS - Generate TypeScript declaration files
   *
   * WHAT IT DOES:
   * - Creates .d.ts files with all your types
   * - Consumers get full TypeScript autocomplete
   * - Global declarations (ImageFile, etc.) are preserved
   *
   * WITHOUT IT:
   * - No TypeScript support for consumers
   * - No autocomplete in VSCode
   * - No type safety when using your package
   */
  dts: true,

  /**
   * CLEAN - Delete dist/ before each build
   *
   * WHAT IT DOES:
   * - Removes old build artifacts before building
   * - Ensures dist/ only has current files
   *
   * WITHOUT IT:
   * - Old/renamed files would accumulate in dist/
   * - Consumers might import stale files
   * - Debugging becomes confusing
   */
  clean: true,

  /**
   * TREESHAKE - Remove unused code
   *
   * WHAT IT DOES:
   * - Analyzes code and removes dead exports
   * - Enables consumer-side tree-shaking (only imports what they use)
   *
   * WITHOUT IT:
   * - When consumer imports Q.List.create(), they'd get ALL List functions
   * - Larger bundle sizes for consumers
   * - The whole point of this package design would break!
   */
  treeshake: true,

  /**
   * SPLITTING - Code splitting
   *
   * WHAT IT DOES (when true):
   * - Creates separate chunks for shared code
   * - Example: If multiple exports use List, create a shared list.js chunk
   *
   * WHY FALSE:
   * - We WANT everything in single files (react/index.js, client/index.js)
   * - Makes imports simpler: just "qstd/react", not "qstd/react/chunk-abc123"
   * - Slightly larger individual exports, but cleaner for consumers
   *
   * PROS OF FALSE:
   * - Simpler import paths
   * - Predictable output structure
   * - Easier to debug
   *
   * CONS OF FALSE:
   * - If List code is used in both client and server, it's duplicated
   * - Slightly larger total bundle (but tree-shaking helps)
   */
  splitting: false,

  /**
   * EXTERNAL - Don't bundle these dependencies
   *
   * ⚠️ IMPORTANT DISTINCTION:
   * "external" in tsup.config.ts ≠ "consumer must install manually"
   *
   * HOW IT WORKS:
   * 1. Consumer runs: pnpm add qstd
   * 2. pnpm reads package.json and installs:
   *    - peerDependencies: Consumer MUST already have (React, React-DOM)
   *    - dependencies: Auto-installed (framer-motion, FontAwesome, etc.)
   * 3. tsup "external" tells the BUNDLER: "don't bundle these into dist/"
   * 4. Consumer's bundler (Vite/Webpack) resolves them from node_modules
   *
   * SO CONSUMERS ONLY RUN:
   * → pnpm add qstd
   * → Done! All deps auto-installed (assuming they have React already)
   *
   * WHY KEEP EXTERNAL (don't bundle):
   * - Prevents duplication if consumer already has the library
   * - Prevents version conflicts (multiple React copies = hooks break!)
   * - Smaller qstd bundle size
   * - Better tree-shaking (consumer only bundles what they use from these libs)
   * - Single source of truth for dependency versions
   *
   * EXAMPLE:
   * - Without external: framer-motion bundled → dist/react/index.js is 400KB
   * - With external: framer-motion as import → dist/react/index.js is 140KB
   * - Consumer's bundler pulls framer-motion from their node_modules
   * - If consumer uses framer-motion elsewhere, it's only bundled once!
   *
   * WHAT'S IN PACKAGE.JSON:
   * - peerDependencies: react, react-dom (consumer provides)
   * - dependencies: All the others (auto-installed)
   */
  external: [
    // PEER DEPENDENCIES (consumer must have)
    "react",
    "react-dom",
    "react/jsx-runtime",

    // DEPENDENCIES (auto-installed, but kept external for optimal bundling)
    "framer-motion",
    "@floating-ui/react",
    "@fortawesome/fontawesome-svg-core",
    "@fortawesome/free-solid-svg-icons",
    "@fortawesome/free-regular-svg-icons",
    "@fortawesome/free-brands-svg-icons",
    "@fortawesome/react-fontawesome",
    "react-loader-spinner",
    "react-spinners",
    "music-metadata-browser",
    "nanoid",
    "@pandacss/dev",
    "use-immer",
  ],

  /**
   * ESBUILD OPTIONS - Low-level build configuration
   */
  esbuildOptions(options) {
    /**
     * JSX - How to compile JSX
     *
     * "automatic" uses React 17+ JSX transform
     * - No need for `import React from 'react'` in every file
     * - Smaller bundle size
     */
    options.jsx = "automatic";

    /**
     * ALIAS - Path resolution for bundling
     *
     * WHO NEEDS THIS: INTERNAL (qstd build process only)
     * NOT FOR CONSUMERS - they never see these paths
     *
     * WHY NEEDED:
     * - Block component uses: import { styled } from "panda/jsx"
     * - TypeScript resolves this via tsconfig.json paths: "panda/*": ["./styled-system/*"]
     * - But tsup/esbuild doesn't read tsconfig paths by default!
     * - Without alias: Build fails with "Cannot resolve panda/jsx"
     *
     * WHAT IT DOES:
     * - Tells esbuild: when you see "panda/jsx", use "./styled-system/jsx/index.mjs"
     * - Allows Block component to import from Panda's generated code
     * - Only matters during BUILD, not for consumers
     *
     * WITHOUT ALIAS:
     * - Error: "Could not resolve panda/jsx"
     * - Would need to change all Block imports to relative paths
     * - Would break when Panda regenerates styled-system/
     */
    options.alias = {
      "panda/jsx": path.resolve(__dirname, "./styled-system/jsx/index.mjs"),
      "panda/css": path.resolve(__dirname, "./styled-system/css/index.mjs"),
      "panda/patterns": path.resolve(
        __dirname,
        "./styled-system/patterns/index.mjs"
      ),
      "panda/tokens": path.resolve(
        __dirname,
        "./styled-system/tokens/index.mjs"
      ),
    };
  },
});
