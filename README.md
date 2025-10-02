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
  presets: [qstdPreset],
  include: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Your custom theme
    },
  },
});
```

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

## License

MIT
