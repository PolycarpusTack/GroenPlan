import { useState } from "react";
import { Trash2, Pencil, AlertTriangle, Check, X } from "lucide-react";
import type { Zone } from "../domain/tuin/types";
import { useTuinStore } from "../store/tuin-store";
import { Button, Chip } from "./ui";

interface Props {
  zone: Zone;
  actief: boolean;
  onClick: () => void;
  onBewerk?: () => void;
}

const GRONDLABEL: Record<string, string> = {
  clay: "Klei", sand: "Zand", loam: "Leem", chalk: "Kalk", peat: "Veen",
};
const ZONLABEL: Record<string, string> = {
  full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw",
};
const DRAINAGELABEL: Record<string, string> = {
  "well-drained": "Goed doorlatend", moist: "Vochtig", wet: "Nat",
};

export function ZoneCard({ zone, actief, onClick, onBewerk }: Props) {
  const verwijderZone = useTuinStore((s) => s.verwijderZone);
  const [bevestigen, setBevestigen] = useState(false);

  const aantalPlanten = zone.plantPlaatsingen.length;

  const handleVerwijderKlik = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aantalPlanten > 0) {
      setBevestigen(true);
    } else {
      verwijderZone(zone.id);
    }
  };

  return (
    <article
      className={`gp-card-bordered cursor-pointer transition-all duration-[var(--gp-dur-base)]
        ${actief ? "border-moss-700 shadow-md ring-1 ring-moss-700" : "hover:shadow-md"}`}
      onClick={bevestigen ? undefined : onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !bevestigen && e.key === "Enter" && onClick()}
      aria-pressed={actief}
      aria-label={`Zone: ${zone.naam}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-heading-sm text-moss-900">{zone.naam}</h3>
          {actief && (
            <Chip tone="good" className="mt-1">Actief</Chip>
          )}
        </div>
        <div className="flex gap-1">
          {onBewerk && !bevestigen && (
            <Button
              variant="ghost"
              className="p-1.5 text-[var(--gp-text-mute)] hover:text-moss-700"
              onClick={(e) => { e.stopPropagation(); onBewerk(); }}
              aria-label={`Bewerk zone ${zone.naam}`}
            >
              <Pencil size={15} aria-hidden />
            </Button>
          )}
          {!bevestigen && (
            <Button
              variant="ghost"
              className="p-1.5 text-[var(--gp-rust-500)] hover:bg-[var(--gp-rust-100)]"
              onClick={handleVerwijderKlik}
              aria-label={`Verwijder zone ${zone.naam}`}
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          )}
        </div>
      </div>

      {/* Inline bevestiging */}
      {bevestigen ? (
        <div
          className="mt-1 p-3 rounded-lg bg-[var(--gp-rust-50)] border border-[var(--gp-rust-200)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={14} className="text-[var(--gp-rust-700)] shrink-0 mt-0.5" aria-hidden />
            <p className="text-body-sm text-[var(--gp-rust-700)]">
              Zone verwijderen met alle {aantalPlanten} plant{aantalPlanten !== 1 ? "en" : ""}?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); verwijderZone(zone.id); }}
              className="gp-btn flex items-center gap-1.5 text-caption bg-[var(--gp-rust-700)] text-white hover:bg-[var(--gp-rust-800)] px-3 py-1.5 rounded-md"
            >
              <Check size={12} aria-hidden /> Verwijder
            </button>
            <Button
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setBevestigen(false); }}
              className="flex items-center gap-1.5 text-caption px-3 py-1.5"
            >
              <X size={12} aria-hidden /> Annuleer
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-sm">
          <div>
            <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">Grond</dt>
            <dd className="text-moss-900">{GRONDLABEL[zone.grondsoort]}</dd>
          </div>
          <div>
            <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">Zon</dt>
            <dd className="text-moss-900">{ZONLABEL[zone.zon]}</dd>
          </div>
          <div>
            <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">Drainage</dt>
            <dd className="text-moss-900">{DRAINAGELABEL[zone.drainage]}</dd>
          </div>
          <div>
            <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">pH</dt>
            <dd className="text-moss-900">{zone.pH ?? "–"}</dd>
          </div>
        </dl>
      )}

      {!bevestigen && (
        <p className="text-caption text-[var(--gp-text-mute)] mt-3">
          {aantalPlanten} plant{aantalPlanten !== 1 ? "en" : ""}
        </p>
      )}
    </article>
  );
}
