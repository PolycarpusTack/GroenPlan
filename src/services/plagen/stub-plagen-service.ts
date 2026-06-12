import type { IPlagenService } from "./plagen-port";
import type { PlagenResultaat, PlagenBevinding } from "./types";

// Lokale reserve: levert een deterministisch demo-resultaat op basis van de
// bestandsnaam (zelfde foto → zelfde uitkomst). Verzint niets — het resultaat
// wordt in de UI duidelijk als "lokaal demo" gemarkeerd.
const DEMO_BEVINDINGEN: PlagenBevinding[] = [
  {
    naam: "Bladluis", type: "plaag", wetenschappelijkeNaam: "Aphidoidea", zekerheid: 0.62, ernst: "midden",
    symptomen: "Kleine groene of zwarte insecten op jonge scheuten en de onderkant van bladeren.",
    aanbevolenActie: "Spuit af met water of een zachte zeepoplossing; trek lieveheersbeestjes aan.",
    biologisch: true,
  },
  {
    naam: "Echte meeldauw", type: "ziekte", wetenschappelijkeNaam: "Erysiphales", zekerheid: 0.55, ernst: "midden",
    symptomen: "Witte, poederachtige waas op het bladoppervlak.",
    aanbevolenActie: "Verwijder aangetast blad, zorg voor luchtcirculatie en vermijd nat blad 's avonds.",
    biologisch: true,
  },
  {
    naam: "Stikstoftekort", type: "tekort", wetenschappelijkeNaam: null, zekerheid: 0.48, ernst: "laag",
    symptomen: "Vergeling van oudere bladeren, trage groei.",
    aanbevolenActie: "Werk gecomposteerde mest of een organische stikstofmeststof licht in de bodem.",
    biologisch: true,
  },
  {
    naam: "Geen aandoening zichtbaar", type: "gezond", wetenschappelijkeNaam: null, zekerheid: 0.7, ernst: "laag",
    symptomen: "Het blad oogt egaal en vitaal, geen duidelijke aantasting.",
    aanbevolenActie: "Geen actie nodig. Blijf wekelijks controleren op vroege symptomen.",
    biologisch: true,
  },
];

export class StubPlagenService implements IPlagenService {
  async analyseer(afbeelding: File, plantNaam?: string): Promise<PlagenResultaat> {
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

    const seed = afbeelding.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bevinding = DEMO_BEVINDINGEN[seed % DEMO_BEVINDINGEN.length];
    const context = plantNaam ? ` op ${plantNaam}` : "";

    return {
      bevindingen: [bevinding],
      samenvatting:
        bevinding.type === "gezond"
          ? `Geen duidelijke plaag of ziekte${context} herkend op deze foto.`
          : `Mogelijke ${bevinding.naam.toLowerCase()}${context} herkend — controleer dit ter plaatse.`,
      queryId: `stub-${seed}`,
    };
  }
}
