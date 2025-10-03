/**
 * Export file types for consumers
 * Import these in your project if you need ImageFile, AudioFile, VideoFile types
 */
import { IAudioMetadata } from "music-metadata-browser";
import { type Transition, type VariantLabels } from "framer-motion";
import { IconName, SizeProp } from "@fortawesome/fontawesome-svg-core";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { TargetAndTransition } from "motion-dom";
import { Placement } from "@floating-ui/react";
import { IconType } from "react-icons/lib";

import { type HTMLStyledProps } from "panda/jsx";
import * as _l from "./literals";

// Global type augmentation - automatically applies when package is installed
declare global {
  interface File {
    preview?: string;
    id?: string;
  }

  interface ImageFile extends File {
    id: string;
    preview: string;
    orientation: "landscape" | "portrait" | "square";
    height: number;
    width: number;
  }

  interface VideoFile extends File {
    id: string;
    orientation: "landscape" | "portrait" | "square";
    duration: number;
    height: number;
    width: number;
  }

  interface AudioFile extends File {
    id: string;
    preview: string;
    source: IAudioMetadata["common"] & IAudioMetadata["format"];
  }

  type MediaFile = File | ImageFile | AudioFile;
}

type PropsFor<K extends keyof typeof _l.tags> = React.ComponentProps<
  (typeof _l.tags)[K]
>;

// icons
export type Icon =
  | null
  | IconName
  | IconType
  | IconDefinition
  | React.ReactElement
  | (() => React.ReactElement);

export type IconProps = {
  iconPrefix?: "solid" | "regular" | "brands";
  className?: string;
  startIcon?: Icon;
  endIcon?: Icon;
  icon?: Icon;
  iconSize?: SizeProp; // FontAwesome-specific size, renamed to avoid conflict with PandaCSS size
  pulse?: boolean;
  spin?: boolean;
};

export type LoadingIcon = keyof typeof _l.loadingIconsMap;

export type Icons = Icon | LoadingIcon;

export type LoadingProps = {
  loadingPosition?: "start" | "end";
  loadingIconSize?: number | string;
  loadingIcon?: Icons;
  isLoading?: boolean;
};

// framer motion
type BlockMotionProps = {
  initial?: boolean | TargetAndTransition | VariantLabels;
  animate?: TargetAndTransition | VariantLabels;
  exit?: TargetAndTransition | VariantLabels;
  variants?: { [key: string]: TargetAndTransition };
  whileHover?: TargetAndTransition | VariantLabels;
  whileTap?: TargetAndTransition | VariantLabels;
  whileFocus?: TargetAndTransition | VariantLabels;
  layout?: boolean | "position" | "size" | "preserve-aspect";
  _motion?: Transition; // Custom transition prop for global motion config
};

export type BaseBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps &
  IconProps & {
    is?: undefined;
    as?: keyof typeof _l.tags;
    tooltip?: boolean | React.ReactNode | string;
    portalContainer?: Element | DocumentFragment;
    filepicker?: boolean;
    portal?: boolean;
  };

// simplified variants with motion support
type TxtBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "txt";
    as?: "p" | "span" | "h1" | "h2" | "h3" | "em" | "strong"; // defaults to p
  };

export type HrBlockProps = HTMLStyledProps<typeof _l.motionTags.hr> &
  BlockMotionProps & { is: "hr" } & PropsFor<"hr">;

export type SkeletonBlockProps = Pick<
  HTMLStyledProps<typeof _l.tags.div>,
  "height" | "h" | "width" | "w" | "size" | "borderRadius" | "br"
> & { is: "skeleton"; as: "block" };

export type SkeletonCircleProps = Pick<
  HTMLStyledProps<typeof _l.tags.div>,
  "height" | "h" | "width" | "w" | "size" | "borderRadius" | "br"
> & { is: "skeleton"; as: "circle" };

// Base button props without onChange
type BtnBlockPropsBase = Omit<
  HTMLStyledProps<typeof _l.motionTags.button>,
  "onChange"
> &
  BlockMotionProps &
  IconProps &
  LoadingProps & {
    is: "btn";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: React.MouseEventHandler;
    tooltip?: boolean | React.ReactNode | string;
  };

// Button with filepicker
export type BtnFilepickerProps = BtnBlockPropsBase & {
  filepicker: true;
  onChange?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
};

// Regular button
export type BtnStandardProps = BtnBlockPropsBase & {
  filepicker?: false | undefined;
  onChange?: React.FormEventHandler<HTMLButtonElement>;
};

// Combined type for internal use (kept simple to avoid complexity)
export type BtnBlockProps = BtnBlockPropsBase & {
  filepicker?: boolean;
  multiple?: boolean;
  accept?: string;
  onChange?: any; // Kept as any to avoid union complexity
};

export type InputBlockProps = HTMLStyledProps<typeof _l.tags.input> &
  BlockMotionProps & { is: "input"; error?: string } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "children"
  >;

export type TextareaBlockProps = HTMLStyledProps<typeof _l.tags.textarea> &
  BlockMotionProps & {
    is: "textarea";
    error?: string;
    /** Maximum number of rows the textarea can expand to */
    maxRows?: number;
    /** Minimum number of rows the textarea will display */
    minRows?: number;
    /** Callback fired when the textarea height changes */
    onHeightChange?: (height: number, meta: { rowHeight: number }) => void;
  } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "children">;

export type CheckboxBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "checkbox";
    onChecked?: (value: boolean) => void;
    indeterminate?: boolean;
    checked?: boolean;
  };

export type ProgressBlockProps = HTMLStyledProps<typeof _l.motionTags.div> &
  BlockMotionProps & {
    is: "progress";
    value: number;
    max?: number;
    steps?: number;
  } & PropsFor<"progress">;

export type SwitchBlockProps = Omit<
  HTMLStyledProps<typeof _l.tags.input>,
  "onChange"
> &
  BlockMotionProps & {
    is: "switch";
    thumbSize?: number;
    onChange?: (checked: boolean) => void;
  } & Omit<PropsFor<"button">, "onChange">;

export type AccordionBlockProps = {
  is: "accordion";
  allowToggle?: boolean;
  allowMultiple?: boolean;
  defaultOpenIdx?: number[];
  children: React.ReactElement | React.ReactElement[];
};

export type DrawerBlockProps = HTMLStyledProps<typeof _l.motionTags.div> &
  BlockMotionProps & {
    is: "drawer";
    open: boolean;
    hideHandle?: boolean;
    /** @default true */
    drag?: boolean;
    /** @default true */
    outsideClickClose?: boolean;
    closeOnEsc?: boolean;
    onClose?: () => void;
    //   _backdrop?: GridProps;
    //   children: any;
  };

export type RadioOption = {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
};

export type RadioBlockProps = Omit<
  HTMLStyledProps<typeof _l.base>,
  "onChange" | "children"
> &
  BlockMotionProps & {
    is: "radio";
    /** Controlled value for single-select radio group */
    value?: string | null;
    /** Uncontrolled initial value */
    defaultValue?: string | null;
    /** Change handler. Returns the selected value */
    onChange?: (value: string) => void;
    /** Disable the entire group */
    disabled?: boolean;
    /** Optional form field name. If provided, a hidden input will be emitted. */
    name?: string;
    /** Options to render (children are not accepted for radio) */
    options?: RadioOption[];
    /** Optional renderer for custom per-option content */
    renderOption?: (option: RadioOption) => React.ReactNode;
    /** Disallow children for the radio container */
    children?: never;
  };

export type MenuBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "menu";
    trigger?: React.ReactNode;
    variant: "click" | "hover";
    placement?: Placement;
    hoverDelay?: number;
    zIndex?: number;
    onOpenOrClose?: (isOpen: boolean) => void;
    offset?: { x: number; y: number };
    isOpen?: boolean;
    width?: string | number;
  };

type LinkBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "link";
    href?: string;
    to?: string;
    target?: "_self" | "_blank";
    rel?: string;
  };

type ImgBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "img";
    src: string;
    alt: string;
  };

type SelectBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "select";
  } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">;

type BlockquoteBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "blockquote";
  } & PropsFor<"blockquote">;

type PreBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps & {
    is: "pre";
  } & PropsFor<"pre">;

// Form variants with as constraints
type FormBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps &
  (
    | ({ is: "form"; as?: undefined } & PropsFor<"form">)
    | ({ is: "form"; as: "label" } & PropsFor<"label">)
    | ({ is: "form"; as: "legend" } & PropsFor<"legend">)
  );

// Table variants with as constraints
type TableBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps &
  (
    | ({ is: "table"; as?: undefined } & PropsFor<"table">)
    | ({ is: "table"; as: "tr" } & PropsFor<"tr">)
    | ({ is: "table"; as: "td" } & PropsFor<"td">)
    | ({ is: "table"; as: "th" } & PropsFor<"th">)
    | ({ is: "table"; as: "tbody" } & PropsFor<"tbody">)
    | ({ is: "table"; as: "thead" } & PropsFor<"thead">)
    | ({ is: "table"; as: "tfoot" } & PropsFor<"tfoot">)
  );

// List variants with required as
type ListBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps &
  (
    | ({ is: "list"; as: "ul" } & PropsFor<"ul">)
    | ({ is: "list"; as: "ol" } & PropsFor<"ol">)
    | ({ is: "list"; as: "li" } & PropsFor<"li">)
  );

// SEO variants with required as
type SeoBlockProps = HTMLStyledProps<typeof _l.base> &
  BlockMotionProps &
  (
    | ({ is: "seo"; as: "nav" } & PropsFor<"nav">)
    | ({ is: "seo"; as: "main" } & PropsFor<"main">)
    | ({ is: "seo"; as: "aside" } & PropsFor<"aside">)
    | ({ is: "seo"; as: "article" } & PropsFor<"article">)
    | ({ is: "seo"; as: "section" } & PropsFor<"section">)
    | ({ is: "seo"; as: "details" } & PropsFor<"details">)
    | ({ is: "seo"; as: "header" } & PropsFor<"header">)
    | ({ is: "seo"; as: "footer" } & PropsFor<"footer">)
  );

/*
 * as?: keyof React.JSX.IntrinsicElements;
 * txt?: boolean; // ✅
 * btn?: boolean; // ✅
 * button?: boolean; // ✅
 * input?: boolean; // ✅
 * textarea?: boolean; // ✅
 * checkbox?: boolean; // ✅
 * filepicker?: boolean; // ✅
 * progress?: boolean; // ✅
 * accordion?: boolean; // ✅
 * tooltip?: // ✅
 * hr?: // ✅
 * skeleton?: // ✅ circle, square, rectangle
 * toggle?: boolean; // ✅
 * drawer?: boolean; // ✅
 * radio?: boolean; // ✅
 * menu?: boolean; // ✅
 * link?: boolean; // ✅
 * img?: boolean;
 * icon?: Icon; // ✅ (including pandacss stroke color and width!!)
 * startIcon?: Icon; // ✅
 * endIcon?: Icon; // ✅
 */

// Complete union with all requested variants
type AllBlockProps =
  | BaseBlockProps
  | TxtBlockProps
  | HrBlockProps
  | BtnBlockProps
  | InputBlockProps
  | TextareaBlockProps
  | CheckboxBlockProps
  | ProgressBlockProps
  | AccordionBlockProps
  | SwitchBlockProps
  | DrawerBlockProps
  | RadioBlockProps
  | MenuBlockProps
  | LinkBlockProps
  | ImgBlockProps
  | SelectBlockProps
  | SkeletonCircleProps
  | SkeletonBlockProps
  | BlockquoteBlockProps
  | PreBlockProps
  | FormBlockProps
  | TableBlockProps
  | ListBlockProps
  | SeoBlockProps;

// main Block component with all variants
export type BlockProps = AllBlockProps;

// discriminated-union API (is/as)
export type Is =
  | "hr"
  | "txt"
  | "btn"
  | "input"
  | "textarea"
  | "checkbox"
  | "accordion"
  | "progress"
  | "switch"
  | "drawer"
  | "radio"
  | "menu"
  | "link"
  | "img"
  | "select"
  | "skeleton"
  | "blockquote"
  | "pre"
  | "form"
  | "table"
  | "list"
  | "seo";

export type SkeletonAs = "circle" | "block";
export type TxtAs = "p" | "span" | "h1" | "h2" | "h3" | "em" | "strong";
export type TableAs = "tr" | "td" | "th" | "tbody" | "thead" | "tfoot";
export type FormAs = "label" | "legend";
export type ListAs = "ul" | "ol" | "li";
export type SeoAs =
  | "nav"
  | "main"
  | "aside"
  | "article"
  | "section"
  | "details"
  | "header"
  | "footer";

// tooltip
type FollowMode = boolean | "horizontal" | "vertical";

export type CoreTooltipProps = {
  children: React.ReactNode;
  content?: React.ReactNode | string;
  placement?: "top" | "right" | "bottom" | "left" | "auto";
  interactive?: boolean; // whether tooltip stays open when hovering tooltip
  portalContainer?: Element | DocumentFragment;
  delay?: number; // ms
  follow?: FollowMode;
  showArrow?: boolean;
  disabled?: boolean;
  offsetVal?: number;
  className?: string;
};

// Note: ImageFile, AudioFile, VideoFile, MediaFile are declared globally above
// No need to export them explicitly - they're available globally when qstd is installed
