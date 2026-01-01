// loading icons
import { BeatLoader } from "react-spinners";
import { Oval, RotatingLines, TailSpin, ThreeDots } from "react-loader-spinner";

import { styled } from "panda/jsx";
import { motion } from "framer-motion";

// WHY: We wrap motion AROUND styled (motion.create(styled("x"))) instead of styled(motion.x).
// This ensures framer-motion intercepts its props (initial, animate, transition, etc.)
// BEFORE they reach Panda's styled wrapper. If Panda wraps motion, it may filter/transform
// motion props before they reach the motion component, breaking animations.
//
// TYPE NOTE: We use 'any' because framer-motion's `transition` prop (motion config object)
// conflicts with Panda's CSS `transition` prop (string like "all 0.2s"). The runtime
// behavior is correct - motion intercepts its props first. Proper typing would require
// complex union types and overloads that aren't worth the maintenance cost.
//
// STYLE NOTE: All components are motion-wrapped so they accept MotionStyle (style props
// with MotionValue). This allows SharedBlockProps.style to be MotionStyle while internal
// components that spread {...rest} don't cause type conflicts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const motionStyled = (tag: string) => motion.create(styled(tag as any) as any);

// Base div component used throughout internal implementations
export const base = motionStyled("div");

// All tags are motion-wrapped for MotionStyle compatibility
export const tags = {
  div: base,
  a: motionStyled("a"),
  br: motionStyled("br"),
  button: motionStyled("button"),
  canvas: motionStyled("canvas"),
  form: motionStyled("form"),
  h1: motionStyled("h1"),
  h2: motionStyled("h2"),
  h3: motionStyled("h3"),
  hr: motionStyled("hr"),
  nav: motionStyled("nav"),
  main: motionStyled("main"),
  aside: motionStyled("aside"),
  article: motionStyled("article"),
  section: motionStyled("section"),
  details: motionStyled("details"),
  header: motionStyled("header"),
  footer: motionStyled("footer"),
  strong: motionStyled("strong"),
  em: motionStyled("em"),
  img: motionStyled("img"),
  del: motionStyled("del"),
  ins: motionStyled("ins"),
  kbd: motionStyled("kbd"),
  code: motionStyled("code"),
  mark: motionStyled("mark"),
  samp: motionStyled("samp"),
  small: motionStyled("small"),
  sub: motionStyled("sub"),
  sup: motionStyled("sup"),
  u: motionStyled("u"),
  var: motionStyled("var"),
  input: motionStyled("input"),
  label: motionStyled("label"),
  legend: motionStyled("legend"),
  p: motionStyled("p"),
  select: motionStyled("select"),
  span: motionStyled("span"),
  svg: motionStyled("svg"),
  textarea: motionStyled("textarea"),
  table: motionStyled("table"),
  tr: motionStyled("tr"),
  th: motionStyled("th"),
  td: motionStyled("td"),
  tbody: motionStyled("tbody"),
  thead: motionStyled("thead"),
  tfoot: motionStyled("tfoot"),
  progress: motionStyled("progress"),
  ol: motionStyled("ol"),
  ul: motionStyled("ul"),
  li: motionStyled("li"),
  blockquote: motionStyled("blockquote"),
  pre: motionStyled("pre"),
} as const;

// motionTags is now an alias to tags (all tags are motion-wrapped)
export const motionTags = tags;

export const loadingIconsMap = {
  rotatingLines: RotatingLines,
  spinner: TailSpin,
  beat: BeatLoader,
  dots: ThreeDots,
  oval: Oval,
} as const;

export const loadingIcons = Object.keys(loadingIconsMap);
