// Pure geo-helper: bepaalt de dichtstbijzijnde Belgische gemeente bij een
// GPS-positie. Werkt volledig offline (statische coördinaten) en is testbaar
// zonder mocks.
import { BELGISCHE_GEMEENTEN, type Gemeente } from "../weather/belgische-gemeenten";

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // straal aarde in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function dichtstbijzijndeGemeente(
  lat: number,
  lng: number,
): { gemeente: Gemeente; afstandKm: number } {
  let beste = BELGISCHE_GEMEENTEN[0];
  let besteAfstand = Infinity;
  for (const g of BELGISCHE_GEMEENTEN) {
    const d = haversineKm(lat, lng, g.lat, g.lng);
    if (d < besteAfstand) {
      besteAfstand = d;
      beste = g;
    }
  }
  return { gemeente: beste, afstandKm: Math.round(besteAfstand * 10) / 10 };
}
