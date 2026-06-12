# GroenPlan — AI Auto-Fill Prompt Spec

**Versie:** 0.1
**Doel:** Eén Anthropic API call die op basis van een plantnaam (of foto-resultaat van PlantNet) alle PlantSoort-velden invult als gestructureerde JSON, met **bron-attributie per veld** en expliciete confidence.

---

## 1. Ontwerpprincipes

1. **Eén call, één JSON.** Geen multi-turn chain. De UI moet binnen 2–4s een ingevuld formulier krijgen.
2. **Bron per veld, niet per document.** "Bloeiperiode: juni–september · via RHS" is anders dan "Hoogte: 40 cm · via AI-knowledge, te controleren". De gebruiker moet per veld weten waar het vandaan komt.
3. **`unknown` is een correct antwoord.** Beter een leeg veld met "unknown" dan een gehallucineerd cijfer. De UI markeert deze velden voor handmatige invulling.
4. **Cultivars worden herkend.** `Lavandula angustifolia 'Hidcote'` is iets anders dan `Lavandula angustifolia`. Als cultivar-specifieke data ontbreekt, gebruik species-level met expliciete `fallback: true` per veld.
5. **Geen LLM-redenering in output.** De output is data, niet proza. Alle motivering staat in het `notes`-veld of in `confidence.notes`.

---

## 2. Output schema (TypeScript)

```typescript
type Source =
  | "RHS"           // Royal Horticultural Society
  | "Trefle"        // open botanical DB
  | "GBIF"          // taxonomy backbone
  | "Wikipedia"
  | "USDA"          // hardiness, agronomy
  | "Velt"          // Vlaamse ecologische bron
  | "AI-knowledge"  // LLM eigen kennis, expliciet gemarkeerd
  | "unknown";

type FieldWithSource<T> = {
  value: T;
  source: Source;
  fallback?: boolean;       // true = species-level data gebruikt voor cultivar
  note?: string;            // optionele beknopte aanvulling
};

type AutoFillResult = {
  identifier: {
    scientificName: string;       // canonical Latin, incl. cultivar quote-notatie
    species: string;              // genus + species zonder cultivar
    cultivar: string | null;
    commonNames: {
      nl: string | null;
      en: string | null;
      fr: string | null;
    };
    family: string;
    type: "annual" | "biennial" | "perennial" | "shrub" | "tree"
        | "climber" | "bulb" | "tuber" | "grass" | "fern" | "unknown";
  };

  growing: {
    matureHeight_cm: FieldWithSource<{ min: number; max: number } | null>;
    matureWidth_cm:  FieldWithSource<{ min: number; max: number } | null>;
    plantingDistance_cm: FieldWithSource<number | null>;
    growthRate: FieldWithSource<"slow" | "medium" | "fast" | null>;
  };

  conditions: {
    sun:       FieldWithSource<"full" | "partial" | "shade" | "unknown">;
    soilTypes: FieldWithSource<Array<"clay" | "sand" | "loam" | "chalk" | "peat">>;
    pH:        FieldWithSource<{ min: number; max: number } | null>;
    drainage:  FieldWithSource<"well-drained" | "moist" | "wet" | "unknown">;
    waterNeed: FieldWithSource<"low" | "medium" | "high" | "unknown">;
    hardiness: FieldWithSource<{ usda_min: number; usda_max: number | null } | null>;
  };

  bloom: {
    months:   FieldWithSource<number[]>;           // 1..12
    colors:   FieldWithSource<string[]>;           // CSS-named of hex
    fragrant: FieldWithSource<boolean | null>;
  };

  maintenance: {
    pruning:       FieldWithSource<{ when: string; how: string } | null>;
    fertilizing:   FieldWithSource<string | null>;
    overwintering: FieldWithSource<string | null>;
  };

  ecology: {
    pollinators: FieldWithSource<Array<"bees" | "butterflies" | "hoverflies" | "moths" | "birds">>;
    companions:  FieldWithSource<{ good: string[]; bad: string[] }>;
    pests:       FieldWithSource<string[]>;
    diseases:    FieldWithSource<string[]>;
    native_to_belgium: FieldWithSource<boolean | null>;
    invasive_in_belgium: FieldWithSource<boolean | null>;
  };

  safety: {
    toxic_to_pets:   FieldWithSource<boolean | null>;
    toxic_to_humans: FieldWithSource<boolean | null>;
    edible_parts:    FieldWithSource<string[]>;   // leeg = niet eetbaar
  };

  notes: string;                  // korte vrije tekst met onderscheidende kenmerken (≤ 400 chars)
  confidence: {
    overall: number;              // 0..1
    notes: string;                // ≤ 200 chars, waarom hoog/laag
  };
};
```

---

## 3. System prompt

```text
You are a botanical data assistant for GroenPlan, a garden management
application. Your job: given a plant identifier (scientific name, common name,
or both), return a strict JSON object matching the AutoFillResult schema.

Rules:

1. RETURN ONLY VALID JSON. No markdown, no prose, no code fences. The first
   character of your response is `{` and the last is `}`.

2. SCHEMA COMPLIANCE IS MANDATORY. Every field in the schema must be present.
   Use `null` for unknown numeric/object values; use `"unknown"` for unknown
   enum values where the schema permits it; use empty arrays `[]` for unknown
   list values.

3. SOURCE ATTRIBUTION PER FIELD. Each `FieldWithSource` must include a
   `source` value. Choose the most authoritative source you can justify:
   - "RHS" for UK-horticulture data (bloom, pruning, sun)
   - "Trefle" or "GBIF" for taxonomic / morphological data
   - "USDA" for hardiness zones
   - "Velt" for Belgian ecological context (native, pollinators)
   - "Wikipedia" for general fallback
   - "AI-knowledge" ONLY when you are stating it from your own training and
     cannot point to a more specific source. Use this honestly — it signals
     the UI to flag the field for user review.
   - "unknown" if you genuinely cannot give a value and have no source.

4. PREFER `unknown` OVER GUESSING. If you are not confident about a numeric
   range, set value to `null` and source to `"unknown"`. Hallucinated numbers
   damage trust more than missing fields.

5. CULTIVAR HANDLING. If the user provides a cultivar (e.g. `Lavandula
   angustifolia 'Hidcote'`):
   - Use cultivar-specific data where you have it.
   - Where you fall back to species-level data, set `fallback: true` on that
     field.
   - Always populate `identifier.species` (without cultivar) and
     `identifier.cultivar` separately.

6. COMMON NAMES. Provide Dutch, English, and French common names when known.
   Set `null` for languages you don't have a name for. Do not invent
   translations.

7. BELGIAN CONTEXT. `native_to_belgium` and `invasive_in_belgium` should
   reflect Belgium specifically, not the broader region. Source = "Velt" or
   "AI-knowledge" with low confidence if uncertain.

8. NOTES FIELD. The `notes` string contains 1–3 sentences (max 400 chars)
   highlighting what makes this plant distinctive or worth knowing. Plain
   Dutch, no marketing language.

9. CONFIDENCE. `confidence.overall` is a value in [0, 1]:
   - 0.9+ for well-documented common garden plants (lavender, hosta, hydrangea)
   - 0.6–0.9 for known but less common species
   - 0.3–0.6 for rare species or obscure cultivars
   - <0.3 for genuine uncertainty — pair with `null` values across the schema
   `confidence.notes` (≤ 200 chars) explains the score in plain language.

10. NO META-COMMENTARY. Do not explain your reasoning, do not apologize for
    missing data, do not add disclaimers outside the schema. Output is data.
```

---

## 4. User message format

The user message is minimal — just the identifier. Optional context fields are appended when available:

```text
PLANT: <scientific name or common name as entered by user>
[PHOTO_ID_HINT: <PlantNet result if photo was used>, confidence: 0.XX]
[USER_LANGUAGE: nl]  // default; affects which common name takes priority in `notes`
[REGION: BE-VL]      // default; affects native/invasive judgement
```

Example:

```text
PLANT: Lavandula angustifolia 'Hidcote'
USER_LANGUAGE: nl
REGION: BE-VL
```

---

## 5. Few-shot examples

The system prompt above is sufficient on its own — Claude does not need few-shot examples for this task at Sonnet 4.5 level. But for evaluation and regression-testing, the following expected outputs serve as golden cases.

### 5.1 Common garden plant (high confidence)

**Input:** `PLANT: Lavandula angustifolia 'Hidcote' / nl / BE-VL`

**Expected snippet** (illustratief, niet volledig):

```json
{
  "identifier": {
    "scientificName": "Lavandula angustifolia 'Hidcote'",
    "species": "Lavandula angustifolia",
    "cultivar": "Hidcote",
    "commonNames": {
      "nl": "Echte lavendel 'Hidcote'",
      "en": "English Lavender 'Hidcote'",
      "fr": "Lavande vraie 'Hidcote'"
    },
    "family": "Lamiaceae",
    "type": "shrub"
  },
  "growing": {
    "matureHeight_cm": { "value": { "min": 40, "max": 60 }, "source": "RHS" },
    "matureWidth_cm":  { "value": { "min": 50, "max": 75 }, "source": "RHS" },
    "plantingDistance_cm": { "value": 40, "source": "RHS" },
    "growthRate": { "value": "medium", "source": "RHS", "fallback": true }
  },
  "conditions": {
    "sun":       { "value": "full", "source": "RHS" },
    "soilTypes": { "value": ["sand", "loam", "chalk"], "source": "RHS" },
    "pH":        { "value": { "min": 6.5, "max": 8.0 }, "source": "RHS" },
    "drainage":  { "value": "well-drained", "source": "RHS" },
    "waterNeed": { "value": "low", "source": "RHS" },
    "hardiness": { "value": { "usda_min": 5, "usda_max": 9 }, "source": "USDA" }
  },
  "bloom": {
    "months":   { "value": [6, 7, 8], "source": "RHS" },
    "colors":   { "value": ["#6F5B9B", "violet"], "source": "RHS" },
    "fragrant": { "value": true, "source": "RHS" }
  },
  "ecology": {
    "pollinators": { "value": ["bees", "butterflies", "hoverflies"], "source": "Velt" },
    "native_to_belgium": { "value": false, "source": "Velt" },
    "invasive_in_belgium": { "value": false, "source": "Velt" }
  },
  "notes": "Compacte cultivar van echte lavendel. Donkerpaarse bloemen, sterke geur, lang houdbaar als snijbloem of voor droging. Hergroei na voorjaarssnoei boven het houtige gedeelte.",
  "confidence": { "overall": 0.92, "notes": "Veel-gekweekte cultivar met goede documentatie bij RHS." }
}
```

### 5.2 Cultivar zonder specifieke data (graceful fallback)

**Input:** `PLANT: Echinacea purpurea 'Magnus Superior'`

**Verwachting:** `identifier.cultivar = "Magnus Superior"`, maar de meeste velden onder `growing` en `conditions` krijgen `fallback: true` met source = "RHS" (species-level). `confidence.overall` rond 0.6–0.7, met `notes`: "Cultivar-specifieke data beperkt; species-niveau gebruikt voor groei- en milieu-eisen."

### 5.3 Onbekende of zeldzame plant (eerlijke `unknown`)

**Input:** `PLANT: Gentianopsis ciliata`

**Verwachting:** taxonomie en algemene type vast (uit GBIF), maar de meeste agronomische velden `null` met source `"unknown"`. `confidence.overall` rond 0.3. `confidence.notes`: "Wilde alpine soort, weinig hortcultureel-beschreven. Hoofdvelden uit GBIF, agronomie ontbreekt."

---

## 6. Integratie in de app

### Endpoint-wrapper

```typescript
// src/services/autofill.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const SYSTEM_PROMPT = readFileSync("prompts/autofill.system.txt", "utf-8");

export async function autoFillPlant(
  identifier: string,
  opts: { language?: "nl" | "en" | "fr"; region?: string; photoHint?: string } = {}
): Promise<AutoFillResult> {
  const userMsg = [
    `PLANT: ${identifier}`,
    opts.photoHint && `PHOTO_ID_HINT: ${opts.photoHint}`,
    `USER_LANGUAGE: ${opts.language ?? "nl"}`,
    `REGION: ${opts.region ?? "BE-VL"}`,
  ].filter(Boolean).join("\n");

  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = res.content.find(b => b.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text) as AutoFillResult;
  validateSchema(parsed);                    // throws on missing required fields
  return parsed;
}
```

### Caching

Sleutel: lower-cased `scientificName` exact. Cache hits zijn ~80% verwacht (dezelfde planten worden door veel gebruikers toegevoegd). SQLite-tabel `plant_soort_cache`:

```sql
CREATE TABLE plant_soort_cache (
  scientific_name TEXT PRIMARY KEY,
  result_json TEXT NOT NULL,
  cached_at TIMESTAMP NOT NULL,
  source_version TEXT NOT NULL              -- bv. "claude-sonnet-4-5/v1"
);
```

Invalidate bij nieuwere `source_version` of na 12 maanden.

### Kostschatting

Per call: systeem-prompt ~1500 tokens (eenmalig met prompt caching), user message ~30 tokens, response ~1500 tokens. Met caching: ~0.4¢ per plant. 500 planten in een tuin = ~€2 totale levensduurkost.

### Foutafhandeling

| Foutmodus | Reactie |
|-----------|---------|
| JSON-parse fout | Eén retry met `assistant`-prefill `{`. Bij tweede fout: toon manuele invulvorm. |
| Schema-validatie fout | Sla resultaat op als `corrupt`, log voor analyse, toon manuele invulvorm. |
| API-timeout (>10s) | Sla `pending`-record op, gebruiker krijgt manuele invulvorm met "we vullen later aan"-toggle. |
| Rate limit | Queue + exponential backoff. Niet-blokkerend voor plant CRUD. |
| Geen internet | Plant wordt opgeslagen met soort-id `null`. Wanneer online: async auto-fill triggert. |

---

## 7. Evaluatie

### Golden set

Bouw een fixture van 30 planten:
- 10 zeer courante (lavendel, hosta, hortensia, courgette, tomaat, ...)
- 10 minder courante maar herkenbare (eryngium, baptisia, agastache, ...)
- 5 zeldzame variëteiten met cultivar
- 5 obscure soorten als stress-test voor `unknown`

Voor elk: hand-gevalideerde "ground truth" op de belangrijkste velden (zon, bodem, hoogte, bloeimaanden, hardiness).

### Metrics

| Metric | Target |
|--------|--------|
| Schema-validiteit | 100% |
| Field-accuracy (golden 30) | ≥ 90% op kernvelden, ≥ 70% op nice-to-haves |
| `unknown`-eerlijkheid (geen verzonnen waardes voor unknown plant) | ≥ 95% |
| Latentie p95 | ≤ 4s |
| Cache-hit rate na 1000 calls | ≥ 60% |

### Regressie

Bij elke prompt-wijziging: opnieuw de golden set draaien, diff'en, manueel reviewen. Niet automatisch deployen.

---

## 8. Open vragen

1. **Tool-use of pure text?** Anthropic ondersteunt tool-use met JSON schema validatie. Dat geeft schema-correctheid gratis, maar voegt latentie en complexiteit toe. Voor nu: pure text + validatie aan de client-kant. Heroverweeg als schema-validatie-fouten >2% blijven.
2. **Prompt caching gebruiken?** Sonnet 4.5 ondersteunt prompt caching voor de systeem-prompt. Bespaart ~70% van de input tokens. Activeren vanaf dag 1.
3. **Multi-call enrichment?** Voor zeldzame planten zou een tweede call met een gerichte zoekopdracht ("focus on hardiness and pruning for X") betere resultaten geven. Voor MVP overslaan. Heroverwegen als gebruikers klagen over kwaliteit voor specifieke soorten.
4. **PlantNet-confidence threshold?** Wanneer een foto-ID maar 40% confidence heeft, willen we dan auto-fillen of de gebruiker eerst laten bevestigen? Voorstel: <70% = bevestigingsstap, ≥70% = direct auto-fill met badge "automatisch herkend, bevestig naam".

---

**Einde spec — koppelt aan match-score-algoritme (zie `GroenPlan_MatchScore_Algorithm.md`).**
