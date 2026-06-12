// CSV-export van de bloeikalender, met BOM + puntkomma (NL-Excel-conventie).
const MAAND = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

export interface BloeiCsvRij {
  wetNaam: string;
  gewoneNaam: string | null;
  zoneNamen: string[];
  bloeiMaanden: Set<number>;
}

export function bloeiKalenderCsv(rijen: BloeiCsvRij[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const kop = ["Wetenschappelijke naam", "Gewone naam", "Zones", "Bloeimaanden"].map(esc).join(";");
  const regels = rijen.map((r) =>
    [
      r.wetNaam,
      r.gewoneNaam ?? "",
      r.zoneNamen.join(", "),
      [...r.bloeiMaanden].sort((a, b) => a - b).map((m) => MAAND[m - 1]).join(", "),
    ].map(esc).join(";"),
  );
  return "﻿" + [kop, ...regels].join("\r\n");
}
