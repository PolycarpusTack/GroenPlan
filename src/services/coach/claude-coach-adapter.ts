// SERVER-SIDE ONLY — wordt alleen dynamisch door de Vite-middleware geïmporteerd.
// Mag nooit in de browser bundle terechtkomen (anti-layer-bleeding, G-TS-01).
import Anthropic from "@anthropic-ai/sdk";
import type { CoachAntwoord } from "./types";

const MODEL = "claude-sonnet-4-6"; // conversationele Q&A — snel en kostenefficiënt

const SYSTEEM_PROMPT = `Je bent een ervaren Belgische (Vlaamse) tuincoach. Je beantwoordt praktische tuinvragen in het Nederlands, kort en concreet, afgestemd op het Belgische klimaat (hardheidszone 8) en seizoen.

Regels:
- Antwoord in 2–5 zinnen of een korte opsomming. Geen inleiding, geen herhaling van de vraag.
- Geef voorrang aan biologische, preventieve en ecologische aanpak.
- Wees eerlijk: weet je het niet zeker, zeg dat en stel voor het ter plaatse te controleren of een vakman te raadplegen. Verzin geen feiten.
- Bij twijfel over giftigheid of veiligheid: adviseer voorzichtigheid.
- Schrijf platte tekst (geen markdown-kopjes).`;

export async function vraagCoach(vraag: string, context: string | null): Promise<CoachAntwoord> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is niet ingesteld.");
  const client = new Anthropic({ apiKey });

  const inhoud = context
    ? `Context: ${context}\n\nVraag: ${vraag}`
    : vraag;

  const bericht = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEEM_PROMPT,
    messages: [{ role: "user", content: inhoud }],
  });

  const antwoord = bericht.content.find((b) => b.type === "text")?.text?.trim() ?? "";
  if (!antwoord) throw new Error("Leeg antwoord van de AI.");

  return { antwoord };
}
