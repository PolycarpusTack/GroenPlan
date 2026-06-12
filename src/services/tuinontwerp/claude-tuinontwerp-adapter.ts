// SERVER-SIDE ONLY — dit bestand mag nooit in de browser bundle terechtkomen.
// Gebruik HttpTuinOntwerpAdapter in browser-code.
import Anthropic from "@anthropic-ai/sdk";
import type { Zone } from "../../domain/tuin/types";
import type { AutoFillResultaat } from "../../domain/plant/types";
import type { ITuinOntwerpService } from "./tuinontwerp-port";
import type { TuinOntwerpResultaat } from "./types";

const SYSTEEM_PROMPT = `Je bent een professionele Belgische tuinontwerper met expertise in vaste planten, seizoensbeplanting en companion planting. Analyseer de gegeven tuinzone en genereer precies 3 ontwerpvoorstellen in het Nederlands.

Antwoord ALTIJD als geldig JSON — geen markdown, geen uitleg buiten het JSON-object:
{
  "samenvatting": "string (1-2 zinnen over de huidige staat en het potentieel van de zone)",
  "suggesties": [
    {
      "categorie": "plant" | "layout" | "seizoen" | "ecologie",
      "tekst": "string (concrete, specifieke aanbeveling)",
      "prioriteit": "hoog" | "midden" | "laag"
    }
  ],
  "voorstellen": [
    {
      "titel": "string (korte naam voor het concept, max 4 woorden)",
      "beschrijving": "string (2-3 zinnen, concreet voor deze zone)",
      "plantenLijst": ["wetenschappelijkeNaam1", "wetenschappelijkeNaam2"],
      "metrics": {
        "bloeiDekking": <getal 1-10>,
        "companionConflicten": <getal 0-5>,
        "biodiversiteitScore": <getal 0-100>
      },
      "suggesties": [
        {
          "categorie": "plant" | "layout" | "seizoen" | "ecologie",
          "tekst": "string",
          "prioriteit": "hoog" | "midden" | "laag"
        }
      ]
    }
  ]
}

Richtlijnen:
- Genereer ALTIJD precies 3 voorstellen met elk een andere stijl (bijv. formeel / ecologisch / laag-onderhoud)
- Elk voorstel: 3–6 planten in plantenLijst, wetenschappelijke namen
- Houd rekening met hardheidszone, grondsoort, zon, pH en de wens van de gebruiker
- Bloei-dekking (1–10): aantal maanden met bloei in dit ontwerp
- Companion-conflicten (0–5): aantal bekende negatieve combinaties in het voorstel
- Biodiversiteit (0–100): mix van families en bestuivers-waarde
- Suggesties per voorstel: 2–3 concrete tips specifiek voor dat voorstel`;

export class ClaudeTuinOntwerpAdapter implements ITuinOntwerpService {
  private readonly client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is niet ingesteld.");
    this.client = new Anthropic({ apiKey });
  }

  async analyseer(
    zone: Zone,
    catalog: Record<string, AutoFillResultaat>,
    hardheid: number,
    wens: string,
  ): Promise<TuinOntwerpResultaat> {
    const planten = zone.plantPlaatsingen.map((p) => {
      const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
      return {
        wetenschappelijkeNaam: p.wetenschappelijkeNaam,
        gewoneNaam: plant?.identificatie.gewoneNamen.nl ?? null,
        bloeiMaanden: plant?.bloei.maanden.waarde ?? [],
        begeleiders: {
          goed: plant?.ecologie.begeleiders.waarde.goed ?? [],
          slecht: plant?.ecologie.begeleiders.waarde.slecht ?? [],
        },
        hoogte_cm: plant?.groei.volwassenHoogte_cm.waarde ?? null,
      };
    });

    const invoer = {
      naam: zone.naam,
      zon: zone.zon,
      grondsoort: zone.grondsoort,
      pH: zone.pH,
      drainage: zone.drainage,
      hardheid,
      aantalPlanten: zone.plantPlaatsingen.length,
      planten,
      ...(wens.trim() && { wens: wens.trim() }),
    };

    const bericht = await this.client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: SYSTEEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyseer deze tuinzone en genereer 3 ontwerpvoorstellen:\n\n${JSON.stringify(invoer, null, 2)}`,
        },
      ],
    });

    const tekst = bericht.content.find((b) => b.type === "text")?.text ?? "{}";

    let resultaat: TuinOntwerpResultaat;
    try {
      resultaat = JSON.parse(tekst) as TuinOntwerpResultaat;
    } catch {
      throw new Error("Kon het antwoord van de AI niet verwerken — ongeldige JSON.");
    }

    if (!resultaat.samenvatting || !Array.isArray(resultaat.suggesties) || !Array.isArray(resultaat.voorstellen)) {
      throw new Error("Onvolledig antwoord van de AI.");
    }

    return resultaat;
  }
}
