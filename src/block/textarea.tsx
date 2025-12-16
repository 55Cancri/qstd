import React from "react";
import { MotionConfig } from "framer-motion";

import * as _f from "./fns";
import * as _t from "./types";
import * as _l from "./literals";

/**
 * Textarea (PandaCSS + autosize)
 *
 * Story:
 * - Renders a PandaCSS-styled `<textarea>` that grows/shrinks to fit content.
 * - To compute the required height we copy the textarea's text-related styles
 *   to a single hidden textarea, write the same content, read its scrollHeight,
 *   and apply the resulting height via inline style with `!important` so theme
 *   overrides can't break sizing.
 * - We recalc height when value/placeholder/minRows/maxRows change, and also
 *   on window resize and when fonts finish loading (font metrics change line
 *   heights). Uncontrolled form resets are handled by waiting a frame so the
 *   browser can update the value first, then we measure.
 * - minRows/maxRows are respected in both content-box and border-box models.
 */

type LabelProps = {
  value?: _t.TextareaBlockProps["value"];
  required?: boolean;
  error?: string;
};

const LabelNameKey = "Label";
const Base = _l.base;

const isBrowser = typeof window !== "undefined";
// Measure synchronously after DOM mutations but before paint to avoid
// visible jumps. On the server, fall back to a no-op effect to avoid warnings.
const useIsomorphicLayoutEffect = isBrowser
  ? React.useLayoutEffect
  : React.useEffect;

//

/**
 * Utility function to pick specific properties from an object
 * Used to extract only the CSS properties we need for sizing calculations
 */
function pick<Obj extends { [key: string]: any }, Key extends keyof Obj>(
  props: Key[],
  obj: Obj
): Pick<Obj, Key> {
  return props.reduce((acc, prop) => {
    acc[prop] = obj[prop];
    return acc;
  }, {} as Pick<Obj, Key>);
}

// Simple helper to merge internal and user refs without extra bookkeeping
function assignRefs<T>(
  targetRef: React.MutableRefObject<T | null>,
  userRef: React.Ref<T> | undefined
) {
  return (node: T | null) => {
    targetRef.current = node;
    if (!userRef) return;
    if (typeof userRef === "function") userRef(node);
    else (userRef as React.MutableRefObject<T | null>).current = node;
  };
}

/**
 * CSS styles for the hidden textarea used for height measurements.
 * We set these via style.setProperty(..., 'important') to ensure no page
 * CSS can leak and affect measurements.
 */
const HIDDEN_TEXTAREA_STYLE = {
  display: "block",
  position: "absolute",
  "max-height": "none",
  "min-height": "0",
  height: "0",
  top: "0",
  right: "0",
  "z-index": "-1000",
  visibility: "hidden",
  overflow: "hidden",
} as const;

/**
 * Applies the hidden styles to a textarea element
 * Uses setProperty with 'important' to ensure styles aren't overridden
 */
const forceHiddenStyles = (node: HTMLElement) => {
  Object.keys(HIDDEN_TEXTAREA_STYLE).forEach((key) => {
    node.style.setProperty(
      key,
      HIDDEN_TEXTAREA_STYLE[key as keyof typeof HIDDEN_TEXTAREA_STYLE],
      "important"
    );
  });
};

/**
 * CSS properties that meaningfully affect text layout/height.
 * These are copied from the live element to the hidden measurement element.
 */
const SIZING_STYLE = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  // Non-standard but may affect sizing
  "tabSize",
  "textIndent",
  "textRendering",
  "textTransform",
  "width",
  "wordBreak",
  "wordSpacing",
  "scrollbarGutter",
] as const;

/**
 * Extract only the CSS properties that exist in CSSStyleDeclaration
 */
type SizingProps = Extract<
  (typeof SIZING_STYLE)[number],
  keyof CSSStyleDeclaration
>;

/**
 * Subset of computed style we care about for sizing calculations
 */
type SizingStyle = Pick<CSSStyleDeclaration, SizingProps>;

/**
 * Data structure containing all information needed for height calculations
 */
type SizingData = {
  sizingStyle: SizingStyle;
  paddingSize: number;
  borderSize: number;
};

/**
 * Extract sizing data from a DOM element
 */
const getSizingData = (node: HTMLElement): SizingData | null => {
  const style = window.getComputedStyle(node);

  if (!style) return null;

  const sizingStyle = pick(SIZING_STYLE as unknown as SizingProps[], style);
  const { boxSizing } = sizingStyle;

  // Probably node is detached from DOM, can't read computed dimensions
  if (!boxSizing) return null;

  // Calculate total padding (top + bottom)
  const paddingSize =
    parseFloat(sizingStyle.paddingBottom!) +
    parseFloat(sizingStyle.paddingTop!);

  // Calculate total border width (top + bottom)
  const borderSize =
    parseFloat(sizingStyle.borderBottomWidth!) +
    parseFloat(sizingStyle.borderTopWidth!);

  return { sizingStyle, paddingSize, borderSize };
};

// Internal note: calculation helper returns [finalHeight, rowHeight]

/**
 * Global hidden textarea element used for height calculations
 * Reused across all instances for performance
 */
// One shared hidden textarea for measurement across all component instances.
// Creating a new element per instance would be costly and provide no benefit.
let hiddenTextarea: HTMLTextAreaElement | null = null;

/**
 * Calculate final height for the current content, honoring box-sizing.
 */
const getHeight = (node: HTMLElement, sizingData: SizingData) => {
  const height = node.scrollHeight;

  if (sizingData.sizingStyle.boxSizing === "border-box") {
    // border-box: add border, since height = content + padding + border
    return height + sizingData.borderSize;
  }

  // content-box: remove padding, since height = content only
  return height - sizingData.paddingSize;
};

/**
 * Calculate required height for content using a hidden textarea.
 * Returns [finalHeightPx, singleRowHeightPx].
 */
function calculateNodeHeight(
  sizingData: SizingData,
  value: string,
  minRows = 1,
  maxRows = Infinity
): [number, number] {
  // Create hidden textarea if it doesn't exist
  if (!hiddenTextarea) {
    hiddenTextarea = document.createElement("textarea");
    hiddenTextarea.setAttribute("tabindex", "-1");
    hiddenTextarea.setAttribute("aria-hidden", "true");
    forceHiddenStyles(hiddenTextarea);
  }

  // Ensure hidden textarea is in the DOM
  if (hiddenTextarea.parentNode === null) {
    document.body.appendChild(hiddenTextarea);
  }

  const { paddingSize, borderSize, sizingStyle } = sizingData;
  const { boxSizing } = sizingStyle;

  // Copy all relevant styles to the hidden textarea
  Object.keys(sizingStyle).forEach((_key) => {
    const key = _key as keyof typeof sizingStyle;
    hiddenTextarea!.style[key] = sizingStyle[key];
  });

  // Ensure hidden styles are applied
  forceHiddenStyles(hiddenTextarea);

  // Set the content and measure height
  hiddenTextarea.value = value;
  let height = getHeight(hiddenTextarea, sizingData);

  // Double set and calc due to Firefox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1795904
  hiddenTextarea.value = value;
  height = getHeight(hiddenTextarea, sizingData);

  // Measure height of a textarea with exactly one row (baseline row height)
  hiddenTextarea.value = "x";
  const rowHeight = hiddenTextarea.scrollHeight - paddingSize;

  // Apply minimum row constraint
  let minHeight = rowHeight * minRows;
  if (boxSizing === "border-box") {
    minHeight = minHeight + paddingSize + borderSize;
  }
  height = Math.max(minHeight, height);

  // Apply maximum row constraint
  let maxHeight = rowHeight * maxRows;
  if (boxSizing === "border-box") {
    maxHeight = maxHeight + paddingSize + borderSize;
  }
  height = Math.min(maxHeight, height);

  return [height, rowHeight];
}

// Base styled textarea component (PandaCSS)
const Txtarea = _l.tags.textarea;

/**
 * Unified Textarea component (PandaCSS + Autosize)
 * - Accepts full Block textarea props and forwards them to styled textarea
 * - Handles autosizing with minRows/maxRows
 */
export default function Textarea(props: _t.TextareaBlockProps) {
  const {
    maxRows,
    minRows,
    onChange,
    onHeightChange,
    ref: userRef,
    children,
    _motion,
    error,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;

  // Controlled vs uncontrolled: if parent sets `value`, they control content.
  // For controlled inputs, the effect watching `value` will resize. For
  // uncontrolled, we resize on every local change event.
  const isControlled = (rest as any).value !== undefined;
  const libRef = React.useRef<HTMLTextAreaElement | null>(null);
  const ref = assignRefs(libRef, userRef);
  const heightRef = React.useRef(0);

  const [_value, _setValue] = React.useState("");
  const value = props.value ?? _value;

  const label = _f.findChildrenByDisplayName<_t.BaseBlockProps & LabelProps>(
    children as React.ReactNode,
    LabelNameKey
  );

  const labelWithProps = label
    ? React.cloneElement<_t.BaseBlockProps & LabelProps>(label, {
        required: props.required,
        value: props.value,
        error,
      })
    : null;

  const resizeTextarea = () => {
    const node = libRef.current;
    if (!node) return;

    const nodeSizingData = getSizingData(node);
    if (!nodeSizingData) return;

    const value = node.value || node.placeholder || "x";
    const [height, rowHeight] = calculateNodeHeight(
      nodeSizingData,
      value,
      minRows,
      maxRows
    );

    if (heightRef.current !== height) {
      heightRef.current = height;
      node.style.setProperty("height", `${height}px`, "important");
      onHeightChange?.(height, { rowHeight });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Uncontrolled: resize immediately on local changes.
    // Controlled: parent updates `value`, which triggers the effect.
    if (!isControlled) resizeTextarea();
    _setValue(e.target.value);
    onChange?.(e);
  };

  // Initial measure + on value/placeholder/row-constraint changes
  useIsomorphicLayoutEffect(() => {
    resizeTextarea();
  }, [rest.value, rest.placeholder, minRows, maxRows]);

  // Recalculate on window resize
  // Window resize may change available width and line wrapping, so re-measure.
  React.useEffect(() => {
    if (!isBrowser) return;
    const onResize = () => resizeTextarea();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minRows, maxRows, rest.placeholder, rest.value]);

  // Recalculate when fonts finish loading (affects metrics)
  // Font loading can change glyph metrics and line heights; re-measure once
  // fonts are fully loaded to avoid under/over-estimation of content height.
  React.useEffect(() => {
    const fonts = isBrowser ? document.fonts : undefined;
    if (!fonts || typeof fonts.addEventListener !== "function") return;
    const onFontsLoaded = () => resizeTextarea();
    fonts.addEventListener("loadingdone", onFontsLoaded);
    return () => fonts.removeEventListener("loadingdone", onFontsLoaded);
  }, [minRows, maxRows, rest.placeholder, rest.value]);

  // Handle form resets (if uncontrolled)
  // For uncontrolled forms, a browser-initiated reset updates the element's
  // value asynchronously. We `requestAnimationFrame` to run after the DOM has
  // applied the new value, then measure with the updated content.
  React.useEffect(() => {
    const node = libRef.current;
    const form = node?.form;
    if (!node || !form || isControlled) return;
    const onReset = () => {
      const currentValue = node.value;
      requestAnimationFrame(() => {
        if (node && currentValue !== node.value) resizeTextarea();
      });
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [isControlled]);

  const resize = props.resize ?? "none";
  // When debug is provided, skip default border styling so debug border shows
  const hasDebug = "debug" in rest && rest.debug !== undefined;

  return (
    <Base grid rows="/ 4">
      <Base grid relative>
        {labelWithProps}
        <MotionConfig {...(_motion && { transition: _motion })}>
          <Txtarea
            ref={ref}
            value={value}
            onContextMenu={(e) => e.preventDefault()}
            resize={resize}
            pt={0.5}
            pb={0.5}
            px={2}
            color="text-primary"
            {...(!hasDebug && {
              border: "1.5px solid",
              borderColor: error ? "input-border-color-error" : "input-border-color",
            })}
            {...(error && { outlineColor: "input-outline-color-error" })}
            borderRadius={8}
            // empty space so that label is lifted based on :placeholder-shown
            placeholder={props.placeholder ?? " "}
            // hide placeholder by default so that label is shown over
            // blurred textarea without placeholder showing behind it
            _placeholder={{
              color: "input-label-color",
              opacity: label ? 0 : 1,
            }}
            // on textarea focus, after the label has lifted, show the placeholder
            // if its provided, otherwise " " will not show anything
            _focusWithin={{ _placeholder: { opacity: 1 } }}
            css={{
              boxSizing: "border-box",
              /* Works on Firefox */
              scrollbarWidth: "thin",
              scrollbarColor: "neutral.300 neutral.300",
              /* Works on Chrome, Edge, and Safari */
              "&::-webkit-scrollbar": { height: 6, width: 6 },
              "&::-webkit-scrollbar-track": {
                background: "transparent !important",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "neutral.300",
                borderRadius: 20,
              },
            }}
            {...rest}
            onChange={handleChange}
          />
        </MotionConfig>
      </Base>

      {error && (
        <Base pl={3} fontSize="sm" color="text-alert">
          {error}
        </Base>
      )}
    </Base>
  );
}

export function Label(props: _t.BaseBlockProps & LabelProps) {
  const {
    value,
    error,
    required,
    children,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;

  return (
    <Base
      position="absolute"
      gridAutoFlow="column"
      top={1}
      transformOrigin="top left"
      transform="translate(0, 0) scale(1)"
      transition="200ms cubic-bezier(0, 0, 0.2, 1) 0ms, .2s color ease-in-out, .2s background ease-in-out"
      ml={1}
      mr={1}
      px={2}
      py={0.5}
      br={8}
      pointerEvents="none"
      color="input-label-color"
      zIndex={1} // Ensure label appears above textarea
      css={{
        // lift label when sibling textarea has focus or blurred but not empty
        "&:has(+ textarea:focus, + textarea:not(:placeholder-shown))": {
          transformOrigin: "top left",
          transform: "scale(0.8)",
          top: "-14px",
          color: value ? "input-label-color-lifted" : "input-label-color",
          // only when lifted since autocomplete has lightblue background
          bg: "input-label-bg",
        },
        ...(error && { color: "text-alert" }),
      }}
      {...rest}
    >
      {children as React.ReactNode}
      {required && "*"}
    </Base>
  );
}

Label.displayName = LabelNameKey;
