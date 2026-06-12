// SERVER-SIDE ONLY — wordt alleen dynamisch door de Vite-middleware geïmporteerd.
// Mag nooit in de browser bundle terechtkomen (anti-layer-bleeding, G-TS-01).
import Anthropic from "@anthropic-ai/sdk";
import type { PlagenResultaat, PlagenBevinding, PlagenErnst, BevindingType } from "./types";

const MODEL = "claude-opus-4-7"; // visuele diagnose vraagt sterke redenering

const ERNST_WAARDEN: PlagenErnst[] = ["laag", "midden", "hoog"];
const TYPE_WAARDEN: BevindingType[] = ["plaag", "ziekte", "tekort", "gezond"];

// LLM-uitvoer is niet te vertrouwen: maak elke bevinding robuust zodat de UI
// nooit breekt op een afwijkend antwoord (clamp getallen, val terug op defaults).
function normaliseerBevinding(ruw: unknown): PlagenBevinding | null {
  if (typeof ruw !== "object" || ruw === null) return null;
  const b = ruw as Record<string, unknown>;
  const naam = typeof b.naam === "string" && b.naam.trim() ? b.naam.trim() : null;
  if (!naam) return null;
  const type = TYPE_WAARDEN.includes(b.type as BevindingType) ? (b.type as BevindingType) : "plaag";
  const ernst = ERNST_WAARDEN.includes(b.ernst as PlagenErnst) ? (b.ernst as PlagenErnst) : "midden";
  const zekerheidRuw = typeof b.zekerheid === "number" ? b.zekerheid : 0.5;
  return {
    naam,
    type,
    wetenschappelijkeNaam: typeof b.wetenschappelijkeNaam === "string" ? b.wetenschappelijkeNaam : null,
    zekerheid: Math.max(0, Math.min(1, zekerheidRuw)),
    ernst,
    symptomen: typeof b.symptomen === "string" ? b.symptomen : "",
    aanbevolenActie: typeof b.aanbevolenActie === "string" ? b.aanbevolenActie : "",
    biologisch: b.biologisch === true,
  };
}

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
function normaliseerMediaType(mimeType: string): MediaType {
  const m = mimeType.toLowerCase();
  if (m === "image/png") return "image/png";
  if (m === "image/gif") return "image/gif";
  if (m === "image/webp") return "image/webp";
  return "image/jpeg";
}

const SYSTEEM_PROMPT = `Je bent een Belgische plantendokter, gespecialiseerd in plagen, ziekten en gebreksverschijnselen bij tuinplanten. Je analyseert één plantfoto.

Antwoord ALTIJD als geldig JSON — geen markdown, geen tekst buiten het JSON-object:
{
  "samenvatting": "string (1-2 zinnen, Nederlands, wat je op de foto ziet)",
  "bevindingen": [
    {
      "naam": "string (NL naam, bv. 'Bladluis' of 'Echte meeldauw')",
      "type": "plaag" | "ziekte" | "tekort" | "gezond",
      "wetenschappelijkeNaam": "string of null (laat null als je het niet zeker weet — nooit verzinnen)",
      "zekerheid": <getal 0.0-1.0>,
      "ernst": "laag" | "midden" | "hoog",
      "symptomen": "string (concreet wat zichtbaar is)",
      "aanbevolenActie": "string (concrete, veilige vervolgstap)",
      "biologisch": <true als de aanbevolen aanpak biologisch/ecologisch is>
    }
  ]
}

Strikte regels (anti-hallucinatie):
- Verzin NOOIT een plaag of ziekte. Bij twijfel: lage zekerheid en een 'controleer'-actie.
- Als de plant er gezond uitziet: één bevinding met type "gezond", ernst "laag", zekerheid op je werkelijke inschatting.
- Als de foto onbruikbaar is (wazig, geen plant): lege "bevindingen" en leg dat uit in "samenvatting".
- Geef voorrang aan biologische/preventieve maatregelen boven chemische bestrijding.
- Maximaal 3 bevindingen, gesorteerd op zekerheid (hoogste eerst).`;

export async function analyseerPlagen(
  base64: string,
  mimeType: string,
  plantNaam: string | null,
  queryId: string,
): Promise<PlagenResultaat> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is niet ingesteld.");
  const client = new Anthropic({ apiKey });

  const context = plantNaam
    ? `De plant is eerder geïdentificeerd als: ${plantNaam}. Analyseer de foto op plagen, ziekten of gebreksverschijnselen.`
    : `Analyseer deze plantfoto op plagen, ziekten of gebreksverschijnselen.`;

  const bericht = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: normaliseerMediaType(mimeType), data: base64 } },
          { type: "text", text: context },
        ],
      },
    ],
  });

  const tekst = bericht.content.find((b) => b.type === "text")?.text ?? "{}";

  let geparsed: { samenvatting?: unknown; bevindingen?: unknown };
  try {
    geparsed = JSON.parse(tekst) as { samenvatting?: unknown; bevindingen?: unknown };
  } catch {
    throw new Error("Kon het antwoord van de AI niet verwerken — ongeldige JSON.");
  }

  if (typeof geparsed.samenvatting !== "string" || !Array.isArray(geparsed.bevindingen)) {
    throw new Error("Onvolledig antwoord van de AI.");
  }

  const bevindingen = geparsed.bevindingen
    .map(normaliseerBevinding)
    .filter((b): b is PlagenBevinding => b !== null)
    .sort((a, b) => b.zekerheid - a.zekerheid)
    .slice(0, 3);

  return { samenvatting: geparsed.samenvatting, bevindingen, queryId };
}
