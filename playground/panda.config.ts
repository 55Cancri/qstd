import { defineConfig } from "@pandacss/dev";
import qstdPreset from "qstd/preset";

export default defineConfig({
  preflight: true,

  // Use qstd preset PLUS Panda's base preset
  // IMPORTANT: Must include '@pandacss/dev/presets' to get default colors (neutral, gray, red, etc.)
  // Without it, you only get what's in qstdPreset and lose all Panda defaults!
  presets: ["@pandacss/dev/presets", qstdPreset],

  // CRITICAL: Scan playground source AND the built qstd distribution files
  // DO NOT scan qstd source (../src) - this creates duplicate styles and breaks styling
  // Instead, scan the built dist files from node_modules - this is how real consumers use qstd
  include: ["./src/**/*.{ts,tsx}", "./node_modules/qstd/dist/**/*.{js,mjs}"],

  exclude: [],

  outdir: "styled-system",
  jsxFramework: "react",
});
