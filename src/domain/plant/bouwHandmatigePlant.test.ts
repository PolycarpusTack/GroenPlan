import { describe, it, expect } from "vitest";
import { bouwHandmatigePlant } from "./bouwHandmatigePlant";

describe("bouwHandmatigePlant", () => {
  it("zet ingevulde velden op bron 'handmatig'", () => {
    const p = bouwHandmatigePlant({
      wetenschappelijkeNaam: "Lavandula angustifolia",
      gewoneNaamNl: "Lavendel",
      zon: "full",
      grondsoorten: ["chalk", "sand"],
      pHMin: 6.5,
      pHMax: 8,
      bloeiMaanden: [6, 7, 8],
    });
    expect(p.identificatie.wetenschappelijkeNaam).toBe("Lavandula angustifolia");
    expect(p.identificatie.gewoneNamen.nl).toBe("Lavendel");
    expect(p.omstandigheden.zon).toEqual({ waarde: "full", bron: "handmatig", terugval: false });
    expect(p.omstandigheden.grondsoorten.bron).toBe("handmatig");
    expect(p.omstandigheden.pH.waarde).toEqual({ min: 6.5, max: 8 });
    expect(p.bloei.maanden.waarde).toEqual([6, 7, 8]);
  });

  it("zet niet-ingevulde velden op unknown/null met bron 'unknown'", () => {
    const p = bouwHandmatigePlant({ wetenschappelijkeNaam: "Rosa canina" });
    expect(p.omstandigheden.zon.waarde).toBe("unknown");
    expect(p.omstandigheden.zon.bron).toBe("unknown");
    expect(p.omstandigheden.grondsoorten.waarde).toEqual([]);
    expect(p.omstandigheden.pH.waarde).toBeNull();
    expect(p.omstandigheden.hardheid.waarde).toBeNull();
    expect(p.bloei.maanden.waarde).toEqual([]);
    expect(p.groei.volwassenHoogte_cm.waarde).toBeNull();
    expect(p.onderhoud.snoeien.bron).toBe("unknown");
  });

  it("normaliseert een omgekeerde of half-ingevulde range", () => {
    const omgekeerd = bouwHandmatigePlant({ wetenschappelijkeNaam: "X", pHMin: 8, pHMax: 6 });
    expect(omgekeerd.omstandigheden.pH.waarde).toEqual({ min: 6, max: 8 });
    const half = bouwHandmatigePlant({ wetenschappelijkeNaam: "X", hoogteMax: 120 });
    expect(half.groei.volwassenHoogte_cm.waarde).toEqual({ min: 120, max: 120 });
  });

  it("bouwt hardheid alleen als min of max gegeven is", () => {
    const zonder = bouwHandmatigePlant({ wetenschappelijkeNaam: "X" });
    expect(zonder.omstandigheden.hardheid.waarde).toBeNull();
    const met = bouwHandmatigePlant({ wetenschappelijkeNaam: "X", hardheidMin: 7 });
    expect(met.omstandigheden.hardheid.waarde).toEqual({ usda_min: 7, usda_max: null });
  });

  it("markeert de plant als handmatig ingevoerd in zekerheid", () => {
    const p = bouwHandmatigePlant({ wetenschappelijkeNaam: "X" });
    expect(p.zekerheid.algemeen).toBe(1);
    expect(p.zekerheid.notities).toContain("Handmatig");
  });
});
