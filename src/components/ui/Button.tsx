import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "gp-btn-primary",
  secondary: "gp-btn-secondary",
  ghost: "gp-btn-ghost",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "text-body-sm py-1 px-3",
  md: "",
  lg: "text-body px-5 py-3",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

// Getypte wrapper rond de bestaande `gp-btn`-klassen — één plek voor knopvarianten
// in plaats van overal losse className-strings. Rendert dezelfde DOM/klassen.
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx("gp-btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
