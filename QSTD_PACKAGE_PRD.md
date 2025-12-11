# qstd - Standard Block Component & Utilities Library

## Project Requirements Document

---

## Executive Summary

Create `qstd` - a reusable npm package that provides:

1. **React Module** - Block component + hooks + global file types
2. **Universal Utilities** - Lodash-style functions that work in browser and Node.js
3. **Client Utilities** - Browser-specific DOM functions
4. **Server Utilities** - Node.js file operations
5. **Panda CSS Preset** - Custom utilities, tokens, and theme configuration

**Key Feature:** Single package with granular tree-shaking at the individual function level, even with deep namespace exports.

**Current Structure (v0.1.0):**

- `qstd/react` - Block component (default) + 3 hooks + global file types
- `qstd/client` - Browser utilities + 8 shared modules
- `qstd/server` - Node.js utilities + 8 shared modules
- `qstd/preset` - Complete Panda CSS configuration

---

## Table of Contents

1. [Package Information](#package-information)
2. [Architecture & Design](#architecture--design)
3. [Package Structure](#package-structure)
4. [Import Patterns](#import-patterns)
5. [Tree-Shaking Verification](#tree-shaking-verification)
6. [Module Specifications](#module-specifications)
7. [Build Configuration](#build-configuration)
8. [Publishing Strategy](#publishing-strategy)
9. [Consumer Setup Guide](#consumer-setup-guide)
10. [Versioning Strategy](#versioning-strategy)
11. [Migration Plan](#migration-plan)
12. [Testing Strategy](#testing-strategy)

---

## Package Information

| Property          | Value                     |
| ----------------- | ------------------------- |
| **Name**          | `qstd`                    |
| **Version**       | `0.1.0` (beta)            |
| **Type**          | Public npm package        |
| **License**       | MIT (or your choice)      |
| **Registry**      | npm (npmjs.com)           |
| **Repository**    | GitHub (personal account) |
| **Documentation** | GitHub Pages / Vercel     |

---

## Architecture & Design

### Single Package with Subpath Exports

**Why Single Package:**

- ✅ Simpler to maintain (one repo, one version)
- ✅ Consumer installs once: `pnpm add qstd`
- ✅ Shared functions defined in one place
- ✅ Monorepo projects can install different versions in server/client
- ✅ Tree-shaking works at individual function level

### Design Principles

1. **Granular Tree-Shaking** - Only used code is bundled, down to individual functions
2. **Environment Safety** - Runtime checks prevent server code in browser and vice versa
3. **Type Safety** - Full TypeScript support with proper type exports
4. **DX First** - Clean imports, intuitive API, great autocomplete
5. **Zero Config** - Works out of the box with Vite, Webpack, esbuild

---

## Package Structure

```
qstd/
├── src/
│   ├── block/                    # Block component + variants
│   │   ├── index.tsx             # Main Block component
│   │   ├── types.ts              # All Block types
│   │   ├── fns.tsx               # Helper functions
│   │   ├── literals.ts           # Constants & mappings
│   │   ├── accordion.tsx         # Accordion variant
│   │   ├── checkbox.tsx          # Checkbox variant
│   │   ├── drawer.tsx            # Drawer variant
│   │   ├── icon.tsx              # Icon utilities
│   │   ├── input.tsx             # Input variant
│   │   ├── menu.tsx              # Menu variant
│   │   ├── progress.tsx          # Progress variant
│   │   ├── radio.tsx             # Radio variant
│   │   ├── switch.tsx            # Switch variant
│   │   ├── textarea.tsx          # Textarea variant
│   │   ├── tooltip.tsx           # Tooltip variant
│   │   └── use-resize-observer.ts
│   │
│   ├── shared/                   # Universal utilities (browser + Node.js)
│   │   ├── list.ts               # Array utilities
│   │   ├── dict.ts               # Object utilities
│   │   ├── string.ts             # String utilities
│   │   ├── number.ts             # Number utilities
│   │   ├── date.ts               # Date utilities
│   │   └── fn.ts                 # Function utilities (debounce, throttle)
│   │
│   ├── client/                   # Browser-specific utilities
│   │   ├── dom.ts                # DOM manipulation
│   │   ├── storage.ts            # localStorage/sessionStorage
│   │   ├── browser.ts            # Browser APIs (clipboard, etc.)
│   │   └── index.ts              # Re-exports shared + client
│   │
│   ├── server/                   # Node.js-specific utilities
│   │   ├── fs.ts                 # File system operations
│   │   ├── env.ts                # Environment variables
│   │   ├── path.ts               # Path utilities
│   │   └── index.ts              # Re-exports shared + server
│   │
│   ├── react/                    # React hooks
│   │   ├── useDebounce.ts        # Debounce hook
│   │   ├── useToggle.ts          # Toggle hook
│   │   ├── useLocalStorage.ts    # LocalStorage hook
│   │   ├── usePrevious.ts        # Previous value hook
│   │   ├── useMediaQuery.ts      # Media query hook
│   │   └── index.ts              # Named exports only
│   │
│   └── preset/                   # Panda CSS preset
│       ├── index.ts              # Preset export
│       └── config.ts             # Theme config
│
├── panda.config.ts               # Base Panda config for consumers
├── package.json                  # Package manifest
├── tsconfig.json                 # TypeScript config
├── tsup.config.ts                # Build config
├── README.md                     # Main documentation
└── CHANGELOG.md                  # Version history
```

---

## Import Patterns

### React (Block Component + Hooks + Global Types)

```tsx
import Block, { useDebounce, useThrottle, useMatchMedia } from "qstd/react";

// File types are global - no import needed!
function handleImage(file: ImageFile) {
  console.log(file.width, file.height);
}

<Block is="btn" bg="blue.500" p={4} br={8}>
  Click Me
</Block>;
```

### Client Utilities (Browser)

```ts
import * as Q from "qstd/client";

// Universal utilities
const xs = Q.List.create([1, 2, 3]);
const filtered = Q.List.filter(xs, (x) => x > 1);
const empty = Q.Dict.isEmpty({});

// Client-specific utilities
Q.Dom.scrollToTop();
Q.Storage.setLocalStorage("user", userData);
```

### Server Utilities (Node.js)

```ts
import * as Q from "qstd/server";

// Universal utilities (same as client)
const xs = Q.List.create([1, 2, 3]);
const sorted = Q.List.sort(xs);

// Server-specific utilities
const content = Q.Fs.readFile("path/to/file.txt");
const apiKey = Q.Env.readVar("API_KEY");
```

### React Module (Block + Hooks + Types)

```tsx
import Block, { useDebounce, useThrottle, useMatchMedia } from "qstd/react";

function SearchComponent() {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 500);
  const throttledInput = useThrottle(input, 300);
  const [isMobile] = useMatchMedia(["(max-width: 600px)"]);

  return (
    <Block
      is="input"
      value={input}
      onChange={(e) => setInput(e.target.value)}
    />
  );
}
```

### Panda CSS Preset

```ts
// panda.config.ts in consumer project
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  // IMPORTANT: Include base preset first to get Panda's default colors
  presets: ["@pandacss/dev/presets", qstdPreset],

  include: ["./src/**/*.{ts,tsx}"],

  // Extend with custom theme
  theme: {
    extend: {
      colors: {
        brand: { value: "#FF6B35" },
      },
    },
  },
});
```

**Note on qstd's internal panda.config.ts:**

The qstd package itself has a `panda.config.ts` with a **commented** include path:

```ts
include: [
  "./src/**/*.{ts,tsx,js,jsx}",
  // "./dist/**/*.{js,mjs}", // Uncomment to enable css() function within qstd package
],
```

**Purpose**: If you uncomment the dist path, it enables the `css()` function to work **inside** the qstd package itself. This allows you to use Panda CSS inline styles within the library code:

```ts
// Inside qstd/src/block/index.tsx
import { css } from "./dist/css";

const styles = css({ bg: "blue.500", p: 4 });
```

By default, this is commented out because most consumers won't need it. Only uncomment if you need to use Panda CSS utilities within the qstd source code itself.

---

## Tree-Shaking Verification

### How It Works

**Pattern:**

```
Source: export const fn = ...  (named exports)
   ↓
Re-export: export * as Namespace from './module'
   ↓
Consumer: import * as Q from "qstd/client"
   ↓
Usage: Q.List.create()
   ↓
Bundle: ONLY create() is included ✅
```

### Test Case 1: Single Function

```ts
import * as Q from "qstd/client";
const xs = Q.List.create();
```

**Bundle includes:**

- ✅ `List.create` only
- ❌ All other List functions eliminated
- ❌ Dict, String, Dom, Storage modules eliminated

### Test Case 2: Multiple Namespaces

```ts
import * as Q from "qstd/client";

const xs = Q.List.create([1, 2, 3]);
const empty = Q.Dict.isEmpty({});
Q.Dom.scrollToTop();
```

**Bundle includes:**

- ✅ `List.create` only
- ✅ `Dict.isEmpty` only
- ✅ `Dom.scrollToTop` only
- ❌ All other functions eliminated
- ❌ String, Storage modules eliminated

### Test Case 3: Multiple Functions from Same Namespace

```ts
import * as Q from "qstd/client";

const xs = Q.List.create([1, 2, 3]);
const first = Q.List.first(xs);
const mapped = Q.List.map(xs, (x) => x * 2);
```

**Bundle includes:**

- ✅ `List.create`
- ✅ `List.first`
- ✅ `List.map`
- ❌ All other List functions eliminated
- ❌ All other namespaces eliminated

**Verified in:**

- Rollup (Vite) ✅
- esbuild (SST) ✅
- Webpack 5+ ✅

---

## Module Specifications

### 1. Block Component (`qstd/block`)

**Purpose:** Polymorphic UI component that can assume any HTML element role with Panda CSS styling.

**Key Features:**

- Compound components (Accordion, Drawer, Menu, etc.)
- Full Panda CSS prop support
- Dark mode support
- Motion/animation support via Framer Motion
- TypeScript discriminated unions for type safety

**Dependencies:**

- React 18/19
- Framer Motion
- @floating-ui/react
- FontAwesome icons
- react-loader-spinner

**Example:**

```tsx
import Block from "qstd/block"

// Button
<Block is="btn" onClick={handleClick}>Click</Block>

// Input with label
<Block is="input" value={value} onChange={handleChange}>
  <Block.Input.Label>Email</Block.Input.Label>
</Block>

// Accordion
<Block is="accordion">
  <Block.Accordion.Item title="Section 1">
    Content here
  </Block.Accordion.Item>
</Block>
```

### 2. Shared Utilities (`qstd/shared`)

**Purpose:** Universal utilities that work in both browser and Node.js environments.

**Modules:**

#### List (Array utilities)

```ts
export const zipWith = <T extends readonly any[], R>(fn: (...args: T) => R, ...arrays: { [K in keyof T]: T[K][] }): R[]
export const create = <T>(size: number, fn?: (_: unknown, x: number) => T): T[]
export const partition = <T>(xs: T[], predicate: (x: T) => boolean): [T[], T[]]
export const chunk = <T>(list: T[], chunk_size: number): T[][]
```

#### Dict (Object utilities)

```ts
export const byteSizeOfObj = (o: any): number
export const filter = <R extends Record<string, unknown>>(r: R, predicate: (value: R[keyof R]) => boolean): R
export const transform = <R extends Record<string, unknown>>(r: R, transformFn: (key: keyof R, value: R[keyof R]) => Record<string, any>): R
export const partition = <R extends Record<string, unknown>>(r: R, predicate: (key: keyof R) => boolean): readonly [R, R]
export const exists = <O>(obj: O): boolean
export const isEmpty = <T extends Record<string, unknown>>(obj: T): boolean
export const pick = <R extends Record<string, unknown>, U extends keyof R>(r: R, paths: Array<U>): Pick<R, U>
export const omit = <R extends Record<string, any>, U extends keyof R>(r: R, paths: Array<U>): Omit<R, U>
// Note: Removed clone_deep, merge, and clone
```

#### Int (Number utilities)

```ts
export const clamp = (num: number, range: { min: number; max: number }): number
export const commaSeparateThousandths = (n: number | string): string
export const formatBytes = (bytes?: number, decimals?: number, binaryUnits?: boolean): { value: number; unit: string; display: string }
```

#### Money (Currency utilities)

```ts
export const convertToUsd = (cents?: number | string, opts?: { symbol?: boolean }): string | undefined
export const convertToCents = (dollars: string | number): number
```

#### Str (String utilities)

```ts
export const createSentences = (text?: string): string[]
export const countWords = (text: string): number
export const concat = (xs: (string | undefined)[], delimiter?: string): string
export const countChar = (str: string, ch: string): number // Renamed from 'count'
export const toCase = <T extends string>(text: string, opts: { to: 'title' | 'snake' | 'kebab'; clean?: boolean }): T
// Note: Removed between, normalize, json_to_install
```

#### Time (Date/time utilities)

```ts
// All functions from time/index.ts
// (See packages/shared/time/index.ts for full list - 445 lines)
```

#### Flow (Function control utilities)

```ts
export const throttle = (fn: any, ms: number): (...args: any[]) => void
export const debounce = <T extends any[]>(fn: (...args: T) => any, timeout: number): (...args: T) => void
export const sleep = (ms: number): Promise<void>
export const asyncPool = <T>(concurrency: number, iterable: T[], iterator_fn: (x: T, xs: T[]) => any): AsyncGenerator<any, void, unknown>
```

#### Random (Random generation utilities)

```ts
export const item = <T>(xs: T[]): T // Renamed from 'pickRandom'
export const num = (props?: { min?: number; max?: number }): number // Renamed from 'randv2'
export const shuffle = <T>(xs: T[]): T[]
export const coinFlip = (): boolean // Renamed from 'flip_coin'
export const date = (): Date // Renamed from 'rand_date'
export const hexColor = (): string // Renamed from 'rand_hex_color'
```

### 3. Client Utilities (`qstd/client`)

**Purpose:** Browser-specific utilities + all shared utilities.

**Re-exports:**

```ts
export * as List from "../shared/list";
export * as Dict from "../shared/dict";
export * as Str from "../shared/str";
export * as Int from "../shared/int";
export * as Money from "../shared/money";
export * as Time from "../shared/time";
export * as Flow from "../shared/flow";
export * as Random from "../shared/random";
```

**Client-only modules:**

#### Dom

```ts
export const getElement = (id: string): HTMLElement | null
export const querySelector = (selector: string): Element | null
export const querySelectorAll = (selector: string): NodeListOf<Element>
export const scrollToTop = (): void
export const scrollTo = (x: number, y: number): void
export const getScrollPosition = (): { x: number; y: number }
```

#### Storage

```ts
export const getLocalStorage = <T>(key: string): T | null
export const setLocalStorage = <T>(key: string, value: T): void
export const removeLocalStorage = (key: string): void
export const clearLocalStorage = (): void
export const getSessionStorage = <T>(key: string): T | null
export const setSessionStorage = <T>(key: string, value: T): void
```

#### Browser

```ts
export const copyToClipboard = (text: string): Promise<void>
export const readFromClipboard = (): Promise<string>
export const downloadFile = (data: Blob, filename: string): void
export const openInNewTab = (url: string): void
```

### 4. Server Utilities (`qstd/server`)

**Purpose:** Node.js-specific utilities + all shared utilities.

**Re-exports:**

```ts
export * as List from "../shared/list";
export * as Dict from "../shared/dict";
export * as Str from "../shared/str";
export * as Int from "../shared/int";
export * as Money from "../shared/money";
export * as Time from "../shared/time";
export * as Flow from "../shared/flow";
export * as Random from "../shared/random";
```

**Server-only modules:**

#### Fs

```ts
export const readFile = (path: string): string
export const writeFile = (path: string, content: string): void
export const appendFile = (path: string, content: string): void
export const deleteFile = (path: string): void
export const fileExists = (path: string): boolean
export const readDir = (path: string): string[]
export const createDir = (path: string): void
export const deleteDir = (path: string): void
```

#### Env

```ts
export const readVar = (key: string, fallback?: string): string
export const isProduction = (): boolean
export const isDevelopment = (): boolean
export const getNodeEnv = (): string
```

#### Path

```ts
export const join = (...paths: string[]): string
export const resolve = (...paths: string[]): string
export const dirname = (path: string): string
export const basename = (path: string): string
export const extname = (path: string): string
```

### 5. React Hooks (`qstd/react`)

**Purpose:** Reusable React hooks.

**Note:** Named exports ONLY (no default export) to ensure:

- ✅ ESLint Rules of Hooks work correctly
- ✅ Standard React convention
- ✅ Tree-shaking works perfectly

**Hooks:**

```ts
// useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T;

// useToggle.ts
export function useToggle(initialValue?: boolean): [boolean, () => void];

// useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void];

// usePrevious.ts
export function usePrevious<T>(value: T): T | undefined;

// useMediaQuery.ts
export function useMediaQuery(query: string): boolean;

// useClickOutside.ts
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
): void;

// useInterval.ts
export function useInterval(callback: () => void, delay: number | null): void;

// useTimeout.ts
export function useTimeout(callback: () => void, delay: number): void;
```

### 6. Panda CSS Preset (`qstd/preset`)

**Purpose:** Export all custom Panda CSS configurations from your `panda.config.ts`.

**Includes:**

- Custom utilities (`cols`, `rows`, `debug`, `flex`, `grid`, etc.)
- Custom conditions (`dark`, `hover`, `active`, etc.)
- Semantic tokens (colors, spacing)
- Custom keyframes (spin, sheen, pulse)
- Global CSS

**Export:**

```ts
// preset/index.ts
import type { Preset } from "@pandacss/dev";

export default {
  // All your panda.config.ts content exported as preset
  conditions: {
    /* ... */
  },
  utilities: {
    /* ... */
  },
  theme: {
    /* ... */
  },
  globalCss: {
    /* ... */
  },
} satisfies Preset;
```

---

## Build Configuration

### package.json

```json
{
  "name": "qstd",
  "version": "0.1.0",
  "description": "Standard Block component and utilities library with Panda CSS",
  "author": "malin1",
  "license": "MIT",
  "type": "module",
  "exports": {
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "node": {
        "import": "./dist/server/index.js",
        "require": "./dist/server/index.cjs"
      }
    },
    "./preset": {
      "types": "./dist/preset/index.d.ts",
      "import": "./dist/preset/index.js",
      "require": "./dist/preset/index.cjs"
    }
  },
  "files": ["dist", "panda.config.ts", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "panda codegen && tsup",
    "dev": "tsup --watch",
    "prepublishOnly": "pnpm build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@floating-ui/react": "^0.27.12",
    "@fortawesome/fontawesome-svg-core": "^7.0.0",
    "@fortawesome/free-brands-svg-icons": "^7.0.0",
    "@fortawesome/free-regular-svg-icons": "^7.0.0",
    "@fortawesome/free-solid-svg-icons": "^7.0.0",
    "@fortawesome/react-fontawesome": "^3.0.1",
    "framer-motion": "^12.15.0",
    "music-metadata-browser": "^2.5.11",
    "nanoid": "^5.1.5",
    "react-loader-spinner": "^6.1.6",
    "react-spinners": "^0.17.0"
  },
  "devDependencies": {
    "@pandacss/dev": "^1.2.0",
    "@types/react": "^19.1.12",
    "@types/react-dom": "^19.1.8",
    "@typescript-eslint/eslint-plugin": "^8.41.0",
    "@typescript-eslint/parser": "^8.41.0",
    "eslint": "^9.28.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.9.2",
    "vitest": "^3.1.4"
  },
  "keywords": [
    "react",
    "component",
    "ui",
    "panda-css",
    "utilities",
    "typescript",
    "hooks"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/qstd"
  },
  "bugs": {
    "url": "https://github.com/yourusername/qstd/issues"
  },
  "homepage": "https://github.com/yourusername/qstd#readme"
}
```

### tsup.config.ts

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "block/index": "src/block/index.tsx",
    "client/index": "src/client/index.ts",
    "server/index": "src/server/index.ts",
    "react/index": "src/react/index.ts",
    "preset/index": "src/preset/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
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
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

---

## Publishing Strategy

### Initial Setup (or when token expires after 90 days)

```bash
# 1. Login to npm (opens browser for authentication)
npm login

# 2. Complete browser authentication (Touch ID / security key)

# 3. Verify login
npm whoami
```

### Publishing Workflow

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new utility function"

# 2. Bump version in package.json
#    - patch: 0.3.8 → 0.3.9 (bug fixes)
#    - minor: 0.3.8 → 0.4.0 (new features)
#    - major: 0.3.8 → 1.0.0 (breaking changes)

# 3. Publish (requires OTP from email for 2FA)
pnpm publish --access public --no-git-checks --otp=YOUR_CODE
# Replace YOUR_CODE with the 6-digit code npm emails you

# 4. Push to git
git push
```

### AI-Assisted Publishing

When asking AI to publish, it will:

1. Bump the version in `package.json`
2. Run the publish command

You need to:

1. Be logged in to npm (`npm login` if token expired)
2. Provide the 6-digit OTP code from your email when prompted

### Pre-publish Checklist

- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] README.md up to date
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Build successful (`pnpm build`)
- [ ] No sensitive data in package

---

## Consumer Setup Guide

### 1. Installation

```bash
pnpm add qstd @pandacss/dev
```

### 2. Panda CSS Configuration

**Create or update `panda.config.ts`:**

```ts
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  preflight: true,

  // Use qstd preset - provides all custom utilities and tokens
  presets: [qstdPreset],

  // Only scan YOUR code - library is pre-compiled
  include: ["./src/**/*.{ts,tsx,js,jsx}"],

  exclude: [],

  outdir: "styled-system",
  jsxFramework: "react",

  // Extend with your custom theme
  theme: {
    extend: {
      colors: {
        brand: { value: "#FF6B35" },
      },
    },
  },
});
```

**Why you DON'T need to include `node_modules/qstd`:**

- The Block component is pre-compiled
- When you write `<Block bg="text-primary" />` in YOUR code, Panda scans YOUR code
- The preset provides the token definitions (`text-primary`, custom utilities, etc.)
- Panda generates CSS based on what YOU use, not what's in the library

### 3. Generate Panda CSS

```bash
panda codegen
```

### 4. Usage Examples

**Block Component:**

```tsx
import Block from "qstd/block";

function App() {
  return (
    <Block is="btn" bg="blue.500" color="white" p={4} br={8}>
      Click Me
    </Block>
  );
}
```

**Client Utilities:**

```ts
import * as Q from "qstd/client";

const items = Q.List.create([1, 2, 3, 4, 5]);
const doubled = Q.List.map(items, (x) => x * 2);
Q.Dom.scrollToTop();
```

**Server Utilities:**

```ts
import * as Q from "qstd/server";

const config = Q.Fs.readFile("./config.json");
const apiKey = Q.Env.readVar("API_KEY");
```

**React Hooks:**

```tsx
import { useDebounce, useToggle } from "qstd/react";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## Versioning Strategy

### Semantic Versioning (semver)

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Bug fixes, patches
  │     └─────── New features (backward compatible)
  └───────────── Breaking changes
```

### Examples

**PATCH (0.1.0 → 0.1.1):**

- Fix bug in `List.filter`
- Correct TypeScript types
- Update documentation
- Performance improvements

**MINOR (0.1.0 → 0.2.0):**

- Add new utility function `List.chunk`
- Add new React hook `useInterval`
- Add new Block variant
- Add new Panda CSS utility

**MAJOR (0.1.0 → 1.0.0 or 1.0.0 → 2.0.0):**

- Remove `alignC` utility from Panda config
- Rename Block prop
- Change function signature
- Remove deprecated API

### Consumer Version Control

```json
{
  "dependencies": {
    "qstd": "^0.1.0"   // Allow minor/patch updates
    "qstd": "~0.1.0"   // Allow patch updates only
    "qstd": "0.1.0"    // Exact version (locked)
  }
}
```

### Breaking Changes Process

1. **Announce** deprecation in current version
2. **Document** migration path in CHANGELOG
3. **Wait** at least one minor version
4. **Release** major version with breaking change
5. **Provide** migration guide in docs

---

## Migration Plan

### Phase 1: Repository Setup (Week 1)

- [ ] Create `qstd` repository on GitHub
- [ ] Initialize npm package structure
- [ ] Setup TypeScript configuration
- [ ] Configure tsup for building
- [ ] Setup git and .gitignore
- [ ] Create README.md template

### Phase 2: Shared Utilities (Week 1)

- [ ] Create `src/shared/` directory structure
- [ ] Implement `List` utilities (create, map, filter, etc.)
- [ ] Implement `Dict` utilities (isEmpty, keys, values, etc.)
- [ ] Implement `Str` utilities (capitalize, slugify, etc.)
- [ ] Implement `Num` utilities (clamp, random, round, etc.)
- [ ] Implement `Fn` utilities (debounce, throttle, once, etc.)
- [ ] Add TypeScript types for all functions
- [ ] Add basic tests for each utility

### Phase 3: Client & Server Modules (Week 1-2)

- [ ] Create `src/client/` directory
- [ ] Implement `Dom` utilities with browser checks
- [ ] Implement `Storage` utilities
- [ ] Implement `Browser` utilities
- [ ] Create `client/index.ts` with re-exports
- [ ] Create `src/server/` directory
- [ ] Implement `Fs` utilities with Node.js checks
- [ ] Implement `Env` utilities
- [ ] Implement `Path` utilities
- [ ] Create `server/index.ts` with re-exports
- [ ] Test tree-shaking locally

### Phase 4: Block Component Migration (Week 2)

- [ ] Copy all Block files from consumer-project
- [ ] Create `src/block/` directory
- [ ] Update all import paths (remove `panda/` references)
- [ ] Update to import from `qstd` internally if needed
- [ ] Verify all compound components work
- [ ] Test Block component builds correctly
- [ ] Generate TypeScript types

### Phase 5: React Hooks (Week 2)

- [ ] Create `src/react/` directory
- [ ] Implement `useDebounce` hook
- [ ] Implement `useToggle` hook
- [ ] Implement `useLocalStorage` hook
- [ ] Implement `usePrevious` hook
- [ ] Implement `useMediaQuery` hook
- [ ] Add tests for each hook
- [ ] Verify ESLint rules of hooks work

### Phase 6: Panda CSS Preset (Week 2)

- [ ] Create `src/preset/` directory
- [ ] Export Panda config as preset
- [ ] Copy `panda.config.ts` to package root
- [ ] Test preset in consumer project
- [ ] Verify all custom utilities work
- [ ] Verify dark mode works

### Phase 7: Build & Test (Week 3)

- [ ] Configure tsup for all entry points
- [ ] Build package locally
- [ ] Test tree-shaking with bundle analyzer
- [ ] Verify all exports work correctly
- [ ] Test in Vite project
- [ ] Test in Next.js project (if applicable)
- [ ] Run all tests
- [ ] Fix any type errors

### Phase 8: Documentation (Week 3)

- [ ] Write comprehensive README.md
- [ ] Document all Block variants
- [ ] Document all utility functions
- [ ] Document all React hooks
- [ ] Add usage examples
- [ ] Create CHANGELOG.md
- [ ] Setup documentation site (GitHub Pages/Vercel)

### Phase 9: Publishing (Week 3)

- [ ] Verify package.json is correct
- [ ] Test npm pack locally
- [ ] Publish v0.1.0 to npm
- [ ] Verify package installs correctly
- [ ] Test in fresh project

### Phase 10: Migrate consumer-project (Week 4)

- [ ] Install `qstd` in consumer-project client package
- [ ] Install `qstd` in consumer-project server package
- [ ] Update all Block imports to `import Block from "qstd/block"`
- [ ] Update panda.config.ts to use qstd preset
- [ ] Replace utility function imports with `qstd/client` or `qstd/server`
- [ ] Remove old Block component directory
- [ ] Run `panda codegen`
- [ ] Test entire application
- [ ] Fix any issues
- [ ] Deploy and verify in production

---

## Testing Strategy

### Unit Tests

**Shared Utilities:**

```ts
// shared/list.test.ts
import { create, map, filter } from "./list";

describe("List utilities", () => {
  test("create", () => {
    expect(create([1, 2, 3])).toEqual([1, 2, 3]);
    expect(create()).toEqual([]);
  });

  test("map", () => {
    expect(map([1, 2, 3], (x) => x * 2)).toEqual([2, 4, 6]);
  });

  test("filter", () => {
    expect(filter([1, 2, 3, 4], (x) => x > 2)).toEqual([3, 4]);
  });
});
```

**React Hooks:**

```tsx
// react/useDebounce.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  test("debounces value", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial"); // Not updated yet

    await waitFor(() => expect(result.current).toBe("updated"), {
      timeout: 600,
    });
  });
});
```

### Integration Tests

**Block Component:**

```tsx
import { render, screen } from "@testing-library/react";
import Block from "./block";

describe("Block component", () => {
  test("renders button variant", () => {
    render(<Block is="btn">Click Me</Block>);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  test("renders with Panda CSS props", () => {
    const { container } = render(
      <Block is="btn" bg="blue.500" p={4}>
        Test
      </Block>
    );
    // Verify CSS classes are applied
  });
});
```

### Tree-Shaking Tests

```bash
# Build package
pnpm build

# Create test consumer project
mkdir test-tree-shaking
cd test-tree-shaking
npm init -y
pnpm add ../qstd

# Create test file
echo "import * as Q from 'qstd/client'; console.log(Q.List.create())" > index.js

# Build with vite
pnpx vite build

# Analyze bundle
pnpx vite-bundle-visualizer
```

### Manual Testing Checklist

- [ ] Block component renders in browser
- [ ] All Block variants work (accordion, drawer, etc.)
- [ ] Panda CSS props apply correctly
- [ ] Dark mode toggles work
- [ ] Client utilities work in browser
- [ ] Server utilities work in Node.js
- [ ] Server utilities throw in browser
- [ ] Client utilities throw in Node.js
- [ ] React hooks work in React components
- [ ] ESLint catches hooks violations
- [ ] Tree-shaking eliminates unused code
- [ ] TypeScript types work correctly
- [ ] Autocomplete works in IDE

---

## Success Criteria

- [ ] Package published to npm successfully
- [ ] All exports work correctly (block, client, server, react, preset)
- [ ] Tree-shaking verified at function level
- [ ] consumer-project successfully migrated to use qstd
- [ ] No regressions in consumer-project functionality
- [ ] All Block variants work identically
- [ ] Full TypeScript support with no type errors
- [ ] Documentation complete and deployed
- [ ] Bundle size reasonable (Block < 200KB, utils < 50KB)
- [ ] Works in Vite, Next.js, and other modern bundlers

---

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Panda CSS Distribution Guide](https://panda-css.com/docs/guides/distributing-libraries)
- [Panda CSS Presets](https://panda-css.com/docs/customization/presets)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Semantic Versioning](https://semver.org/)
- [Tree-Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [ESLint Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)

---

## Appendix

### Example: Full Consumer Integration

```tsx
// app.tsx
import Block, { useDebounce, useMatchMedia } from "qstd/react";
import * as Q from "qstd/client";
import { useState } from "react";

export default function App() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isMobile] = useMatchMedia(["(max-width: 600px)"]);

  const items = Q.List.create(5, (_, i) => i + 1);
  const chunks = Q.List.chunk(items, 2);

  return (
    <Block grid rowG={4} p={6}>
      <Block
        is="input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={isMobile ? "Search" : "Search..."}
      />

      {chunks.map((chunk, i) => (
        <Block key={i} flex gap={2}>
          {chunk.map((item) => (
            <Block key={item} p={2} bg="blue.100">
              {item}
            </Block>
          ))}
        </Block>
      ))}
    </Block>
  );
}
```

### Panda CSS: Why Preset is Enough

**The preset provides:**

- ✅ Custom utility definitions (cols, rows, debug, etc.)
- ✅ Token definitions (colors, spacing, etc.)
- ✅ Conditions (\_dark, \_hover, etc.)
- ✅ Theme configuration

**Consumer's Panda build:**

- Scans consumer's code for Panda usage
- Generates CSS for what consumer uses
- Uses preset to understand token meanings

**Library's pre-compiled components:**

- Already compiled with their own Panda build
- Styled components accept props at runtime
- Don't need to be scanned again

**Result:** Consumer can use `<Block bg="text-primary" />` because:

1. Their code is scanned
2. Preset defines what `text-primary` means
3. CSS is generated for their usage

---

_Document Version: 2.1_  
_Last Updated: January 2025_  
_Package Name: qstd_

---

## Global Type Augmentation (v0.1.0)

### How It Works

When consumers install qstd and import from `qstd/react`, TypeScript automatically loads the type definitions which include global type augmentations:

```ts
declare global {
  interface File {
    preview?: string;
    id?: string;
  }

  interface ImageFile extends File {
    id: string;
    preview: string;
    orientation: "landscape" | "portrait" | "square";
    height: number;
    width: number;
  }

  interface AudioFile extends File {
    /* ... */
  }
  interface VideoFile extends File {
    /* ... */
  }
  type MediaFile = File | ImageFile | AudioFile;
}
```

### Consumer Usage

**No import needed!** Types are automatically available:

```tsx
import Block from "qstd/react";

// ImageFile is global - just use it!
function handleImage(file: ImageFile) {
  console.log(file.width, file.height, file.orientation); // ✅ All typed
}

// File interface is augmented
function handleFile(file: File) {
  if (file.preview) {
    // ✅ TypeScript knows about preview
    console.log(file.preview);
  }
}
```

### Single Source of Truth

All global types defined once in `src/block/types.ts` and automatically distributed via `dist/react/index.d.ts`.

---

_Document Version: 2.2_  
_Last Updated: October 2, 2025_  
_Package Name: qstd_
