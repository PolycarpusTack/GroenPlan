import type { ITuinOntwerpService } from "./tuinontwerp-port";
import type { Zone } from "../../domain/tuin/types";
import type { AutoFillResultaat } from "../../domain/plant/types";
import type { TuinOntwerpResultaat, TuinOntwerpVoorstel, TuinOntwerpSuggestie } from "./types";

const PLANTEN_PER_ZON: Record<string, [string[], string[], string[]]> = {
  full: [
    ["Lavandula angustifolia", "Salvia officinalis", "Echinacea purpurea", "Rudbeckia fulgida"],
    ["Rosa canina", "Verbascum thapsus", "Achillea millefolium", "Sedum spectabile"],
    ["Santolina chamaecyparissus", "Stachys byzantina", "Centranthus ruber"],
  ],
  partial: [
    ["Hydrangea macrophylla", "Geranium sanguineum", "Astrantia major", "Digitalis purpurea"],
    ["Fuchsia magellanica", "Persicaria amplexicaulis", "Anemone hupehensis"],
    ["Thalictrum aquilegiifolium", "Filipendula ulmaria", "Lysimachia punctata"],
  ],
  shade: [
    ["Hedera helix", "Pachysandra terminalis", "Vinca minor", "Pulmonaria officinalis"],
    ["Hosta fortunei", "Astilbe x arendsii", "Dryopteris filix-mas"],
    ["Lamium maculatum", "Ajuga reptans", "Polygonatum multiflorum"],
  ],
};

function bloeiDekkingSchatten(planten: string[]): number {
  return Math.min(planten.length * 2, 10);
}

function biodiversiteitSchatten(planten: string[]): number {
  const families = new Set(planten.map((p) => p.split(" ")[0]));
  return Math.min(Math.round((families.size / planten.length) * 80 + 20), 100);
}

export class StubTuinOntwerpService implements ITuinOntwerpService {
  async analyseer(
    zone: Zone,
    _catalog: Record<string, AutoFillResultaat>,
    hardheid: number,
    wens: string,
  ): Promise<TuinOntwerpResultaat> {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const zonKey = zone.zon in PLANTEN_PER_ZON ? zone.zon : "partial";
    const [lijstA, lijstB, lijstC] = PLANTEN_PER_ZON[zonKey];

    const heeftWens = wens.trim().length > 0;
    const wensLabel = heeftWens ? ` (gebaseerd op: "${wens.slice(0, 40)}${wens.length > 40 ? "…" : ""}")` : "";

    const zonLabel = zone.zon === "full" ? "zonnige" : zone.zon === "partial" ? "halfschaduwrijke" : "schaduwrijke";

    const voorstellen: TuinOntwerpVoorstel[] = [
      {
        titel: "Klassiek formeel",
        beschrijving: `Een gestructureerd ontwerp voor ${zone.naam} met vaste planten in heldere blokken. Geeft het hele seizoen structuur en vraagt weinig improvisatie${wensLabel}.`,
        plantenLijst: lijstA,
        metrics: {
          bloeiDekking: bloeiDekkingSchatten(lijstA),
          companionConflicten: 0,
          biodiversiteitScore: biodiversiteitSchatten(lijstA),
        },
        suggesties: [
          { categorie: "layout", tekst: "Plaats de hoogste soorten achteraan voor een gelaagd beeld.", prioriteit: "hoog" },
          { categorie: "seizoen", tekst: "Snoeien na de eerste bloei verlengt de bloeitijd.", prioriteit: "midden" },
          ...(hardheid <= 6
            ? [{ categorie: "ecologie" as const, tekst: `Hardheidszone ${hardheid}: mulch gevoelige soorten in november.`, prioriteit: "hoog" as const }]
            : []),
        ],
      },
      {
        titel: "Ecologisch & bestuivers",
        beschrijving: `Gericht op bijen, vlinders en andere bestuivers voor de ${zonLabel} zone. Kiest inheemse en half-inheemse soorten met lange bloeitijd${wensLabel}.`,
        plantenLijst: lijstB,
        metrics: {
          bloeiDekking: bloeiDekkingSchatten(lijstB),
          companionConflicten: 0,
          biodiversiteitScore: Math.min(biodiversiteitSchatten(lijstB) + 10, 100),
        },
        suggesties: [
          { categorie: "ecologie", tekst: "Laat zaadpluimen staan: voedsel voor vogels in de winter.", prioriteit: "hoog" },
          { categorie: "plant", tekst: "Combineer vroeg- en laat-bloeiende soorten voor doorlopende stuifmeeltoevoer.", prioriteit: "midden" },
        ],
      },
      {
        titel: "Minimaal onderhoud",
        beschrijving: `Robuuste bodembedekkers en droogtetolerante vaste planten voor wie minder tijd heeft. Eenmaal gevestigd vraagt dit ontwerp weinig ingrepen${wensLabel}.`,
        plantenLijst: lijstC,
        metrics: {
          bloeiDekking: bloeiDekkingSchatten(lijstC),
          companionConflicten: 0,
          biodiversiteitScore: biodiversiteitSchatten(lijstC),
        },
        suggesties: [
          { categorie: "layout", tekst: "Dek de bodem af met 5 cm schors-mulch na aanplant.", prioriteit: "hoog" },
          { categorie: "seizoen", tekst: "Eenmalig snoeien in het vroege voorjaar volstaat.", prioriteit: "laag" },
        ],
      },
    ];

    const aantalPlanten = zone.plantPlaatsingen.length;
    const samenvatting = aantalPlanten === 0
      ? `${zone.naam} is nog leeg. Hieronder vind je 3 ontwerpen voor jouw ${zonLabel} zone — kies het concept dat bij je past.`
      : `${zone.naam} heeft ${aantalPlanten} plant${aantalPlanten !== 1 ? "en" : ""}. Hier zijn 3 uitbreidings- of herinrichtingsconcepten.`;

    const suggesties: TuinOntwerpSuggestie[] = voorstellen[0].suggesties;

    return { samenvatting, suggesties, voorstellen };
  }
}
