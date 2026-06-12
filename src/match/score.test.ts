import { describe, it, expect } from "vitest";
import { matchScore } from "./score";
import type { MatchContext } from "./types";

// Golden set — 3 planten uit de 10 als basisverificatie

const lavendelCtx: MatchContext = {
  plant: {
    wetenschappelijkeNaam: "Lavandula angustifolia",
    omstandigheden: {
      zon: "full",
      grondsoorten: ["chalk", "sand", "loam"],
      pH: { min: 6.5, max: 8.0 },
      drainage: "well-drained",
      waterbehoeften: "low",
      hardheid: { usda_min: 5, usda_max: 8 },
    },
    bloei: { maanden: [6, 7, 8] },
  },
  zone: {
    zon: "full",
    grondsoort: "chalk",
    pH: 7.2,
    drainage: "well-drained",
    regenval_mm_7d: 5,
  },
  tuinHardheid: 8,
  bestaandeBloeiMaanden: [3, 4, 5],
};

const varensCtx: MatchContext = {
  plant: {
    wetenschappelijkeNaam: "Dryopteris filix-mas",
    omstandigheden: {
      zon: "shade",
      grondsoorten: ["loam", "clay"],
      pH: { min: 5.5, max: 7.0 },
      drainage: "moist",
      waterbehoeften: "medium",
      hardheid: { usda_min: 4, usda_max: null },
    },
    bloei: { maanden: [] },
  },
  zone: {
    zon: "full",     // volledig zon, plant wil schaduw
    grondsoort: "sand",  // zand, plant wil leem/klei
    pH: 7.5,
    drainage: "well-drained",
    regenval_mm_7d: 5,
  },
  tuinHardheid: 7,
  bestaandeBloeiMaanden: [],
};

const onbekendCtx: MatchContext = {
  plant: {
    wetenschappelijkeNaam: "Obscura exotica",
    omstandigheden: {
      zon: "unknown",
      grondsoorten: [],
      pH: null,
      drainage: "unknown",
      waterbehoeften: "unknown",
      hardheid: null,
    },
    bloei: { maanden: [] },
  },
  zone: {
    zon: "partial",
    grondsoort: "loam",
    pH: 6.5,
    drainage: "moist",
  },
  tuinHardheid: 8,
  bestaandeBloeiMaanden: [6, 7],
};

describe("matchScore — lavendel in ideale kalkzone", () => {
  it("berekent een uitstekende score (≥0.85)", () => {
    const r = matchScore(lavendelCtx);
    expect(r.score).toBeGreaterThanOrEqual(0.85);
    expect(r.beoordeling).toBe("uitstekend");
  });

  it("heeft geen ontbrekende criteria", () => {
    const r = matchScore(lavendelCtx);
    expect(r.ontbrekendData).toHaveLength(0);
  });

  it("bevat topRedenen", () => {
    const r = matchScore(lavendelCtx);
    expect(r.topRedenen.length).toBeGreaterThan(0);
  });
});

describe("matchScore — varen in verkeerde zone", () => {
  it("berekent een slechte score (<0.50)", () => {
    const r = matchScore(varensCtx);
    expect(r.score).toBeLessThan(0.50);
    expect(r.beoordeling).toBe("slecht");
  });

  it("heeft aandachtspunten", () => {
    const r = matchScore(varensCtx);
    expect(r.aandachtspunten.length).toBeGreaterThan(0);
  });
});

describe("matchScore — volledig onbekende plant", () => {
  it("meldt alle ontbrekende criteria", () => {
    const r = matchScore(onbekendCtx);
    expect(r.ontbrekendData).toContain("grond");
    expect(r.ontbrekendData).toContain("zon");
    expect(r.ontbrekendData).toContain("water");
    expect(r.ontbrekendData).toContain("hardheid");
  });

  it("geeft een geldige score terug (geen crash)", () => {
    const r = matchScore(onbekendCtx);
    expect(typeof r.score).toBe("number");
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});

describe("matchScore — gewichtsnormalisatie bij ontbrekende data", () => {
  it("totaal van gewichten in breakdown ≈ 1.0 als alle criteria bekend zijn", () => {
    const r = matchScore(lavendelCtx);
    const totaal = Object.values(r.breakdown).reduce((s, c) => s + c.gewicht, 0);
    expect(totaal).toBeCloseTo(1.0, 5);
  });

  it("score blijft geldig als pH ontbreekt", () => {
    const ctx: MatchContext = {
      ...lavendelCtx,
      zone: { ...lavendelCtx.zone, pH: null },
    };
    const r = matchScore(ctx);
    expect(r.score).toBeGreaterThan(0);
    expect(r.ontbrekendData).toContain("pH");
  });
});
