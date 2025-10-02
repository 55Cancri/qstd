import React from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";

// import Grid from "atoms/grid";
// import * as List from "shared/list";
// import { Token, token } from "panda/tokens";

import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

const MotionDiv = _l.motionTags.div;
const TrackBgNameKey = "TrackBg";
const TrackFillNameKey = "TrackFill";

// Public-facing props that TrackFill will accept in addition to normal Block props.
type TrackFillPublicProps = _t.BaseBlockProps & {
  progressWidth?: string;
  progressPercent?: number;
  progressValue?: number;
  progressMax?: number;
};

type MotionDivProps = React.ComponentProps<typeof MotionDiv>;

export default function Progress(props: _t.ProgressBlockProps) {
  const { children, steps, value, max: maxProp, ...rest } = props as any;
  const [progress, setProgress] = React.useState(0);
  const max = maxProp ?? 100;

  React.useEffect(() => {
    setProgress(Math.min((value ?? 0) / max, 1) * 100);
  }, [value, max]);

  const width = `${progress}%`;

  // Stable colors without relying on external token helpers
  const barBackground = "var(--colors-blue-500)";
  const trackBackground = "var(--colors-neutral-300)";

  //   const background =
  //     typeof props.barColor === "function"
  //       ? props.barColor?.(progress)
  //       : typeof props.barColor === "string"
  //         ? props.barColor
  //         : "#3b82f6";
  //   const background = token.var(props.barColor?.(progress)!);

  if (typeof steps === "number") {
    /**
     * max 100
     * steps 5
     * value 25
     *
     * value / steps 5
     * max   / steps 4
     *
     */

    const stepSize = max / steps!;

    return (
      <LayoutGroup>
        <MotionDiv autoCols="1fr" colG={8}>
          <AnimatePresence>
            {Array.from({ length: steps }, (_, i) => {
              const normalizedValue = stepSize * i;
              const isComplete = normalizedValue < (value ?? 0);
              const defaultBgColor = trackBackground;
              return (
                <MotionDiv
                  layout
                  key={i}
                  h={8}
                  br
                  initial={{ scale: 0, width: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    width: "100%",
                    background: isComplete ? barBackground : defaultBgColor,
                  }}
                  exit={{ scale: 0, width: 0, opacity: 0 }}
                />
              );
            })}
          </AnimatePresence>
        </MotionDiv>
      </LayoutGroup>
    );
  }

  // Normal linear progress (non-steps):
  // Use grid 1/1 overlay so background and fill occupy same cell without z-index.
  const trackBgChild = _f.findChildrenByDisplayName<_t.BaseBlockProps>(
    children as React.ReactNode,
    TrackBgNameKey
  );
  const trackFillChild = _f.findChildrenByDisplayName<TrackFillPublicProps>(
    children as React.ReactNode,
    TrackFillNameKey
  );

  const barHeight = rest.h ?? 8;

  const bgEl = trackBgChild ? (
    React.cloneElement(trackBgChild, {
      gridArea: "1 / 1",
      h: barHeight,
      w: trackBgChild.props.w ?? true,
    })
  ) : (
    <MotionDiv
      data-progress-bg
      gridArea="1 / 1"
      br
      h={barHeight}
      w
      bg={{ base: "neutral.200", _dark: "neutral.700" }}
    />
  );

  const fillEl = trackFillChild ? (
    React.cloneElement<TrackFillPublicProps>(trackFillChild, {
      gridArea: "1 / 1",
      h: barHeight,
      roundedLeft: 9999,
      roundedRight: width === "100%" ? 9999 : undefined,
      // Pass width via both animation and style for custom implementations
      animate: {
        ...((trackFillChild.props as any).animate || {}),
        width,
      },
      style: {
        ...(trackFillChild.props.style || {}),
        width,
      },
      progressWidth: width,
      progressPercent: progress,
      progressValue: value ?? 0,
      progressMax: max,
    })
  ) : (
    <MotionDiv
      data-progress-bar
      gridArea="1 / 1"
      h={barHeight}
      roundedLeft={9999}
      roundedRight={width === "100%" ? 9999 : undefined}
      animate={{ width, background: barBackground }}
      style={{ width, background: barBackground }}
    />
  );

  return (
    <LayoutGroup>
      <MotionDiv layout grid cols="1" rows="1" w {...(rest as MotionDivProps)}>
        {bgEl}
        {fillEl}
      </MotionDiv>
    </LayoutGroup>
  );
}

export function TrackBg(props: _t.BaseBlockProps) {
  const { h, ...rest } = props;
  return (
    <MotionDiv
      data-track-bg
      gridArea="1 / 1"
      br
      h={h ?? 8}
      w
      bg={{ base: "neutral.200", _dark: "neutral.700" }}
      {...(rest as MotionDivProps)}
    />
  );
}
TrackBg.displayName = TrackBgNameKey;

export function TrackFill(props: TrackFillPublicProps) {
  const { progressWidth, animate, style, h, ...rest } = props;
  const mergedAnimate = progressWidth
    ? animate && typeof animate === "object" && !Array.isArray(animate)
      ? { ...animate, width: progressWidth }
      : { width: progressWidth }
    : animate;
  const mergedStyle = progressWidth
    ? Object.assign({}, style, { width: progressWidth })
    : style;

  return (
    <MotionDiv
      data-track-fill
      gridArea="1 / 1"
      br
      h={h ?? 8}
      bg={{ base: "neutral.200", _dark: "neutral.700" }}
      {...(rest as MotionDivProps)}
      animate={mergedAnimate}
      style={mergedStyle}
    />
  );
}
TrackFill.displayName = TrackFillNameKey;
