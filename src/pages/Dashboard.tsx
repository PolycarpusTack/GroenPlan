import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil, Check, X,
  AlertTriangle, CalendarCheck, BookOpen, Download, Upload,
  Plus, Camera, Bug, Bot, Sprout, Leaf,
  Scissors, Droplets, Search, Apple,
} from "lucide-react";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import { useDagboekStore, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import { berekenBegeleidersCheck } from "../domain/tuin/berekenBegeleidersCheck";
import { berekenZoneAandacht } from "../domain/tuin/berekenZoneAandacht";
import { berekenTuinGezondheid, berekenBiodiversiteit } from "../domain/tuin/berekenScores";
import { bepaalTaakType, TAAK_TYPE_LABEL, type TaakType } from "../domain/taken/taakType";

const TAAK_TYPE_ICOON: Record<TaakType, React.ReactNode> = {
  snoei:    <Scissors size={13} className="text-moss-600" aria-hidden />,
  water:    <Droplets size={13} className="text-sky-600" aria-hidden />,
  voeding:  <Sprout size={13} className="text-moss-600" aria-hidden />,
  controle: <Search size={13} className="text-amber-600" aria-hidden />,
  oogst:    <Apple size={13} className="text-amber-600" aria-hidden />,
  overig:   <CalendarCheck size={13} className="text-[var(--gp-text-mute)]" aria-hidden />,
};

const TAAK_PILL_KLASSE: Record<TaakType, string> = {
  snoei:    "bg-moss-50 text-moss-700 border-moss-200",
  water:    "bg-sky-50 text-sky-700 border-sky-200",
  voeding:  "bg-moss-50 text-moss-700 border-moss-200",
  controle: "bg-amber-50 text-amber-700 border-amber-200",
  oogst:    "bg-amber-50 text-amber-700 border-amber-200",
  overig:   "bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)] border-[var(--gp-border)]",
};
import { WeerWidget } from "../components/WeerWidget";
import type { ObservatieType } from "../domain/dagboek/types";
import { Button, StatCard } from "../components/ui";

function begroeting(): string {
  const uur = new Date().getHours();
  if (uur < 12) return "Goedemorgen";
  if (uur < 18) return "Goedemiddag";
  return "Goedenavond";
}

function zoneGradient(grondsoort: string): string {
  const map: Record<string, string> = {
    clay: "bg-gradient-to-br from-amber-100 to-clay-400",
    sand: "bg-gradient-to-br from-amber-100 to-amber-300",
    loam: "bg-gradient-to-br from-moss-100 to-moss-300",
    chalk: "bg-gradient-to-br from-surface-alt to-moss-100",
    peat: "bg-gradient-to-br from-clay-200 to-clay-600",
  };
  return map[grondsoort] ?? "bg-gradient-to-br from-moss-100 to-moss-200";
}

const OBSERVATIE_BOX: Record<ObservatieType, string> = {
  bloei: "bg-bloom-100", groei: "bg-moss-100", plaag: "bg-rust-100",
  ziekte: "bg-amber-100", snoei: "bg-moss-100", bemesting: "bg-clay-100",
  overwintering: "bg-sky-100", overig: "bg-[var(--gp-surface-alt)]",
};

function huidigSeizoen(): { naam: string; icoon: string; tip: string } {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return { naam: "Lente", icoon: "🌱", tip: "Goed moment om vaste planten te verdelen en nieuwe exemplaren in te planten na de laatste nachtvorst." };
  if (m >= 6 && m <= 8) return { naam: "Zomer", icoon: "☀️", tip: "Controleer regelmatig op droogte, mulch rondom planten en pak onkruid vroegtijdig aan." };
  if (m >= 9 && m <= 11) return { naam: "Herfst", icoon: "🍂", tip: "Plant bollen voor het voorjaar, snoei afgestorven stengels en prepareer vorstgevoelige planten." };
  return { naam: "Winter", icoon: "❄️", tip: "Bescherm vorstgevoelige planten met mulch en maak plannen voor de komende lentebeplanting." };
}

function vandaagIso(): string { return new Date().toISOString().slice(0, 10); }
function overSevenDays(): string {
  const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10);
}

function huidigDatumLabel(): string {
  return new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

// Eenvoudige SVG donut — geen externe dependency
function GezondheidDonut({ score }: { score: number }) {
  const r = 36;
  const omtrek = 2 * Math.PI * r;
  const gevuld = (score / 100) * omtrek;
  const kleur = score >= 70 ? "#4a7c59" : score >= 40 ? "#f59e0b" : "#dc2626";
  return (
    <svg viewBox="0 0 88 88" className="w-20 h-20" aria-hidden>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={kleur} strokeWidth="8"
        strokeDasharray={`${gevuld} ${omtrek - gevuld}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="middle"
            fontSize="18" fontWeight="700" fill={kleur} fontFamily="Fraunces, serif">
        {score}
      </text>
    </svg>
  );
}

// Mini bloeikalender: bloeiende soorten per zone over de komende 4 maanden
// (maand-granulariteit — fijner laat de plantdata niet toe).
const MAANDEN_KORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

function MiniBloeikalender({ rijen }: { rijen: { naam: string; perMaand: Record<number, number> }[] }) {
  const huidig = new Date().getMonth() + 1; // 1-12
  const zichtbaar = Array.from({ length: 4 }, (_, i) => ((huidig - 1 + i) % 12) + 1);

  if (rijen.length === 0) {
    return (
      <p className="text-caption text-[var(--gp-text-mute)] py-2">
        Voeg planten toe om bloei te zien.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-caption border-collapse">
        <thead>
          <tr>
            <th className="text-left pb-1 pr-2 font-normal text-[var(--gp-text-mute)] w-28" />
            {zichtbaar.map((m) => (
              <th key={m}
                  className={`text-center pb-1 font-medium w-10 uppercase tracking-wide
                    ${m === huidig ? "text-moss-700" : "text-[var(--gp-text-mute)]"}`}>
                {MAANDEN_KORT[m - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((rij, ri) => (
            <tr key={ri}>
              <td className="pr-2 py-0.5 truncate max-w-[7rem] text-moss-900 text-caption font-medium">
                {rij.naam}
              </td>
              {zichtbaar.map((m) => {
                const telling = rij.perMaand[m] ?? 0;
                return (
                  <td key={m} className="py-0.5 text-center">
                    {telling > 0 ? (
                      <span
                        className="inline-flex items-center justify-center w-6 h-4 rounded-sm text-[9px] font-semibold text-white"
                        style={{ backgroundColor: "#7c3aed", opacity: Math.min(0.4 + telling * 0.2, 0.95) }}
                        title={`${telling} bloeiende soort${telling !== 1 ? "en" : ""}`}
                      >
                        {telling}
                      </span>
                    ) : (
                      <span className="inline-block w-6 h-4 rounded-sm bg-[var(--gp-border)]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPagina() {
  const navigate = useNavigate();
  const tuin = useTuinStore((s) => s.tuin);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);
  const hernoem = useTuinStore((s) => s.hernoem);
  const setHardheid = useTuinStore((s) => s.setHardheid);

  const taken = useTakenStore((s) => s.taken);
  const toggleStatus = useTakenStore((s) => s.toggleStatus);
  const observaties = useDagboekStore((s) => s.observaties);
  const laadTuin = useTuinStore((s) => s.laadTuin);
  const laadTaken = useTakenStore((s) => s.laadTaken);
  const laadObservaties = useDagboekStore((s) => s.laadObservaties);

  const weerGemeente = tuin.zones.find((z) => z.gemeente)?.gemeente ?? null;
  const seizoen = huidigSeizoen();
  const vandaag = vandaagIso();
  const over7 = overSevenDays();

  const openTaken = taken.filter((t) => t.status === "open");
  const achterstallig = openTaken.filter((t) => t.vervaldatum && t.vervaldatum < vandaag);
  const dezeWeek = openTaken.filter((t) => t.vervaldatum && t.vervaldatum >= vandaag && t.vervaldatum <= over7);

  const zonesMetConflict = useMemo(() =>
    tuin.zones.filter((z) => berekenBegeleidersCheck(z.plantPlaatsingen, plantCatalog).some((r) => r.relatie === "slecht")),
    [tuin.zones, plantCatalog],
  );

  // Aandachtspunten per zone (droogte, achterstallig) + begeleidersconflicten
  const zoneAandacht = useMemo(
    () => berekenZoneAandacht(tuin.zones, taken, vandaag),
    [tuin.zones, taken, vandaag],
  );
  const aandachtZones = useMemo(() =>
    tuin.zones
      .map((z) => {
        const punten = [...(zoneAandacht[z.id] ?? [])];
        if (zonesMetConflict.some((c) => c.id === z.id)) punten.push("Begeleidersconflict");
        return { zone: z, punten };
      })
      .filter(({ punten }) => punten.length > 0),
    [tuin.zones, zoneAandacht, zonesMetConflict],
  );

  // Recent actief: plant-plaatsingen, voltooide taken en observaties, nieuwste eerst.
  const recentActief = useMemo(() => {
    const feed: { datum: string; icoon: React.ReactNode; tekst: string; doel: string }[] = [];
    for (const z of tuin.zones) {
      for (const p of z.plantPlaatsingen) {
        feed.push({
          datum: new Date(p.geplaatst).toISOString().slice(0, 10),
          icoon: <Leaf size={13} className="text-moss-600" aria-hidden />,
          tekst: `${p.wetenschappelijkeNaam} toegevoegd aan ${z.naam}`,
          doel: "/tuinkaart",
        });
      }
    }
    for (const t of taken) {
      if (t.status === "klaar" && t.voltooidOp) {
        feed.push({
          datum: t.voltooidOp,
          icoon: <Check size={13} className="text-moss-600" aria-hidden />,
          tekst: `Taak "${t.titel}" voltooid`,
          doel: "/taken",
        });
      }
    }
    for (const o of observaties) {
      feed.push({
        datum: o.datum,
        icoon: <BookOpen size={13} className="text-clay-600" aria-hidden />,
        tekst: o.tekst,
        doel: "/dagboek",
      });
    }
    return feed.sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 5);
  }, [tuin.zones, taken, observaties]);

  const tuinGezondheid = useMemo(() =>
    berekenTuinGezondheid(tuin, taken, plantCatalog), [tuin, taken, plantCatalog]);

  const biodiversiteit = useMemo(() =>
    berekenBiodiversiteit(tuin, plantCatalog), [tuin, plantCatalog]);

  const aantalPlanten = tuin.zones.reduce((s, z) => s + z.plantPlaatsingen.length, 0);

  // Mini bloeikalender: bloeiende soorten per zone in de komende 4 maanden
  const miniBloeiRijen = useMemo(() => {
    const huidig = new Date().getMonth() + 1;
    const komendeMaanden = Array.from({ length: 4 }, (_, i) => ((huidig - 1 + i) % 12) + 1);
    return tuin.zones
      .filter((z) => z.plantPlaatsingen.length > 0)
      .map((z) => {
        const perMaand: Record<number, number> = Object.fromEntries(komendeMaanden.map((m) => [m, 0]));
        const geteld = new Set<string>();
        for (const p of z.plantPlaatsingen) {
          const sleutel = p.wetenschappelijkeNaam.toLowerCase();
          if (geteld.has(sleutel)) continue;
          geteld.add(sleutel);
          const plant = plantCatalog[sleutel];
          if (!plant) continue;
          for (const m of plant.bloei.maanden.waarde) {
            if (m in perMaand) perMaand[m]++;
          }
        }
        return { naam: z.naam, perMaand };
      })
      .filter((r) => Object.values(r.perMaand).some((c) => c > 0))
      .slice(0, 6);
  }, [tuin.zones, plantCatalog]);

  const [bewerkModus, setBewerkModus] = useState(false);
  const [bewerkNaam, setBewerkNaam] = useState(tuin.naam);
  const [bewerkHardheid, setBewerkHardheid] = useState(String(tuin.hardheid));
  const [fout, setFout] = useState<string | null>(null);
  const [importFout, setImportFout] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const openBewerken = () => { setBewerkNaam(tuin.naam); setBewerkHardheid(String(tuin.hardheid)); setFout(null); setBewerkModus(true); };
  const opslaan = () => {
    const naam = bewerkNaam.trim();
    if (!naam) { setFout("Naam mag niet leeg zijn."); return; }
    const hardheid = parseInt(bewerkHardheid, 10);
    if (isNaN(hardheid) || hardheid < 1 || hardheid > 13) { setFout("USDA-zone moet tussen 1 en 13 liggen."); return; }
    hernoem(naam); setHardheid(hardheid); setBewerkModus(false);
  };
  const annuleer = () => { setBewerkModus(false); setFout(null); };

  const exporteer = () => {
    const data = JSON.stringify({ versie: 2, geexporteerd: new Date().toISOString(), tuin: useTuinStore.getState().tuin, plantCatalog: useTuinStore.getState().plantCatalog, taken: useTakenStore.getState().taken, observaties: useDagboekStore.getState().observaties }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `groenplan-backup-${vandaag}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBestand = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    setImportFout(null); setImportOk(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.tuin || !json.taken) throw new Error("Ongeldig backup-bestand.");
        laadTuin(json.tuin, json.plantCatalog ?? {}); laadTaken(json.taken);
        if (json.observaties) laadObservaties(json.observaties);
        setImportOk(true);
      } catch { setImportFout("Kon bestand niet inlezen. Controleer of dit een geldig GroenPlan-backup is."); }
      if (importRef.current) importRef.current.value = "";
    };
    reader.readAsText(bestand);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      {/* ── Header ── */}
      {bewerkModus ? (
        <div className="mb-8 p-4 border border-[var(--gp-border)] rounded-xl bg-[var(--gp-surface-alt)]">
          {fout && <p role="alert" className="mb-3 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">{fout}</p>}
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-body-sm font-medium text-moss-900 mb-1 block">Tuinnaam</label>
              <input type="text" value={bewerkNaam} onChange={(e) => { setBewerkNaam(e.target.value); setFout(null); }}
                className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md focus:outline-none focus:shadow-[var(--gp-shadow-focus)]" autoFocus />
            </div>
            <div className="w-32">
              <label className="text-body-sm font-medium text-moss-900 mb-1 block">USDA-zone</label>
              <input type="number" value={bewerkHardheid} onChange={(e) => { setBewerkHardheid(e.target.value); setFout(null); }}
                min={1} max={13} className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md focus:outline-none focus:shadow-[var(--gp-shadow-focus)]" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={opslaan} className="flex items-center gap-1.5"><Check size={15} aria-hidden /> Opslaan</Button>
            <Button variant="secondary" onClick={annuleer} className="flex items-center gap-1.5"><X size={15} aria-hidden /> Annuleer</Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md text-moss-900 mb-1">
              {begroeting()} <span aria-hidden>{seizoen.icoon}</span>
            </h1>
            <p className="text-body text-moss-500">{tuin.naam} · Hardheidszone {tuin.hardheid}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-caption text-[var(--gp-text-mute)] hidden sm:block">{huidigDatumLabel()}</span>
              <Button variant="ghost" onClick={openBewerken} className="p-1.5 text-[var(--gp-text-mute)] hover:text-moss-700" aria-label="Tuininstellingen bewerken">
                <Pencil size={16} aria-hidden />
              </Button>
            </div>
            <WeerWidget gemeente={weerGemeente} />
          </div>
        </div>
      )}

      {/* ── Stats strip (4 cijfers) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard waarde={String(tuin.zones.length)} label="Zones" onClick={() => navigate("/tuinkaart")} />
        <StatCard waarde={String(aantalPlanten)} label="Planten" onClick={() => navigate("/catalogus")} />
        <StatCard
          waarde={biodiversiteit > 0 ? `${biodiversiteit}` : "—"}
          label="Biodiversiteit"
          sublabel="/100"
          kleur={biodiversiteit >= 60 ? "text-moss-700" : biodiversiteit >= 30 ? "text-amber-600" : "text-[var(--gp-text-mute)]"}
        />
        <StatCard
          waarde={tuinGezondheid > 0 ? `${tuinGezondheid}` : "—"}
          label="Tuin gezondheid"
          sublabel="/100"
          kleur={tuinGezondheid >= 70 ? "text-moss-700" : tuinGezondheid >= 40 ? "text-amber-600" : "text-[var(--gp-rust-700)]"}
        />
      </div>

      {/* ── Rij 2: Taken · Aandachtspunten · Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Kolom 1: Vandaag te doen */}
        <div className="gp-card-bordered flex flex-col">
          <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <CalendarCheck size={14} aria-hidden /> Vandaag te doen
          </h2>
          {achterstallig.length > 0 && (
            <button onClick={() => navigate("/taken")}
              className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-[var(--gp-rust-100)] border border-[var(--gp-rust-300)] text-left hover:shadow-sm w-full">
              <AlertTriangle size={13} className="text-[var(--gp-rust-700)] shrink-0" aria-hidden />
              <span className="text-caption text-[var(--gp-rust-700)] font-medium">
                {achterstallig.length} achterstallig{achterstallig.length !== 1 ? "e" : ""}
              </span>
            </button>
          )}
          {dezeWeek.length === 0 && achterstallig.length === 0 ? (
            <p className="text-caption text-[var(--gp-text-mute)] flex-1 flex items-center">Geen taken deze week.</p>
          ) : (
            <ul className="space-y-1.5 flex-1">
              {dezeWeek.slice(0, 4).map((t) => {
                const type = bepaalTaakType(t.titel);
                const zoneNaam = t.zoneId ? tuin.zones.find((z) => z.id === t.zoneId)?.naam : null;
                return (
                  <li key={t.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleStatus(t.id)}
                      aria-label={`Vink af: ${t.titel}`}
                      className="shrink-0 accent-moss-700 cursor-pointer"
                    />
                    <span className="shrink-0" aria-hidden>{TAAK_TYPE_ICOON[type]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-body-sm text-moss-900 leading-tight">{t.titel}</span>
                      <span className="block text-caption text-[var(--gp-text-mute)] leading-tight">
                        {t.vervaldatum!.slice(5)}{zoneNaam && ` · ${zoneNaam}`}
                      </span>
                    </span>
                    {type !== "overig" && (
                      <span className={`shrink-0 text-caption px-1.5 py-px rounded-full border ${TAAK_PILL_KLASSE[type]}`}>
                        {TAAK_TYPE_LABEL[type]}
                      </span>
                    )}
                  </li>
                );
              })}
              {dezeWeek.length > 4 && (
                <li className="text-caption text-moss-600">+{dezeWeek.length - 4} meer</li>
              )}
            </ul>
          )}
          <button onClick={() => navigate("/taken")} className="mt-3 text-caption text-moss-600 hover:underline text-left">
            Alle taken bekijken →
          </button>
        </div>

        {/* Kolom 2: Zones met aandacht */}
        <div className="gp-card-bordered flex flex-col">
          <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={14} aria-hidden /> Zones met aandacht
          </h2>
          {aandachtZones.length === 0 ? (
            <p className="text-caption text-moss-600 flex-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-moss-400" aria-hidden /> Geen aandachtspunten
            </p>
          ) : (
            <ul className="space-y-2 flex-1">
              {aandachtZones.slice(0, 3).map(({ zone: z, punten }) => (
                <li key={z.id}>
                  <button onClick={() => navigate("/tuinkaart")}
                    className="flex items-center gap-2.5 w-full text-left hover:text-moss-700">
                    <span className={`w-9 h-9 rounded-md shrink-0 flex items-center justify-center ${zoneGradient(z.grondsoort)}`} aria-hidden>
                      <Sprout size={15} className="text-moss-700" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-body-sm font-medium text-moss-900 truncate leading-tight">{z.naam}</span>
                      <span className="block text-caption text-amber-800 truncate leading-tight">{punten[0]}{punten.length > 1 && ` (+${punten.length - 1})`}</span>
                    </span>
                    <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-hidden />
                  </button>
                </li>
              ))}
              {aandachtZones.length > 3 && (
                <li className="text-caption text-moss-600">+{aandachtZones.length - 3} meer zones</li>
              )}
            </ul>
          )}
          <button onClick={() => navigate("/tuinkaart")} className="mt-3 text-caption text-moss-600 hover:underline text-left">
            Tuinkaart bekijken →
          </button>
        </div>

        {/* Kolom 3: Quick Actions */}
        <div className="gp-card-bordered flex flex-col">
          <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">
            Snelle acties
          </h2>
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => navigate("/ontdek")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-moss-600 hover:bg-moss-700 text-white transition-colors text-left"
            >
              <Plus size={16} className="shrink-0" aria-hidden />
              <span className="text-body-sm font-medium">Plant toevoegen</span>
            </button>
            <button onClick={() => navigate("/taken")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--gp-border)] hover:bg-[var(--gp-surface-alt)] transition-colors text-left">
              <CalendarCheck size={15} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900">Taak toevoegen</span>
            </button>
            <button onClick={() => navigate("/dagboek")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--gp-border)] hover:bg-[var(--gp-surface-alt)] transition-colors text-left">
              <BookOpen size={15} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900">Observatie loggen</span>
            </button>
            <button onClick={() => navigate("/ontdek")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--gp-border)] hover:bg-[var(--gp-surface-alt)] transition-colors text-left">
              <Camera size={15} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900">Foto toevoegen</span>
            </button>
            <button onClick={() => navigate("/ontdek")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--gp-border)] hover:bg-[var(--gp-surface-alt)] transition-colors text-left">
              <Bug size={15} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900">Plagen detecteren</span>
            </button>
            <button onClick={() => navigate("/ontdek")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--gp-border)] hover:bg-[var(--gp-surface-alt)] transition-colors text-left">
              <Bot size={15} className="text-moss-600 shrink-0" aria-hidden />
              <span className="text-body-sm text-moss-900">Vraag aan AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Rij 3: Mini bloeikalender · Tuin gezondheid ── */}
      {aantalPlanten > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Mini bloeikalender (2 kolommen breed) */}
          <div className="lg:col-span-2 gp-card-bordered">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide">
                Bloei per zone · komende maanden
              </h2>
              <button onClick={() => navigate("/kalender")} className="text-caption text-moss-600 hover:underline">
                Volledige kalender →
              </button>
            </div>
            <MiniBloeikalender rijen={miniBloeiRijen} />
          </div>

          {/* Tuin gezondheid donut */}
          <div className="gp-card-bordered flex flex-col items-center justify-center gap-3 text-center">
            <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide">
              Tuin gezondheid
            </h2>
            <GezondheidDonut score={tuinGezondheid} />
            <div className="space-y-1 text-caption text-[var(--gp-text-mute)]">
              <p>Begeleiders: <span className="text-moss-700 font-medium">{zonesMetConflict.length === 0 ? "✓ ok" : `${zonesMetConflict.length} conflict${zonesMetConflict.length !== 1 ? "en" : ""}`}</span></p>
              <p>Bloeispreiding: <span className="text-moss-700 font-medium">{miniBloeiRijen.length > 0 ? "actief" : "beperkt"}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Recente observaties ── */}
      {observaties.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={14} aria-hidden /> Laatste observaties
            </h2>
            <button onClick={() => navigate("/dagboek")} className="text-caption text-moss-600 hover:underline">
              Alle observaties →
            </button>
          </div>
          <ul className="space-y-2">
            {[...observaties].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 3).map((o) => (
              <li key={o.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-md border border-[var(--gp-border)] bg-white hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate("/dagboek")} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate("/dagboek")}>
                <div className={`w-9 h-9 rounded-md shrink-0 flex items-center justify-center text-base ${OBSERVATIE_BOX[o.type]}`} aria-hidden>
                  {OBSERVATIE_TYPE_ICOON[o.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-moss-900 truncate">{o.tekst}</p>
                  <p className="text-caption text-[var(--gp-text-mute)]">{o.datum}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Mijn zones ── */}
      {tuin.zones.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide flex items-center gap-2">
              <Sprout size={14} aria-hidden /> Mijn zones · {tuin.zones.length}
            </h2>
            <button onClick={() => navigate("/tuinkaart")} className="text-caption text-moss-600 hover:underline">
              Beheer →
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tuin.zones.slice(0, 6).map((z) => {
              const heeftConflict = zonesMetConflict.some((c) => c.id === z.id);
              return (
                <li key={z.id}>
                  <button className="w-full flex items-center gap-3 gp-card-bordered hover:shadow-md transition-shadow text-left"
                    onClick={() => navigate("/tuinkaart")}>
                    <div className={`w-12 h-12 rounded-md shrink-0 flex items-center justify-center ${zoneGradient(z.grondsoort)}`}>
                      <Sprout size={18} className="text-moss-700" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-moss-900 truncate">{z.naam}</p>
                      <p className="text-caption text-[var(--gp-text-mute)]">
                        {z.plantPlaatsingen.length} plant{z.plantPlaatsingen.length !== 1 ? "en" : ""}
                      </p>
                    </div>
                    {heeftConflict && <AlertTriangle size={14} className="text-amber-500 shrink-0" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          {tuin.zones.length > 6 && (
            <button onClick={() => navigate("/tuinkaart")} className="mt-2 text-caption text-moss-600 hover:underline pl-1">
              +{tuin.zones.length - 6} meer zones →
            </button>
          )}
        </section>
      )}

      {/* ── Seizoenstip ── */}
      <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-moss-50 border border-moss-200">
        <span className="text-2xl shrink-0 mt-0.5" aria-hidden>{seizoen.icoon}</span>
        <div>
          <p className="text-body-sm font-medium text-moss-800 mb-0.5">{seizoen.naam}tip</p>
          <p className="text-body-sm text-moss-700">{seizoen.tip}</p>
        </div>
      </div>

      {/* ── Recent actief in je tuin ── */}
      {recentActief.length > 0 && (
        <div className="mb-6">
          <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Recent actief in je tuin</h2>
          <ul className="space-y-1.5">
            {recentActief.map((e, i) => (
              <li key={i}>
                <button
                  onClick={() => navigate(e.doel)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md border border-[var(--gp-border)] bg-white text-left hover:shadow-sm transition-shadow"
                >
                  <span className="w-7 h-7 rounded-full bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] flex items-center justify-center shrink-0" aria-hidden>
                    {e.icoon}
                  </span>
                  <span className="flex-1 min-w-0 text-body-sm text-moss-900 truncate">{e.tekst}</span>
                  <span className="text-caption text-[var(--gp-text-mute)] shrink-0">{e.datum}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Gegevens export/import ── */}
      <div className="pt-6 border-t border-[var(--gp-border)]">
        <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">Gegevens</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exporteer} className="flex items-center gap-2 text-body-sm">
            <Download size={14} aria-hidden /> Exporteer backup
          </Button>
          <Button variant="secondary" onClick={() => { setImportFout(null); setImportOk(false); importRef.current?.click(); }}
            className="flex items-center gap-2 text-body-sm">
            <Upload size={14} aria-hidden /> Importeer backup
          </Button>
          <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportBestand} />
        </div>
        {importFout && <p role="alert" className="mt-3 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">{importFout}</p>}
        {importOk && <p role="status" className="mt-3 text-body-sm text-moss-700 bg-moss-50 px-3 py-2 rounded-md border border-moss-200">Gegevens succesvol geladen.</p>}
      </div>
    </div>
  );
}

