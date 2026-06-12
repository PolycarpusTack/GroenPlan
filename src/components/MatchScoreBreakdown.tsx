import type { MatchResultaat, Criterium } from "../match/types";

interface Props {
  match: MatchResultaat;
}

const CRITERIUM_LABEL: Record<Criterium, string> = {
  grond:    "Grondsoort",
  zon:      "Zonlicht",
  pH:       "pH",
  water:    "Water & drainage",
  hardheid: "Winterhardheid",
  bloeiGap: "Bloeiperiode",
};

const VOLGORDE: Criterium[] = ["grond", "zon", "pH", "water", "hardheid", "bloeiGap"];

function scoreKleur(score: number, ontbreekt: boolean): string {
  if (ontbreekt) return "bg-[var(--gp-border)]";
  if (score >= 0.85) return "bg-moss-600";
  if (score >= 0.70) return "bg-moss-400";
  if (score >= 0.50) return "bg-amber-400";
  return "bg-[var(--gp-rust-500)]";
}

function scoreTextKleur(score: number, ontbreekt: boolean): string {
  if (ontbreekt) return "text-[var(--gp-text-mute)]";
  if (score >= 0.70) return "text-moss-700";
  if (score >= 0.50) return "text-amber-700";
  return "text-[var(--gp-rust-700)]";
}

export function MatchScoreBreakdown({ match }: Props) {
  return (
    <div className="mt-3 pt-3 border-t border-[var(--gp-border)] space-y-2.5">
      {VOLGORDE.map((criterium) => {
        const r = match.breakdown[criterium];
        if (!r) return null;
        const pct = Math.round(r.rawScore * 100);
        return (
          <div key={criterium}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">
                {CRITERIUM_LABEL[criterium]}
              </span>
              <span className={`text-caption font-medium ${scoreTextKleur(r.rawScore, r.ontbreekt)}`}>
                {r.ontbreekt ? "–" : `${pct}%`}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--gp-border)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${scoreKleur(r.rawScore, r.ontbreekt)}`}
                style={{ width: r.ontbreekt ? "0%" : `${pct}%` }}
                role="meter"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={CRITERIUM_LABEL[criterium]}
              />
            </div>
            <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">
              {r.ontbreekt ? "Onvoldoende data" : r.motivatie}
            </p>
          </div>
        );
      })}
    </div>
  );
}
