import React from "react";
import { AnimatePresence, motion } from "framer-motion";

import * as _l from "./literals";
import * as _t from "./types";

const Base = _l.base;
const Svg = _l.motionTags.svg;
const CheckboxBtn = _l.motionTags.button;

export default function Checkbox(props: _t.CheckboxBlockProps) {
  const { children, onClick, ...rest } = props;
  const [checked, setChecked] = React.useState(false);
  const [indeterminate, setIndeterminate] = React.useState(false);

  React.useEffect(() => {
    setChecked(!!rest.checked);
  }, [rest.checked]);

  React.useEffect(() => {
    setIndeterminate(!!rest.indeterminate);
  }, [rest.indeterminate]);

  const isIndeterminate = typeof rest.indeterminate === "boolean";

  return (
    <Base
      flex
      alignI
      gap={2}
      cursor="pointer"
      userSelect="none"
      {...rest}
      onClick={() => rest.onChecked?.(!rest.checked)}
    >
      <CheckboxBtn
        data-checkbox
        {...(checked && { "data-checked": checked })}
        w="24px"
        p={1}
        br={6}
        cursor="pointer"
        boxSizing="border-box"
        outline="none !important"
        bg={{ base: "neutral.200", _dark: "neutral.700" }}
        _checked={{ bg: "blue.500", transition: ".14s background ease-out" }}
        _active={{ scale: 0.9 }}
        color="neutral.100"
        transition=".14s background ease-out .1s"
        _focus={{ boxShadow: "0 0 0 6px hsl(0 0% 100% / 0.05)" }}
      >
        <Svg
          fill="none"
          width="100%"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={4}
        >
          <AnimatePresence mode="wait">
            {isIndeterminate && indeterminate && (
              <motion.path
                key="indeterminate"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{
                  type: "tween",
                  ease: "easeOut",
                  duration: 0.3,
                  delay: 0.2,
                }}
                strokeLinecap="round"
                // Horizontal line for indeterminate state
                d="M6 12 L18 12"
              />
            )}
            {!indeterminate && checked && (
              <motion.path
                key="check"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            )}
          </AnimatePresence>
        </Svg>
      </CheckboxBtn>
      {children}
    </Base>
  );
}
