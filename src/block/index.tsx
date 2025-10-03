import * as React from "react";
import { createPortal } from "react-dom";
import { MotionConfig } from "framer-motion";

import Menu, { MenuContainer } from "./menu";
import Switch, { Track, Thumb } from "./switch";
import Radio, { Item as RadioItem } from "./radio";
import Textarea, { Label as TextareaLabel } from "./textarea";
import Input, { LeftIcon, RightSide, Label as InputLabel } from "./input";
import Accordion, { Item as AccordionItem } from "./accordion";
import Drawer, { BtnGroup, CloseBtn } from "./drawer";
import Progress, { TrackBg, TrackFill } from "./progress";
import Tooltip, { TooltipContainer } from "./tooltip";
import Checkbox from "./checkbox";
import * as _l from "./literals";
import * as _t from "./types";
import * as _f from "./fns";

const Hr = _l.motionTags.hr;
const Skeleton = _l.motionTags.div;

// Overloads for strict type checking based on filepicker prop
function Block(props: _t.BtnFilepickerProps): React.ReactElement;
function Block(props: _t.BtnStandardProps): React.ReactElement;
function Block(props: _t.BlockProps): React.ReactElement;

// Implementation signature
function Block(props: _t.BlockProps) {
  const anyProps = props as any; // prevent type evaluation explosion
  const {
    _motion,
    sheenInterval = "1.4s",
    children,
    tooltip,
    ...rest
  } = anyProps;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isLoading = anyProps.isLoading;
  const multiple = anyProps.multiple;
  const is = anyProps.is;

  const extract = _f.extractElType(is, anyProps);
  const [Comp, initialStyles] = _f.extractElAndStyles(extract, props);
  const icons = _f.getIcons(extract, props);

  let component = (
    <MotionConfig transition={_motion}>
      {extract.isHr ? (
        <Hr w py={2} color="neutral.300" {...anyProps} />
      ) : extract.isProgress ? (
        <Progress {...anyProps} />
      ) : extract.isDrawer ? (
        <Drawer {...anyProps} />
      ) : extract.isAccordion ? (
        <Accordion {...anyProps} />
      ) : extract.isMenu ? (
        <Menu {...anyProps} />
      ) : extract.isSwitch ? (
        <Switch {...anyProps} />
      ) : extract.isRadio ? (
        <Radio {...anyProps} />
      ) : extract.isInput ? (
        <Input {...anyProps} />
      ) : extract.isTextarea ? (
        <Textarea {...anyProps} />
      ) : extract.isCheckbox ? (
        <Checkbox {...anyProps} />
      ) : extract.isSkeleton ? (
        <Skeleton
          {...(anyProps.as === "circle"
            ? { br: "50%", size: 40 }
            : {
                height: 20,
                width: "100%",
                backgroundSize: "200% 100%",
                overflow: "hidden",
              })}
          backgroundColor={{ base: "neutral.300", _dark: "neutral.700" }}
          backgroundImage={{
            base: `linear-gradient(
          		90deg,
          		hsla(220, 8.94%, 66.08%, 0) 0%,
          		{colors.neutral.100/80} 50%,
          		hsla(220, 8.94%, 66.08%, 0) 100%
          	)`,
            _dark: `linear-gradient(
          		90deg,
          		hsla(220, 8.94%, 66.08%, 0) 0%,
          		{colors.neutral.500/80} 50%,
          		hsla(220, 8.94%, 66.08%, 0) 100%
          	)`,
          }}
          backgroundRepeat="no-repeat"
          backgroundSize="200% 100%"
          animation={`sheen ${sheenInterval} infinite linear`}
          {...anyProps}
        />
      ) : extract.filepickerAllowed ? (
        <div onClick={() => fileInputRef.current?.click()}>
          {React.createElement(
            Comp,
            {
              cursor: "pointer",
              ...(isLoading && { "data-loading": isLoading }),
              onContextMenu: (e: React.MouseEvent<HTMLElement>) =>
                e.preventDefault(),
              ...initialStyles,
            },
            icons.leftIcon,
            children as React.ReactNode,
            icons.rightIcon
          )}
          <input
            type="file"
            ref={fileInputRef}
            multiple={multiple}
            accept={anyProps.accept}
            style={{ display: "none" }}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []) as File[];
              const selectedFiles = files.length
                ? await _f.prepareFiles(files)
                : [];
              // When filepicker is true, onChange expects File[], not FormEvent
              if (anyProps.onChange) {
                (anyProps.onChange as (files: File[]) => void)(selectedFiles);
              }
            }}
            value=""
          />
        </div>
      ) : (
        React.createElement(
          Comp,
          {
            ...(isLoading && { "data-loading": isLoading }),
            onContextMenu: (e: React.MouseEvent<HTMLElement>) =>
              e.preventDefault(),
            ...initialStyles,
          },
          icons.leftIcon,
          children as React.ReactNode,
          icons.rightIcon
        )
      )}
    </MotionConfig>
  );

  if (tooltip) {
    const tooltipContent =
      typeof tooltip === "boolean" ? rest.content : tooltip;
    const tooltipProps = { ...rest, content: tooltipContent };
    component = <Tooltip {...tooltipProps}>{component}</Tooltip>;
  }

  if (rest.portal) {
    // make sure empty div with id="portal" is added below root div
    const portalContainer = rest.portalContainer as
      | Element
      | DocumentFragment
      | undefined;
    const fallback = document.getElementById("portal") || document.body;
    const container = (portalContainer ?? fallback) as
      | Element
      | DocumentFragment;
    return createPortal(
      component as React.ReactNode,
      container as Element | DocumentFragment
    );
  } else {
    return component;
  }
}

// Tag the factory for robust detection (survives HMR component identity swaps)
(TooltipContainer as any).isBlockTooltipContainer = true;
(MenuContainer as any).isBlockMenuContainer = true;

// Block.Tooltip namespace
const TooltipNamespace = { Container: TooltipContainer } as const;

// Block.Menu namespace
const MenuNamespace = { Container: MenuContainer } as const;

// Block.Input namespace
const InputNamespace = {
  Label: InputLabel,
  RightSide,
  LeftIcon,
} as const;

// Block.Textarea namespace
const TextareaNamespace = {
  Label: TextareaLabel,
} as const;

// Block.Radio namespace
const RadioNamespace = {
  Item: RadioItem,
} as const;

// Block.Switch namespace
const SwitchNamespace = { Track, Thumb } as const;

// Block.Accordion namespace
const AccordionNamespace = {
  Item: AccordionItem,
} as const;

// Block.Drawer namespace
const DrawerNamespace = {
  CloseBtn,
  BtnGroup,
} as const;

// Block.Progress namespace
const ProgressNamespace = {
  TrackFill,
  TrackBg,
} as const;

/** Compound component with proper typing
 * - x Block.Tooltip is not callable, ✔ Block.Tooltip.Container is
 * - x Block.Btn is not callable, ✔ Block.Btn.RightSide, Block.Btn.LeftIcon, Block.Btn.Label is
 */
type BlockComponent = typeof Block & {
  readonly Switch: typeof SwitchNamespace;
  readonly Drawer: typeof DrawerNamespace;
  readonly Tooltip: typeof TooltipNamespace;
  readonly Progress: typeof ProgressNamespace;
  readonly Accordion: typeof AccordionNamespace;
  readonly Textarea: typeof TextareaNamespace;
  readonly Input: typeof InputNamespace;
  readonly Radio: typeof RadioNamespace;
  readonly Menu: typeof MenuNamespace;
};

const CompoundBlock: BlockComponent = Object.assign(Block, {
  Accordion: AccordionNamespace,
  Progress: ProgressNamespace,
  Textarea: TextareaNamespace,
  Tooltip: TooltipNamespace,
  Switch: SwitchNamespace,
  Drawer: DrawerNamespace,
  Menu: MenuNamespace,
  Input: InputNamespace,
  Radio: RadioNamespace,
}) satisfies BlockComponent;

export default CompoundBlock;
