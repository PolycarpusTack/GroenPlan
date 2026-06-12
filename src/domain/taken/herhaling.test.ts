import { describe, it, expect } from "vitest";
import { berekenVolgendeDatum, herhalingLabel } from "./herhaling";
import type { HerhalingConfig } from "./types";

// 2026-05-25 = Monday (verified: 2026-01-01 is Thursday, +144 days = Monday)
// 2026-05-22 = Friday
// 2026-05-27 = Wednesday

describe("berekenVolgendeDatum — dagelijks", () => {
  it("elke dag: +1 dag", () => {
    const c: HerhalingConfig = { type: "dagelijks", interval: 1, alleenWerkdagen: false };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-05-26");
  });

  it("elke 3 dagen", () => {
    const c: HerhalingConfig = { type: "dagelijks", interval: 3, alleenWerkdagen: false };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-05-28");
  });

  it("alleen werkdagen: vrijdag → maandag (skip weekend)", () => {
    const c: HerhalingConfig = { type: "dagelijks", interval: 1, alleenWerkdagen: true };
    expect(berekenVolgendeDatum("2026-05-22", c)).toBe("2026-05-25");
  });

  it("alleen werkdagen: maandag → dinsdag", () => {
    const c: HerhalingConfig = { type: "dagelijks", interval: 1, alleenWerkdagen: true };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-05-26");
  });
});

describe("berekenVolgendeDatum — wekelijks", () => {
  it("elke week op maandag: volgende maandag", () => {
    const c: HerhalingConfig = { type: "wekelijks", interval: 1, weekdagen: [0] };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-01");
  });

  it("elke week op ma+wo: vanuit maandag → dezelfde week woensdag", () => {
    const c: HerhalingConfig = { type: "wekelijks", interval: 1, weekdagen: [0, 2] };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-05-27");
  });

  it("elke week op ma+wo: vanuit woensdag → volgende week maandag", () => {
    const c: HerhalingConfig = { type: "wekelijks", interval: 1, weekdagen: [0, 2] };
    expect(berekenVolgendeDatum("2026-05-27", c)).toBe("2026-06-01");
  });

  it("elke 2 weken op maandag", () => {
    const c: HerhalingConfig = { type: "wekelijks", interval: 2, weekdagen: [0] };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-08");
  });
});

describe("berekenVolgendeDatum — maandelijks dag", () => {
  it("elke maand op de 15e: dag al voorbij → volgende maand", () => {
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 15 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-15");
  });

  it("elke maand op de 15e: dag ligt nog in de toekomst → deze maand", () => {
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 15 } };
    expect(berekenVolgendeDatum("2026-05-10", c)).toBe("2026-05-15");
  });

  it("dag 31 van maand die maar 28 dagen heeft: knipt af op 28", () => {
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 31 } };
    expect(berekenVolgendeDatum("2026-01-31", c)).toBe("2026-02-28");
  });

  it("elke 2 maanden op de 1e", () => {
    const c: HerhalingConfig = { type: "maandelijks", interval: 2, regel: { soort: "dag", dagNummer: 1 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-07-01");
  });

  it("jaarovergang: december → februari", () => {
    const c: HerhalingConfig = { type: "maandelijks", interval: 2, regel: { soort: "dag", dagNummer: 15 } };
    expect(berekenVolgendeDatum("2026-12-15", c)).toBe("2027-02-15");
  });
});

describe("berekenVolgendeDatum — maandelijks weekdag", () => {
  it("2e maandag van elke maand: 2e maandag van juni 2026 = 8 juni", () => {
    // Juni 2026: 1 juni = maandag → 2e maandag = 8 juni
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "weekdag", ordinal: 2, weekdag: 0 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-08");
  });

  it("1e vrijdag van elke maand: al voorbij → volgende maand", () => {
    // Mei 2026: 1e vrijdag = 1 mei (vrijdag). vandaan = 5 mei > 1 mei → volgende = 1e vr juni
    // Juni 2026: 1 juni = maandag → 1e vrijdag = 5 juni
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "weekdag", ordinal: 1, weekdag: 4 } };
    expect(berekenVolgendeDatum("2026-05-05", c)).toBe("2026-06-05");
  });

  it("laatste maandag van elke maand", () => {
    // Mei 2026: 31 mei = zondag → laatste maandag = 25 mei
    // vandaan = 25 mei (= de dag zelf) → volgende = laatste maandag van juni
    // Juni 2026: 30 juni = dinsdag → laatste maandag = 29 juni
    const c: HerhalingConfig = { type: "maandelijks", interval: 1, regel: { soort: "weekdag", ordinal: -1, weekdag: 0 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-29");
  });
});

describe("berekenVolgendeDatum — jaarlijks dag", () => {
  it("jaarlijks op 15 juni: vóór 15 juni → dit jaar", () => {
    const c: HerhalingConfig = { type: "jaarlijks", interval: 1, maand: 6, regel: { soort: "dag", dagNummer: 15 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-15");
  });

  it("jaarlijks op 15 juni: ná 15 juni → volgend jaar", () => {
    const c: HerhalingConfig = { type: "jaarlijks", interval: 1, maand: 6, regel: { soort: "dag", dagNummer: 15 } };
    expect(berekenVolgendeDatum("2026-06-15", c)).toBe("2027-06-15");
  });

  it("elke 2 jaar op 1 maart", () => {
    const c: HerhalingConfig = { type: "jaarlijks", interval: 2, maand: 3, regel: { soort: "dag", dagNummer: 1 } };
    expect(berekenVolgendeDatum("2026-03-01", c)).toBe("2028-03-01");
  });
});

describe("berekenVolgendeDatum — jaarlijks weekdag", () => {
  it("1e maandag van juni: vóór juni → dit jaar", () => {
    // Juni 2026: 1 juni = maandag → 1e maandag = 1 juni
    const c: HerhalingConfig = { type: "jaarlijks", interval: 1, maand: 6, regel: { soort: "weekdag", ordinal: 1, weekdag: 0 } };
    expect(berekenVolgendeDatum("2026-05-25", c)).toBe("2026-06-01");
  });

  it("1e maandag van juni: ná 1 juni → volgend jaar", () => {
    // Juni 2027: 1 juni = dinsdag → 1e maandag = 7 juni
    const c: HerhalingConfig = { type: "jaarlijks", interval: 1, maand: 6, regel: { soort: "weekdag", ordinal: 1, weekdag: 0 } };
    expect(berekenVolgendeDatum("2026-06-01", c)).toBe("2027-06-07");
  });
});

describe("herhalingLabel", () => {
  it("dagelijks", () => {
    expect(herhalingLabel({ type: "dagelijks", interval: 1, alleenWerkdagen: false })).toBe("Dagelijks");
  });
  it("elke werkdag", () => {
    expect(herhalingLabel({ type: "dagelijks", interval: 1, alleenWerkdagen: true })).toBe("Elke werkdag");
  });
  it("elke 3 dagen", () => {
    expect(herhalingLabel({ type: "dagelijks", interval: 3, alleenWerkdagen: false })).toBe("Elke 3 dagen");
  });
  it("wekelijks op ma, wo", () => {
    expect(herhalingLabel({ type: "wekelijks", interval: 1, weekdagen: [0, 2] })).toBe("Wekelijks op Ma, Wo");
  });
  it("maandelijks dag", () => {
    expect(herhalingLabel({ type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 15 } })).toBe("Maandelijks · dag 15");
  });
  it("jaarlijks datum", () => {
    expect(herhalingLabel({ type: "jaarlijks", interval: 1, maand: 6, regel: { soort: "dag", dagNummer: 15 } })).toBe("Jaarlijks · 15 juni");
  });
});
