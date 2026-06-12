import type { ReactNode } from "react";

// Eén bron van waarheid voor de styling van formuliervelden.
export const INVOER_KLASSE =
  "mt-1 w-full px-3 py-2 text-body-sm border border-[var(--gp-border)] rounded-lg " +
  "focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white";

// Label + veld-wrapper voor consistente formulieropbouw.
export function Veld({
  label, className = "", children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-caption text-moss-700 font-medium">{label}</span>
      {children}
    </label>
  );
}
