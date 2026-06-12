import { describe, it, expect } from "vitest";
import { berekenVoorstelLayout } from "./voorstelLayout";
import type { AutoFillResultaat } from "../../domain/plant/types";

function plantMet(hoogteCm: number | null, breedteCm: number | null): AutoFillResultaat {
  return {
    groei: {
      volwassenHoogte_cm: { waarde: hoogteCm !== null ? { min: hoogteCm, max: hoogteCm } : null, bron: "unknown" },
      volwassenBreedte_cm: { waarde: breedteCm !== null ? { min: breedteCm, max: breedteCm } : null, bron: "unknown" },
    },
  } as unknown as AutoFillResultaat;
}

const catalog = {
  "hoog gras": plantMet(180, 80),
  "middel vaste plant": plantMet(80, 50),
  "laag kruid": plantMet(25, 30),
};

describe("berekenVoorstelLayout", () => {
  it("zet hoge soorten achteraan (kleinere y) en lage vooraan", () => {
    const layout = berekenVoorstelLayout(
      ["Laag kruid", "Hoog gras", "Middel vaste plant"],
      catalog, 6, 3,
    );
    const van = (naam: string) => layout.find((p) => p.naam === naam)!;
    expect(van("Hoog gras").y).toBeLessThan(van("Middel vaste plant").y);
    expect(van("Middel vaste plant").y).toBeLessThan(van("Laag kruid").y);
  });

  it("houdt alle cirkels binnen de zonegrenzen, ook bij een te smalle zone", () => {
    const veel = Array.from({ length: 8 }, () => "Hoog gras");
    const layout = berekenVoorstelLayout(veel, catalog, 2, 2);
    for (const p of layout) {
      expect(p.x - p.r).toBeGreaterThanOrEqual(0);
      expect(p.x + p.r).toBeLessThanOrEqual(2.01);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(2);
    }
  });

  it("markeert soorten zonder catalogus-breedte als geschat (default 40 cm)", () => {
    const layout = berekenVoorstelLayout(["Onbekende soort"], catalog, 6, 3);
    expect(layout).toHaveLength(1);
    expect(layout[0].breedteBekend).toBe(false);
    expect(layout[0].r).toBeCloseTo(0.2, 2);
  });

  it("geeft lege lijst bij lege invoer of ongeldige zone", () => {
    expect(berekenVoorstelLayout([], catalog, 6, 3)).toEqual([]);
    expect(berekenVoorstelLayout(["Hoog gras"], catalog, 0, 3)).toEqual([]);
  });
});
