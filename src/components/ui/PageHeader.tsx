import clsx from "clsx";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// Standaard pagina-kop: titel als h1 (display-stijl), optionele subtitel en
// rechts uitgelijnde acties. Vervangt de herhaalde h1+p-blokken in de pagina's.
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx("mb-6 flex items-start justify-between gap-3", className)}>
      <div>
        <h1 className="font-display text-display-md text-moss-900 mb-1">{title}</h1>
        {subtitle && <p className="text-body text-moss-500">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
