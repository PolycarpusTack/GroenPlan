// Ruwe kostenindicatie voor een beplantingsvoorstel.
// Bewust een brede band op basis van gangbare vasteplanten-prijzen in
// Belgische tuincentra — géén echte winkelprijzen (anti-hallucination):
// de UI labelt dit altijd als ruwe schatting.
const PRIJS_PER_PLANT_MIN_EUR = 6;
const PRIJS_PER_PLANT_MAX_EUR = 12;

export interface KostenIndicatie {
  min: number;
  max: number;
}

export function schatKosten(aantalPlanten: number): KostenIndicatie | null {
  if (!Number.isFinite(aantalPlanten) || aantalPlanten <= 0) return null;
  return {
    min: Math.round(aantalPlanten * PRIJS_PER_PLANT_MIN_EUR),
    max: Math.round(aantalPlanten * PRIJS_PER_PLANT_MAX_EUR),
  };
}
