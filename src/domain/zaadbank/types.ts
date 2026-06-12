// Zaadbank — bijhouden van zaadvoorraad, zaaivensters en houdbaarheid.
// Fase 3 supporting feature; koppelt optioneel aan de plantencatalogus.

export type ZaadStatus = "voorraad" | "gezaaid" | "op";

export interface Zaad {
  id: string;
  naam: string;                          // gewone naam (NL)
  wetenschappelijkeNaam: string | null;  // optionele koppeling aan catalogus
  leverancier: string | null;
  aantal: number | null;                 // aantal zaden of zakjes
  houdbaarTot: string | null;            // YYYY-MM
  zaaiVan: number | null;                // maand 1–12 (begin zaaivenster)
  zaaiTot: number | null;                // maand 1–12 (einde zaaivenster)
  status: ZaadStatus;
  notitie: string | null;
  aangemaakt: Date;
}
