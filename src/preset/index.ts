import type { Preset } from "@pandacss/dev";

const preset: Preset = {
  name: "qstd-preset",
  
  globalCss: {
    ":root": { colorScheme: "light dark" },
    html: {
      fontSize: 16,
      lineHeight: 1.5,
      fontFamily: "geologica, sans-serif",
    },
  },

  theme: {
    semanticTokens: {
      colors: {
        "text-primary": { value: { base: "{colors.neutral.900}", _dark: "{colors.neutral.100}" } },
        "text-secondary": { value: { base: "{colors.neutral.400}", _dark: "{colors.neutral.400}" } },
        "text-inverted": { value: { base: "{colors.neutral.100}", _dark: "{colors.neutral.900}" } },
        "text-alert": { value: { base: "{colors.red.600}", _dark: "{colors.red.400}" } },
        "input-border-color": { value: { base: "{colors.neutral.300}", _dark: "{colors.neutral.600}" } },
        "input-border-color-error": { value: { base: "{colors.red.400}", _dark: "{colors.red.400}" } },
        "input-outline-color-error": { value: { base: "{colors.red.500}", _dark: "{colors.red.500}" } },
        "input-label-color": { value: { base: "{colors.neutral.400}", _dark: "{colors.neutral.400}" } },
        "input-label-color-lifted": { value: { base: "{colors.blue.500}", _dark: "{colors.blue.500}" } },
        "input-label-bg": { value: { base: "{colors.neutral.100}", _dark: "{colors.neutral.800}" } },
      },
    },
    extend: {
      breakpoints: { xs: "600px" },
      keyframes: {
        spin: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        sheen: { from: { backgroundPositionX: "200%" }, to: { backgroundPositionX: "-200%" } },
        pulse: { "0%": { transform: "scale(1, 1)" }, "50%": { opacity: 0.3 }, "100%": { transform: "scale(1.3)", opacity: 0 } },
      },
    },
  },

  conditions: {
    extend: {
      dark: "[data-theme=dark] &",
      activeMouse: "&:active:not(:focus-visible):not(:disabled)",
      activeKeyboard: "&:active:focus-visible:not(:disabled)",
      active: "&:active:not(:disabled), &:active:not(:focus-visible):not(:disabled), &:active:focus-visible:not(:disabled)",
      hover: "&:hover:not(:disabled)",
      checkbox: "& [data-checkbox]",
      radioLabel: "& [data-radio-label]",
      radioDisabled: "& :is(:disabled, [disabled], [data-disabled], [aria-disabled=true])",
      radioSelected: "& :is([aria-selected=true], [data-selected])",
      radioCircleOuter: "& [data-radio-outer]",
      radioCircleInner: "& [data-radio-inner]",
      radioFocusRing: "& [data-radio-focusring]",
      backdrop: "[data-backdrop]:has(> &)",
      path: "& path",
      svg: "& svg",
    },
  },

  utilities: {
    grid: {
      values: { type: "boolean" },
      transform() { return { display: "grid" }; },
    },
    flex: {
      values: { type: "boolean" },
      transform(value) {
        return { display: "flex", ...(typeof value === "string" && { flexWrap: value as any }) };
      },
    },
    center: { values: { type: "boolean" }, transform() { return { placeContent: "center", placeItems: "center" }; } },
    relative: { values: { type: "boolean" }, transform() { return { position: "relative" }; } },
    absolute: { values: { type: "boolean" }, transform() { return { position: "absolute" }; } },
    fixed: { values: { type: "boolean" }, transform() { return { position: "fixed" }; } },
    sticky: { values: { type: "boolean" }, transform() { return { position: "sticky" }; } },
    rounded: {
      values: { type: "boolean" },
      transform(value: boolean | number) {
        return { borderRadius: typeof value === "boolean" ? 9999 : value };
      },
    },
    size: {
      values: { type: "number" },
      transform(value: number) { return { width: value, height: value }; },
    },
    pointer: { values: { type: "boolean" }, transform() { return { cursor: "pointer" }; } },
    strokeColor: {
      values: "colors",
      transform(value: string) { return { "&, & path": { stroke: value } }; },
    },
    strokeWidth: {
      values: { type: "number" },
      transform(value: number) { return { "&, & path": { strokeWidth: value } }; },
    },
    debug: {
      values: { type: "boolean" },
      transform(value) {
        if (value === true) return { border: "1px solid red" };
        if (typeof value === "string") {
          const parts = value.trim().split(/\s+/);
          let borderWidth = "1px", borderStyle = "solid", borderColor = "red";
          parts.forEach((part) => {
            if (/^\d+(\.\d+)?(px|em|rem|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)$/.test(part)) borderWidth = part;
            else if (/^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/.test(part)) borderStyle = part;
            else borderColor = part;
          });
          const isKeyword = /^(currentColor|transparent|inherit|initial|unset|revert)$/i.test(borderColor);
          const isHex = /^#/.test(borderColor);
          const isFunc = /^(rgb|rgba|hsl|hsla|lab|lch|oklab|oklch|color)\(/i.test(borderColor);
          const isVarRef = /^var\(/.test(borderColor);
          const looksLikeScaleToken = /^[a-zA-Z][\w-]*\.\d{2,3}$/.test(borderColor);
          const looksLikeSemanticToken = /^[a-zA-Z][\w-]*-[\w-]+$/.test(borderColor);
          const shouldWrap = !isKeyword && !isHex && !isFunc && !isVarRef && (looksLikeScaleToken || looksLikeSemanticToken);
          const normalizedBorderColor = shouldWrap ? `var(--colors-${borderColor.replace(/\./g, "-")})` : borderColor;
          return { borderWidth, borderStyle, borderColor: normalizedBorderColor };
        }
        return { border: "1px solid red" };
      },
    },
    cols: {
      transform(value) {
        if (typeof value !== "string") return {};
        const [templatePart, gapPart] = value.split("/").map((s) => s.trim());
        const templateWords = templatePart.split(/\s+/);
        let alignContent = "", gridTemplate = "", columnGap = "";
        const alignmentValues = ["start", "center", "end"];
        if (alignmentValues.includes(templateWords[0])) {
          alignContent = templateWords[0];
          if (templateWords.length > 1) gridTemplate = templateWords.slice(1).join(" ");
        } else gridTemplate = templateWords.join(" ");
        if (gridTemplate) {
          gridTemplate = gridTemplate.split(/\s+/).map((part) => {
            if (/^\d+$/.test(part)) return `${part}fr`;
            if (part === "m" || part === "mx") return "max-content";
            return part;
          }).join(" ");
        }
        if (gapPart) {
          const gapValue = gapPart.trim();
          columnGap = /^\d+$/.test(gapValue) ? `${gapValue}px` : gapValue;
        }
        const result = {} as any;
        if (alignContent) { result.alignContent = alignContent; result.alignItems = alignContent; }
        if (gridTemplate) result.gridTemplateColumns = gridTemplate;
        if (columnGap) result.columnGap = columnGap;
        return result;
      },
    },
    rows: {
      transform(value) {
        if (typeof value !== "string") return {};
        const [templatePart, gapPart] = value.split("/").map((s) => s.trim());
        const templateWords = templatePart.split(/\s+/);
        let justifyContent = "", gridTemplate = "", rowGap = "";
        const justifyValues = ["start", "end", "between", "center"];
        const justifyValue = justifyValues.includes(templateWords[0]) ? templateWords[0] : "";
        if (justifyValue) {
          justifyContent = justifyValue === "between" ? "space-between" : justifyValue;
          if (templateWords.length > 1) gridTemplate = templateWords.slice(1).join(" ");
        } else gridTemplate = templateWords.join(" ");
        if (gridTemplate) {
          gridTemplate = gridTemplate.split(/\s+/).map((part) => {
            if (/^\d+$/.test(part)) return `${part}fr`;
            if (part === "m" || part === "mx") return "max-content";
            return part;
          }).join(" ");
        }
        if (gapPart) {
          const gapValue = gapPart.trim();
          rowGap = /^\d+$/.test(gapValue) ? `${gapValue}px` : gapValue;
        }
        const result = {} as any;
        if (justifyContent) { result.justifyContent = justifyContent; result.justifyItems = justifyContent; }
        if (gridTemplate) result.gridTemplateRows = gridTemplate;
        if (rowGap) result.rowGap = rowGap;
        return result;
      },
    },
    extend: {
      gridAutoColumns: { shorthand: "autoCols", values: { type: "boolean" }, transform(value) { return { gridAutoFlow: "column", gridAutoColumns: value === true ? "max-content" : value }; } },
      placeI: { values: { type: "boolean" }, transform(value) { return { placeItems: value === true ? "center" : value }; } },
      placeC: { values: { type: "boolean" }, transform(value) { return { placeContent: value === true ? "center" : value }; } },
      placeS: { values: { type: "boolean" }, transform(value) { return { placeSelf: value === true ? "center" : value }; } },
      alignI: { values: { type: "boolean" }, transform(value) { return { alignItems: value === true ? "center" : value }; } },
      alignC: { property: "alignContent", values: { type: "boolean" }, transform(value) { return { alignContent: value === true ? "center" : value }; } },
      alignS: { values: { type: "boolean" }, transform(value) { return { alignSelf: value === true ? "center" : value }; } },
      justifyI: { values: { type: "boolean" }, transform(value) { return { justifyItems: value === true ? "center" : value }; } },
      justifyC: { values: { type: "boolean" }, transform(value) { return { justifyContent: value === true ? "center" : value }; } },
      justifyS: { values: { type: "boolean" }, transform(value) { return { justifySelf: value === true ? "center" : value }; } },
      colN: { values: { type: "number" }, transform(value) { return { gridColumn: value }; } },
      spaceBetween: { values: { type: "true" }, transform() { return { justifyContent: "space-between" }; } },
      rowN: { values: { type: "number" }, transform(value) { return { gridRow: value }; } },
      columnGap: { shorthand: "colG", values: { type: "number" }, transform(value) { return { columnGap: value }; } },
      gridColumnStart: { shorthand: "colStart", values: { type: "number" }, transform(value) { return { gridColumnStart: value }; } },
      gridColumnEnd: { shorthand: "colEnd", values: { type: "number" }, transform(value) { return { gridColumnEnd: value }; } },
      gridRowStart: { shorthand: "rowStart", values: { type: "number" }, transform(value) { return { gridRowStart: value }; } },
      gridRowEnd: { shorthand: "rowEnd", values: { type: "number" }, transform(value) { return { gridRowEnd: value }; } },
      rowGap: { shorthand: "rowG", values: { type: "number" }, transform(value) { return { rowGap: value }; } },
      position: { shorthand: "pos", transform(value) { return { position: value }; } },
      height: { shorthand: "h", values: { type: "boolean" }, transform(value) { return { height: value === true ? "100%" : value }; } },
      width: { shorthand: "w", values: { type: "boolean" }, transform(value) { return { width: value === true ? "100%" : value }; } },
      padding: { shorthand: "p", transform(value) { return { padding: value }; } },
      mr: { transform(value) { return { marginRight: value }; } },
      border: { values: { type: "boolean" }, transform(value) { return { border: value === true ? "1px solid red" : value }; } },
      ar: { values: { type: "boolean" }, transform(value) { return { aspectRatio: value === true ? 1 : value }; } },
      aspectRatio: { shorthand: "ar", values: { type: "boolean" }, transform(value) { return { aspectRatio: value === true ? 1 : value }; } },
      borderRadius: { className: "rounded", shorthand: "br", values: { type: "boolean" }, transform(value) { return { borderRadius: value === true ? 9999 : value }; } },
    },
  },
};

export default preset;
