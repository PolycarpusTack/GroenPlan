// AI-tuincoach — vrije vraag-en-antwoord over tuinieren. Supporting feature,
// achter de Veld-modus. Houdt de Anthropic SDK server-side (zie claude-coach-adapter).

export interface CoachAntwoord {
  antwoord: string;
  // "ai" = Claude via backend, "lokaal" = offline/heuristische reserve.
  bron?: "ai" | "lokaal";
}
