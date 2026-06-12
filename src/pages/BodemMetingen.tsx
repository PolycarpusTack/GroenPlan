import { useState } from "react";
import { Layers, Plus, Check, X, FlaskConical } from "lucide-react";
import { useTuinStore } from "../store/tuin-store";
import { useBodemStore } from "../store/bodem-store";
import { Button, Card, Chip, PageHeader } from "../components/ui";

const GROND_LABEL: Record<string, string> = {
  clay: "Klei", sand: "Zand", loam: "Leem", chalk: "Kalk", peat: "Veen",
};
const ZON_LABEL: Record<string, string> = {
  full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw",
};
const DRAINAGE_LABEL: Record<string, string> = {
  "well-drained": "Goed doorlatend", moist: "Vochtig", wet: "Nat",
};

function phKlasse(ph: number): string {
  if (ph < 5.5) return "text-rust-700 bg-rust-50";
  if (ph < 6.0) return "text-amber-700 bg-amber-50";
  if (ph <= 7.5) return "text-moss-700 bg-moss-50";
  return "text-sky-700 bg-sky-50";
}

function phLabel(ph: number): string {
  if (ph < 5.5) return "Zuur";
  if (ph < 6.0) return "Licht zuur";
  if (ph <= 7.0) return "Neutraal";
  if (ph <= 7.5) return "Licht basisch";
  return "Basisch";
}

export function BodemMetingenPagina() {
  const tuin = useTuinStore((s) => s.tuin);
  const metingen = useBodemStore((s) => s.metingen);
  const voegMetingToe = useBodemStore((s) => s.voegMetingToe);
  const verwijderMeting = useBodemStore((s) => s.verwijderMeting);
  const [formulierZoneId, setFormulierZoneId] = useState<string | null>(null);
  const [phWaarde, setPhWaarde] = useState("");
  const [metingDatum, setMetingDatum] = useState(new Date().toISOString().slice(0, 10));
  const [notitie, setNotitie] = useState("");

  const slaOp = () => {
    const ph = parseFloat(phWaarde);
    if (isNaN(ph) || ph < 0 || ph > 14 || !formulierZoneId) return;
    voegMetingToe({
      zoneId: formulierZoneId,
      ph,
      datum: metingDatum,
      notitie: notitie.trim() || null,
    });
    setPhWaarde("");
    setNotitie("");
    setFormulierZoneId(null);
  };

  const verwijder = (id: string) => verwijderMeting(id);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <PageHeader
        title="Bodem & Metingen"
        subtitle="pH-metingen, bodemtype en drainage per zone — voor gerichte planten- en meststofkeuzes."
      />

      {tuin.zones.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center border-2 border-dashed border-[var(--gp-border)] rounded-xl">
          <Layers size={36} className="text-[var(--gp-mute)] mb-3" aria-hidden />
          <p className="text-body text-[var(--gp-text-mute)]">Maak eerst een zone aan in de Tuinkaart.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tuin.zones.map((zone) => {
            const zoneMetingen = metingen.filter((m) => m.zoneId === zone.id);
            const laasteMeting = zoneMetingen[0] ?? null;
            const formulierActief = formulierZoneId === zone.id;

            return (
              <Card key={zone.id} variant="bordered">
                {/* Zone-header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-heading-lg text-moss-900 mb-1">{zone.naam}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="good">{GROND_LABEL[zone.grondsoort] ?? zone.grondsoort}</Chip>
                      <Chip tone="good">{ZON_LABEL[zone.zon] ?? zone.zon}</Chip>
                      <Chip tone="good">{DRAINAGE_LABEL[zone.drainage] ?? zone.drainage}</Chip>
                      {zone.pH != null && (
                        <span className={`text-caption px-2.5 py-0.5 rounded-full font-medium ${phKlasse(zone.pH)}`}>
                          pH {zone.pH} (ingesteld)
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFormulierZoneId(formulierActief ? null : zone.id);
                      setPhWaarde("");
                      setNotitie("");
                    }}
                    className="flex items-center gap-1.5 text-body-sm shrink-0"
                  >
                    <FlaskConical size={14} aria-hidden />
                    Meting toevoegen
                  </Button>
                </div>

                {/* Meting formulier */}
                {formulierActief && (
                  <div className="mb-4 p-3 rounded-lg bg-moss-50 border border-moss-200 space-y-2">
                    <p className="text-body-sm font-medium text-moss-800">Nieuwe pH-meting voor {zone.naam}</p>
                    <div className="flex gap-2 flex-wrap">
                      <div>
                        <label className="text-caption text-moss-700 block mb-0.5">pH-waarde (0–14)</label>
                        <input
                          type="number"
                          min={0} max={14} step={0.1}
                          value={phWaarde}
                          onChange={(e) => setPhWaarde(e.target.value)}
                          placeholder="6.5"
                          className="w-24 px-2 py-1.5 text-body-sm border border-[var(--gp-border)] rounded
                                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-caption text-moss-700 block mb-0.5">Datum</label>
                        <input
                          type="date"
                          value={metingDatum}
                          onChange={(e) => setMetingDatum(e.target.value)}
                          className="px-2 py-1.5 text-body-sm border border-[var(--gp-border)] rounded
                                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
                        />
                      </div>
                      <div className="flex-1 min-w-40">
                        <label className="text-caption text-moss-700 block mb-0.5">Notitie (optioneel)</label>
                        <input
                          type="text"
                          value={notitie}
                          onChange={(e) => setNotitie(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") slaOp(); if (e.key === "Escape") setFormulierZoneId(null); }}
                          placeholder="bijv. na bekalking"
                          className="w-full px-2 py-1.5 text-body-sm border border-[var(--gp-border)] rounded
                                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={slaOp} className="text-body-sm py-1 px-3 flex items-center gap-1">
                        <Check size={13} aria-hidden /> Opslaan
                      </Button>
                      <Button variant="ghost" onClick={() => setFormulierZoneId(null)} className="p-1.5">
                        <X size={13} aria-hidden />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Laatste meting */}
                {laasteMeting && (
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`text-body-sm font-semibold px-3 py-1 rounded-full ${phKlasse(laasteMeting.ph)}`}>
                      pH {laasteMeting.ph} — {phLabel(laasteMeting.ph)}
                    </span>
                    <span className="text-caption text-[var(--gp-text-mute)]">{laasteMeting.datum}</span>
                    {laasteMeting.notitie && (
                      <span className="text-caption text-[var(--gp-text-mute)] italic">{laasteMeting.notitie}</span>
                    )}
                  </div>
                )}

                {/* Meetgeschiedenis */}
                {zoneMetingen.length > 0 && (
                  <div>
                    <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">
                      pH-log · {zoneMetingen.length} meting{zoneMetingen.length !== 1 ? "en" : ""}
                    </p>
                    <ul className="space-y-1">
                      {zoneMetingen.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--gp-border)] bg-white">
                          <span className={`text-caption font-semibold px-2 py-0.5 rounded ${phKlasse(m.ph)}`}>
                            pH {m.ph}
                          </span>
                          <span className="text-caption text-[var(--gp-text-mute)] shrink-0">{m.datum}</span>
                          {m.notitie && (
                            <span className="text-caption text-moss-700 italic flex-1 truncate">{m.notitie}</span>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => verwijder(m.id)}
                            className="p-1 text-[var(--gp-rust-700)] opacity-50 hover:opacity-100 shrink-0"
                            aria-label="Verwijder meting"
                          >
                            <X size={13} aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {zoneMetingen.length === 0 && !formulierActief && (
                  <p className="text-caption text-[var(--gp-text-mute)] italic">Nog geen pH-metingen geregistreerd.</p>
                )}

                {/* Aanbevolen pH-range op basis van planten */}
                {zone.plantPlaatsingen.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--gp-border)]">
                    <p className="text-caption text-[var(--gp-text-mute)]">
                      {zone.plantPlaatsingen.length} plant{zone.plantPlaatsingen.length !== 1 ? "en" : ""} aanwezig · controleer de plantdetails voor optimale pH-ranges.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Tip */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <Plus size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-body-sm font-medium text-amber-800 mb-0.5">pH meten</p>
          <p className="text-body-sm text-amber-700">
            Gebruik een eenvoudige pH-meter of teststrips. Meet bij voorkeur in de lente vóór bemesting.
            De ideale tuinbodem heeft een pH tussen 6.0 en 7.0.
          </p>
        </div>
      </div>
    </div>
  );
}
