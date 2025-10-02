import React from "react";
import {
  flip,
  shift,
  offset,
  autoUpdate,
  useFloating,
  useHover,
  useFocus,
  useRole,
  useDismiss,
  safePolygon,
  useInteractions,
  arrow as arrowMiddleware,
} from "@floating-ui/react";

import * as _t from "./types";
import * as _l from "./literals";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";

const Base = _l.base;

export const TooltipContainer = React.forwardRef<
  HTMLDivElement,
  _t.BaseBlockProps
>(function TooltipContainer(props, ref) {
  const { children, ...rest } = props;
  return (
    <Base {...rest} ref={ref as any} role="tooltip">
      {children}
    </Base>
  );
});

export default function Tooltip(props: _t.CoreTooltipProps) {
  const {
    children,
    content,
    placement = "auto",
    interactive = true,
    disabled = false,
    showArrow = true,
    follow = false,
    offsetVal = 8,
    delay = 80,
    className,
  } = props;
  const referenceRef = React.useRef<HTMLElement | null>(null);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);

  type VirtualElement = {
    getBoundingClientRect: () => DOMRect;
    contextElement?: Element | null;
  };

  // open state
  const [open, setOpen] = React.useState(false);

  // floating UI
  const { x, y, refs, strategy, middlewareData, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: placement === "auto" ? "top" : placement,
    middleware: [
      offset(offsetVal),
      flip(),
      shift({ padding: 6 }),
      arrowMiddleware({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
    strategy: "fixed",
  });

  // interaction hooks
  const hover = useHover(context, {
    delay: { open: delay, close: 120 },
    handleClose: safePolygon(),
    move: true,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Get interaction props
  const referenceProps = getReferenceProps({});

  // Handle follow mode with custom pointer tracking
  React.useEffect(() => {
    if (!follow || !referenceRef.current) return;

    const el = referenceRef.current;
    const onMove = (e: PointerEvent) => {
      const virtualElement: VirtualElement = {
        getBoundingClientRect: () => new DOMRect(e.clientX, e.clientY, 0, 0),
        contextElement: document.body,
      };
      refs.setReference(virtualElement as unknown as HTMLElement);
    };

    el.addEventListener("pointermove", onMove);

    return () => {
      el.removeEventListener("pointermove", onMove);
    };
  }, [follow, refs]);

  // arrow position from middleware
  const arrowX = middlewareData?.arrow?.x ?? 0;
  const arrowY = middlewareData?.arrow?.y ?? 0;

  // compute arrow style depending on placement and establish transform origin
  const side = context.placement || "top";
  const ARROW_SIZE = 10;
  const anchorOffset = Math.max(ARROW_SIZE / 2 - 1, 3);
  const arrowAnchorStyle: React.CSSProperties = side.startsWith("top")
    ? { bottom: -anchorOffset }
    : side.startsWith("bottom")
      ? { top: -anchorOffset }
      : side.startsWith("left")
        ? { right: -anchorOffset }
        : { left: -anchorOffset };
  const arrowStyle: React.CSSProperties =
    side.startsWith("top") || side.startsWith("bottom")
      ? { left: arrowX || undefined, ...arrowAnchorStyle }
      : { top: arrowY || undefined, ...arrowAnchorStyle };
  const transformOrigin = side.startsWith("top")
    ? "center bottom"
    : side.startsWith("bottom")
      ? "center top"
      : side.startsWith("left")
        ? "right center"
        : side.startsWith("right")
          ? "left center"
          : "center";

  // wrapper for children to get reference element
  // Handle case where children might be a complex structure
  const childrenArray = React.Children.toArray(children);
  const hasMultipleChildren = childrenArray.length > 1;

  let child: React.ReactElement;
  if (hasMultipleChildren) {
    // If multiple children, wrap them in a div that reliably captures pointer events
    child = <div style={{ display: "inline-block" }}>{children}</div>;
  } else {
    // Single child
    const only = React.Children.only(children) as React.ReactElement;
    const isDomElement =
      React.isValidElement(only) && typeof only.type === "string";
    // If the single child is NOT a DOM element (e.g., MotionConfig, Fragment),
    // wrap it so refs and event handlers from Floating UI can attach correctly.
    child = isDomElement ? (
      only
    ) : (
      // Ensure the wrapper reliably captures mouseenter/pointerenter and can contain block elements
      <div style={{ display: "inline-block" }}>{only}</div>
    );
  }

  const mergedRef = (node: HTMLElement | null) => {
    referenceRef.current = node;
    if (!follow) {
      refs.setReference(node as unknown as HTMLElement);
    }
    const childWithRef = child as unknown as {
      ref?:
        | ((instance: HTMLElement | null) => void)
        | React.MutableRefObject<HTMLElement | null>;
    };
    const originalRef = childWithRef?.ref;
    if (typeof originalRef === "function") originalRef(node);
    else if (originalRef && "current" in (originalRef as object))
      (originalRef as React.MutableRefObject<HTMLElement | null>).current =
        node;
  };

  const refAttrs =
    referenceProps as unknown as React.HTMLAttributes<HTMLElement>;

  const cloned = React.cloneElement(
    child as React.ReactElement,
    {
      ...refAttrs,
      ref: mergedRef,
      "data-tooltip-ref": true,
    } as any
  );

  if (disabled) return <>{cloned}</>;

  // Smooth mount/unmount with motion animate/initial and a short deferred unmount
  const [isMounted, setIsMounted] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setIsMounted(true);
    } else {
      closeTimerRef.current = setTimeout(() => {
        setIsMounted(false);
        closeTimerRef.current = null;
      }, 160);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  // Create arrow element
  // Arrow element is created after container is known to allow sampling its bg
  let arrowEl: React.ReactNode | null = null;

  // Determine if content is (or contains) a custom tooltip container
  let floatingNode: React.ReactNode | null = null;
  const findRoleTooltipElement = (
    node: React.ReactNode
  ): React.ReactElement | null => {
    if (!React.isValidElement(node)) return null;
    const el = node as React.ReactElement<any>;
    if ((el.props as any)?.role === "tooltip") return el;
    const kids = (el.props as any)?.children;
    if (!kids) return null;
    const arr = React.Children.toArray(kids);
    for (const c of arr) {
      if (React.isValidElement(c) && (c.props as any)?.role === "tooltip") {
        return c as React.ReactElement<any>;
      }
    }
    return null;
  };
  // Introspection helpers (only used when tracing). Keep around for future debug.
  // const getElementName = (node: React.ReactNode): string | undefined => {
  //   if (!React.isValidElement(node)) return undefined;
  //   const t: any = (node as any).type;
  //   if (typeof t === "string") return t;
  //   return t?.displayName || t?.name || "anonymous";
  // };
  // const findRoleTooltipElementDeep = (
  //   node: React.ReactNode,
  //   maxDepth = 3,
  //   depth = 0
  // ): { el: React.ReactElement | null; depth: number } => {
  //   if (!node || depth > maxDepth) return { el: null, depth };
  //   if (React.isValidElement(node)) {
  //     const el = node as React.ReactElement<any>;
  //     if ((el.props as any)?.role === "tooltip") return { el, depth };
  //     const kids = (el.props as any)?.children;
  //     if (!kids) return { el: null, depth };
  //     const arr = React.Children.toArray(kids);
  //     for (const c of arr) {
  //       const r = findRoleTooltipElementDeep(c, maxDepth, depth + 1);
  //       if (r.el) return r;
  //     }
  //   }
  //   return { el: null, depth };
  // };
  // Robust custom detection: check for our marker on the component type.
  // We cannot see the internal role on the rendered DOM from here, so we tag
  // the component factory with a stable flag that survives HMR reloads.
  const isCustomTooltip =
    React.isValidElement(content) &&
    !!(content.type && (content as any).type.isBlockTooltipContainer);
  const customEl = isCustomTooltip
    ? (content as React.ReactElement<any>)
    : findRoleTooltipElement(content as React.ReactNode);
  // Tracing for detection (disabled). Uncomment to debug detection behavior.
  // try {
  //   const rootIsElement = React.isValidElement(content);
  //   const rootRole = rootIsElement ? (content as any).props?.role : undefined;
  //   const rootType = getElementName(content as React.ReactNode);
  //   const deepProbe = findRoleTooltipElementDeep(content as React.ReactNode, 4);
  //   trace.info(
  //     "Block.Tooltip detect",
  //     {
  //       rootIsElement,
  //       rootRole,
  //       rootType,
  //       chosen: isCustomTooltip ? "custom" : "default",
  //       deepFound: !!deepProbe.el,
  //       deepDepth: deepProbe.el ? deepProbe.depth : -1,
  //     },
  //     { key: "block-tooltip", tags: ["detect"] }
  //   );
  // } catch {}

  // Sample the container background (custom or default) for the arrow
  const containerRef = React.useRef<HTMLElement | null>(null);
  const [containerBg, setContainerBg] = React.useState<string | undefined>();
  React.useEffect(() => {
    if (!(open || isMounted)) return;
    const el = containerRef.current;
    if (!el) return;
    try {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
        setContainerBg(bg);
      } else {
        setContainerBg("rgba(20,20,20,0.95)");
      }
      // logTooltipState(isCustomTooltip ? "custom" : "default", {
      //   placement: context.placement,
      //   open,
      //   sampledBg: bg,
      //   hasMounted: isMounted,
      // });
    } catch {}
  }, [open, isMounted, isCustomTooltip]);

  if (isCustomTooltip) {
    // Custom tooltip path: convert the custom element to motion-enabled
    const el = customEl as React.ReactElement<any>;
    const childProps = (el.props || {}) as Record<string, any>;
    const floatingProps = getFloatingProps({}) as Record<string, any>;

    // NOTES ON DEFAULTS vs PANDA OVERRIDES (custom path)
    // - We want sensible defaults, but Panda props must be able to override them.
    // - Inline styles would beat Panda classes, so we avoid inline visual defaults.
    // - Instead, we provide default Panda props only when the child hasn't set them.
    //   This keeps the child as the sole visual surface and preserves overrideability.
    const defaultPandaProps: Record<string, any> = {};
    if (
      childProps.bg === undefined &&
      childProps.background === undefined &&
      !(childProps.style?.background || childProps.style?.backgroundColor)
    ) {
      defaultPandaProps.bg = "rgba(20,20,20,0.95)";
    }
    if (childProps.color === undefined && !childProps.style?.color) {
      defaultPandaProps.color = "white";
    }
    const hasPadding =
      childProps.p !== undefined ||
      childProps.padding !== undefined ||
      childProps.px !== undefined ||
      childProps.py !== undefined ||
      childProps.style?.padding !== undefined;
    if (!hasPadding) {
      defaultPandaProps.px = "10px";
      defaultPandaProps.py = "8px";
    }
    if (
      childProps.borderRadius === undefined &&
      childProps.rounded === undefined &&
      childProps.style?.borderRadius === undefined
    ) {
      defaultPandaProps.borderRadius = 6;
    }
    if (
      childProps.boxShadow === undefined &&
      childProps.shadow === undefined &&
      childProps.style?.boxShadow === undefined
    ) {
      defaultPandaProps.boxShadow = "0 6px 18px rgba(0,0,0,0.18)";
    }
    if (
      childProps.fontSize === undefined &&
      childProps.style?.fontSize === undefined
    ) {
      defaultPandaProps.fontSize = 13;
    }

    // Merge className for custom element
    const mergedClassName = [childProps.className, className ?? "tooltip-root"]
      .filter(Boolean)
      .join(" ");

    // Compose event handlers
    const combinedProps: Record<string, any> = {
      ...childProps,
      ...floatingProps,
    };

    Object.keys(floatingProps).forEach((key) => {
      if (key.startsWith("on") && typeof floatingProps[key] === "function") {
        const floatingHandler = floatingProps[key];
        const childHandler = childProps[key];
        if (typeof childHandler === "function") {
          combinedProps[key] = (...args: any[]) => {
            floatingHandler(...args);
            childHandler(...args);
          };
        } else {
          combinedProps[key] = floatingHandler;
        }
      }
    });

    // Handle refs properly
    const originalRef = (el as any).ref;
    const mergedFloatingRef = (node: HTMLElement | null) => {
      refs.setFloating(node as unknown as HTMLElement);
      if (typeof originalRef === "function") originalRef(node);
      else if (originalRef && typeof originalRef === "object")
        (originalRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
    };

    // Wrap custom element in motion.div for reliable animation
    // Arrow for custom path uses the sampled background color from the custom container
    arrowEl = showArrow ? (
      <div
        ref={(node) => {
          arrowRef.current = node;
        }}
        style={{
          position: "absolute",
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          transform: "rotate(45deg) translateZ(0)",
          background: containerBg ?? "rgba(20,20,20,0.95)",
          ...arrowStyle,
        }}
        data-arrow
      />
    ) : null;

    floatingNode = (
      <motion.div
        ref={mergedFloatingRef}
        {...floatingProps}
        // Wrapper is for positioning/animation only. Intentionally no default
        // class to avoid any visual styling that might override Panda props.
        className={className}
        style={{
          // Required runtime positioning (highest precedence - cannot be overridden)
          position: strategy as "absolute" | "fixed",
          left: x || 0,
          top: y || 0,
          transformOrigin,
          pointerEvents: (open || isMounted) && interactive ? "auto" : "none",
          zIndex: 9999,
          maxWidth: 320,
          display: "inline-block",
          overflow: "visible",
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.92 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        role="tooltip"
      >
        {(() => {
          // merge original child ref with our probe ref to read computed styles
          const originalChildRef = (el as any).ref;
          const mergedChildRef = (node: HTMLElement | null) => {
            containerRef.current = node as HTMLElement | null;
            if (typeof originalChildRef === "function") originalChildRef(node);
            else if (originalChildRef && typeof originalChildRef === "object")
              (
                originalChildRef as React.MutableRefObject<HTMLElement | null>
              ).current = node as HTMLElement | null;
          };
          return React.cloneElement(
            el,
            {
              // Put default Panda props first, so explicit child Panda props overwrite them
              ...defaultPandaProps,
              ...childProps,
              ref: mergedChildRef as any,
              className: mergedClassName,
              style: {
                // Keep visuals on the child so Panda can override
                ...(childProps.style || {}),
                position: "relative",
              },
            },
            childProps.children
          );
        })()}
        {arrowEl}
      </motion.div>
    );
  } else {
    // Default tooltip path: create motion.div wrapper
    // Arrow will sample from the default container we render below
    // logTooltipState("default", {
    //   placement: context.placement,
    //   open,
    //   hasMounted: isMounted,
    // });
    arrowEl = showArrow ? (
      <div
        ref={(node) => {
          arrowRef.current = node;
        }}
        style={{
          position: "absolute",
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          transform: "rotate(45deg) translateZ(0)",
          background: containerBg ?? "rgba(20,20,20,0.95)",
          ...arrowStyle,
        }}
        data-arrow
      />
    ) : null;

    floatingNode = (
      <motion.div
        ref={(node) => {
          refs.setFloating(node);
        }}
        {...getFloatingProps({})}
        // Wrapper should not carry visual defaults; they belong to the container.
        className={className}
        role="tooltip"
        style={{
          position: strategy as "absolute" | "fixed",
          left: x || 0,
          top: y || 0,
          transformOrigin,
          pointerEvents: (open || isMounted) && interactive ? "auto" : "none",
          zIndex: 9999,
          maxWidth: 320,
          display: "inline-block",
          overflow: "visible",
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.92 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
      >
        {/* Default container provides visual defaults as Panda props so users can override */}
        <Base
          role="tooltip"
          style={{ position: "relative" }}
          bg="rgba(20,20,20,0.95)"
          color="white"
          px="10px"
          py="8px"
          borderRadius={6}
          boxShadow="0 6px 18px rgba(0,0,0,0.18)"
          fontSize={13}
          ref={containerRef as any}
        >
          {content}
        </Base>
        {arrowEl}
      </motion.div>
    );
  }

  return (
    <>
      {cloned}

      {/* Portal tooltip when open or animating out */}
      {(open || isMounted) &&
        createPortal(
          floatingNode,
          props.portalContainer ||
            document.getElementById("portal") ||
            document.body
        )}
    </>
  );
}
