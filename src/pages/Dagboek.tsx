import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDagboekStore, OBSERVATIE_TYPE_LABEL, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import { useTuinStore } from "../store/tuin-store";
import type { Observatie, ObservatieType } from "../domain/dagboek/types";
import { Button } from "../components/ui";

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

  return (
    <li className="flex gap-3 p-4 rounded-lg border border-[var(--gp-border)] bg-white group">
      <div className="text-xl shrink-0 mt-0.5" aria-hidden>{OBSERVATIE_TYPE_ICOON[o.type]}</div>
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

  const [formulierOpen, setFormulierOpen] = useState(false);
  const [filterType, setFilterType] = useState<ObservatieType | "">("");
  const [filterZoneId, setFilterZoneId] = useState<string>("");

  const zoneNamen = Object.fromEntries(zones.map((z) => [z.id, z.naam]));
  const plantNamen = Object.keys(plantCatalog).map((k) => plantCatalog[k].identificatie.wetenschappelijkeNaam);

  const gefilterd = observaties.filter((o) => {
    if (filterType && o.type !== filterType) return false;
    if (filterZoneId && o.zoneId !== filterZoneId) return false;
    return true;
  });

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
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-display text-display-md text-moss-900 mb-1">Groeidagboek</h1>
      <p className="text-body text-moss-500 mb-6">
        Leg je tuinobservaties vast — bloei, plagen, groei en meer.
      </p>

      {/* Filters + Nieuw */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ObservatieType | "")}
          className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          aria-label="Filter op type"
        >
          <option value="">Alle types</option>
          {ALLE_TYPES.map((t) => (
            <option key={t} value={t}>{OBSERVATIE_TYPE_ICOON[t]} {OBSERVATIE_TYPE_LABEL[t]}</option>
          ))}
        </select>

        {zones.length > 0 && (
          <select
            value={filterZoneId}
            onChange={(e) => setFilterZoneId(e.target.value)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            aria-label="Filter op zone"
          >
            <option value="">Alle zones</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
          </select>
        )}

        <Button
          onClick={() => setFormulierOpen((v) => !v)}
          className="flex items-center gap-2 ml-auto"
        >
          <Plus size={16} aria-hidden />
          Observatie toevoegen
        </Button>
      </div>

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
          <p className="text-body text-[var(--gp-text-mute)] mb-2">Nog geen observaties.</p>
          <p className="text-body-sm text-[var(--gp-mute)]">
            Klik op "Observatie toevoegen" om te beginnen.
          </p>
        </div>
      )}
    </div>
  );
}
