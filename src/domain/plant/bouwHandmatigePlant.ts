// Bouwt een volledige AutoFillResultaat uit handmatige invoer. Niet-ingevulde
// velden krijgen null/unknown/[] (anti-hallucination: liever leeg dan gegokt) en
// bron "unknown"; ingevulde velden krijgen bron "handmatig". Pure functie.
import type {
  AutoFillResultaat, VeldMetBron, PlantType,
  Grondsoort, Zonlichtniveau, Drainage, Waterbehoeften,
} from "./types";

export interface HandmatigePlantInvoer {
  wetenschappelijkeNaam: string;
  gewoneNaamNl?: string;
  familie?: string;
  type?: PlantType;
  zon?: Zonlichtniveau;
  grondsoorten?: Grondsoort[];
  pHMin?: number | null;
  pHMax?: number | null;
  drainage?: Drainage;
  waterbehoeften?: Waterbehoeften;
  hardheidMin?: number | null;
  hardheidMax?: number | null;
  bloeiMaanden?: number[];
  bloeiKleuren?: string[];
  hoogteMin?: number | null;
  hoogteMax?: number | null;
  breedteMin?: number | null;
  breedteMax?: number | null;
  notities?: string;
}

// Veld-met-bron: "handmatig" wanneer de gebruiker iets opgaf, anders "unknown".
function vmb<T>(waarde: T, ingevuld: boolean): VeldMetBron<T> {
  return { waarde, bron: ingevuld ? "handmatig" : "unknown", terugval: !ingevuld };
}

function range(min: number | null | undefined, max: number | null | undefined): { min: number; max: number } | null {
  if (min == null && max == null) return null;
  const lo = min ?? max ?? 0;
  const hi = max ?? min ?? 0;
  return { min: Math.min(lo, hi), max: Math.max(lo, hi) };
}

export function bouwHandmatigePlant(invoer: HandmatigePlantInvoer): AutoFillResultaat {
  const grondsoorten = invoer.grondsoorten ?? [];
  const bloeiMaanden = invoer.bloeiMaanden ?? [];
  const bloeiKleuren = invoer.bloeiKleuren ?? [];
  const pH = range(invoer.pHMin, invoer.pHMax);
  const hoogte = range(invoer.hoogteMin, invoer.hoogteMax);
  const breedte = range(invoer.breedteMin, invoer.breedteMax);
  const hardheid =
    invoer.hardheidMin == null && invoer.hardheidMax == null
      ? null
      : { usda_min: invoer.hardheidMin ?? invoer.hardheidMax ?? 0, usda_max: invoer.hardheidMax ?? null };

  return {
    identificatie: {
      wetenschappelijkeNaam: invoer.wetenschappelijkeNaam.trim(),
      soort: invoer.wetenschappelijkeNaam.trim(),
      cultivar: null,
      gewoneNamen: { nl: invoer.gewoneNaamNl?.trim() || null, en: null, fr: null },
      familie: invoer.familie?.trim() || "",
      type: invoer.type ?? "unknown",
    },
    groei: {
      volwassenHoogte_cm: vmb(hoogte, hoogte !== null),
      volwassenBreedte_cm: vmb(breedte, breedte !== null),
      plantafstand_cm: vmb(null, false),
      groeisnelheid: vmb(null, false),
    },
    omstandigheden: {
      zon: vmb<Zonlichtniveau | "unknown">(invoer.zon ?? "unknown", invoer.zon != null),
      grondsoorten: vmb(grondsoorten, grondsoorten.length > 0),
      pH: vmb(pH, pH !== null),
      drainage: vmb<Drainage | "unknown">(invoer.drainage ?? "unknown", invoer.drainage != null),
      waterbehoeften: vmb<Waterbehoeften | "unknown">(invoer.waterbehoeften ?? "unknown", invoer.waterbehoeften != null),
      hardheid: vmb(hardheid, hardheid !== null),
    },
    bloei: {
      maanden: vmb(bloeiMaanden, bloeiMaanden.length > 0),
      kleuren: vmb(bloeiKleuren, bloeiKleuren.length > 0),
      geurig: vmb(null, false),
    },
    onderhoud: {
      snoeien: vmb(null, false),
      bemesten: vmb(null, false),
      overwinteren: vmb(null, false),
    },
    ecologie: {
      bestuivers: vmb([], false),
      begeleiders: vmb({ goed: [], slecht: [] }, false),
      plagen: vmb([], false),
      ziekten: vmb([], false),
      inheems_belgie: vmb(null, false),
      invasief_belgie: vmb(null, false),
    },
    veiligheid: {
      giftig_huisdieren: vmb(null, false),
      giftig_mensen: vmb(null, false),
      eetbare_delen: vmb([], false),
    },
    notities: invoer.notities?.trim() || "",
    zekerheid: { algemeen: 1, notities: "Handmatig ingevoerd door de gebruiker." },
  };
}
