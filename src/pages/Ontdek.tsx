import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Search, Loader2, MapPin, Camera, SlidersHorizontal, X, Sun, CloudSun, Cloud } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlantCard } from "../components/PlantCard";
import { FotoIdentificatiePanel } from "../components/FotoIdentificatiePanel";
import { matchScore } from "../match/score";
import { getAutoFillService } from "../services/autofill/autofill-service";
import { maakOnderhoudsTaken } from "../services/taken/maakOnderhoudsTaken";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import { useZoekGeschiedenisStore } from "../store/zoek-store";
import { Button } from "../components/ui";
import { BorderRecepten } from "../components/BorderRecepten";
import { onderhoudsNiveau, ONDERHOUD_LABEL, type OnderhoudsNiveau } from "../domain/plant/onderhoudsNiveau";
import type { AutoFillResultaat } from "../domain/plant/types";
import type { MatchResultaat } from "../match/types";
import type { ZoneInvoer } from "../match/types";

interface ZoekResultaat {
  plant: AutoFillResultaat;
  match: MatchResultaat;
}

// ── Labels ────────────────────────────────────────────────────────

const ZONE_LABEL: Record<string, string> = {
  full: "volle zon", partial: "halfschaduw", shade: "schaduw",
};
const GROND_LABEL: Record<string, string> = {
  clay: "klei", sand: "zand", loam: "leem", chalk: "kalk", peat: "veen",
};

// ── Filter definities ─────────────────────────────────────────────

const ZON_OPTIES = [
  { waarde: "full", label: "Volle zon", Icoon: Sun },
  { waarde: "partial", label: "Halfschaduw", Icoon: CloudSun },
  { waarde: "shade", label: "Schaduw", Icoon: Cloud },
] as const;

const KLEUR_FILTER = [
  { sleutel: "wit",    label: "Wit",    hex: "#f5f5f5", ring: true },
  { sleutel: "geel",   label: "Geel",   hex: "#fde047", ring: false },
  { sleutel: "oranje", label: "Oranje", hex: "#fb923c", ring: false },
  { sleutel: "rood",   label: "Rood",   hex: "#f87171", ring: false },
  { sleutel: "roze",   label: "Roze",   hex: "#f472b6", ring: false },
  { sleutel: "paars",  label: "Paars",  hex: "#a78bfa", ring: false },
  { sleutel: "blauw",  label: "Blauw",  hex: "#60a5fa", ring: false },
] as const;

const KLEUR_TREFWOORDEN: Record<string, string[]> = {
  wit:    ["white", "wit", "cream", "ivory", "creme", "blanc"],
  geel:   ["yellow", "geel", "gold", "golden", "jaune"],
  oranje: ["orange", "oranje"],
  rood:   ["red", "rood", "crimson", "scarlet", "rouge"],
  roze:   ["pink", "roze", "rose", "salmon", "coral", "magenta"],
  paars:  ["purple", "paars", "violet", "lavender", "mauve", "lilac", "indigo"],
  blauw:  ["blue", "blauw", "azure", "navy", "cobalt"],
};

const BESTUIVER_OPTIES = [
  { waarde: "bees",        label: "Bijen",       emoji: "🐝" },
  { waarde: "butterflies", label: "Vlinders",    emoji: "🦋" },
  { waarde: "hoverflies",  label: "Zweefvliegen",emoji: "🪲" },
  { waarde: "moths",       label: "Nachtvlinders",emoji: "🌙" },
  { waarde: "birds",       label: "Vogels",      emoji: "🐦" },
] as const;

interface Filters {
  zon: Set<string>;
  minHoogte: number;
  maxHoogte: number;
  kleuren: Set<string>;
  bestuivers: Set<string>;
  /** 0 = uit; 1–3 = maximaal onderhoudsniveau (laag/medium/hoog). */
  maxOnderhoud: number;
  inheems: boolean;
  eetbaar: boolean;
  nietGiftig: boolean;
}

const LEGE_FILTERS: Filters = {
  zon: new Set(),
  minHoogte: 0,
  maxHoogte: 0,
  kleuren: new Set(),
  bestuivers: new Set(),
  maxOnderhoud: 0,
  inheems: false,
  eetbaar: false,
  nietGiftig: false,
};

function aantalActieveFilters(f: Filters): number {
  return (
    f.zon.size +
    f.kleuren.size +
    f.bestuivers.size +
    (f.minHoogte > 0 || f.maxHoogte > 0 ? 1 : 0) +
    (f.maxOnderhoud > 0 ? 1 : 0) +
    (f.inheems ? 1 : 0) +
    (f.eetbaar ? 1 : 0) +
    (f.nietGiftig ? 1 : 0)
  );
}

// ── Filter logica ─────────────────────────────────────────────────

function kleurMatch(plantKleuren: string[], filterSleutel: string): boolean {
  const trefwoorden = KLEUR_TREFWOORDEN[filterSleutel] ?? [];
  return plantKleuren.some((pk) =>
    trefwoorden.some((t) => pk.toLowerCase().includes(t) || t.includes(pk.toLowerCase())),
  );
}

function pasFiltersTo(r: ZoekResultaat, f: Filters): boolean {
  const plant = r.plant;

  if (f.zon.size > 0) {
    const pz = plant.omstandigheden.zon.waarde;
    if (!f.zon.has(pz)) return false;
  }

  if (f.minHoogte > 0 || f.maxHoogte > 0) {
    const h = plant.groei.volwassenHoogte_cm.waarde;
    if (!h) return false;
    if (f.minHoogte > 0 && h.max < f.minHoogte) return false;
    if (f.maxHoogte > 0 && h.min > f.maxHoogte) return false;
  }

  if (f.kleuren.size > 0) {
    const pKleuren = plant.bloei.kleuren.waarde;
    const heeftKleur = [...f.kleuren].some((k) => kleurMatch(pKleuren, k));
    if (!heeftKleur) return false;
  }

  if (f.bestuivers.size > 0) {
    const pBest = plant.ecologie.bestuivers.waarde as readonly string[];
    const heeftBest = [...f.bestuivers].some((b) => pBest.includes(b));
    if (!heeftBest) return false;
  }

  if (f.maxOnderhoud > 0 && onderhoudsNiveau(plant) > f.maxOnderhoud) return false;

  if (f.inheems && plant.ecologie.inheems_belgie.waarde !== true) return false;
  if (f.eetbaar && plant.veiligheid.eetbare_delen.waarde.length === 0) return false;
  if (f.nietGiftig && plant.veiligheid.giftig_huisdieren.waarde !== false) return false;

  return true;
}

// ── Helper: gap-maanden in actieve zone ───────────────────────────

function berekenGatMaanden(
  plaatsingen: { wetenschappelijkeNaam: string }[],
  catalog: Record<string, AutoFillResultaat>,
): number[] {
  const gedekt = new Set<number>();
  for (const p of plaatsingen) {
    const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
    if (plant) plant.bloei.maanden.waarde.forEach((m) => gedekt.add(m));
  }
  return Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !gedekt.has(m));
}

// ── Matchscore berekening ─────────────────────────────────────────

function berekenMatch(
  plant: AutoFillResultaat,
  zone: ZoneInvoer,
  hardheid: number,
  bestaandeBloeiMaanden: number[] = [],
): MatchResultaat {
  return matchScore({
    plant: {
      wetenschappelijkeNaam: plant.identificatie.wetenschappelijkeNaam,
      omstandigheden: {
        zon: plant.omstandigheden.zon.waarde,
        grondsoorten: plant.omstandigheden.grondsoorten.waarde,
        pH: plant.omstandigheden.pH.waarde,
        drainage: plant.omstandigheden.drainage.waarde,
        waterbehoeften: plant.omstandigheden.waterbehoeften.waarde,
        hardheid: plant.omstandigheden.hardheid.waarde,
      },
      bloei: { maanden: plant.bloei.maanden.waarde },
    },
    zone,
    tuinHardheid: hardheid,
    bestaandeBloeiMaanden,
  });
}

// ── Filter Sidebar ────────────────────────────────────────────────

interface FilterSidebarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  aantalActief: number;
}

function toggleSet<T>(s: Set<T>, v: T): Set<T> {
  const n = new Set(s);
  if (n.has(v)) n.delete(v); else n.add(v);
  return n;
}

function FilterSectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--gp-border)] pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <p className="text-caption font-semibold text-moss-800 uppercase tracking-wide mb-3">{titel}</p>
      {children}
    </div>
  );
}

function FilterSidebar({ filters, onChange, onReset, aantalActief }: FilterSidebarProps) {
  return (
    <aside className="bg-white border border-[var(--gp-border)] rounded-xl p-4 space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-body-sm font-semibold text-moss-900">Filters</h2>
        {aantalActief > 0 && (
          <button
            onClick={onReset}
            className="text-caption text-moss-600 hover:underline flex items-center gap-1"
          >
            <X size={11} aria-hidden /> Wis alles
          </button>
        )}
      </div>

      {/* Zonlicht */}
      <FilterSectie titel="Zonlicht">
        <div className="space-y-2">
          {ZON_OPTIES.map(({ waarde, label, Icoon }) => (
            <label key={waarde} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.zon.has(waarde)}
                onChange={() => onChange({ ...filters, zon: toggleSet(filters.zon, waarde) })}
                className="accent-moss-700 w-4 h-4 rounded"
              />
              <Icoon size={14} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900 group-hover:text-moss-700">{label}</span>
            </label>
          ))}
        </div>
      </FilterSectie>

      {/* Hoogte */}
      <FilterSectie titel="Hoogte (cm)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0"
            value={filters.minHoogte || ""}
            onChange={(e) => onChange({ ...filters, minHoogte: parseInt(e.target.value) || 0 })}
            min={0} max={500}
            className="w-20 text-body-sm border border-[var(--gp-border)] rounded px-2 py-1
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)] text-center"
            aria-label="Minimale hoogte in cm"
          />
          <span className="text-caption text-[var(--gp-text-mute)]">tot</span>
          <input
            type="number"
            placeholder="∞"
            value={filters.maxHoogte || ""}
            onChange={(e) => onChange({ ...filters, maxHoogte: parseInt(e.target.value) || 0 })}
            min={0} max={2000}
            className="w-20 text-body-sm border border-[var(--gp-border)] rounded px-2 py-1
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)] text-center"
            aria-label="Maximale hoogte in cm"
          />
          <span className="text-caption text-[var(--gp-text-mute)]">cm</span>
        </div>
      </FilterSectie>

      {/* Onderhoud */}
      <FilterSectie titel="Onderhoud">
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={filters.maxOnderhoud}
          onChange={(e) => onChange({ ...filters, maxOnderhoud: parseInt(e.target.value) })}
          className="w-full accent-moss-700"
          aria-label="Maximaal onderhoudsniveau"
          aria-valuetext={filters.maxOnderhoud === 0 ? "Alle niveaus" : `Maximaal ${ONDERHOUD_LABEL[filters.maxOnderhoud as OnderhoudsNiveau]}`}
        />
        <div className="flex justify-between text-caption text-[var(--gp-text-mute)] mt-1">
          <span>Alle</span><span>Laag</span><span>Medium</span><span>Hoog</span>
        </div>
        {filters.maxOnderhoud > 0 && (
          <p className="text-caption text-moss-600 mt-1.5">
            Max. {ONDERHOUD_LABEL[filters.maxOnderhoud as OnderhoudsNiveau].toLowerCase()} onderhoud
          </p>
        )}
      </FilterSectie>

      {/* Bloemkleur */}
      <FilterSectie titel="Bloemkleur">
        <div className="flex flex-wrap gap-2">
          {KLEUR_FILTER.map(({ sleutel, label, hex, ring }) => {
            const actief = filters.kleuren.has(sleutel);
            return (
              <button
                key={sleutel}
                onClick={() => onChange({ ...filters, kleuren: toggleSet(filters.kleuren, sleutel) })}
                title={label}
                aria-label={`Filter op ${label}`}
                aria-pressed={actief}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                  actief ? "ring-2 ring-offset-1 ring-moss-600 scale-110" : ""
                } ${ring ? "border border-[var(--gp-border)]" : ""}`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
        {filters.kleuren.size > 0 && (
          <p className="text-caption text-moss-600 mt-2">
            {[...filters.kleuren].map((k) => KLEUR_FILTER.find((f) => f.sleutel === k)?.label).filter(Boolean).join(", ")}
          </p>
        )}
      </FilterSectie>

      {/* Bestuivers */}
      <FilterSectie titel="Bestuivers">
        <div className="space-y-2">
          {BESTUIVER_OPTIES.map(({ waarde, label, emoji }) => (
            <label key={waarde} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.bestuivers.has(waarde)}
                onChange={() => onChange({ ...filters, bestuivers: toggleSet(filters.bestuivers, waarde) })}
                className="accent-moss-700 w-4 h-4 rounded"
              />
              <span className="shrink-0" aria-hidden>{emoji}</span>
              <span className="text-body-sm text-moss-900 group-hover:text-moss-700">{label}</span>
            </label>
          ))}
        </div>
      </FilterSectie>

      {/* Speciale eigenschappen */}
      <FilterSectie titel="Eigenschappen">
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inheems}
              onChange={(e) => onChange({ ...filters, inheems: e.target.checked })}
              className="accent-moss-700 w-4 h-4 rounded"
            />
            <span className="shrink-0" aria-hidden>🇧🇪</span>
            <span className="text-body-sm text-moss-900 group-hover:text-moss-700">Inheems (België)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.eetbaar}
              onChange={(e) => onChange({ ...filters, eetbaar: e.target.checked })}
              className="accent-moss-700 w-4 h-4 rounded"
            />
            <span className="shrink-0" aria-hidden>🍓</span>
            <span className="text-body-sm text-moss-900 group-hover:text-moss-700">Eetbaar</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.nietGiftig}
              onChange={(e) => onChange({ ...filters, nietGiftig: e.target.checked })}
              className="accent-moss-700 w-4 h-4 rounded"
            />
            <span className="shrink-0" aria-hidden>🐾</span>
            <span className="text-body-sm text-moss-900 group-hover:text-moss-700">Niet giftig voor huisdieren</span>
          </label>
        </div>
      </FilterSectie>
    </aside>
  );
}

// ── Resultaten sectie ─────────────────────────────────────────────

interface ResultatenSectieProps {
  titel: string;
  beschrijving?: string;
  resultaten: ZoekResultaat[];
  actieveZone: ReturnType<typeof useTuinStore.getState>["tuin"]["zones"][0] | null;
  actieveZoneId: string | null;
  actieveBorderId: string | null;
  onPlantClick: (wetNaam: string) => void;
  onToevoegen: (r: ZoekResultaat) => void;
}

function ResultatenSectie({
  titel, beschrijving, resultaten, actieveZone, actieveZoneId, onPlantClick, onToevoegen,
}: ResultatenSectieProps) {
  if (resultaten.length === 0) return null;
  return (
    <section aria-label={titel} className="mb-8">
      <div className="mb-3">
        <h2 className="font-display text-heading-md text-moss-900">{titel}</h2>
        {beschrijving && <p className="text-body-sm text-[var(--gp-text-mute)]">{beschrijving}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {resultaten.map((r) => {
          const wetNaam = r.plant.identificatie.wetenschappelijkeNaam;
          const reedsInZone = actieveZone?.plantPlaatsingen.some((p) => p.wetenschappelijkeNaam === wetNaam) ?? false;
          return (
            <PlantCard
              key={wetNaam}
              plant={r.plant}
              score={r.match.score}
              match={r.match}
              reedsInZone={reedsInZone}
              onClick={() => onPlantClick(wetNaam)}
              onToevoegen={actieveZoneId ? () => onToevoegen(r) : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────

export function OntdekPagina() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tuin = useTuinStore((s) => s.tuin);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);
  const naarPlantDetail = (wetNaam: string) => navigate(`/plant/${encodeURIComponent(wetNaam)}`);
  const actieveZoneId = useTuinStore((s) => s.actieveZoneId);
  const setActieveZone = useTuinStore((s) => s.setActieveZone);
  const voegPlantToeAanZone = useTuinStore((s) => s.voegPlantToeAanZone);
  const actieveBorderId = useTuinStore((s) => s.actieveBorderId);
  const voegTaakToe = useTakenStore((s) => s.voegTaakToe);

  const actieveZone = tuin.zones.find((z) => z.id === actieveZoneId) ?? null;
  const zoneAlsInvoer = useMemo<ZoneInvoer | null>(
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

  const zoneAlsInvoerRef = useRef(zoneAlsInvoer);
  zoneAlsInvoerRef.current = zoneAlsInvoer;
  const tuinHardheidRef = useRef(tuin.hardheid);
  tuinHardheidRef.current = tuin.hardheid;

  // Search state
  const [invoer, setInvoer] = useState(() => searchParams.get("zoek") ?? "");
  const [fotoOpen, setFotoOpen] = useState(false);
  const [invoerFocus, setInvoerFocus] = useState(false);
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([]);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Filters>(LEGE_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const aantalActief = aantalActieveFilters(filters);

  // Search history — via persistente store (zie zoek-store)
  const geschiedenis = useZoekGeschiedenisStore((s) => s.geschiedenis);
  const slaGeschiedenisOp = useZoekGeschiedenisStore((s) => s.voegToe);

  const zoekInCatalogus = (invoer: string): string | null => {
    const q = invoer.toLowerCase().trim();
    const catalog = useTuinStore.getState().plantCatalog;
    for (const plant of Object.values(catalog)) {
      const namen = plant.identificatie.gewoneNamen;
      if (namen.nl?.toLowerCase() === q || namen.en?.toLowerCase() === q || namen.fr?.toLowerCase() === q)
        return plant.identificatie.wetenschappelijkeNaam;
    }
    return null;
  };

  const voegResultaatToe = useCallback((plant: AutoFillResultaat, zone: ZoneInvoer) => {
    const match = berekenMatch(plant, zone, tuinHardheidRef.current);
    slaGeschiedenisOp(plant.identificatie.wetenschappelijkeNaam);
    setResultaten((prev) => {
      const bestaat = prev.some(
        (r) => r.plant.identificatie.wetenschappelijkeNaam === plant.identificatie.wetenschappelijkeNaam,
      );
      if (bestaat) return prev;
      return [{ plant, match }, ...prev].sort((a, b) => b.match.score - a.match.score);
    });
  }, [slaGeschiedenisOp]);

  const zoek = useCallback(async () => {
    const ruwInvoer = invoer.trim();
    if (!ruwInvoer || !zoneAlsInvoerRef.current) return;
    const naam = zoekInCatalogus(ruwInvoer) ?? ruwInvoer;
    setLaden(true); setFout(null);
    try {
      const plant = await getAutoFillService().vulAan(naam);
      voegResultaatToe(plant, zoneAlsInvoerRef.current);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Onbekende fout bij ophalen plantdata.");
    } finally {
      setLaden(false);
    }
  }, [invoer, voegResultaatToe]);

  // Zoek een soort op naam (gebruikt door foto-identificatie en borderrecepten).
  const zoekSoort = useCallback((wetNaam: string) => {
    setInvoer(wetNaam);
    setTimeout(() => {
      const naam = wetNaam.trim();
      if (!naam || !zoneAlsInvoerRef.current) return;
      setLaden(true); setFout(null);
      getAutoFillService().vulAan(naam)
        .then((plant) => voegResultaatToe(plant, zoneAlsInvoerRef.current!))
        .catch((e) => setFout(e instanceof Error ? e.message : "Onbekende fout."))
        .finally(() => setLaden(false));
    }, 0);
  }, [voegResultaatToe]);

  const handleFotoSelecteer = useCallback((wetNaam: string) => {
    setFotoOpen(false);
    zoekSoort(wetNaam);
  }, [zoekSoort]);

  // Auto-zoek wanneer ?zoek= URL-param aanwezig is (navigatie van begeleiderschip of Combinaties-tab)
  useEffect(() => {
    const param = searchParams.get("zoek");
    if (!param) return;
    const timer = setTimeout(() => {
      if (!zoneAlsInvoerRef.current) return;
      const naam = zoekInCatalogus(param) ?? param;
      setLaden(true);
      setFout(null);
      getAutoFillService()
        .vulAan(naam)
        .then((plant) => voegResultaatToe(plant, zoneAlsInvoerRef.current!))
        .catch((e) => setFout(e instanceof Error ? e.message : "Onbekende fout."))
        .finally(() => setLaden(false));
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gap-maanden in actieve zone (maanden zonder bloei) + reeds-gedekte maanden
  const gatMaanden = useMemo(
    () => actieveZone ? berekenGatMaanden(actieveZone.plantPlaatsingen, plantCatalog) : [],
    [actieveZone, plantCatalog],
  );
  const gedekteMaanden = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !gatMaanden.includes(m)),
    [gatMaanden],
  );

  // Zone-eerst aanbevelingen: scoor de eigen plantencatalogus tegen de actieve zone,
  // zodat de gebruiker meteen "wat past hier?" ziet — ook zónder te zoeken. De
  // matchscore houdt rekening met de reeds aanwezige bloei (bloeiGap).
  const catalogusAanbevelingen = useMemo<ZoekResultaat[]>(() => {
    if (!actieveZone || !zoneAlsInvoer) return [];
    const alGeplaatst = new Set(
      actieveZone.plantPlaatsingen.map((p) => p.wetenschappelijkeNaam.toLowerCase()),
    );
    return Object.values(plantCatalog)
      .filter((plant) => !alGeplaatst.has(plant.identificatie.wetenschappelijkeNaam.toLowerCase()))
      .map((plant) => ({ plant, match: berekenMatch(plant, zoneAlsInvoer, tuin.hardheid, gedekteMaanden) }))
      .filter((r) => r.match.score >= 0.5)
      .sort((a, b) => b.match.score - a.match.score);
  }, [actieveZone, zoneAlsInvoer, plantCatalog, gedekteMaanden, tuin.hardheid]);

  // Bron voor de weergave: actieve zoekresultaten, of anders de zone-eerst aanbevelingen.
  const bronResultaten = resultaten.length > 0 ? resultaten : catalogusAanbevelingen;

  // Gefilterde resultaten
  const gefilterd = useMemo(
    () => bronResultaten.filter((r) => pasFiltersTo(r, filters)),
    [bronResultaten, filters],
  );

  // Gecureerde secties
  const { aanbevolen, gatVullers, overig } = useMemo(() => {
    if (!actieveZoneId || gefilterd.length === 0) {
      return { aanbevolen: [], gatVullers: [], overig: gefilterd };
    }
    const aanbevolen = gefilterd.filter((r) => r.match.score >= 0.72);
    const aanbevolenSet = new Set(aanbevolen.map((r) => r.plant.identificatie.wetenschappelijkeNaam));
    const gatVullers = gefilterd.filter((r) => {
      if (aanbevolenSet.has(r.plant.identificatie.wetenschappelijkeNaam)) return false;
      return gatMaanden.length > 0 &&
        r.plant.bloei.maanden.waarde.some((m) => gatMaanden.includes(m));
    });
    const gatSet = new Set(gatVullers.map((r) => r.plant.identificatie.wetenschappelijkeNaam));
    const overig = gefilterd.filter(
      (r) => !aanbevolenSet.has(r.plant.identificatie.wetenschappelijkeNaam) &&
             !gatSet.has(r.plant.identificatie.wetenschappelijkeNaam),
    );
    return { aanbevolen, gatVullers, overig };
  }, [gefilterd, actieveZoneId, gatMaanden]);

  const handleToevoegen = (r: ZoekResultaat) => {
    if (!actieveZoneId) return;
    voegPlantToeAanZone(actieveZoneId, r.plant, actieveBorderId);
    maakOnderhoudsTaken(r.plant, actieveZoneId).forEach(voegTaakToe);
  };

  const gemeenschappelijkeProps = {
    actieveZone,
    actieveZoneId,
    actieveBorderId,
    onPlantClick: naarPlantDetail,
    onToevoegen: handleToevoegen,
  };

  if (tuin.zones.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
        <MapPin size={40} className="text-[var(--gp-mute)] mb-4" aria-hidden />
        <h2 className="font-display text-heading-lg text-moss-900 mb-2">Eerst een zone aanmaken</h2>
        <p className="text-body text-moss-500 mb-6 max-w-sm">
          Maak een zone aan met jouw grondsoort, zon en pH — dan berekent GroenPlan de matchscore per plant.
        </p>
        <Button onClick={() => navigate("/tuinkaart")}>
          Ga naar Tuinkaart
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <h1 className="font-display text-display-md text-moss-900 mb-1">Ontdek planten</h1>
      <p className="text-body text-moss-500 mb-5">
        Zoek op wetenschappelijke of gewone naam — GroenPlan berekent de match voor jouw zone.
      </p>

      {/* Zone selector */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-[var(--gp-surface-alt)] rounded-md border border-[var(--gp-border)]">
        <MapPin size={15} className="text-moss-600 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-0.5">Matching met zone</p>
          {actieveZone ? (
            <p className="text-body-sm text-moss-900 font-medium">
              {actieveZone.naam} ·{" "}
              <span className="font-normal text-[var(--gp-text-mute)]">
                {GROND_LABEL[actieveZone.grondsoort]} · {ZONE_LABEL[actieveZone.zon]}
                {actieveZone.pH != null ? ` · pH ${actieveZone.pH}` : ""}
              </span>
            </p>
          ) : (
            <p className="text-body-sm text-[var(--gp-text-mute)]">Geen zone geselecteerd</p>
          )}
        </div>
        {tuin.zones.length > 1 && (
          <select
            value={actieveZoneId ?? ""}
            onChange={(e) => setActieveZone(e.target.value || null)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            aria-label="Kies zone"
          >
            <option value="">– kies zone –</option>
            {tuin.zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
          </select>
        )}
      </div>

      {/* Hoofd-layout: sidebar + content */}
      <div className="flex gap-6 items-start">

        {/* Filter sidebar — desktop: altijd zichtbaar, mobiel: toggle */}
        <div className="hidden lg:block w-56 shrink-0 sticky top-6">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(LEGE_FILTERS)}
            aantalActief={aantalActief}
          />
        </div>

        {/* Hoofd content */}
        <div className="flex-1 min-w-0">

          {/* Zoekbalk */}
          <div className="flex gap-2 mb-2">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFilterPanelOpen((v) => !v)}
              className={`lg:hidden gp-btn gp-btn-ghost p-2.5 border border-[var(--gp-border)] shrink-0 relative
                          ${filterPanelOpen ? "bg-moss-50 border-moss-400 text-moss-700" : "text-[var(--gp-text-mute)]"}`}
              aria-label="Filters"
              aria-expanded={filterPanelOpen}
            >
              <SlidersHorizontal size={18} aria-hidden />
              {aantalActief > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-moss-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {aantalActief}
                </span>
              )}
            </button>

            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gp-mute)]" aria-hidden />
              <input
                type="text"
                value={invoer}
                onChange={(e) => setInvoer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") zoek(); }}
                onFocus={() => setInvoerFocus(true)}
                onBlur={() => setTimeout(() => setInvoerFocus(false), 150)}
                placeholder="bijv. Lavandula angustifolia of lavendel"
                disabled={!actieveZoneId}
                className="w-full pl-9 pr-4 py-2.5 text-body border border-[var(--gp-border)] rounded-md bg-white
                           focus:outline-none focus:shadow-[var(--gp-shadow-focus)]
                           placeholder:text-[var(--gp-mute)] disabled:opacity-50 disabled:bg-[var(--gp-surface-alt)]"
                aria-label="Zoek plant op naam"
              />
            </div>
            <button
              onClick={() => setFotoOpen((v) => !v)}
              disabled={!actieveZoneId}
              title="Identificeer via foto"
              className={`gp-btn gp-btn-ghost p-2.5 border border-[var(--gp-border)] disabled:opacity-50
                          ${fotoOpen ? "bg-moss-50 border-moss-400 text-moss-700" : "text-[var(--gp-text-mute)]"}`}
              aria-label="Identificeer plant via foto"
              aria-expanded={fotoOpen}
            >
              <Camera size={18} aria-hidden />
            </button>
            <Button
              onClick={zoek}
              disabled={laden || !invoer.trim() || !actieveZoneId}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              {laden ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Search size={16} aria-hidden />}
              Zoek
            </Button>
          </div>

          {/* Actieve filter-chips (altijd zichtbaar) */}
          {aantalActief > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Actieve filters">
              {[...filters.zon].map((z) => (
                <span key={z} className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  {ZON_OPTIES.find((o) => o.waarde === z)?.label}
                  <button onClick={() => setFilters({ ...filters, zon: toggleSet(filters.zon, z) })} aria-label={`Verwijder filter ${z}`}><X size={10} /></button>
                </span>
              ))}
              {[...filters.kleuren].map((k) => (
                <span key={k} className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  {KLEUR_FILTER.find((f) => f.sleutel === k)?.label}
                  <button onClick={() => setFilters({ ...filters, kleuren: toggleSet(filters.kleuren, k) })} aria-label={`Verwijder filter ${k}`}><X size={10} /></button>
                </span>
              ))}
              {[...filters.bestuivers].map((b) => (
                <span key={b} className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  {BESTUIVER_OPTIES.find((o) => o.waarde === b)?.emoji} {BESTUIVER_OPTIES.find((o) => o.waarde === b)?.label}
                  <button onClick={() => setFilters({ ...filters, bestuivers: toggleSet(filters.bestuivers, b) })} aria-label={`Verwijder filter ${b}`}><X size={10} /></button>
                </span>
              ))}
              {(filters.minHoogte > 0 || filters.maxHoogte > 0) && (
                <span className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  {filters.minHoogte > 0 ? `${filters.minHoogte}` : "0"}–{filters.maxHoogte > 0 ? `${filters.maxHoogte}` : "∞"} cm
                  <button onClick={() => setFilters({ ...filters, minHoogte: 0, maxHoogte: 0 })} aria-label="Verwijder hoogte-filter"><X size={10} /></button>
                </span>
              )}
              {filters.maxOnderhoud > 0 && (
                <span className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  Onderhoud ≤ {ONDERHOUD_LABEL[filters.maxOnderhoud as OnderhoudsNiveau].toLowerCase()}
                  <button onClick={() => setFilters({ ...filters, maxOnderhoud: 0 })} aria-label="Verwijder onderhoud-filter"><X size={10} /></button>
                </span>
              )}
              {filters.inheems && (
                <span className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  🇧🇪 Inheems <button onClick={() => setFilters({ ...filters, inheems: false })} aria-label="Verwijder filter inheems"><X size={10} /></button>
                </span>
              )}
              {filters.eetbaar && (
                <span className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  🍓 Eetbaar <button onClick={() => setFilters({ ...filters, eetbaar: false })} aria-label="Verwijder filter eetbaar"><X size={10} /></button>
                </span>
              )}
              {filters.nietGiftig && (
                <span className="flex items-center gap-1 text-caption bg-moss-50 border border-moss-300 text-moss-700 rounded-full px-2.5 py-0.5">
                  🐾 Niet giftig <button onClick={() => setFilters({ ...filters, nietGiftig: false })} aria-label="Verwijder filter niet giftig"><X size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Mobiel filter panel */}
          {filterPanelOpen && (
            <div className="lg:hidden mb-4">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(LEGE_FILTERS)}
                aantalActief={aantalActief}
              />
            </div>
          )}

          {/* Zoekgeschiedenis chips */}
          {invoerFocus && !invoer && geschiedenis.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3" aria-label="Recente zoekopdrachten">
              {geschiedenis.map((term) => (
                <button
                  key={term}
                  onMouseDown={(e) => { e.preventDefault(); setInvoer(term); }}
                  className="gp-scientific text-caption px-2.5 py-1 rounded-full border border-[var(--gp-border)]
                             bg-white text-moss-700 hover:border-moss-400 hover:bg-moss-50 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Foto-identificatie */}
          {fotoOpen && actieveZoneId && (
            <div className="mb-5">
              <FotoIdentificatiePanel onSelecteer={handleFotoSelecteer} onSluit={() => setFotoOpen(false)} />
            </div>
          )}

          {/* Foutmelding */}
          {fout && (
            <div role="alert" className="mb-5 p-4 rounded-md bg-[var(--gp-rust-100)] border border-[var(--gp-rust-500)] text-body-sm text-[var(--gp-rust-700)]">
              {fout}
            </div>
          )}

          {/* Resultaat-telling + filter-feedback */}
          {bronResultaten.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">
                {gefilterd.length} van {bronResultaten.length} plant{bronResultaten.length !== 1 ? "en" : ""}
                {aantalActief > 0 ? ` · ${aantalActief} filter${aantalActief !== 1 ? "s" : ""} actief` : ""}
              </p>
              {aantalActief > 0 && gefilterd.length === 0 && (
                <button onClick={() => setFilters(LEGE_FILTERS)} className="text-caption text-moss-600 hover:underline">
                  Wis filters
                </button>
              )}
            </div>
          )}

          {/* Gefilterd maar geen resultaten */}
          {aantalActief > 0 && gefilterd.length === 0 && resultaten.length > 0 && (
            <div className="py-10 text-center border-2 border-dashed border-[var(--gp-border)] rounded-xl">
              <p className="text-body text-[var(--gp-text-mute)] mb-2">Geen planten voldoen aan de actieve filters.</p>
              <Button variant="secondary" onClick={() => setFilters(LEGE_FILTERS)} className="text-body-sm">
                Wis alle filters
              </Button>
            </div>
          )}

          {/* Intro bij zone-eerst aanbevelingen (geen actieve zoekopdracht) */}
          {resultaten.length === 0 && catalogusAanbevelingen.length > 0 && (
            <p className="text-body-sm text-[var(--gp-text-mute)] mb-4">
              Uit je plantencatalogus, gerangschikt op match met{" "}
              <strong className="text-moss-700">{actieveZone?.naam}</strong>. Zoek hierboven om een nieuwe plant te beoordelen.
            </p>
          )}

          {/* Gecureerde secties */}
          {actieveZoneId && gefilterd.length > 0 && (aanbevolen.length > 0 || gatVullers.length > 0) ? (
            <>
              <ResultatenSectie
                titel={`Aanbevolen voor ${actieveZone?.naam ?? "jouw zone"}`}
                beschrijving="Matchscore ≥ 72% — uitstekende keuze voor jouw bodem, zon en pH"
                resultaten={aanbevolen}
                {...gemeenschappelijkeProps}
              />
              {gatMaanden.length > 0 && gatVullers.length > 0 && (
                <ResultatenSectie
                  titel="Vult bloei-gaten op"
                  beschrijving={`Bloeit in ${gatMaanden.length === 1 ? "een maand" : "maanden"} waar jouw zone nu leeg valt`}
                  resultaten={gatVullers}
                  {...gemeenschappelijkeProps}
                />
              )}
              <ResultatenSectie
                titel="Overige resultaten"
                resultaten={overig}
                {...gemeenschappelijkeProps}
              />
            </>
          ) : (
            /* Geen zone of geen gecureerde secties: toon alle gefilterde resultaten */
            gefilterd.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {gefilterd.map((r) => {
                  const wetNaam = r.plant.identificatie.wetenschappelijkeNaam;
                  const reedsInZone = actieveZone?.plantPlaatsingen.some((p) => p.wetenschappelijkeNaam === wetNaam) ?? false;
                  return (
                    <PlantCard
                      key={wetNaam}
                      plant={r.plant}
                      score={r.match.score}
                      match={r.match}
                      reedsInZone={reedsInZone}
                      onClick={() => naarPlantDetail(wetNaam)}
                      onToevoegen={actieveZoneId ? () => handleToevoegen(r) : undefined}
                    />
                  );
                })}
              </div>
            )
          )}

          {/* Leeg / begin-state */}
          {bronResultaten.length === 0 && !laden && !fout && (
            <div className="text-center py-16 text-[var(--gp-mute)]">
              <p className="text-body mb-3">
                {actieveZoneId ? "Zoek een plant om te beginnen." : "Selecteer eerst een zone hierboven."}
              </p>
              {Object.keys(useTuinStore.getState().plantCatalog).length > 0 && (
                <button onClick={() => navigate("/catalogus")} className="text-body-sm text-moss-600 hover:underline">
                  Of bekijk je plantencatalogus →
                </button>
              )}
            </div>
          )}

          {/* Borderrecepten — gecureerde plantcombinaties (klik een soort om de match te berekenen) */}
          {actieveZoneId && <BorderRecepten onZoekSoort={zoekSoort} />}
        </div>
      </div>
    </div>
  );
}
