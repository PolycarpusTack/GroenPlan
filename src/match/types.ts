// Match score types — bron: GroenPlan_MatchScore_Algorithm.md
import type { Grondsoort, Zonlichtniveau, Drainage, Waterbehoeften } from "../domain/plant/types";

export interface PlantInvoer {
  wetenschappelijkeNaam: string;
  omstandigheden: {
    zon: Zonlichtniveau | "unknown";
    grondsoorten: Grondsoort[];
    pH: { min: number; max: number } | null;
    drainage: Drainage | "unknown";
    waterbehoeften: Waterbehoeften | "unknown";
    hardheid: { usda_min: number; usda_max: number | null } | null;
  };
  bloei: { maanden: number[] };
}

export interface ZoneInvoer {
  zon: Zonlichtniveau;
  grondsoort: Grondsoort;
  pH: number | null;
  drainage: Drainage;
  regenval_mm_7d?: number;
}

export interface MatchContext {
  plant: PlantInvoer;
  zone: ZoneInvoer;
  tuinHardheid: number;
  bestaandeBloeiMaanden: number[];
}

export type Criterium = "grond" | "zon" | "pH" | "water" | "hardheid" | "bloeiGap";

export interface CriteriumResultaat {
  criterium: Criterium;
  gewicht: number;
  rawScore: number;
  bijdrage: number;
  motivatie: string;
  ontbreekt: boolean;
}

export interface MatchResultaat {
  plant: string;
  score: number;
  beoordeling: "uitstekend" | "goed" | "matig" | "slecht";
  breakdown: Record<Criterium, CriteriumResultaat>;
  ontbrekendData: Criterium[];
  topRedenen: string[];
  aandachtspunten: string[];
}
