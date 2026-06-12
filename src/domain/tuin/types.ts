// Zone en Tuin domein types
import type { Grondsoort, Zonlichtniveau, Drainage } from "../plant/types";

export interface Border {
  id: string;
  naam: string;
}

export interface Zone {
  id: string;
  naam: string;
  grondsoort: Grondsoort;
  zon: Zonlichtniveau;
  pH: number | null;
  drainage: Drainage;
  gemeente: string | null;
  regenval_mm_7d: number | null;
  /** Werkelijke afmetingen in meter; null = onbekend (kaart valt terug op auto-layout). */
  breedte_m: number | null;
  diepte_m: number | null;
  borders: Border[];
  plantPlaatsingen: PlantPlaatsing[];
}

/** Door de gebruiker geobserveerde conditie — nooit door AI ingevuld. */
export type PlantGezondheid = "gezond" | "zorgwekkend" | "dood";

export interface PlantPlaatsing {
  id: string;
  plantSoortId: string;
  wetenschappelijkeNaam: string;
  geplaatst: Date;
  borderId: string | null;
  notitie: string | null;
  /** Positie in meter t.o.v. de linkerbovenhoek van de zone; null = nog niet geplaatst op de kaart. */
  x_m: number | null;
  y_m: number | null;
  gezondheid: PlantGezondheid | null;
}

export interface Tuin {
  id: string;
  naam: string;
  eigenaarId: string;
  hardheid: number;
  zones: Zone[];
  aangemaaktOp: Date;
}

// Hulptype voor het aanmaken/bewerken van een zone (zonder beheerde velden)
export type ZoneInput = Omit<Zone, "plantPlaatsingen" | "borders">;
