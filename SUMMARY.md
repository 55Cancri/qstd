# qstd v0.1.0 - Package Summary

## ✅ Complete & Ready for Publishing

---

## Package Overview

**qstd** is a single npm package (not a monorepo) with multiple entry points for different environments.

**Single install:** `pnpm add qstd`

**Multiple imports:**

- `import Block, { useDebounce, ImageFile } from "qstd/react"` - Block + hooks + types
- `import * as Q from "qstd/client"` - Browser utilities
- `import * as Q from "qstd/server"` - Node.js utilities
- `import qstdPreset from "qstd/preset"` - Panda CSS preset

---

## 📦 What's Included

### qstd/client (Browser)

**8 Shared Modules** (32 functions total):

- **List** (4): zipWith, create, partition, chunk
- **Dict** (8): byteSizeOfObj, filter, transform, partition, exists, isEmpty, pick, omit
- **Int** (3): clamp, commaSeparateThousandths, formatBytes
- **Money** (2): convertToUsd, convertToCents
- **Str** (5): createSentences, countWords, concat, countChar, toCase
- **Time** (full): All date/time utilities (445 lines)
- **Flow** (4): throttle, debounce, sleep, asyncPool
- **Random** (6): item, num, shuffle, coinFlip, date, hexColor

**Dom Module** (9 functions):

- `getElement(id)`, `querySelector(selector)`, `querySelectorAll(selector)`
- `scrollToTop()`, `scrollTo(x, y)`, `getScrollPosition()`
- `isInViewport(el)`, `scrollIntoView(el, options?)`
- `copy(text)` - Copy to clipboard

### qstd/server (Node.js)

**8 Shared Modules** (same 32 functions as client)

**File Module** (1 function):

- `readFile(filePath, encoding?)` - Read file contents

### qstd/react

**3 Hooks** (exact implementations from gpt-v2):

- `useDebounce(value, delay?)` - Debounce string value
- `useThrottle(value, interval?)` - Throttle string value
- `useMatchMedia(queries, defaults?)` - Match multiple media queries

### qstd/preset

**Complete Panda CSS preset** from gpt-v2:

- Custom utilities: grid, flex, cols, rows, debug, shortcuts (h, w, p, br, etc.)
- Custom conditions: \_dark, \_hover, \_active, radio states, etc.
- Semantic tokens: text colors, input colors
- Keyframes: spin, sheen, pulse

### qstd/block

**Complete Block component** (140KB):

- All 11 compound components: Accordion, Checkbox, Drawer, Icon, Input, Menu, Progress, Radio, Switch, Textarea, Tooltip
- Full Panda CSS prop support
- Dark mode support
- All helper functions and types

---

## 📊 Bundle Sizes

| Export | Size  | Content                       |
| ------ | ----- | ----------------------------- |
| block  | 140KB | Full component + all variants |
| client | 18KB  | 8 shared modules + Dom        |
| server | 17KB  | 8 shared modules + File       |
| react  | 2.3KB | 3 hooks                       |
| preset | 12KB  | Panda configuration           |

**Total**: ~189KB (tree-shaking eliminates unused code)

---

## 🎯 Key Features

### Single Package, Multiple Contexts

Both client and server export the **same shared utilities**, just with different environment-specific additions.

### Tree-Shaking

Only used functions are bundled:

```ts
import * as Q from "qstd/client";
Q.List.create(10); // ← Only create() is bundled
```

### Type Safety

TypeScript prevents using server code in browser and vice versa.

### Proper Panda CSS Integration

- Package generates `styled-system/` with `panda codegen`
- Block component uses `panda/*` imports (resolved via tsconfig paths)
- Consumers use the preset in their `panda.config.ts`

---

## 💡 Usage Examples

### Client (Browser)

```ts
import * as Q from "qstd/client";

// List operations
const arr = Q.List.create(10, (_, i) => i + 1);
const chunks = Q.List.chunk(arr, 3);
const [even, odd] = Q.List.partition(arr, (x) => x % 2 === 0);

// Random utilities
const color = Q.Random.hexColor();
const num = Q.Random.num({ min: 1, max: 100 });

// DOM operations
Q.Dom.scrollToTop();
Q.Dom.copy("text to clipboard");

// Formatting
const formatted = Q.Int.formatBytes(1234567);
const money = Q.Money.convertToUsd(12345);
```

### Server (Node.js)

```ts
import * as Q from "qstd/server";

// Same shared utilities as client
const chunks = Q.List.chunk(items, 100);
const price = Q.Money.convertToCents("$123.45");

// File operations
const config = Q.File.readFile("./config.json");
```

### React Hooks

```tsx
import { useDebounce, useThrottle, useMatchMedia } from "qstd/react";

function SearchComponent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const throttledSearch = useThrottle(search, 300);

  const [isMobile, isTablet, isDesktop] = useMatchMedia([
    "(max-width: 600px)",
    "(min-width: 601px) and (max-width: 1024px)",
    "(min-width: 1025px)",
  ]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder={isMobile ? "Search" : "Search here..."}
    />
  );
}
```

### Block Component

```tsx
import Block from "qstd/block";

<Block is="btn" bg="blue.500" p={4} br={8} onClick={handleClick}>
  Click Me
</Block>

<Block is="input" value={value} onChange={handleChange}>
  <Block.Input.Label>Email</Block.Input.Label>
</Block>

<Block is="accordion">
  <Block.Accordion.Item title="Section 1">
    Content here
  </Block.Accordion.Item>
</Block>
```

### Panda Preset

```ts
// panda.config.ts in consumer project
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  // CRITICAL: Must include base preset to get default colors (neutral, red, blue, etc.)
  presets: ["@pandacss/dev/presets", qstdPreset],

  include: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      // Your custom theme
    },
  },
});
```

---

## 🚀 Publishing

### Command

```bash
cd qstd

# Final build
pnpm build

# Publish to npm
npm publish --access public
```

### After Publishing

```bash
# In gpt-v2 or any project
pnpm add qstd

# Use it
import * as Q from "qstd/client";
import Block from "qstd/block";
import { useDebounce } from "qstd/react";
```

---

## 📚 Documentation

- `README.md` - Quick start guide (101 lines)
- `QSTD_PACKAGE_PRD.md` - Complete specification (1345 lines)
- `PUBLISH.md` - Publishing guide
- `CHANGELOG.md` - Version history
- `SUMMARY.md` - This file

---

**Version**: 0.1.0  
**Status**: ✅ Complete & Ready  
**Date**: October 2, 2025  
**Next**: `npm publish --access public` 🚀
