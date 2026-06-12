// Testfixtures — herbruikbaar in alle tests die een PlantSoort nodig hebben
import type { AutoFillResultaat } from "./types";

export const lavendel: AutoFillResultaat = {
  identificatie: {
    wetenschappelijkeNaam: "Lavandula angustifolia",
    soort: "Lavandula angustifolia",
    cultivar: null,
    gewoneNamen: { nl: "Lavendel", en: "Lavender", fr: "Lavande" },
    familie: "Lamiaceae",
    type: "shrub",
  },
  groei: {
    volwassenHoogte_cm: { waarde: { min: 30, max: 60 }, bron: "RHS" },
    volwassenBreedte_cm: { waarde: { min: 30, max: 60 }, bron: "RHS" },
    plantafstand_cm: { waarde: 45, bron: "RHS" },
    groeisnelheid: { waarde: "medium", bron: "AI-knowledge" },
  },
  omstandigheden: {
    zon: { waarde: "full", bron: "RHS" },
    grondsoorten: { waarde: ["chalk", "sand", "loam"], bron: "RHS" },
    pH: { waarde: { min: 6.5, max: 8.0 }, bron: "RHS" },
    drainage: { waarde: "well-drained", bron: "RHS" },
    waterbehoeften: { waarde: "low", bron: "AI-knowledge" },
    hardheid: { waarde: { usda_min: 5, usda_max: 8 }, bron: "RHS" },
  },
  bloei: {
    maanden: { waarde: [6, 7, 8], bron: "RHS" },
    kleuren: { waarde: ["paars", "violet"], bron: "RHS" },
    geurig: { waarde: true, bron: "RHS" },
  },
  onderhoud: {
    snoeien: { waarde: { wanneer: "vroeg voorjaar", hoe: "terugknippen tot oud hout" }, bron: "RHS" },
    bemesten: { waarde: null, bron: "AI-knowledge" },
    overwinteren: { waarde: null, bron: "AI-knowledge" },
  },
  ecologie: {
    bestuivers: { waarde: ["bees", "butterflies"], bron: "RHS" },
    begeleiders: { waarde: { goed: ["Salvia", "Stachys"], slecht: [] }, bron: "AI-knowledge" },
    plagen: { waarde: [], bron: "AI-knowledge" },
    ziekten: { waarde: ["meeldauw"], bron: "AI-knowledge" },
    inheems_belgie: { waarde: false, bron: "GBIF" },
    invasief_belgie: { waarde: false, bron: "GBIF" },
  },
  veiligheid: {
    giftig_huisdieren: { waarde: null, bron: "unknown" },
    giftig_mensen: { waarde: false, bron: "AI-knowledge" },
    eetbare_delen: { waarde: ["bloemen", "bladeren"], bron: "AI-knowledge" },
  },
  notities: "Mediterrane plant; verdraagt droogte uitstekend.",
  zekerheid: { algemeen: 0.92, notities: "Veel gepubliceerde bronnen beschikbaar." },
};

export const onbekendePlant: AutoFillResultaat = {
  identificatie: {
    wetenschappelijkeNaam: "Obscura exotica",
    soort: "Obscura exotica",
    cultivar: null,
    gewoneNamen: { nl: null, en: null, fr: null },
    familie: "unknown",
    type: "unknown",
  },
  groei: {
    volwassenHoogte_cm: { waarde: null, bron: "unknown" },
    volwassenBreedte_cm: { waarde: null, bron: "unknown" },
    plantafstand_cm: { waarde: null, bron: "unknown" },
    groeisnelheid: { waarde: null, bron: "unknown" },
  },
  omstandigheden: {
    zon: { waarde: "unknown", bron: "unknown" },
    grondsoorten: { waarde: [], bron: "unknown" },
    pH: { waarde: null, bron: "unknown" },
    drainage: { waarde: "unknown", bron: "unknown" },
    waterbehoeften: { waarde: "unknown", bron: "unknown" },
    hardheid: { waarde: null, bron: "unknown" },
  },
  bloei: {
    maanden: { waarde: [], bron: "unknown" },
    kleuren: { waarde: [], bron: "unknown" },
    geurig: { waarde: null, bron: "unknown" },
  },
  onderhoud: {
    snoeien: { waarde: null, bron: "unknown" },
    bemesten: { waarde: null, bron: "unknown" },
    overwinteren: { waarde: null, bron: "unknown" },
  },
  ecologie: {
    bestuivers: { waarde: [], bron: "unknown" },
    begeleiders: { waarde: { goed: [], slecht: [] }, bron: "unknown" },
    plagen: { waarde: [], bron: "unknown" },
    ziekten: { waarde: [], bron: "unknown" },
    inheems_belgie: { waarde: null, bron: "unknown" },
    invasief_belgie: { waarde: null, bron: "unknown" },
  },
  veiligheid: {
    giftig_huisdieren: { waarde: null, bron: "unknown" },
    giftig_mensen: { waarde: null, bron: "unknown" },
    eetbare_delen: { waarde: [], bron: "unknown" },
  },
  notities: "",
  zekerheid: { algemeen: 0.1, notities: "Onvoldoende gepubliceerde bronnen." },
};
