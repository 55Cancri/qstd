import React from "react";

import * as _l from "./literals";
import * as _t from "./types";

type RadioItemProps = Omit<_t.BaseBlockProps, "is"> & {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

type RegisteredItem = {
  id: string;
  value: string;
  disabled: boolean;
  ref: React.RefObject<HTMLElement | null>;
};

type RadioContextType = {
  groupId: string;
  disabled?: boolean;
  selectedValue: string | null;
  setSelectedValue: (value: string) => void;
  registerItem: (entry: RegisteredItem) => void;
  unregisterItem: (id: string) => void;
  isActiveId: (id: string) => boolean;
  setActiveById: (id: string) => void;
};

const RadioContext = React.createContext<RadioContextType | null>(null);

const Base = _l.base;
const MotionDiv = _l.motionTags.div;

/**
 * Radio group with roving tabindex and keyboard navigation.
 * - Uses context so `Item` can register/unregister, enabling focus management and selection without DOM queries.
 * - Arrow keys move the active item; Space/Enter selects.
 * - Only the active item has tabIndex=0; the rest are -1. This preserves a11y expectations.
 */
export default function Radio(props: _t.RadioBlockProps) {
  const {
    value: controlledValue,
    defaultValue = null,
    disabled,
    onChange,
    name,
    options,
    renderOption,
    onKeyDown: onKeyDownProp,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;

  const groupId = React.useId();

  // Controlled/uncontrolled selected value
  const isControlled = controlledValue !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<string | null>(
    defaultValue
  );
  const selectedValue = (
    isControlled ? (controlledValue as string | null) : uncontrolled
  ) as string | null;

  // Registry for roving tabindex and keyboard nav
  const itemsRef = React.useRef<RegisteredItem[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  const setSelectedValue = (val: string) => {
    if (!isControlled) setUncontrolled(val);
    onChange?.(val);
  };

  const registerItem = (entry: RegisteredItem) => {
    const exists = itemsRef.current.find((x) => x.id === entry.id);
    if (exists) {
      // update existing (disabled/ref might change)
      exists.value = entry.value;
      exists.disabled = entry.disabled;
      exists.ref = entry.ref;
    } else {
      itemsRef.current.push(entry);
    }

    // Initialize activeId to the selected option or the first enabled item
    if (!activeId) {
      const selected = selectedValue
        ? itemsRef.current.find((x) => x.value === selectedValue)
        : undefined;
      const firstEnabled = itemsRef.current.find((x) => !x.disabled);
      const initial = (selected || firstEnabled)?.id;
      if (initial) setActiveId(initial);
    }
  };

  const unregisterItem = (id: string) => {
    itemsRef.current = itemsRef.current.filter((x) => x.id !== id);
    // If removing the active item, fall back to first enabled
    if (activeId === id) {
      const firstEnabled = itemsRef.current.find((x) => !x.disabled);
      if (firstEnabled) setActiveId(firstEnabled.id);
      else setActiveId("");
    }
  };

  const getIndexById = (id: string) =>
    itemsRef.current.findIndex((x) => x.id === id);

  const moveActive = (delta: number) => {
    if (!itemsRef.current.length) return;
    const currentIndex = getIndexById(activeId);
    const total = itemsRef.current.length;
    let next = currentIndex;
    for (let i = 0; i < total; i++) {
      next = (next + delta + total) % total;
      const candidate = itemsRef.current[next];
      if (candidate && !candidate.disabled) {
        setActiveId(candidate.id);
        candidate.ref.current?.focus();
        setSelectedValue(candidate.value);
        break;
      }
    }
  };

  const isActiveId = (id: string) => id === activeId;
  const setActiveById = (id: string) => {
    const found = itemsRef.current.find((x) => x.id === id && !x.disabled);
    if (found) {
      setActiveId(found.id);
    }
  };

  // Keep active in sync when selectedValue changes externally
  React.useEffect(() => {
    if (!selectedValue) return;
    const selected = itemsRef.current.find((x) => x.value === selectedValue);
    if (selected && !selected.disabled) setActiveId(selected.id);
  }, [selectedValue]);

  const ctx: RadioContextType = {
    groupId,
    disabled,
    selectedValue: selectedValue ?? null,
    setSelectedValue,
    unregisterItem,
    registerItem,
    isActiveId,
    setActiveById,
  };

  return (
    <RadioContext.Provider value={ctx}>
      <Base
        // The group itself isn't tabbable; items manage focus via roving tabindex
        role="radiogroup"
        aria-disabled={disabled}
        {...rest}
        onKeyDown={(e) => {
          if (disabled) return;

          // Arrow keys move the active item, Space/Enter selects the active item
          if (["ArrowUp", "ArrowLeft"].includes(e.code)) {
            e.preventDefault();
            moveActive(-1);
          } else if (["ArrowDown", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
            moveActive(1);
          } else if (["Space", "Enter"].includes(e.code)) {
            e.preventDefault();
            const current = itemsRef.current.find((x) => x.id === activeId);
            if (current && !current.disabled) {
              setSelectedValue(current.value);
              current.ref.current?.focus();
            }
          }

          onKeyDownProp?.(e as React.KeyboardEvent<HTMLDivElement>);
        }}
      >
        {(options ?? []).map((opt) =>
          renderOption ? (
            <React.Fragment key={opt.value}>{renderOption(opt)}</React.Fragment>
          ) : (
            <Item
              key={opt.value}
              value={opt.value}
              disabled={!!(disabled || opt.disabled)}
              alignI
              gap="8px"
              whiteSpace="nowrap"
            >
              {opt.label}
            </Item>
          )
        )}
        {/* Hidden input for form posts when a `name` is provided */}
        {typeof name === "string" && (
          <input type="hidden" name={name} value={selectedValue ?? ""} />
        )}
      </Base>
    </RadioContext.Provider>
  );
}

export function Item(props: RadioItemProps) {
  const {
    value,
    children,
    grid: gridProp,
    cols: colsProp,
    disabled: itemDisabled,
    onClick: onClickProp,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    onAnimationStart,
    onAnimationComplete,
    ...rest
  } = props;

  const ctx = React.useContext(RadioContext);
  if (!ctx) {
    // No provider found: render a simple, non-interactive line item
    return (
      <Base flex alignI cursor="pointer" {...rest}>
        <Base data-radio-circle w={24} h={24} br={9999} mr={8} />
        {children}
      </Base>
    );
  }

  const {
    groupId,
    registerItem,
    unregisterItem,
    selectedValue,
    setSelectedValue,
    isActiveId,
    setActiveById,
    disabled: groupDisabled,
  } = ctx;

  const disabled = !!(groupDisabled || itemDisabled);
  // Stable id derived from group and value (no memo needed)
  const id = `radio-item-${groupId}-${value}`;
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    registerItem({ id, value, disabled, ref });
    return () => unregisterItem(id);
  }, [id, value, disabled]);

  const isSelected = selectedValue === value;
  const isActive = isActiveId(id);
  const [isFocused, setIsFocused] = React.useState(false);

  // Derive layout defaults: flex by default; if cols present and grid not provided, enable grid
  const shouldUseGrid = gridProp || !!colsProp;

  // Build label node with conditional wrapper for string children
  const renderLabel = () => {
    const onlyChild =
      React.Children.count(children) === 1
        ? (React.Children.toArray(children)[0] as React.ReactNode)
        : null;

    if (typeof onlyChild === "string") {
      return <Base data-radio-label>{onlyChild}</Base>;
    }

    // Non-string: attach data attribute directly if possible
    if (React.isValidElement(onlyChild)) {
      return React.cloneElement(
        onlyChild as React.ReactElement,
        {
          ...((onlyChild as any).props || {}),
          ["data-radio-label"]: true,
        } as Record<string, unknown>
      );
    }

    // Multiple children or non-string primitive
    return <Base data-radio-label>{children}</Base>;
  };

  return (
    <Base
      ref={ref}
      flex
      alignI
      outline="none"
      // Accessibility: roving tabindex and proper role/aria*
      role="radio"
      tabIndex={isActive ? 0 : -1}
      aria-checked={isSelected}
      aria-disabled={disabled}
      // Layout defaults
      {...(shouldUseGrid ? { grid: true } : { flex: true, alignI: true })}
      {...(colsProp && { cols: colsProp })}
      gap={shouldUseGrid ? undefined : "8px"}
      cursor={disabled ? "not-allowed" : "pointer"}
      userSelect="none"
      // State data attributes for styling hooks
      {...(isSelected && { "data-selected": true })}
      {...(disabled && { "data-disabled": true })}
      _disabled={{
        _radioLabel: { color: { base: "neutral.400", _dark: "neutral.600" } },
      }}
      // Events: click selects; focus updates active roving target
      onClick={(e) => {
        if (!disabled) setSelectedValue(value);
        onClickProp?.(e as React.MouseEvent<HTMLDivElement>);
      }}
      onFocus={(e) => {
        setActiveById(id);
        setIsFocused(true);
        onFocusProp?.(e as React.FocusEvent<HTMLDivElement>);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlurProp?.(e as React.FocusEvent<HTMLDivElement>);
      }}
      {...rest}
    >
      <Base
        data-radio-outer
        relative
        {...(isSelected && { "data-selected": true })}
        {...(disabled && { "data-disabled": true })}
        w="24px"
        h="24px"
        grid
        placeI
        br={9999}
        boxSizing="border-box"
        borderWidth={2}
        borderStyle="solid"
        mr={shouldUseGrid ? undefined : "8px"}
        borderColor={{ base: "neutral.400", _dark: "neutral.400" }}
        _selected={{ borderColor: { base: "blue.500", _dark: "blue.400" } }}
        _disabled={{
          borderColor: { base: "neutral.400", _dark: "neutral.600" },
        }}
      >
        <MotionDiv
          data-radio-focusring
          absolute
          top={0}
          left={0}
          w="100%"
          h="100%"
          br={9999}
          pointerEvents="none"
          boxShadow={{
            base: "0 0 0 6px rgba(0,0,0,.08)",
            _dark: "0 0 0 6px rgba(255,255,255,.08)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isFocused ? 1 : 0,
            opacity: isFocused ? 1 : 0,
            transition: { type: "spring", stiffness: 520, damping: 34 },
          }}
        />
        <MotionDiv
          data-radio-inner
          {...(isSelected && { "data-selected": true })}
          {...(disabled && { "data-disabled": true })}
          w="12px"
          h="12px"
          br={9999}
          bg={{ base: "blue.500", _dark: "blue.400" }}
          initial={{ scale: 0 }}
          animate={{
            scale: isSelected ? 1 : 0,
            transition: { type: "spring", stiffness: 520, damping: 34 },
          }}
          _disabled={{ bg: { base: "neutral.400", _dark: "neutral.600" } }}
        />
      </Base>
      {renderLabel()}
    </Base>
  );
}
