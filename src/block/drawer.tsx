import React from "react";
import {
  useMotionValue,
  useDragControls,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { createPortal } from "react-dom";

import Icon from "./icon";

import * as _l from "./literals";
import * as _t from "./types";

const MotionDiv = _l.motionTags.div;
const MotionBtn = _l.motionTags.button;
const breakpoint = ["(min-width: 600px)"];

function requirePortalRootForDrawer(): HTMLElement {
  // Drawer always renders through a portal; missing portal root should fail loudly
  // with a clear, actionable message (instead of React's minified error).
  if (typeof document === "undefined") {
    throw new Error(
      [
        `[qstd] Block is="drawer" requires a DOM (document is undefined).`,
        `If you're server-rendering, render drawers only on the client.`,
      ].join("\n")
    );
  }

  const portal = document.getElementById("portal");
  if (!portal) {
    throw new Error(
      [
        `[qstd] You cannot use <Block is="drawer" /> unless your HTML contains a portal root: <div id="portal"></div>.`,
        ``,
        `No element with id="portal" was found in the document.`,
        ``,
        `Fix: add this next to your app root in your HTML (usually right under #root):`,
        ``,
        `  <div id="root"></div>`,
        `  <div id="portal"></div>`,
        ``,
        `Without #portal, qstd cannot render drawers (they use React portals).`,
      ].join("\n")
    );
  }

  return portal;
}

function DrawerComponent(props: _t.DrawerBlockProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const dragHandleRef = React.useRef<HTMLDivElement | null>(null);
  const [isDesktop] = useMatchMedia(breakpoint);
  const closeFnRef = React.useRef<(() => void) | null>(null);
  const prevOpenRef = React.useRef<boolean | null>(null); // Track previous open state
  const dragControls = useDragControls();
  const { open, setOpen } = useDrawer();
  const { onClose, onExitComplete, ...rest } = props;

  // SSR-safe: only render portal on client after mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Create motion values for y
  const y = useMotionValue(0);

  const openDrawer = () => {
    // may still be animating downward if dragged down then quickly reopen
    y.stop();
    y.set(0);
    // todo try to use this later
    // animate(y, 0)
    setOpen(true);
  };
  const closeDrawer = () => {
    y.stop(); // Stop any ongoing y animation immediately
    setOpen(false);
  };

  // Update ref in an effect to avoid mutating during render
  React.useEffect(() => {
    closeFnRef.current = () => {
      closeDrawer();
      onClose?.();
    };
  });

  const onDragStart = (
    e: PointerEvent | React.PointerEvent,
    info?: PanInfo
  ) => {
    console.log({ e });
    if (isDesktop) return;
    const noDragEl = document.querySelector("[data-no-drag]");
    if (!noDragEl || !noDragEl.contains(e.target as Node)) {
      // if (!e.target.classList.contains("no-drag")) {
      dragControls.start(e);
    } else {
      // @ts-expect-error - componentControls is internal framer-motion API
      dragControls.componentControls.forEach(
        (entry: {
          stop: (e: PointerEvent | React.PointerEvent, info?: PanInfo) => void;
        }) => {
          entry.stop(e, info);
        }
      );
    }
  };

  // Sync internal open state with props.open
  // IMPORTANT: Use useLayoutEffect to sync BEFORE paint, preventing the visual
  // "two-phase open" where the drawer briefly doesn't exist then appears.
  // This ensures AnimatePresence sees the correct state on the first paint.
  // Also: Only call onClose when TRANSITIONING from open→closed, not on initial mount
  React.useLayoutEffect(() => {
    const wasOpen = prevOpenRef.current;
    const isOpen = props.open;

    if (isOpen) {
      openDrawer();
    } else if (wasOpen === true) {
      // Only close if we were previously open (transition from open→closed)
      // This prevents firing onClose when mounting with open={false}
      closeFnRef.current?.();
    }
    // Update previous state for next render
    prevOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- React 19 compiler handles deps
  }, [props.open]);

  React.useEffect(() => {
    const container = ref.current;
    if (!open || !container) return;

    // optional: needed only if the container element is not focusable already
    container.setAttribute("tabindex", "0");

    const trapFocus = (e: FocusEvent) => {
      if (container.contains(e.relatedTarget as Node)) return;
      container.focus();
    };
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || props.closeOnEsc === false) return;
      console.log("[close] esc key");
      closeFnRef.current?.();
    };

    container.addEventListener("focusout", trapFocus);
    container.addEventListener("keydown", closeOnEsc);
    document.body.style.overflow = "hidden"; // prevent scroll outside modal
    return () => {
      container.removeEventListener("focusout", trapFocus);
      container.removeEventListener("keydown", closeOnEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, props.closeOnEsc]);

  // observe changes in y values - only when drawer is open
  React.useEffect(() => {
    // Don't subscribe if drawer is closed
    if (!props.open) return;

    const unsubscribeY = y.on("change", (latestY) => {
      // threshold for y px below bottom to automatically close drawer
      if (latestY > 150) {
        console.log("[close] latestY > 150");
        closeFnRef.current?.();
      }
    });

    // Cleanup: unsubscribe and stop motion when drawer closes
    return () => {
      unsubscribeY();
      y.stop();
    };
  }, [y, props.open]);

  const onBackdropClick = () => {
    const outsideClickClose = props.outsideClickClose ?? true;
    if (!outsideClickClose) return;
    console.log("[close] clicked backdrop");
    closeFnRef.current?.();
  };

  // Don't render portal during SSR - document doesn't exist on the server
  if (!mounted) return null;

  const portalRoot = requirePortalRootForDrawer();

  return createPortal(
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={onExitComplete}
    >
      {open && (
        <Backdrop
          onClick={() => onBackdropClick()}
          // _backdrop={props._backdrop}
        >
          <MotionDiv
            grid
            key="drawer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            position="fixed"
            //   variants={{
            //     initial: { height: 0, opacity: 0 },
            //     animate: {
            //       height: "auto",
            //       opacity: 1,
            //       // transition: { type: "spring", damping: 26, stiffness: 300 },
            //       transition: { type: "spring", duration: 0.3 },
            //     },
            //     exit: { height: 0, opacity: 0 },
            //   }}
            initial="initial"
            animate="animate"
            exit="exit"
            {...(isDesktop
              ? {
                  drag: false,
                  style: undefined,
                  dragControls: null,
                  dragConstraints: undefined,
                  // style: null,
                  // dragConstraints: null,
                  height: props.height ?? "max-content!", // "min(50%, 300px)",
                  width: props.width ?? "clamp(50%, 700px, 90%)",
                  pt: 6,
                  // px: 4,
                  margin: "auto",
                  borderRadius: 12,
                  zIndex: 1,
                  variants: {
                    initial: { opacity: 0, scale: 0.5 },
                    animate: {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                      },
                    },
                    exit: {
                      opacity: 0,
                      scale: 0.3,
                      transition: { type: "spring", duration: 0.45 },
                    },
                  },
                }
              : {
                  w: "100vw",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  overflow: "hidden",
                  // Note: Can't use framer-motion's `y` prop because it conflicts
                  // with the drag motion value. Use CSS transform instead.
                  variants: {
                    initial: {
                      transform: "translateY(100%)",
                      opacity: 0.5,
                    },
                    animate: {
                      transform: "translateY(0%)",
                      opacity: 1,
                      transition: {
                        type: "spring",
                        damping: 22,
                        stiffness: 400,
                        mass: 0.7,
                      },
                    },
                    exit: {
                      transform: "translateY(100%)",
                      opacity: 0,
                      transition: {
                        type: "tween",
                        duration: 0.2,
                        ease: [0.4, 0, 1, 1], // ease-in for quick exit
                      },
                    },
                  },
                  drag: "y",
                  style: { y },
                  dragControls,
                  onPointerDown: (e: React.PointerEvent) => onDragStart(e),
                  //   drag={hasBackdrop ? "y" : false}
                  dragElastic: 0,
                  // prevent drawer from being dragged higher than what its opened to
                  dragConstraints: { top: 0 },
                  onDragEnd: (
                    _: MouseEvent | TouchEvent | PointerEvent,
                    drag: PanInfo
                  ) => {
                    if (props.drag === false) return;
                    const pageHeight = document.documentElement.scrollHeight;
                    const yCoord = drag.point.y; // where on the y axis the drag is released
                    const velocity = drag.velocity.y;

                    // drag must be dragged down and released at least 80% down the page
                    const releaseThreshold = 0.8;
                    const releasePct = yCoord / pageHeight;
                    if (
                      (velocity > 25 && releasePct >= releaseThreshold) ||
                      velocity > 750
                    ) {
                      props.onClose?.();
                    }
                  },
                })}
            //   w="100vw"
            //   left={0}
            //   right={0}
            //   bottom={0}
            //   borderTopLeftRadius={12}
            //   borderTopRightRadius={12}
            boxSizing="border-box"
            boxShadow="hsl(0deg 0% 0% / 60%) 0px -4px 20px"
            bg={{ base: "neutral.100", _dark: "neutral.900" }}
            color="text-primary"
            // bg="white"
            // bg={theme.colors.gray2}
            ref={ref}
            //   drag="y"
            //   style={{ y }}
            //   dragControls={dragControls}
            //   // @ts-ignore
            //   onPointerDown={onDragStart}
            //   //   //   drag={hasBackdrop ? "y" : false}
            //   dragElastic={0}
            //   // prevent drawer from being dragged higher than what its opened to
            //   dragConstraints={{ top: 0 }}
            //   onDragEnd={(_, drag) => {
            //     if (props.drag === false) return;
            //     const pageHeight = document.documentElement.scrollHeight;
            //     const yCoord = drag.point.y; // where on the y axis the drag is released
            //     const velocity = drag.velocity.y;

            //     // drag must be dragged down and released at least 80% down the page
            //     const releaseThreshold = 0.8;
            //     const releasePct = yCoord / pageHeight;
            //     if (
            //       (velocity > 25 && releasePct >= releaseThreshold) ||
            //       velocity > 750
            //     ) {
            //       props.onClose?.();
            //     }
            //   }}
            {...rest}
          >
            <MotionDiv
              grid
              {...(isDesktop
                ? { position: "relative" }
                : { rows: "max-content 1fr" })}
            >
              {!isDesktop && props.hideHandle !== false && (
                <MotionDiv
                  grid
                  justifySelf="center"
                  h={6}
                  w={34}
                  mt="16px"
                  mb={4}
                  br={20}
                  bg={{ base: "neutral.400", _dark: "neutral.600" }}
                  cursor={props.drag ? "row-resize" : "default"}
                  ref={dragHandleRef}
                />
              )}
              {props.children}
            </MotionDiv>
          </MotionDiv>
        </Backdrop>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

const DrawerContext = React.createContext<{
  open: boolean;
  setOpen: (value: boolean) => void;
}>({
  open: false,
  setOpen: () => {
    return;
  },
});

function DrawerProvider(props: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = { open, setOpen };
  return (
    <DrawerContext.Provider value={value}>
      {props.children}
    </DrawerContext.Provider>
  );
}

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (context === undefined) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
}

// the main drawer component wrapped in a context provider
export default function Drawer(props: _t.DrawerBlockProps) {
  return (
    <DrawerProvider>
      <DrawerComponent {...props} />
    </DrawerProvider>
  );
}

// show cancel btn and others at the bottom of the drawer when on mobile,
// show close btn and others at the top of the drawer when on desktop
export function BtnGroup(props: _t.DrawerBtnGroupProps) {
  const [isDesktop] = useMatchMedia(breakpoint);
  const { children, ...rest } = props;
  if (isDesktop) {
    return (
      <MotionDiv flex alignI gap={4} {...rest}>
        {React.Children.toArray(children).toReversed()}
      </MotionDiv>
    );
  } else {
    return <MotionDiv grid rowG={14} {...props} />;
  }
}

export function CloseBtn(props: _t.DrawerCloseBtnProps) {
  const [isDesktop] = useMatchMedia(breakpoint);
  const { children, ...rest } = props;
  if (isDesktop) {
    return (
      <MotionBtn
        transition=".14s all ease-out"
        _after={{
          content: '""',
          position: "absolute",
          inset: 0,
          scale: 0,
          rounded: true,
          transition: ".14s all ease-out",
          zIndex: -1,
        }}
        _hover={{
          _after: {
            scale: 1,
            bg: { base: "neutral.200", _dark: "neutral.800" },
          },
        }}
        _active={{
          scale: 0.9,
          _after: { scale: 0.94 },
          bg: { base: "neutral.200", _dark: "neutral.800" },
        }}
        position="absolute"
        flex
        center
        h={32}
        w={32}
        top={-2}
        right={3}
        borderRadius={32}
        cursor="pointer"
        {...rest}
      >
        <Icon icon="times" fontSize={16} lineHeight={1} color="currentColor" />
      </MotionBtn>
    );
  } else if (children) {
    return (
      <MotionDiv grid>
        <MotionBtn {...props}>Close</MotionBtn>
      </MotionDiv>
    );
  } else {
    return;
  }
}

type BackdropProps = {
  onClick: () => void;
  children: React.ReactNode;
  //   _backdrop?: GridProps;
};

function Backdrop(props: BackdropProps) {
  // Allow interactions immediately for children, but defer outside-close
  // until the enter animation completes.
  //
  // Why: We don't want an initial click (that opened the drawer) to also
  // immediately close it via the backdrop while the fade-in is running.
  //
  // HMR nuance: During Fast Refresh, framer-motion can skip the enter
  // animation entirely. If we defaulted to "blocked" and only flipped on
  // animation completion, outside-click would get stuck off. To avoid
  // duration coupling and remain HMR-safe, we default to "allowed" and only
  // block when an actual enter animation starts.
  //
  // IMPORTANT: We use a ref instead of state to avoid re-rendering the Backdrop
  // during animation, which would cause child animations (like the drawer's
  // height animation) to get interrupted and jitter.
  const allowOutsideClickRef = React.useRef(true);
  const [isDesktop] = useMatchMedia(breakpoint);

  return (
    <MotionDiv
      grid
      data-backdrop
      background="hsl(0 0% 0% / 0.3)"
      zIndex={1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onAnimationStart={() => {
        // Entering: prevent outside-close during the fade-in.
        // Use ref mutation to avoid re-render that would interrupt drawer animation
        allowOutsideClickRef.current = false;
      }}
      onAnimationComplete={() => {
        // Enter finished; re-enable outside-close. If HMR skipped animations,
        // neither start nor complete will fire and the default (allowed)
        // remains in effect.
        allowOutsideClickRef.current = true;
      }}
      //   {...props._backdrop}
      position="fixed"
      top={0}
      left={0}
      height="100%"
      width="100%"
      {...(isDesktop ? { placeI: true } : {})}
      onClick={() =>
        allowOutsideClickRef.current ? props.onClick() : undefined
      }
    >
      {props.children}
    </MotionDiv>
  );
}

type MediaQuery = string[];
type MatchedMedia = boolean[];

/**
 * Use like:
 * ```typescript
 * const queries = [
 * 	'(max-width: 400px)',
 * 	'(min-width: 800px)'
 * ]
 *
 * const Component = () => {
 * 	const [mobile, desktop] = useMatchMedia(queries)
 * 	// ...
 * }
 * ```
 * @param queries
 * @param defaultValues
 * @returns
 */
function useMatchMedia(queries: MediaQuery): MatchedMedia;

function useMatchMedia(queries: MediaQuery): MatchedMedia {
  // SSR-safe: check for window before accessing matchMedia
  const isClient = typeof window !== "undefined";

  const [value, setValue] = React.useState<MatchedMedia>(() => {
    if (!isClient) return queries.map(() => false);
    return queries.map((q) => window.matchMedia(q).matches);
  });

  React.useLayoutEffect(() => {
    if (!isClient) return;

    const mediaQueryLists = queries.map((q) => window.matchMedia(q));

    const handler = () => {
      setValue(mediaQueryLists.map((mql) => mql.matches));
    };

    // Sync state if queries changed
    handler();

    // Set a listener for each media query
    mediaQueryLists.forEach((mql) => mql.addEventListener("change", handler));

    // Remove listeners on cleanup
    return () =>
      mediaQueryLists.forEach((mql) =>
        mql.removeEventListener("change", handler)
      );
  }, [queries, isClient]);

  return value;
}
