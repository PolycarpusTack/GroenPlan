// Leidt een weergave-type af uit de taaktitel (trefwoord-heuristiek op de
// eigen tekst van de gebruiker — er wordt niets verzonnen; zonder match
// valt de taak terug op "overig").
export type TaakType = "snoei" | "water" | "voeding" | "controle" | "oogst" | "overig";

const TREFWOORDEN: [TaakType, RegExp][] = [
  ["snoei",    /snoei|knip|scheren|afknippen|uitdunnen/i],
  ["water",    /water|gieten|begiet|irrigatie|sproei/i],
  ["voeding",  /bemest|voeding|voed|compost|mest/i],
  ["controle", /controleer|controle|check|inspecteer|nakijken/i],
  ["oogst",    /oogst|pluk/i],
];

export function bepaalTaakType(titel: string): TaakType {
  for (const [type, patroon] of TREFWOORDEN) {
    if (patroon.test(titel)) return type;
  }
  return "overig";
}

export const TAAK_TYPE_LABEL: Record<TaakType, string> = {
  snoei: "Snoeien",
  water: "Water",
  voeding: "Voeding",
  controle: "Controle",
  oogst: "Oogst",
  overig: "Taak",
};
