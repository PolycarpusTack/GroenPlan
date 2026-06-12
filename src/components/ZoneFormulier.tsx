import { useState } from "react";
import { X, CloudRain, Loader2 } from "lucide-react";
import type { Zone, ZoneInput } from "../domain/tuin/types";
import type { Grondsoort, Zonlichtniveau, Drainage } from "../domain/plant/types";
import { BELGISCHE_GEMEENTEN } from "../services/weather/belgische-gemeenten";
import { haalNeerslagOp } from "../services/weather/weather-service";
import { Button } from "./ui";

interface Props {
  bestaandeZone?: Zone;
  onOpslaan: (zone: ZoneInput) => void;
  onAnnuleer: () => void;
}

const GRONDOPTIES: { waarde: Grondsoort; label: string }[] = [
  { waarde: "loam",  label: "Leem" },
  { waarde: "clay",  label: "Klei" },
  { waarde: "sand",  label: "Zand" },
  { waarde: "chalk", label: "Kalk" },
  { waarde: "peat",  label: "Veen" },
];

const ZONOPTIES: { waarde: Zonlichtniveau; label: string }[] = [
  { waarde: "full",    label: "Volle zon (>6u)" },
  { waarde: "partial", label: "Halfschaduw (3–6u)" },
  { waarde: "shade",   label: "Schaduw (<3u)" },
];

const DRAINAGEOPTIES: { waarde: Drainage; label: string }[] = [
  { waarde: "well-drained", label: "Goed doorlatend" },
  { waarde: "moist",        label: "Vochtig" },
  { waarde: "wet",          label: "Nat" },
];

export function ZoneFormulier({ bestaandeZone, onOpslaan, onAnnuleer }: Props) {
  const bewerkModus = bestaandeZone != null;

  const [naam, setNaam] = useState(bestaandeZone?.naam ?? "");
  const [grondsoort, setGrondsoort] = useState<Grondsoort>(bestaandeZone?.grondsoort ?? "loam");
  const [zon, setZon] = useState<Zonlichtniveau>(bestaandeZone?.zon ?? "partial");
  const [pH, setPH] = useState<string>(bestaandeZone?.pH != null ? String(bestaandeZone.pH) : "");
  const [drainage, setDrainage] = useState<Drainage>(bestaandeZone?.drainage ?? "well-drained");
  const [gemeente, setGemeente] = useState<string>(bestaandeZone?.gemeente ?? "");
  const [regenval, setRegenval] = useState<number | null>(bestaandeZone?.regenval_mm_7d ?? null);
  const [breedte, setBreedte] = useState<string>(bestaandeZone?.breedte_m != null ? String(bestaandeZone.breedte_m) : "");
  const [diepte, setDiepte] = useState<string>(bestaandeZone?.diepte_m != null ? String(bestaandeZone.diepte_m) : "");
  const [laadtNeerslag, setLaadtNeerslag] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const handleGemeenteWijziging = async (geselecteerd: string) => {
    setGemeente(geselecteerd);
    setRegenval(null);
    if (!geselecteerd) return;

    const gem = BELGISCHE_GEMEENTEN.find((g) => g.naam === geselecteerd);
    if (!gem) return;

    setLaadtNeerslag(true);
    try {
      const mm = await haalNeerslagOp(gem.lat, gem.lng);
      setRegenval(mm);
    } catch {
      // Stille fout — neerslag blijft null
    } finally {
      setLaadtNeerslag(false);
    }
  };

  const handleOpslaan = () => {
    if (!naam.trim()) {
      setFout("Geef de zone een naam.");
      return;
    }
    const pHWaarde = pH === "" ? null : parseFloat(pH);
    if (pH !== "" && (isNaN(pHWaarde!) || pHWaarde! < 3 || pHWaarde! > 10)) {
      setFout("pH moet tussen 3 en 10 liggen.");
      return;
    }
    const breedteWaarde = breedte === "" ? null : parseFloat(breedte);
    const diepteWaarde = diepte === "" ? null : parseFloat(diepte);
    for (const w of [breedteWaarde, diepteWaarde]) {
      if (w !== null && (isNaN(w) || w <= 0 || w > 500)) {
        setFout("Afmetingen moeten tussen 0 en 500 meter liggen.");
        return;
      }
    }

    onOpslaan({
      id: bestaandeZone?.id ?? crypto.randomUUID(),
      naam: naam.trim(),
      grondsoort,
      zon,
      pH: pHWaarde,
      drainage,
      gemeente: gemeente || null,
      regenval_mm_7d: regenval,
      breedte_m: breedteWaarde,
      diepte_m: diepteWaarde,
    });
  };

  return (
    <div className="gp-card border border-[var(--gp-border)] max-w-md w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-heading-lg text-moss-900">
          {bewerkModus ? "Zone bewerken" : "Zone toevoegen"}
        </h2>
        <Button variant="ghost" className="p-1.5" onClick={onAnnuleer} aria-label="Sluiten">
          <X size={18} aria-hidden />
        </Button>
      </div>

      {fout && (
        <p role="alert" className="mb-4 text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">
          {fout}
        </p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-body-sm font-medium text-moss-900 mb-1 block">Naam</span>
          <input
            type="text"
            value={naam}
            onChange={(e) => { setNaam(e.target.value); setFout(null); }}
            placeholder="bijv. Zonnige rand"
            className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          />
        </label>

        <label className="block">
          <span className="text-body-sm font-medium text-moss-900 mb-1 block">Grondsoort</span>
          <select
            value={grondsoort}
            onChange={(e) => setGrondsoort(e.target.value as Grondsoort)}
            className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          >
            {GRONDOPTIES.map((o) => (
              <option key={o.waarde} value={o.waarde}>{o.label}</option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-body-sm font-medium text-moss-900 mb-2">Zonlicht</legend>
          <div className="flex gap-2 flex-wrap">
            {ZONOPTIES.map((o) => (
              <label key={o.waarde} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="zon"
                  value={o.waarde}
                  checked={zon === o.waarde}
                  onChange={() => setZon(o.waarde)}
                  className="accent-moss-700"
                />
                <span className="text-body-sm text-moss-900">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-body-sm font-medium text-moss-900 mb-1 block">Drainage</span>
          <select
            value={drainage}
            onChange={(e) => setDrainage(e.target.value as Drainage)}
            className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          >
            {DRAINAGEOPTIES.map((o) => (
              <option key={o.waarde} value={o.waarde}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-body-sm font-medium text-moss-900 mb-1 block">
            pH <span className="font-normal text-[var(--gp-text-mute)]">(optioneel)</span>
          </span>
          <input
            type="number"
            value={pH}
            onChange={(e) => { setPH(e.target.value); setFout(null); }}
            min={3}
            max={10}
            step={0.1}
            placeholder="bijv. 6.5"
            className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          />
        </label>

        <div>
          <span className="text-body-sm font-medium text-moss-900 mb-1 block">
            Afmetingen <span className="font-normal text-[var(--gp-text-mute)]">(optioneel — voor de tuinkaart op schaal)</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={breedte}
              onChange={(e) => { setBreedte(e.target.value); setFout(null); }}
              min={0.1}
              max={500}
              step={0.1}
              placeholder="breedte"
              aria-label="Breedte in meter"
              className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
            <span className="text-body-sm text-[var(--gp-text-mute)]" aria-hidden>×</span>
            <input
              type="number"
              value={diepte}
              onChange={(e) => { setDiepte(e.target.value); setFout(null); }}
              min={0.1}
              max={500}
              step={0.1}
              placeholder="diepte"
              aria-label="Diepte in meter"
              className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
            <span className="text-body-sm text-[var(--gp-text-mute)] shrink-0">m</span>
          </div>
        </div>

        {/* Gemeente + neerslag */}
        <div>
          <label className="block">
            <span className="text-body-sm font-medium text-moss-900 mb-1 block">
              Gemeente <span className="font-normal text-[var(--gp-text-mute)]">(optioneel — voor neerslaggergevens)</span>
            </span>
            <select
              value={gemeente}
              onChange={(e) => handleGemeenteWijziging(e.target.value)}
              className="w-full px-3 py-2 text-body border border-[var(--gp-border)] rounded-md bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            >
              <option value="">– kies gemeente –</option>
              {BELGISCHE_GEMEENTEN.sort((a, b) => a.naam.localeCompare(b.naam, "nl")).map((g) => (
                <option key={g.naam} value={g.naam}>{g.naam}</option>
              ))}
            </select>
          </label>

          {/* Neerslag feedback */}
          {(laadtNeerslag || regenval !== null) && (
            <div className="mt-2 flex items-center gap-2 text-caption text-moss-700">
              {laadtNeerslag ? (
                <>
                  <Loader2 size={12} className="animate-spin" aria-hidden />
                  Neerslag ophalen…
                </>
              ) : (
                <>
                  <CloudRain size={12} aria-hidden />
                  {regenval} mm neerslag afgelopen 7 dagen
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button className="flex-1" onClick={handleOpslaan}>
          {bewerkModus ? "Wijzigingen opslaan" : "Zone opslaan"}
        </Button>
        <Button variant="secondary" onClick={onAnnuleer}>
          Annuleer
        </Button>
      </div>
    </div>
  );
}
