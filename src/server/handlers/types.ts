// Framework-agnostische API-laag. Dezelfde handlers worden gebruikt door de Vite
// dev-middleware (vite.config.ts) én de Express-productieserver (main.ts), zodat
// er één bron van waarheid is voor het /api-gedrag — los van waar het draait.

export interface ApiVerzoek {
  query: URLSearchParams;
  body: unknown;
}

export interface ApiAntwoord {
  status: number;
  body: unknown;
}

export type ApiHandler = (verzoek: ApiVerzoek) => Promise<ApiAntwoord>;

export interface ApiRoute {
  pad: string;
  methode: "GET" | "POST";
  handler: ApiHandler;
}
