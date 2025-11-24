# Atomic Modules

A compact module structure that keeps concerns clear and greppable. Each module is "atomic": small, focused, and split into predictable files.

**Core principle:** Simplicity through consistency. Complexity is managed by predictable patterns, not eliminated by clever abstractions.

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

### Component & Hook Exports

- **Components:** Export as default function statements.
  ```tsx
  export default function Recorder() { ... }
  ```
- **Hooks:** Export as default function statements.
  ```ts
  export default function useAudioRecorder() { ... }
  ```
- **Filenames:** Always keep filenames lowercase (kebab-case or simple lowercase), matching the export where possible but lowercased.
  - Import example: `import Recorder from "components/molecules/recorder"`

### Import pattern inside `index.ts` and between internal modules

**Use namespace imports with underscore prefixes** for all internal modules to avoid naming conflicts and enable better refactoring:

```ts
// Standard module imports (always these prefixes)
import * as _d from "./domain";
import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

// Specialized module imports (use descriptive underscore prefix)
import * as _ast from "./ast";
import * as _parser from "./parser";
import * as _compiler from "./compiler";
import * as _tokenize from "./tokenize";

// Re-export only the types/functions that consumers need
export const { parse, compile } = _d;
export const { formatText } = _f;
export type { ASTNode, Token } = _t; // Only public types
```

**Why namespace imports with underscores:**

- **Greppable**: Easy to find all uses of a module (search for `_ast.`)
- **Refactor-safe**: Change internal structure without breaking imports
- **No naming conflicts**: `_ast` never conflicts with other imports
- **Consistent**: Same pattern everywhere in the codebase
- **Clear boundaries**: Easy to see what's from which module

**Rules:**

- ❌ **NEVER destructure imports from internal modules**: `import { parse } from "./parser"`
- ✅ **ALWAYS use namespace imports**: `import * as _parser from "./parser"`
- Standard prefixes: `_t` (types), `_l` (literals), `_f` (fns), `_d` (domain)
- Descriptive prefixes for specialized modules: `_ast`, `_parser`, `_tokenize`, etc.

- Keep `index.ts` readable and declarative; push details into specialized modules.
- **Only re-export what consumers need access to**—internal types and helpers should stay private to the module.

### Consuming Atomic Modules

When importing atomic modules from other parts of the application, prefer **namespace imports** over destructuring. This makes the origin of functions and types explicit and avoids naming collisions.

```typescript
// ✅ GOOD: Namespace import
import * as Sync from "lib/sync";

// Usage
Sync.syncRecordings();
```

```typescript
// ❌ AVOID: Destructuring
import { syncRecordings } from "lib/sync";
```

This pattern applies to all modules except components and hooks (which usually export defaults).

### Consuming Hooks: Namespace over Destructuring

When consuming custom hooks, avoid destructuring the return value. Instead, assign it to a descriptive namespace variable (usually the "noun" of the hook).

```typescript
// ✅ GOOD: Namespace variable
const recorder = useAudioRecorder();

// Usage
if (recorder.isRecording) { ... }
recorder.startRecording();
```

```typescript
// ❌ AVOID: Destructuring
const { isRecording, startRecording } = useAudioRecorder();
```

**Why?**

- **Clarity at call site**: `recorder.startRecording()` is more explicit than just `startRecording()`.
- **Avoids naming conflicts**: You can have multiple "recorders" or similar concepts without renaming variables.
- **Grouping**: Keeps related functionality visibly grouped together.
- **Discovery**: Typing `recorder.` triggers autocomplete for available methods.

**Naming:** Keep the namespace variable short (one word) but clear. If the function name is long (`useAudioRecorder`), try to find the core noun (`recorder`).

## Path aliases: The two-segment import rule

**Constraint breeds creativity.** By limiting imports to two segments, we're forced to design cleaner, more thoughtful APIs.

### Setup

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "features/*": ["./src/features/*"],
      "components/*": ["./src/components/*"],
      "hooks/*": ["./src/hooks/*"],
      "store/*": ["./src/store/*"],
      "modules/*": ["./src/modules/*"]
    }
  }
}
```

### The rule: Two segments max for imports, express complexity through dot notation

```typescript
// ✅ GOOD: Two-segment imports
import * as md from "features/markdown";
import * as user from "features/user";
import * as Button from "components/button";

// ❌ AVOID: Three+ segment imports
import * as compilers from "features/markdown/compilers";
import * as Outline from "components/button/outline";
```

**Why?** Import paths are **structural addresses**. They tell you _where_ something lives in the filesystem. Dot notation is **semantic access**. It tells you _what_ you're doing with the module.

By keeping imports short, we:

- Reduce coupling to file structure
- Make refactoring easier (fewer import path updates)
- Force better API design at the module boundary

### Express organization through dot notation

```typescript
import * as md from "features/markdown";

// Three-dot notation (preferred)
md.ast.parse(markdown);
md.compilers.compile(ast);
md.tts.findTokenByTime(tokens, time);

// Four-dot notation (acceptable when needed)
md.renderers.components.Table({ node });

// But avoid getting too deep - this suggests poor API design
md.foo.bar.baz.qux.doThing(); // ❌ Time to refactor
```

**The art of the dot:** Each dot is a cognitive step. Three dots feels natural (subject → category → action). Four dots is acceptable for complex features. Five+ dots means you're exposing too much internal structure.

## The art of API design: Elegance under constraints

Good API design is like good graphic design—it follows principles that create clarity, consistency, and delight.

### Design principles (API's version of CRAP)

**Consistency** - Predictable patterns reduce cognitive load

- All modules have `index.ts`
- Namespace imports with `* as`
- Public API through selective re-exports

**Clarity** - The purpose should be obvious from the path

- `md.ast.parse()` - clearly parsing
- `md.compilers.compile()` - clearly compiling
- Not `md.processor.process()` - too generic

**Reduction** - Simplify without dumbing down

- Prefer `compileNode("table", node)` over `table.compile(node)` when you have many element types
- Use data (string discriminators) over structure (nested modules) when appropriate
- Don't expose internal complexity in the public API

**Accessibility** - Common things easy, complex things possible

- Main APIs flat: `md.compile(ast)`
- Specialized APIs namespaced: `md.compilers.compileNode("table", node)`
- Advanced features tucked away but discoverable

### Case study: From nested modules to elegant functions

**The problem:** We have table, code, list compilers. How do we expose them?

**Attempt 1: Deep nesting**

```typescript
// ❌ Four dots, verbose, harder to refactor
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

**The insight:** We're repeating "compile" with different data. Use **data over structure**.

**Solution: Discriminated dispatch**

```typescript
// ✅ Elegant: Three dots, type-safe, extensible
md.compilers.compileNode("table", node);
md.compilers.compileNode("code", node);
md.compilers.compileNode("list", node);

// TypeScript ensures "table" | "code" | "list" are the only options
```

**Why this works:**

- Respects the two-segment import constraint
- Stays at three-dot notation
- Unified API surface (one function instead of many)
- Type-safe through string literal unions
- Extensible (add new types without changing API)
- Data-driven (easy to loop over, test, or dynamically dispatch)

### When to break the pattern

**Know when to nest deeper.** If each element has multiple distinct operations:

```typescript
// If you need multiple operations per element
md.compilers.table.compile(node);
md.compilers.table.validate(node);
md.compilers.table.optimize(node);
md.compilers.table.analyze(node);
```

Then four-dot notation is fine. The complexity is real, not artificial.

But if it's mostly a single operation with variants, use discriminated dispatch:

```typescript
// Better
md.compilers.compileNode("table", node);
md.compilers.validateNode("table", node);
```

### The creative process: Getting unstuck

**How we arrived at `compileNode`:**

1. **Hit the constraint** - Four-dot notation felt wrong
2. **Identify the pattern** - We're doing the same operation (compile) on different data (node types)
3. **Abstract the repetition** - What if the node type is a parameter, not a namespace?
4. **Validate with types** - TypeScript string literals make it type-safe
5. **Test the feel** - Does `compileNode("table", node)` read naturally? Yes!

**When you're stuck:**

- Look for repetition in structure → candidate for data
- Look for nested namespaces → candidate for discriminated dispatch
- Look for many similar functions → candidate for unified API with parameters
- Ask: "Am I organizing by _what it does_ or _what it operates on_?" (Sometimes the answer reveals the better path)

## Module organization: Flat > Nested

**Prefer flat structure.** Avoid nested sub-modules unless absolutely necessary.

### When to flatten (default)

```typescript
// ✅ GOOD: Flat structure
tts/
  types.ts
  literals.ts
  fns.ts            // includes debugger fns
  domain.ts
  debugger.ts       // debugger-specific implementation as a single file
  index.ts

import * as tts from "features/tts";
tts.captureSnapshot();
tts.findTokenByTime();
```

Merge related functionality into the parent module:

- Debugger types → merge into main `types.ts`
- Debugger functions → merge into `fns.ts` or add `debugger.ts` as a single implementation file
- Debugger constants → merge into `literals.ts`

### When nested sub-modules might be acceptable

Only create nested sub-modules when the feature is truly independent AND complex enough to warrant its own multi-file atomic structure:

```typescript
// ⚠️ RARELY needed: Nested sub-module
features /
  payments /
  stripe / // Separate payment provider implementation
  types.ts,
  fns.ts,
  domain.ts,
  index.ts;
paypal / // Another separate provider
  types.ts,
  fns.ts,
  domain.ts,
  index.ts;
index.ts;
```

**Rule of thumb:** If you're questioning whether to nest, flatten instead. Nested modules add cognitive overhead and import complexity.

## Function argument guidelines: The 1-2-3 Rule

**Core Principle:** Self-documenting arguments eliminate the need for inline comments.

### The Problem

```typescript
// ❌ BAD: Requires comments to understand
const activeToken = findActiveToken(ttsTokens, audio.currentTime, 0.12); // 0.12 = tolerance
detector.recordSample(expectedToken, actualToken, currentTime);
createToken(id, text, speech, role, visual, audio); // What order? What's optional?
```

**Why it's bad:**

- Mental overhead remembering argument positions
- Comments needed to explain what values mean
- Easy to swap arguments accidentally
- Hard to tell what's required vs optional

### The Solution: 1-2-3 Pattern

**1. First argument = Primary simple value**

- The "subject" of the operation
- Usually: `id`, `time`, `index`, `text`, `value`, `key`
- Should be a string, number, or boolean
- This is what the function is "about"

**2. Second argument = Named parameters object**

- The "details" or "context"
- Always use descriptive keys (no abbreviations)
- Self-documenting at call site
- Easy to add new params without breaking changes

**3. Third argument = Optional config/options**

- Settings with sensible defaults
- Feature flags
- Optional behavior modifications
- Rarely needed if defaults are good

### Examples: Before & After

```typescript
// ❌ BEFORE: Positional arguments
fn: findActiveToken(tokens, currentTime, tolerance) => Token | null
fn: recordSample(expectedToken, actualToken, currentTime) => void
fn: createToken(id, text, speech, role, visual, audio) => Token
fn: applyChunkTiming(tokens, timings, chunkOffset) => Token[]

// Usage requires mental mapping:
findActiveToken(ttsTokens, audio.currentTime, 0.12)
recordSample(expectedToken, actualToken, 1.5)
createToken("p-0-word-1", "hello", "hello", "content", {...}, {...})

// ✅ AFTER: Self-documenting
fn: findActiveToken(currentTime, config) => Token | null
fn: recordSample(currentTime, tokens) => void
fn: createToken(id, params) => Token
fn: applyChunkTiming(chunkOffset, data) => Token[]

// Usage is self-explanatory:
findActiveToken(audio.currentTime, {
  tokens: ttsTokens,
  toleranceInSecs: 0.12
})

recordSample(currentTime, {
  expected: expectedToken,
  actual: actualToken
})

createToken(id, {
  text: "hello",
  speech: "hello",
  role: "content",
  visual: {...},
  audio: {...}
})

applyChunkTiming(chunkOffset, {
  tokens,
  timings
})
```

### Why This Works

**Readability at call site:**

```typescript
// ❌ What does this mean?
findActiveToken(tokens, 1.5, 0.12);

// ✅ Crystal clear
findActiveToken(1.5, { tokens, toleranceInSecs: 0.12 });
```

**Easy to extend:**

```typescript
// Adding a new param doesn't break anything
findActiveToken(1.5, {
  tokens,
  toleranceInSecs: 0.12,
  context: { isFirstInElement: true }, // New param added seamlessly
});
```

**TypeScript helps:**

```typescript
type FindActiveTokenConfig = {
  tokens: Token[];
  toleranceInSecs?: number; // Optional with default
  context?: ToleranceContext; // Optional advanced feature
};

// IDE autocompletes the config object keys
// Type errors if you misspell or use wrong type
```

### When to Break the Rule

**Exception 1: Universal patterns (2-3 args is fine)**

```typescript
// OK: Follows common conventions
fn: map(array, fn) => Array
fn: filter(array, predicate) => Array
fn: find(array, predicate) => Item | null
fn: reduce(array, reducer, initialValue) => Value
```

**Exception 2: Math operations**

```typescript
// OK: Mathematical conventions
fn: add(a, b) => number
fn: clamp(value, min, max) => number
fn: lerp(start, end, t) => number
```

**Exception 3: Single argument**

```typescript
// OK: No ambiguity possible
fn: parseId(id) => ParsedId
fn: normalize(text) => string
fn: hash(input) => string
```

**Exception 4: Two clearly named arguments**

```typescript
// OK: Both arguments are clear from context
fn: compileNode(type, node) => CompiledNode
// type: "table" | "code" | "list" (discriminator)
// node: ASTNode (the thing to compile)

fn: getElementById(id, document) => Element | null
fn: addEventListener(type, handler) => void
```

### Real-World Application

```typescript
// TTS module following the pattern
import * as md from "features/markdown";

// ✅ Primary value first, config second
const active = md.tts.findActiveToken(audio.currentTime, {
  tokens: ttsTokens,
  toleranceInSecs: 0.12,
});

// ✅ Simple value first, details second
md.tts.recordSample(currentTime, {
  expected: expectedToken,
  actual: actualToken,
});

// ✅ ID first (string), params second (object)
const token = md.compilers.createToken(id, {
  text: "hello",
  speech: "hello",
  role: "content",
  visual: { format: ["bold"], sourceStart: 0, sourceEnd: 5 },
  audio: null,
});

// ✅ Primary offset first, data second
const adjusted = md.tts.applyChunkTiming(chunkOffset, {
  tokens,
  timings,
});
```

### Naming Convention for Config Objects

Use descriptive suffixes:

- `config` - General configuration (settings, options)
- `params` - Required parameters (data needed for operation)
- `options` - Optional settings (has defaults)
- `data` - Raw data being processed
- `context` - Contextual information

```typescript
// Clear intent from parameter names
fn: findActiveToken(currentTime, config) => Token | null
fn: createToken(id, params) => Token
fn: render(ast, options?) => string
fn: process(text, data) => Result
fn: validate(mapping, context) => ValidationResult
```

### Summary

**The 1-2-3 rule:**

1. **First arg** = simple primary value (id, time, index)
2. **Second arg** = named params object (self-documenting)
3. **Third arg** = optional config (rarely needed)

**Benefits:**

- No comments needed at call sites
- Clear intent from reading the code
- Easy to extend without breaking changes
- TypeScript provides excellent autocomplete
- Less prone to argument order mistakes

**Remember:** If you need a comment to explain an argument, that argument should be in a named object instead.

## Example: Full feature API

Here's how a complex feature (markdown with TTS) looks with these principles:

```typescript
// Setup (once in tsconfig.json)
{
  "paths": {
    "features/*": ["./src/features/*"]
  }
}

// Usage throughout codebase
import * as md from "features/markdown";

// AST operations
const ast = md.ast.parse(markdown);
md.ast.assignIds(ast);
md.ast.walkTree(ast, visitor);

// Compilation
const compiled = md.compilers.compile(ast);
const tableCompiled = md.compilers.compileNode("table", tableNode);
const codeCompiled = md.compilers.compileNode("code", codeNode);

// Rendering (components stay direct - JSX idioms)
<md.renderers.MarkdownRenderer ast={ast} activeTokenId={id} />
<md.renderers.Table node={tableNode} />
<md.renderers.Code node={codeNode} />

// TTS synchronization
const { activeTokenId } = md.tts.useTTSSync(compiled);
const token = md.tts.findTokenByTime(tokens, currentTime);
md.tts.captureSnapshot(); // Debugger functions at same level
```

**Notice:**

- All imports: two segments (`features/markdown`)
- All access: three dots (`md.compilers.compile`)
- Element-specific: discriminated dispatch (`compileNode("table", node)`)
- Type-safe: TypeScript literal unions ensure correctness
- Consistent: Same pattern across the entire feature

## On naming: Clarity over brevity

Choose names that reveal intent:

```typescript
// ❌ Too generic
md.process(data);
md.transform(input);
md.handle(thing);

// ✅ Clear intent
md.ast.parse(markdown);
md.compilers.compile(ast);
md.tts.findTokenByTime(tokens, time);

// ✅ Even verbose is okay if it's clear
md.compilers.compileNode("table", node); // Better than md.cn("table", node)
```

**The principle:** Code is read 10x more than written. Optimize for the reader.

## Alternative names considered for `domain.ts`

When you have lots of business logic that needs its own helpers, `domain.ts` is a good default. But here are alternatives if `domain` feels wrong for your use case:

- `services.ts` (\_s): orchestrates flows across helpers/IO; clear, action-oriented
- `domain.ts` (\_d): DDD-standard; broad but accepted **[chosen default]**
- `business.ts` (\_b): explicit business label; slightly corporate tone
- `routines.ts` (\_r): emphasizes ordered, stepwise procedures
- `operations.ts` (\_o): action/ops tone; reads as imperative operations
- `rules.ts` (\_r): decision/invariant emphasis; alias conflicts with `routines`
- `managers.ts` (\_m): OOP-ish; implies stateful coordination
- `engine.ts` (\_e): core driving module; focused connotation

Choose based on your domain. A payment system might use `business.ts`. A parser might use `engine.ts`. A workflow system might use `routines.ts`.

## Summary: The atomic modules philosophy

**Simplicity is not the absence of complexity—it's the management of it.**

Atomic modules provide:

- **Predictability** - You always know where to look
- **Greppability** - Namespace imports make refactoring safer
- **Scalability** - Pattern works for small and large modules
- **Creativity within constraints** - Two-segment imports force better API design
- **Elegance** - Consistency creates a sense of rightness

The best APIs feel inevitable. By following these patterns and principles, you're not just organizing code—you're crafting an interface that feels natural to use, easy to understand, and pleasant to work with.

**Remember:** When you hit complexity, don't immediately add nesting. Ask:

- Can I use data instead of structure?
- Can I unify similar operations?
- Am I exposing internal organization externally?
- Does this feel natural to type and read?

The answer often reveals a more elegant path.
