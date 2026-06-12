import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tuin, PlantPlaatsing, ZoneInput } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";
import {
  voegZoneToe,
  verwijderZone as domeinVerwijderZone,
  updateZone as domeinUpdateZone,
  plaatsPlant,
  verwijderPlant as domeinVerwijderPlant,
  voegBorderToe as domeinVoegBorderToe,
  hernoemBorder as domeinHernoemBorder,
  verwijderBorder as domeinVerwijderBorder,
  verplaatsNaarBorder as domeinVerplaatsNaarBorder,
  setPlantNotitie as domeinSetPlantNotitie,
} from "../domain/tuin/tuin";

const STANDAARD_TUIN: Tuin = {
  id: "tuin-hoofd",
  naam: "Mijn tuin",
  eigenaarId: "gebruiker-1",
  hardheid: 8,
  zones: [],
  aangemaaktOp: new Date(),
};

interface TuinStore {
  tuin: Tuin;
  actieveZoneId: string | null;
  actieveBorderId: string | null;
  plantCatalog: Record<string, AutoFillResultaat>;

  // Zone-acties
  voegZoneToe: (zone: ZoneInput) => void;
  verwijderZone: (zoneId: string) => void;
  setActieveZone: (zoneId: string | null) => void;
  hernoem: (naam: string) => void;
  setHardheid: (hardheid: number) => void;
  updateZone: (zone: ZoneInput) => void;

  // Plant-acties
  voegPlantToeAanZone: (zoneId: string, plant: AutoFillResultaat, borderId?: string | null) => void;
  verwijderPlantUitZone: (zoneId: string, plaatsingId: string) => void;
  verplaatsPlantNaarBorder: (zoneId: string, plaatsingId: string, borderId: string | null) => void;

  // Border-acties
  voegBorderToe: (zoneId: string, naam: string) => void;
  hernoemBorder: (zoneId: string, borderId: string, naam: string) => void;
  verwijderBorder: (zoneId: string, borderId: string) => void;
  setActieveBorder: (borderId: string | null) => void;

  // Notities
  setPlantNotitie: (zoneId: string, plaatsingId: string, notitie: string | null) => void;

  // Catalogus
  voegPlantToeAanCatalogus: (plant: AutoFillResultaat) => void;
  verwijderUitCatalogus: (wetNaam: string) => void;
  verwijderUitCatalogusEnZones: (wetNaam: string) => void;

  // Import
  laadTuin: (tuin: Tuin, plantCatalog: Record<string, AutoFillResultaat>) => void;
}

export const useTuinStore = create<TuinStore>()(
  persist(
    (set) => ({
      tuin: STANDAARD_TUIN,
      actieveZoneId: null,
      actieveBorderId: null,
      plantCatalog: {},

      voegZoneToe: (zone) =>
        set((staat) => ({
          tuin: voegZoneToe(staat.tuin, zone),
          actieveZoneId: staat.actieveZoneId ?? zone.id,
        })),

      verwijderZone: (zoneId) =>
        set((staat) => ({
          tuin: domeinVerwijderZone(staat.tuin, zoneId),
          actieveZoneId: staat.actieveZoneId === zoneId ? null : staat.actieveZoneId,
          actieveBorderId: null,
        })),

      setActieveZone: (zoneId) => set({ actieveZoneId: zoneId, actieveBorderId: null }),

      hernoem: (naam) =>
        set((staat) => ({ tuin: { ...staat.tuin, naam } })),

      setHardheid: (hardheid) =>
        set((staat) => ({ tuin: { ...staat.tuin, hardheid } })),

      updateZone: (zone) =>
        set((staat) => ({ tuin: domeinUpdateZone(staat.tuin, zone) })),

      voegPlantToeAanZone: (zoneId, plant, borderId = null) =>
        set((staat) => {
          const wetNaam = plant.identificatie.wetenschappelijkeNaam;
          const plaatsing: PlantPlaatsing = {
            id: crypto.randomUUID(),
            plantSoortId: wetNaam.toLowerCase().replace(/\s+/g, "-"),
            wetenschappelijkeNaam: wetNaam,
            geplaatst: new Date(),
            borderId: borderId ?? null,
            notitie: null,
          };
          return {
            tuin: plaatsPlant(staat.tuin, zoneId, plaatsing),
            plantCatalog: { ...staat.plantCatalog, [wetNaam.toLowerCase()]: plant },
          };
        }),

      verwijderPlantUitZone: (zoneId, plaatsingId) =>
        set((staat) => ({
          tuin: domeinVerwijderPlant(staat.tuin, zoneId, plaatsingId),
        })),

      verplaatsPlantNaarBorder: (zoneId, plaatsingId, borderId) =>
        set((staat) => ({
          tuin: domeinVerplaatsNaarBorder(staat.tuin, zoneId, plaatsingId, borderId),
        })),

      voegBorderToe: (zoneId, naam) =>
        set((staat) => {
          const border = { id: crypto.randomUUID(), naam };
          return {
            tuin: domeinVoegBorderToe(staat.tuin, zoneId, border),
            actieveBorderId: border.id,
          };
        }),

      hernoemBorder: (zoneId, borderId, naam) =>
        set((staat) => ({
          tuin: domeinHernoemBorder(staat.tuin, zoneId, borderId, naam),
        })),

      verwijderBorder: (zoneId, borderId) =>
        set((staat) => ({
          tuin: domeinVerwijderBorder(staat.tuin, zoneId, borderId),
          actieveBorderId: staat.actieveBorderId === borderId ? null : staat.actieveBorderId,
        })),

      setActieveBorder: (borderId) => set({ actieveBorderId: borderId }),

      setPlantNotitie: (zoneId, plaatsingId, notitie) =>
        set((staat) => ({
          tuin: domeinSetPlantNotitie(staat.tuin, zoneId, plaatsingId, notitie),
        })),

      voegPlantToeAanCatalogus: (plant) =>
        set((staat) => ({
          plantCatalog: {
            ...staat.plantCatalog,
            [plant.identificatie.wetenschappelijkeNaam.toLowerCase()]: plant,
          },
        })),

      verwijderUitCatalogus: (wetNaam) =>
        set((staat) => {
          const catalog = { ...staat.plantCatalog };
          delete catalog[wetNaam.toLowerCase()];
          return { plantCatalog: catalog };
        }),

      verwijderUitCatalogusEnZones: (wetNaam) =>
        set((staat) => {
          const catalog = { ...staat.plantCatalog };
          delete catalog[wetNaam.toLowerCase()];
          const sleutel = wetNaam.toLowerCase();
          const zones = staat.tuin.zones.map((z) => ({
            ...z,
            plantPlaatsingen: z.plantPlaatsingen.filter(
              (p) => p.wetenschappelijkeNaam.toLowerCase() !== sleutel,
            ),
          }));
          return { plantCatalog: catalog, tuin: { ...staat.tuin, zones } };
        }),

      laadTuin: (tuin, plantCatalog) =>
        set({
          tuin: {
            ...tuin,
            aangemaaktOp: new Date(tuin.aangemaaktOp),
            zones: tuin.zones.map((z) => ({
              ...z,
              borders: z.borders ?? [],
              gemeente: z.gemeente ?? null,
              regenval_mm_7d: z.regenval_mm_7d ?? null,
              plantPlaatsingen: z.plantPlaatsingen.map((p) => ({
                ...p,
                geplaatst: new Date(p.geplaatst),
                borderId: p.borderId ?? null,
                notitie: p.notitie ?? null,
              })),
            })),
          },
          plantCatalog: plantCatalog ?? {},
          actieveZoneId: null,
          actieveBorderId: null,
        }),
    }),
    {
      name: "groenplan-tuin",
      onRehydrateStorage: () => (staat) => {
        if (staat?.tuin) {
          staat.tuin.aangemaaktOp = new Date(staat.tuin.aangemaaktOp);
          staat.tuin.zones.forEach((z) => {
            // Backwards compat: zones opgeslagen voor de Border-feature
            z.borders = z.borders ?? [];
            z.gemeente = z.gemeente ?? null;
            z.regenval_mm_7d = z.regenval_mm_7d ?? null;
            z.plantPlaatsingen.forEach((p) => {
              p.geplaatst = new Date(p.geplaatst);
              p.borderId = p.borderId ?? null;
              p.notitie = p.notitie ?? null;
            });
          });
        }
      },
    },
  ),
);

// Selector helpers
export const selectActieveZone = (staat: TuinStore) =>
  staat.tuin.zones.find((z) => z.id === staat.actieveZoneId) ?? null;
