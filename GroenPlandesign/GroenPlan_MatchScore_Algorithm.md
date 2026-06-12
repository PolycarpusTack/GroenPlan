# GroenPlan — Match-Score Algoritme

**Versie:** 0.1
**Doel:** Een pure, testbare functie die bepaalt hoe goed een PlantSoort past bij een Zone. Output: score 0–1, breakdown per criterium met motivering, en een lijst van ontbrekende data. Geen black-box-percentage.

---

## 1. Ontwerpprincipes

1. **Pure functie.** Geen side-effects, geen IO, geen database. Input → output. Daardoor triviaal te testen en cachebaar per (plant-id, zone-id, hardiness).
2. **Graceful degradation bij ontbrekende data.** Geen pH-meting beschikbaar? Dan wordt dat criterium weggelaten en worden de gewichten herverdeeld over de wel-beschikbare criteria. Score blijft betekenisvol.
3. **Elke score is verklaarbaar.** Voor elk criterium een korte motivering in mensentaal. De UI toont topredenen ("past door: volle zon, droge bodem") en zorgen ("matig door: pH iets hoger dan ideaal").
4. **Categorische match vs continue match.** Bodemtype is categorisch (klei is geen "lichte versie van zand"). Zon-expositie is ordinal (vol > half > schaduw). pH is continu. Elk type krijgt zijn eigen scoring-functie.
5. **Bloei-gap is contextueel.** De waarde van een plant hangt af van wat er al in de zone staat. Een augustus-bloeier is goud waard in een lente-zone, irrelevant in een augustus-zone.

---

## 2. Gewichten

Vaste gewichten in MVP. Som = 1.0. Heroverwegen wanneer er gebruikersfeedback-data is.

| Criterium | Gewicht | Type | Motivatie |
|-----------|---------|------|-----------|
| `soil` | 0.25 | categorisch | Bodem is doorslaggevend. Een plant in verkeerde grond gaat snel dood. |
| `sun` | 0.25 | ordinal | Idem. Zon-mismatch is een directe gezondheidsindicator. |
| `pH` | 0.15 | continu (range) | Belangrijk maar planten zijn vaak toleranter dan pH-tabellen suggereren. |
| `water` | 0.15 | gecombineerd | Drainage + recente neerslag. Beïnvloedbaar door tuinier; daarom minder zwaar. |
| `hardiness` | 0.10 | drempel | Belangrijk maar binair (overleeft winter ja/nee). Voor België is dit zelden de bottleneck. |
| `bloomGap` | 0.10 | contextueel | Onderscheidt "past technisch" van "voegt waarde toe". |

---

## 3. Types

```typescript
// src/match/types.ts

export type SoilType  = "clay" | "sand" | "loam" | "chalk" | "peat";
export type SunLevel  = "full" | "partial" | "shade";
export type Drainage  = "well-drained" | "moist" | "wet";
export type WaterNeed = "low" | "medium" | "high";

export interface PlantSoortInput {
  scientificName: string;
  conditions: {
    sun: SunLevel | "unknown";
    soilTypes: SoilType[];                  // mag leeg
    pH: { min: number; max: number } | null;
    drainage: Drainage | "unknown";
    waterNeed: WaterNeed | "unknown";
    hardiness: { usda_min: number; usda_max: number | null } | null;
  };
  bloom: {
    months: number[];                        // 1..12
  };
}

export interface ZoneInput {
  sun: SunLevel;
  soilType: SoilType;
  pH: number | null;                         // meest recente meting
  drainage: Drainage;
  recentRainfall_mm_7d?: number;             // optioneel, default 0
}

export interface MatchContext {
  plant: PlantSoortInput;
  zone: ZoneInput;
  tuinHardiness: number;                     // bv. 8 voor BE 8a/8b
  existingBloomMonths: number[];             // bloei-coverage van andere planten in deze zone
}

export type Criterion =
  | "soil" | "sun" | "pH" | "water" | "hardiness" | "bloomGap";

export interface CriterionResult {
  criterion: Criterion;
  weight: number;
  rawScore: number;        // 0..1
  contribution: number;    // weight * rawScore (0 indien missing)
  motivation: string;      // mensentaal, NL
  missing: boolean;        // true = input-data ontbrak, criterium niet meegerekend
}

export interface MatchResult {
  plant: string;                                 // scientific name
  score: number;                                 // 0..1, herverdeeld over beschikbare criteria
  rating: "excellent" | "good" | "fair" | "poor"; // afgeleid: >0.85 / 0.7 / 0.5 / rest
  breakdown: Record<Criterion, CriterionResult>;
  missingData: Criterion[];
  topReasons: string[];                          // 2..3 positieve motivaties
  concerns: string[];                            // 0..2 lage scores die uitleg verdienen
}
```

---

## 4. Criteria-implementaties

Elk criterium is een pure functie met dezelfde signature: `(MatchContext) => CriterionResult`. Eenvoudig te testen en uit te breiden.

### 4.1 Bodem (categorisch, gewicht 0.25)

```typescript
export function scoreSoil(ctx: MatchContext): CriterionResult {
  const { plant, zone } = ctx;
  const weight = 0.25;

  if (plant.conditions.soilTypes.length === 0) {
    return { criterion: "soil", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "Bodemvoorkeur plant niet bekend" };
  }

  const accepts = plant.conditions.soilTypes.includes(zone.soilType);
  const rawScore = accepts ? 1.0 : 0.0;

  return {
    criterion: "soil",
    weight,
    rawScore,
    contribution: weight * rawScore,
    missing: false,
    motivation: accepts
      ? `Verdraagt ${nlSoil(zone.soilType)}`
      : `Verkiest ${plant.conditions.soilTypes.map(nlSoil).join(" of ")}, niet ${nlSoil(zone.soilType)}`,
  };
}
```

**Rationale:** binair. Een plant die klei nodig heeft, doet het niet op zand. Geen tussenwaardes — als de gebruiker een mengsel heeft, hoort dat in de zone-configuratie te staan (bv. zone.soilType = "loam" voor klei-zand mengsel).

### 4.2 Zon (ordinal, gewicht 0.25)

```typescript
const SUN_RANK: Record<SunLevel, number> = { shade: 0, partial: 1, full: 2 };

export function scoreSun(ctx: MatchContext): CriterionResult {
  const { plant, zone } = ctx;
  const weight = 0.25;

  if (plant.conditions.sun === "unknown") {
    return { criterion: "sun", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "Zonbehoefte plant niet bekend" };
  }

  const dist = Math.abs(SUN_RANK[plant.conditions.sun] - SUN_RANK[zone.sun]);
  // 0 dist → 1.0, 1 dist → 0.5, 2 dist → 0.0
  const rawScore = 1 - dist / 2;

  return {
    criterion: "sun",
    weight,
    rawScore,
    contribution: weight * rawScore,
    missing: false,
    motivation: dist === 0
      ? `Past bij ${nlSun(zone.sun)}`
      : dist === 1
        ? `Plant verkiest ${nlSun(plant.conditions.sun)}, zone is ${nlSun(zone.sun)} — overleeft maar minder optimaal`
        : `Plant verkiest ${nlSun(plant.conditions.sun)}, zone is ${nlSun(zone.sun)} — ongeschikt`,
  };
}
```

**Rationale:** ordinal scale. Een halfschaduwplant in volle zon doet het beter dan in volle schaduw, dus partial credit voor distance = 1. Maximum verschil (vol ↔ schaduw) = score 0.

### 4.3 pH (continu, gewicht 0.15)

```typescript
const PH_TOLERANCE = 0.7;  // hoeveel pH-eenheden buiten range nog partial credit

export function scorePH(ctx: MatchContext): CriterionResult {
  const { plant, zone } = ctx;
  const weight = 0.15;

  if (zone.pH === null) {
    return { criterion: "pH", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "Geen pH-meting beschikbaar voor deze zone" };
  }
  if (plant.conditions.pH === null) {
    return { criterion: "pH", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "pH-voorkeur plant niet bekend" };
  }

  const { min, max } = plant.conditions.pH;
  let rawScore: number;
  let motivation: string;

  if (zone.pH >= min && zone.pH <= max) {
    rawScore = 1.0;
    motivation = `pH ${zone.pH.toFixed(1)} valt in ideaal bereik ${min}–${max}`;
  } else {
    const dist = zone.pH < min ? (min - zone.pH) : (zone.pH - max);
    rawScore = Math.max(0, 1 - dist / PH_TOLERANCE);
    motivation = `pH ${zone.pH.toFixed(1)} ligt buiten ideaal ${min}–${max} (afwijking ${dist.toFixed(1)})`;
  }

  return { criterion: "pH", weight, rawScore,
    contribution: weight * rawScore, missing: false, motivation };
}
```

**Rationale:** range-overlap met soft penalty buiten range. Veel planten zijn toleranter dan boekjes suggereren, dus we geven partial credit tot 0.7 pH-eenheden afwijking.

### 4.4 Water (gecombineerd drainage + neerslag, gewicht 0.15)

```typescript
const DRAINAGE_RANK: Record<Drainage, number> = { "well-drained": 0, "moist": 1, "wet": 2 };
const WATER_RANK: Record<WaterNeed, number> = { low: 0, medium: 1, high: 2 };

export function scoreWater(ctx: MatchContext): CriterionResult {
  const { plant, zone } = ctx;
  const weight = 0.15;

  if (plant.conditions.drainage === "unknown" && plant.conditions.waterNeed === "unknown") {
    return { criterion: "water", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "Water- en drainagebehoefte plant niet bekend" };
  }

  // Drainage match (binnen 1 stap = ok)
  let drainageScore = 1.0;
  if (plant.conditions.drainage !== "unknown") {
    const dDist = Math.abs(DRAINAGE_RANK[plant.conditions.drainage] - DRAINAGE_RANK[zone.drainage]);
    drainageScore = 1 - dDist / 2;
  }

  // Waternood inschatting o.b.v. recente neerslag (proxy voor zone-actuele vochtigheid)
  // Als het de laatste 7d veel geregend heeft, gedraagt een "low water" plant zich risico-vol
  let waterScore = 1.0;
  if (plant.conditions.waterNeed === "low" && (ctx.zone.recentRainfall_mm_7d ?? 0) > 40) {
    waterScore = 0.6;  // signaal: oppassen voor wortelrot, niet diskwalificerend
  }

  const rawScore = (drainageScore + waterScore) / 2;
  const motivation = drainageScore < 1
    ? `Drainage-voorkeur (${nlDrain(plant.conditions.drainage as Drainage)}) wijkt af van zone (${nlDrain(zone.drainage)})`
    : waterScore < 1
      ? "Hoge recente neerslag: pas op voor wortelrot bij droogteminnende plant"
      : "Water- en drainagebehoefte sluiten aan bij zone";

  return { criterion: "water", weight, rawScore,
    contribution: weight * rawScore, missing: false, motivation };
}
```

**Rationale:** drainage is structureel (eigenschap van de zone), waternood is gedragsmatig (de tuinier kan extra water geven). Daarom is drainage de hoofdcomponent, waternood enkel een waarschuwingsmodulator.

### 4.5 Winterhardheid (drempel, gewicht 0.10)

```typescript
export function scoreHardiness(ctx: MatchContext): CriterionResult {
  const { plant, tuinHardiness } = ctx;
  const weight = 0.10;

  if (plant.conditions.hardiness === null) {
    return { criterion: "hardiness", weight, rawScore: 0, contribution: 0,
      missing: true, motivation: "Winterhardheid plant niet bekend" };
  }

  const { usda_min, usda_max } = plant.conditions.hardiness;
  let rawScore: number;
  let motivation: string;

  if (tuinHardiness >= usda_min && (usda_max === null || tuinHardiness <= usda_max)) {
    rawScore = 1.0;
    motivation = `Winterhard voor zone ${tuinHardiness} (plant: ${usda_min}${usda_max ? `–${usda_max}` : "+"})`;
  } else if (tuinHardiness === usda_min - 1) {
    rawScore = 0.5;
    motivation = `Op het randje (plant tot zone ${usda_min}, tuin is ${tuinHardiness}) — winterbescherming nodig`;
  } else {
    rawScore = 0.0;
    motivation = `Niet winterhard genoeg (plant ${usda_min}+, tuin ${tuinHardiness}) — overleeft winter waarschijnlijk niet`;
  }

  return { criterion: "hardiness", weight, rawScore,
    contribution: weight * rawScore, missing: false, motivation };
}
```

**Rationale:** drempelwaarde met één-stap-tolerantie. Voor België is dit zelden de bottleneck (8a/8b dekt het gros), maar voor citrusplanten of subtropische zaken wel.

### 4.6 Bloei-gap (contextueel, gewicht 0.10)

```typescript
export function scoreBloomGap(ctx: MatchContext): CriterionResult {
  const { plant, existingBloomMonths } = ctx;
  const weight = 0.10;

  if (plant.bloom.months.length === 0) {
    return { criterion: "bloomGap", weight, rawScore: 0.5, contribution: 0.5 * weight,
      missing: false, motivation: "Niet-bloeiende plant — neutraal voor bloei-spreiding" };
  }

  const allMonths = [1,2,3,4,5,6,7,8,9,10,11,12];
  const gaps = allMonths.filter(m => !existingBloomMonths.includes(m));

  if (gaps.length === 0) {
    return { criterion: "bloomGap", weight, rawScore: 0.3, contribution: 0.3 * weight,
      missing: false, motivation: "Zone heeft al volledige bloei-spreiding — deze plant voegt geen nieuw moment toe" };
  }

  const fillsGaps = plant.bloom.months.filter(m => gaps.includes(m));
  const rawScore = fillsGaps.length / plant.bloom.months.length;

  const motivation = fillsGaps.length === plant.bloom.months.length
    ? `Bloeit in ${fillsGaps.map(nlMonth).join(", ")} — volledig in nu-lege maanden`
    : fillsGaps.length > 0
      ? `Vult bloei in ${fillsGaps.map(nlMonth).join(", ")}, overlap met bestaande in ${plant.bloom.months.filter(m => !gaps.includes(m)).map(nlMonth).join(", ")}`
      : `Bloeit in ${plant.bloom.months.map(nlMonth).join(", ")} — overlap met bestaande planten`;

  return { criterion: "bloomGap", weight, rawScore,
    contribution: weight * rawScore, missing: false, motivation };
}
```

**Rationale:** dit criterium is wat een score van "technisch geschikt" naar "voegt iets toe" tilt. Een echinacea in een zone die al augustus-bloei heeft, scoort lager dan dezelfde echinacea in een zone met enkel lentebloei.

---

## 5. Orchestrator

```typescript
// src/match/index.ts

const ALL_SCORERS = [
  scoreSoil, scoreSun, scorePH, scoreWater, scoreHardiness, scoreBloomGap,
] as const;

export function matchScore(ctx: MatchContext): MatchResult {
  const results: CriterionResult[] = ALL_SCORERS.map(fn => fn(ctx));

  const available  = results.filter(r => !r.missing);
  const missingArr = results.filter(r =>  r.missing).map(r => r.criterion);

  const totalContribution = available.reduce((s, r) => s + r.contribution, 0);
  const totalWeight       = available.reduce((s, r) => s + r.weight,       0);
  const score = totalWeight > 0 ? totalContribution / totalWeight : 0;

  const rating: MatchResult["rating"] =
    score >= 0.85 ? "excellent" :
    score >= 0.70 ? "good"      :
    score >= 0.50 ? "fair"      : "poor";

  // Top redenen: hoogste rawScores onder beschikbare criteria
  const ranked = [...available].sort((a, b) => b.rawScore - a.rawScore);
  const topReasons = ranked.slice(0, 3)
    .filter(r => r.rawScore >= 0.7)
    .map(r => r.motivation);
  const concerns = ranked.reverse()
    .filter(r => r.rawScore < 0.5)
    .slice(0, 2)
    .map(r => r.motivation);

  const breakdown = Object.fromEntries(results.map(r => [r.criterion, r])) as
    Record<Criterion, CriterionResult>;

  return {
    plant: ctx.plant.scientificName,
    score,
    rating,
    breakdown,
    missingData: missingArr,
    topReasons,
    concerns,
  };
}
```

**Herverdelingslogica:** door te delen door `totalWeight` (i.p.v. door de constante 1.0) wordt de score genormaliseerd over de criteria die wèl data hebben. Een plant met enkel `soil` en `sun` als beschikbare criteria krijgt een score uit max 0.5 — die wordt herschaald naar 0–1. Geen straf voor ontbrekende data, maar `missingData` blijft zichtbaar zodat de UI kan tonen: "score gebaseerd op 4 van 6 criteria".

---

## 6. Helpers (NL labels)

```typescript
const nlSoil = (s: SoilType) =>
  ({ clay: "klei", sand: "zand", loam: "leem", chalk: "kalkgrond", peat: "veengrond" })[s];

const nlSun = (s: SunLevel) =>
  ({ full: "volle zon", partial: "halfschaduw", shade: "schaduw" })[s];

const nlDrain = (d: Drainage) =>
  ({ "well-drained": "goed doorlatend", moist: "vochthoudend", wet: "nat" })[d];

const nlMonth = (m: number) =>
  ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][m-1];
```

---

## 7. Unit tests (voorbeeld)

```typescript
// src/match/match.test.ts
import { describe, it, expect } from "vitest";
import { matchScore } from "./index";

const lavendel: PlantSoortInput = {
  scientificName: "Lavandula angustifolia",
  conditions: {
    sun: "full",
    soilTypes: ["sand", "loam", "chalk"],
    pH: { min: 6.5, max: 8.0 },
    drainage: "well-drained",
    waterNeed: "low",
    hardiness: { usda_min: 5, usda_max: 9 },
  },
  bloom: { months: [6, 7, 8] },
};

describe("matchScore", () => {
  it("scores excellent for perfect match", () => {
    const result = matchScore({
      plant: lavendel,
      zone: { sun: "full", soilType: "sand", pH: 7.2, drainage: "well-drained" },
      tuinHardiness: 8,
      existingBloomMonths: [4, 5, 9, 10],   // gaten in juni–aug
    });
    expect(result.score).toBeGreaterThan(0.9);
    expect(result.rating).toBe("excellent");
    expect(result.topReasons.length).toBeGreaterThanOrEqual(2);
  });

  it("scores poor for sun mismatch", () => {
    const result = matchScore({
      plant: lavendel,
      zone: { sun: "shade", soilType: "sand", pH: 7.2, drainage: "well-drained" },
      tuinHardiness: 8,
      existingBloomMonths: [],
    });
    expect(result.score).toBeLessThan(0.7);
    expect(result.breakdown.sun.rawScore).toBe(0);
    expect(result.concerns).toContain(expect.stringMatching(/volle zon.*schaduw/));
  });

  it("handles missing pH gracefully", () => {
    const result = matchScore({
      plant: lavendel,
      zone: { sun: "full", soilType: "sand", pH: null, drainage: "well-drained" },
      tuinHardiness: 8,
      existingBloomMonths: [],
    });
    expect(result.missingData).toContain("pH");
    expect(result.score).toBeGreaterThan(0.85);  // andere criteria scoren hoog
  });

  it("penalizes bloom redundancy", () => {
    const summer  = matchScore({ ...baseCtx(lavendel), existingBloomMonths: [6,7,8] });
    const spring  = matchScore({ ...baseCtx(lavendel), existingBloomMonths: [3,4,5] });
    expect(spring.score).toBeGreaterThan(summer.score);
    expect(summer.breakdown.bloomGap.rawScore).toBeLessThan(0.5);
  });

  it("fails hardiness on tropical plant in Belgium", () => {
    const bougainvillea: PlantSoortInput = { ...lavendel,
      conditions: { ...lavendel.conditions, hardiness: { usda_min: 10, usda_max: null } } };
    const result = matchScore({ ...baseCtx(bougainvillea) });
    expect(result.breakdown.hardiness.rawScore).toBe(0);
  });
});
```

---

## 8. Integratie met de Ontdek-laag

```typescript
// src/discover/recommendations.ts

export async function recommendForZone(zoneId: string, limit = 12): Promise<MatchResult[]> {
  const zone = await db.zones.findById(zoneId);
  const tuin = await db.tuinen.findById(zone.tuinId);
  const existingBloomMonths = await db.queries.zoneBloomCoverage(zoneId);

  const candidates = await db.plantSoort.findCandidates({
    soilType: zone.soilType,           // pre-filter: alleen planten die zone.soilType verdragen
    minHardiness: tuin.hardiness,      // pre-filter: alleen winterhard
    limit: 200,                        // genoeg om uit te scoren
  });

  const ctx = (plant: PlantSoortInput): MatchContext => ({
    plant, zone, tuinHardiness: tuin.hardiness, existingBloomMonths,
  });

  return candidates
    .map(p => matchScore(ctx(p)))
    .filter(r => r.score >= 0.5)        // alleen "fair" en beter
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

**Pre-filtering** (soil en hardiness) gebeurt in SQL omdat het de candidate-set sterk inperkt. De volledige score-berekening draait alleen op de pre-gefilterde set — bij 50.000 catalogus-planten geeft dat ~100 ms i.p.v. ~5 s.

---

## 9. Toekomstige uitbreidingen

1. **Leerbare gewichten.** Wanneer een gebruiker een plant heeft, kunnen we observeren hoe ze het doet (`status` veld). Voorgestelde planten met `status = "dood"` na 1 jaar geven negatieve signal op de bijhorende gewichten. Op termijn: per-gebruiker afgestemde gewichten.
2. **Microklimaat-modulator.** Zone-notitie "vorstgevoelig in maart" zou hardiness met +0.5 verstrengen. Vrije-tekst-veld is moeilijk te parsen, maar gestructureerde tags ("vorstgevoelig", "winderig", "warmtemuur") kunnen wel.
3. **Companion-modifier.** Wanneer de plant naast slechte buren zou komen, kleine score-aftrek (tot max 0.10). Vereist dat plaatsings-coordinaten al bepaald zijn — geldt enkel bij placement-fase, niet bij browse-fase.
4. **Seizoensgebonden score.** Een plant die voor het huidige seizoen niet zinvol is om te planten (bv. lente-bloemboll in juni), krijgt een tijdmodifier. Tot dan: lage prioriteit, de Ontdek-laag toont sowieso "wat past in deze zone" niet "wat plant ik vandaag".
5. **Diversiteitsscore voor combinaties.** Wanneer we plantcombinaties scoren (fase 3) is de match-score per individuele plant nog niet voldoende — een combinatie van 5 planten met dezelfde bloeiperiode scoort hoog op individueel niveau maar laag als geheel. Andere functie, hergebruikt deze als bouwsteen.

---

## 10. Open vragen

1. **Bloei-gap weging.** Is 0.10 genoeg? Voor de ontwerper-eigenaar persona is dit waarschijnlijk de belangrijkste factor — overwegen om naar 0.15 te verhogen en hardiness te verlagen naar 0.05 voor België.
2. **Drainage-rank.** Is "wet" twee stappen van "well-drained" qua biologie? Sommige planten verdragen beide uitersten (bv. waterplanten die ook droogte aankunnen). Heroverwegen indien gebruikersfeedback aangeeft dat scores hier vaak verkeerd zitten.
3. **Recente neerslag-cutoff.** 40 mm in 7 dagen als "veel" is een gokje. Beter: percentile op KMI-historische data voor de regio.
4. **"Zone heeft al volledige bloei-spreiding" → 0.3.** Niet 0 omdat de plant misschien om andere redenen interessant is (geur, bladstructuur, biodiversiteit). Maar 0.3 is een vingerwijzing; valideren met testgebruikers.

---

**Einde spec — gebruikt PlantSoort-velden gegenereerd door `GroenPlan_AutoFill_Prompt_Spec.md`.**
