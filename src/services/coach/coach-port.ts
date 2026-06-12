import type { CoachAntwoord } from "./types";

export interface ICoachService {
  // Beantwoordt een tuinvraag. `context` is optionele achtergrond (bv. zone of
  // plant waar de gebruiker mee bezig is).
  vraag(vraag: string, context?: string): Promise<CoachAntwoord>;
}
