import React from "react";
import { type Updater, useImmer } from "use-immer";

import Icon from "./icon";
import useResizeObserver from "./use-resize-observer";

import * as _l from "./literals";
import * as _t from "./types";

const MotionDiv = _l.motionTags.div;
const MotionBtn = _l.motionTags.button;

const displayName = "AccordionItem";

type AccordionProviderProps = { children: React.ReactNode };
type AccordionValues = {
  allowMultiple: boolean;
  allowToggle: boolean;
  open: boolean[];
};
type AccordionState = {
  state: AccordionValues;
  setState: Updater<AccordionValues>;
};
const AccordionContext = React.createContext({} as AccordionState);

function AccordionProvider(props: AccordionProviderProps) {
  const [state, setState] = useImmer<AccordionValues>({
    allowMultiple: false,
    allowToggle: true,
    open: [],
  });

  return (
    <AccordionContext.Provider value={{ setState, state }}>
      {props.children}
    </AccordionContext.Provider>
  );
}

function useAccordion() {
  const context = React.useContext(AccordionContext);

  if (context === undefined) {
    throw new Error("useAccordion must be used within a AccordionProvider");
  }
  return context;
}

function AccordionComponent(props: _t.AccordionBlockProps) {
  const accordion = useAccordion();
  const accordionState = accordion.state;

  /* eslint-disable react-hooks/exhaustive-deps -- setState is stable, but context object recreates each render */
  React.useEffect(() => {
    accordion.setState((draft) => {
      draft.allowMultiple = !!props.allowMultiple;
      draft.allowToggle = !!props.allowToggle;
    });
  }, [props.allowMultiple, props.allowToggle]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // validate only accordionItems are children
  React.Children.forEach(props.children, (x) => {
    // Use displayName for HMR-stable validation instead of reference equality
    if (
      typeof x.type === "function" &&
      "displayName" in x.type &&
      x.type.displayName !== displayName
    ) {
      throw new Error("Accordion can only have AccordionItems as children");
    }
  });

  // add child idx to props
  const children = React.Children.map(props.children, (child, i) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, { idx: i } as { idx: number });
  });

  const defaultOpenIdxList = JSON.stringify(props.defaultOpenIdx ?? []);

  React.useEffect(
    () => {
      if (accordionState.open.length === children.length) return;
      const defaultOpenIdx = props.defaultOpenIdx;
      const items = new Array(children.length).fill(null).map((x, i) => {
        if (defaultOpenIdx) return defaultOpenIdx.includes(i);
        else return false;
      });
      accordion.setState((draft) => {
        draft.open = items;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accordionState.open.length, children.length, defaultOpenIdxList]
  );

  return <MotionDiv grid>{children}</MotionDiv>;
}

function Accordion(props: _t.AccordionBlockProps) {
  return (
    <AccordionProvider>
      <AccordionComponent {...props} />
    </AccordionProvider>
  );
}

type AccordionItemProps = Omit<_t.BtnBlockProps, "is" | "title"> & {
  title: React.ReactNode;
  children: React.ReactNode;
  /** icon to indicate if open or closed */
  rightIndicator?: (open: boolean) => React.ReactNode;
  rightStatusIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};
export function Item(props: AccordionItemProps) {
  const { ref, height } = useResizeObserver<HTMLDivElement>();
  const { idx, children, rightIndicator, rightStatusIcon, title, ...rest } =
    props as AccordionItemProps & { idx: number };
  const accordion = useAccordion();
  const accordionState = accordion.state;

  const isOpen = accordionState.open.at(idx);
  const isLastItem = idx === accordionState.open.length - 1;

  const toggle = () => {
    const updatedItems = accordionState.open.map((x, i) => {
      if (accordionState.allowMultiple) return i === idx ? !x : x;
      else return i === idx ? !x : false;
    });
    accordion.setState((draft) => {
      draft.open = updatedItems;
    });
  };

  return (
    <MotionDiv
      grid
      alignC="start"
      overflow="auto"
      //   {...(isLastItem && { borderBottom: `1px solid var(--colors-gray-300)!` })}
      style={{
        borderBottom: isLastItem
          ? `1px solid ${
              (typeof props.borderBottomColor === "string" &&
                props.borderBottomColor) ||
              (typeof props.borderColor === "string" && props.borderColor) ||
              "var(--colors-neutral-300)!"
            }`
          : undefined,
        borderTop: `1px solid ${
          (typeof props.borderTopColor === "string" && props.borderTopColor) ||
          (typeof props.borderColor === "string" && props.borderColor) ||
          "var(--colors-neutral-300)!"
        }`,
      }}
    >
      <MotionBtn
        // variant="naked"
        flex
        py={2}
        // cols={rightStatusIcon ? "1fr mx mx!" : "1fr mx"}
        // alignI
        rows="between" // justify-content: space-between
        borderRadius={0}
        boxSizing="border-box"
        cursor="pointer"
        transition=".2s all ease-in-out"
        _hover={{ bg: { base: "neutral.100", _dark: "neutral.700" } }}
        _active={{ scale: 0.98 }}
        overflow="auto"
        zIndex={1}
        {...rest}
        onClick={(e) => {
          toggle();
          props.onClick?.(e);
        }}
      >
        <>{title!}</>
        {rightIndicator ? (
          rightIndicator?.(isOpen!)
        ) : (
          <MotionDiv grid pr=".5rem" color="neutral.500">
            <Icon
              fontSize=".8rem"
              icon={isOpen ? "chevron-up" : "chevron-down"}
            />
          </MotionDiv>
        )}
        {rightStatusIcon ? rightStatusIcon : null}
      </MotionBtn>
      <MotionDiv grid overflowY="auto" maxH="100%">
        <MotionDiv
          grid
          animate={{ height: isOpen ? height ?? 0 : 0 }}
          overflowY="hidden"
        >
          <MotionDiv grid ref={ref}>
            {isOpen && (
              <MotionDiv
                grid
                //   p="1.5rem"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {children!}
              </MotionDiv>
            )}
          </MotionDiv>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
}

// Add displayName for HMR-stable validation
Item.displayName = displayName;

export default Accordion;
