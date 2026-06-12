export interface Gemeente {
  naam: string;
  lat: number;
  lng: number;
}

export const BELGISCHE_GEMEENTEN: Gemeente[] = [
  // Antwerpen (provincie)
  { naam: "Antwerpen",      lat: 51.2194, lng: 4.4025 },
  { naam: "Mechelen",       lat: 51.0282, lng: 4.4802 },
  { naam: "Turnhout",       lat: 51.3248, lng: 4.9497 },
  { naam: "Mol",            lat: 51.1889, lng: 5.1187 },
  { naam: "Lier",           lat: 51.1317, lng: 4.5706 },
  // Oost-Vlaanderen
  { naam: "Gent",           lat: 51.0543, lng: 3.7174 },
  { naam: "Aalst",          lat: 50.9365, lng: 4.0360 },
  { naam: "Sint-Niklaas",   lat: 51.1606, lng: 4.1440 },
  { naam: "Dendermonde",    lat: 51.0272, lng: 4.1014 },
  // West-Vlaanderen
  { naam: "Brugge",         lat: 51.2093, lng: 3.2247 },
  { naam: "Kortrijk",       lat: 50.8281, lng: 3.2648 },
  { naam: "Roeselare",      lat: 50.9440, lng: 3.1251 },
  { naam: "Oostende",       lat: 51.2291, lng: 2.9154 },
  // Vlaams-Brabant
  { naam: "Leuven",         lat: 50.8798, lng: 4.7005 },
  { naam: "Tienen",         lat: 50.8025, lng: 4.9389 },
  // Limburg
  { naam: "Hasselt",        lat: 50.9307, lng: 5.3379 },
  { naam: "Genk",           lat: 50.9645, lng: 5.5042 },
  { naam: "Tongeren",       lat: 50.7814, lng: 5.4651 },
  // Brussel
  { naam: "Brussel",        lat: 50.8503, lng: 4.3517 },
  // Henegouwen
  { naam: "Charleroi",      lat: 50.4108, lng: 4.4446 },
  { naam: "Mons",           lat: 50.4542, lng: 3.9516 },
  { naam: "La Louvière",    lat: 50.4769, lng: 4.1863 },
  { naam: "Mouscron",       lat: 50.7455, lng: 3.2127 },
  // Luik
  { naam: "Luik",           lat: 50.6325, lng: 5.5797 },
  { naam: "Verviers",       lat: 50.5897, lng: 5.8618 },
  { naam: "Seraing",        lat: 50.5906, lng: 5.4966 },
  // Namen
  { naam: "Namen",          lat: 50.4673, lng: 4.8719 },
  { naam: "Dinant",         lat: 50.2613, lng: 4.9120 },
  // Waals-Brabant
  { naam: "Wavre",          lat: 50.7176, lng: 4.6103 },
  // Luxemburg (provincie)
  { naam: "Arlon",          lat: 49.6848, lng: 5.8115 },
  { naam: "Bastogne",       lat: 50.0036, lng: 5.7181 },
  { naam: "Marche-en-Famenne", lat: 50.2266, lng: 5.3456 },
];
