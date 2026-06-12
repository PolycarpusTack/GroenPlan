import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Search } from "lucide-react";
import { useTuinStore } from "../store/tuin-store";
import { Button } from "../components/ui";

const MAANDEN = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
const MAAND_LANG = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
const HUIDIG_MAAND = new Date().getMonth() + 1; // 1–12

interface BloemRij {
  wetNaam: string;
  gewoneNaam: string | null;
  bloeiMaanden: Set<number>;
  zoneNamen: string[];
  bloeiKleur: string | null;
}

function spreidingScore(bloeiendPerMaand: number[]): number {
  const metBloei = bloeiendPerMaand.filter((t) => t > 0).length;
  return Math.round((metBloei / 12) * 100);
}

function maandHeaderKlasse(maand: number): string {
  if (maand === HUIDIG_MAAND)
    return "bg-moss-100 text-moss-800 font-semibold ring-1 ring-inset ring-moss-400";
  if ([3, 4, 5].includes(maand)) return "bg-amber-50 text-amber-700";
  if ([6, 7, 8].includes(maand)) return "bg-moss-50 text-moss-700";
  if ([9, 10, 11].includes(maand)) return "bg-amber-50 text-amber-800";
  return "text-slate-500";
}

function bloeiKleurNaarHex(kleur: string): string {
  const k = kleur.toLowerCase();
  if (["purple","violet","lavender","mauve","lila","paars"].some((c) => k.includes(c))) return "#7c3aed";
  if (["yellow","gold","amber","geel","goud"].some((c) => k.includes(c))) return "#f59e0b";
  if (["orange","oranje"].some((c) => k.includes(c))) return "#f97316";
  if (["pink","roze"].some((c) => k.includes(c))) return "#ec4899";
  if (["red","crimson","rood","scarlet"].some((c) => k.includes(c))) return "#dc2626";
  if (["blue","indigo","blauw"].some((c) => k.includes(c))) return "#3b82f6";
  if (["white","cream","ivory","wit"].some((c) => k.includes(c))) return "#d1d5db";
  return "#4a7c59";
}

function celKlasse(maand: number): string {
  return maand === HUIDIG_MAAND ? "bg-moss-50" : "";
}

export function BloemKalenderPagina() {
  const navigate = useNavigate();
  const tuin = useTuinStore((s) => s.tuin);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);
  const [geselecteerdeZoneId, setGeselecteerdeZoneId] = useState("");

  const rijen = useMemo<BloemRij[]>(() => {
    const map = new Map<string, BloemRij>();
    const bronZones = geselecteerdeZoneId
      ? tuin.zones.filter((z) => z.id === geselecteerdeZoneId)
      : tuin.zones;

    for (const zone of bronZones) {
      for (const plaatsing of zone.plantPlaatsingen) {
        const sleutel = plaatsing.wetenschappelijkeNaam.toLowerCase();
        const plant = plantCatalog[sleutel];
        if (!plant) continue;
        if (!map.has(sleutel)) {
          map.set(sleutel, {
            wetNaam: plant.identificatie.wetenschappelijkeNaam,
            gewoneNaam: plant.identificatie.gewoneNamen.nl ?? null,
            bloeiMaanden: new Set(plant.bloei.maanden.waarde),
            zoneNamen: [],
            bloeiKleur: plant.bloei.kleuren.waarde[0] ?? null,
          });
        }
        const rij = map.get(sleutel)!;
        if (!rij.zoneNamen.includes(zone.naam)) rij.zoneNamen.push(zone.naam);
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      (a.gewoneNaam ?? a.wetNaam).localeCompare(b.gewoneNaam ?? b.wetNaam, "nl"),
    );
  }, [tuin.zones, plantCatalog, geselecteerdeZoneId]);

  const bloeiendPerMaand = useMemo(() => {
    const telling = new Array(12).fill(0) as number[];
    for (const rij of rijen) {
      for (const m of rij.bloeiMaanden) telling[m - 1]++;
    }
    return telling;
  }, [rijen]);

  const stats = useMemo(() => {
    const metBloei = bloeiendPerMaand.filter((t) => t > 0).length;
    const gatMaanden = bloeiendPerMaand
      .map((t, i) => ({ t, m: i + 1 }))
      .filter(({ t }) => t === 0)
      .map(({ m }) => MAANDEN[m - 1]);
    const max = Math.max(...bloeiendPerMaand);
    const piekIdx = bloeiendPerMaand.indexOf(max);
    return {
      metBloei,
      gatMaanden,
      piekMaand: max > 0 ? MAAND_LANG[piekIdx] : null,
      score: spreidingScore(bloeiendPerMaand),
      max,
    };
  }, [bloeiendPerMaand]);

  const heeftPlanten = tuin.zones.some((z) => z.plantPlaatsingen.length > 0);

  if (!heeftPlanten) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
        <CalendarDays size={40} className="text-[var(--gp-mute)] mb-4" aria-hidden />
        <h2 className="font-display text-heading-lg text-moss-900 mb-2">Geen planten gevonden</h2>
        <p className="text-body text-moss-500 mb-6 max-w-sm">
          Voeg planten toe aan een zone om de bloeikalender te zien.
        </p>
        <Button onClick={() => navigate("/ontdek")}>
          Ontdek planten
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-display text-display-md text-moss-900 mb-1">Bloeikalender</h1>
      <p className="text-body text-moss-500 mb-6">
        Overzicht van alle bloeiperiodes — plan voor continue bloei het hele jaar.
      </p>

      {/* 4 Stat-kaarten */}
      {rijen.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="gp-card-bordered text-center">
            <p className="font-display text-display-md text-moss-700">{stats.metBloei}<span className="text-heading-sm text-[var(--gp-text-mute)]">/12</span></p>
            <p className="text-caption text-[var(--gp-text-mute)]">Maanden met bloei</p>
          </div>
          <div className="gp-card-bordered text-center">
            {stats.gatMaanden.length === 0 ? (
              <>
                <p className="font-display text-display-md text-moss-700">✓</p>
                <p className="text-caption text-moss-600">Geen gat-maanden</p>
              </>
            ) : (
              <>
                <p className="font-display text-display-md text-[var(--gp-rust-700)]">{stats.gatMaanden.length}</p>
                <p className="text-caption text-[var(--gp-text-mute)]">
                  Gat{stats.gatMaanden.length !== 1 ? "-maanden" : ""}: {stats.gatMaanden.join(", ")}
                </p>
              </>
            )}
          </div>
          <div className="gp-card-bordered text-center">
            <p className="font-display text-display-md text-bloom-700">{stats.piekMaand ?? "—"}</p>
            <p className="text-caption text-[var(--gp-text-mute)]">Piekmaand</p>
          </div>
          <div className="gp-card-bordered text-center">
            <p className="font-display text-display-md text-moss-700">{stats.score}</p>
            <p className="text-caption text-[var(--gp-text-mute)]">Spreidingsscore</p>
          </div>
        </div>
      )}

      {/* Zone filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setGeselecteerdeZoneId("")}
          className={`text-caption px-3 py-1 rounded-full border transition-colors ${
            !geselecteerdeZoneId
              ? "bg-moss-700 text-white border-moss-700"
              : "border-[var(--gp-border)] text-[var(--gp-text-mute)] hover:border-moss-400"
          }`}
        >
          Alle zones
        </button>
        {tuin.zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setGeselecteerdeZoneId(z.id === geselecteerdeZoneId ? "" : z.id)}
            className={`text-caption px-3 py-1 rounded-full border transition-colors ${
              geselecteerdeZoneId === z.id
                ? "bg-moss-700 text-white border-moss-700"
                : "border-[var(--gp-border)] text-[var(--gp-text-mute)] hover:border-moss-400"
            }`}
          >
            {z.naam}
          </button>
        ))}
      </div>

      {rijen.length === 0 ? (
        <p className="text-body text-[var(--gp-text-mute)] py-8 text-center">
          Geen planten in deze zone.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--gp-border)]">
          <table className="w-full text-body-sm border-collapse">
            <thead>
              <tr className="bg-[var(--gp-surface-alt)]">
                <th className="sticky left-0 z-10 bg-[var(--gp-surface-alt)] text-left px-4 py-3 font-medium text-moss-700 min-w-[200px] border-b border-[var(--gp-border)]">
                  Plant
                </th>
                {MAANDEN.map((m, i) => (
                  <th
                    key={m}
                    className={`text-center py-3 px-0 w-9 font-medium border-b border-[var(--gp-border)] uppercase text-caption tracking-wide
                      ${maandHeaderKlasse(i + 1)}`}
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rijen.map((rij, rowIdx) => (
                <tr
                  key={rij.wetNaam}
                  className={rowIdx % 2 === 0 ? "bg-white" : "bg-[var(--gp-surface-alt)]"}
                >
                  <td className={`sticky left-0 z-10 px-4 py-2 border-b border-[var(--gp-border)] ${rowIdx % 2 === 0 ? "bg-white" : "bg-[var(--gp-surface-alt)]"}`}>
                    <button
                      onClick={() => navigate(`/plant/${encodeURIComponent(rij.wetNaam)}`)}
                      className="text-left group flex items-start gap-2"
                    >
                      <span
                        className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rij.bloeiKleur ? bloeiKleurNaarHex(rij.bloeiKleur) : "#4a7c59" }}
                        aria-hidden
                      />
                      <span>
                        <span className="gp-scientific text-moss-900 group-hover:text-moss-700 group-hover:underline">
                          {rij.wetNaam}
                        </span>
                        {rij.gewoneNaam && (
                          <span className="block text-caption text-[var(--gp-text-mute)]">{rij.gewoneNaam}</span>
                        )}
                        {rij.zoneNamen.length > 0 && (
                          <span className="block mt-0.5 flex flex-wrap gap-1">
                            {rij.zoneNamen.map((z) => (
                              <span key={z} className="text-caption px-1 py-px rounded bg-moss-100 text-moss-700 font-medium leading-none">
                                {z.slice(0, 3).toUpperCase()}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const bloeit = rij.bloeiMaanden.has(m);
                    const barKleur = rij.bloeiKleur ? bloeiKleurNaarHex(rij.bloeiKleur) : "#4a7c59";
                    return (
                      <td
                        key={m}
                        className={`py-2 px-0.5 border-b border-[var(--gp-border)] ${celKlasse(m)}`}
                      >
                        {bloeit && (
                          <div
                            className="w-full h-4 rounded-sm opacity-75"
                            style={{ backgroundColor: barKleur }}
                            role="img"
                            aria-label={`bloei in ${MAANDEN[m - 1]}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer: In bloei teller */}
          <div className="flex bg-[var(--gp-surface-alt)] border-t border-[var(--gp-border)]">
            <div className="sticky left-0 z-10 bg-[var(--gp-surface-alt)] px-4 py-2 min-w-[200px] text-caption text-[var(--gp-text-mute)] font-medium flex items-center">
              In bloei
            </div>
            {bloeiendPerMaand.map((telling, i) => (
              <div
                key={i}
                className={`w-9 py-2 text-center text-caption font-semibold
                  ${i + 1 === HUIDIG_MAAND ? "bg-moss-100" : ""}
                  ${telling === 0 ? "text-[var(--gp-rust-500)]" : telling === stats.max ? "text-bloom-700" : "text-moss-600"}`}
              >
                {telling > 0 ? telling : "—"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gat-maand suggestie */}
      {stats.gatMaanden.length > 0 && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Search size={15} className="text-amber-600 shrink-0" aria-hidden />
          <p className="text-body-sm text-amber-800 flex-1">
            <span className="font-medium">Gat-maanden: {stats.gatMaanden.join(", ")}.</span>{" "}
            Zoek planten die in die perioden bloeien.
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate("/ontdek")}
            className="text-body-sm text-amber-700 border border-amber-300 hover:bg-amber-100 shrink-0 py-1 px-3"
          >
            Vul gaten op →
          </Button>
        </div>
      )}

      {/* Legende */}
      {rijen.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-caption text-[var(--gp-text-mute)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5" aria-hidden>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7c3aed" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#4a7c59" }} />
            </span>
            Kleur per plant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-3 bg-moss-100 rounded ring-1 ring-moss-400" aria-hidden />
            Huidige maand
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-3 bg-amber-50 rounded" aria-hidden />
            Lente / herfst
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-3 bg-moss-50 rounded" aria-hidden />
            Zomer
          </span>
        </div>
      )}
    </div>
  );
}
