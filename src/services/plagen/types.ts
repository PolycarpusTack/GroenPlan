// Plagen- & ziektedetectie — types. Supporting subdomein, achter de Veld-modus
// foto-flow. Houdt de Anthropic SDK buiten de browser (zie claude-plagen-adapter).

export type PlagenErnst = "laag" | "midden" | "hoog";

export type BevindingType = "plaag" | "ziekte" | "tekort" | "gezond";

export interface PlagenBevinding {
  naam: string;                       // bv. "Bladluis", "Echte meeldauw"
  type: BevindingType;
  wetenschappelijkeNaam: string | null; // null indien onbekend — nooit verzinnen
  zekerheid: number;                  // 0–1
  ernst: PlagenErnst;
  symptomen: string;                  // korte beschrijving van wat zichtbaar is
  aanbevolenActie: string;            // concrete vervolgstap
  biologisch: boolean;                // is de aanbevolen aanpak biologisch/ecologisch
}

export interface PlagenResultaat {
  bevindingen: PlagenBevinding[];
  samenvatting: string;
  queryId: string;
  // "ai" = Claude-vision via backend, "lokaal" = heuristische reserve
  // (geen backend/API-sleutel of geen netwerk).
  bron?: "ai" | "lokaal";
}
