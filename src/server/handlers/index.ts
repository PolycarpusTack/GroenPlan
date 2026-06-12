import type { ApiAntwoord, ApiHandler, ApiRoute, ApiVerzoek } from "./types";
import { autofillHandler } from "./autofill-handler";
import { tuinontwerpHandler } from "./tuinontwerp-handler";
import { coachHandler } from "./coach-handler";
import { plagenHandler } from "./plagen-handler";
import { plantnetHandler } from "./plantnet-handler";

export const apiRoutes: ApiRoute[] = [
  { pad: "/api/autofill", methode: "GET", handler: autofillHandler },
  { pad: "/api/tuinontwerp", methode: "POST", handler: tuinontwerpHandler },
  { pad: "/api/coach", methode: "POST", handler: coachHandler },
  { pad: "/api/plagen", methode: "POST", handler: plagenHandler },
  { pad: "/api/plantnet", methode: "POST", handler: plantnetHandler },
];

// Centrale uitvoering met uniforme foutafhandeling: een onverwachte fout wordt
// 500 { fout: "..." } — precies zoals de oorspronkelijke Vite-middleware deed.
export async function voerApiUit(handler: ApiHandler, verzoek: ApiVerzoek): Promise<ApiAntwoord> {
  try {
    return await handler(verzoek);
  } catch (e) {
    const fout = e instanceof Error ? e.message : "Onbekende fout";
    return { status: 500, body: { fout } };
  }
}

export type { ApiAntwoord, ApiHandler, ApiRoute, ApiVerzoek } from "./types";
