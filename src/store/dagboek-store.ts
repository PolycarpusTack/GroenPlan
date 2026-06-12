import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Observatie, ObservatieType } from "../domain/dagboek/types";

interface DagboekStore {
  observaties: Observatie[];

  voegObservatieToe: (invoer: Omit<Observatie, "id" | "aangemaakt">) => void;
  updateObservatie: (id: string, updates: Partial<Pick<Observatie, "datum" | "type" | "tekst" | "zoneId" | "wetenschappelijkeNaam">>) => void;
  verwijderObservatie: (id: string) => void;
  laadObservaties: (observaties: Observatie[]) => void;
}

export const useDagboekStore = create<DagboekStore>()(
  persist(
    (set) => ({
      observaties: [],

      voegObservatieToe: (invoer) =>
        set((staat) => ({
          observaties: [
            {
              id: crypto.randomUUID(),
              aangemaakt: new Date(),
              ...invoer,
            },
            ...staat.observaties,
          ],
        })),

      updateObservatie: (id, updates) =>
        set((staat) => ({
          observaties: staat.observaties.map((o) => o.id === id ? { ...o, ...updates } : o),
        })),

      verwijderObservatie: (id) =>
        set((staat) => ({
          observaties: staat.observaties.filter((o) => o.id !== id),
        })),

      laadObservaties: (observaties) =>
        set({
          observaties: observaties.map((o) => ({ ...o, aangemaakt: new Date(o.aangemaakt) })),
        }),
    }),
    {
      name: "groenplan-dagboek",
      onRehydrateStorage: () => (staat) => {
        staat?.observaties.forEach((o) => {
          o.aangemaakt = new Date(o.aangemaakt);
        });
      },
    },
  ),
);

export const OBSERVATIE_TYPE_LABEL: Record<ObservatieType, string> = {
  bloei: "Bloei",
  groei: "Groei",
  plaag: "Plaag",
  ziekte: "Ziekte",
  snoei: "Snoei",
  bemesting: "Bemesting",
  overwintering: "Overwintering",
  overig: "Overig",
};

export const OBSERVATIE_TYPE_ICOON: Record<ObservatieType, string> = {
  bloei: "🌸",
  groei: "🌿",
  plaag: "🐛",
  ziekte: "🍂",
  snoei: "✂️",
  bemesting: "🌱",
  overwintering: "❄️",
  overig: "📝",
};
