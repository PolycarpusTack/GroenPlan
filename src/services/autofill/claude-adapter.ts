// Claude Sonnet adapter — enige plek in het project die @anthropic-ai/sdk importeert
// Domein en UI importeren NOOIT deze file rechtstreeks — gebruik AutoFillService
import Anthropic from "@anthropic-ai/sdk";
import type { AutoFillPort, AutoFillOpties } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";
import { AUTOFILL_SYSTEEMPROMPT, bouwGebruikersBericht } from "./prompt";
import { parseAutoFillJson, AutoFillValidatieFout } from "./validator";

const BRON_VERSIE = "claude-sonnet-4-6-v1";
const MODEL = "claude-sonnet-4-6";

export class ClaudeAutoFillAdapter implements AutoFillPort {
  private readonly client: Anthropic;

  constructor(apiSleutel?: string) {
    const sleutel = apiSleutel ?? process.env.ANTHROPIC_API_KEY;
    if (!sleutel) throw new Error("ANTHROPIC_API_KEY is niet ingesteld.");
    this.client = new Anthropic({ apiKey: sleutel });
  }

  async vulAan(
    wetenschappelijkeNaam: string,
    opties: AutoFillOpties = {},
  ): Promise<AutoFillResultaat> {
    const eersteAntwoord = await this.roepClaudeAan(wetenschappelijkeNaam, opties);
    try {
      return parseAutoFillJson(eersteAntwoord);
    } catch (fout) {
      // Spec §6: enkel bij een JSON-parsefout één retry met assistant-prefill "{".
      // Schema-validatiefouten worden NIET geretried (gebruiker krijgt manuele invulvorm).
      if (fout instanceof AutoFillValidatieFout && fout.veld === "json") {
        const tweedeAntwoord = await this.roepClaudeAan(wetenschappelijkeNaam, opties, true);
        return parseAutoFillJson(tweedeAntwoord);
      }
      throw fout;
    }
  }

  private async roepClaudeAan(
    wetenschappelijkeNaam: string,
    opties: AutoFillOpties,
    prefillJson = false,
  ): Promise<string> {
    const berichten: Anthropic.MessageParam[] = [
      { role: "user", content: bouwGebruikersBericht(wetenschappelijkeNaam, opties) },
    ];
    // Assistant-prefill dwingt het antwoord om met "{" te beginnen → geldige JSON.
    if (prefillJson) berichten.push({ role: "assistant", content: "{" });

    const bericht = await this.client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: AUTOFILL_SYSTEEMPROMPT,
          // Prompt caching: systeem-prompt wordt gecached na eerste aanroep
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: berichten,
    });

    const inhoud = bericht.content[0];
    if (inhoud.type !== "text") {
      throw new Error("Onverwacht antwoordtype van Claude");
    }

    // Bij prefill bevat het antwoord de openende "{" niet → terug vooraan plakken.
    return prefillJson ? "{" + inhoud.text : inhoud.text;
  }

  static get bronVersie(): string {
    return BRON_VERSIE;
  }
}
