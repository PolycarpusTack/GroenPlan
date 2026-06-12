// Domein types voor PlantSoort en AutoFill — bron: GroenPlan_AutoFill_Prompt_Spec.md

export type Grondsoort = "clay" | "sand" | "loam" | "chalk" | "peat";
export type Zonlichtniveau = "full" | "partial" | "shade";
export type Drainage = "well-drained" | "moist" | "wet";
export type Waterbehoeften = "low" | "medium" | "high";
export type PlantType =
  | "annual" | "biennial" | "perennial" | "shrub" | "tree"
  | "climber" | "bulb" | "tuber" | "grass" | "fern" | "unknown";

export type AutoFillBron =
  | "RHS" | "Trefle" | "GBIF" | "Wikipedia" | "USDA"
  | "Velt" | "AI-knowledge" | "handmatig" | "unknown";

export interface VeldMetBron<T> {
  waarde: T;
  bron: AutoFillBron;
  terugval?: boolean;
  notitie?: string;
}

export interface AutoFillResultaat {
  identificatie: {
    wetenschappelijkeNaam: string;
    soort: string;
    cultivar: string | null;
    gewoneNamen: { nl: string | null; en: string | null; fr: string | null };
    familie: string;
    type: PlantType;
  };
  groei: {
    volwassenHoogte_cm: VeldMetBron<{ min: number; max: number } | null>;
    volwassenBreedte_cm: VeldMetBron<{ min: number; max: number } | null>;
    plantafstand_cm: VeldMetBron<number | null>;
    groeisnelheid: VeldMetBron<"slow" | "medium" | "fast" | null>;
  };
  omstandigheden: {
    zon: VeldMetBron<Zonlichtniveau | "unknown">;
    grondsoorten: VeldMetBron<Grondsoort[]>;
    pH: VeldMetBron<{ min: number; max: number } | null>;
    drainage: VeldMetBron<Drainage | "unknown">;
    waterbehoeften: VeldMetBron<Waterbehoeften | "unknown">;
    hardheid: VeldMetBron<{ usda_min: number; usda_max: number | null } | null>;
  };
  bloei: {
    maanden: VeldMetBron<number[]>;
    kleuren: VeldMetBron<string[]>;
    geurig: VeldMetBron<boolean | null>;
  };
  onderhoud: {
    snoeien: VeldMetBron<{ wanneer: string; hoe: string } | null>;
    bemesten: VeldMetBron<string | null>;
    overwinteren: VeldMetBron<string | null>;
  };
  ecologie: {
    bestuivers: VeldMetBron<Array<"bees" | "butterflies" | "hoverflies" | "moths" | "birds">>;
    begeleiders: VeldMetBron<{ goed: string[]; slecht: string[] }>;
    plagen: VeldMetBron<string[]>;
    ziekten: VeldMetBron<string[]>;
    inheems_belgie: VeldMetBron<boolean | null>;
    invasief_belgie: VeldMetBron<boolean | null>;
  };
  veiligheid: {
    giftig_huisdieren: VeldMetBron<boolean | null>;
    giftig_mensen: VeldMetBron<boolean | null>;
    eetbare_delen: VeldMetBron<string[]>;
  };
  notities: string;
  // terugval=true → resultaat komt van de lokale reserve (geen AI). De UI markeert
  // dit en de service cachet het niet, zodat de echte AI later alsnog wordt geprobeerd.
  zekerheid: { algemeen: number; notities: string; terugval?: boolean };
}

// PlantSoort = domeinentiteit die AutoFillResultaat + gebruikersaanpassingen bevat
export interface PlantSoort {
  id: string;
  autoFill: AutoFillResultaat;
  gebruikerOverrides: Partial<AutoFillResultaat>;
  gecacheAt: Date;
  bronVersie: string;
}

// Gecombineerde weergave (autoFill + overrides), gebruikt door match engine en UI
export type PlantSoortWeergave = AutoFillResultaat & {
  id: string;
  gecacheAt: Date;
};
