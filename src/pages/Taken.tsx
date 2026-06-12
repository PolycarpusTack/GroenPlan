import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TaakRij } from "../components/TaakRij";
import { useTakenStore } from "../store/taken-store";
import { useTuinStore } from "../store/tuin-store";
import type { Taak, HerhalingConfig } from "../domain/taken/types";
import { HerhalingEditor } from "../components/HerhalingEditor";
import { Button, Card, PageHeader } from "../components/ui";

// Seizoenen in kalenderorde (lente als startpunt van tuinjaar)
const SEIZOENEN = ["Lente", "Zomer", "Herfst", "Winter"] as const;
type Seizoen = (typeof SEIZOENEN)[number];

function seizoenVanMaand(maand: number): Seizoen {
  if (maand >= 3 && maand <= 5) return "Lente";
  if (maand >= 6 && maand <= 8) return "Zomer";
  if (maand >= 9 && maand <= 11) return "Herfst";
  return "Winter";
}

function groepeerPerSeizoen(taken: Taak[]): {
  groepen: Array<{ seizoen: Seizoen; taken: Taak[] }>;
  zonderDatum: Taak[];
} {
  const map = new Map<Seizoen, Taak[]>();
  const zonderDatum: Taak[] = [];

  for (const taak of taken) {
    if (!taak.vervaldatum) {
      zonderDatum.push(taak);
      continue;
    }
    const maand = parseInt(taak.vervaldatum.slice(5, 7), 10);
    const seizoen = seizoenVanMaand(maand);
    if (!map.has(seizoen)) map.set(seizoen, []);
    map.get(seizoen)!.push(taak);
  }

  // Sorteer taken binnen elke groep op vervaldatum
  for (const lijst of map.values()) {
    lijst.sort((a, b) => (a.vervaldatum ?? "").localeCompare(b.vervaldatum ?? ""));
  }

  const groepen = SEIZOENEN.filter((s) => map.has(s)).map((s) => ({
    seizoen: s,
    taken: map.get(s)!,
  }));

  return { groepen, zonderDatum };
}

const SEIZOEN_ICOON: Record<Seizoen, string> = {
  Lente: "🌱",
  Zomer: "☀️",
  Herfst: "🍂",
  Winter: "❄️",
};

export function TakenPagina() {
  const navigate = useNavigate();
  const { taken, voegTaakToe, toggleStatus, verwijderTaak, updateTaak } = useTakenStore();
  const zones = useTuinStore((s) => s.tuin.zones);
  const setActieveZone = useTuinStore((s) => s.setActieveZone);

  const [nieuweTitel, setNieuweTitel] = useState("");
  const [nieuweZoneId, setNieuweZoneId] = useState<string>("");
  const [nieuweDatum, setNieuweDatum] = useState<string>("");
  const [nieuweHerhaling, setNieuweHerhaling] = useState<HerhalingConfig | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const vandaag = new Date().toISOString().slice(0, 10);
  const openTaken = taken.filter((t) => t.status === "open");
  const klaarTaken = taken.filter((t) => t.status === "klaar");

  // Achterstallige taken bovenaan, de rest gegroepeerd per seizoen
  const achterstalligeTaken = openTaken.filter(
    (t) => t.vervaldatum !== null && t.vervaldatum < vandaag,
  );
  const tijdigeTaken = openTaken.filter(
    (t) => t.vervaldatum === null || t.vervaldatum >= vandaag,
  );
  const { groepen, zonderDatum } = groepeerPerSeizoen(tijdigeTaken);

  const zoneNaam = (zoneId: string | null) =>
    zones.find((z) => z.id === zoneId)?.naam;

  const handleToevoegen = () => {
    if (!nieuweTitel.trim()) {
      setFout("Geef de taak een titel.");
      return;
    }
    voegTaakToe({
      titel: nieuweTitel.trim(),
      zoneId: nieuweZoneId || null,
      vervaldatum: nieuweDatum || null,
      herhaling: nieuweHerhaling,
    });
    setNieuweTitel("");
    setNieuweZoneId("");
    setNieuweDatum("");
    setNieuweHerhaling(null);
    setFout(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleToevoegen();
  };

  const naarZone = (zoneId: string) => {
    setActieveZone(zoneId);
    navigate("/tuinkaart");
  };

  const taakRij = (t: Taak) => (
    <TaakRij
      key={t.id}
      taak={t}
      zones={zones}
      zoneNaam={t.zoneId ? zoneNaam(t.zoneId) : undefined}
      onToggle={() => toggleStatus(t.id)}
      onVerwijder={() => verwijderTaak(t.id)}
      onBewerk={(updates) => updateTaak(t.id, updates)}
      onZoneKlik={t.zoneId ? () => naarZone(t.zoneId!) : undefined}
    />
  );

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <PageHeader
        title="Taken"
        subtitle={`Jouw tuintaken — ${openTaken.length} open${
          klaarTaken.length > 0 ? `, ${klaarTaken.length} klaar` : ""
        }.`}
        className="mb-8"
      />

      {/* Nieuw-taakformulier */}
      <Card variant="bordered" className="mb-8">
        <h2 className="font-display text-heading-lg text-moss-900 mb-4">Taak toevoegen</h2>

        {fout && (
          <p role="alert" className="mb-3 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">
            {fout}
          </p>
        )}

        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={nieuweTitel}
            onChange={(e) => { setNieuweTitel(e.target.value); setFout(null); }}
            onKeyDown={handleKeyDown}
            placeholder="bijv. Lavendel snoeien"
            className="flex-1 px-3 py-2 text-body border border-[var(--gp-border)] rounded-md
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]
                       placeholder:text-[var(--gp-mute)]"
            aria-label="Taakomschrijving"
          />
          <Button onClick={handleToevoegen} className="flex items-center gap-2">
            <Plus size={16} aria-hidden />
            Toevoegen
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          {zones.length > 0 && (
            <select
              value={nieuweZoneId}
              onChange={(e) => setNieuweZoneId(e.target.value)}
              className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
              aria-label="Koppel aan zone (optioneel)"
            >
              <option value="">– zone (optioneel) –</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.naam}</option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={nieuweDatum}
            onChange={(e) => setNieuweDatum(e.target.value)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            aria-label="Vervaldatum (optioneel)"
          />

        </div>
        <HerhalingEditor waarde={nieuweHerhaling} onChange={setNieuweHerhaling} />
      </Card>

      {/* Open taken — achterstallig bovenaan, dan per seizoen */}
      {openTaken.length > 0 && (
        <section aria-label="Open taken" className="mb-8 space-y-6">
          {achterstalligeTaken.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-heading-sm text-[var(--gp-rust-700)] mb-3">
                <AlertTriangle size={14} aria-hidden />
                Achterstallig
                <span className="text-caption text-[var(--gp-rust-500)] font-normal ml-1">
                  · {achterstalligeTaken.length}
                </span>
              </h2>
              <ul className="space-y-2">{achterstalligeTaken.map(taakRij)}</ul>
            </div>
          )}

          {groepen.map(({ seizoen, taken: groepTaken }) => (
            <div key={seizoen}>
              <h2 className="flex items-center gap-2 text-heading-sm text-moss-800 mb-3">
                <span aria-hidden>{SEIZOEN_ICOON[seizoen]}</span>
                {seizoen}
                <span className="text-caption text-[var(--gp-text-mute)] font-normal ml-1">
                  · {groepTaken.length}
                </span>
              </h2>
              <ul className="space-y-2">{groepTaken.map(taakRij)}</ul>
            </div>
          ))}

          {zonderDatum.length > 0 && (
            <div>
              <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">
                Zonder datum · {zonderDatum.length}
              </h2>
              <ul className="space-y-2">{zonderDatum.map(taakRij)}</ul>
            </div>
          )}
        </section>
      )}

      {/* Klaar taken */}
      {klaarTaken.length > 0 && (
        <section aria-label="Klaar taken">
          <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">
            Klaar · {klaarTaken.length}
          </h2>
          <ul className="space-y-2">{klaarTaken.map(taakRij)}</ul>
        </section>
      )}

      {/* Leeg */}
      {taken.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-[var(--gp-border)] rounded-xl">
          <p className="text-body text-[var(--gp-text-mute)]">
            Nog geen taken. Voeg je eerste tuintaak toe.
          </p>
        </div>
      )}
    </div>
  );
}
