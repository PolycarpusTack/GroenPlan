// Tuin aggregate root — toegangspunt voor alle zone-mutaties.
// Invariant: elk commando met een doel-id (zone/plant/border) faalt expliciet als
// dat id niet bestaat, i.p.v. stil niets te doen. Zo blijven aggregaat-invarianten
// afdwingbaar en zijn bugs in de UI/store traceerbaar.
import type { Tuin, Zone, PlantPlaatsing, Border, ZoneInput } from "./types";

function eisZone(tuin: Tuin, zoneId: string): Zone {
  const zone = tuin.zones.find((z) => z.id === zoneId);
  if (!zone) {
    throw new Error(`Zone '${zoneId}' niet gevonden in tuin '${tuin.id}'`);
  }
  return zone;
}

function eisPlaatsing(zone: Zone, plaatsingId: string): void {
  if (!zone.plantPlaatsingen.some((p) => p.id === plaatsingId)) {
    throw new Error(`Plant '${plaatsingId}' niet gevonden in zone '${zone.id}'`);
  }
}

function eisBorder(zone: Zone, borderId: string): void {
  if (!zone.borders.some((b) => b.id === borderId)) {
    throw new Error(`Border '${borderId}' niet gevonden in zone '${zone.id}'`);
  }
}

export function voegZoneToe(tuin: Tuin, zone: ZoneInput): Tuin {
  if (tuin.zones.some((z) => z.id === zone.id)) {
    throw new Error(`Zone met id '${zone.id}' bestaat al in tuin '${tuin.id}'`);
  }
  return {
    ...tuin,
    zones: [...tuin.zones, { ...zone, plantPlaatsingen: [], borders: [] }],
  };
}

export function verwijderZone(tuin: Tuin, zoneId: string): Tuin {
  eisZone(tuin, zoneId);
  return { ...tuin, zones: tuin.zones.filter((z) => z.id !== zoneId) };
}

export function updateZone(tuin: Tuin, updates: ZoneInput): Tuin {
  eisZone(tuin, updates.id);
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === updates.id ? { ...z, ...updates } : z,
    ),
  };
}

export function plaatsPlant(tuin: Tuin, zoneId: string, plaatsing: PlantPlaatsing): Tuin {
  const zone = eisZone(tuin, zoneId);
  if (zone.plantPlaatsingen.some((p) => p.id === plaatsing.id)) {
    throw new Error(`Plant '${plaatsing.id}' bestaat al in zone '${zoneId}'`);
  }
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? { ...z, plantPlaatsingen: [...z.plantPlaatsingen, plaatsing] }
        : z,
    ),
  };
}

export function verwijderPlant(tuin: Tuin, zoneId: string, plaatsingId: string): Tuin {
  const zone = eisZone(tuin, zoneId);
  eisPlaatsing(zone, plaatsingId);
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? { ...z, plantPlaatsingen: z.plantPlaatsingen.filter((p) => p.id !== plaatsingId) }
        : z,
    ),
  };
}

export function voegBorderToe(tuin: Tuin, zoneId: string, border: Border): Tuin {
  const zone = eisZone(tuin, zoneId);
  if (zone.borders.some((b) => b.id === border.id)) {
    throw new Error(`Border '${border.id}' bestaat al in zone '${zoneId}'`);
  }
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? { ...z, borders: [...z.borders, border] }
        : z,
    ),
  };
}

export function hernoemBorder(tuin: Tuin, zoneId: string, borderId: string, naam: string): Tuin {
  const zone = eisZone(tuin, zoneId);
  eisBorder(zone, borderId);
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? { ...z, borders: z.borders.map((b) => b.id === borderId ? { ...b, naam } : b) }
        : z,
    ),
  };
}

export function verwijderBorder(tuin: Tuin, zoneId: string, borderId: string): Tuin {
  const zone = eisZone(tuin, zoneId);
  eisBorder(zone, borderId);
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? {
            ...z,
            borders: z.borders.filter((b) => b.id !== borderId),
            // Planten in de verwijderde border worden 'zonder border' (niet verwijderd)
            plantPlaatsingen: z.plantPlaatsingen.map((p) =>
              p.borderId === borderId ? { ...p, borderId: null } : p,
            ),
          }
        : z,
    ),
  };
}

export function verplaatsNaarBorder(
  tuin: Tuin,
  zoneId: string,
  plaatsingId: string,
  borderId: string | null,
): Tuin {
  const zone = eisZone(tuin, zoneId);
  eisPlaatsing(zone, plaatsingId);
  if (borderId !== null) {
    eisBorder(zone, borderId);
  }
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id === zoneId
        ? {
            ...z,
            plantPlaatsingen: z.plantPlaatsingen.map((p) =>
              p.id === plaatsingId ? { ...p, borderId } : p,
            ),
          }
        : z,
    ),
  };
}

export function setPlantNotitie(
  tuin: Tuin,
  zoneId: string,
  plaatsingId: string,
  notitie: string | null,
): Tuin {
  const zone = eisZone(tuin, zoneId);
  eisPlaatsing(zone, plaatsingId);
  return {
    ...tuin,
    zones: tuin.zones.map((z) =>
      z.id !== zoneId ? z : {
        ...z,
        plantPlaatsingen: z.plantPlaatsingen.map((p) =>
          p.id === plaatsingId ? { ...p, notitie } : p,
        ),
      },
    ),
  };
}

export function zoekZone(tuin: Tuin, zoneId: string): Zone | undefined {
  return tuin.zones.find((z) => z.id === zoneId);
}

export function bloeiMaandenVanZone(tuin: Tuin, zoneId: string, bloeiPerPlant: Map<string, number[]>): number[] {
  const zone = zoekZone(tuin, zoneId);
  if (!zone) return [];
  const alleenMaanden = zone.plantPlaatsingen.flatMap(
    (p) => bloeiPerPlant.get(p.plantSoortId) ?? [],
  );
  return [...new Set(alleenMaanden)].sort((a, b) => a - b);
}
