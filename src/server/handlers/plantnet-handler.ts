import type { ApiHandler } from "./types";

export const plantnetHandler: ApiHandler = async ({ body }) => {
  const { base64, mimeType, queryId } = (body ?? {}) as {
    base64: string;
    mimeType: string;
    queryId: string;
  };

  const { identificeerPlant } = await import("../../services/plantnet/plantnet-node");
  const resultaat = await identificeerPlant(base64, mimeType, queryId);

  return { status: 200, body: resultaat };
};
