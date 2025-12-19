# qstd

> Standard Block component and utilities library with Panda CSS

**📖 Maintainer?** See [DEVELOPMENT.md](./DEVELOPMENT.md) for the complete "how to update and publish" guide.

A single npm package providing:

- **Block Component** - Polymorphic UI component with Panda CSS inline prop styling
- **React Hooks** - useDebounce, useThrottle, useMatchMedia
- **Global File Types** - ImageFile, AudioFile, VideoFile (automatically available)
- **Universal Utilities** - Lodash-style functions that work in browser and Node.js
- **Client Utilities** - Browser-specific DOM functions
- **Server Utilities** - Node.js file operations
- **Panda CSS Preset** - Custom utilities, tokens, and theme configuration

## Installation

```bash
pnpm add qstd
```

## ⚠️ Required: Panda CSS Preset Setup

**If you're using the Block component, you MUST configure the qstd preset in your `panda.config.ts`:**

```ts
// panda.config.ts
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  presets: ["@pandacss/dev/presets", qstdPreset], // ← REQUIRED
  include: ["./src/**/*.{ts,tsx}"],
  outdir: "styled-system",
  jsxFramework: "react", // ← REQUIRED for Block component
});
```

**Without this setup:**

- Props like `grid`, `flex`, `cols`, `rows` will output broken CSS (e.g., `grid_true` instead of `display: grid`)
- Boolean utilities (`alignI`, `justifyC`, etc.) won't transform correctly
- You'll see raw prop values in your HTML class names instead of actual styles

After adding the preset, run `pnpm panda codegen` to regenerate your styled-system.

## Prerequisites

### TypeScript Configuration (Required)

To use subpath imports like `qstd/server`, `qstd/client`, or `qstd/react`, your `tsconfig.json` **must** use a modern module resolution strategy:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**Valid options:** `"bundler"`, `"node16"`, or `"nodenext"`

#### Why is this required?

This package uses the **`exports`** field in `package.json` to define subpath exports:

```json
{
  "exports": {
    "./react": { "types": "...", "import": "..." },
    "./client": { "types": "...", "import": "..." },
    "./server": { "types": "...", "import": "..." },
    "./preset": { "types": "...", "import": "..." }
  }
}
```

The `exports` field is the modern Node.js way to define multiple entry points for a package. It allows a single package to expose different modules at different paths (e.g., `qstd/server` vs `qstd/client`) with proper type definitions for each.

**The problem:** The older `"moduleResolution": "node"` (also called "node10") setting predates the `exports` field and does not understand it. TypeScript will fail to resolve the types:

```
Cannot find module 'qstd/server' or its corresponding type declarations.
  There are types at '.../node_modules/qstd/dist/server/index.d.ts', but this result
  could not be resolved under your current 'moduleResolution' setting.
```

**The fix:** Use `"moduleResolution": "bundler"` which understands the `exports` field. This is the recommended setting for projects using modern bundlers like Vite, esbuild, or webpack 5+.

#### Quick Reference

| moduleResolution      | Supports `exports` | Use Case                         |
| --------------------- | ------------------ | -------------------------------- |
| `"node"` / `"node10"` | ❌ No              | Legacy projects                  |
| `"node16"`            | ✅ Yes             | Node.js 16+ with ESM             |
| `"nodenext"`          | ✅ Yes             | Latest Node.js features          |
| `"bundler"`           | ✅ Yes             | **Recommended** for bundled apps |

## Usage

### React (Block + Hooks)

```tsx
import Block, { useDebounce, useThrottle, useMatchMedia } from "qstd/react";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [isMobile] = useMatchMedia(["(max-width: 600px)"]);

  // File types are global - no import needed!
  const handleImage = (file: ImageFile) => {
    console.log(file.width, file.height, file.preview);
  };

  return (
    <Block grid rowG={4}>
      <Block
        is="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Block is="btn" bg="blue.500" p={4} br={8}>
        Search
      </Block>
    </Block>
  );
}
```

### Client Utilities (Browser)

```ts
import * as Q from "qstd/client";

// Shared utilities
const xs = Q.List.create(5, (_, i) => i);
const color = Q.Random.hexColor();
const formatted = Q.Int.formatBytes(12345);

// DOM utilities
Q.Dom.scrollToTop();
Q.Dom.copy("text to clipboard");
```

### Server Utilities (Node.js)

```ts
import * as Q from "qstd/server";

// Shared utilities (same as client)
const chunks = Q.List.chunk(arr, 10);
const money = Q.Money.convertToUsd(cents);

// File operations
const content = Q.File.readFile("path/to/file.txt");
```

### Panda CSS Preset

```ts
// panda.config.ts
import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  preflight: true,

  // IMPORTANT: Include base preset to get default colors (neutral, red, blue, etc.)
  presets: ["@pandacss/dev/presets", qstdPreset],

  include: ["./src/**/*.{ts,tsx}"],

  outdir: "styled-system",

  // REQUIRED: Enables Panda CSS to detect props on the Block component
  // Without this, styles like bg="red" won't generate CSS utilities
  jsxFramework: "react",

  theme: {
    extend: {
      // Your custom theme
    },
  },
});
```

**⚠️ Critical:** The `jsxFramework: "react"` setting is **required** for the Block component to work correctly. Without it, Panda CSS cannot detect style props like `bg="red"` on the Block component, and no CSS utilities will be generated.

## Global Types

When you install qstd, these types become **globally available** (no import needed):

- `ImageFile` - Image with metadata (width, height, orientation, preview)
- `AudioFile` - Audio with metadata (source, preview)
- `VideoFile` - Video with metadata (duration, width, height, orientation)
- `MediaFile` - Union of File | ImageFile | AudioFile
- `File` - Augmented with `preview?` and `id?` properties

## Package Exports

- `qstd/react` - Block component (default) + hooks
- `qstd/client` - Browser utilities + all shared
- `qstd/server` - Node.js utilities + all shared
- `qstd/preset` - Panda CSS configuration

## Documentation

See [SUMMARY.md](./SUMMARY.md) for complete package contents and [QSTD_PACKAGE_PRD.md](./QSTD_PACKAGE_PRD.md) for full specification.
For the interactive development playground showcasing Block variants, see [playground/README.md](./playground/README.md).

## Block Component Documentation

The `Block` component is a universal building block that replaces most HTML elements with an intelligent, prop-driven API powered by PandaCSS. It supports semantic HTML, grid/flex layouts, compound components, and extensive styling utilities.

### Quick Start

```tsx
import Block from "qstd/react";

// Simplest text
<Block>Hello World</Block>

// Text with styling
<Block is="txt" fontSize="lg" color="blue.500">
  Styled text
</Block>
```

### Core Concepts

#### The `is` Prop (Component Type)

The `is` prop tells Block what kind of component to render:

```tsx
// Text elements
<Block is="txt">Default paragraph</Block>
<Block is="txt" as="h1">Heading 1</Block>
<Block is="txt" as="span">Inline text</Block>

// Interactive elements
<Block is="btn" onClick={handleClick}>Button</Block>
<Block is="link" onClick={navigate}>Link-styled button</Block>
<Block is="checkbox" checked={isChecked} onChecked={setIsChecked}>
  Accept terms
</Block>

// Inputs
<Block is="input" placeholder="Enter text" />
<Block is="textarea" placeholder="Enter description" />

// Complex components
<Block is="progress" value={50} max={100} />
<Block is="drawer" open={isOpen} onClose={handleClose}>
  Drawer content
</Block>
<Block is="radio" options={radioOptions} onChange={handleChange} />
<Block is="accordion">Accordion content</Block>
<Block is="menu" trigger={<Block is="btn">Menu</Block>}>
  Menu items
</Block>

// Semantic elements
<Block is="seo" as="nav">Navigation</Block>
<Block is="seo" as="main">Main content</Block>
<Block is="seo" as="article">Article</Block>
<Block is="list" as="ul">Unordered list</Block>
<Block is="list" as="li">List item</Block>
<Block is="form" as="label">Label</Block>
```

#### The `as` Prop (Semantic HTML)

The `as` prop lets you control the underlying HTML element for SEO and accessibility:

```tsx
// Text as different heading levels
<Block is="txt" as="h1" fontSize="2xl">Page Title</Block>
<Block is="txt" as="h2" fontSize="xl">Section Title</Block>
<Block is="txt" as="p">Paragraph</Block>
<Block is="txt" as="span">Inline text</Block>

// Semantic structure
<Block is="seo" as="header">Site header</Block>
<Block is="seo" as="footer">Site footer</Block>
<Block is="seo" as="nav">Navigation</Block>
<Block is="seo" as="main">Main content</Block>
<Block is="seo" as="aside">Sidebar</Block>
<Block is="seo" as="section">Section</Block>

// Lists
<Block is="list" as="ul">
  <Block is="list" as="li">Item 1</Block>
  <Block is="list" as="li">Item 2</Block>
</Block>

// Forms
<Block is="form" as="form" onSubmit={handleSubmit}>
  <Block is="form" as="label">Email</Block>
  <Block is="input" type="email" />
</Block>
```

### Layout with Grid & Flex

#### Boolean Layout Props

```tsx
// Flex layout
<Block flex>Flex container</Block>
<Block flex="wrap">Flex with wrapping</Block>

// Flex item sizing (does NOT make a flex container)
// - `basis` sets the CSS `flex` shorthand (grow/shrink/basis) on a *flex item*
// - You can use `basis` without `flex`
<Block basis={1}>Flex item (flex: 1)</Block>
<Block basis="0 0 auto">Flex item (flex: 0 0 auto)</Block>

// Flex container + flex item (valid, but be intentional)
<Block flex basis={1}>This element is BOTH a flex container AND a flex item</Block>

// Grid layout
<Block grid>Grid container</Block>

// Centering
<Block center>Centered content</Block>

// Positioning
<Block relative>Relative position</Block>
<Block absolute>Absolute position</Block>
<Block fixed>Fixed position</Block>
<Block sticky>Sticky position</Block>
```

**Important**:
- **`flex`** makes the element a **flex container** (`display: flex`, optional wrap)
- **`basis`** sets the CSS **`flex` shorthand** on a **flex item** (does **not** change `display`)
- Using **both** `flex` and `basis` means the element is **both** a flex container **and** a flex item

#### Grid `cols` Prop (Flexible Column Syntax)

The `cols` prop provides a powerful shorthand for grid columns:

```tsx
// Basic columns - numbers become fr units
<Block grid cols="1 1 1">Three equal columns</Block>
<Block grid cols="2 1 1">2fr 1fr 1fr columns</Block>

// Max-content with 'm'
<Block grid cols="m 1 1 m 1">
  {/* max-content 1fr 1fr max-content 1fr */}
</Block>

// Alignment + columns
<Block grid cols="center 1 1 1">
  {/* Centers columns: alignContent + alignItems: center */}
</Block>
<Block grid cols="start 1 2 1">
  {/* Aligns to start */}
</Block>

// Column gap with slash
<Block grid cols="1 1 1 / 10">
  {/* 10px column gap */}
</Block>

// Complete example
<Block grid cols="center 1 1 m 1 / 10">
  {/* alignContent: center, alignItems: center */}
  {/* gridTemplateColumns: 1fr 1fr max-content 1fr */}
  {/* columnGap: 10px */}
</Block>

// Just alignment
<Block grid cols="center">
  {/* Only centers, no column template */}
</Block>
```

#### Grid `rows` Prop (Flexible Row Syntax)

The `rows` prop mirrors `cols` but for grid rows:

```tsx
// Basic rows
<Block grid rows="1 1 1">Three equal rows</Block>
<Block grid rows="m m 1">
  {/* max-content max-content 1fr */}
</Block>

// Alignment + rows
<Block grid rows="between m m m">
  {/* justifyContent: space-between, justifyItems: space-between */}
  {/* gridTemplateRows: max-content max-content max-content */}
</Block>
<Block grid rows="start 1 2 1">Start-aligned rows</Block>
<Block grid rows="end 1 1 1">End-aligned rows</Block>

// Row gap with slash
<Block grid rows="1 1 / 8">
  {/* 8px row gap */}
</Block>

// Complete example
<Block grid rows="between m m m / 10">
  {/* justifyContent: space-between, justifyItems: space-between */}
  {/* gridTemplateRows: max-content max-content max-content */}
  {/* rowGap: 10px */}
</Block>
```

#### Real-World Layout Examples

```tsx
// Chat page header
<Block
  grid
  rows="m 1 m"
  h="100dvh"
  w
  maxW="700px"
  mx="auto"
  overflow="hidden"
  px={{ base: 1, sm: 0 }}
  pb={{ base: 1, sm: 4 }}
>
  <Block rows="between" my={2}>
    {/* Header content */}
  </Block>
  {/* Main content */}
  {/* Footer/Chatbox */}
</Block>

// Playground sidebar
<Block grid cols="250px 1fr" h="100vh" overflow="hidden">
  <Block
    bg={{ base: "neutral.50", _dark: "neutral.900" }}
    borderRight="1px solid"
    borderColor={{ base: "neutral.200", _dark: "neutral.700" }}
    p={4}
    rowG={4}
  >
    {/* Sidebar */}
  </Block>
  <Block overflow="auto" position="relative">
    {/* Main content */}
  </Block>
</Block>

// Icon + text flex layout
<Block flex cols="center / 4">
  <Block icon={TbMessage2} fontSize="sm" />
  <Block is="txt">{messageCount}</Block>
</Block>
```

### Debug Utilities

The `debug` prop adds visual borders for layout debugging:

```tsx
// Default red border
<Block debug>Debug border</Block>

// Color only
<Block debug="blue">Blue border</Block>
<Block debug="green">Green border</Block>

// Width + color
<Block debug="2px red">2px red border</Block>
<Block debug="10px orange">10px orange border</Block>

// Style + color
<Block debug="dashed blue">Dashed blue border</Block>
<Block debug="dotted green">Dotted green border</Block>
<Block debug="solid red">Solid red border</Block>

// Full control
<Block debug="3px dotted orange">3px dotted orange</Block>
<Block debug="2px dashed">2px dashed red (default color)</Block>

// Panda tokens work too
<Block debug="blue.500">Uses Panda color token</Block>
<Block debug="text-primary">Uses semantic token</Block>
```

### Compound Components

Block includes several compound components accessible via namespace:

#### Progress

```tsx
// Simple progress
<Block is="progress" value={50} max={100} w="200px" h={6} />

// Custom styled progress
<Block is="progress" value={progress} max={100} w="200px" h={6}>
  <Block.Progress.TrackBg
    bg={{ base: "red.200", _dark: "neutral.700" }}
  />
  <Block.Progress.TrackFill
    bg={{
      base: "blue.500",
      _dark: progress > 60 ? "green.400" : "red.400",
    }}
  />
</Block>
```

#### Drawer

```tsx
<Block is="btn" onClick={() => setOpen(true)}>
  Open Drawer
</Block>

<Block is="drawer" open={isOpen} onClose={() => setOpen(false)}>
  <Block.Drawer.CloseButton onClick={() => setOpen(false)} />
  <Block p={8}>
    Drawer content here
  </Block>
</Block>
```

#### Radio

```tsx
// Default radio
<Block
  is="radio"
  defaultValue="1"
  options={[
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
    { label: "Option 3 (disabled)", value: "3", disabled: true },
  ]}
  onChange={(value) => console.log(value)}
  _radioSelected={{ _radioCircleOuter: { borderColor: "blue.400" } }}
/>

// Custom rendered radio
<Block
  is="radio"
  defaultValue="2"
  options={options}
  _radioCircleOuter={{ size: 12, borderColor: "neutral.500" }}
  _radioCircleInner={{ size: 4 }}
  _radioSelected={{ _radioCircleOuter: { borderColor: "violet.400" } }}
  _radioDisabled={{ _radioCircleOuter: { borderColor: "neutral.400" } }}
  renderOption={(option) => (
    <Block.Radio.Item
      cols="/ 10"
      value={option.value}
      disabled={option.disabled}
    >
      {option.label}
    </Block.Radio.Item>
  )}
  onChange={(value) => console.log(value)}
/>
```

#### Switch

```tsx
<Block is="switch" checked={isOn} onChange={setIsOn}>
  <Block.Switch.Track
    bg={{
      base: isOn ? "blue.500!" : "neutral.300",
      _dark: isOn ? "blue.500!" : "neutral.700",
    }}
  />
  <Block.Switch.Thumb bg={{ base: "neutral.100", _dark: "neutral.900" }} />
</Block>
```

#### Accordion

```tsx
<Block is="accordion">
  <Block.Accordion.Item title="Accordion Item 1" cols="/ 10">
    Content for item 1
  </Block.Accordion.Item>
  <Block.Accordion.Item
    title={
      <Block is="txt" color="text-primary">
        Custom Title
      </Block>
    }
    cols="/ 10"
  >
    Content for item 2
  </Block.Accordion.Item>
</Block>
```

#### Input

```tsx
// Simple input
<Block is="input" placeholder="Search" value={value} onChange={handleChange} />

// Input with icon and label
<Block
  is="input"
  placeholder="Search tests"
  pl="28px"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
>
  <Block.Input.LeftIcon
    icon="search"
    left="8px"
    fontSize="xs"
    color="text-secondary"
  />
</Block>

// Input with label
<Block is="input" placeholder="Email">
  <Block.Input.Label>Email Address</Block.Input.Label>
</Block>

// Customizing label styles
// The `bg` prop cascades to the lifted state automatically
<Block is="input" placeholder="Title" value={value} onChange={handleChange}>
  <Block.Input.Label
    fontWeight={500}
    bg={{ base: "neutral.100", _dark: "neutral.900" }}
  >
    Title
  </Block.Input.Label>
</Block>

// Partial override of lifted state (only override what you need)
<Block is="input" placeholder="Email" value={value} onChange={handleChange}>
  <Block.Input.Label
    bg={{ base: "white", _dark: "gray.900" }}
    _labelLifted={{ top: "-12px" }}  // Only changes top, keeps default bg, color, transform
  >
    Email
  </Block.Input.Label>
</Block>

// Different bg for lifted state
<Block is="input" placeholder="Name" value={value} onChange={handleChange}>
  <Block.Input.Label
    bg="transparent"
    _labelLifted={{ bg: "white", top: "-12px" }}  // Different bg when lifted
  >
    Name
  </Block.Input.Label>
</Block>
```

#### Textarea

```tsx
<Block
  is="textarea"
  placeholder="Type something..."
  pl="28px"
  error="This is an error"
  minW={200}
  minRows={2}
  maxRows={8}
  transition=".2s height ease-out"
  value={txtarea}
  onChange={(e) => setTxtareaVal(e.target.value)}
>
  <Block.Textarea.Label>Description</Block.Textarea.Label>
</Block>
```

#### Menu

```tsx
<Block is="menu" variant="click" trigger={<Block is="btn">Open Menu</Block>}>
  <Block.Menu.Container grid rows="/ 4" px={4} py={2} borderRadius="8">
    <Block is="txt" color="text-primary">
      Menu Item 1
    </Block>
    <Block is="txt" color="text-primary">
      Menu Item 2
    </Block>
    <Block is="txt" color="text-primary">
      Menu Item 3
    </Block>
  </Block.Menu.Container>
</Block>
```

#### Tooltip

```tsx
// Simple tooltip (string)
<Block is="btn" tooltip="This is a tooltip">
  Hover me
</Block>

// Custom tooltip with inline styling
<Block
  is="btn"
  tooltip={
    <Block role="tooltip" bg="blue.900" color="blue.400">
      Custom styled tooltip!
    </Block>
  }
>
  Hover for custom tooltip
</Block>

// Styling tooltips with _tooltip condition
// Use _tooltip to style all tooltips from a parent element
<Block
  _tooltip={{
    bg: "violet.900",
    color: "violet.200",
    px: 4,
    py: 2,
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  }}
>
  <Block is="btn" tooltip="Styled via _tooltip condition">
    Hover me
  </Block>
</Block>
```

**Styling Tooltips:**

- **Simple:** Pass a string to the `tooltip` prop for default styling
- **Custom Content:** Pass a React element with `role="tooltip"` to customize content and styling
- **Parent-Level Styling:** Use the `_tooltip` condition from a parent to style all descendant tooltips. The `_tooltip` selector targets elements with `role="tooltip"` or `data-tooltip` attribute.

### Common Utility Props

```tsx
// Sizing
<Block w>Full width (100%)</Block>
<Block w={200}>200px width</Block>
<Block h>Full height (100%)</Block>
<Block size={40}>40px × 40px</Block>

// Spacing
<Block p={4}>Padding 4</Block>
<Block px={2} py={1}>Padding x/y</Block>
<Block m={2}>Margin 2</Block>
<Block mx="auto">Centered horizontally</Block>
<Block gap={4}>Gap for flex/grid children</Block>
<Block rowG={3}>Row gap (grid)</Block>
<Block colG={3}>Column gap (grid)</Block>

// Borders
<Block br={4}>Border radius 4px</Block>
<Block rounded>Fully rounded (9999px)</Block>
<Block border="1px solid" borderColor="neutral.300">
  Custom border
</Block>

// Colors
<Block bg="blue.500">Background color</Block>
<Block color="text-primary">Text color</Block>

// Typography
<Block fontSize="xl">Extra large text</Block>
<Block fontWeight="bold">Bold text</Block>
<Block letterSpacing={0.2}>Letter spacing</Block>

// Display
<Block overflow="hidden">Hidden overflow</Block>
<Block overflowY="auto">Vertical scroll</Block>
<Block opacity={0.5}>50% opacity</Block>

// Positioning
<Block zIndex={10}>Z-index 10</Block>
<Block top={0} left={0}>Positioned</Block>

// Interactions
<Block pointer>Cursor pointer</Block>
<Block cursor="not-allowed">Disabled cursor</Block>
```

### Icon Support

```tsx
// Standalone icon
<Block icon="check-circle" color="green.500" />

// Icon with text
<Block is="btn" icon="search" fontSize="sm">
  Search
</Block>

// Start and end icons
<Block is="btn" startIcon="arrow-left" endIcon="arrow-right">
  Navigate
</Block>

// Loading state
<Block is="btn" isLoading loadingIcon="oval">
  Loading
</Block>

// Custom loading icon size
<Block is="btn" isLoading loadingIconSize={18}>
  Loading
</Block>

// Custom loading icon color (theme-aware)
// Use _loading._svg to target the SVG with PandaCSS conditions
<Block
  is="btn"
  isLoading
  _loading={{
    _svg: {
      strokeColor: { base: "blue.500", _dark: "blue.300" },
    },
  }}
>
  Processing
</Block>

// Custom loading icon color (static)
// For a single color without theme switching, you can use CSS variables directly
<Block
  is="btn"
  isLoading
  _loading={{
    _svg: { strokeColor: "blue.500" },
  }}
>
  Processing
</Block>
```

### Special Features

#### Skeleton Loading

```tsx
// Circle skeleton
<Block is="skeleton" as="circle" />

// Block skeleton
<Block is="skeleton" as="block" h={8} br={4} />
<Block is="skeleton" as="block" h={8} br={4} w="85%" />

// Skeleton layout example
<Block grid rows="/ 18" w>
  <Block flex cols="center / 24">
    <Block is="skeleton" as="circle" />
    <Block grid rows="/ 18" w>
      <Block is="skeleton" as="block" h={8} br={4} />
      <Block is="skeleton" as="block" h={8} br={4} />
    </Block>
  </Block>
  <Block is="skeleton" as="block" h={8} br={4} w="85%" />
</Block>
```

#### Horizontal Rule

```tsx
<Block is="hr" />
<Block is="hr" color="blue.500" />
```

#### File Picker

```tsx
<Block is="btn" filepicker multiple onChange={(files) => handleFiles(files)}>
  Choose Files
</Block>
```

#### Portal Rendering

```tsx
<Block portal>Rendered in portal</Block>
<Block portal portalContainer={customContainer}>
  Custom portal target
</Block>
```

### Kitchen Sink Example

```tsx
// Complex button with all features
<Block
  is="btn"
  grid
  cols="m m / 8"
  rows="center"
  px={4}
  py={2}
  bg={{ base: "blue.500", _dark: "blue.600" }}
  color="white"
  rounded
  icon="check-circle"
  isLoading={isProcessing}
  disabled={!isValid}
  loadingIcon="spinner"
  loadingIconSize={16}
  _loading={{
    _svg: { strokeColor: { base: "white", _dark: "neutral.100" } },
  }}
  _hover={{ bg: "blue.600" }}
  onClick={handleSubmit}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
  tooltip="Submit form"
  debug="dashed blue"
>
  Submit Form
</Block>

// Complex layout composition
<Block
  grid
  rows="m 1 m"
  h="100vh"
  w
  maxW="1200px"
  mx="auto"
  bg={{ base: "neutral.50", _dark: "neutral.900" }}
  borderRadius={12}
  p={6}
  gap={4}
>
  {/* Header */}
  <Block
    is="seo"
    as="header"
    grid
    cols="1 m / 12"
    alignI="center"
    borderBottom="1px solid"
    borderColor="neutral.200"
    pb={4}
  >
    <Block is="txt" as="h1" fontSize="2xl" fontWeight="bold">
      Dashboard
    </Block>
    <Block is="btn" icon="settings" variant="ghost">
      Settings
    </Block>
  </Block>

  {/* Main Content */}
  <Block
    is="seo"
    as="main"
    grid
    rows="/ 24"
    overflow="auto"
  >
    <Block
      grid
      cols="1 1 1 / 16"
      rows="/ 16"
      bg="white"
      br={8}
      p={4}
      debug="neutral.200"
    >
      <Block
        is="progress"
        value={progress}
        max={100}
        h={6}
      >
        <Block.Progress.TrackFill bg="green.500" />
      </Block>
      {/* More content */}
    </Block>
  </Block>

  {/* Footer */}
  <Block
    is="seo"
    as="footer"
    flex
    cols="center / 8"
    borderTop="1px solid"
    borderColor="neutral.200"
    pt={4}
  >
    <Block is="txt" fontSize="xs" color="text-secondary">
      © 2025 Your Company
    </Block>
  </Block>
</Block>
```

### Responsive Design

All props support Panda's responsive syntax:

```tsx
<Block
  grid
  cols={{ base: "1", md: "1 1", lg: "1 1 1" }}
  gap={{ base: 4, md: 6, lg: 8 }}
  p={{ base: 2, sm: 4, md: 6 }}
  fontSize={{ base: "sm", md: "md", lg: "lg" }}
>
  Responsive content
</Block>
```

### Theme Awareness

Block automatically supports light/dark themes:

```tsx
<Block
  bg={{ base: "white", _dark: "neutral.900" }}
  color={{ base: "neutral.900", _dark: "neutral.100" }}
  borderColor={{ base: "neutral.200", _dark: "neutral.700" }}
>
  Theme-aware content
</Block>
```

### TypeScript Support

Block is fully typed with TypeScript:

```tsx
// Type-safe is/as combinations
<Block is="txt" as="h1">Title</Block> // ✅
<Block is="list" as="ul">List</Block> // ✅
<Block is="seo" as="nav">Nav</Block> // ✅

// Compile-time errors for invalid combinations
<Block is="txt" as="ul">Invalid</Block> // ❌ Error
<Block is="list">Missing as</Block> // ❌ Error

// Proper event typing
<Block is="btn" onClick={(e: React.MouseEvent) => {}}>
  Typed events
</Block>
```

### Best Practices

1. **Use semantic HTML**: Always provide the `as` prop for proper SEO and accessibility
2. **Prefer grid/flex**: Use the boolean `grid` and `flex` props for containers; use `basis` for flex item sizing
3. **Leverage cols/rows**: The shorthand syntax is more readable than verbose gridTemplateColumns
4. **Debug visually**: Use `debug` prop during development to understand layouts
5. **Compound components**: Use Block compound components instead of mixing component types
6. **Responsive by default**: Always consider mobile-first responsive design
7. **Type safety**: Let TypeScript guide you to correct `is`/`as` combinations

## License

MIT
