import { describe, it, expect } from "vitest";
import {
  scoreGrond, scoreZon, scorePH, scoreWater, scoreHardheid, scoreBloeiGap,
} from "./criteria";

// ─── scoreGrond ───────────────────────────────────────────────────────────────
describe("scoreGrond", () => {
  it("geeft 1.0 als grondsoort in de lijst staat", () => {
    expect(scoreGrond(["clay", "loam"], "clay")).toBe(1.0);
  });

  it("geeft 0.0 als grondsoort niet in de lijst staat", () => {
    expect(scoreGrond(["sand", "chalk"], "clay")).toBe(0.0);
  });

  it("geeft 0 voor lege grondsoort-lijst", () => {
    expect(scoreGrond([], "clay")).toBe(0);
  });
});

// ─── scoreZon ─────────────────────────────────────────────────────────────────
describe("scoreZon", () => {
  it("geeft 1.0 bij perfecte match", () => {
    expect(scoreZon("full", "full")).toBe(1.0);
    expect(scoreZon("shade", "shade")).toBe(1.0);
  });

  it("geeft 0.5 bij één stap verschil", () => {
    expect(scoreZon("full", "partial")).toBe(0.5);
    expect(scoreZon("partial", "shade")).toBe(0.5);
  });

  it("geeft 0.0 bij twee stappen verschil", () => {
    expect(scoreZon("full", "shade")).toBe(0.0);
  });

  it("geeft 0 voor unknown", () => {
    expect(scoreZon("unknown", "full")).toBe(0);
  });
});

// ─── scorePH ──────────────────────────────────────────────────────────────────
describe("scorePH", () => {
  it("geeft 1.0 als pH binnen het bereik valt", () => {
    expect(scorePH({ min: 6.0, max: 7.5 }, 6.5)).toBe(1.0);
    expect(scorePH({ min: 6.0, max: 7.5 }, 6.0)).toBe(1.0);
  });

  it("geeft 0.0 als pH verder dan 0.7 buiten het bereik valt", () => {
    expect(scorePH({ min: 6.0, max: 7.5 }, 5.2)).toBe(0.0);
    expect(scorePH({ min: 6.0, max: 7.5 }, 8.3)).toBe(0.0);
  });

  it("geeft een partiële score binnen de tolerantiezone", () => {
    const score = scorePH({ min: 6.0, max: 7.5 }, 5.5);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("geeft 0 als plantPH null is", () => {
    expect(scorePH(null, 6.5)).toBe(0);
  });

  it("geeft 0 als zonePH null is", () => {
    expect(scorePH({ min: 6.0, max: 7.5 }, null)).toBe(0);
  });
});

// ─── scoreWater ───────────────────────────────────────────────────────────────
// Spec §4.4: rawScore = (drainageScore + waterScore) / 2.
describe("scoreWater", () => {
  it("geeft 1.0 bij perfecte drainage-match", () => {
    expect(scoreWater("low", "well-drained", "well-drained")).toBe(1.0);
  });

  it("geeft 0.75 bij aangrenzende drainage (drainage 0.5 + water 1.0)", () => {
    expect(scoreWater("medium", "moist", "well-drained")).toBe(0.75);
  });

  it("geeft 0.5 bij incompatibele drainage (drainage 0.0 + water 1.0)", () => {
    expect(scoreWater("low", "well-drained", "wet")).toBe(0.5);
  });

  it("verlaagt score bij veel regen (> 40 mm) en lage waterbehoeften", () => {
    const normaal = scoreWater("low", "well-drained", "well-drained", 0);
    const veelRegen = scoreWater("low", "well-drained", "well-drained", 45);
    expect(veelRegen).toBeLessThan(normaal);
    expect(veelRegen).toBe(0.8);
  });

  it("scoort onbekende drainage neutraal zolang waterbehoeften bekend is", () => {
    expect(scoreWater("low", "unknown", "well-drained")).toBe(1.0);
  });

  it("geeft 0 als zowel drainage als waterbehoeften onbekend zijn", () => {
    expect(scoreWater("unknown", "unknown", "well-drained")).toBe(0);
  });
});

// ─── scoreHardheid ────────────────────────────────────────────────────────────
describe("scoreHardheid", () => {
  it("geeft 1.0 als tuinhardheid binnen het bereik valt", () => {
    expect(scoreHardheid({ usda_min: 5, usda_max: 9 }, 7)).toBe(1.0);
  });

  it("geeft 1.0 als tuinhardheid gelijk is aan usda_min", () => {
    expect(scoreHardheid({ usda_min: 7, usda_max: null }, 7)).toBe(1.0);
  });

  it("geeft 0.5 bij één stap onder usda_min", () => {
    expect(scoreHardheid({ usda_min: 7, usda_max: null }, 6)).toBe(0.5);
  });

  it("geeft 0.0 bij twee of meer stappen onder usda_min", () => {
    expect(scoreHardheid({ usda_min: 7, usda_max: null }, 5)).toBe(0.0);
  });

  it("geeft 0 als hardheiddata null is", () => {
    expect(scoreHardheid(null, 7)).toBe(0);
  });
});

// ─── scoreBloeiGap ────────────────────────────────────────────────────────────
describe("scoreBloeiGap", () => {
  it("geeft 0.3 als zone al alle maanden gedekt heeft", () => {
    const alleZone = [1,2,3,4,5,6,7,8,9,10,11,12];
    expect(scoreBloeiGap([6, 7, 8], alleZone)).toBe(0.3);
  });

  it("geeft hoge score als plant bloeit in lege maanden", () => {
    expect(scoreBloeiGap([12, 1, 2], [6, 7, 8])).toBeGreaterThan(0.8);
  });

  it("geeft partiële score bij gedeeltelijke aanvulling", () => {
    const score = scoreBloeiGap([5, 6, 7], [6, 7]);
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(1.0);
  });

  it("geeft 0.5 (neutraal) voor plant zonder bloeimaanden", () => {
    expect(scoreBloeiGap([], [6, 7])).toBe(0.5);
  });

  it("geeft maximale score in een lege zone (plant vult alle gaten)", () => {
    expect(scoreBloeiGap([6, 7], [])).toBe(1.0);
  });
});
