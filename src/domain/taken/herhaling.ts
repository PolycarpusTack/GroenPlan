import type { HerhalingConfig, MaandRegel, WeekDag, WeekdagOrdinal } from "./types";

// ── Labels ────────────────────────────────────────────────────────────────────

export const WEEKDAG_KORT  = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] as const;
export const WEEKDAG_LANG  = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"] as const;
export const MAAND_LABELS  = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"] as const;
export const ORDINAL_LABELS: Record<number, string> = { 1: "Eerste", 2: "Tweede", 3: "Derde", 4: "Vierde", [-1]: "Laatste" };

export function herhalingLabel(config: HerhalingConfig): string {
  switch (config.type) {
    case "dagelijks":
      if (config.alleenWerkdagen) return "Elke werkdag";
      return config.interval === 1 ? "Dagelijks" : `Elke ${config.interval} dagen`;
    case "wekelijks": {
      const dagenStr = config.weekdagen.map((d) => WEEKDAG_KORT[d]).join(", ");
      const freq = config.interval === 1 ? "Wekelijks" : `Elke ${config.interval} weken`;
      return `${freq} op ${dagenStr}`;
    }
    case "maandelijks": {
      const freq = config.interval === 1 ? "Maandelijks" : `Elke ${config.interval} maanden`;
      return `${freq} · ${regelLabel(config.regel)}`;
    }
    case "jaarlijks": {
      const freq = config.interval === 1 ? "Jaarlijks" : `Elke ${config.interval} jaar`;
      const maandStr = MAAND_LABELS[config.maand - 1].toLowerCase();
      return config.regel.soort === "dag"
        ? `${freq} · ${config.regel.dagNummer} ${maandStr}`
        : `${freq} · ${regelLabel(config.regel)} van ${maandStr}`;
    }
  }
}

function regelLabel(r: MaandRegel): string {
  if (r.soort === "dag") return `dag ${r.dagNummer}`;
  return `${ORDINAL_LABELS[r.ordinal].toLowerCase()} ${WEEKDAG_LANG[r.weekdag].toLowerCase()}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function lokaleDatum(): string {
  return datumNaarString(new Date());
}

function datumNaarString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dag = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dag}`;
}

function parseDatum(datum: string): [number, number, number] {
  const [y, m, d] = datum.split("-").map(Number);
  return [y, m - 1, d]; // [year, 0-based month, day]
}

// ISO weekday: 0 = Monday, 6 = Sunday
function isoWeekday(d: Date): WeekDag {
  return ((d.getDay() + 6) % 7) as WeekDag;
}

// Nth weekday (ISO) of a given month. ordinal -1 = last.
function ndeWeekdagVanMaand(jaar: number, maand0: number, ordinal: WeekdagOrdinal, weekdag: WeekDag): Date {
  if (ordinal === -1) {
    const laatste = new Date(jaar, maand0 + 1, 0);
    const diff = (isoWeekday(laatste) - weekdag + 7) % 7;
    laatste.setDate(laatste.getDate() - diff);
    return laatste;
  }
  const eerste = new Date(jaar, maand0, 1);
  const diff = (weekdag - isoWeekday(eerste) + 7) % 7;
  eerste.setDate(eerste.getDate() + diff + (ordinal - 1) * 7);
  return eerste;
}

// ── Core algorithm ────────────────────────────────────────────────────────────

/**
 * Returns the next occurrence after `vanafDatum` (YYYY-MM-DD).
 *
 * Strategy:
 * - Daily / weekly: always advance by exactly one interval from the given date.
 * - Monthly / yearly: find the first occurrence of the configured day/weekday
 *   in the current period; if that date is already ≤ vanafDatum, advance one interval.
 */
export function berekenVolgendeDatum(vanafDatum: string, config: HerhalingConfig): string {
  const [jaar, maand0, dag] = parseDatum(vanafDatum);
  const base = new Date(jaar, maand0, dag);

  switch (config.type) {
    case "dagelijks": {
      if (config.alleenWerkdagen) {
        const d = new Date(base);
        d.setDate(d.getDate() + 1);
        while ([5, 6].includes(isoWeekday(d))) d.setDate(d.getDate() + 1);
        return datumNaarString(d);
      }
      const d = new Date(base);
      d.setDate(d.getDate() + config.interval);
      return datumNaarString(d);
    }

    case "wekelijks": {
      const gesorteerd = [...config.weekdagen].sort((a, b) => a - b);
      const vandaanWd = isoWeekday(base);
      const volgendInWeek = gesorteerd.find((wd) => wd > vandaanWd);
      if (volgendInWeek !== undefined) {
        const d = new Date(base);
        d.setDate(d.getDate() + (volgendInWeek - vandaanWd));
        return datumNaarString(d);
      }
      // Jump to the first configured weekday N weeks ahead
      const maandagDezeWeek = new Date(base);
      maandagDezeWeek.setDate(base.getDate() - vandaanWd);
      const d = new Date(maandagDezeWeek);
      d.setDate(maandagDezeWeek.getDate() + config.interval * 7 + gesorteerd[0]);
      return datumNaarString(d);
    }

    case "maandelijks":
      return nextMaandelijks(vanafDatum, config.interval, config.regel);

    case "jaarlijks":
      return nextJaarlijks(vanafDatum, config.interval, config.maand, config.regel);
  }
}

function kandidaatVoorMaand(j: number, m0Raw: number, regel: MaandRegel): Date {
  const m0 = ((m0Raw % 12) + 12) % 12;
  const jaar = j + Math.floor(m0Raw / 12);
  if (regel.soort === "dag") {
    const maxDag = new Date(jaar, m0 + 1, 0).getDate();
    return new Date(jaar, m0, Math.min(regel.dagNummer, maxDag));
  }
  return ndeWeekdagVanMaand(jaar, m0, regel.ordinal, regel.weekdag);
}

function nextMaandelijks(vanafDatum: string, interval: number, regel: MaandRegel): string {
  const [jaar, maand0] = parseDatum(vanafDatum);
  let k = kandidaatVoorMaand(jaar, maand0, regel);
  if (datumNaarString(k) <= vanafDatum) {
    k = kandidaatVoorMaand(jaar, maand0 + interval, regel);
  }
  return datumNaarString(k);
}

function nextJaarlijks(vanafDatum: string, interval: number, maand: number, regel: MaandRegel): string {
  const [jaar] = parseDatum(vanafDatum);
  const maand0 = maand - 1;
  const kandidaat = (j: number): Date => {
    if (regel.soort === "dag") {
      const maxDag = new Date(j, maand0 + 1, 0).getDate();
      return new Date(j, maand0, Math.min(regel.dagNummer, maxDag));
    }
    return ndeWeekdagVanMaand(j, maand0, regel.ordinal, regel.weekdag);
  };
  let k = kandidaat(jaar);
  if (datumNaarString(k) <= vanafDatum) {
    k = kandidaat(jaar + interval);
  }
  return datumNaarString(k);
}
