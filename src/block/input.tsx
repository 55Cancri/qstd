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
    onAnimationStart: _onAnimationStart,
    onAnimationComplete: _onAnimationComplete,
    ...rest
  } = props;

  // When debug is provided, skip default border styling so debug border shows
  const hasDebug = "debug" in rest && rest.debug !== undefined;

  const label = _f.findChildrenByDisplayName<_t.InputBlockProps>(
    children,
    LabelNameKey
  );

  const leftIcon = _f.findChildrenByDisplayName(children, LeftSideNameKey);

  const rightSide = _f.findChildrenByDisplayName<_t.InputBlockProps>(
    children,
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
            {...(!hasDebug && {
              border: "1.5px solid",
              borderColor: error ? "input-border-color-error" : "input-border-color",
            })}
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
    iconPrefix: _iconPrefix,
    startIcon: _startIcon,
    endIcon: _endIcon,
    icon: _icon,
    spin: _spin,
    size: _size,
    pulse: _pulse,
    onAnimationStart: _onAnimationStart,
    onAnimationComplete: _onAnimationComplete,
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
  const {
    clearable,
    onAnimationStart: _onAnimationStart,
    onAnimationComplete: _onAnimationComplete,
    ...rest
  } = props;
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
          const clearedValueEvent = Object.assign({}, e, {
            target: Object.assign({}, e.target, { value: "" }),
          });
          props.onChange?.(clearedValueEvent);
        },
      })}
    />
  );
}
RightSide.displayName = RightSideNameKey;

/**
 * Floating label for Input component.
 *
 * Style defaults can be overridden by passing the same props.
 * For `_labelLifted`, partial overrides are merged with defaults.
 *
 * **`bg` cascades to lifted state:** If you set `bg`, it applies to both
 * default and lifted states. Only specify `_labelLifted.bg` if you want
 * a different background when lifted.
 *
 * @example
 * // bg applies to both states
 * <Block.Input.Label bg={{ base: "white", _dark: "gray.900" }}>
 *   Email
 * </Block.Input.Label>
 *
 * // Different lifted bg
 * <Block.Input.Label bg="white" _labelLifted={{ bg: "blue.50" }}>
 *   Email
 * </Block.Input.Label>
 */
export function Label(props: Omit<_t.InputBlockProps, "is"> & LabelProps) {
  const {
    value,
    error,
    required,
    children,
    hasLeftIcon,
    bg: consumerBg,
    _labelLifted: consumerLabelLifted,
    onAnimationStart: _onAnimationStart,
    onAnimationComplete: _onAnimationComplete,
    ...rest
  } = props;

  const ml = hasLeftIcon ? 6 : 1;

  // Default _labelLifted styles - consumer can partially override
  // If consumer provides `bg`, it cascades to lifted state unless overridden
  const defaultLabelLifted = {
    transformOrigin: "top left",
    transform: "scale(0.8)",
    top: "-10px",
    ml,
    color: error
      ? "text-alert"
      : value
      ? "input-label-color-lifted"
      : "input-label-color",
    bg: consumerBg ?? "input-label-bg",
  };

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
      color={error ? "text-alert" : "input-label-color"}
      lineHeight={1.1}
      bg={consumerBg}
      {...rest}
      _labelLifted={{
        ...defaultLabelLifted,
        ...consumerLabelLifted,
      }}
    >
      {children}
      {required && "*"}
    </Base>
  );
}

Label.displayName = LabelNameKey;
