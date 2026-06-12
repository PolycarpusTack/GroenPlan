interface OpenMeteoResponse {
  daily: {
    precipitation_sum: (number | null)[];
  };
}

// Ruwe Open-Meteo dagelijkse velden voor de voorspelling (vandaag + 5 dagen).
export interface DailyVoorspelling {
  time: string[];
  weather_code: number[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: (number | null)[];
  wind_direction_10m_dominant: (number | null)[];
}

interface VoorspellingResponse {
  daily: DailyVoorspelling;
}

export interface WeerVandaag {
  hoog: number;
  laag: number;
  neerslagKans: number;
  conditie: string;
  icoon: string;
  windSnelheid: number;   // km/u, afgerond
  windRichting: string;   // kompas (N, NO, …) waar de wind vandaan komt
  windGraden: number;     // 0–359, bron-richting
}

export interface WeerDag {
  datum: string;          // YYYY-MM-DD
  weekdag: string;        // korte NL-naam (ma, di, …)
  hoog: number;
  laag: number;
  neerslagKans: number;
  conditie: string;
  icoon: string;
}

export interface WeerVoorspelling {
  vandaag: WeerVandaag;
  dagen: WeerDag[];       // de komende 5 dagen
}

const WMO_CONDITIE: Record<number, { conditie: string; icoon: string }> = {
  0:  { conditie: "Helder", icoon: "☀️" },
  1:  { conditie: "Overwegend helder", icoon: "🌤️" },
  2:  { conditie: "Deels bewolkt", icoon: "⛅" },
  3:  { conditie: "Bewolkt", icoon: "☁️" },
  45: { conditie: "Mist", icoon: "🌫️" },
  48: { conditie: "IJsmist", icoon: "🌫️" },
  51: { conditie: "Lichte motregen", icoon: "🌦️" },
  53: { conditie: "Motregen", icoon: "🌦️" },
  55: { conditie: "Zware motregen", icoon: "🌧️" },
  61: { conditie: "Lichte regen", icoon: "🌧️" },
  63: { conditie: "Regen", icoon: "🌧️" },
  65: { conditie: "Zware regen", icoon: "🌧️" },
  71: { conditie: "Lichte sneeuw", icoon: "🌨️" },
  73: { conditie: "Sneeuw", icoon: "❄️" },
  75: { conditie: "Zware sneeuw", icoon: "❄️" },
  80: { conditie: "Regenbuien", icoon: "🌦️" },
  81: { conditie: "Regenbuien", icoon: "🌧️" },
  82: { conditie: "Zware regenbuien", icoon: "⛈️" },
  85: { conditie: "Sneeuwbuien", icoon: "🌨️" },
  86: { conditie: "Zware sneeuwbuien", icoon: "❄️" },
  95: { conditie: "Onweer", icoon: "⛈️" },
  96: { conditie: "Onweer met hagel", icoon: "⛈️" },
  99: { conditie: "Zwaar onweer", icoon: "⛈️" },
};

const KOMPAS = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
const WEEKDAG_KORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];

// Pure helper: graden → 8-punts kompasrichting (NL). Robuust voor elke hoek.
export function windKompas(graden: number): string {
  const genormaliseerd = ((graden % 360) + 360) % 360;
  return KOMPAS[Math.round(genormaliseerd / 45) % 8];
}

// Pure transformatie van de Open-Meteo-respons naar onze view-types. Geen I/O,
// zodat hij zonder fetch-mock te testen is.
export function parseVoorspelling(daily: DailyVoorspelling): WeerVoorspelling {
  const dagInfo = (i: number) => {
    const code = daily.weather_code[i] ?? 0;
    const info = WMO_CONDITIE[code] ?? WMO_CONDITIE[0];
    return {
      hoog: Math.round(daily.temperature_2m_max[i] ?? 0),
      laag: Math.round(daily.temperature_2m_min[i] ?? 0),
      neerslagKans: daily.precipitation_probability_max[i] ?? 0,
      conditie: info.conditie,
      icoon: info.icoon,
    };
  };

  const windGraden = Math.round(daily.wind_direction_10m_dominant[0] ?? 0);
  const vandaag: WeerVandaag = {
    ...dagInfo(0),
    windSnelheid: Math.round(daily.wind_speed_10m_max[0] ?? 0),
    windGraden,
    windRichting: windKompas(windGraden),
  };

  const dagen: WeerDag[] = daily.time.slice(1, 6).map((datum, idx) => ({
    datum,
    // noon-lokaal voorkomt een verschuiving rond middernacht
    weekdag: WEEKDAG_KORT[new Date(`${datum}T12:00:00`).getDay()],
    ...dagInfo(idx + 1),
  }));

  return { vandaag, dagen };
}

export async function haalWeerVoorspellingOp(lat: number, lng: number): Promise<WeerVoorspelling> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
  );
  url.searchParams.set("timezone", "Europe/Brussels");
  url.searchParams.set("forecast_days", "6"); // vandaag + 5 dagen

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weer-API fout: ${res.status}`);

  const data = await res.json() as VoorspellingResponse;
  return parseVoorspelling(data.daily);
}

export async function haalNeerslagOp(lat: number, lng: number): Promise<number> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "Europe/Brussels");
  url.searchParams.set("past_days", "7");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weer-API fout: ${res.status}`);

  const data = await res.json() as OpenMeteoResponse;
  const som = data.daily.precipitation_sum
    .slice(0, 7) // zeker de laatste 7 dagen
    .reduce<number>((acc, v) => acc + (v ?? 0), 0);

  return Math.round(som * 10) / 10; // 1 decimaal
}
