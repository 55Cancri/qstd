import React from "react";
import { MotionConfig } from "framer-motion";

import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

const MotionDiv = _l.motionTags.div;

const TrackNameKey = "SliderTrack";
const FillNameKey = "SliderFill";
const ThumbNameKey = "SliderThumb";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type MotionDivProps = React.ComponentProps<typeof MotionDiv>;

// Context value shared between slider and its compound components
type SliderContextValue = {
  value: number;
  min: number;
  max: number;
  percent: number;
  disabled: boolean;
  isDragging: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
};

// Props passed to child components internally
type SliderChildProps = _t.BaseBlockProps & {
  sliderPercent?: number;
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const SliderContext = React.createContext<SliderContextValue | null>(null);

const useSliderContext = () => {
  const context = React.useContext(SliderContext);
  if (!context) {
    throw new Error("Slider compound components must be used within Slider");
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Slider(props: _t.SliderBlockProps) {
  const {
    value: controlledValue,
    defaultValue = 0,
    min = 0,
    max = 100,
    step,
    disabled = false,
    onChange,
    children,
    _motion,
    ...rest
  } = props;

  // Support both controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  const [isDragging, setIsDragging] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Calculate percentage for positioning
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Clamp and optionally step a raw value
  const clampValue = React.useCallback(
    (rawValue: number) => {
      let clamped = Math.max(min, Math.min(max, rawValue));
      if (step !== undefined && step > 0) {
        clamped = Math.round((clamped - min) / step) * step + min;
        // Re-clamp after stepping to handle edge cases
        clamped = Math.max(min, Math.min(max, clamped));
      }
      return clamped;
    },
    [min, max, step]
  );

  // Convert clientX to value
  const getValueFromClientX = React.useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;

      const rect = track.getBoundingClientRect();
      const x = clientX - rect.left;
      const rawPercent = Math.max(0, Math.min(1, x / rect.width));
      const rawValue = min + rawPercent * (max - min);
      return clampValue(rawValue);
    },
    [min, max, value, clampValue]
  );

  // Update value (handles both controlled and uncontrolled)
  const updateValue = React.useCallback(
    (newValue: number) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [disabled, isControlled, onChange]
  );

  // Handle pointer/touch on track
  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    const newValue = getValueFromClientX(e.clientX);
    updateValue(newValue);
  };

  // Global move/up handlers for dragging
  React.useEffect(() => {
    if (!isDragging) return;

    const controller = new AbortController();

    const handleMove = (e: PointerEvent) => {
      const newValue = getValueFromClientX(e.clientX);
      updateValue(newValue);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove, {
      signal: controller.signal,
    });
    window.addEventListener("pointerup", handleUp, {
      signal: controller.signal,
    });
    window.addEventListener("pointercancel", handleUp, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, [isDragging, getValueFromClientX, updateValue]);

  // Keyboard support for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const stepAmount = step ?? (max - min) / 100;
    const largeStep = (max - min) / 10;

    let newValue = value;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        newValue = clampValue(value + stepAmount);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        newValue = clampValue(value - stepAmount);
        break;
      case "PageUp":
        newValue = clampValue(value + largeStep);
        break;
      case "PageDown":
        newValue = clampValue(value - largeStep);
        break;
      case "Home":
        newValue = min;
        break;
      case "End":
        newValue = max;
        break;
      default:
        return;
    }

    e.preventDefault();
    updateValue(newValue);
  };

  // Find custom child components
  const trackChild = _f.findChildrenByDisplayName<SliderChildProps>(
    children as React.ReactNode,
    TrackNameKey
  );
  const fillChild = _f.findChildrenByDisplayName<SliderChildProps>(
    children as React.ReactNode,
    FillNameKey
  );
  const thumbChild = _f.findChildrenByDisplayName<SliderChildProps>(
    children as React.ReactNode,
    ThumbNameKey
  );

  const contextValue: SliderContextValue = {
    value,
    min,
    max,
    percent,
    disabled,
    isDragging,
    trackRef,
  };

  const height = rest.h ?? 8;

  // Build track element
  const trackEl = trackChild ? (
    React.cloneElement(trackChild, {
      sliderPercent: percent,
      sliderValue: value,
      sliderMin: min,
      sliderMax: max,
    })
  ) : (
    <SliderTrack />
  );

  // Build fill element
  const fillEl = fillChild ? (
    React.cloneElement(fillChild, {
      sliderPercent: percent,
      sliderValue: value,
      sliderMin: min,
      sliderMax: max,
    })
  ) : (
    <SliderFill />
  );

  // Build thumb element
  const thumbEl = thumbChild ? (
    React.cloneElement(thumbChild, {
      sliderPercent: percent,
      sliderValue: value,
      sliderMin: min,
      sliderMax: max,
    })
  ) : (
    <SliderThumb />
  );

  return (
    <SliderContext.Provider value={contextValue}>
      <MotionConfig transition={_motion}>
        <MotionDiv
          ref={trackRef}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          grid
          cols="1"
          rows="1"
          alignItems="center"
          position="relative"
          w
          h={height}
          cursor={disabled ? "not-allowed" : "pointer"}
          opacity={disabled ? 0.5 : 1}
          onPointerDown={handleTrackPointerDown}
          onKeyDown={handleKeyDown}
          userSelect="none"
          touchAction="none"
          {...(rest as MotionDivProps)}
        >
          {trackEl}
          {fillEl}
          {thumbEl}
        </MotionDiv>
      </MotionConfig>
    </SliderContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function SliderTrack(props: SliderChildProps) {
  const { sliderPercent, sliderValue, sliderMin, sliderMax, ...rest } = props;

  return (
    <MotionDiv
      data-slider-track
      gridArea="1 / 1"
      w
      h="100%"
      br={9999}
      bg={{ base: "neutral.200", _dark: "neutral.700" }}
      {...(rest as MotionDivProps)}
    />
  );
}
SliderTrack.displayName = TrackNameKey;

export function SliderFill(props: SliderChildProps) {
  const { sliderPercent, sliderValue, sliderMin, sliderMax, style, ...rest } =
    props;
  const { percent } = useSliderContext();

  const width = `${sliderPercent ?? percent}%`;

  return (
    <MotionDiv
      data-slider-fill
      gridArea="1 / 1"
      h="100%"
      br={9999}
      bg={{ base: "blue.500", _dark: "blue.400" }}
      style={{ ...style, width }}
      pointerEvents="none"
      {...(rest as MotionDivProps)}
    />
  );
}
SliderFill.displayName = FillNameKey;

export function SliderThumb(props: SliderChildProps) {
  const { sliderPercent, sliderValue, sliderMin, sliderMax, style, ...rest } =
    props;
  const { percent, isDragging, disabled } = useSliderContext();

  const left = `${sliderPercent ?? percent}%`;

  return (
    <MotionDiv
      data-slider-thumb
      gridArea="1 / 1"
      position="absolute"
      top="50%"
      size={24}
      rounded
      bg="white"
      boxShadow="0 2px 8px rgba(0,0,0,0.25)"
      cursor={disabled ? "not-allowed" : "grab"}
      pointerEvents="none"
      style={{
        ...style,
        left,
        transform: "translate(-50%, -50%)",
      }}
      initial={false}
      animate={{
        scale: isDragging ? 1.1 : 1,
      }}
      {...(rest as MotionDivProps)}
    />
  );
}
SliderThumb.displayName = ThumbNameKey;

