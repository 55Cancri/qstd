import globals from "globals";
import eslint from "@eslint/js";
import json from "@eslint/json";
import tseslint from "typescript-eslint";
import pandacss from "@pandacss/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

// ============================================================================
// ESLINT CONFIGURATION FOR QSTD LIBRARY
// ============================================================================
// Strict type checking with sensible overrides for real-world usage.
//
// KEY FEATURES:
// - Strict TypeScript checking (strictTypeChecked)
// - Automatic TypeScript project detection (projectService)
// - JSON/JSONC linting
// - Panda CSS linting
// - React Hooks linting
// ============================================================================

export default defineConfig([
  // ========================================
  // BASE: JavaScript + Strict TypeScript
  // ========================================
  {
    ...eslint.configs.recommended,
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  })),

  // ========================================
  // TYPESCRIPT PROJECT CONFIGURATION
  // ========================================
  {
    languageOptions: {
      parserOptions: {
        // AUTOMATIC PROJECT DETECTION: ESLint finds tsconfig.json files automatically
        projectService: {
          // Allow linting for files NOT included in any tsconfig.json (like build configs)
          // NOTE: Recursive globs (**) are not allowed for performance reasons
          allowDefaultProject: [
            "*.config.js",
            "*.config.mjs",
            "*.config.cjs",
            "*.config.ts",
            "scripts/*.js",
            "scripts/*.mjs",
            "tests/*.mjs",
            "tests/*.ts",
            "tests/*.tsx",
            "playground/*.config.js",
            "playground/*.config.cjs",
            "playground/*.config.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ========================================
  // SOURCE CODE (Browser + React)
  // ========================================
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: reactHooks.configs["recommended-latest"].rules,
  },

  // ========================================
  // SERVER UTILITIES (Node.js)
  // ========================================
  {
    files: ["src/server/**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // ========================================
  // CONFIG FILES (Node.js)
  // ========================================
  {
    files: [
      "*.config.{js,cjs,mjs,ts,cts,mts}",
      "scripts/**/*.{js,mjs}",
      "tests/**/*.{js,mjs}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  // ========================================
  // PANDA CSS
  // ========================================
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ...pandacss.configs["flat/recommended"],
  },

  // ========================================
  // RULE OVERRIDES
  // ========================================
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    rules: {
      // ──────────────────────────────────────
      // ASYNC/PROMISE RULES
      // ──────────────────────────────────────
      // CRITICAL: Prevents floating promises that can cause silent failures
      "@typescript-eslint/no-floating-promises": "error",

      // ──────────────────────────────────────
      // STRICTNESS OVERRIDES (Too Noisy)
      // ──────────────────────────────────────
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",

      // Allow throwing non-Error objects (useful for some patterns)
      "@typescript-eslint/only-throw-error": "off",

      // ──────────────────────────────────────
      // CODE STYLE
      // ──────────────────────────────────────
      "no-console": "off",
      "no-irregular-whitespace": "off",
      "no-constant-condition": "off",
      "no-empty-pattern": "off",

      // ──────────────────────────────────────
      // VARIABLE USAGE
      // ──────────────────────────────────────
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  // ========================================
  // JSON FILES
  // ========================================
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    ...json.configs.recommended,
  },
  {
    files: ["**/*.jsonc", "**/tsconfig.json", "**/tsconfig.*.json"],
    plugins: { json },
    language: "json/jsonc",
    ...json.configs.recommended,
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    ...json.configs.recommended,
  },

  // ========================================
  // GLOBAL IGNORES
  // ========================================
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/styled-system/**",
      "**/playground/styled-system/**",
      "**/playground/dist/**",
      "**/.tsbuildinfo",
      // Test files are excluded from tsconfig.json, ignore them in ESLint
      // (they're checked by vitest which has its own type checking)
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
  },
]);

