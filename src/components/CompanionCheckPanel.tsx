import { ThumbsUp, ThumbsDown, Info } from "lucide-react";
import type { BegeleidersResultaat } from "../domain/tuin/berekenBegeleidersCheck";

interface Props {
  resultaten: BegeleidersResultaat[];
  aantalParen: number;
}

function korteNaam(wetNaam: string): string {
  const delen = wetNaam.split(" ");
  if (delen.length < 2) return wetNaam;
  return `${delen[0][0]}. ${delen.slice(1).join(" ")}`;
}

export function CompanionCheckPanel({ resultaten, aantalParen }: Props) {
  if (aantalParen === 0) return null;

  const slechte = resultaten.filter((r) => r.relatie === "slecht");
  const goede = resultaten.filter((r) => r.relatie === "goed");

  if (resultaten.length === 0) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] text-body-sm text-[var(--gp-text-mute)]">
        <Info size={14} className="shrink-0 mt-0.5" aria-hidden />
        Geen bekende begeleidersrelaties tussen de huidige planten.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slechte.map((r) => (
        <div
          key={`${r.plantA}|${r.plantB}`}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--gp-rust-100)] border border-[var(--gp-rust-300)] text-body-sm"
        >
          <ThumbsDown size={13} className="text-[var(--gp-rust-700)] shrink-0" aria-hidden />
          <span className="text-[var(--gp-rust-700)]">
            <span className="gp-scientific">{korteNaam(r.plantA)}</span>
            {" "}en{" "}
            <span className="gp-scientific">{korteNaam(r.plantB)}</span>
            {" "}groeien slecht samen
          </span>
        </div>
      ))}
      {goede.map((r) => (
        <div
          key={`${r.plantA}|${r.plantB}`}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-moss-50 border border-moss-200 text-body-sm"
        >
          <ThumbsUp size={13} className="text-moss-600 shrink-0" aria-hidden />
          <span className="text-moss-800">
            <span className="gp-scientific">{korteNaam(r.plantA)}</span>
            {" "}en{" "}
            <span className="gp-scientific">{korteNaam(r.plantB)}</span>
            {" "}zijn goede buren
          </span>
        </div>
      ))}
    </div>
  );
}
