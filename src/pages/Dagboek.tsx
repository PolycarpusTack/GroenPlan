import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, BookOpen, Search, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDagboekStore, OBSERVATIE_TYPE_LABEL, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import { useTuinStore } from "../store/tuin-store";
import { useBodemStore } from "../store/bodem-store";
import type { Observatie, ObservatieType } from "../domain/dagboek/types";
import { Button } from "../components/ui";

type Periode = "alles" | "week" | "maand" | "jaar";

const PERIODES: { id: Periode; label: string }[] = [
  { id: "week",  label: "Laatste 7 dagen" },
  { id: "maand", label: "Laatste 30 dagen" },
  { id: "jaar",  label: "Laatste 12 maanden" },
  { id: "alles", label: "Alles" },
];

function periodeGrens(periode: Periode): string | null {
  if (periode === "alles") return null;
  const d = new Date();
  if (periode === "week") d.setDate(d.getDate() - 7);
  if (periode === "maand") d.setDate(d.getDate() - 30);
  if (periode === "jaar") d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

const ALLE_TYPES: ObservatieType[] = [
  "bloei", "groei", "plaag", "ziekte", "snoei", "bemesting", "overwintering", "overig",
];

const VANDAAG = new Date().toISOString().slice(0, 10);

interface ObservatieFormProps {
  zones: { id: string; naam: string }[];
  plantNamen: string[];
  beginWaarden?: Partial<Observatie>;
  onOpslaan: (invoer: Omit<Observatie, "id" | "aangemaakt">) => void;
  onAnnuleer: () => void;
  opslaanLabel?: string;
}

function ObservatieForm({ zones, plantNamen, beginWaarden, onOpslaan, onAnnuleer, opslaanLabel = "Opslaan" }: ObservatieFormProps) {
  const [datum, setDatum] = useState(beginWaarden?.datum ?? VANDAAG);
  const [type, setType] = useState<ObservatieType>(beginWaarden?.type ?? "overig");
  const [tekst, setTekst] = useState(beginWaarden?.tekst ?? "");
  const [zoneId, setZoneId] = useState(beginWaarden?.zoneId ?? "");
  const [wetNaam, setWetNaam] = useState(beginWaarden?.wetenschappelijkeNaam ?? "");
  const [fout, setFout] = useState<string | null>(null);

  const handleOpslaan = () => {
    if (!tekst.trim()) { setFout("Voeg een beschrijving toe."); return; }
    onOpslaan({
      datum,
      type,
      tekst: tekst.trim(),
      zoneId: zoneId || null,
      wetenschappelijkeNaam: wetNaam || null,
      afbeeldingUrl: beginWaarden?.afbeeldingUrl ?? null,
    });
  };

  return (
    <div className="space-y-3">
      {fout && (
        <p role="alert" className="text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">
          {fout}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ObservatieType)}
          className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
        >
          {ALLE_TYPES.map((t) => (
            <option key={t} value={t}>{OBSERVATIE_TYPE_ICOON[t]} {OBSERVATIE_TYPE_LABEL[t]}</option>
          ))}
        </select>
        {zones.length > 0 && (
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          >
            <option value="">– zone –</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
          </select>
        )}
        {plantNamen.length > 0 && (
          <select
            value={wetNaam}
            onChange={(e) => setWetNaam(e.target.value)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)] max-w-[200px]"
          >
            <option value="">– plant –</option>
            {plantNamen.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      <textarea
        autoFocus
        value={tekst}
        onChange={(e) => { setTekst(e.target.value); setFout(null); }}
        placeholder="Wat heb je geobserveerd?"
        rows={3}
        className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md resize-none
                   focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
      />

      <div className="flex gap-2">
        <Button onClick={handleOpslaan} className="flex items-center gap-1.5">
          <Check size={14} aria-hidden /> {opslaanLabel}
        </Button>
        <Button variant="ghost" onClick={onAnnuleer} className="flex items-center gap-1.5">
          <X size={14} aria-hidden /> Annuleer
        </Button>
      </div>
    </div>
  );
}

interface ObservatieRijProps {
  observatie: Observatie;
  zoneNaam: string | null;
  zones: { id: string; naam: string }[];
  plantNamen: string[];
  onUpdate: (updates: Partial<Pick<Observatie, "datum" | "type" | "tekst" | "zoneId" | "wetenschappelijkeNaam">>) => void;
  onVerwijder: () => void;
  onPlantKlik?: (wetNaam: string) => void;
}

function ObservatieRij({ observatie: o, zoneNaam, zones, plantNamen, onUpdate, onVerwijder, onPlantKlik }: ObservatieRijProps) {
  const [bewerkModus, setBewerkModus] = useState(false);

  if (bewerkModus) {
    return (
      <li className="p-4 rounded-lg border border-moss-300 bg-moss-50 space-y-3">
        <ObservatieForm
          zones={zones}
          plantNamen={plantNamen}
          beginWaarden={o}
          onOpslaan={(updates) => { onUpdate(updates); setBewerkModus(false); }}
          onAnnuleer={() => setBewerkModus(false)}
          opslaanLabel="Wijzigingen opslaan"
        />
      </li>
    );
  }

  const isProbleem = o.type === "plaag" || o.type === "ziekte";

  return (
    <li className={`flex gap-3 p-4 rounded-lg border border-[var(--gp-border)] bg-white group
      ${isProbleem ? "border-l-4 border-l-[var(--gp-rust-500)]" : ""}`}>
      {o.afbeeldingUrl ? (
        <img
          src={o.afbeeldingUrl}
          alt=""
          className="w-16 h-16 rounded-md object-cover shrink-0 border border-[var(--gp-border)]"
        />
      ) : (
        <div className="text-xl shrink-0 mt-0.5" aria-hidden>{OBSERVATIE_TYPE_ICOON[o.type]}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-caption font-medium text-moss-700 bg-moss-50 border border-moss-200 rounded-full px-2 py-0.5">
            {OBSERVATIE_TYPE_LABEL[o.type]}
          </span>
          <span className="text-caption text-[var(--gp-text-mute)]">{o.datum}</span>
          {zoneNaam && (
            <span className="text-caption text-[var(--gp-text-mute)]">· {zoneNaam}</span>
          )}
          {o.wetenschappelijkeNaam && (
            onPlantKlik ? (
              <button
                onClick={() => onPlantKlik(o.wetenschappelijkeNaam!)}
                className="gp-scientific text-caption text-moss-600 hover:underline"
              >
                · {o.wetenschappelijkeNaam}
              </button>
            ) : (
              <span className="gp-scientific text-caption text-moss-600">· {o.wetenschappelijkeNaam}</span>
            )
          )}
        </div>
        <p className="text-body-sm text-moss-900 whitespace-pre-wrap">{o.tekst}</p>
      </div>
      <div className="flex items-start gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100">
        <Button
          variant="ghost"
          onClick={() => setBewerkModus(true)}
          className="p-1.5 text-[var(--gp-text-mute)] hover:text-moss-700"
          aria-label="Bewerk observatie"
        >
          <Pencil size={13} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          onClick={onVerwijder}
          className="p-1.5 text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)]"
          aria-label="Verwijder observatie"
        >
          <Trash2 size={13} aria-hidden />
        </Button>
      </div>
    </li>
  );
}

export function DagboekPagina() {
  const navigate = useNavigate();
  const { observaties, voegObservatieToe, updateObservatie, verwijderObservatie } = useDagboekStore();
  const zones = useTuinStore((s) => s.tuin.zones);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);

  const metingen = useBodemStore((s) => s.metingen);

  const [formulierOpen, setFormulierOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Set<ObservatieType>>(new Set());
  const [filterZoneId, setFilterZoneId] = useState<string>("");
  const [periode, setPeriode] = useState<Periode>("alles");
  const [zoek, setZoek] = useState("");

  const zoneNamen = Object.fromEntries(zones.map((z) => [z.id, z.naam]));
  const plantNamen = Object.keys(plantCatalog).map((k) => plantCatalog[k].identificatie.wetenschappelijkeNaam);

  const toggleType = (t: ObservatieType) =>
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });

  // Basis-filter zónder type, zodat de type-tellingen in de zijbalk de
  // huidige periode/zone/zoekopdracht volgen (facet-tellingen).
  const basisGefilterd = useMemo(() => {
    const grens = periodeGrens(periode);
    const term = zoek.trim().toLowerCase();
    return observaties.filter((o) => {
      if (grens && o.datum < grens) return false;
      if (filterZoneId && o.zoneId !== filterZoneId) return false;
      if (term && !o.tekst.toLowerCase().includes(term) &&
          !(o.wetenschappelijkeNaam ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [observaties, periode, filterZoneId, zoek]);

  const typeTellingen = useMemo(() => {
    const tellingen = {} as Record<ObservatieType, number>;
    for (const t of ALLE_TYPES) tellingen[t] = 0;
    for (const o of basisGefilterd) tellingen[o.type]++;
    return tellingen;
  }, [basisGefilterd]);

  const gefilterd = filterTypes.size === 0
    ? basisGefilterd
    : basisGefilterd.filter((o) => filterTypes.has(o.type));

  // "Deze week"-samenvatting — altijd de echte laatste 7 dagen, los van filters.
  const weekSamenvatting = useMemo(() => {
    const grens = periodeGrens("week")!;
    const week = observaties.filter((o) => o.datum >= grens);
    return {
      observaties: week.length,
      fotos: week.filter((o) => o.afbeeldingUrl).length,
      aandacht: week.filter((o) => o.type === "plaag" || o.type === "ziekte").length,
    };
  }, [observaties]);

  // pH-trend uit de bodemmetingen: nieuwste t.o.v. de vorige meting.
  const phTrend = useMemo(() => {
    if (metingen.length < 2) return null;
    const [laatste, vorige] = metingen; // store sorteert aflopend op datum
    const delta = Math.round((laatste.ph - vorige.ph) * 10) / 10;
    return { delta, zoneNaam: zoneNamen[laatste.zoneId] ?? null };
  }, [metingen, zoneNamen]);

  // Groepeer per maand (nieuwste datum eerst binnen elke groep)
  const gesorteerdeGefilterd = [...gefilterd].sort((a, b) => b.datum.localeCompare(a.datum));
  const groepen: Map<string, Observatie[]> = new Map();
  for (const o of gesorteerdeGefilterd) {
    const maandSleutel = o.datum.slice(0, 7); // YYYY-MM
    if (!groepen.has(maandSleutel)) groepen.set(maandSleutel, []);
    groepen.get(maandSleutel)!.push(o);
  }
  const gesorteerdeGroepen = [...groepen.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const maandLabel = (sleutel: string) => {
    const [jaar, maand] = sleutel.split("-");
    return new Date(parseInt(jaar), parseInt(maand) - 1, 1)
      .toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-display-md text-moss-900 mb-1">Groeidagboek</h1>
          <p className="text-body text-moss-500">
            {observaties.length} observatie{observaties.length !== 1 ? "s" : ""} · leg bloei, plagen en groei vast.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gp-text-mute)]" aria-hidden />
            <input
              type="search"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek in dagboek…"
              aria-label="Zoek in dagboek"
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 text-body-sm border border-[var(--gp-border)] rounded-md bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
          </div>
          <Button onClick={() => setFormulierOpen((v) => !v)} className="flex items-center gap-2">
            <Plus size={16} aria-hidden />
            Observatie
          </Button>
        </div>
      </div>

      <div className="md:flex md:gap-6 md:items-start">
      {/* Zijbalk: periode · types · zone · weeksamenvatting */}
      <aside className="md:w-56 md:shrink-0 mb-6 md:mb-0 md:sticky md:top-6 space-y-5">
        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Periode</p>
          <div className="space-y-1">
            {PERIODES.map((p) => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer text-body-sm text-moss-900">
                <input
                  type="radio"
                  name="dagboek-periode"
                  checked={periode === p.id}
                  onChange={() => setPeriode(p.id)}
                  className="accent-moss-700"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Type</p>
          <div className="space-y-1">
            {ALLE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer text-body-sm text-moss-900">
                <input
                  type="checkbox"
                  checked={filterTypes.has(t)}
                  onChange={() => toggleType(t)}
                  className="accent-moss-700"
                />
                <span aria-hidden>{OBSERVATIE_TYPE_ICOON[t]}</span>
                <span className="flex-1">{OBSERVATIE_TYPE_LABEL[t]}</span>
                <span className="text-caption text-[var(--gp-text-mute)] tabular-nums">{typeTellingen[t]}</span>
              </label>
            ))}
          </div>
        </div>

        {zones.length > 0 && (
          <div>
            <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Zone</p>
            <select
              value={filterZoneId}
              onChange={(e) => setFilterZoneId(e.target.value)}
              className="w-full text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
              aria-label="Filter op zone"
            >
              <option value="">Alle zones</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
            </select>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--gp-border)]">
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Deze week</p>
          <dl className="space-y-1 text-body-sm">
            <div className="flex justify-between"><dt className="text-[var(--gp-text-mute)]">Observaties</dt><dd className="font-medium text-moss-900">{weekSamenvatting.observaties}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--gp-text-mute)]">Foto's</dt><dd className="font-medium text-moss-900">{weekSamenvatting.fotos}</dd></div>
            <div className="flex justify-between">
              <dt className="text-[var(--gp-text-mute)]">Aandacht</dt>
              <dd className={`font-medium ${weekSamenvatting.aandacht > 0 ? "text-amber-700" : "text-moss-900"}`}>{weekSamenvatting.aandacht}</dd>
            </div>
            {phTrend && (
              <div className="flex justify-between items-center">
                <dt className="text-[var(--gp-text-mute)]">pH-trend</dt>
                <dd className={`font-medium flex items-center gap-1 ${phTrend.delta > 0 ? "text-moss-700" : phTrend.delta < 0 ? "text-amber-700" : "text-moss-900"}`}>
                  {phTrend.delta > 0 ? <TrendingUp size={12} aria-hidden /> : phTrend.delta < 0 ? <TrendingDown size={12} aria-hidden /> : null}
                  {phTrend.delta > 0 ? "+" : ""}{phTrend.delta}
                </dd>
              </div>
            )}
          </dl>
          {phTrend?.zoneNaam && (
            <p className="text-caption text-[var(--gp-text-mute)] mt-1">pH: laatste meting in {phTrend.zoneNaam}</p>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
      {/* Nieuw-formulier */}
      {formulierOpen && (
        <div className="gp-card-bordered mb-6">
          <h2 className="font-display text-heading-lg text-moss-900 mb-4">Nieuwe observatie</h2>
          <ObservatieForm
            zones={zones}
            plantNamen={plantNamen}
            onOpslaan={(invoer) => { voegObservatieToe(invoer); setFormulierOpen(false); }}
            onAnnuleer={() => setFormulierOpen(false)}
            opslaanLabel="Observatie opslaan"
          />
        </div>
      )}

      {/* Observaties per maand */}
      {gesorteerdeGroepen.length > 0 ? (
        <div className="space-y-8">
          {gesorteerdeGroepen.map(([maand, items]) => (
            <section key={maand} aria-label={maandLabel(maand)}>
              <h2 className="font-display text-heading-md text-moss-800 mb-3 capitalize">
                {maandLabel(maand)}
                <span className="text-caption text-[var(--gp-text-mute)] font-normal ml-2">· {items.length}</span>
              </h2>
              <ul className="space-y-3">
                {items.map((o) => (
                  <ObservatieRij
                    key={o.id}
                    observatie={o}
                    zoneNaam={o.zoneId ? (zoneNamen[o.zoneId] ?? null) : null}
                    zones={zones}
                    plantNamen={plantNamen}
                    onUpdate={(updates) => updateObservatie(o.id, updates)}
                    onVerwijder={() => verwijderObservatie(o.id)}
                    onPlantKlik={(wetNaam) => navigate(`/plant/${encodeURIComponent(wetNaam)}`)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-[var(--gp-border)] rounded-xl">
          <BookOpen size={36} className="text-[var(--gp-mute)] mx-auto mb-3" aria-hidden />
          {observaties.length > 0 ? (
            <p className="text-body text-[var(--gp-text-mute)]">Geen observaties binnen de huidige filters.</p>
          ) : (
            <>
              <p className="text-body text-[var(--gp-text-mute)] mb-2">Nog geen observaties.</p>
              <p className="text-body-sm text-[var(--gp-mute)]">
                Klik op "Observatie" om te beginnen.
              </p>
            </>
          )}
        </div>
      )}
      </div> {/* end flex-1 */}
      </div> {/* end md:flex */}
    </div>
  );
}
