import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import { chipToneClass, type ChipTone } from "../../styles/theme";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  children: ReactNode;
}

// Tag/badge. Mapt een `tone` naar de bestaande gp-chip-klassen (zie theme.ts).
export function Chip({ tone = "neutral", className, children, ...rest }: ChipProps) {
  return (
    <span className={clsx(chipToneClass[tone], className)} {...rest}>
      {children}
    </span>
  );
}
