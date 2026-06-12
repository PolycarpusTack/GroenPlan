import clsx from "clsx";

export interface StatCardProps {
  waarde: string;
  label: string;
  sublabel?: string;
  kleur?: string; // tekstkleur-utility voor het hoofdgetal (bv. "text-rust-700")
  onClick?: () => void;
}

// Eén samenvattend cijfer met label (de stats-strip). Klikbaar → button, anders div.
export function StatCard({ waarde, label, sublabel, kleur, onClick }: StatCardProps) {
  const klasse = clsx(
    "gp-card-bordered text-center",
    onClick && "cursor-pointer hover:shadow-md transition-shadow",
  );
  const inhoud = (
    <>
      <p className={clsx("font-display text-display-md", kleur ?? "text-moss-700")}>
        {waarde}
        {sublabel && (
          <span className="text-heading-sm text-[var(--gp-text-mute)]">{sublabel}</span>
        )}
      </p>
      <p className="text-caption text-[var(--gp-text-mute)]">{label}</p>
    </>
  );
  return onClick ? (
    <button type="button" className={klasse} onClick={onClick}>
      {inhoud}
    </button>
  ) : (
    <div className={klasse}>{inhoud}</div>
  );
}
