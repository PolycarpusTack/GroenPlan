import { useState } from "react";
import { X } from "lucide-react";
import { Veld, INVOER_KLASSE } from "./Veld";
import { bouwHandmatigePlant, type HandmatigePlantInvoer } from "../domain/plant/bouwHandmatigePlant";
import type {
  AutoFillResultaat, PlantType, Grondsoort, Zonlichtniveau, Drainage, Waterbehoeften,
} from "../domain/plant/types";
import { Button } from "./ui";

const TYPE_OPTIES: { v: PlantType; l: string }[] = [
  { v: "perennial", l: "Vaste plant" }, { v: "annual", l: "Eenjarig" }, { v: "biennial", l: "Tweejarig" },
  { v: "shrub", l: "Heester" }, { v: "tree", l: "Boom" }, { v: "climber", l: "Klimmer" },
  { v: "bulb", l: "Bol" }, { v: "tuber", l: "Knol" }, { v: "grass", l: "Gras" }, { v: "fern", l: "Varen" },
];
const ZON_OPTIES: { v: Zonlichtniveau; l: string }[] = [
  { v: "full", l: "Volle zon" }, { v: "partial", l: "Halfschaduw" }, { v: "shade", l: "Schaduw" },
];
const GROND_OPTIES: { v: Grondsoort; l: string }[] = [
  { v: "clay", l: "Klei" }, { v: "sand", l: "Zand" }, { v: "loam", l: "Leem" }, { v: "chalk", l: "Kalk" }, { v: "peat", l: "Veen" },
];
const DRAINAGE_OPTIES: { v: Drainage; l: string }[] = [
  { v: "well-drained", l: "Goed doorlatend" }, { v: "moist", l: "Vochtig" }, { v: "wet", l: "Nat" },
];
const WATER_OPTIES: { v: Waterbehoeften; l: string }[] = [
  { v: "low", l: "Laag" }, { v: "medium", l: "Gemiddeld" }, { v: "high", l: "Hoog" },
];
const MAAND_KORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const LEEG = {
  wetenschappelijkeNaam: "", gewoneNaamNl: "", familie: "", type: "",
  zon: "", drainage: "", waterbehoeften: "",
  pHMin: "", pHMax: "", hardheidMin: "", hardheidMax: "",
  hoogteMin: "", hoogteMax: "", breedteMin: "", breedteMax: "",
  bloeiKleuren: "", notities: "",
};

const num = (s: string): number | undefined => (s.trim() ? Number(s) : undefined);

interface Props {
  bestaandeSleutels: string[]; // lowercase wetenschappelijke namen al in de catalogus
  onOpslaan: (plant: AutoFillResultaat) => void;
  onAnnuleer: () => void;
}

export function HandmatigPlantFormulier({ bestaandeSleutels, onOpslaan, onAnnuleer }: Props) {
  const [f, setF] = useState(LEEG);
  const [grondsoorten, setGrondsoorten] = useState<Grondsoort[]>([]);
  const [bloeiMaanden, setBloeiMaanden] = useState<number[]>([]);
  const [fout, setFout] = useState<string | null>(null);

  const set = (k: keyof typeof LEEG, v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const toggleGrond = (g: Grondsoort) =>
    setGrondsoorten((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  const toggleMaand = (m: number) =>
    setBloeiMaanden((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]).sort((a, b) => a - b));

  const opslaan = () => {
    const naam = f.wetenschappelijkeNaam.trim();
    if (!naam) { setFout("De wetenschappelijke naam is verplicht."); return; }
    if (bestaandeSleutels.includes(naam.toLowerCase())) {
      setFout("Deze plant staat al in de catalogus.");
      return;
    }
    const invoer: HandmatigePlantInvoer = {
      wetenschappelijkeNaam: naam,
      gewoneNaamNl: f.gewoneNaamNl || undefined,
      familie: f.familie || undefined,
      type: (f.type || undefined) as PlantType | undefined,
      zon: (f.zon || undefined) as Zonlichtniveau | undefined,
      grondsoorten: grondsoorten.length ? grondsoorten : undefined,
      pHMin: num(f.pHMin), pHMax: num(f.pHMax),
      drainage: (f.drainage || undefined) as Drainage | undefined,
      waterbehoeften: (f.waterbehoeften || undefined) as Waterbehoeften | undefined,
      hardheidMin: num(f.hardheidMin), hardheidMax: num(f.hardheidMax),
      bloeiMaanden: bloeiMaanden.length ? bloeiMaanden : undefined,
      bloeiKleuren: f.bloeiKleuren ? f.bloeiKleuren.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      hoogteMin: num(f.hoogteMin), hoogteMax: num(f.hoogteMax),
      breedteMin: num(f.breedteMin), breedteMax: num(f.breedteMax),
      notities: f.notities || undefined,
    };
    onOpslaan(bouwHandmatigePlant(invoer));
  };

  return (
    <div className="p-4 rounded-xl border border-[var(--gp-border)] bg-white space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-md text-moss-900">Plant handmatig toevoegen</h2>
        <Button variant="ghost" onClick={onAnnuleer} className="p-1 text-[var(--gp-text-mute)]" aria-label="Sluiten">
          <X size={16} aria-hidden />
        </Button>
      </div>

      {/* Identificatie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Veld label="Wetenschappelijke naam *">
          <input value={f.wetenschappelijkeNaam} onChange={(e) => set("wetenschappelijkeNaam", e.target.value)}
            placeholder="bijv. Lavandula angustifolia" className={`gp-scientific ${INVOER_KLASSE}`} />
        </Veld>
        <Veld label="Gewone naam (NL)">
          <input value={f.gewoneNaamNl} onChange={(e) => set("gewoneNaamNl", e.target.value)} placeholder="bijv. Lavendel" className={INVOER_KLASSE} />
        </Veld>
        <Veld label="Familie">
          <input value={f.familie} onChange={(e) => set("familie", e.target.value)} placeholder="bijv. Lamiaceae" className={INVOER_KLASSE} />
        </Veld>
        <Veld label="Type">
          <select value={f.type} onChange={(e) => set("type", e.target.value)} className={INVOER_KLASSE}>
            <option value="">—</option>
            {TYPE_OPTIES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </Veld>
      </div>

      {/* Standplaats */}
      <div>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-1.5">Standplaats</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Veld label="Zon">
            <select value={f.zon} onChange={(e) => set("zon", e.target.value)} className={INVOER_KLASSE}>
              <option value="">— (onbekend)</option>
              {ZON_OPTIES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </Veld>
          <Veld label="Drainage">
            <select value={f.drainage} onChange={(e) => set("drainage", e.target.value)} className={INVOER_KLASSE}>
              <option value="">— (onbekend)</option>
              {DRAINAGE_OPTIES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </Veld>
          <Veld label="Waterbehoeften">
            <select value={f.waterbehoeften} onChange={(e) => set("waterbehoeften", e.target.value)} className={INVOER_KLASSE}>
              <option value="">— (onbekend)</option>
              {WATER_OPTIES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </Veld>
          <div className="grid grid-cols-2 gap-2">
            <Veld label="pH min">
              <input type="number" step="0.1" value={f.pHMin} onChange={(e) => set("pHMin", e.target.value)} placeholder="6.0" className={INVOER_KLASSE} />
            </Veld>
            <Veld label="pH max">
              <input type="number" step="0.1" value={f.pHMax} onChange={(e) => set("pHMax", e.target.value)} placeholder="7.5" className={INVOER_KLASSE} />
            </Veld>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Veld label="Hardheid USDA min">
              <input type="number" value={f.hardheidMin} onChange={(e) => set("hardheidMin", e.target.value)} placeholder="5" className={INVOER_KLASSE} />
            </Veld>
            <Veld label="USDA max">
              <input type="number" value={f.hardheidMax} onChange={(e) => set("hardheidMax", e.target.value)} placeholder="9" className={INVOER_KLASSE} />
            </Veld>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-caption text-moss-700 font-medium">Grondsoorten</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {GROND_OPTIES.map((o) => (
              <button key={o.v} type="button" onClick={() => toggleGrond(o.v)}
                className={`text-caption px-2.5 py-1 rounded-full border ${grondsoorten.includes(o.v) ? "bg-moss-600 text-white border-moss-600" : "bg-white text-moss-700 border-[var(--gp-border)] hover:border-moss-400"}`}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bloei */}
      <div>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-1.5">Bloei</p>
        <span className="text-caption text-moss-700 font-medium">Bloeimaanden</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {MAAND_KORT.map((m, i) => (
            <button key={m} type="button" onClick={() => toggleMaand(i + 1)}
              className={`text-caption w-10 py-1 rounded-md border ${bloeiMaanden.includes(i + 1) ? "bg-bloom-500 text-white border-bloom-500" : "bg-white text-moss-700 border-[var(--gp-border)] hover:border-bloom-300"}`}>
              {m}
            </button>
          ))}
        </div>
        <Veld label="Bloemkleuren (komma-gescheiden)" className="mt-2">
          <input value={f.bloeiKleuren} onChange={(e) => set("bloeiKleuren", e.target.value)} placeholder="bijv. paars, blauw" className={INVOER_KLASSE} />
        </Veld>
      </div>

      {/* Groei */}
      <div>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-1.5">Groei (cm)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Veld label="Hoogte min">
            <input type="number" value={f.hoogteMin} onChange={(e) => set("hoogteMin", e.target.value)} placeholder="40" className={INVOER_KLASSE} />
          </Veld>
          <Veld label="Hoogte max">
            <input type="number" value={f.hoogteMax} onChange={(e) => set("hoogteMax", e.target.value)} placeholder="60" className={INVOER_KLASSE} />
          </Veld>
          <Veld label="Breedte min">
            <input type="number" value={f.breedteMin} onChange={(e) => set("breedteMin", e.target.value)} placeholder="30" className={INVOER_KLASSE} />
          </Veld>
          <Veld label="Breedte max">
            <input type="number" value={f.breedteMax} onChange={(e) => set("breedteMax", e.target.value)} placeholder="50" className={INVOER_KLASSE} />
          </Veld>
        </div>
      </div>

      <Veld label="Notitie">
        <input value={f.notities} onChange={(e) => set("notities", e.target.value)} placeholder="eigen aantekening" className={INVOER_KLASSE} />
      </Veld>

      <p className="text-caption text-[var(--gp-text-mute)]">
        Niet-ingevulde velden blijven leeg (bron "onbekend") — er wordt niets gegokt. Je kunt later aanvullen.
      </p>

      {fout && <p role="alert" className="text-caption text-[var(--gp-rust-700)]">{fout}</p>}

      <div className="flex gap-2">
        <Button onClick={opslaan}>Opslaan in catalogus</Button>
        <Button variant="ghost" onClick={onAnnuleer}>Annuleren</Button>
      </div>
    </div>
  );
}
