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
  borders: Border[];
  plantPlaatsingen: PlantPlaatsing[];
}

export interface PlantPlaatsing {
  id: string;
  plantSoortId: string;
  wetenschappelijkeNaam: string;
  geplaatst: Date;
  borderId: string | null;
  notitie: string | null;
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
