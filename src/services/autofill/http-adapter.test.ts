import { describe, it, expect } from "vitest";
import { vriendelijkeAutofillFout } from "./http-adapter";

describe("vriendelijkeAutofillFout", () => {
  it("herkent een ontbrekende/ongeldige Anthropic-sleutel en wijst naar .env", () => {
    const msg = vriendelijkeAutofillFout(500, "ANTHROPIC_API_KEY is niet ingesteld.");
    expect(msg).toContain("ANTHROPIC_API_KEY");
    expect(msg).toContain(".env");
  });

  it("herkent ook de rauwe SDK-authenticatiefout", () => {
    const msg = vriendelijkeAutofillFout(500, "Could not resolve authentication method. Expected one of apiKey...");
    expect(msg).toContain("Anthropic API-sleutel");
  });

  it("toont een andere serverfout leesbaar door", () => {
    const msg = vriendelijkeAutofillFout(500, "Ongeldige JSON van de AI.");
    expect(msg).toBe("AI-plantdata mislukt: Ongeldige JSON van de AI.");
  });

  it("valt terug op een generieke melding zonder serverdetail", () => {
    expect(vriendelijkeAutofillFout(502, "")).toBe("AI-plantdata mislukt (serverfout 502).");
  });
});
