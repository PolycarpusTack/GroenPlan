import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shovel, WifiOff, ChevronLeft, Check, AlertTriangle,
  Search, Leaf, ClipboardList, ScanLine, CheckSquare2, X, ExternalLink, Bug, ShieldCheck,
  MapPin, Sparkles, Navigation,
  type LucideIcon,
} from "lucide-react";
import { useDagboekStore, OBSERVATIE_TYPE_LABEL, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import { useTakenStore } from "../store/taken-store";
import { useTuinStore } from "../store/tuin-store";
import { getPlantNetService } from "../services/plantnet/plantnet-service";
import { getPlagenService } from "../services/plagen/plagen-service";
import { getCoachService } from "../services/coach/coach-service";
import { Button } from "../components/ui";
import { dichtstbijzijndeGemeente } from "../services/locatie/dichtstbijzijndeGemeente";
import { valideerAfbeelding, BEELD_PRIVACY_NOTE } from "../services/media/afbeelding";
import { Spinner } from "../components/Spinner";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import type { PlantNetSuggestie } from "../services/plantnet/types";
import type { PlagenResultaat, PlagenErnst, BevindingType } from "../services/plagen/types";
import type { CoachAntwoord } from "../services/coach/types";
import type { ObservatieType } from "../domain/dagboek/types";

const VANDAAG = new Date().toISOString().slice(0, 10);

const PLAAG_ERNST_STIJL: Record<PlagenErnst, string> = {
  laag: "bg-moss-100 text-moss-700",
  midden: "bg-amber-100 text-amber-700",
  hoog: "bg-[var(--gp-rust-100)] text-[var(--gp-rust-700)]",
};
const PLAAG_TYPE_LABEL: Record<BevindingType, string> = {
  plaag: "plaag",
  ziekte: "ziekte",
  tekort: "tekort",
  gezond: "gezond",
};

const DATUM_LABEL = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long", day: "numeric", month: "long",
}).format(new Date());

const ALLE_TYPEN: ObservatieType[] = [
  "bloei", "groei", "plaag", "ziekte", "snoei", "bemesting", "overwintering", "overig",
];

// ── Connectie-status pill (Online · Offline) — altijd zichtbaar in veld-modus ───
// useOnlineStatus komt nu uit de gedeelde, SSR-veilige hook (geen duplicaat meer).

function ConnectiePil({ online }: { online: boolean }) {
  return (
    <span
      role="status"
      aria-label={online ? "Online" : "Offline"}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-medium ${
        online ? "bg-moss-100 text-moss-700" : "bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)]"
      }`}
    >
      {online
        ? <><span className="w-2 h-2 rounded-full bg-moss-500" aria-hidden /> Online</>
        : <><WifiOff size={12} aria-hidden /> Offline</>}
    </span>
  );
}

// ── Panel types ────────────────────────────────────────────────────────────────

type VeldPanel = "observatie" | "taken" | "plantid" | "mijnzone" | "coach" | null;

// ── Actie-tegel (veld-modus startscherm) ────────────────────────────────────────

const TEGEL_KLEUR: Record<string, { bg: string; icon: string }> = {
  moss:  { bg: "bg-moss-100",  icon: "text-moss-700" },
  amber: { bg: "bg-amber-100", icon: "text-amber-700" },
  sky:   { bg: "bg-sky-100",   icon: "text-sky-700" },
  clay:  { bg: "bg-clay-100",  icon: "text-clay-700" },
  bloom: { bg: "bg-bloom-100", icon: "text-bloom-700" },
};

function ActieTegel({
  icoon: Icoon, kleur, titel, omschrijving, onClick, badge,
}: {
  icoon: LucideIcon;
  kleur: keyof typeof TEGEL_KLEUR;
  titel: string;
  omschrijving: string;
  onClick: () => void;
  badge?: number;
}) {
  const k = TEGEL_KLEUR[kleur];
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-3 p-6 min-h-[120px] rounded-2xl
                 border-2 border-[var(--gp-border)] bg-white hover:border-moss-400 hover:shadow-md
                 transition-all active:scale-[0.98] text-center"
    >
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 min-w-[1.25rem] h-5 flex items-center justify-center
                         rounded-full bg-[var(--gp-rust-700)] text-white text-[10px] font-bold px-1">
          {badge}
        </span>
      )}
      <div className={`w-12 h-12 rounded-xl ${k.bg} flex items-center justify-center`}>
        <Icoon size={24} className={k.icon} aria-hidden />
      </div>
      <span className="text-body font-semibold text-moss-900">{titel}</span>
      <span className="text-caption text-[var(--gp-text-mute)]">{omschrijving}</span>
    </button>
  );
}

// ── Observatie panel ───────────────────────────────────────────────────────────

function ObservatiePaneel({
  zones, onTerug,
}: {
  zones: { id: string; naam: string }[];
  onTerug: () => void;
}) {
  const voegToe = useDagboekStore((s) => s.voegObservatieToe);
  const [type, setType] = useState<ObservatieType>("overig");
  const [tekst, setTekst] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const tekstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { tekstRef.current?.focus(); }, []);

  const opslaan = () => {
    if (!tekst.trim()) return;
    voegToe({ datum: VANDAAG, type, tekst: tekst.trim(), zoneId: zoneId || null, wetenschappelijkeNaam: null, afbeeldingUrl: null });
    setTekst("");
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTerug} className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
        <ChevronLeft size={16} aria-hidden /> Terug
      </button>
      <h2 className="font-display text-heading-lg text-moss-900">Observatie loggen</h2>

      {/* Type pills */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 pb-1 w-max">
          {ALLE_TYPEN.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-body-sm font-medium transition-colors whitespace-nowrap
                ${type === t
                  ? "bg-moss-600 text-white border-moss-600"
                  : "bg-white text-moss-700 border-[var(--gp-border)] hover:border-moss-400"
                }`}
            >
              <span aria-hidden>{OBSERVATIE_TYPE_ICOON[t]}</span>
              {OBSERVATIE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Tekst */}
      <textarea
        ref={tekstRef}
        rows={4}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Beschrijf wat je ziet…"
        className="w-full px-4 py-3 text-body border border-[var(--gp-border)] rounded-xl
                   focus:outline-none focus:shadow-[var(--gp-shadow-focus)] resize-none bg-white"
      />

      {/* Zone */}
      {zones.length > 0 && (
        <select
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="text-body border border-[var(--gp-border)] rounded-xl px-4 py-3 bg-white
                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
        >
          <option value="">– Zone (optioneel) –</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
        </select>
      )}

      <button
        onClick={opslaan}
        disabled={!tekst.trim()}
        className={`gp-btn flex items-center justify-center gap-2 py-4 text-body font-semibold rounded-xl
          ${opgeslagen ? "bg-moss-100 text-moss-700 border border-moss-300" : "gp-btn-primary"}
          disabled:opacity-40`}
      >
        {opgeslagen
          ? <><Check size={18} aria-hidden /> Opgeslagen!</>
          : <><Leaf size={18} aria-hidden /> Opslaan</>}
      </button>
    </div>
  );
}

// ── Taken panel ────────────────────────────────────────────────────────────────

function TakenPaneel({ zones, onTerug }: { zones: { id: string; naam: string }[]; onTerug: () => void }) {
  const { taken, toggleStatus } = useTakenStore();
  const openTaken = taken
    .filter((t) => t.status === "open")
    .sort((a, b) => {
      const aV = a.vervaldatum ?? "9999";
      const bV = b.vervaldatum ?? "9999";
      return aV.localeCompare(bV);
    });

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTerug} className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
        <ChevronLeft size={16} aria-hidden /> Terug
      </button>
      <h2 className="font-display text-heading-lg text-moss-900">
        Open taken
        <span className="ml-2 text-body text-[var(--gp-text-mute)] font-normal">· {openTaken.length}</span>
      </h2>

      {(() => {
        const verlopen = openTaken.filter((t) => t.vervaldatum !== null && t.vervaldatum < VANDAAG);
        return verlopen.length > 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--gp-rust-100)] border border-[var(--gp-rust-300)]">
            <AlertTriangle size={16} className="text-[var(--gp-rust-700)] shrink-0" aria-hidden />
            <p className="text-body-sm font-medium text-[var(--gp-rust-700)]">
              {verlopen.length} achterstallige {verlopen.length === 1 ? "taak" : "taken"} — pak deze eerst aan.
            </p>
          </div>
        ) : null;
      })()}

      {openTaken.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <CheckSquare2 size={36} className="text-moss-300 mb-3" aria-hidden />
          <p className="text-body text-[var(--gp-text-mute)]">Geen open taken. Alles gedaan!</p>
        </div>
      )}

      <ul className="space-y-2">
        {openTaken.map((taak) => {
          const verlopen = taak.vervaldatum !== null && taak.vervaldatum < VANDAAG;
          const zoneNaam = zones.find((z) => z.id === taak.zoneId)?.naam;
          return (
            <li
              key={taak.id}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 bg-white transition-colors
                ${verlopen ? "border-[var(--gp-rust-300)]" : "border-[var(--gp-border)]"}`}
            >
              <button
                onClick={() => toggleStatus(taak.id)}
                aria-label={`Markeer '${taak.titel}' als klaar`}
                className="mt-0.5 w-7 h-7 rounded-md border-2 border-moss-400 flex items-center justify-center shrink-0 hover:bg-moss-50 transition-colors"
              >
                <span className="sr-only">Afvinken</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-moss-900 leading-snug">{taak.titel}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {zoneNaam && <span className="text-caption text-moss-500">{zoneNaam}</span>}
                  {taak.vervaldatum && (
                    <span className={`flex items-center gap-1 text-caption font-medium
                      ${verlopen ? "text-[var(--gp-rust-700)]" : "text-[var(--gp-text-mute)]"}`}>
                      {verlopen && <AlertTriangle size={11} aria-hidden />}
                      {taak.vervaldatum === VANDAAG ? "Vandaag" : taak.vervaldatum}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Plant-ID panel ─────────────────────────────────────────────────────────────

function PlantIdPaneel({ onTerug }: { onTerug: () => void }) {
  const navigate = useNavigate();
  const [bestand, setBestand] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [laden, setLaden] = useState(false);
  const [suggesties, setSuggesties] = useState<PlantNetSuggestie[] | null>(null);
  const [bron, setBron] = useState<"online" | "lokaal" | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [plagen, setPlagen] = useState<PlagenResultaat | null>(null);
  const [plagenLaden, setPlagenLaden] = useState(false);
  const [plagenFout, setPlagenFout] = useState<string | null>(null);

  const selecteer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validatieFout = valideerAfbeelding(f);
    if (validatieFout) {
      setFout(validatieFout);
      return;
    }
    setBestand(f);
    setSuggesties(null);
    setBron(null);
    setFout(null);
    setPlagen(null);
    setPlagenFout(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const reset = () => {
    setBestand(null);
    setPreview(null);
    setSuggesties(null);
    setBron(null);
    setFout(null);
    setPlagen(null);
    setPlagenFout(null);
  };

  const identificeer = async () => {
    if (!bestand) return;
    setLaden(true);
    setFout(null);
    try {
      const resultaat = await getPlantNetService().identificeer(bestand);
      setSuggesties(resultaat.suggesties.length > 0 ? resultaat.suggesties : []);
      setBron(resultaat.bron ?? null);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Onbekende fout bij identificatie.");
    } finally {
      setLaden(false);
    }
  };

  // Plagen- & ziektecheck op dezelfde foto. Gebruikt de top-identificatie (indien
  // beschikbaar) als context voor de AI-diagnose.
  const checkPlagen = async () => {
    if (!bestand) return;
    setPlagenLaden(true);
    setPlagenFout(null);
    try {
      const plantNaam = suggesties?.[0]?.wetenschappelijkeNaam;
      const resultaat = await getPlagenService().analyseer(bestand, plantNaam);
      setPlagen(resultaat);
    } catch (e) {
      setPlagenFout(e instanceof Error ? e.message : "Onbekende fout bij plagen-analyse.");
    } finally {
      setPlagenLaden(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTerug} className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
        <ChevronLeft size={16} aria-hidden /> Terug
      </button>
      <h2 className="font-display text-heading-lg text-moss-900">Plant identificeren</h2>

      {/* Preview */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[var(--gp-border)]">
          <img src={preview} alt="Gekozen foto" className="w-full max-h-56 object-cover" />
          <button
            onClick={reset}
            className="absolute top-2 right-2 bg-white/90 rounded-full min-h-11 min-w-11 flex items-center justify-center shadow"
            aria-label="Foto verwijderen"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--gp-border)] bg-white cursor-pointer hover:border-moss-400 transition-colors">
          <ScanLine size={40} className="text-[var(--gp-text-mute)]" aria-hidden />
          <div className="text-center">
            <p className="text-body font-medium text-moss-900">Foto uploaden</p>
            <p className="text-body-sm text-[var(--gp-text-mute)]">of neem een foto van de plant</p>
          </div>
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={selecteer} />
        </label>
      )}

      {bestand && !laden && !suggesties && (
        <Button
          onClick={identificeer}
          className="flex items-center justify-center gap-2 py-4 text-body font-semibold rounded-xl"
        >
          <ScanLine size={18} aria-hidden /> Identificeer via PlantNet
        </Button>
      )}

      {laden && (
        <div className="flex items-center justify-center gap-3 py-6 text-moss-600">
          <Spinner />
          <span className="text-body">Analyseren…</span>
        </div>
      )}

      {fout && (
        <div className="p-4 rounded-xl bg-[var(--gp-rust-50)] border border-[var(--gp-rust-300)] space-y-1">
          <p className="text-body-sm font-medium text-[var(--gp-rust-700)]">Identificatie mislukt</p>
          <p className="text-caption text-[var(--gp-rust-700)]">{fout}</p>
        </div>
      )}

      {suggesties !== null && suggesties.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-body text-amber-800">Geen plant herkend. Probeer een scherpere foto van bladeren of bloemen.</p>
        </div>
      )}

      {suggesties !== null && suggesties.length > 0 && (
        <div className="space-y-3">
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">
            Top {suggesties.length} resultaten
          </p>
          {bron === "lokaal" && (
            <p className="text-caption text-amber-700">
              Lokaal demo-resultaat — geen PlantNet-verbinding. Deze suggesties zijn een voorbeeld, geen echte herkenning.
            </p>
          )}
          {suggesties.map((s, i) => (
            <div
              key={s.wetenschappelijkeNaam}
              className={`p-4 rounded-xl border-2 bg-white flex items-start gap-3
                ${i === 0 ? "border-moss-400" : "border-[var(--gp-border)]"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="gp-scientific text-body font-semibold text-moss-900">{s.wetenschappelijkeNaam}</p>
                {s.gewoneNaam && <p className="text-body-sm text-[var(--gp-text-mute)]">{s.gewoneNaam}</p>}
                {s.familie && <p className="text-caption text-[var(--gp-text-mute)]">{s.familie}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-caption font-bold px-2 py-0.5 rounded-full
                  ${s.zekerheid >= 0.7 ? "bg-moss-100 text-moss-700"
                    : s.zekerheid >= 0.4 ? "bg-amber-100 text-amber-700"
                    : "bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)]"}`}>
                  {Math.round(s.zekerheid * 100)}%
                </span>
                <button
                  onClick={() => navigate(`/ontdek?zoek=${encodeURIComponent(s.wetenschappelijkeNaam)}`)}
                  className="flex items-center gap-1 text-caption text-moss-600 hover:underline"
                  aria-label={`Zoek ${s.wetenschappelijkeNaam} in Ontdek`}
                >
                  <ExternalLink size={10} aria-hidden /> Zoek in Ontdek
                </button>
              </div>
            </div>
          ))}
          <button onClick={reset} className="text-caption text-moss-600 hover:underline">
            Nieuwe foto identificeren →
          </button>
        </div>
      )}

      {/* Plagen- & ziektecheck op dezelfde foto */}
      {bestand && !laden && (
        <div className="border-t border-[var(--gp-border)] pt-4 space-y-3">
          {!plagen && !plagenLaden && (
            <Button
              variant="ghost"
              onClick={checkPlagen}
              className="border border-moss-300 w-full flex items-center justify-center gap-2 py-3 text-body font-medium rounded-xl"
            >
              <Bug size={18} aria-hidden /> Controleer op plagen &amp; ziekten
            </Button>
          )}

          {plagenLaden && (
            <div className="flex items-center justify-center gap-3 py-4 text-moss-600">
              <Spinner />
              <span className="text-body">Foto analyseren op plagen…</span>
            </div>
          )}

          {plagenFout && (
            <div className="p-4 rounded-xl bg-[var(--gp-rust-50)] border border-[var(--gp-rust-300)] space-y-1">
              <p className="text-body-sm font-medium text-[var(--gp-rust-700)]">Plagen-analyse mislukt</p>
              <p className="text-caption text-[var(--gp-rust-700)]">{plagenFout}</p>
            </div>
          )}

          {plagen && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bug size={15} className="text-moss-700" aria-hidden />
                <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">Plagen &amp; ziekten</p>
              </div>

              {plagen.bron === "lokaal" && (
                <p className="text-caption text-amber-700">
                  Lokaal demo-resultaat — geen AI-verbinding. Geen echte diagnose, enkel een voorbeeld.
                </p>
              )}

              <p className="text-body-sm text-moss-700">{plagen.samenvatting}</p>

              {plagen.bevindingen.length === 0 ? (
                <p className="text-body-sm text-[var(--gp-text-mute)]">Geen specifieke bevindingen.</p>
              ) : (
                plagen.bevindingen.map((b, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border-2 bg-white
                      ${b.type === "gezond" ? "border-moss-300"
                        : b.ernst === "hoog" ? "border-[var(--gp-rust-300)]"
                        : "border-amber-200"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {b.type === "gezond"
                          ? <ShieldCheck size={16} className="text-moss-600 shrink-0" aria-hidden />
                          : <Bug size={16} className="text-amber-600 shrink-0" aria-hidden />}
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-moss-900">{b.naam}</p>
                          {b.wetenschappelijkeNaam && (
                            <p className="gp-scientific text-caption text-[var(--gp-text-mute)]">{b.wetenschappelijkeNaam}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-[var(--gp-surface-alt)] text-moss-700 shrink-0">
                        {Math.round(b.zekerheid * 100)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-caption px-2 py-0.5 rounded-full ${PLAAG_ERNST_STIJL[b.ernst]}`}>
                        Ernst: {b.ernst}
                      </span>
                      <span className="text-caption px-2 py-0.5 rounded-full bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)]">
                        {PLAAG_TYPE_LABEL[b.type]}
                      </span>
                      {b.biologisch && (
                        <span className="text-caption px-2 py-0.5 rounded-full bg-moss-100 text-moss-700">biologisch</span>
                      )}
                    </div>

                    <p className="text-body-sm text-moss-700 mt-2">{b.symptomen}</p>
                    <p className="text-body-sm text-moss-900 mt-1">
                      <span className="font-medium">Actie:</span> {b.aanbevolenActie}
                    </p>
                  </div>
                ))
              )}

              <div className="flex items-start gap-2 pt-1">
                <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
                <p className="text-caption text-amber-700">
                  AI-inschatting — geen vervanging voor een vakkundige diagnose. Controleer altijd ter plaatse.
                </p>
              </div>

              <button
                onClick={() => { setPlagen(null); setPlagenFout(null); }}
                className="text-caption text-moss-600 hover:underline"
              >
                Opnieuw analyseren →
              </button>
            </div>
          )}
        </div>
      )}

      {!suggesties && !laden && (
        <p className="text-caption text-[var(--gp-text-mute)] flex items-start gap-1.5">
          <ScanLine size={12} className="shrink-0 mt-0.5" aria-hidden />
          Foto-herkenning via PlantNet · identificeer bladeren, bloemen of vruchten voor beste resultaat. {BEELD_PRIVACY_NOTE}
        </p>
      )}
    </div>
  );
}

// ── Mijn zone (GPS) panel ──────────────────────────────────────────────────────

function MijnZonePaneel({
  zones, onTerug,
}: {
  zones: { id: string; naam: string; gemeente: string | null }[];
  onTerug: () => void;
}) {
  const navigate = useNavigate();
  const setActieveZone = useTuinStore((s) => s.setActieveZone);
  const [laden, setLaden] = useState(false);
  const [locatie, setLocatie] = useState<{ gemeente: string; afstandKm: number } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const bepaal = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setFout("Geolocatie wordt niet ondersteund door dit toestel.");
      return;
    }
    setLaden(true);
    setFout(null);
    setLocatie(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { gemeente, afstandKm } = dichtstbijzijndeGemeente(pos.coords.latitude, pos.coords.longitude);
        setLocatie({ gemeente: gemeente.naam, afstandKm });
        setLaden(false);
      },
      (err) => {
        setFout(
          err.code === err.PERMISSION_DENIED
            ? "Locatietoegang geweigerd. Sta het toe om je zone te vinden."
            : "Kon je locatie niet bepalen. Probeer opnieuw.",
        );
        setLaden(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const zonesInGemeente = locatie
    ? zones.filter((z) => z.gemeente && z.gemeente.toLowerCase() === locatie.gemeente.toLowerCase())
    : [];
  const teTonen = locatie ? (zonesInGemeente.length > 0 ? zonesInGemeente : zones) : [];

  const kies = (id: string) => {
    setActieveZone(id);
    navigate("/tuinkaart");
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTerug} className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
        <ChevronLeft size={16} aria-hidden /> Terug
      </button>
      <h2 className="font-display text-heading-lg text-moss-900">Mijn zone</h2>

      <Button
        onClick={bepaal}
        disabled={laden}
        className="flex items-center justify-center gap-2 py-4 text-body font-semibold rounded-xl disabled:opacity-60"
      >
        {laden
          ? <><Spinner size={16} tone="white" />Locatie bepalen…</>
          : <><Navigation size={18} aria-hidden /> Bepaal mijn locatie</>}
      </Button>

      {fout && (
        <div className="p-4 rounded-xl bg-[var(--gp-rust-50)] border border-[var(--gp-rust-300)]">
          <p className="text-caption text-[var(--gp-rust-700)]">{fout}</p>
        </div>
      )}

      {locatie && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-moss-50 border border-moss-200">
            <MapPin size={16} className="text-moss-600 shrink-0" aria-hidden />
            <p className="text-body-sm text-moss-800">
              Dichtstbijzijnde gemeente: <span className="font-semibold">{locatie.gemeente}</span>
              <span className="text-[var(--gp-text-mute)]"> · ~{locatie.afstandKm} km</span>
            </p>
          </div>

          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">
            {zonesInGemeente.length > 0 ? `Zones in ${locatie.gemeente}` : "Geen zone in deze gemeente — kies handmatig"}
          </p>
          {teTonen.length === 0 ? (
            <p className="text-body-sm text-[var(--gp-text-mute)]">Je hebt nog geen zones aangemaakt.</p>
          ) : (
            <ul className="space-y-2">
              {teTonen.map((z) => (
                <li key={z.id}>
                  <button
                    onClick={() => kies(z.id)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[var(--gp-border)] bg-white hover:border-moss-400 text-left"
                  >
                    <span className="text-body-sm font-medium text-moss-900">{z.naam}</span>
                    <span className="text-caption text-moss-600">Open →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!locatie && !fout && !laden && (
        <p className="text-caption text-[var(--gp-text-mute)] flex items-start gap-1.5">
          <MapPin size={12} className="shrink-0 mt-0.5" aria-hidden />
          Bepaalt de dichtstbijzijnde gemeente op basis van je GPS en toont je zones daar. Locatie wordt lokaal gebruikt, niet opgeslagen.
        </p>
      )}
    </div>
  );
}

// ── Vraag AI (coach) panel ──────────────────────────────────────────────────────

function CoachPaneel({ onTerug, online }: { onTerug: () => void; online: boolean }) {
  const [vraag, setVraag] = useState("");
  const [laden, setLaden] = useState(false);
  const [antwoord, setAntwoord] = useState<CoachAntwoord | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const stel = async () => {
    if (!vraag.trim()) return;
    setLaden(true);
    setFout(null);
    setAntwoord(null);
    try {
      const res = await getCoachService().vraag(vraag.trim());
      setAntwoord(res);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Onbekende fout bij het beantwoorden.");
    } finally {
      setLaden(false);
    }
  };

  const VOORBEELDEN = [
    "Wanneer snoei ik lavendel?",
    "Hoe bestrijd ik bladluis biologisch?",
    "Wat kan ik nu nog zaaien?",
  ];

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTerug} className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
        <ChevronLeft size={16} aria-hidden /> Terug
      </button>
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-moss-600" aria-hidden />
        <h2 className="font-display text-heading-lg text-moss-900">Vraag AI</h2>
      </div>

      {!online && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <WifiOff size={14} className="text-amber-600 shrink-0" aria-hidden />
          <p className="text-caption text-amber-800">Je bent offline — je krijgt algemene begeleiding in plaats van een AI-antwoord op maat.</p>
        </div>
      )}

      <textarea
        rows={3}
        value={vraag}
        onChange={(e) => setVraag(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) stel(); }}
        placeholder="Stel een tuinvraag, bijv. 'Wanneer snoei ik mijn hortensia?'"
        className="w-full px-4 py-3 text-body border border-[var(--gp-border)] rounded-lg focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white resize-none"
        disabled={laden}
      />

      {!antwoord && !laden && (
        <div className="flex flex-wrap gap-1.5">
          {VOORBEELDEN.map((v) => (
            <button
              key={v}
              onClick={() => setVraag(v)}
              className="text-body-sm px-3 py-2 rounded-full bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] text-moss-700 hover:border-moss-400"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <Button
        onClick={stel}
        disabled={laden || !vraag.trim()}
        className="flex items-center justify-center gap-2 py-4 text-body font-semibold rounded-xl disabled:opacity-60"
      >
        {laden
          ? <><Spinner size={16} tone="white" />Bezig…</>
          : <><Sparkles size={16} aria-hidden /> Vraag stellen</>}
      </Button>

      {fout && (
        <div className="p-4 rounded-xl bg-[var(--gp-rust-50)] border border-[var(--gp-rust-300)]">
          <p className="text-caption text-[var(--gp-rust-700)]">{fout}</p>
        </div>
      )}

      {antwoord && (
        <div className="space-y-2">
          {antwoord.bron === "lokaal" && (
            <p className="text-caption text-amber-700">Lokaal antwoord — geen AI-verbinding. Algemene begeleiding, niet op maat.</p>
          )}
          <div className="p-4 rounded-xl border border-[var(--gp-border)] bg-white">
            <p className="text-body-sm text-moss-900 whitespace-pre-line">{antwoord.antwoord}</p>
          </div>
          {/* Bronvermelding per antwoord — ook in veld-modus, niet enkel desktop */}
          <p className="text-caption text-[var(--gp-text-mute)]">
            {antwoord.bron === "ai" ? "via AI-tuincoach" : "via lokale begeleiding (geen AI)"}
          </p>
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <p className="text-caption text-amber-700">
              AI-suggestie — controleer altijd of het advies past bij jouw exacte situatie.
            </p>
          </div>
          <button onClick={() => { setAntwoord(null); setVraag(""); }} className="inline-flex items-center min-h-11 px-2 -ml-2 rounded-lg text-body-sm font-medium text-moss-600 hover:bg-moss-50 w-fit">
            Nieuwe vraag →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Hoofd-pagina ───────────────────────────────────────────────────────────────

export function VeldModusPagina() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const observaties = useDagboekStore((s) => s.observaties);
  const zones = useTuinStore((s) => s.tuin.zones);
  const taken = useTakenStore((s) => s.taken);
  const openTaken = useMemo(() => taken.filter((t) => t.status === "open"), [taken]);

  const [paneel, setPaneel] = useState<VeldPanel>(null);

  const vandaagOfVerlopen = useMemo(() => openTaken.filter(
    (t) => t.vervaldatum === null || t.vervaldatum <= VANDAAG,
  ), [openTaken]);
  const recenteObservaties = observaties.slice(0, 3);

  const zonesVoorUI = zones.map((z) => ({ id: z.id, naam: z.naam }));
  const zonesMetGemeente = zones.map((z) => ({ id: z.id, naam: z.naam, gemeente: z.gemeente }));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Connectie-status — altijd zichtbaar rechtsboven (Online · Offline) */}
      <div className="flex justify-end">
        <ConnectiePil online={online} />
      </div>

      {/* Header */}
      {!paneel && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-moss-100 flex items-center justify-center shrink-0">
            <Shovel size={20} className="text-moss-700" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-display-md text-moss-900 leading-tight">Veld-modus</h1>
            <p className="text-body text-[var(--gp-text-mute)] capitalize">{DATUM_LABEL}</p>
          </div>
        </div>
      )}

      {/* Active panel */}
      {paneel === "observatie" && (
        <ObservatiePaneel zones={zonesVoorUI} onTerug={() => setPaneel(null)} />
      )}
      {paneel === "taken" && (
        <TakenPaneel zones={zonesVoorUI} onTerug={() => setPaneel(null)} />
      )}
      {paneel === "plantid" && (
        <PlantIdPaneel onTerug={() => setPaneel(null)} />
      )}
      {paneel === "mijnzone" && (
        <MijnZonePaneel zones={zonesMetGemeente} onTerug={() => setPaneel(null)} />
      )}
      {paneel === "coach" && (
        <CoachPaneel onTerug={() => setPaneel(null)} online={online} />
      )}

      {/* Action tiles */}
      {!paneel && (
        <div className="grid grid-cols-2 gap-3">
          <ActieTegel icoon={Leaf} kleur="moss" titel="Observatie" omschrijving="Loggen wat je ziet" onClick={() => setPaneel("observatie")} />
          <ActieTegel icoon={ClipboardList} kleur="amber" titel="Taken" omschrijving="Afvinken & bijhouden" onClick={() => setPaneel("taken")} badge={vandaagOfVerlopen.length} />
          <ActieTegel icoon={ScanLine} kleur="sky" titel="Plant-ID" omschrijving="Foto identificeren" onClick={() => setPaneel("plantid")} />
          <ActieTegel icoon={Search} kleur="clay" titel="Zoeken" omschrijving="Plant opzoeken" onClick={() => navigate("/ontdek")} />
          <ActieTegel icoon={MapPin} kleur="moss" titel="Mijn zone" omschrijving="Vind via GPS" onClick={() => setPaneel("mijnzone")} />
          <ActieTegel icoon={Sparkles} kleur="bloom" titel="Vraag AI" omschrijving="Tuincoach" onClick={() => setPaneel("coach")} />
        </div>
      )}

      {/* Vandaag-taken overzicht */}
      {!paneel && vandaagOfVerlopen.length > 0 && (
        <section>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">
            Vandaag & verlopen · {vandaagOfVerlopen.length}
          </p>
          <ul className="space-y-2">
            {vandaagOfVerlopen.slice(0, 4).map((t) => {
              const verlopen = t.vervaldatum !== null && t.vervaldatum < VANDAAG;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--gp-border)] bg-white">
                  {verlopen
                    ? <AlertTriangle size={16} className="text-[var(--gp-rust-600)] shrink-0" aria-hidden />
                    : <div className="w-4 h-4 rounded-sm border-2 border-moss-400 shrink-0" aria-hidden />}
                  <p className="text-body-sm text-moss-900 flex-1 min-w-0 truncate">{t.titel}</p>
                  {verlopen && (
                    <span className="text-caption text-[var(--gp-rust-600)] font-medium shrink-0">verlopen</span>
                  )}
                </li>
              );
            })}
            {vandaagOfVerlopen.length > 4 && (
              <button onClick={() => setPaneel("taken")} className="text-caption text-moss-600 hover:underline pl-1">
                +{vandaagOfVerlopen.length - 4} meer tonen →
              </button>
            )}
          </ul>
        </section>
      )}

      {/* Recente observaties */}
      {!paneel && recenteObservaties.length > 0 && (
        <section>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">
            Recente observaties
          </p>
          <ul className="space-y-2">
            {recenteObservaties.map((o) => (
              <li key={o.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--gp-border)] bg-white">
                <span className="text-lg leading-none mt-0.5" aria-hidden>{OBSERVATIE_TYPE_ICOON[o.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-moss-900 truncate">{o.tekst}</p>
                  <p className="text-caption text-[var(--gp-text-mute)]">{o.datum}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lege staat */}
      {!paneel && recenteObservaties.length === 0 && vandaagOfVerlopen.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <Shovel size={32} className="text-moss-200 mb-3" aria-hidden />
          <p className="text-body-sm text-[var(--gp-text-mute)]">
            Nog niets gelogd vandaag. Tik op een actie om te starten.
          </p>
        </div>
      )}
    </div>
  );
}
