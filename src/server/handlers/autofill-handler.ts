import type { ApiHandler } from "./types";

// Dynamische import houdt de server-only Claude-adapter (en de Anthropic SDK)
// volledig buiten de statische graaf — veilig voor zowel de browserbundel als
// het importeren van deze routes in vite.config.ts.
export const autofillHandler: ApiHandler = async ({ query }) => {
  const naam = query.get("naam") ?? "";
  if (!naam.trim()) {
    return { status: 400, body: { fout: "'naam' is verplicht" } };
  }

  const { ClaudeAutoFillAdapter } = await import("../../services/autofill/claude-adapter");
  const adapter = new ClaudeAutoFillAdapter();
  const resultaat = await adapter.vulAan(naam, {
    taal: (query.get("taal") as "nl" | "en" | "fr") ?? "nl",
    regio: query.get("regio") ?? "BE-VL",
    fotoHint: query.get("fotoHint") ?? undefined,
  });

  return { status: 200, body: resultaat };
};
