import { useEffect, useRef, useState } from "react";
import {
  Settings, Check, Download, Upload, Trash2, Sparkles, Camera,
  CloudSun, WifiOff, ShieldCheck, CircleCheck, CircleAlert, Loader2,
} from "lucide-react";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import { useDagboekStore } from "../store/dagboek-store";
import { Button } from "../components/ui";

// Eén bron van waarheid voor alle persist-sleutels (zie de stores).
const PERSIST_SLEUTELS = [
  "groenplan-tuin", "groenplan-taken", "groenplan-dagboek",
  "groenplan-bodem", "groenplan-zaadbank", "groenplan-zoek",
];

interface ServiceStatus {
  anthropic: boolean;
  plantnet: boolean;
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="gp-card-bordered mb-4">
      <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-4">{titel}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ ok, okLabel, fallbackLabel }: { ok: boolean | null; okLabel: string; fallbackLabel: string }) {
  if (ok === null) {
    return (
      <span className="flex items-center gap-1 text-caption text-[var(--gp-text-mute)]">
        <WifiOff size={12} aria-hidden /> Status onbekend
      </span>
    );
  }
  return ok ? (
    <span className="flex items-center gap-1 text-caption text-moss-700 bg-moss-50 border border-moss-200 rounded-full px-2 py-0.5">
      <CircleCheck size={12} aria-hidden /> {okLabel}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-caption text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <CircleAlert size={12} aria-hidden /> {fallbackLabel}
    </span>
  );
}

export function InstellingenPagina() {
  const tuin = useTuinStore((s) => s.tuin);
  const hernoem = useTuinStore((s) => s.hernoem);
  const setHardheid = useTuinStore((s) => s.setHardheid);
  const laadTuin = useTuinStore((s) => s.laadTuin);
  const laadTaken = useTakenStore((s) => s.laadTaken);
  const laadObservaties = useDagboekStore((s) => s.laadObservaties);

  // Tuin-instellingen
  const [naam, setNaam] = useState(tuin.naam);
  const [hardheid, setHardheidVeld] = useState(String(tuin.hardheid));
  const [tuinFout, setTuinFout] = useState<string | null>(null);
  const [tuinOk, setTuinOk] = useState(false);

  // Diensten-status (null = nog niet bekend / endpoint onbereikbaar)
  const [status, setStatus] = useState<ServiceStatus | null | "laden">("laden");

  // Gegevensbeheer
  const [importFout, setImportFout] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);
  const [bevestigWissen, setBevestigWissen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let actief = true;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (actief) setStatus(json && typeof json.anthropic === "boolean" ? json : null); })
      .catch(() => { if (actief) setStatus(null); });
    return () => { actief = false; };
  }, []);

  const slaTuinOp = () => {
    setTuinOk(false);
    const schoneNaam = naam.trim();
    if (!schoneNaam) { setTuinFout("Naam mag niet leeg zijn."); return; }
    const h = parseInt(hardheid, 10);
    if (isNaN(h) || h < 1 || h > 13) { setTuinFout("USDA-zone moet tussen 1 en 13 liggen."); return; }
    hernoem(schoneNaam);
    setHardheid(h);
    setTuinFout(null);
    setTuinOk(true);
  };

  const exporteer = () => {
    const data = JSON.stringify({
      versie: 2,
      geexporteerd: new Date().toISOString(),
      tuin: useTuinStore.getState().tuin,
      plantCatalog: useTuinStore.getState().plantCatalog,
      taken: useTakenStore.getState().taken,
      observaties: useDagboekStore.getState().observaties,
    }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groenplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
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
        laadTuin(json.tuin, json.plantCatalog ?? {});
        laadTaken(json.taken);
        if (json.observaties) laadObservaties(json.observaties);
        setImportOk(true);
      } catch {
        setImportFout("Kon bestand niet inlezen. Controleer of dit een geldig GroenPlan-backup is.");
      }
      if (importRef.current) importRef.current.value = "";
    };
    reader.readAsText(bestand);
  };

  const wisAlles = () => {
    PERSIST_SLEUTELS.forEach((sleutel) => localStorage.removeItem(sleutel));
    // Herladen zodat alle stores met hun beginstand opstarten (incl. IndexedDB-hydratie).
    window.location.assign("/");
  };

  const DIENSTEN = [
    {
      Icoon: Sparkles,
      naam: "Claude (Anthropic)",
      gebruik: "Plant auto-fill · AI Tuin Architect · plagendetectie · tuincoach",
      ok: status === "laden" ? null : status === null ? null : status.anthropic,
      envVar: "ANTHROPIC_API_KEY",
    },
    {
      Icoon: Camera,
      naam: "PlantNet",
      gebruik: "Plantherkenning via foto",
      ok: status === "laden" ? null : status === null ? null : status.plantnet,
      envVar: "PLANTNET_API_KEY",
    },
    {
      Icoon: CloudSun,
      naam: "Open-Meteo",
      gebruik: "Weer en neerslag (5-daagse voorspelling)",
      ok: true,
      envVar: null,
    },
  ] as const;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Settings size={22} className="text-moss-700" aria-hidden />
        <h1 className="font-display text-display-md text-moss-900">Instellingen</h1>
      </div>
      <p className="text-body text-moss-500 mb-6">Tuin, AI-diensten, gegevens en privacy.</p>

      {/* ── Tuin ── */}
      <Sectie titel="Tuin">
        {tuinFout && (
          <p role="alert" className="mb-3 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">{tuinFout}</p>
        )}
        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex-1 min-w-48">
            <span className="text-body-sm font-medium text-moss-900 mb-1 block">Tuinnaam</span>
            <input
              type="text"
              value={naam}
              onChange={(e) => { setNaam(e.target.value); setTuinFout(null); setTuinOk(false); }}
              className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
          </label>
          <label className="w-32">
            <span className="text-body-sm font-medium text-moss-900 mb-1 block">USDA-zone</span>
            <input
              type="number"
              value={hardheid}
              min={1} max={13}
              onChange={(e) => { setHardheidVeld(e.target.value); setTuinFout(null); setTuinOk(false); }}
              className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
          </label>
          <Button onClick={slaTuinOp} className="flex items-center gap-1.5">
            <Check size={15} aria-hidden /> Opslaan
          </Button>
        </div>
        {tuinOk && <p role="status" className="mt-2 text-caption text-moss-700">Opgeslagen.</p>}
        <p className="mt-2 text-caption text-[var(--gp-text-mute)]">
          Zones, afmetingen en gemeente (voor neerslag) beheer je per zone op de Tuinkaart.
        </p>
      </Sectie>

      {/* ── AI & diensten ── */}
      <Sectie titel="AI & diensten">
        <ul className="space-y-3">
          {DIENSTEN.map(({ Icoon, naam: dienstNaam, gebruik, ok, envVar }) => (
            <li key={dienstNaam} className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-md bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] flex items-center justify-center shrink-0" aria-hidden>
                {status === "laden" && envVar !== null
                  ? <Loader2 size={14} className="animate-spin text-[var(--gp-text-mute)]" />
                  : <Icoon size={14} className="text-moss-700" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-sm font-medium text-moss-900">{dienstNaam}</span>
                  <StatusBadge
                    ok={ok}
                    okLabel={envVar === null ? "Actief (geen sleutel nodig)" : "Sleutel geconfigureerd"}
                    fallbackLabel="Geen sleutel — lokale fallback"
                  />
                </span>
                <span className="block text-caption text-[var(--gp-text-mute)]">{gebruik}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 rounded-md bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] text-caption text-[var(--gp-text-mute)] space-y-1">
          <p>
            API-sleutels staan veilig <strong className="text-moss-800">server-side in het <code>.env</code>-bestand</strong>{" "}
            (<code>ANTHROPIC_API_KEY</code>, <code>PLANTNET_API_KEY</code>) en verlaten de server nooit — ze zijn hier
            daarom niet instelbaar of zichtbaar. Herstart <code>npm run dev</code> na een wijziging.
          </p>
          <p>
            Zonder sleutel blijven alle functies werken via een <strong className="text-moss-800">eerlijk gelabelde lokale fallback</strong>;
            alleen plant auto-fill vereist echte AI (anti-hallucination: er wordt nooit plantdata verzonnen).
          </p>
        </div>
      </Sectie>

      {/* ── Gegevens ── */}
      <Sectie titel="Gegevens">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exporteer} className="flex items-center gap-2 text-body-sm">
            <Download size={14} aria-hidden /> Exporteer backup
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setImportFout(null); setImportOk(false); importRef.current?.click(); }}
            className="flex items-center gap-2 text-body-sm"
          >
            <Upload size={14} aria-hidden /> Importeer backup
          </Button>
          <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportBestand} />
        </div>
        {importFout && <p role="alert" className="mt-3 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">{importFout}</p>}
        {importOk && <p role="status" className="mt-3 text-body-sm text-moss-700 bg-moss-50 px-3 py-2 rounded-md border border-moss-200">Gegevens succesvol geladen.</p>}

        <div className="mt-5 pt-4 border-t border-[var(--gp-border)]">
          {bevestigWissen ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-sm text-[var(--gp-rust-700)] font-medium">
                Alle lokale gegevens wissen (tuin, taken, dagboek, metingen, zaadbank)? Dit kan niet ongedaan worden gemaakt.
              </span>
              <Button
                variant="ghost"
                onClick={wisAlles}
                className="text-body-sm text-[var(--gp-rust-700)] border border-[var(--gp-rust-300)]"
              >
                Ja, wis alles
              </Button>
              <Button variant="ghost" onClick={() => setBevestigWissen(false)} className="text-body-sm">
                Annuleer
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setBevestigWissen(true)}
              className="flex items-center gap-2 text-body-sm text-[var(--gp-rust-700)]"
            >
              <Trash2 size={14} aria-hidden /> Wis alle gegevens…
            </Button>
          )}
          <p className="mt-2 text-caption text-[var(--gp-text-mute)]">
            Tip: maak eerst een backup-export. Gegevens staan uitsluitend lokaal in deze browser.
          </p>
        </div>
      </Sectie>

      {/* ── Offline & privacy ── */}
      <Sectie titel="Offline & privacy">
        <ul className="space-y-2 text-body-sm text-moss-900">
          <li className="flex items-start gap-2">
            <WifiOff size={14} className="text-moss-600 shrink-0 mt-0.5" aria-hidden />
            <span>
              De app werkt offline (PWA): pagina's en eerder opgehaalde plantdata blijven beschikbaar.
              AI-functies vallen offline terug op een gelabeld lokaal alternatief.
              {typeof navigator !== "undefined" && !("serviceWorker" in navigator) && (
                <span className="text-[var(--gp-text-mute)]"> (Service workers worden door deze browser niet ondersteund.)</span>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-moss-600 shrink-0 mt-0.5" aria-hidden />
            <span>
              Alle tuingegevens staan lokaal (browseropslag). Foto's worden alleen verstuurd op het moment dat je
              plant-identificatie of plagendetectie start; GPS-locatie wordt gebruikt voor zonedetectie maar nooit opgeslagen.
            </span>
          </li>
        </ul>
      </Sectie>
    </div>
  );
}
