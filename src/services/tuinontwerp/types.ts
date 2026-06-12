export interface TuinOntwerpSuggestie {
  categorie: "plant" | "layout" | "seizoen" | "ecologie";
  tekst: string;
  prioriteit: "hoog" | "midden" | "laag";
}

export interface TuinOntwerpVoorstel {
  titel: string;
  beschrijving: string;
  plantenLijst: string[];
  metrics: {
    bloeiDekking: number;
    companionConflicten: number;
    biodiversiteitScore: number;
  };
  suggesties: TuinOntwerpSuggestie[];
}

export interface TuinOntwerpResultaat {
  samenvatting: string;
  suggesties: TuinOntwerpSuggestie[];
  voorstellen: TuinOntwerpVoorstel[];
  // Welke bron het resultaat leverde: "ai" = Claude Opus via backend,
  // "lokaal" = heuristische reserve (geen backend/API-sleutel beschikbaar).
  bron?: "ai" | "lokaal";
}
