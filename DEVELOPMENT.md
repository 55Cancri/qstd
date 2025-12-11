# qstd Development & Maintenance Guide

> **START HERE** if you're coming back to this project after a break

---

## 🏗️ Build System Architecture

> **READ THIS FIRST** if you're confused about why the build is set up this way

### The Problem We Solved

The build uses **two tools** for a specific reason:

```
Source Code (.ts) ──┬──▶ tsup ──▶ JavaScript (.js, .cjs)
                    │
                    └──▶ tsc  ──▶ Type Definitions (.d.ts)
```

**Why not let tsup do both?**

tsup uses `rollup-plugin-dts` to bundle TypeScript declaration files. This works for simple packages, but has a **critical bug**: function overloads are lost when re-exported through namespaces.

### The Bug (Real Example)

```ts
// src/shared/str.ts - parseJson has two overloaded signatures
export function parseJson<T>(input: string, opts: { strict: true }): T;
export function parseJson<T>(
  input: string,
  opts?: { strict?: false }
): ParseJsonResult<T>;

// src/server/index.ts - re-exports as namespace
export * as Str from "../shared/str";

// Consumer code
import { Str } from "qstd/server";
const data = Str.parseJson<MyType>(json, { strict: true });
//    ^^^^ TypeScript shows `error` type instead of `MyType`!
```

When tsup bundles the .d.ts files, it transforms the namespace export in a way that loses the overload information. The consumer gets broken types.

### The Solution

**Use `tsc` for type generation.** The TypeScript compiler will ALWAYS generate correct types because it IS TypeScript. No third-party bundler bugs.

```bash
# What the build script does:
panda codegen      # Generate Panda CSS utilities
panda cssgen       # Generate CSS file
tsup               # Bundle JavaScript (fast, tree-shakes, ESM + CJS)
tsc -p tsconfig.build.json  # Generate .d.ts files (correct overloads)
node scripts/inject-css-import.js  # Post-processing
```

### Why tsup At All?

tsup (powered by esbuild) is still essential for JavaScript:

| Feature               | tsc             | tsup           |
| --------------------- | --------------- | -------------- |
| Compile TS → JS       | ✅              | ✅             |
| Bundle files together | ❌              | ✅             |
| Output ESM + CJS      | ❌ (one format) | ✅             |
| Tree-shaking          | ❌              | ✅             |
| Speed                 | Slow            | 10-100x faster |
| Handle externals      | ❌              | ✅             |

**Bottom line:** tsup for fast JS bundling, tsc for correct types.

### File Structure After Build

```
dist/
├── server/
│   ├── index.js          # tsup output (bundled JS)
│   ├── index.cjs         # tsup output (CommonJS)
│   ├── index.d.ts        # tsc output (imports from ../shared/str)
│   └── file.d.ts         # tsc output
├── shared/
│   ├── str.d.ts          # tsc output (has correct overloads!)
│   ├── list.d.ts         # tsc output
│   └── ...
├── client/
│   └── ...
└── react/
    └── ...
```

**Note:** There are more .d.ts files than before (they mirror src/ structure). But:

- Consumers don't see them (package.json exports control what's importable)
- Types are guaranteed correct
- No maintenance burden - just write TypeScript normally

### Key Files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `tsup.config.ts`      | JavaScript bundling config. **dts: false** because we use tsc |
| `tsconfig.json`       | IDE/linting config. Has `noEmit: true`                        |
| `tsconfig.build.json` | Build config. Extends base, enables `emitDeclarationOnly`     |

### When Adding New Features

**Just write TypeScript normally.** The build handles everything:

- Function overloads ✅ work
- Generic constraints ✅ work
- Conditional types ✅ work
- Mapped types ✅ work
- `export * as Namespace` ✅ work

No special rules to remember. If TypeScript compiles it, the types will be correct.

---

## 🚀 Quick Start: I Want to Add Something

### 1. Get Re-oriented (30 seconds)

```bash
cd qstd

# Check current version
cat package.json | grep version

# Verify build works
pnpm install
pnpm build

# ✅ If build succeeds, you're ready!
```

### 2. Make Your Change (varies)

**Adding a new shared utility function:**

```bash
# Add to appropriate file in src/shared/
# Example: Adding List.map()
nano src/shared/list.ts

# Add your function:
export const map = <T, U>(xs: T[], fn: (x: T) => U): U[] => xs.map(fn);

# Test it compiles
pnpm build
```

**Adding a new client utility:**

```bash
# Add to src/client/dom.ts (or create new file)
nano src/client/dom.ts

# If new file, export from src/client/index.ts:
export * as NewModule from "./new-module";
```

**Adding a new React hook:**

```bash
# Add to src/react/index.ts
# Keep named exports only!
export function useMyHook() { /* ... */ }
```

**Updating Block component:**

```bash
# Files are in src/block/
# Main component: src/block/index.tsx
# Variants: src/block/accordion.tsx, drawer.tsx, etc.
```

### 3. Test Locally in Playground (2 minutes)

The playground directory has a symbolic link to the root package, so you can test changes locally before publishing:

```bash
# In root directory: Build your changes
pnpm build

# OR run in watch mode (auto-rebuilds on changes)
pnpm dev

# In another terminal, navigate to playground
cd playground

# Regenerate Panda CSS to pick up preset changes
pnpm prepare   # Runs 'panda codegen'

# Run the playground dev server
pnpm dev

# Test your changes in the browser
# Make changes → rebuild → refresh browser
```

**Note:** The playground uses a symbolic link (`"qstd": "link:.."` in playground/package.json), so changes to the root package are immediately available after rebuilding.

### 4. Version & Publish (1 minute)

```bash
# Commit your changes
git add .
git commit -m "feat: add new utility function"

# Bump version (choose one):
pnpm version patch   # 0.1.0 → 0.1.1 (bug fix)
pnpm version minor   # 0.1.0 → 0.2.0 (new feature)
pnpm version major   # 0.1.0 → 1.0.0 (breaking change)

# This auto-updates package.json and creates git tag

# Build & publish
pnpm build
pnpm publish --access public

# Push to GitHub
git push --follow-tags
```

### 5. Install in Your Main App (2 minutes)

```bash
cd /path/to/your-project

# Update to latest
pnpm update qstd

# Or specific version
pnpm add qstd@0.1.1

# Verify it works
pnpm build
```

**Done!** ✅

---

## 📚 Common Tasks

### Add a New Shared Utility

```bash
# 1. Edit the module file
nano src/shared/list.ts

# 2. Add function with JSDoc comment
/**
 * Map array to new array
 * @param xs
 * @param fn
 * @returns
 */
export const map = <T, U>(xs: T[], fn: (x: T) => U): U[] => xs.map(fn);

# 3. Build & verify
pnpm build

# 4. Publish (see versioning above)
```

### Add a New Hook

```bash
# 1. Edit src/react/index.ts
nano src/react/index.ts

# 2. Add hook (named export!)
export function useMyHook(value: string) {
  const [state, setState] = useState(value);
  return state;
}

# 3. Build & test
pnpm build
```

### Update Panda Preset

```bash
# 1. Edit panda.config.ts
nano panda.config.ts

# 2. Regenerate styled-system
pnpm panda codegen

# 3. Update src/preset/index.ts to match
nano src/preset/index.ts

# 4. Build
pnpm build
```

### Update Block Component

```bash
# Main component
nano src/block/index.tsx

# Or specific variant
nano src/block/accordion.tsx
nano src/block/drawer.tsx
# etc.

# Build
pnpm build
```

---

## 🔍 Package Structure Quick Reference

```
qstd/
├── src/
│   ├── shared/       # List, Dict, Int, Money, Str, Time, Flow, Random
│   ├── client/       # index.ts (re-exports shared), dom.ts
│   ├── server/       # index.ts (re-exports shared), file.ts
│   ├── react/        # index.ts (Block + hooks + types)
│   ├── block/        # Block component files
│   └── preset/       # Panda preset
│
├── tests/            # Test files (not published)
├── styled-system/    # Auto-generated by Panda (not published)
└── dist/             # Built output (published)
```

---

## 🤔 FAQ

### Q: Which file do I edit to add a function to List?

**A:** `src/shared/list.ts`

Both client and server re-export it automatically via their `index.ts`.

### Q: How do I test my changes locally before publishing?

**A:** Two ways:

1. **Test utilities (no build needed):**

   ```bash
   # Test all utilities directly from source
   pnpm test:all
   # Or manually:
   pnpx tsx tests/test-all.ts
   ```

2. **Link to your project:**
   ```bash
   cd /path/to/your-project
   pnpm add /path/to/qstd
   # Test in your app
   ```

### Q: What version should I use?

**Patch** (0.1.0 → 0.1.1):

- Bug fixes
- Typos in documentation
- Performance improvements (no API changes)

**Minor** (0.1.0 → 0.2.0):

- New functions added (e.g., `List.map`)
- New hooks added (e.g., `useToggle`)
- New Panda CSS props/utilities (e.g., adding `autoCols`)
- Changing how existing Panda prop works WITHOUT changing signature
  - Example: `debug="blue"` produces slightly different shade
  - Code still works, just visual/behavior change

**Major** (0.1.0 → 1.0.0):

- Removing functions (e.g., removing `List.chunk`)
- Changing function signatures (e.g., `clamp(num, range)` → `clamp(num, min, max)`)
- Removing Panda CSS props (e.g., removing `alignC` utility)
- Drastically changing Panda prop syntax (e.g., `cols` now expects different format)
- Any change that would break existing consumer code

### Q: Do I need to update the PRD?

**A:** Only for major architectural changes. For adding individual functions, update:

- The function itself
- CHANGELOG.md
- README.md if it's a significant feature

### Q: I forgot how imports work

**A:**

```ts
// React stuff
import Block, { useDebounce, ImageFile } from "qstd/react";

// Browser
import * as Q from "qstd/client";
Q.List.create(10);

// Node.js
import * as Q from "qstd/server";
Q.File.readFile("file.txt");
```

### Q: How do I know if tree-shaking still works?

**A:**

```bash
cd tests
echo "import * as Q from 'qstd/client'; console.log(Q.List.create(5));" > test-tree.js
pnpx vite build test-tree.js
# Check bundle size - should only include List.create
```

### Q: Build failed - what do I do?

**A:**

```bash
# Check TypeScript errors
pnpm typecheck

# Check if styled-system needs regeneration
rm -rf styled-system
pnpm panda codegen

# Clean rebuild
rm -rf dist
pnpm build

# If types are broken, rebuild just types:
pnpm build:types
```

### Q: Why are there so many .d.ts files in dist/?

**A:** We use `tsc` (not tsup) to generate declaration files. This creates a .d.ts file for each source file instead of bundling them. This is intentional - it guarantees correct types for complex TypeScript features like function overloads.

Consumers don't see these files - they import from `qstd/server`, `qstd/client`, etc. which are controlled by package.json exports.

See the "Build System Architecture" section at the top of this file for the full explanation.

### Q: Can I use function overloads in qstd?

**A:** Yes! Just write them normally. The build system handles them correctly.

```ts
// This works perfectly:
export function myFunc(x: string): string;
export function myFunc(x: number): number;
export function myFunc(x: string | number) {
  return x;
}
```

We specifically set up the build to use `tsc` for types because tsup's DTS bundler had bugs with overloads.

### Q: How do I add a dependency?

**A:**

```bash
# Add to qstd
pnpm add some-package

# If it's only for Block component, add to external in tsup.config.ts
nano tsup.config.ts
# Add "some-package" to the external array
```

---

## 📋 Pre-Publish Checklist

Before running `pnpm publish`:

- [ ] `pnpm build` succeeds
- [ ] `pnpx tsc --noEmit` passes
- [ ] Test utilities: `pnpm test:all`
- [ ] Test Block build: `pnpm test:block` (after build)
- [ ] CHANGELOG.md updated
- [ ] Version bumped (`pnpm version patch/minor/major`)
- [ ] Git committed
- [ ] Tested locally in your project (optional but recommended)

---

## 🎯 Publishing Workflow

### First Time Setup (or when token expires)

npm requires login and 2FA. Tokens expire after 90 days.

```bash
# 1. Login to npm (opens browser for authentication)
npm login

# 2. Complete the browser authentication (Touch ID / security key)

# 3. Verify you're logged in
npm whoami
```

### Every Update

```bash
# 1. Make changes
# 2. Update CHANGELOG.md
# 3. Commit
git add .
git commit -m "feat: add List.map function"

# 4. Bump version in package.json (choose one)
#    - patch: 0.3.8 → 0.3.9 (bug fixes)
#    - minor: 0.3.8 → 0.4.0 (new features)
#    - major: 0.3.8 → 1.0.0 (breaking changes)

# 5. Publish (requires OTP from email for 2FA)
pnpm publish --access public --no-git-checks --otp=YOUR_CODE
#    Replace YOUR_CODE with the 6-digit code npm emails you

# 6. Push
git push --follow-tags
```

### AI-Assisted Publishing

When asking AI to publish, it can:

1. Bump the version in `package.json`
2. Run the publish command

But **you** need to:

1. Be logged in to npm (`npm login` if token expired)
2. Provide the 6-digit OTP code from your email when prompted

### Verify It Worked

```bash
npm view qstd version

# In another project
pnpm add qstd@latest
```

---

## 🛠️ Troubleshooting

### "Module not found" in consumer

```bash
# Check package.json exports are correct
cat package.json | grep -A 20 exports

# Rebuild
pnpm build
```

### Types not working in consumer

```bash
# Verify .d.ts files exist
ls -lh dist/react/index.d.ts
ls -lh dist/client/index.d.ts
ls -lh dist/shared/str.d.ts  # Should exist (tsc generates per-file)

# Check if global types are in react types
grep "declare global" dist/react/index.d.ts

# Rebuild types only
pnpm build:types

# Full clean rebuild
rm -rf dist && pnpm build
```

### Function overloads not resolving in consumer

This should NOT happen anymore. We use `tsc` for declaration generation specifically to fix this. If you see this:

```bash
# 1. Make sure you're on latest qstd version
pnpm view qstd version

# 2. Verify dist/shared/ has individual .d.ts files (not bundled)
ls dist/shared/

# 3. If bundled (single chunk file like log-xxx.d.ts), rebuild:
rm -rf dist && pnpm build
```

### Panda CSS not working

```bash
# Regenerate styled-system
pnpm panda codegen

# Rebuild
pnpm build

# In consumer project, update panda config:
# presets: [qstdPreset]
```

---

## 💡 Tips

1. **Test locally first** - Use `pnpm add /path/to/qstd` in your project before publishing
2. **Use tests/** - Keep test files there, run with `pnpx tsx`
3. **Read SUMMARY.md** - Has complete function list
4. **Check READY.md** - Quick reference of current state
5. **Global types auto-apply** - No consumer import needed for ImageFile, etc.

---

## 🎊 You've Got This!

Remember:

- ✅ Bump version in `package.json`
- ✅ Publish: `pnpm publish --access public --no-git-checks --otp=CODE`
- ✅ Push: `git push`

**First time / token expired?** Run `npm login` first (opens browser, use Touch ID).

That's it! 🚀

---

## 🎨 Using qstd in a Consumer Project (Panda CSS Setup)

### Critical Requirements

**1. PostCSS Configuration** (REQUIRED):

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    "@pandacss/dev/postcss": {},
  },
};
```

**Without this file:** Block components render but have NO STYLES!

**2. Panda Config with Base Preset and jsxFramework** (REQUIRED):

```ts
// panda.config.ts
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  preflight: true,

  // CRITICAL: Must include base preset for default colors
  presets: ["@pandacss/dev/presets", qstdPreset],

  // Scan your source code
  include: ["./src/**/*.{ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  outdir: "styled-system",

  // REQUIRED: Enables Panda CSS to detect props on Block component
  // Without this, styles like bg="red" won't generate CSS utilities
  jsxFramework: "react",
});
```

**⚠️ CRITICAL:** The `jsxFramework: "react"` setting is **required** for the Block component to work. Without it, Panda CSS cannot detect style props like `bg="red"` on external components, and no CSS utilities will be generated.

**3. CSS File with Layers**:

```css
/* src/index.css */
@layer reset, base, tokens, recipes, utilities;

/* Your custom styles */
```

**4. Import CSS in main.tsx**:

```tsx
import "./index.css";
```

### Troubleshooting: Styles Not Applying

**Symptom:** Block components render, classes applied (like `bg_red`, `m_0`), but no visual styles

**Primary Cause:** Missing `jsxFramework: "react"` in panda.config.ts

**Fix:** Add `jsxFramework: "react"` to your Panda config and run `panda codegen`

**Secondary Cause:** PostCSS not configured

**Fix:** Ensure `postcss.config.cjs` exists with Panda plugin

**Verify it's working:**

```tsx
<Block bg="red" debug>
  Test
</Block>
```

Should show red background and debug border. If not:

1. Check `jsxFramework: "react"` is in panda.config.ts
2. Run `pnpm prepare` (or `panda codegen`) to regenerate
3. Restart dev server
4. Check PostCSS config exists
