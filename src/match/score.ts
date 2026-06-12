// matchScore orchestrator — bron: GroenPlan_MatchScore_Algorithm.md §4
import type { MatchContext, MatchResultaat, Criterium, CriteriumResultaat } from "./types";
import {
  scoreGrond, scoreZon, scorePH, scoreWater, scoreHardheid, scoreBloeiGap,
} from "./criteria";

const GEWICHTEN: Record<Criterium, number> = {
  grond:    0.25,
  zon:      0.25,
  pH:       0.15,
  water:    0.15,
  hardheid: 0.10,
  bloeiGap: 0.10,
};

function beoordeling(score: number): MatchResultaat["beoordeling"] {
  if (score >= 0.85) return "uitstekend";
  if (score >= 0.70) return "goed";
  if (score >= 0.50) return "matig";
  return "slecht";
}

export function matchScore(ctx: MatchContext): MatchResultaat {
  const { plant, zone, tuinHardheid, bestaandeBloeiMaanden } = ctx;
  const { omstandigheden, bloei } = plant;

  const grondRaw   = scoreGrond(omstandigheden.grondsoorten, zone.grondsoort);
  const zonRaw     = scoreZon(omstandigheden.zon, zone.zon);
  const pHRaw      = scorePH(omstandigheden.pH, zone.pH);
  const waterRaw   = scoreWater(
    omstandigheden.waterbehoeften, omstandigheden.drainage,
    zone.drainage, zone.regenval_mm_7d,
  );
  const hardheidRaw = scoreHardheid(omstandigheden.hardheid, tuinHardheid);
  const bloeiGapRaw = scoreBloeiGap(bloei.maanden, bestaandeBloeiMaanden);

  const rawScores: Record<Criterium, number> = {
    grond: grondRaw, zon: zonRaw, pH: pHRaw,
    water: waterRaw, hardheid: hardheidRaw, bloeiGap: bloeiGapRaw,
  };

  const ontbrekendData: Criterium[] = [];
  if (omstandigheden.grondsoorten.length === 0) ontbrekendData.push("grond");
  if (omstandigheden.zon === "unknown") ontbrekendData.push("zon");
  if (omstandigheden.pH === null || zone.pH === null) ontbrekendData.push("pH");
  if (omstandigheden.drainage === "unknown" && omstandigheden.waterbehoeften === "unknown")
    ontbrekendData.push("water");
  if (omstandigheden.hardheid === null) ontbrekendData.push("hardheid");

  // Gewichtnormalisatie: ontbrekende velden dragen niet bij maar hun gewicht
  // wordt herverdeeld naar de resterende criteria
  const actieveGewichten = Object.entries(GEWICHTEN).reduce<Record<Criterium, number>>(
    (acc, [k, w]) => {
      const criterium = k as Criterium;
      acc[criterium] = ontbrekendData.includes(criterium) ? 0 : w;
      return acc;
    },
    {} as Record<Criterium, number>,
  );

  const totaalGewicht = Object.values(actieveGewichten).reduce((s, w) => s + w, 0);

  const breakdown = {} as Record<Criterium, CriteriumResultaat>;
  let totaalScore = 0;

  for (const [k, w] of Object.entries(actieveGewichten)) {
    const criterium = k as Criterium;
    const gewichtGenormaliseerd = totaalGewicht > 0 ? w / totaalGewicht : 0;
    const raw = rawScores[criterium];
    const bijdrage = gewichtGenormaliseerd * raw;
    totaalScore += bijdrage;

    breakdown[criterium] = {
      criterium,
      gewicht: gewichtGenormaliseerd,
      rawScore: raw,
      bijdrage,
      motivatie: motivatieTekst(criterium, raw, ctx),
      ontbreekt: ontbrekendData.includes(criterium),
    };
  }

  // Spec §5: hoogst-scorende criteria eerst, max 3 topredenen / max 2 aandachtspunten.
  const beschikbaar = Object.values(breakdown).filter((r) => !r.ontbreekt);

  const topRedenen = [...beschikbaar]
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 3)
    .filter((r) => r.rawScore >= 0.7)
    .map((r) => r.motivatie);

  const aandachtspunten = [...beschikbaar]
    .sort((a, b) => a.rawScore - b.rawScore)
    .filter((r) => r.rawScore < 0.5)
    .slice(0, 2)
    .map((r) => r.motivatie);

  return {
    plant: plant.wetenschappelijkeNaam,
    score: Math.round(totaalScore * 100) / 100,
    beoordeling: beoordeling(totaalScore),
    breakdown,
    ontbrekendData,
    topRedenen,
    aandachtspunten,
  };
}

function motivatieTekst(criterium: Criterium, score: number, ctx: MatchContext): string {
  const { plant, zone } = ctx;
  const { omstandigheden } = plant;

  switch (criterium) {
    case "grond":
      return score >= 1
        ? `Groeit goed in ${zone.grondsoort}`
        : `Verkiest andere grondsoort dan ${zone.grondsoort}`;
    case "zon":
      return score >= 0.75
        ? `Zonbehoefte past bij ${zone.zon}-belichting`
        : `Verkiest ${omstandigheden.zon} maar zone heeft ${zone.zon}`;
    case "pH":
      return score >= 0.8
        ? `pH ${zone.pH} valt binnen het optimale bereik`
        : `pH ${zone.pH} ligt buiten het ideale bereik`;
    case "water":
      return score >= 0.75
        ? `Drainagevoorkeur past bij de zone`
        : `Drainagevoorkeur komt niet overeen met de zone`;
    case "hardheid":
      return score >= 1
        ? `Winterhard genoeg voor deze tuin`
        : score >= 0.5
        ? `Marginaal winterhard — bescherming aanbevolen`
        : `Niet voldoende winterhard voor deze tuin`;
    case "bloeiGap":
      return score >= 0.7
        ? `Vult bloeiperiodes in de zone aan`
        : `Beperkte aanvulling op bestaande bloeiperiodes`;
  }
}
