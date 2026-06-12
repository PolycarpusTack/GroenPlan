// Schema-validator voor Claude auto-fill output — bron: GroenPlan_AutoFill_Prompt_Spec.md §2
import type { AutoFillResultaat } from "../../domain/plant/types";

export class AutoFillValidatieFout extends Error {
  constructor(
    public readonly veld: string,
    bericht: string,
  ) {
    super(`AutoFill validatiefout bij '${veld}': ${bericht}`);
    this.name = "AutoFillValidatieFout";
  }
}

const GELDIGE_BRONNEN = new Set([
  "RHS", "Trefle", "GBIF", "Wikipedia", "USDA", "Velt", "AI-knowledge", "handmatig", "unknown",
]);

const GELDIGE_GRONDSOORTEN = new Set(["clay", "sand", "loam", "chalk", "peat"]);

const GELDIGE_TYPES = new Set([
  "annual", "biennial", "perennial", "shrub", "tree",
  "climber", "bulb", "tuber", "grass", "fern", "unknown",
]);

// Alle FieldWithSource-velden in het schema (sectie.veld). Spec rule 2 eist dat
// elk veld aanwezig is met geldige 'waarde' en 'bron' — geen partiële validatie.
const VELD_MET_BRON_PADEN = [
  "groei.volwassenHoogte_cm", "groei.volwassenBreedte_cm",
  "groei.plantafstand_cm", "groei.groeisnelheid",
  "omstandigheden.zon", "omstandigheden.grondsoorten", "omstandigheden.pH",
  "omstandigheden.drainage", "omstandigheden.waterbehoeften", "omstandigheden.hardheid",
  "bloei.maanden", "bloei.kleuren", "bloei.geurig",
  "onderhoud.snoeien", "onderhoud.bemesten", "onderhoud.overwinteren",
  "ecologie.bestuivers", "ecologie.begeleiders", "ecologie.plagen",
  "ecologie.ziekten", "ecologie.inheems_belgie", "ecologie.invasief_belgie",
  "veiligheid.giftig_huisdieren", "veiligheid.giftig_mensen", "veiligheid.eetbare_delen",
];

function eisObject(obj: unknown, pad: string): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new AutoFillValidatieFout(pad, "ontbreekt of is geen object");
  }
  return obj as Record<string, unknown>;
}

function eisVeldMetBron(obj: unknown, pad: string): void {
  const veld = eisObject(obj, pad);
  if (!("waarde" in veld)) throw new AutoFillValidatieFout(pad, "mist 'waarde'");
  if (!("bron" in veld)) throw new AutoFillValidatieFout(pad, "mist 'bron'");
  if (!GELDIGE_BRONNEN.has(veld.bron as string)) {
    throw new AutoFillValidatieFout(pad + ".bron", `ongeldige bron '${veld.bron}'`);
  }
}

export function valideerAutoFillResultaat(obj: unknown): AutoFillResultaat {
  const r = eisObject(obj, "root");

  // ── identificatie ──────────────────────────────────────────────────────────
  const id = eisObject(r.identificatie, "identificatie");
  if (typeof id.wetenschappelijkeNaam !== "string" || id.wetenschappelijkeNaam.trim() === "") {
    throw new AutoFillValidatieFout("identificatie.wetenschappelijkeNaam", "moet een niet-lege string zijn");
  }
  if (typeof id.soort !== "string") {
    throw new AutoFillValidatieFout("identificatie.soort", "moet een string zijn");
  }
  if (id.cultivar !== null && typeof id.cultivar !== "string") {
    throw new AutoFillValidatieFout("identificatie.cultivar", "moet een string of null zijn");
  }
  if (typeof id.familie !== "string") {
    throw new AutoFillValidatieFout("identificatie.familie", "moet een string zijn");
  }
  if (!GELDIGE_TYPES.has(id.type as string)) {
    throw new AutoFillValidatieFout("identificatie.type", `ongeldig type '${id.type}'`);
  }
  eisObject(id.gewoneNamen, "identificatie.gewoneNamen");

  // ── alle secties + FieldWithSource-velden ────────────────────────────────────
  for (const pad of VELD_MET_BRON_PADEN) {
    const [sectie, veld] = pad.split(".");
    const ouder = eisObject(r[sectie], sectie);
    eisVeldMetBron(ouder[veld], pad);
  }

  // grondsoorten: elk element moet een geldige enum-waarde zijn
  const grondVeld = (r.omstandigheden as Record<string, unknown>).grondsoorten as Record<string, unknown>;
  if (Array.isArray(grondVeld.waarde)) {
    for (const g of grondVeld.waarde) {
      if (!GELDIGE_GRONDSOORTEN.has(g as string)) {
        throw new AutoFillValidatieFout("omstandigheden.grondsoorten.waarde", `ongeldige waarde '${g}'`);
      }
    }
  }

  // ── notities + zekerheid ─────────────────────────────────────────────────────
  if (typeof r.notities !== "string") {
    throw new AutoFillValidatieFout("notities", "moet een string zijn");
  }
  const z = eisObject(r.zekerheid, "zekerheid");
  if (typeof z.algemeen !== "number" || z.algemeen < 0 || z.algemeen > 1) {
    throw new AutoFillValidatieFout("zekerheid.algemeen", "moet een getal zijn tussen 0 en 1");
  }
  if (typeof z.notities !== "string") {
    throw new AutoFillValidatieFout("zekerheid.notities", "moet een string zijn");
  }

  return obj as AutoFillResultaat;
}

export function parseAutoFillJson(json: string): AutoFillResultaat {
  let geparseerd: unknown;
  try {
    geparseerd = JSON.parse(json);
  } catch {
    throw new AutoFillValidatieFout("json", "ongeldige JSON van Claude");
  }
  return valideerAutoFillResultaat(geparseerd);
}
