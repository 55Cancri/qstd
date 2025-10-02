/**
 * ⚠️ CRITICAL BUILD SCRIPT - DO NOT DELETE ⚠️
 * 
 * Post-build script to inject CSS import into dist/react/index.js and index.cjs
 * This ensures consumers automatically load Block's internal styling CSS.
 * 
 * WHY THIS FILE IS ABSOLUTELY REQUIRED:
 * =====================================
 * 
 * 1. ZERO-CONFIG REQUIREMENT
 *    - Consumers should NOT need to manually import CSS files
 *    - Only requirement: import preset + use components
 *    - This script makes CSS auto-load when they import qstd/react
 * 
 * 2. PANDA CSS ARCHITECTURAL LIMITATION
 *    - Panda CANNOT extract utilities from compiled JavaScript
 *    - Block components use css() function to generate classNames at runtime
 *    - Example: css({ display: "flex", alignI: "center" }) → "flex_true alignI_center"
 *    - These classNames need matching CSS rules to exist: .flex_true { display: flex; }
 * 
 * 3. CSS GENERATION PROCESS
 *    - `panda cssgen` extracts CSS from SOURCE files (src/) not dist
 *    - Generates styled-system/styles.css with all utility classes
 *    - Gets copied to dist/react/index.css during build
 *    - Contains 39KB of CSS: reset, base styles, tokens, and 760+ utility classes
 * 
 * 4. HOW IT WORKS
 *    - This script adds `import "./index.css"` to the TOP of dist/react/index.js
 *    - Also adds `require("./index.css")` to dist/react/index.cjs
 *    - Combined with package.json's "sideEffects": ["dist/react/index.css"]
 *    - Bundlers (Vite, Webpack, etc.) automatically load the CSS
 * 
 * WHAT BREAKS WITHOUT THIS FILE:
 * ==============================
 * 
 * ❌ Button components render with NO layout
 *    - css({ display: "flex", alignI: "center" }) generates "flex_true alignI_center"
 *    - But CSS rules .flex_true {} and .alignI_center {} don't exist
 *    - Browser receives class names but no matching styles
 *    - Result: Button content not aligned, cursor not pointer, etc.
 * 
 * ❌ Link components lose all styling
 *    - css({ color: "blue.500", _hover: { textDecoration: "underline" } })
 *    - Generates class names but no CSS rules to match them
 *    - Result: Links render as black text with no hover effects
 * 
 * ❌ Consumer's Panda props partially work
 *    - Consumer code: <Block px={4} bg="blue.500">
 *    - Consumer's Panda generates CSS for THEIR usage
 *    - But Block's internal defaults still broken
 * 
 * ❌ Violates core requirement
 *    - Users would need to add: import "qstd/react/styles.css"
 *    - This defeats the "zero-config beyond preset" goal
 * 
 * TECHNICAL DETAILS:
 * ==================
 * 
 * The build process works in this order:
 * 1. panda codegen → generates styled-system/ types
 * 2. panda cssgen → extracts CSS from src/ → styled-system/styles.css
 * 3. tsup → compiles TS to JS → dist/react/index.js
 * 4. THIS SCRIPT → adds import statement to dist files
 * 5. Consumer imports qstd/react → CSS auto-loads via side effect
 * 
 * Why inject vs bundling CSS directly:
 * - Keeps CSS separate for better caching
 * - Bundlers can apply CSS optimizations
 * - Supports tree-shaking of unused imports
 * - Standard pattern for component libraries
 * 
 * Related files:
 * - package.json → "sideEffects": ["dist/react/index.css"]
 * - package.json → "build": includes "node scripts/inject-css-import.js"
 * - tsup.config.ts → doesn't bundle CSS, keeps it external
 * 
 * DO NOT REMOVE THIS SCRIPT UNLESS:
 * - You find a way to make Panda extract from compiled JS (impossible)
 * - You refactor ALL components to use only inline styles (major change)
 * - You're okay with consumers manually importing CSS (violates requirements)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const files = ["dist/react/index.js", "dist/react/index.cjs"];

const cssImportESM = `import "./index.css";\n`;
const cssImportCJS = `require("./index.css");\n`;

files.forEach((file) => {
  const filePath = join(projectRoot, file);
  const content = readFileSync(filePath, "utf-8");

  // Check if import already exists to avoid duplicates
  const isCJS = file.endsWith(".cjs");
  const cssImport = isCJS ? cssImportCJS : cssImportESM;

  if (content.includes(cssImport)) {
    console.log(`✓ CSS import already exists in ${file}`);
    return;
  }

  // Add CSS import as the first line
  const newContent = cssImport + content;
  writeFileSync(filePath, newContent, "utf-8");
  console.log(`✓ Injected CSS import into ${file}`);
});

console.log("✓ CSS import injection complete");
