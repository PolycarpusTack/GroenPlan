// Browser-safe adapter — roept /api/autofill aan op de dev/productie server
// Vervangt ClaudeAutoFillAdapter in browser context (anti-layer-bleeding guardrail)
import type { AutoFillPort, AutoFillOpties } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";
import { valideerAutoFillResultaat } from "./validator";

// Pure mapping van een serverfout naar een begrijpelijke NL-melding. Apart en
// geëxporteerd zodat ze zonder fetch-mock te testen is.
export function vriendelijkeAutofillFout(status: number, serverFout: string): string {
  const f = serverFout.toLowerCase();
  if (
    f.includes("anthropic_api_key") ||
    f.includes("authentication") ||
    f.includes("api key") ||
    f.includes("apikey") ||
    f.includes("api-key")
  ) {
    return "AI-plantdata is niet beschikbaar: de Anthropic API-sleutel (ANTHROPIC_API_KEY) ontbreekt of is ongeldig. Voeg hem toe aan .env en herstart de server.";
  }
  if (serverFout.trim()) return `AI-plantdata mislukt: ${serverFout}`;
  return `AI-plantdata mislukt (serverfout ${status}).`;
}

export class HttpAutoFillAdapter implements AutoFillPort {
  private readonly eindpunt: string;

  constructor(eindpunt = "/api/autofill") {
    this.eindpunt = eindpunt;
  }

  async vulAan(
    wetenschappelijkeNaam: string,
    opties: AutoFillOpties = {},
  ): Promise<AutoFillResultaat> {
    const params = new URLSearchParams({
      naam: wetenschappelijkeNaam,
      taal: opties.taal ?? "nl",
      regio: opties.regio ?? "BE-VL",
      ...(opties.fotoHint ? { fotoHint: opties.fotoHint } : {}),
    });

    let antwoord: Response;
    try {
      antwoord = await fetch(`${this.eindpunt}?${params}`);
    } catch {
      throw new Error(
        "AI-plantdata is niet bereikbaar — controleer je internetverbinding of of de dev-server draait.",
      );
    }

    if (!antwoord.ok) {
      const serverFout = await this.leesServerFout(antwoord);
      throw new Error(vriendelijkeAutofillFout(antwoord.status, serverFout));
    }

    let data: unknown;
    try {
      data = await antwoord.json();
    } catch {
      throw new Error(
        "AI-plantdata kon niet gelezen worden — draait de dev-server met de API-endpoints (/api/autofill)?",
      );
    }
    return valideerAutoFillResultaat(data);
  }

  private async leesServerFout(antwoord: Response): Promise<string> {
    try {
      const body = (await antwoord.json()) as { fout?: string };
      return body.fout ?? "";
    } catch {
      return "";
    }
  }
}
