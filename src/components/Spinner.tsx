// Herbruikbare laad-spinner. Puur visueel (aria-hidden) — de ouder levert de
// statustekst/-rol waar nodig.
interface Props {
  size?: number;
  tone?: "moss" | "white";
  className?: string;
}

export function Spinner({ size = 20, tone = "moss", className = "" }: Props) {
  const ring = tone === "white" ? "border-white/40 border-t-white" : "border-moss-300 border-t-moss-600";
  return (
    <div
      aria-hidden
      className={`inline-block rounded-full animate-spin border-2 ${ring} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
