import type { ApiHandler } from "./types";

export const tuinontwerpHandler: ApiHandler = async ({ body }) => {
  const { zone, catalog, hardheid, wens } = (body ?? {}) as {
    zone: unknown;
    catalog: unknown;
    hardheid: number;
    wens: string;
  };

  const { ClaudeTuinOntwerpAdapter } = await import(
    "../../services/tuinontwerp/claude-tuinontwerp-adapter"
  );
  const adapter = new ClaudeTuinOntwerpAdapter();
  const resultaat = await adapter.analyseer(zone as never, catalog as never, hardheid, wens ?? "");

  return { status: 200, body: resultaat };
};
