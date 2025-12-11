# PandaCSS Patterns & Behaviors

Reference for PandaCSS quirks, patterns, and solutions encountered in qstd component development.

---

## Atomic CSS Override Problem

### The Issue

When a component defines default styles for a conditional prop (like `_labelLifted`, `_hover`, `_dark`), and a consumer tries to override those styles, **both sets of classes are applied** with identical CSS specificity.

```tsx
// Component (Label.tsx)
<Base
  _labelLifted={{ bg: "input-label-bg", top: "-10px" }}  // Default
  {...rest}  // Consumer's _labelLifted={{ bg: "neutral.100" }}
>
```

**Generated HTML:**

```html
<div
  class="[labelLifted]:bg_input-label-bg [labelLifted]:bg_neutral.100 ..."
></div>
```

Both classes target `background` under the same condition. Since they have **identical CSS specificity**, the **stylesheet order** determines which wins—not the className order. This means consumer overrides may silently fail.

### Why It Happens

PandaCSS generates atomic classes at build time. When `styled()` receives the same prop twice (once from the component, once from spread), it doesn't merge them—it generates separate classes for each.

The `styled()` component internally does something like:

```tsx
// Simplified - both become separate classes
className={css({ _labelLifted: { bg: "default" } }) + " " + css({ _labelLifted: { bg: "consumer" } })}
```

### Solutions

#### Solution 1: Extract & Merge Specific Props (Recommended)

For components with few conditional defaults, extract and merge just those props. This allows **partial overrides** - consumers can override just `top` without losing `bg`, `color`, etc.

```tsx
export function Label(props: LabelProps) {
  const { _labelLifted: consumerLabelLifted, ...rest } = props;

  const defaultLabelLifted = {
    bg: "input-label-bg",
    top: "-10px",
    color: "input-label-color",
  };

  return (
    <Base
      {...rest}
      _labelLifted={{
        ...defaultLabelLifted, // Defaults first
        ...consumerLabelLifted, // Consumer overrides spread AFTER
      }}
    >
      {children}
    </Base>
  );
}
```

**Usage:**

```tsx
// Only override top, keep default bg and color
<Block.Input.Label _labelLifted={{ top: "-12px" }}>Email</Block.Input.Label>
```

**Pros:** Simple, partial overrides work naturally, predictable  
**Cons:** Must extract each conditional prop with defaults

#### Solution 2: Merge All Style Props

Use the `mergeStyleDefaults` helper in `src/block/fns.tsx` for components with many conditional defaults. It deep-merges default styles with consumer props.

**Caveat:** Deep merge means passing `_labelLifted={{ top: "-12px" }}` merges with defaults. This can be surprising if consumers expect full replacement. Solution 1 is often clearer.

```tsx
import * as _f from "./fns";

export function Label(props: LabelProps) {
  const { value, error, required, children, hasLeftIcon, ...consumerProps } =
    props;

  const ml = hasLeftIcon ? 6 : 1;

  // All default styles in one object
  const styleDefaults = {
    position: "absolute",
    color: error ? "text-alert" : "input-label-color",
    _labelLifted: {
      top: "-10px",
      ml,
      color: error
        ? "text-alert"
        : value
        ? "input-label-color-lifted"
        : "input-label-color",
      bg: "input-label-bg",
    },
  };

  // Deep merge: consumer overrides win
  const mergedStyles = _f.mergeStyleDefaults(styleDefaults, consumerProps, []);

  return (
    <Base {...mergedStyles}>
      {children}
      {required && "*"}
    </Base>
  );
}
```

**Implementation:** `src/block/fns.tsx` → `mergeStyleDefaults()`

**Pros:** Consumers can override ANY default naturally, scales well  
**Cons:** Extract non-style props first (children, handlers, etc.)

---

## Prop Cascading Pattern

For better DX, some props can "cascade" to conditional states.

**Example: `bg` in Label**

The `bg` prop cascades to `_labelLifted.bg` automatically:

```tsx
// bg applies to BOTH default and lifted states
<Block.Input.Label bg={{ base: "white", _dark: "gray.900" }}>
  Email
</Block.Input.Label>
```

Only specify `_labelLifted.bg` if you want a **different** lifted background:

```tsx
// Different bg when lifted
<Block.Input.Label
  bg="white"
  _labelLifted={{ bg: "blue.50" }} // Overrides only for lifted state
>
  Email
</Block.Input.Label>
```

**Implementation pattern:**

```tsx
const { bg: consumerBg, _labelLifted: consumerLabelLifted, ...rest } = props;

const defaultLabelLifted = {
  // ...other defaults
  bg: consumerBg ?? "input-label-bg", // Cascade consumer's bg, fallback to default
};

return (
  <Base
    bg={consumerBg}
    {...rest}
    _labelLifted={{ ...defaultLabelLifted, ...consumerLabelLifted }}
  >
    {children}
  </Base>
);
```

---

## Deep Merge Behavior

PandaCSS's `mergeCss` performs **deep merging** of style objects:

```tsx
import { mergeCss } from "panda/css";

const result = mergeCss(
  {
    bg: "red",
    _hover: { bg: "blue", color: "white" },
  },
  {
    _hover: { bg: "green" }, // Only overrides bg, keeps color
  }
);

// Result:
// { bg: "red", _hover: { bg: "green", color: "white" } }
```

This is critical for conditional styles—consumers can override specific properties within a condition without losing other defaults.

---

## Responsive & Conditional Values

Conditional styles support responsive syntax:

```tsx
<Block
  bg={{ base: "white", _dark: "black" }}
  _hover={{
    bg: { base: "gray.100", _dark: "gray.800" },
  }}
/>
```

When merging, the entire value object is replaced, not individual breakpoints:

```tsx
// Default
{ bg: { base: "red", md: "blue" } }

// Consumer override
{ bg: { base: "green" } }

// Result (md is LOST)
{ bg: { base: "green" } }
```

If you need to preserve breakpoints, consumers must include all keys.

---

## The `!` Important Modifier

PandaCSS supports `!` suffix to increase specificity:

```tsx
<Block bg="red.500!">  // Generates higher specificity
```

**When to use:**

- Quick override when you can't modify the component
- Debugging specificity issues

**When NOT to use:**

- As a permanent solution (creates specificity wars)
- In component library defaults (makes consumer overrides harder)

---

## Condition Selectors Reference

Custom conditions in qstd preset:

| Condition      | Selector                                                | Use Case                              |
| -------------- | ------------------------------------------------------- | ------------------------------------- |
| `_labelLifted` | `&:has(+ input:focus, + input:not(:placeholder-shown))` | Float label when input focused/filled |
| `_dark`        | `[data-theme=dark] &`                                   | Dark mode styles                      |
| `_hover`       | `&:hover:not(:disabled)`                                | Hover state (respects disabled)       |
| `_active`      | Complex (see preset)                                    | Active/pressed state                  |
| `_checkbox`    | `& [data-checkbox]`                                     | Target checkbox children              |

---

## Component Authoring Checklist

When creating components with default styles:

1. **Identify conditional props with defaults** (`_hover`, `_dark`, `_labelLifted`, etc.)
2. **Choose merge strategy:**
   - Few conditionals → Solution 1 (extract specific)
   - Many conditionals → Solution 2 (merge all)
3. **Document which props have defaults** in component JSDoc
4. **Test consumer overrides** for all conditional props with defaults
5. **Avoid `!` in defaults** — makes consumer overrides harder

---

## Common Pitfalls

### 1. Spreading Before Defaults

```tsx
// ❌ Wrong - defaults override consumer
<Base {...props} bg="default" />

// ✅ Correct - consumer can override
<Base bg="default" {...props} />
```

### 2. Conditional Props Not Merging

```tsx
// ❌ Both _hover objects become separate classes
<Base _hover={{ bg: "blue" }} {...props} />

// ✅ Merge them explicitly
<Base _hover={{ bg: "blue", ...props._hover }} {...restWithoutHover} />
```

### 3. Forgetting Non-Style Props

When using `mergeCss`, remember it's for style props only:

```tsx
// ❌ Don't merge event handlers or children
mergeCss(defaults, { onClick: fn, children: ... })

// ✅ Separate them first
const { children, onClick, ...styleProps } = props;
const merged = mergeCss(defaults, styleProps);
```
