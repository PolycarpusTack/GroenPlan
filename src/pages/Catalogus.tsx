import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Library, ArrowLeft, AlertTriangle, X, Plus } from "lucide-react";
import { PlantCard } from "../components/PlantCard";
import { HandmatigPlantFormulier } from "../components/HandmatigPlantFormulier";
import { useTuinStore } from "../store/tuin-store";
import { matchScore } from "../match/score";
import type { MatchResultaat, ZoneInvoer } from "../match/types";
import { Button } from "../components/ui";

function berekenMatch(
  plant: Parameters<typeof matchScore>[0]["plant"],
  zone: ZoneInvoer,
  hardheid: number,
): MatchResultaat {
  return matchScore({ plant, zone, tuinHardheid: hardheid, bestaandeBloeiMaanden: [] });
}

type SorteerOptie = "match" | "naam" | "familie";

export function CatalogusPagina() {
  const navigate = useNavigate();
  const tuin = useTuinStore((s) => s.tuin);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);
  const actieveZoneId = useTuinStore((s) => s.actieveZoneId);
  const voegPlantToeAanZone = useTuinStore((s) => s.voegPlantToeAanZone);
  const voegPlantToeAanCatalogus = useTuinStore((s) => s.voegPlantToeAanCatalogus);
  const verwijderUitCatalogus = useTuinStore((s) => s.verwijderUitCatalogus);
  const verwijderUitCatalogusEnZones = useTuinStore((s) => s.verwijderUitCatalogusEnZones);

  const [zoekterm, setZoekterm] = useState("");
  const [sorteer, setSorteer] = useState<SorteerOptie>("match");
  const [bevestigVerwijder, setBevestigVerwijder] = useState<{ wetNaam: string; aantalZones: number } | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const actieveZone = tuin.zones.find((z) => z.id === actieveZoneId) ?? null;
  const zoneInvoer = useMemo<ZoneInvoer | null>(
    () =>
      actieveZone
        ? {
            zon: actieveZone.zon,
            grondsoort: actieveZone.grondsoort,
            pH: actieveZone.pH,
            drainage: actieveZone.drainage,
            regenval_mm_7d: actieveZone.regenval_mm_7d ?? undefined,
          }
        : null,
    [actieveZone],
  );

  const planten = useMemo(() => {
    const term = zoekterm.toLowerCase().trim();
    return Object.values(plantCatalog)
      .filter((p) => {
        if (!term) return true;
        const wet = p.identificatie.wetenschappelijkeNaam.toLowerCase();
        const nl = (p.identificatie.gewoneNamen.nl ?? "").toLowerCase();
        const en = (p.identificatie.gewoneNamen.en ?? "").toLowerCase();
        return wet.includes(term) || nl.includes(term) || en.includes(term);
      })
      .map((p) => {
        const match = zoneInvoer
          ? berekenMatch(
              {
                wetenschappelijkeNaam: p.identificatie.wetenschappelijkeNaam,
                omstandigheden: {
                  zon: p.omstandigheden.zon.waarde,
                  grondsoorten: p.omstandigheden.grondsoorten.waarde,
                  pH: p.omstandigheden.pH.waarde,
                  drainage: p.omstandigheden.drainage.waarde,
                  waterbehoeften: p.omstandigheden.waterbehoeften.waarde,
                  hardheid: p.omstandigheden.hardheid.waarde,
                },
                bloei: { maanden: p.bloei.maanden.waarde },
              },
              zoneInvoer,
              tuin.hardheid,
            )
          : null;
        return { plant: p, match };
      })
      .sort((a, b) => {
        if (sorteer === "match") {
          return (b.match?.score ?? 0) - (a.match?.score ?? 0);
        }
        if (sorteer === "naam") {
          return a.plant.identificatie.wetenschappelijkeNaam.localeCompare(
            b.plant.identificatie.wetenschappelijkeNaam,
          );
        }
        return a.plant.identificatie.familie.localeCompare(b.plant.identificatie.familie);
      });
  }, [plantCatalog, zoekterm, sorteer, zoneInvoer, tuin.hardheid]);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-1.5 text-[var(--gp-text-mute)]"
          aria-label="Terug"
        >
          <ArrowLeft size={18} aria-hidden />
        </Button>
        <h1 className="font-display text-display-md text-moss-900">Plantencatalogus</h1>
        <Button
          onClick={() => setFormOpen((o) => !o)}
          className="flex items-center gap-1.5 ml-auto shrink-0"
        >
          <Plus size={16} aria-hidden /> Handmatig toevoegen
        </Button>
      </div>
      <p className="text-body text-moss-500 mb-6 ml-10">
        {Object.keys(plantCatalog).length} opgeslagen plant{Object.keys(plantCatalog).length !== 1 ? "en" : ""}
        {actieveZone ? ` · matchscore voor ${actieveZone.naam}` : ""}
      </p>

      {/* Handmatig invoerformulier */}
      {formOpen && (
        <HandmatigPlantFormulier
          bestaandeSleutels={Object.keys(plantCatalog)}
          onOpslaan={(plant) => { voegPlantToeAanCatalogus(plant); setFormOpen(false); }}
          onAnnuleer={() => setFormOpen(false)}
        />
      )}

      {/* Leeg */}
      {Object.keys(plantCatalog).length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--gp-border)] rounded-xl">
          <Library size={36} className="text-[var(--gp-mute)] mx-auto mb-3" aria-hidden />
          <p className="text-body text-[var(--gp-text-mute)] mb-4">
            Nog geen planten opgeslagen. Voeg een plant handmatig toe, of zoek planten op de Ontdek-pagina.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button className="flex items-center gap-1.5" onClick={() => setFormOpen(true)}>
              <Plus size={16} aria-hidden /> Handmatig toevoegen
            </Button>
            <Button variant="secondary" onClick={() => navigate("/ontdek")}>
              Ga naar Ontdek
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Zoek + sorteer */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gp-mute)]" aria-hidden />
              <input
                type="search"
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Filter op naam…"
                className="w-full pl-9 pr-4 py-2 text-body border border-[var(--gp-border)] rounded-md bg-white
                           focus:outline-none focus:shadow-[var(--gp-shadow-focus)] placeholder:text-[var(--gp-mute)]"
              />
            </div>
            <select
              value={sorteer}
              onChange={(e) => setSorteer(e.target.value as SorteerOptie)}
              className="text-body-sm border border-[var(--gp-border)] rounded-md px-3 py-2 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
              aria-label="Sorteren op"
            >
              <option value="match">Sorteer: matchscore</option>
              <option value="naam">Sorteer: wetenschappelijke naam</option>
              <option value="familie">Sorteer: familie</option>
            </select>
          </div>

          {planten.length === 0 ? (
            <p className="text-body text-[var(--gp-text-mute)] py-8 text-center">
              Geen planten gevonden voor "{zoekterm}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planten.map(({ plant, match }) => {
                const wetNaam = plant.identificatie.wetenschappelijkeNaam;
                const reedsInZone = actieveZone?.plantPlaatsingen.some(
                  (p) => p.wetenschappelijkeNaam === wetNaam,
                ) ?? false;
                return (
                  <PlantCard
                    key={wetNaam}
                    plant={plant}
                    score={match?.score ?? 0}
                    match={match ?? undefined}
                    reedsInZone={reedsInZone}
                    onClick={() => navigate(`/plant/${encodeURIComponent(wetNaam)}`)}
                    onToevoegen={
                      actieveZoneId
                        ? () => voegPlantToeAanZone(actieveZoneId, plant)
                        : undefined
                    }
                    onVerwijder={() => {
                      const aantalZones = tuin.zones.filter((z) =>
                        z.plantPlaatsingen.some(
                          (p) => p.wetenschappelijkeNaam.toLowerCase() === wetNaam.toLowerCase(),
                        ),
                      ).length;
                      if (aantalZones > 0) {
                        setBevestigVerwijder({ wetNaam, aantalZones });
                      } else {
                        verwijderUitCatalogus(wetNaam);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
      {/* Bevestigingsdialoog: plant verwijderen die nog in zones zit */}
      {bevestigVerwijder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bevestig-titel"
          onClick={(e) => { if (e.target === e.currentTarget) setBevestigVerwijder(null); }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
              <div>
                <h2 id="bevestig-titel" className="font-display text-heading-lg text-moss-900 mb-1">
                  Plant verwijderen?
                </h2>
                <p className="text-body-sm text-moss-700">
                  <span className="gp-scientific">{bevestigVerwijder.wetNaam}</span> staat nog in{" "}
                  {bevestigVerwijder.aantalZones} zone{bevestigVerwijder.aantalZones !== 1 ? "s" : ""}.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setBevestigVerwijder(null)}
                className="ml-auto p-1 text-[var(--gp-text-mute)]"
                aria-label="Annuleer"
              >
                <X size={16} aria-hidden />
              </Button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  verwijderUitCatalogusEnZones(bevestigVerwijder.wetNaam);
                  setBevestigVerwijder(null);
                }}
                className="gp-btn w-full text-left flex flex-col gap-0.5 border border-[var(--gp-rust-300)] bg-[var(--gp-rust-50)] hover:bg-[var(--gp-rust-100)] text-[var(--gp-rust-700)] px-4 py-2.5 rounded-md"
              >
                <span className="text-body-sm font-medium">Verwijder uit catalogus én zones</span>
                <span className="text-caption text-[var(--gp-rust-500)]">Plaatsingen worden ook verwijderd</span>
              </button>
              <button
                onClick={() => {
                  verwijderUitCatalogus(bevestigVerwijder.wetNaam);
                  setBevestigVerwijder(null);
                }}
                className="gp-btn w-full text-left flex flex-col gap-0.5 border border-[var(--gp-border)] bg-white hover:bg-[var(--gp-surface-alt)] text-moss-900 px-4 py-2.5 rounded-md"
              >
                <span className="text-body-sm font-medium">Verwijder alleen uit catalogus</span>
                <span className="text-caption text-[var(--gp-text-mute)]">Plaatsingen in zones blijven behouden</span>
              </button>
              <Button
                variant="ghost"
                onClick={() => setBevestigVerwijder(null)}
                className="w-full text-body-sm text-[var(--gp-text-mute)]"
              >
                Annuleer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
