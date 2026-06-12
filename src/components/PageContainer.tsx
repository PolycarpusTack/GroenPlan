import type { ReactNode } from "react";

// Uniforme paginawrapper: consistente (responsieve) padding + breedte.
export function PageContainer({
  maxWidth = "max-w-5xl", className = "", children,
}: {
  maxWidth?: string;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`p-6 md:p-8 ${maxWidth} ${className}`}>{children}</div>;
}
