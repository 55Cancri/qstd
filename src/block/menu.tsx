import React from "react";
import { AnimatePresence } from "framer-motion";
import {
  shift,
  flip,
  hide,
  offset,
  autoUpdate,
  useFloating,
  FloatingPortal,
} from "@floating-ui/react";

import * as _t from "./types";
import * as _l from "./literals";

const Div = _l.tags.div;
const MotionDiv = _l.motionTags.div;

// Public container for callers to define their own menu surface.
// Keep it simple like other Block compound components.
export function MenuContainer(props: _t.BaseBlockProps) {
  const { children, ...rest } = props;
  return (
    <Div {...rest} role="menu" data-menu-container>
      {children}
    </Div>
  );
}

export default function Menu(props: _t.MenuBlockProps) {
  const {
    variant = "click",
    isOpen: isOpenControlled,
    children,
    trigger,
    ...rest
  } = props;
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isOpen, setOpen] = React.useState(isOpenControlled ?? false);

  const onOpenChange = (open: React.SetStateAction<boolean>) => {
    const newOpenState = typeof open === "function" ? open(isOpen) : open;
    props.onOpenOrClose?.(newOpenState);
    setOpen(newOpenState);
  };

  React.useEffect(() => {
    if (typeof isOpenControlled !== "boolean") return;
    setOpen(isOpenControlled);
  }, [isOpenControlled]);

  const {
    refs,
    x,
    y,
    middlewareData: { hide: hideData },
    context: floatingContext,
  } = useFloating<HTMLElement>({
    placement: props.placement ?? "bottom-start",
    whileElementsMounted: autoUpdate,
    open: isOpen,
    onOpenChange,
    middleware: [
      offset({ crossAxis: props.offset?.x, mainAxis: props.offset?.y }),
      flip({ fallbackPlacements: ["top-end"] }),
      shift({ padding: 5 }),
      hide({ strategy: "referenceHidden" }),
    ],
  });

  const openMenu = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    onOpenChange(true);
  };

  const closeMenuHover = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(
      () => onOpenChange(false),
      props.hoverDelay ?? 150
    );
  };

  const closeMenuImmediate = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    onOpenChange(false);
  };

  const handleTriggerClick = () => {
    if (variant === "click") onOpenChange((prev) => !prev);
  };

  const handleTriggerMouseEnter = () => {
    if (variant === "hover") {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        openMenu();
      }, props.hoverDelay ?? 250);
    }
  };

  const handleTriggerMouseLeave = () => {
    if (variant === "hover") {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      closeMenuHover();
    }
  };

  const handleMenuMouseEnter = () => {
    if (variant === "hover") openMenu();
  };

  const handleMenuMouseLeave = () => {
    if (variant === "hover") closeMenuHover();
  };

  useOutsideClick(
    refs.floating,
    (event: MouseEvent | TouchEvent) => {
      const referenceElement = refs.reference.current;
      if (
        isOpen &&
        referenceElement instanceof Element &&
        !referenceElement.contains(event.target as Node)
      ) {
        // always close immediately when clicking outside, regardless of variant
        // this bypasses hover delays and provides immediate feedback
        closeMenuImmediate();
      }
    },
    isOpen
  );

  React.useEffect(() => {
    if (!hideData?.referenceHidden) return;
    closeMenuImmediate();
  }, [hideData, closeMenuImmediate]);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.1, ease: "easeOut" },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  } as const;

  const triggerEventProps =
    variant === "hover"
      ? {
          onMouseEnter: handleTriggerMouseEnter,
          onMouseLeave: handleTriggerMouseLeave,
        }
      : { onClick: handleTriggerClick };

  const menuEventProps =
    variant === "hover"
      ? {
          onMouseEnter: handleMenuMouseEnter,
          onMouseLeave: handleMenuMouseLeave,
        }
      : {};

  const transformOrigin = floatingContext.placement.startsWith("top")
    ? "bottom left"
    : "top left";

  // Detect custom container among direct children
  const childArray = React.Children.toArray(children);
  let customContainerEl: React.ReactElement | null = null;
  for (const c of childArray) {
    if (React.isValidElement(c)) {
      const anyType = (c as any).type as any;
      if (
        (c.props as any)?.["data-menu-container"] ||
        anyType?.isBlockMenuContainer
      ) {
        customContainerEl = c as React.ReactElement<any>;
        break;
      }
    }
  }

  // Build the floating layer node: custom container (cloned) or default container
  let floatingLayer: React.ReactNode = null;

  if (customContainerEl) {
    const childProps = (customContainerEl.props || {}) as Record<string, any>;
    const { style: restStyle, ...restPanda } = (rest as any) || {};

    // Default Panda props (applied first, can be overridden by child/rest)
    const defaultPanda: Record<string, any> = {};
    if (
      childProps.borderRadius === undefined &&
      childProps.rounded === undefined &&
      childProps.style?.borderRadius === undefined
    )
      defaultPanda.borderRadius = "md";
    if (
      childProps.shadow === undefined &&
      childProps.boxShadow === undefined &&
      childProps.style?.boxShadow === undefined
    )
      defaultPanda.shadow = "lg";
    if (
      childProps.bg === undefined &&
      childProps.background === undefined &&
      !(childProps.style?.background || childProps.style?.backgroundColor)
    )
      defaultPanda.bg = { base: "neutral.100", _dark: "neutral.900" };
    if (
      childProps.overflow === undefined &&
      childProps.style?.overflow === undefined
    )
      defaultPanda.overflow = "hidden";
    if (
      childProps.outline === undefined &&
      childProps.style?.outline === undefined
    )
      defaultPanda.outline = "none";

    const mergedStyle: React.CSSProperties = {
      ...(childProps.style || {}),
      ...(restStyle || {}),
    };

    const contentNode = React.cloneElement(
      customContainerEl,
      {
        // Defaults first
        ...defaultPanda,
        // Then Panda props coming from the parent <Block is="menu" ...>
        ...restPanda,
        // Finally explicit props on the provided container win
        ...childProps,
        // Apply menu event props to the actual container
        ...menuEventProps,
        role: childProps.role ?? "menu",
        "aria-orientation": childProps["aria-orientation"] ?? "vertical",
        css: {
          ...(restPanda.css || {}),
          ...(childProps.css || {}),
          ring:
            (childProps.css && childProps.css.ring) ??
            (restPanda.css && restPanda.css.ring) ??
            "1px solid rgba(208, 58, 58, 0.05)",
        },
        style: mergedStyle,
      },
      childProps.children
    );

    floatingLayer = (
      <MotionDiv
        zIndex={props.zIndex}
        ref={refs.setFloating}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: y, left: x, transformOrigin }}
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {contentNode}
      </MotionDiv>
    );
  } else {
    // Default container path: motion wrapper + simple container
    const { style: restStyle, ...restPanda } = (rest as any) || {};
    const container = (
      <MenuContainer
        role="menu"
        aria-orientation="vertical"
        borderRadius="md"
        shadow="lg"
        bg={{ base: "neutral.100", _dark: "neutral.900" }}
        overflow="hidden"
        outline="none"
        css={{ ring: "1px solid rgba(208, 58, 58, 0.05)" }}
        {...(restPanda as any)}
        {...(menuEventProps as any)}
        style={{ ...(restStyle || {}) }}
      >
        {children}
      </MenuContainer>
    );

    floatingLayer = (
      <MotionDiv
        zIndex={props.zIndex}
        ref={refs.setFloating}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: y, left: x, transformOrigin }}
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {container}
      </MotionDiv>
    );
  }

  return (
    <Div
      ref={refs.setReference}
      h="max-content"
      style={{ width: props.width || "max-content" }}
      {...triggerEventProps}
    >
      {trigger}

      <FloatingPortal>
        <AnimatePresence>{isOpen && floatingLayer}</AnimatePresence>
      </FloatingPortal>
    </Div>
  );
}

function useOutsideClick<T extends HTMLElement | null>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]); // Reload only if ref or handler changes and it's enabled
}
