import { describe, it, expect } from "vitest";
import { windKompas, parseVoorspelling, type DailyVoorspelling } from "./weather-service";

describe("windKompas", () => {
  it("vertaalt hoofdrichtingen naar het juiste kompaslabel", () => {
    expect(windKompas(0)).toBe("N");
    expect(windKompas(90)).toBe("O");
    expect(windKompas(180)).toBe("Z");
    expect(windKompas(270)).toBe("W");
  });

  it("rondt naar de dichtstbijzijnde van 8 richtingen", () => {
    expect(windKompas(45)).toBe("NO");
    expect(windKompas(135)).toBe("ZO");
    expect(windKompas(225)).toBe("ZW");
    expect(windKompas(315)).toBe("NW");
  });

  it("normaliseert hoeken buiten 0–359", () => {
    expect(windKompas(360)).toBe("N");
    expect(windKompas(-90)).toBe("W");
    expect(windKompas(450)).toBe("O");
  });
});

describe("parseVoorspelling", () => {
  const daily: DailyVoorspelling = {
    time: ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06"],
    weather_code: [0, 3, 61, 95, 2, 1],
    temperature_2m_max: [22.4, 19.6, 17.1, 15.8, 20.2, 21.9],
    temperature_2m_min: [11.2, 10.8, 9.4, 8.1, 12.0, 11.5],
    precipitation_probability_max: [10, 40, 80, 90, 20, 0],
    wind_speed_10m_max: [12.6, 18, 24, 30, 14, 9],
    wind_direction_10m_dominant: [315, 270, 200, 180, 90, 45],
  };

  it("levert 'vandaag' met afgeronde temperaturen en windgegevens", () => {
    const { vandaag } = parseVoorspelling(daily);
    expect(vandaag.hoog).toBe(22);
    expect(vandaag.laag).toBe(11);
    expect(vandaag.neerslagKans).toBe(10);
    expect(vandaag.conditie).toBe("Helder");
    expect(vandaag.windSnelheid).toBe(13);
    expect(vandaag.windGraden).toBe(315);
    expect(vandaag.windRichting).toBe("NW");
  });

  it("levert precies de komende 5 dagen (zonder vandaag)", () => {
    const { dagen } = parseVoorspelling(daily);
    expect(dagen).toHaveLength(5);
    expect(dagen[0].datum).toBe("2026-06-02");
    expect(dagen[0].hoog).toBe(20);
    expect(dagen[4].datum).toBe("2026-06-06");
  });

  it("valt terug op code 0 (Helder) bij een onbekende weather_code", () => {
    const metRareCode: DailyVoorspelling = { ...daily, weather_code: [999, 3, 61, 95, 2, 1] };
    expect(parseVoorspelling(metRareCode).vandaag.conditie).toBe("Helder");
  });

  it("behandelt ontbrekende (null) waarden veilig", () => {
    const metNulls: DailyVoorspelling = {
      ...daily,
      temperature_2m_max: [null, null, null, null, null, null],
      precipitation_probability_max: [null, null, null, null, null, null],
      wind_speed_10m_max: [null, null, null, null, null, null],
      wind_direction_10m_dominant: [null, null, null, null, null, null],
    };
    const { vandaag } = parseVoorspelling(metNulls);
    expect(vandaag.hoog).toBe(0);
    expect(vandaag.neerslagKans).toBe(0);
    expect(vandaag.windSnelheid).toBe(0);
    expect(vandaag.windRichting).toBe("N");
  });
});
