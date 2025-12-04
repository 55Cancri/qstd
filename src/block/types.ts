/**
 * Export file types for consumers
 * Import these in your project if you need ImageFile, AudioFile, VideoFile types
 */
import {
  type Transition,
  type VariantLabels,
  type Variants,
  type Target,
  type TargetAndTransition,
} from "framer-motion";
import type { IconName, SizeProp } from "@fortawesome/fontawesome-svg-core";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { Placement } from "@floating-ui/react";
import type { IconType } from "react-icons/lib";
import * as React from "react";

// Import Panda types directly to avoid HTMLStyledProps complexity
import type { JsxStyleProps } from "../../styled-system/types";
import * as _l from "./literals";

// Define the subset of IAudioMetadata we actually use
interface AudioMetadataSource {
  format: {
    container?: string;
    codec?: string;
    sampleRate?: number;
    numberOfChannels?: number;
    bitrate?: number;
    duration?: number;
  };
  common: {
    track?: { no: number | null; of: number | null };
    disk?: { no: number | null; of: number | null };
    year?: number;
    title?: string;
    artist?: string;
    artists?: string[];
    albumartist?: string;
    album?: string;
    genre?: string[];
    picture?: { format: string; data: Uint8Array }[];
  };
}

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
    source: AudioMetadataSource["common"] & AudioMetadataSource["format"];
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

export interface IconProps {
  iconPrefix?: "solid" | "regular" | "brands";
  className?: string;
  startIcon?: Icon;
  endIcon?: Icon;
  icon?: Icon;
  iconSize?: SizeProp; // FontAwesome-specific size, renamed to avoid conflict with PandaCSS size
  pulse?: boolean;
  spin?: boolean;
}

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
  initial?: Target | VariantLabels | boolean;
  animate?: TargetAndTransition | VariantLabels | boolean;
  exit?: TargetAndTransition | VariantLabels;
  variants?: Variants;
  whileHover?: TargetAndTransition | VariantLabels;
  whileTap?: TargetAndTransition | VariantLabels;
  whileFocus?: TargetAndTransition | VariantLabels;
  layout?: boolean | "position" | "size" | "preserve-aspect";
  _motion?: Transition; // Custom transition prop for global motion config
};

// Shared props interface to reduce intersection complexity
// We use an interface to encourage TS to cache this type
export interface SharedBlockProps
  extends JsxStyleProps,
    BlockMotionProps,
    IconProps {
  tooltip?: React.ReactNode | string;
  portalContainer?: Element | DocumentFragment;
  filepicker?: boolean;
  portal?: boolean;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

// Helper to omit conflicting props from HTML attributes
type OmittedHTMLProps =
  | "color"
  | "width"
  | "height"
  | "translate"
  | "content"
  | "as"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onDragEnter"
  | "onDragLeave"
  | "onDrop";
type HTMLProps<T extends React.ElementType> = Omit<
  React.ComponentProps<T>,
  OmittedHTMLProps
>;

export type BaseBlockProps = SharedBlockProps &
  HTMLProps<"div"> & { is?: undefined };

// simplified variants with motion support
type TxtBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "txt";
    as?: "p" | "span" | "h1" | "h2" | "h3" | "em" | "strong"; // defaults to p
  };

export type HrBlockProps = SharedBlockProps & HTMLProps<"hr"> & { is: "hr" };

export type SkeletonBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "skeleton";
    as: "block";
    // Custom skeleton props
    size?: any;
    br?: any;
  };

export type SkeletonCircleProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "skeleton";
    as: "circle";
    size?: any;
    br?: any;
  };

// Base button props without onChange
type BtnBlockPropsBase = SharedBlockProps &
  Omit<HTMLProps<"button">, "onChange"> &
  LoadingProps & {
    is: "btn";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: React.MouseEventHandler;
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

export type InputBlockProps = SharedBlockProps &
  Omit<HTMLProps<"input">, "children"> & {
    is: "input";
    error?: string;
    children?: React.ReactNode;
  };

export type TextareaBlockProps = SharedBlockProps &
  Omit<HTMLProps<"textarea">, "children"> & {
    is: "textarea";
    error?: string;
    /** Maximum number of rows the textarea can expand to */
    maxRows?: number;
    /** Minimum number of rows the textarea will display */
    minRows?: number;
    /** Callback fired when the textarea height changes */
    onHeightChange?: (height: number, meta: { rowHeight: number }) => void;
    children?: React.ReactNode;
  };

export type CheckboxBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "checkbox";
    onChecked?: (value: boolean) => void;
    indeterminate?: boolean;
    checked?: boolean;
  };

export type ProgressBlockProps = SharedBlockProps &
  HTMLProps<"progress"> & {
    is: "progress";
    value: number;
    max?: number;
    steps?: number;
  };

export type SwitchBlockProps = SharedBlockProps &
  Omit<HTMLProps<"button">, "onChange"> & {
    is: "switch";
    thumbSize?: number;
    onChange?: (checked: boolean) => void;
    checked?: boolean;
    defaultChecked?: boolean;
  };

export type AccordionBlockProps = {
  is: "accordion";
  allowToggle?: boolean;
  allowMultiple?: boolean;
  defaultOpenIdx?: number[];
  children: React.ReactElement | React.ReactElement[];
};

export type DrawerBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "drawer";
    open: boolean;
    hideHandle?: boolean;
    /** @default true */
    drag?: boolean;
    /** @default true */
    outsideClickClose?: boolean;
    closeOnEsc?: boolean;
    onClose?: () => void;
  };

export type RadioOption = {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
};

export type RadioBlockProps = SharedBlockProps &
  Omit<HTMLProps<"div">, "onChange" | "children"> & {
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

export type MenuBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
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

type LinkBlockProps = SharedBlockProps &
  HTMLProps<"div"> & {
    is: "link";
    href?: string;
    to?: string;
    target?: "_self" | "_blank";
    rel?: string;
  };

type ImgBlockProps = SharedBlockProps &
  HTMLProps<"img"> & {
    is: "img";
    src: string;
    alt: string;
  };

type SelectBlockProps = SharedBlockProps &
  HTMLProps<"select"> & {
    is: "select";
  };

type BlockquoteBlockProps = SharedBlockProps &
  HTMLProps<"blockquote"> & {
    is: "blockquote";
  };

type PreBlockProps = SharedBlockProps &
  HTMLProps<"pre"> & {
    is: "pre";
  };

// Form variants with as constraints
type FormBlockProps = SharedBlockProps &
  HTMLProps<"form"> &
  (
    | { is: "form"; as?: undefined }
    | ({ is: "form"; as: "label" } & HTMLProps<"label">)
    | ({ is: "form"; as: "legend" } & HTMLProps<"legend">)
  );

// Table variants with as constraints
type TableBlockProps = SharedBlockProps &
  HTMLProps<"table"> &
  (
    | { is: "table"; as?: undefined }
    | ({ is: "table"; as: "tr" } & HTMLProps<"tr">)
    | ({ is: "table"; as: "td" } & HTMLProps<"td">)
    | ({ is: "table"; as: "th" } & HTMLProps<"th">)
    | ({ is: "table"; as: "tbody" } & HTMLProps<"tbody">)
    | ({ is: "table"; as: "thead" } & HTMLProps<"thead">)
    | ({ is: "table"; as: "tfoot" } & HTMLProps<"tfoot">)
  );

// List variants with required as
type ListBlockProps = SharedBlockProps &
  HTMLProps<"div"> &
  (
    | ({ is: "list"; as: "ul" } & HTMLProps<"ul">)
    | ({ is: "list"; as: "ol" } & HTMLProps<"ol">)
    | ({ is: "list"; as: "li" } & HTMLProps<"li">)
  );

// SEO variants with required as
type SeoBlockProps = SharedBlockProps &
  HTMLProps<"div"> &
  (
    | ({ is: "seo"; as: "nav" } & HTMLProps<"nav">)
    | ({ is: "seo"; as: "main" } & HTMLProps<"main">)
    | ({ is: "seo"; as: "aside" } & HTMLProps<"aside">)
    | ({ is: "seo"; as: "article" } & HTMLProps<"article">)
    | ({ is: "seo"; as: "section" } & HTMLProps<"section">)
    | ({ is: "seo"; as: "details" } & HTMLProps<"details">)
    | ({ is: "seo"; as: "header" } & HTMLProps<"header">)
    | ({ is: "seo"; as: "footer" } & HTMLProps<"footer">)
  );

export type BlockPropsMap = {
  hr: HrBlockProps;
  txt: TxtBlockProps;
  btn: BtnFilepickerProps | BtnStandardProps;
  input: InputBlockProps;
  textarea: TextareaBlockProps;
  checkbox: CheckboxBlockProps;
  accordion: AccordionBlockProps;
  progress: ProgressBlockProps;
  switch: SwitchBlockProps;
  drawer: DrawerBlockProps;
  radio: RadioBlockProps;
  menu: MenuBlockProps;
  link: LinkBlockProps;
  img: ImgBlockProps;
  select: SelectBlockProps;
  skeleton: SkeletonBlockProps | SkeletonCircleProps;
  blockquote: BlockquoteBlockProps;
  pre: PreBlockProps;
  form: FormBlockProps;
  table: TableBlockProps;
  list: ListBlockProps;
  seo: SeoBlockProps;
};

export type Is = keyof BlockPropsMap;

export type BlockProps<T extends Is | undefined = undefined> =
  T extends undefined
    ? BaseBlockProps
    : T extends Is
    ? BlockPropsMap[T]
    : never;

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
