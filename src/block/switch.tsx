import React from "react";
import { MotionConfig, type Transition } from "framer-motion";

import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

const TrackNameKey = "Track";
const ThumbNameKey = "Thumb";
const Button = _l.motionTags.button;
const Base = _l.motionTags.div;

// Context for sharing toggle state
type SwitchContextValue = {
  checked: boolean;
  disabled?: boolean;
  pressed: boolean;
  growThumb: boolean;
  thumbSize: number;
  trackWidth: number;
  thumbOffset: number;
  borderRadius: number;
  borderWidth: number;
  toggle: () => void;
  setPressed: (pressed: boolean) => void;
};

const SwitchContext = React.createContext<SwitchContextValue | null>(null);

const useSwitchContext = () => {
  const context = React.useContext(SwitchContext);
  if (!context) {
    throw new Error("Switch compound components must be used within Switch");
  }
  return context;
};

// Main Toggle Props
// export type ToggleProps = {
//   checked?: boolean;
//   onChange?: (checked: boolean) => void;
//   disabled?: boolean;
//   thumbSize?: number;
//   _motion?: Transition;
//   children?: React.ReactNode;
//   style?: React.CSSProperties;
//   [key: string]: unknown;
// };

// Shared props for compound components
type SharedProps = { _motion?: Transition };

// Track component props - using HTMLStyledProps like Input does
// Narrow animation lifecycle handlers which conflict with framer-motion's definitions
type HtmlAnimationHandlers = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onTransitionEnd"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
>;

type StripConflictingHandlers<T> = Omit<T, keyof HtmlAnimationHandlers>;

export type TrackProps = StripConflictingHandlers<_t.BaseBlockProps> &
  SharedProps;

// Thumb component props - using HTMLStyledProps like Input does
export type ThumbProps = StripConflictingHandlers<_t.BaseBlockProps> &
  SharedProps;

function Switch(props: _t.SwitchBlockProps) {
  const {
    // `is` is used by <Block is="switch" /> routing and should not be forwarded to <button>
    is: _is,
    checked = false,
    disabled = false,
    defaultChecked: _defaultChecked,
    thumbSize = 20,
    onChange,
    children,
    _motion,
    ...rest
  } = props;

  // Position state for the thumb (x coordinate)
  const [x, setX] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const [growThumb, setGrowThumb] = React.useState(false);

  // Calculate dimensions like the original working toggle
  const borderWidth = 4;
  const trackWidth = thumbSize * 1.5; // 1.5x thumb size like original
  const borderRadius = thumbSize * 2.5;
  const xWhileOn = thumbSize; // This matches original logic
  const checkedPosition = xWhileOn * 0.5; // This is where thumb goes when checked

  const {
    time: stopwatchTime,
    start: stopwatchStart,
    clear: stopwatchClear,
  } = useStopwatch();

  // Handle press timing for thumb growth
  React.useEffect(() => {
    if (pressed && !disabled) {
      stopwatchStart();
    } else {
      setGrowThumb(false);
      stopwatchClear();
    }
  }, [pressed, disabled, stopwatchStart, stopwatchClear]);

  // Grow thumb after 200ms of being pressed
  React.useEffect(() => {
    if (stopwatchTime > 200) {
      setGrowThumb(true);
    }
  }, [stopwatchTime]);

  // Sync thumb position with checked state
  React.useEffect(() => {
    setX(checked ? checkedPosition : 0);
  }, [checked, checkedPosition]);

  // Modified toggle function to handle smooth transition
  const toggle = () => {
    if (disabled) return;

    // If we're currently stretched, we need to coordinate the animation
    if (growThumb) {
      // First shrink the thumb, then move it
      setGrowThumb(false);
      setPressed(false);

      // Delay the position change slightly to let shrinking start
      setTimeout(() => {
        const isOff = x === 0;
        setX(isOff ? checkedPosition : 0);
        onChange?.(isOff);
      }, 50);
    } else {
      // Normal immediate toggle when not stretched
      const isOff = x === 0;
      setX(isOff ? checkedPosition : 0);
      onChange?.(isOff);
    }
  };

  const handlePointerDown = () => {
    if (disabled) return;
    setPressed(true);
  };

  const handlePointerUp = () => setPressed(false);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    // Detect spacebar press
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault(); // Prevent page scroll
      if (!pressed) {
        // Only set pressed if not already pressed
        // This prevents multiple press states during a single hold
        setPressed(true);
      }
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (disabled) return;
    // Detect spacebar release
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      if (pressed) {
        // Only toggle when releasing if we were actually pressed
        toggle(); // Toggle the state when spacebar is released
      }
      setPressed(false);
    }
  };

  const contextValue: SwitchContextValue = {
    checked,
    disabled,
    pressed,
    growThumb,
    thumbSize,
    trackWidth,
    thumbOffset: x, // Use actual x position for animations
    borderRadius,
    borderWidth,
    setPressed,
    toggle,
  };

  const track = _f.findChildrenByDisplayName<TrackProps>(
    children,
    TrackNameKey
  );
  const thumb = _f.findChildrenByDisplayName<ThumbProps>(
    children,
    ThumbNameKey
  );

  // Create Track element with checked prop and thumb as child
  const trackElement = track ? (
    React.cloneElement<TrackProps>(track, {
      _motion,
      children: thumb ? (
        React.cloneElement<ThumbProps>(thumb, { _motion })
      ) : (
        <Thumb _motion={_motion} />
      ),
    })
  ) : (
    <Track _motion={_motion}>
      {thumb ? (
        React.cloneElement<ThumbProps>(thumb, { _motion })
      ) : (
        <Thumb _motion={_motion} />
      )}
    </Track>
  );

  return (
    <SwitchContext.Provider value={contextValue}>
      <MotionConfig transition={_motion}>
        <Button
          {...(!_f.hasAnyProp(rest, ["grid", "flex", "display"]) && {
            justifyContent: "center",
            alignItems: "center",
            flex: true,
          })}
          px={1}
          py={1}
          h="fit-content"
          outlineOffset={1}
          initial={false}
          animate={{
            outlineOffset: pressed ? "-2px" : "0px",
            transition: { duration: 0.1, ease: "linear" },
          }}
          cursor={disabled ? "not-allowed" : "pointer"}
          _hover={{ bg: "none!" }}
          _active={{
            bg: "none",
            transform: "none!",
            scale: "none!",
            // Disable any button press effects that might shrink the toggle
          }}
          background="none"
          style={{ borderRadius }}
          onClick={toggle}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          {...rest}
        >
          <Base
            flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            boxSizing="border-box"
          >
            {/* Only render the track, thumb is now a child of track */}
            {trackElement}
          </Base>
        </Button>
      </MotionConfig>
    </SwitchContext.Provider>
  );
}

// Track compound component - now contains the thumb as a child like original
export function Track(props: TrackProps) {
  const { _motion, children, ...rest } = props;
  const {
    checked,
    trackWidth,
    thumbSize,
    borderWidth,
    borderRadius: toggleBorderRadius,
  } = useSwitchContext();

  // Default background colors - only used if user doesn't provide bg
  const defaultBg = checked ? "#60a5fa !important" : "#d1d5db !important";

  return (
    <MotionConfig transition={_motion}>
      <Base
        flex
        relative
        alignItems="center"
        justifyContent="flex-start"
        boxSizing="content-box"
        cursor="pointer"
        bg={defaultBg}
        transition="background-color 0.2s ease-in-out"
        style={{
          minHeight: thumbSize,
          width: trackWidth,
          border: `${borderWidth}px solid transparent`,
          borderRadius: toggleBorderRadius,
        }}
        {...rest}
      >
        {/* Thumb is now a child of Track, like in original */}
        {children}
      </Base>
    </MotionConfig>
  );
}

// Thumb compound component - exact original toggle logic
export function Thumb(props: ThumbProps) {
  const { _motion, ...rest } = props;
  const {
    pressed,
    growThumb,
    thumbSize,
    thumbOffset,
    borderRadius: toggleBorderRadius,
  } = useSwitchContext();

  // Calculate thumb growth - exact original logic
  const thumbWidth = thumbSize + (pressed && growThumb ? thumbSize * 0.2 : 0);

  // Exact original logic: thumbOffset && growThumb
  const shouldUseRightAnchor = thumbOffset && growThumb;

  return (
    <MotionConfig
      transition={_motion || { type: "spring", stiffness: 700, damping: 30 }}
    >
      <Base
        grid
        bg="white"
        style={{
          height: thumbSize,
          //   width: thumbWidth,
          borderRadius: toggleBorderRadius,
          transition: "background-color 0.2s ease-in-out",
        }}
        animate={{
          // Always use consistent x positioning - no switching
          x: thumbOffset,
          width: thumbWidth,
          // Use negative margin to create left-directional growth when ON
          marginLeft: shouldUseRightAnchor ? -(thumbWidth - thumbSize) : 0,
        }}
        {...rest}
      />
    </MotionConfig>
  );
}

Track.displayName = TrackNameKey;
Thumb.displayName = ThumbNameKey;

/** number in ms */
type StopwatchProps = { interval?: number };
function useStopwatch(props: StopwatchProps = {}) {
  const [active, setActive] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const timeInterval = props?.interval ?? 10;

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (active) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + timeInterval);
      }, timeInterval);
    } else {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [active, timeInterval]);

  const start = React.useCallback(() => setActive(true), []);
  const stop = React.useCallback(() => setActive(false), []);
  const clear = React.useCallback(() => {
    setActive(false);
    setTime(0);
  }, []);

  return React.useMemo(
    () => ({ time, start, stop, clear }),
    [time, start, stop, clear]
  );
}

export default Switch;
