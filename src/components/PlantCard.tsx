import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { AutoFillResultaat } from "../domain/plant/types";
import type { MatchResultaat } from "../match/types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";
import { SourceAttribution } from "./SourceAttribution";
import { Button, Chip } from "./ui";

interface Props {
  plant: AutoFillResultaat;
  score: number; // 0–1
  match?: MatchResultaat;
  onClick?: () => void;
  onToevoegen?: () => void;
  reedsInZone?: boolean;
  onVerwijder?: () => void;
}

function plantThumbnailKlasse(kleuren: string[]): string {
  const k = kleuren[0]?.toLowerCase() ?? "";
  if (["purple", "violet", "lavender", "mauve", "lila"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-bloom-100 to-bloom-400";
  if (["yellow", "orange", "gold", "amber", "geel", "oranje"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-amber-100 to-amber-400";
  if (["pink", "red", "crimson", "rose", "magenta", "rood", "roze"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-rust-100 to-bloom-200";
  if (["blue", "indigo", "blauw"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-sky-100 to-sky-300";
  if (["white", "cream", "ivory", "wit", "crème"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-moss-50 to-surface-alt";
  return "bg-gradient-to-br from-moss-100 to-moss-300";
}

export function PlantCard({ plant, score, match, onClick, onToevoegen, reedsInZone, onVerwijder }: Props) {
  const { identificatie, omstandigheden, bloei } = plant;
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const zonLabel: Record<string, string> = {
    full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw", unknown: "Onbekend",
  };

  const thumbnailKlasse = plantThumbnailKlasse(bloei.kleuren.waarde);

  return (
    <article
      className="gp-card-bordered hover:shadow-md transition-shadow duration-[var(--gp-dur-base)]"
      aria-label={`Plant: ${identificatie.wetenschappelijkeNaam}`}
    >
      {/* Kleur-thumbnail + score badge — klikbaar naar detail */}
      <div
        className={`relative ${thumbnailKlasse} rounded-md aspect-[4/3] mb-3 flex items-center justify-center overflow-hidden cursor-pointer`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      >
        <span className="text-moss-700/40 text-body-sm font-medium italic">{identificatie.familie}</span>
        <div className="absolute top-2 right-2">
          <MatchScoreBadge score={score} />
        </div>
      </div>

      {/* Namen */}
      <div className="mb-2 cursor-pointer" onClick={onClick}>
        <p className="gp-scientific text-body text-[var(--gp-moss-900)] font-medium leading-tight hover:underline">
          {identificatie.wetenschappelijkeNaam}
          {identificatie.cultivar && (
            <span className="gp-cultivar">{identificatie.cultivar}</span>
          )}
        </p>
        {identificatie.gewoneNamen.nl && (
          <p className="text-body-sm text-[var(--gp-text-mute)]">{identificatie.gewoneNamen.nl}</p>
        )}
      </div>

      {/* "Waarom deze plant" — matchredenen indien beschikbaar, anders plant-eigenschappen */}
      <div className="flex flex-wrap gap-1 mb-3">
        {match && match.topRedenen.length > 0 ? (
          match.topRedenen.slice(0, 2).map((reden, i) => (
            <Chip key={i} tone="good">{reden}</Chip>
          ))
        ) : (
          <>
            {omstandigheden.zon.waarde !== "unknown" && (
              <Chip tone="good">{zonLabel[omstandigheden.zon.waarde]}</Chip>
            )}
            {bloei.maanden.waarde.length > 0 && (
              <Chip tone="bloom">
                Bloeit {bloei.maanden.waarde.length} mnd
              </Chip>
            )}
            {omstandigheden.waterbehoeften.waarde === "low" && (
              <Chip tone="water">Droogtebestendig</Chip>
            )}
          </>
        )}
      </div>

      {/* Bronvermelding */}
      <div className="flex justify-between items-center mb-3">
        <SourceAttribution
          bron={omstandigheden.zon.bron}
          terugval={omstandigheden.zon.terugval}
        />
        <span className="text-caption text-[var(--gp-text-mute)]">
          {Math.round(plant.zekerheid.algemeen * 100)}% zeker
        </span>
      </div>

      {/* Matchscore breakdown toggle */}
      {match && (
        <button
          onClick={() => setBreakdownOpen((o) => !o)}
          className="flex items-center gap-1 text-caption text-[var(--gp-text-mute)] hover:text-moss-700 mb-2 w-full"
          aria-expanded={breakdownOpen}
        >
          {breakdownOpen ? <ChevronUp size={13} aria-hidden /> : <ChevronDown size={13} aria-hidden />}
          {breakdownOpen ? "Verberg breakdown" : "Toon matchbreakdown"}
        </button>
      )}
      {match && breakdownOpen && <MatchScoreBreakdown match={match} />}

      {/* Zone-actie */}
      {onToevoegen != null && (
        reedsInZone ? (
          <Chip tone="good" className="w-full text-center block mt-2">In zone</Chip>
        ) : (
          <Button
            variant="secondary"
            className="w-full text-body-sm mt-2"
            onClick={(e) => { e.stopPropagation(); onToevoegen(); }}
          >
            Aan zone toevoegen
          </Button>
        )
      )}

      {/* Verwijder uit catalogus */}
      {onVerwijder && (
        <button
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-caption text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)] py-1.5 rounded-md transition-colors duration-[var(--gp-dur-micro)]"
          onClick={(e) => { e.stopPropagation(); onVerwijder(); }}
          aria-label={`Verwijder ${identificatie.wetenschappelijkeNaam} uit catalogus`}
        >
          <Trash2 size={12} aria-hidden />
          Verwijder uit catalogus
        </button>
      )}
    </article>
  );
}
