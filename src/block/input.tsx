import React from "react";
import { MotionConfig } from "framer-motion";

import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";
import Icon from "./icon";

const LabelNameKey = "Label";
const LeftSideNameKey = "LeftIcon";
const RightSideNameKey = "RightSide";
const InputBase = _l.tags.input;
const Base = _l.base;

type LabelProps = {
  value?: _t.InputBlockProps["value"];
  hasLeftIcon?: boolean;
};

export default function Input(props: _t.InputBlockProps) {
  const {
    _motion,
    error,
    children,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;

  const label = _f.findChildrenByDisplayName<_t.InputBlockProps>(
    children as React.ReactNode,
    LabelNameKey
  );

  const leftIcon = _f.findChildrenByDisplayName(
    children as React.ReactNode,
    LeftSideNameKey
  );

  const rightSide = _f.findChildrenByDisplayName<_t.InputBlockProps>(
    children as React.ReactNode,
    RightSideNameKey
  );

  const labelWithProps = label
    ? React.cloneElement<_t.InputBlockProps & LabelProps>(label, {
        hasLeftIcon: !!leftIcon,
        required: props.required,
        value: props.value,
        error,
      })
    : null;

  const rightSideWithProps = rightSide
    ? React.cloneElement<_t.InputBlockProps>(rightSide, {
        onChange: props.onChange,
        value: props.value,
      })
    : null;

  return (
    <Base grid rows="/ 4">
      <Base grid relative>
        {leftIcon}
        {/* label must always come before input for adjacent select (+) to work */}
        {labelWithProps}
        <MotionConfig transition={_motion}>
          <InputBase
            py={0.5}
            pl={leftIcon ? 7 : 2}
            pr={rightSide ? 6 : 2}
            color="text-primary"
            border="1.5px solid"
            borderColor={
              error ? "input-border-color-error" : "input-border-color"
            }
            {...(error && { outlineColor: "input-outline-color-error" })}
            borderRadius={8}
            // empty space so that label is lifted based on :placeholder-shown
            placeholder={props.placeholder ?? " "}
            // hide placeholder by default so that label is shown over
            // blurred input without placeholder showing behind it
            _placeholder={{
              color: "input-label-color",
              opacity: label ? 0 : 1,
            }}
            // on input focus, after the label has lifted, show the placeholder
            // if its provided, otherwise " " will not show anything
            _focusWithin={{ _placeholder: { opacity: 1 } }}
            {...rest}
          />
        </MotionConfig>
        {rightSideWithProps}
      </Base>

      {error && (
        <Base pl={3} fontSize="sm" color="text-alert">
          {error}
        </Base>
      )}
    </Base>
  );
}

export function LeftIcon(props: _t.BaseBlockProps) {
  const {
    iconPrefix,
    startIcon,
    endIcon,
    icon,
    spin,
    size,
    pulse,
    onAnimationStart,
    onAnimationComplete,
    ...remaining
  } = props;

  return (
    <Base
      position="absolute"
      transform="translateY(-50%)"
      top="50%"
      left="11px"
      {...remaining}
    >
      <Icon {...props} />
    </Base>
  );
}
LeftIcon.displayName = LeftSideNameKey;

export function RightSide(
  props: _t.BaseBlockProps & { value?: string; clearable?: boolean }
) {
  const { clearable, onAnimationStart, onAnimationComplete, ...rest } = props;
  if (clearable && !props.value) return null;

  return (
    <Base
      position="absolute"
      top="50%"
      transform="translateY(-50%)"
      right="11px"
      {...rest}
      {...(clearable && {
        cursor: "pointer",
        onClick: (e) => {
          const clearedValueEvent = {
            ...e,
            target: { ...e.target, value: "" },
          };
          props.onChange?.(clearedValueEvent);
        },
      })}
    />
  );
}
RightSide.displayName = RightSideNameKey;

export function Label(props: Omit<_t.InputBlockProps, "is"> & LabelProps) {
  const {
    value,
    error,
    required,
    children,
    hasLeftIcon,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;
  const ml = hasLeftIcon ? 6 : 1;

  return (
    <Base
      gridAutoFlow="column"
      position="absolute"
      pointerEvents="none"
      top="50%"
      transformOrigin="top left"
      transform="translate(0, -50%) scale(1)"
      transition="200ms cubic-bezier(0, 0, 0.2, 1) 0ms, .2s color ease-in-out, .2s background ease-in-out"
      ml={ml}
      mr={1}
      px={2}
      py={0.5}
      br={8}
      color="input-label-color"
      lineHeight={1.1}
      css={{
        // lift label when sibling input has focus or blurred but empty
        "&:has(+ input:focus, + input:not(:placeholder-shown))": {
          transformOrigin: "top left",
          transform: "scale(0.8)",
          top: "-10px",
          ml,
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
