import React from "react";
import { nanoid } from "nanoid";
import type {
  IconDefinition,
  IconName,
} from "@fortawesome/free-solid-svg-icons";
import type { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RotatingLines } from "react-loader-spinner";
import { css } from "panda/css";

import * as _l from "./literals";
import * as _t from "./types";

// Internal types for fns.tsx - avoid exposing any
type InternalBlockProps = _t.SharedBlockProps &
  _t.LoadingProps &
  Record<string, unknown>;

type GetIconProps = _t.IconProps &
  _t.LoadingProps & {
    className?: string;
    _loading?: { strokeWidth?: number | string; strokeColor?: unknown };
    strokeColor?: unknown;
    strokeWidth?: number;
    size?: SizeProp; // FA size prop (separate from PandaCSS size)
  };

/**
 * Get preview, height, and width of image.
 * @param f
 * @returns
 */
export const extractImageMetadata = (f: File) => {
  return new Promise<ImageFile>((res, rej) => {
    if (!f) rej(new Error("No image file provided."));

    const ext = f.type.split("/").pop();
    const id = `${ext}_${nanoid()}.${ext}`;
    const preview = URL.createObjectURL(f);
    const image = new Image();
    image.onload = () => {
      const { height, width } = image;

      let orientation = "" as ImageFile["orientation"];
      if (height === width) orientation = "square";
      else if (height > width) orientation = "portrait";
      else orientation = "landscape";

      res({ id, preview, orientation, height, width } as ImageFile);
    };

    image.onerror = () => {
      if (ext?.includes("tif")) {
        const { height, width } = image;

        let orientation = "" as ImageFile["orientation"];
        if (height === width) orientation = "square";
        else if (height > width) orientation = "portrait";
        else orientation = "landscape";

        res({ id, preview, orientation, height, width } as ImageFile);
      } else {
        console.log("image error");
        rej(new Error("Image failed to load."));
      }
    };

    // trigger onload to return preview, h, and w in promise
    image.src = preview;
  });
};

export const extractAudioMetadata = async (f: File) => {
  // thoroughly extact data from audio file
  const mmb = await import("music-metadata-browser");
  const meta = await mmb.parseBlob(f, { duration: true });

  return new Promise<AudioFile>((res, rej) => {
    if (!f) rej(new Error("No audio file provided."));

    // use extension to create an id
    const ext = f.name.split(".").pop();
    const id = `${ext}_${nanoid()}.${ext}`;

    // create the cover url
    const [cover] = meta.common.picture ?? [];
    const preview = cover
      ? URL.createObjectURL(
          new Blob([cover.data as BlobPart], { type: cover.format })
        )
      : "";

    // serialize and return the metadata
    const audioMetadata = {
      id,
      preview,
      source: { ...meta.format, ...meta.common },
    };

    res(audioMetadata as unknown as AudioFile);
  });
};

/**
 * Get duration, height, and width of video.
 * @param f
 * @returns
 */
export const extractVideoMetadata = (f: File) => {
  return new Promise<File>((res, rej) => {
    if (!f) rej(new Error("No video file provided."));

    const ext = f.type.split("/").pop();
    const id = `${ext}_${nanoid()}.${ext}`;
    const video = document.createElement("video");

    video.addEventListener("loadedmetadata", () => {
      const height = video.videoHeight;
      const width = video.videoWidth;
      const duration = video.duration;

      let orientation = "" as ImageFile["orientation"];
      if (height === width) orientation = "square";
      else if (height > width) orientation = "portrait";
      else orientation = "landscape";

      res({ id, orientation, duration, height, width } as VideoFile);
    });
    video.src = URL.createObjectURL(f);
  });
};

/**
 * Adds metadata to files based on their file type.
 * @example a file of type "image/png" will get a height and width
 * @param f
 * @returns
 */
export const prepareFiles = async <T extends File>(acceptedFiles: File[]) => {
  return Promise.all(
    acceptedFiles.map(async (f) => {
      // if image file, add id, preview, orientation, height, width
      if (f.type.startsWith("image")) {
        const metadata = await extractImageMetadata(f);
        return Object.assign(f, metadata) as ImageFile;
      } else if (f.type.startsWith("audio")) {
        const metadata = await extractAudioMetadata(f);
        return Object.assign(f, metadata) as AudioFile;
      } else if (f.type.startsWith("video")) {
        const metadata = await extractVideoMetadata(f);
        return Object.assign(f, metadata) as ImageFile;
      } else {
        //

        /**
         * jpg, png, pdf, docx, xlsx, pptx, or vnd.openxmlformats-officedocument.wordprocessingml.document
         * NOTE: for vnd.openxmlformats-officedocument.wordprocessingml.document, the generated id will be long and seem odd:
         * @example vnd.openxmlformats-officedocument.wordprocessingml.document_2v9SjsgZxb28LIChMrz71.vnd.openxmlformats-officedocument.wordprocessingml.document
         */
        const ext = f.type.split("/").pop();
        const id = `${ext}_${nanoid()}.${ext}`;
        const metadata = { id };
        return Object.assign(f, metadata);
      }
    })
  ) as Promise<T[]>;
};

export const findChildrenByDisplayName = <P extends object>(
  children: React.ReactNode,
  displayName: string
): React.ReactElement<P> | undefined => {
  return React.Children.toArray(children).find(
    (child): child is React.ReactElement<P> => {
      if (React.isValidElement(child)) {
        const childType = child.type as React.ComponentType<P>;
        return childType.displayName === displayName;
      } else {
        return false;
      }
    }
  );
};

export const extractElType = (is: _t.Is, props: { filepicker?: boolean }) => {
  let el: keyof typeof _l.tags = "div";
  if (is === "txt") el = "p";
  else if (is === "hr") el = "hr";
  else if (is === "btn") el = "button";
  else if (is === "link") el = "button";
  else if (is === "img") el = "img";
  else if (is === "input") el = "input";
  else if (is === "accordion") el = "div";
  else if (is === "textarea") el = "textarea";
  else if (is === "checkbox") el = "button";
  else if (is === "radio") el = "div";
  else if (is === "skeleton") el = "div";
  else if (is === "switch") el = "button";
  else if (is === "select") el = "select";
  else if (is === "blockquote") el = "blockquote";
  else if (is === "pre") el = "pre";
  else if (is === "progress") el = "progress";
  else if (is === "slider") el = "div";
  else if (is === "drawer") el = "div";
  else if (is === "menu") el = "div";
  else if (is === "form") el = "form";
  else if (is === "table") el = "table";
  else if (is === "list") el = "ul";
  else if (is === "seo") el = "section";
  else el = "div";

  const isHr = is === "hr";
  const isLink = is === "link";
  const isMenu = is === "menu";
  const isInput = is === "input";
  const isRadio = is === "radio";
  const isDrawer = is === "drawer";
  const isSwitch = is === "switch";
  const isSlider = is === "slider";
  const isSkeleton = is === "skeleton";
  const isCheckbox = is === "checkbox";
  const isTextarea = is === "textarea";
  const isProgress = is === "progress";
  const isAccordion = is === "accordion";
  const isBtnLike = is === "btn" || is === "link";

  const filepickerAllowed =
    (!is && props.filepicker) ||
    (is &&
      (is === "txt" || is === "btn" || is === "link" || is === "img") &&
      props.filepicker);

  const isVoidElement = el === "img" || el === "input" || el === "hr";

  return {
    el,
    is,
    isMenu,
    isLink,
    isInput,
    isRadio,
    isSwitch,
    isSlider,
    isBtnLike,
    isAccordion,
    filepickerAllowed,
    isVoidElement,
    isTextarea,
    isCheckbox,
    isSkeleton,
    isProgress,
    isDrawer,
    isHr,
  };
};

export const extractElAndStyles = (
  extract: ReturnType<typeof extractElType>,
  anyProps: InternalBlockProps
) => {
  const {
    _motion,
    layout,
    initial,
    animate,
    exit,
    whileTap,
    whileHover,
    whileFocus,
    variants,
    custom,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = anyProps;

  // When `as` prop is provided and exists in our tag maps, use it for element selection
  // This ensures motion props work correctly with polymorphic elements
  const asTag = anyProps.as as keyof typeof _l.tags | undefined;
  const effectiveEl =
    asTag && asTag in _l.tags ? asTag : (extract.el as keyof typeof _l.tags);

  const StdComp = _l.tags[effectiveEl] || _l.tags.div;
  const MotionComp = _l.motionTags[effectiveEl] || _l.motionTags.div;

  const hasMotionProps =
    layout !== undefined ||
    initial !== undefined ||
    animate !== undefined ||
    exit !== undefined ||
    whileHover !== undefined ||
    whileTap !== undefined ||
    whileFocus !== undefined ||
    variants !== undefined ||
    custom !== undefined ||
    onAnimationStart !== undefined ||
    onAnimationComplete !== undefined;

  const comp: React.ElementType = hasMotionProps ? MotionComp : StdComp;
  const motionProps = hasMotionProps
    ? {
        layout,
        initial,
        animate,
        exit,
        whileHover,
        whileTap,
        whileFocus,
        variants,
        custom,
        onAnimationStart,
        onAnimationComplete,
      }
    : undefined;

  // When `as` was used for element selection, omit it from props to avoid redundant passing
  const propsToOmit = [
    "loadingPosition",
    "loadingIcon",
    "isLoading",
    "children",
  ];
  if (asTag && asTag in _l.tags) {
    propsToOmit.push("as");
  }
  const remaining = omit(rest, propsToOmit);

  // Framer Motion reserves the prop name `transition` for animation config.
  // Panda also uses `transition` as a CSS style prop. When rendering a motion
  // component (motion(styled(...))), Framer Motion will swallow `transition`,
  // so we move it onto the inline style instead to keep CSS transitions working.
  if (hasMotionProps && "transition" in remaining) {
    const cssTransition = (remaining as Record<string, unknown>).transition;
    if (cssTransition !== undefined) {
      delete (remaining as Record<string, unknown>).transition;
      if (typeof cssTransition === "string") {
        const existingStyle = (remaining as Record<string, unknown>).style as
          | React.CSSProperties
          | undefined;
        (remaining as Record<string, unknown>).style = {
          ...(existingStyle ?? {}),
          transition: cssTransition,
        };
      } else {
        // If a non-string transition value was provided (e.g. a responsive/conditional
        // object), preserve it via Panda's `css` prop rather than forcing it into
        // an inline style string.
        const existingCss = (remaining as Record<string, unknown>).css;
        const base =
          existingCss &&
          typeof existingCss === "object" &&
          !Array.isArray(existingCss)
            ? (existingCss as Record<string, unknown>)
            : undefined;
        (remaining as Record<string, unknown>).css = {
          ...(base ?? {}),
          transition: cssTransition,
        };
      }
    }
  }

  const cursor = anyProps.isLoading ? "not-allowed" : "pointer";

  // Generate CSS classes at runtime using css() function
  const btnClassName =
    extract.is === "btn"
      ? css({ display: "flex", alignI: "center", cursor })
      : "";

  const linkClassName = extract.isLink
    ? css({
        color: { base: "blue.500", _dark: "blue.400" },
        _hover: { textDecoration: "underline" },
        cursor,
      })
    : "";

  // Merge classNames with any existing className from props
  const mergedClassName = [btnClassName, linkClassName, anyProps.className]
    .filter(Boolean)
    .join(" ");

  // [component, styles]
  // m: 0 is a sensible default (matching CSS reset) but placed here so user props override it
  return [
    comp,
    {
      m: 0,
      ...motionProps,
      ...remaining,
      className: mergedClassName,
    },
  ] as const;
};

function getIcon(
  position: _t.LoadingProps["loadingPosition"],
  Icon: _t.Icons | IconDefinition | (() => React.ReactElement) | null,
  props: GetIconProps
) {
  const {
    loadingIcon,
    iconPrefix = "solid",
    loadingPosition = "start",
    loadingIconSize,
    isLoading,
    _loading,
    strokeColor,
    strokeWidth,
  } = props;

  const prefix =
    iconPrefix === "solid" ? "fas" : iconPrefix === "regular" ? "far" : "fab";

  // Loading state branch: when position matches, prefer provided loadingIcon,
  // else render a default spinner with styling hooks.
  if (isLoading && position === loadingPosition) {
    const chosen = Icon ?? loadingIcon ?? null;
    if (chosen) {
      if (typeof chosen === "string" && _l.loadingIcons.includes(chosen)) {
        const Cmp = _l.loadingIconsMap[chosen as _t.LoadingIcon];
        const sizePx =
          typeof loadingIconSize === "number" ? `${loadingIconSize}px` : "12px";

        // react-loader-spinner components have differing props; normalize width/height
        return Cmp({ width: sizePx, height: sizePx }) as React.ReactElement;
      } else if (React.isValidElement(chosen)) {
        return chosen;
      } else if (typeof chosen === "function") {
        return (chosen as () => React.ReactElement)();
      }

      // FontAwesome IconDefinition passed via loadingIcon
      else if (
        typeof chosen === "object" &&
        chosen !== null &&
        "iconName" in chosen
      ) {
        return (
          <FontAwesomeIcon
            icon={chosen}
            className={props.className}
            spinPulse={props.pulse}
            size={props.size}
            spin={props.spin}
          />
        );
      }
    }
    // Fallback default loader (RotatingLines) with style overrides
    const widthPx =
      typeof loadingIconSize === "number" ? `${loadingIconSize}px` : "12px";
    const resolvedStrokeWidth = _loading?.strokeWidth ?? strokeWidth ?? 4;
    const resolvedStrokeColor =
      (typeof _loading?.strokeColor === "string" && _loading.strokeColor) ||
      (typeof strokeColor === "string" && strokeColor) ||
      "var(--colors-neutral-200)";

    return (
      <RotatingLines
        strokeWidth={`${resolvedStrokeWidth}`}
        strokeColor={resolvedStrokeColor}
        width={widthPx}
      />
    );
  }

  // Normal icon rendering (non-loading or other position)
  if (!Icon) return null;
  else if (typeof Icon === "string") {
    return (
      <FontAwesomeIcon
        icon={{ prefix, iconName: Icon as IconName }}
        className={props.className}
        spinPulse={props.pulse}
        size={props.size}
        spin={props.spin}
      />
    );
  } else if ("iconName" in Icon) {
    return (
      <FontAwesomeIcon
        icon={Icon}
        className={props.className}
        spinPulse={props.pulse}
        size={props.size}
        spin={props.spin}
      />
    );
  } else if (typeof Icon === "function") {
    return Icon(props);
  } else return Icon;
}

export const getIcons = (
  extract: ReturnType<typeof extractElType>,
  anyProps: InternalBlockProps
) => {
  const { icon, startIcon, endIcon } = anyProps;

  let isLoading: boolean | undefined;
  let loadingIcon: _t.Icons | undefined;
  let loadingPosition: _t.LoadingProps["loadingPosition"];

  if (extract.isBtnLike) {
    const loadingProps = anyProps as _t.LoadingProps;
    loadingPosition = loadingProps.loadingPosition;
    loadingIcon = loadingProps.loadingIcon;
    isLoading = loadingProps.isLoading;
  }

  // When loading and a position matches but no loadingIcon is provided,
  // pass null so getIcon can render a default loader fallback.
  const leftArg =
    isLoading && loadingPosition === "start"
      ? loadingIcon ?? null
      : icon ?? startIcon ?? null;

  const rightArg =
    isLoading && loadingPosition === "end"
      ? loadingIcon ?? null
      : endIcon ?? null;

  const iconProps = anyProps as GetIconProps;
  const leftIcon = getIcon("start", leftArg, iconProps);
  const rightIcon = getIcon("end", rightArg, iconProps);

  return { leftIcon, rightIcon };
};

export const omit = <T extends object>(
  obj: T,
  keys: readonly string[]
): Partial<T> => {
  const result: Record<string, unknown> = {};
  if (keys.length === 0) {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = obj[k];
      }
    }
    return result as Partial<T>;
  }
  const skip = new Set<PropertyKey>(keys as readonly PropertyKey[]);
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    if (!skip.has(k)) {
      result[k] = obj[k];
    }
  }
  return result as Partial<T>;
};

/**
 * Deep merge objects. Later sources override earlier ones.
 * Used internally by mergeStyleDefaults.
 */
function deepMerge(
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;

    for (const [key, value] of Object.entries(source)) {
      const existing = result[key];

      // Deep merge nested objects (but not arrays or null)
      if (
        typeof existing === "object" &&
        existing !== null &&
        !Array.isArray(existing) &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key] = deepMerge(
          existing as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Merges default style props with consumer props, ensuring consumer values override defaults.
 *
 * This solves the PandaCSS atomic class collision problem where both default and consumer
 * conditional styles (like _hover, _labelLifted) would generate separate classes with
 * identical specificity, causing unpredictable cascade behavior.
 *
 * @param defaults - Default style props for the component
 * @param props - All props passed to the component
 * @param nonStyleKeys - Keys that are NOT style props (children, event handlers, etc.)
 * @returns Merged props with defaults applied, consumer overrides winning
 *
 * @example
 * const defaults = {
 *   bg: "white",
 *   _hover: { bg: "gray.100" },
 *   _labelLifted: { top: "-10px", bg: "input-label-bg" }
 * };
 *
 * const { children, onClick, ...merged } = mergeStyleDefaults(
 *   defaults,
 *   props,
 *   ["children", "onClick", "value"]
 * );
 *
 * return <Base {...merged}>{children}</Base>;
 */
export function mergeStyleDefaults<
  T extends Record<string, unknown>,
  K extends keyof T
>(defaults: Record<string, unknown>, props: T, nonStyleKeys: readonly K[]): T {
  const styleProps: Record<string, unknown> = {};
  const otherProps: Record<string, unknown> = {};
  const nonStyleSet = new Set<PropertyKey>(
    nonStyleKeys as readonly PropertyKey[]
  );

  for (const [key, value] of Object.entries(props)) {
    if (nonStyleSet.has(key)) {
      otherProps[key] = value;
    } else if (value !== undefined) {
      styleProps[key] = value;
    }
  }

  // Deep merge: defaults first, then consumer styles (consumer wins)
  const mergedStyles = deepMerge(defaults, styleProps);

  return { ...otherProps, ...mergedStyles } as T;
}
