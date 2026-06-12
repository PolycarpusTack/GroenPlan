import { useState } from "react";
import {
  Sparkles, Loader2, Leaf, CalendarDays, LayoutGrid, Sprout,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Users,
} from "lucide-react";
import { getTuinOntwerpService } from "../services/tuinontwerp/tuinontwerp-service";
import { getAutoFillService } from "../services/autofill/autofill-service";
import { maakOnderhoudsTaken } from "../services/taken/maakOnderhoudsTaken";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import type { Zone } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";
import { Button } from "./ui";
import type { TuinOntwerpSuggestie, TuinOntwerpVoorstel } from "../services/tuinontwerp/types";

interface Props {
  zone: Zone;
  plantCatalog: Record<string, AutoFillResultaat>;
  hardheid: number;
}

const CATEGORIE_ICOON: Record<TuinOntwerpSuggestie["categorie"], React.ReactNode> = {
  plant:   <Leaf size={13} aria-hidden />,
  seizoen: <CalendarDays size={13} aria-hidden />,
  layout:  <LayoutGrid size={13} aria-hidden />,
  ecologie:<Sprout size={13} aria-hidden />,
};

const PRIORITEIT_STIJL: Record<TuinOntwerpSuggestie["prioriteit"], string> = {
  hoog:   "border-l-[var(--gp-rust-500)] bg-[var(--gp-rust-100)] text-[var(--gp-rust-700)]",
  midden: "border-l-moss-400 bg-moss-50 text-moss-700",
  laag:   "border-l-[var(--gp-border)] bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)]",
};

function MetriekenBalk({ metrics }: { metrics: TuinOntwerpVoorstel["metrics"] }) {
  const { bloeiDekking, companionConflicten, biodiversiteitScore } = metrics;
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="p-2 rounded-lg bg-moss-50 border border-moss-200">
        <div className="text-body-sm font-semibold text-moss-800">{bloeiDekking}/12</div>
        <div className="text-caption text-moss-600">Bloeidekking</div>
      </div>
      <div className={`p-2 rounded-lg border ${companionConflicten === 0 ? "bg-moss-50 border-moss-200" : "bg-amber-50 border-amber-200"}`}>
        <div className={`text-body-sm font-semibold ${companionConflicten === 0 ? "text-moss-800" : "text-amber-800"}`}>
          {companionConflicten === 0
            ? <CheckCircle2 size={14} className="inline" aria-hidden />
            : <AlertCircle size={14} className="inline" aria-hidden />}
          {" "}{companionConflicten}
        </div>
        <div className={`text-caption ${companionConflicten === 0 ? "text-moss-600" : "text-amber-700"}`}>Conflicten</div>
      </div>
      <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
        <div className="text-body-sm font-semibold text-sky-800">{biodiversiteitScore}</div>
        <div className="text-caption text-sky-600">Biodiversiteit</div>
      </div>
    </div>
  );
}

function VoorstelKaart({ voorstel, index, totaal }: { voorstel: TuinOntwerpVoorstel; index: number; totaal: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-0.5">
            Voorstel {index + 1} van {totaal}
          </p>
          <h3 className="font-display text-heading-lg text-moss-900">{voorstel.titel}</h3>
        </div>
      </div>

      <p className="text-body-sm text-moss-700">{voorstel.beschrijving}</p>

      {/* Plantenlijst */}
      <div>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-1.5">
          <Leaf size={11} className="inline mr-1" aria-hidden />
          Aanbevolen planten
        </p>
        <div className="flex flex-wrap gap-1.5">
          {voorstel.plantenLijst.map((naam) => (
            <span key={naam} className="text-caption italic px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 border border-moss-200">
              {naam}
            </span>
          ))}
        </div>
      </div>

      {/* Metriek balk */}
      <div>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-1.5">
          <Users size={11} className="inline mr-1" aria-hidden />
          Indicatoren
        </p>
        <MetriekenBalk metrics={voorstel.metrics} />
      </div>

      {/* Suggesties */}
      {voorstel.suggesties.length > 0 && (
        <ul className="space-y-1.5">
          {voorstel.suggesties.map((s, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 px-3 py-2 rounded-md border-l-2 text-body-sm ${PRIORITEIT_STIJL[s.prioriteit]}`}
            >
              <span className="shrink-0 mt-0.5">{CATEGORIE_ICOON[s.categorie]}</span>
              <span>{s.tekst}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AIArchitectPanel({ zone, plantCatalog, hardheid }: Props) {
  const voegPlantToeAanZone = useTuinStore((s) => s.voegPlantToeAanZone);
  const voegTaakToe = useTakenStore((s) => s.voegTaakToe);

  const [wens, setWens] = useState("");
  const [laden, setLaden] = useState(false);
  const [voorstellen, setVoorstellen] = useState<TuinOntwerpVoorstel[] | null>(null);
  const [bron, setBron] = useState<"ai" | "lokaal" | null>(null);
  const [actief, setActief] = useState(0);
  const [fout, setFout] = useState<string | null>(null);
  const [toegepast, setToegewezen] = useState<number | null>(null);
  const [toepassen, setToepassen] = useState(false);
  const [toepasResultaat, setToepasResultaat] = useState<{ toegevoegd: number; overgeslagen: number } | null>(null);

  const genereer = async () => {
    setLaden(true);
    setFout(null);
    setActief(0);
    setToegewezen(null);
    setToepasResultaat(null);
    try {
      const service = getTuinOntwerpService();
      const resultaat = await service.analyseer(zone, plantCatalog, hardheid, wens);
      setVoorstellen(resultaat.voorstellen ?? []);
      setBron(resultaat.bron ?? null);
    } catch {
      setFout("Genereren mislukt. Probeer opnieuw.");
    } finally {
      setLaden(false);
    }
  };

  // Past het actieve voorstel toe: voegt de aanbevolen planten toe aan de zone.
  // Planten die nog niet in de catalogus zitten worden via auto-fill opgehaald;
  // planten die al in de zone staan worden overgeslagen. Onderhoudstaken volgen mee.
  const pasToe = async () => {
    if (!voorstellen) return;
    const voorstel = voorstellen[actief];
    setToepassen(true);
    setFout(null);
    setToepasResultaat(null);
    try {
      const reedsAanwezig = new Set(
        zone.plantPlaatsingen.map((p) => p.wetenschappelijkeNaam.toLowerCase()),
      );
      let toegevoegd = 0;
      let overgeslagen = 0;
      for (const naam of voorstel.plantenLijst) {
        const sleutel = naam.trim().toLowerCase();
        if (!sleutel || reedsAanwezig.has(sleutel)) {
          overgeslagen++;
          continue;
        }
        const plant = plantCatalog[sleutel] ?? (await getAutoFillService().vulAan(naam));
        voegPlantToeAanZone(zone.id, plant);
        maakOnderhoudsTaken(plant, zone.id).forEach(voegTaakToe);
        reedsAanwezig.add(sleutel);
        toegevoegd++;
      }
      setToepasResultaat({ toegevoegd, overgeslagen });
      setToegewezen(actief);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Toepassen mislukt — kon plantdata niet ophalen.");
    } finally {
      setToepassen(false);
    }
  };

  const totaal = voorstellen?.length ?? 0;

  return (
    <div className="border border-[var(--gp-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[var(--gp-border)]">
        <Sparkles size={15} className="text-moss-600 shrink-0" aria-hidden />
        <span className="text-body-sm font-medium text-moss-900">AI Tuin Architect</span>
        <span className="text-caption text-[var(--gp-text-mute)] hidden sm:inline">· Claude Opus</span>
      </div>

      <div className="px-4 py-4 bg-[var(--gp-surface-alt)] space-y-3">
        {/* Wens-invoer */}
        {!voorstellen && (
          <>
            <div>
              <label htmlFor="ai-wens" className="text-caption text-moss-700 font-medium block mb-1">
                Beschrijf je wensen voor {zone.naam}
              </label>
              <textarea
                id="ai-wens"
                rows={3}
                value={wens}
                onChange={(e) => setWens(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) genereer(); }}
                placeholder="bijv. wilde tuin met veel kleur in de zomer, weinig onderhoud, aantrekkelijk voor vlinders…"
                className="w-full px-3 py-2 text-body-sm border border-[var(--gp-border)] rounded-lg
                           focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white resize-none"
                disabled={laden}
              />
              <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">Ctrl+Enter om te genereren</p>
            </div>

            <Button
              onClick={genereer}
              disabled={laden}
              className="flex items-center gap-2 disabled:opacity-60"
            >
              {laden
                ? <Loader2 size={14} className="animate-spin" aria-hidden />
                : <Sparkles size={14} aria-hidden />}
              {laden ? "Genereer 3 voorstellen…" : "Genereer ontwerp"}
            </Button>
          </>
        )}

        {/* Foutmelding */}
        {fout && (
          <p role="alert" className="text-body-sm text-[var(--gp-rust-700)] flex items-center gap-1.5">
            <AlertCircle size={14} aria-hidden /> {fout}
          </p>
        )}

        {/* Voorstellen */}
        {voorstellen && voorstellen.length > 0 && (
          <>
            <VoorstelKaart voorstel={voorstellen[actief]} index={actief} totaal={totaal} />

            {/* Paginering */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--gp-border)]">
              <Button
                variant="ghost"
                onClick={() => setActief((v) => Math.max(0, v - 1))}
                disabled={actief === 0}
                className="flex items-center gap-1 text-body-sm disabled:opacity-30"
              >
                <ChevronLeft size={14} aria-hidden /> Vorige
              </Button>

              <div className="flex gap-1.5">
                {voorstellen.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActief(i)}
                    aria-label={`Voorstel ${i + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === actief ? "bg-moss-600" : "bg-moss-200 hover:bg-moss-400"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={() => setActief((v) => Math.min(totaal - 1, v + 1))}
                disabled={actief === totaal - 1}
                className="flex items-center gap-1 text-body-sm disabled:opacity-30"
              >
                Volgende <ChevronRight size={14} aria-hidden />
              </Button>
            </div>

            {/* Acties */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={pasToe}
                disabled={toepassen || toegepast === actief}
                className={`gp-btn text-body-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-60 ${
                  toegepast === actief
                    ? "gp-btn-ghost text-moss-600"
                    : "gp-btn-primary"
                }`}
              >
                {toepassen
                  ? <><Loader2 size={13} className="animate-spin" aria-hidden /> Toepassen…</>
                  : toegepast === actief
                    ? <><CheckCircle2 size={13} aria-hidden /> Toegepast</>
                    : "Pas toe op zone"}
              </button>
              <Button
                variant="ghost"
                onClick={() => { setVoorstellen(null); setToegewezen(null); setToepasResultaat(null); }}
                disabled={toepassen}
                className="text-body-sm py-1.5 px-3 disabled:opacity-60"
              >
                Nieuw ontwerp
              </Button>
            </div>

            {/* Toepas-resultaat */}
            {toegepast === actief && toepasResultaat && (
              <p className="text-caption text-moss-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-moss-600" aria-hidden />
                {toepasResultaat.toegevoegd} plant{toepasResultaat.toegevoegd !== 1 ? "en" : ""} toegevoegd aan {zone.naam}
                {toepasResultaat.overgeslagen > 0 && `, ${toepasResultaat.overgeslagen} reeds aanwezig`}.
              </p>
            )}

            {/* Bron-disclaimer — eerlijk over AI vs. lokale reserve */}
            <div className="flex items-start gap-2 pt-2 border-t border-[var(--gp-border)]">
              <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
              {bron === "lokaal" ? (
                <p className="text-caption text-amber-700">
                  Lokaal voorbeeldontwerp — geen AI-verbinding beschikbaar. Deze aanbevelingen zijn
                  algemeen (op basis van de zon-oriëntatie), niet door AI op jouw zone afgestemd.
                </p>
              ) : (
                <p className="text-caption text-amber-700">
                  AI-suggestie via Claude Opus — controleer altijd of de aanbevolen planten passen bij jouw klimaat en grondsoort.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
