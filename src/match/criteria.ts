// Zes pure criterium-functies — bron: GroenPlan_MatchScore_Algorithm.md §3
import type { Grondsoort, Zonlichtniveau, Drainage, Waterbehoeften } from "../domain/plant/types";

// ─── Grond (gewicht 0.25) ────────────────────────────────────────────────────
// Binaire match: 1.0 als de grondsoort van de zone voorkomt in de planttoleranties.

export function scoreGrond(
  plantGrondsoorten: Grondsoort[],
  zoneGrondsoort: Grondsoort,
): number {
  if (plantGrondsoorten.length === 0) return 0;
  return plantGrondsoorten.includes(zoneGrondsoort) ? 1.0 : 0.0;
}

// ─── Zon (gewicht 0.25) ──────────────────────────────────────────────────────
// Ordinale afstand: full=2, partial=1, shade=0. Penalty = afstand/2.

const ZON_RANG: Record<Zonlichtniveau, number> = { full: 2, partial: 1, shade: 0 };

export function scoreZon(
  plantZon: Zonlichtniveau | "unknown",
  zoneZon: Zonlichtniveau,
): number {
  if (plantZon === "unknown") return 0;
  const afstand = Math.abs(ZON_RANG[plantZon] - ZON_RANG[zoneZon]);
  return Math.max(0, 1 - afstand * 0.5);
}

// ─── pH (gewicht 0.15) ───────────────────────────────────────────────────────
// Bereik-overlap met zachte penalty buiten de grens (0.7 eenheden tolerantie).

export function scorePH(
  plantPH: { min: number; max: number } | null,
  zonePH: number | null,
): number {
  if (plantPH === null || zonePH === null) return 0;

  const { min, max } = plantPH;
  if (zonePH >= min && zonePH <= max) return 1.0;

  const TOLERANTIE = 0.7;
  const overschrijding = zonePH < min ? min - zonePH : zonePH - max;
  if (overschrijding >= TOLERANTIE) return 0.0;
  return 1 - overschrijding / TOLERANTIE;
}

// ─── Water (gewicht 0.15) ────────────────────────────────────────────────────
// Spec §4.4: rawScore = gemiddelde van drainageScore (structureel) en waterScore
// (gedragsmatige waarschuwing). Drainage is de hoofdcomponent; waterbehoefte
// moduleert enkel bij droogte-minnende plant + veel recente neerslag.

const DRAINAGE_SCORE: Record<Drainage, Record<Drainage, number>> = {
  "well-drained": { "well-drained": 1.0, moist: 0.5, wet: 0.0 },
  moist:          { "well-drained": 0.5, moist: 1.0, wet: 0.5 },
  wet:            { "well-drained": 0.0, moist: 0.5, wet: 1.0 },
};

export function scoreWater(
  plantWater: Waterbehoeften | "unknown",
  plantDrainage: Drainage | "unknown",
  zoneDrainage: Drainage,
  regenval_mm_7d = 0,
): number {
  // Ontbrekend alleen als zowel drainage- als waterbehoefte onbekend is.
  if (plantDrainage === "unknown" && plantWater === "unknown") return 0;

  // Onbekende drainage telt neutraal (1.0) zodat een wel-bekende waterbehoefte
  // nog steeds tot een zinvolle score leidt.
  const drainageScore =
    plantDrainage === "unknown" ? 1.0 : DRAINAGE_SCORE[plantDrainage][zoneDrainage];

  // Droogte-minnende plant + veel recente neerslag (> 40 mm/7d) → risico op
  // wortelrot. Signaal, niet diskwalificerend.
  const waterScore = plantWater === "low" && regenval_mm_7d > 40 ? 0.6 : 1.0;

  return (drainageScore + waterScore) / 2;
}

// ─── Hardheid (gewicht 0.10) ─────────────────────────────────────────────────
// Drempelwaarde met 1 zone buffer. Onder minimum → 0.0.

export function scoreHardheid(
  plantHardheid: { usda_min: number; usda_max: number | null } | null,
  tuinHardheid: number,
): number {
  if (plantHardheid === null) return 0;

  const { usda_min } = plantHardheid;
  if (tuinHardheid >= usda_min) return 1.0;
  if (tuinHardheid === usda_min - 1) return 0.5;
  return 0.0;
}

// ─── BloeiGap (gewicht 0.10) ─────────────────────────────────────────────────
// Spec §4.6: fractie van plantbloeimaanden die vallen in de nog-lege maanden
// van de zone. Een lege zone heeft alle 12 maanden als gat → plant die bloeit
// vult maximaal aan. Een zone met volledige bloei-spreiding → 0.3 (plant voegt
// geen nieuw bloeimoment toe). Niet-bloeiende plant → 0.5 (neutraal).

export function scoreBloeiGap(
  plantBloeiMaanden: number[],
  bestaandeBloeiMaanden: number[],
): number {
  if (plantBloeiMaanden.length === 0) return 0.5;

  const aanwezig = new Set(bestaandeBloeiMaanden);
  const gaten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((m) => !aanwezig.has(m));

  // Zone heeft al volledige bloei-spreiding → geen nieuw moment om te vullen.
  if (gaten.length === 0) return 0.3;

  const gatenSet = new Set(gaten);
  const vultGaten = plantBloeiMaanden.filter((m) => gatenSet.has(m));
  return vultGaten.length / plantBloeiMaanden.length;
}
