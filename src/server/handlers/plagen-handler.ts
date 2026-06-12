import type { ApiHandler } from "./types";

export const plagenHandler: ApiHandler = async ({ body }) => {
  const { base64, mimeType, plantNaam, queryId } = (body ?? {}) as {
    base64: string;
    mimeType: string;
    plantNaam: string | null;
    queryId: string;
  };

  const { analyseerPlagen } = await import("../../services/plagen/claude-plagen-adapter");
  const resultaat = await analyseerPlagen(base64, mimeType, plantNaam ?? null, queryId);

  return { status: 200, body: resultaat };
};
