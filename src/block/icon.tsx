import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import type { IconName } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

library.add(fas, far, fab);

import * as _t from "./types";
import type { IconBaseProps } from "react-icons/lib";

export default function Icon(props: _t.BaseBlockProps) {
  const { className, iconPrefix, pulse, spin } = props;
  const iconSize = props.iconSize; // We'll need to add this to types

  const IconComp = props.icon ?? props.startIcon;

  const prefix =
    !iconPrefix || iconPrefix === "solid"
      ? "fas"
      : iconPrefix === "regular"
      ? "far"
      : "fab";

  // Normal icon rendering (non-loading or other position)
  if (!IconComp) return null;
  else if (typeof IconComp === "string") {
    return (
      <FontAwesomeIcon
        icon={{ prefix, iconName: IconComp as IconName }}
        className={className}
        spinPulse={pulse}
        size={iconSize}
        spin={spin}
      />
    );
  } else if ("iconName" in IconComp) {
    return (
      <FontAwesomeIcon
        icon={IconComp}
        className={className}
        spinPulse={pulse}
        size={iconSize}
        spin={spin}
      />
    );
  } else if (typeof IconComp === "function") {
    return IconComp(props as IconBaseProps);
  } else return IconComp;
}
