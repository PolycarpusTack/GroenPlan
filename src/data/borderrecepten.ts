// Gecureerde borderrecepten — een redactionele, lokale lijst van klassieke,
// beproefde plantcombinaties voor Belgische tuinen. Geen AI-output: de
// soortkeuzes zijn gangbare vakliteratuur-combinaties; de bijen/vlinder-
// scores zijn een redactionele indicatie (1–10) en worden zo gelabeld.
export interface BorderRecept {
  id: string;
  naam: string;
  type: "Borderrecept" | "Seizoensmix";
  beschrijving: string;
  /** Wetenschappelijke namen — klikbaar door te zoeken in Ontdek. */
  soorten: string[];
  /** Richtoppervlakte in m² waarvoor aantalPlanten is bedoeld. */
  m2: number;
  aantalPlanten: number;
  bloeiVenster: string;
  onderhoud: "laag" | "medium" | "hoog";
  bijenScore: number;
  vlinderScore: number;
  /** Tailwind-gradient voor de kaartbanner. */
  gradient: string;
}

export const BORDERRECEPTEN: BorderRecept[] = [
  {
    id: "droge-zonnige-bijenborder",
    naam: "Droge zonnige bijenborder",
    type: "Borderrecept",
    beschrijving: "Droogtetolerante klassiekers voor volle zon — het bekende bijen-trio lavendel, salie en zonnehoed, aangevuld met kattenkruid en duizendblad.",
    soorten: [
      "Lavandula angustifolia",
      "Salvia nemorosa",
      "Echinacea purpurea",
      "Nepeta faassenii",
      "Achillea millefolium",
      "Origanum vulgare",
      "Stipa tenuissima",
      "Verbena bonariensis",
    ],
    m2: 12,
    aantalPlanten: 19,
    bloeiVenster: "juni–oktober",
    onderhoud: "laag",
    bijenScore: 9,
    vlinderScore: 7,
    gradient: "from-bloom-200 to-amber-200",
  },
  {
    id: "paarse-zomerborder",
    naam: "Paarse zomerborder",
    type: "Seizoensmix",
    beschrijving: "Toon-op-toon paars en blauw voor halfschaduw tot zon, met sierui als verticaal accent en ooievaarsbek als bodembedekker.",
    soorten: [
      "Salvia nemorosa",
      "Verbena bonariensis",
      "Allium hollandicum",
      "Geranium himalayense",
      "Nepeta faassenii",
      "Lavandula angustifolia",
    ],
    m2: 8,
    aantalPlanten: 14,
    bloeiVenster: "mei–september",
    onderhoud: "laag",
    bijenScore: 8,
    vlinderScore: 8,
    gradient: "from-bloom-300 to-sky-200",
  },
  {
    id: "lange-bloei-mrt-okt",
    naam: "Lange bloei maart–oktober",
    type: "Borderrecept",
    beschrijving: "Gespreide bloei van vroege voorjaarsbloeiers tot late herfstasters — gericht op een doorlopend nectaraanbod en kleur in elk seizoen.",
    soorten: [
      "Helleborus orientalis",
      "Crocus vernus",
      "Geranium himalayense",
      "Echinacea purpurea",
      "Rudbeckia fulgida",
      "Anemone hupehensis",
      "Aster novi-belgii",
    ],
    m2: 10,
    aantalPlanten: 17,
    bloeiVenster: "maart–oktober",
    onderhoud: "medium",
    bijenScore: 8,
    vlinderScore: 6,
    gradient: "from-moss-200 to-bloom-200",
  },
];
