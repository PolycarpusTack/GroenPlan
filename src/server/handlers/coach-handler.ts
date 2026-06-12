import type { ApiHandler } from "./types";

export const coachHandler: ApiHandler = async ({ body }) => {
  const { vraag, context } = (body ?? {}) as { vraag: string; context: string | null };

  const { vraagCoach } = await import("../../services/coach/claude-coach-adapter");
  const resultaat = await vraagCoach(vraag, context ?? null);

  return { status: 200, body: resultaat };
};
