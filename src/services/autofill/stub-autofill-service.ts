// Lokale reserve voor auto-fill wanneer er geen AI-verbinding is (offline, geen
// /api/autofill-backend of geen Anthropic-sleutel). Conform de anti-hallucination
// guardrail verzint deze reserve GEEN plantgegevens: alle velden blijven
// unknown/null met bron "unknown". De UI markeert dit duidelijk als lokaal.
import type { AutoFillPort } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";

export function maakLokaleReserve(wetenschappelijkeNaam: string): AutoFillResultaat {
  const naam = wetenschappelijkeNaam.trim();
  return {
    identificatie: {
      wetenschappelijkeNaam: naam,
      soort: naam,
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
    notities:
      "Je bent offline of er is geen AI-verbinding. Dit is een lege lokale invulling " +
      "(geen AI-gegevens) — vul de velden zelf aan of probeer later opnieuw.",
    zekerheid: {
      algemeen: 0,
      notities: "Lokale reserve zonder AI — geen plantgegevens ingevuld om verzinsels te vermijden.",
      terugval: true,
    },
  };
}

export class StubAutoFillService implements AutoFillPort {
  async vulAan(wetenschappelijkeNaam: string): Promise<AutoFillResultaat> {
    return maakLokaleReserve(wetenschappelijkeNaam);
  }
}
