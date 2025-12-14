# Atomic Modules

A compact module structure that keeps concerns clear and greppable. Each module is "atomic": small, focused, and split into predictable files.

**Core principle:** Simplicity through consistency. Complexity is managed by predictable patterns, not eliminated by clever abstractions.

> **Updating this document:** Blend new guidance into existing sections when possible. Only create new sections when content truly doesn't fit elsewhere. Enhance rather than expand.

## Module anatomy

**Only `index.ts` is required.** All other files are optional and added as needed:

- `index.ts`: **[REQUIRED]** orchestrates and exports the module's public API
- `types.ts`: **[OPTIONAL]** shared types and interfaces
- `literals.ts`: **[OPTIONAL]** constants and tunables
- `fns.ts`: **[OPTIONAL]** pure helper functions/utilities
- `domain.ts`: **[OPTIONAL]** business/domain logic orchestrator; wraps specialized modules with instrumentation, error handling, and business rules
- **Specialized modules**: **[OPTIONAL]** `ast.ts`, `parser.ts`, `compiler.ts`, `tokenize.ts`, etc. - focused implementations for complex features

**For small modules:** Just put everything in `index.ts` (or `index.tsx` for components). The atomic structure is useful for complex features, not simple utilities.

**When to split into specialized modules:** When you have a complex feature (like a parser, compiler, or state machine) with 500+ lines of logic:

- Split into focused modules: `ast.ts`, `parse-blocks.ts`, `parse-inline.ts`, `tokenize.ts`, etc.
- Use `domain.ts` as the orchestrator (adds debugging, error handling, business rules)
- **Skip `fns.ts`** - it's redundant when you have specialized modules
- Each specialized module should be self-contained and focused on one responsibility

**When to use fns.ts:** Only when you have a moderate amount of logic (< 500 lines) that fits in one file. If your logic is complex enough to need multiple specialized modules, skip `fns.ts` and use `domain.ts` or `index.ts` as the orchestrator.

### Keep things where they belong

**If a file already exists, use it.** Don't define types in `fns.ts` if `types.ts` exists. Don't put constants in `domain.ts` if `literals.ts` exists.

```typescript
// ❌ BAD: Defining types in fns.ts when types.ts exists
// fns.ts
export interface InsertionPoint { ... }  // Why is this here?
export function insertMediaBlock(...) { ... }

// ✅ GOOD: Types in types.ts, functions in fns.ts
// types.ts
export interface InsertionPoint { ... }

// fns.ts
import * as _t from "./types";
export function insertMediaBlock(content: _t.ContentBlock[], point: _t.InsertionPoint, ...) { ... }
```

**The rule:** Once you've split a module into separate files, respect that structure. Each file has a purpose:

- Types/interfaces → `types.ts`
- Constants/config → `literals.ts`
- Pure functions → `fns.ts`
- Business logic → `domain.ts`

**Exceptions:**

- Small modules can keep everything in `index.ts` until they grow
- Inline function argument types are fine (see Function arguments section)

### Component & Hook Exports

- **Components:** Export as default function statements.
  ```tsx
  export default function Recorder() { ... }
  ```
- **Hooks:** Export as default function statements.
  ```ts
  export default function useAudioRecorder() { ... }
  ```
- **Filenames:** Always lowercase kebab-case, matching the export where possible.
  - Import example: `import Recorder from "components/molecules/recorder"`

### Internal module imports

**Use namespace imports with underscore prefixes** for internal modules:

```ts
// Standard module imports (always these prefixes)
import * as _d from "./domain";
import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

// Specialized module imports (use descriptive underscore prefix)
import * as _ast from "./ast";
import * as _parser from "./parser";
```

**Why namespace imports with underscores:**

- **Greppable**: Easy to find all uses of a module (search for `_ast.`)
- **Refactor-safe**: Change internal structure without breaking imports
- **No naming conflicts**: `_ast` never conflicts with other imports
- **Clear boundaries**: Easy to see what's from which module

**Rules:**

- ❌ **NEVER destructure imports from internal modules**: `import { parse } from "./parser"`
- ✅ **ALWAYS use namespace imports**: `import * as _parser from "./parser"`
- Standard prefixes: `_t` (types), `_l` (literals), `_f` (fns), `_d` (domain)

### Re-exports in index.ts

**Default to bulk exports.** Use `export * from` unless you need to hide internals:

```ts
// ✅ GOOD: Bulk exports (default for most modules)
export type * from "./types";
export * from "./literals";
export * from "./fns";

// ✅ GOOD: Selective exports (when some things are private)
export type { Token, AST } from "./types"; // Only public types
export { parse, compile } from "./fns"; // Only public functions
```

**When to use selective exports:**

- Module has internal-only types/functions not meant for consumers
- You're intentionally limiting the public API surface
- Performance concerns (tree-shaking complex modules)

**When to use bulk exports:**

- All types/functions are meant for public consumption
- You want flexibility to add exports without updating index.ts
- Early development when the API is still evolving

## Path aliases: Always use them

**Never use relative paths with `../`.** Always use path aliases configured in tsconfig.json.

```typescript
// ✅ GOOD: Path aliases
import * as Entry from "entities/entry";
import useMediaUpload from "hooks/use-media-upload";
import * as Recording from "storage/recording";

// ❌ AVOID: Relative paths
import * as Entry from "../../entities/entry";
import useMediaUpload from "../use-media-upload";
import * as Recording from "../../../storage/recording";
```

**Why path aliases?**

- **Refactor-safe**: Move files without updating imports
- **Readable**: Clear where things come from
- **Consistent**: Same import path from anywhere in the codebase
- **Shorter**: No counting `../` levels

### Two-segment import rule

Keep imports to two segments max. Express complexity through dot notation, not deeper paths.

```typescript
// ✅ GOOD: Two-segment imports
import * as md from "features/markdown";
import * as Entry from "entities/entry";

// ❌ AVOID: Three+ segment imports
import * as compilers from "features/markdown/compilers";
```

## Consuming modules

### Entities and features: Namespace imports

Always use `* as` namespace imports for entities and feature modules:

```typescript
// ✅ GOOD: Namespace imports
import * as Entry from "entities/entry";
import * as User from "entities/user";
import * as Recording from "storage/recording";

// Usage
Entry.insertMediaBlock(content, point, galleryId, mediaIds);
User.getCurrentUser();
Recording.save(data);
```

```typescript
// ❌ AVOID: Destructuring
import { insertMediaBlock } from "entities/entry";
import { getCurrentUser } from "entities/user";
```

**Why?**

- **Origin is clear**: `Entry.insertMediaBlock()` vs orphaned `insertMediaBlock()`
- **No naming conflicts**: Multiple modules can have similar function names
- **Discoverable**: Type `Entry.` to see all available functions

### Hooks: Namespace the return value

When consuming hooks, assign to a namespace variable (the "noun" of the hook). **Never destructure.**

```typescript
// ✅ GOOD: Namespace variable
const recorder = useAudioRecorder();
const uploader = useMediaUpload();

// Usage
if (recorder.isRecording) { ... }
recorder.start();
uploader.uploadFiles(files, params);
```

```typescript
// ❌ AVOID: Destructuring
const { isRecording, start } = useAudioRecorder();
const { uploadFiles, status } = useMediaUpload();
```

**Why?**

- **Clarity at call site**: `recorder.start()` is more explicit than `start()`
- **Avoids naming conflicts**: Multiple hooks with similar methods
- **Grouping**: Related functionality stays visibly grouped
- **Discovery**: Typing `recorder.` triggers autocomplete

## Writing hooks

### Event listener cleanup: Use AbortController

**Always use `AbortController` for event listener cleanup in effects.** It's cleaner than manual `removeEventListener` and handles multiple listeners automatically.

```typescript
// ✅ GOOD: AbortController for clean cleanup
React.useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const controller = new AbortController();
  const signal = controller.signal;

  const handleScroll = () => { ... };
  const handleResize = () => { ... };

  container.addEventListener("scroll", handleScroll, { passive: true, signal });
  window.addEventListener("resize", handleResize, { signal });

  return () => controller.abort();
}, [deps]);
```

```typescript
// ❌ AVOID: Manual removeEventListener
React.useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const handleScroll = () => { ... };
  const handleResize = () => { ... };

  container.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize);

  return () => {
    container.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
  };
}, [deps]);
```

**Why AbortController?**

- **Single cleanup call**: `controller.abort()` removes all listeners at once
- **Less error-prone**: Can't forget to remove a listener or mismatch handler references
- **Works everywhere**: Same pattern for window, document, elements, and even fetch requests
- **Composable**: Pass the signal to multiple listeners or async operations

**With timeouts:** AbortController handles listeners, but timeouts still need manual cleanup:

```typescript
React.useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  window.addEventListener(
    "scroll",
    () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(handleSnapDecision, 150);
    },
    { signal }
  );

  return () => {
    controller.abort();
    if (timeout) clearTimeout(timeout);
  };
}, [deps]);
```

### React state naming

Prefer `store`/`setStore` over `state`/`setState` for local React state:

```typescript
// ✅ GOOD: Clear naming
const [store, setStore] = React.useState<_t.Upload>({ ... });

// ❌ AVOID: Generic "state"
const [state, setState] = React.useState<_t.Upload>({ ... });
```

### Ref comments: Explain the purpose

**Always add a comment above each ref explaining its purpose in the app.** Refs often point to invisible DOM elements (sentinels, markers) or serve non-obvious roles. A brief comment saves readers from tracing through the code to understand what each ref is for.

```tsx
// ✅ GOOD: Each ref has a purpose comment
// Container ref for auto-scroll to follow highlighted word during playback
const entryRef = React.useRef<HTMLDivElement>(null);
// Zero-height sentinel at top of entry; when it scrolls out, the header is sticky
const headerSentinelRef = React.useRef<HTMLDivElement | null>(null);
// Marker at bottom of content; used to calculate dynamic fade padding for sticky footer
const contentEndRef = React.useRef<HTMLDivElement | null>(null);
```

```tsx
// ❌ BAD: No context for what these refs do
const entryRef = React.useRef<HTMLDivElement>(null);
const headerSentinelRef = React.useRef<HTMLDivElement | null>(null);
const contentEndRef = React.useRef<HTMLDivElement | null>(null);
```

**Why comment refs?**

- **Invisible elements**: Sentinel divs have `height: 0`—comments explain their role
- **Non-obvious connections**: Refs often connect to IntersectionObservers or scroll handlers defined elsewhere
- **Quick orientation**: New readers can understand the component's DOM strategy at a glance

### Hook return values: Spread state

**Spread state properties directly** in the return. Don't wrap in a `state` object—consumers shouldn't need `hook.state.isLoading`.

```typescript
// ✅ GOOD: Spread state for flat access
export default function useMediaUpload() {
  const [store, setStore] = React.useState<_t.Upload>({
    status: "idle",
    progress: { loaded: 0, total: 0, percent: 0 },
    uploadedMedia: [],
  });

  const uploadFiles = async (...) => { ... };
  const reset = () => { ... };

  return { ...store, uploadFiles, reset };
}

// Consumer gets flat access:
const uploader = useMediaUpload();
uploader.status;        // ✅ Direct
uploader.progress;      // ✅ Direct
uploader.uploadFiles(); // ✅ Direct
```

```typescript
// ❌ AVOID: Nested state object
return { state, uploadFiles, reset };

// Consumer needs extra nesting:
uploader.state.status; // ❌ Extra layer
uploader.state.progress; // ❌ Extra layer
```

**Why spread?**

- **Simpler consumer API**: `uploader.status` not `uploader.state.status`
- **Consistent access pattern**: All properties at same level
- **Better autocomplete**: Flat object shows all options immediately

## Naming conventions

### Clarity over brevity

Choose names that reveal intent:

```typescript
// ❌ Too generic
md.process(data);
md.handle(thing);

// ✅ Clear intent
md.ast.parse(markdown);
md.compilers.compile(ast);
```

### Avoid redundant suffixes

**Don't use "State", "Type", "Data", "Info", "Object"** when avoidable:

```typescript
// ❌ AVOID: Redundant suffixes
interface PlayerState { ... }
type RecordingType = "audio" | "video";
const configObject = { ... };

// ✅ PREFER: Clean names
interface Player { ... }
type Recording = "audio" | "video";
const config = { ... };
```

**When suffixes ARE appropriate:**

```typescript
// ✅ OK: Distinguishing related concepts
interface PlayerConfig { ... }    // Configuration
interface PlayerControls { ... }  // Control methods

// ✅ OK: Unit disambiguation
type DurationMs = number;
type TokenId = string;
```

### File naming: Lowercase kebab-case

```
✅ GOOD
use-audio-player.tsx
audio-recorder.tsx
sync-recordings.ts

❌ AVOID
useAudioPlayer.tsx      # camelCase
AudioRecorder.tsx       # PascalCase
```

## Component props: Pass the object, not its fields

**When multiple props come from the same object, pass the object directly.**

```tsx
// ❌ BAD: Prop explosion - extracting fields from the same object
<DrawerForMediaPicker
  open={showMediaPicker}
  onClose={handleClose}
  entryId={entry.id}
  entryCreatedAt={entry.createdAt}
  currentContent={entry.content || []}
  currentRevisedContent={entry.revisedContent}
  insertionPoint={insertionPoint}
/>

// ✅ GOOD: Pass the object directly
<DrawerForMediaPicker
  open={showMediaPicker}
  onClose={handleClose}
  entry={entry}
  insertionPoint={insertionPoint}
/>
```

**Why this is better:**

- **Cleaner call sites** - Less visual noise, easier to read
- **Flexible** - Need another field later? No prop changes needed
- **Less maintenance** - One prop instead of many to thread through
- **Type-safe** - TypeScript still catches misuse inside the component

**"But what about re-renders when unrelated fields change?"**

With React 19 compiler, this is handled automatically. Even without it, the re-render cost is negligible compared to the cognitive overhead of managing many props. Don't optimize for imaginary performance problems.

**The rule:** If you're passing 3+ props from the same object, just pass the object.

## Function arguments: The 1-2-3 Rule

**Self-documenting arguments eliminate inline comments.**

```typescript
// ❌ BAD: Requires comments
findActiveToken(ttsTokens, audio.currentTime, 0.12); // 0.12 = tolerance

// ✅ GOOD: Self-documenting
findActiveToken(audio.currentTime, {
  tokens: ttsTokens,
  toleranceInSecs: 0.12,
});
```

**The pattern:**

1. **First arg** = Primary value (id, time, insertionPoint, etc.)
2. **Second arg** = Named `props` object (self-documenting)
3. **Third arg** = Optional config (rarely needed)

**Naming:** Always use `props` for the named object argument.

**Inline types:** For simple, one-off argument types, define them inline:

```typescript
// ✅ GOOD: Simple props, inline type
export function insertMediaBlock(
  insertionPoint: _t.InsertionPoint,
  props: {
    content: _t.ContentBlock[];
    galleryId: string;
    mediaIds: string[];
  }
): _t.ContentBlock[] { ... }
```

**When to extract to a separate type instead:**

- Type is reused by multiple functions
- Complex types (unions, generics, conditional types)
- Function overloads that share a type
- Type needs JSDoc documentation

**Exceptions:**

- Universal patterns: `map(array, fn)`, `filter(array, predicate)`
- Math operations: `clamp(value, min, max)`
- Single argument: `parseId(id)`, `normalize(text)`
- Two clear arguments: `compileNode(type, node)`

## Function documentation: Explain the why

**Every function should have a JSDoc comment that explains the business purpose—not just what it does, but why the app needs it.**

A function name like `contentToText` tells you it converts content to text, but that's obvious from the signature. What's not obvious: _why does the app need to flatten blocks into a string?_

````typescript
// ❌ BAD: Describes what (redundant with signature)
/**
 * Converts content blocks to text.
 */
export const contentToText = (blocks: ContentBlock[]): string => { ... }

// ✅ GOOD: Explains why + shows how
/**
 * Extracts plain text from content blocks for TTS generation.
 *
 * Journal entries are stored as structured blocks (text, diarized-text, media)
 * to support rich editing and inline media. However, TTS services like
 * ElevenLabs require plain text input. This function flattens the block
 * structure into a single string, skipping media blocks since they can't
 * be narrated.
 *
 * @example
 * ```ts
 * const blocks: ContentBlock[] = [
 *   { type: "text", value: "First paragraph." },
 *   { type: "media", galleryId: "g1", mediaIds: ["m1"] },
 *   { type: "diarized-text", segments: [
 *     { speaker: 0, text: "Hello", wordTimings: [] },
 *     { speaker: 1, text: "Hi there", wordTimings: [] }
 *   ]}
 * ];
 *
 * contentToText(blocks);
 * // Returns: "First paragraph.\n\nHello Hi there"
 * ```
 */
export const contentToText = (blocks: ContentBlock[]): string => { ... }
````

**The pattern:**

1. **First line:** One sentence explaining the business purpose (what problem it solves)
2. **Context paragraph:** Why this function exists—what system constraint or requirement makes it necessary
3. **@example block:** Show concrete input/output so readers can verify their understanding

**Keep comments in sync with code.** When you change a function's logic, update the JSDoc. Stale comments are worse than no comments—they actively mislead.

**When to document:**

- ✅ Domain/business functions in `fns.ts`, `domain.ts`
- ✅ Complex transformations or algorithms
- ✅ Functions with non-obvious behavior or edge cases
- ⚠️ Simple utilities can have shorter docs (one-liner is fine)
- ❌ Skip for trivial getters/setters or obvious wrappers

**Questions good JSDoc answers:**

- Why does this function exist? What problem does it solve?
- What system or service requires this transformation?
- What happens to different input types? (shown via example)
- Are there edge cases or gotchas?

## Module organization: Flat > Nested

**Prefer flat structure.** Avoid nested sub-modules unless absolutely necessary.

```
✅ GOOD: Flat structure
tts/
  types.ts
  literals.ts
  fns.ts
  domain.ts
  index.ts

⚠️ RARELY needed: Nested only when truly independent
payments/
  stripe/
    index.ts
  paypal/
    index.ts
  index.ts
```

**Rule of thumb:** If you're questioning whether to nest, flatten instead.

## API design principles

**Consistency** - Predictable patterns reduce cognitive load
**Clarity** - Purpose obvious from the path
**Reduction** - Simplify without dumbing down
**Accessibility** - Common things easy, complex things possible

### Case study: Data over structure

**The problem:** We have table, code, list compilers. How do we expose them?

**Attempt 1: Deep nesting**

```typescript
// ❌ Four dots, verbose, hard to refactor
md.compilers.table.compile(node);
md.compilers.code.compile(node);
md.compilers.list.compile(node);
```

**Attempt 2: Flat namespace**

```typescript
// ❌ Naming conflicts, loses organization
md.compileTable(node);
md.compileCode(node);
md.compileList(node);
```

**The insight:** We're repeating "compile" with different data. The node type should be a parameter, not a namespace.

**Solution: Discriminated dispatch**

```typescript
// ✅ Three dots, type-safe, extensible
md.compilers.compileNode("table", node);
md.compilers.compileNode("code", node);
md.compilers.compileNode("list", node);
```

**Why this works:**

- Unified API surface (one function instead of many)
- Type-safe through string literal unions
- Data-driven (easy to loop over, test, dynamically dispatch)
- Stays at three-dot notation

### Getting unstuck: The creative process

When you hit a constraint that feels wrong:

1. **Identify the pattern** — What's being repeated? (Same operation on different data)
2. **Question the structure** — Am I organizing by _what it does_ or _what it operates on_?
3. **Try data over structure** — Can the variant become a parameter instead of a namespace?
4. **Validate the feel** — Does `compileNode("table", node)` read naturally? Does it autocomplete well?

**Signals you need to rethink:**

- Four+ dot notation feels awkward
- Many similar functions with slight variations
- Nested namespaces that mirror each other
- Comments needed to explain what's what

**The unlock:** Constraints breed creativity. The two-segment import rule _forces_ better API design. When you can't nest deeper, you're pushed to find more elegant patterns.

## Alternative names for domain.ts

If `domain` doesn't fit your use case:

- `services.ts` (\_s): orchestrates flows across helpers/IO
- `business.ts` (\_b): explicit business label
- `routines.ts` (\_r): stepwise procedures
- `operations.ts` (\_o): imperative operations
- `engine.ts` (\_e): core driving module

## Summary

**Simplicity is not the absence of complexity—it's the management of it.**

Atomic modules provide:

- **Predictability** - You always know where to look
- **Greppability** - Namespace imports make refactoring safer
- **Scalability** - Pattern works for small and large modules
- **Elegance** - Consistency creates a sense of rightness

**Remember:** When you hit complexity, ask:

- Can I use data instead of structure?
- Can I unify similar operations?
- Does this feel natural to type and read?

The answer often reveals a more elegant path.
