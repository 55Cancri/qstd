# qstd Playground

Interactive playground showcasing all Block component variants and utilities.

## Setup

```bash
cd playground

# Install dependencies
pnpm install

# Generate Panda CSS
pnpm panda codegen

# Start dev server
pnpm dev
```

Visit: http://localhost:3457

## Important Files

**postcss.config.cjs** - REQUIRED for Panda CSS to work:

```js
module.exports = {
  plugins: {
    "@pandacss/dev/postcss": {},
  },
};
```

**panda.config.ts** - Consumer setup (how external apps use qstd):

```ts
import qstdPreset from "qstd/preset";

export default defineConfig({
  presets: ["@pandacss/dev/presets", qstdPreset],

  // CRITICAL: Scan both playground source AND qstd's built dist files
  include: ["./src/**/*.{ts,tsx}", "./node_modules/qstd/dist/**/*.{js,mjs}"],
});
```

**Why scan dist files?**

- Playground consumes qstd like a real external app would
- Panda extracts Block's internal Panda CSS props from built files
- No duplicate styles or conflicts
- Works identically for all consumers

## What's Included

Visual examples of:

- ✅ Buttons (default, primary, loading, disabled)
- ✅ Inputs (text, email, with labels, with errors)
- ✅ Textarea
- ✅ Checkbox
- ✅ Switch
- ✅ Radio buttons
- ✅ Progress bars (with animations)
- ✅ Accordion
- ✅ Tooltips (all placements)
- ✅ Icons (with colors, sizes, spin)
- ✅ Grid & Flex layouts
- ✅ Search with debounce
- ✅ Dark mode toggle
- ✅ Responsive (useMatchMedia)

## Adding Examples

Edit `src/App.tsx` to add more examples.

## Building for Production

```bash
pnpm build
pnpm preview  # Preview production build
```
