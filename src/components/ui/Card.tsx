import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "bordered";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

// Oppervlak-container. `default` = zachte schaduw (gp-card), `bordered` = rand
// zonder schaduw (gp-card-bordered) — exact de twee bestaande CSS-patronen.
export function Card({ variant = "default", className, children, ...rest }: CardProps) {
  return (
    <div
      className={clsx(variant === "bordered" ? "gp-card-bordered" : "gp-card", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
