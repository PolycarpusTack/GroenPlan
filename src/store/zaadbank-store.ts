import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Zaad } from "../domain/zaadbank/types";

interface ZaadbankStore {
  zaden: Zaad[];

  voegZaadToe: (invoer: Omit<Zaad, "id" | "aangemaakt" | "status"> & { status?: Zaad["status"] }) => void;
  updateZaad: (id: string, updates: Partial<Omit<Zaad, "id" | "aangemaakt">>) => void;
  verwijderZaad: (id: string) => void;
  markeerGezaaid: (id: string) => void;
  laadZaden: (zaden: Zaad[]) => void;
}

export const useZaadbankStore = create<ZaadbankStore>()(
  persist(
    (set) => ({
      zaden: [],

      voegZaadToe: (invoer) =>
        set((staat) => ({
          zaden: [
            {
              id: crypto.randomUUID(),
              aangemaakt: new Date(),
              status: invoer.status ?? "voorraad",
              ...invoer,
            },
            ...staat.zaden,
          ],
        })),

      updateZaad: (id, updates) =>
        set((staat) => ({
          zaden: staat.zaden.map((z) => (z.id === id ? { ...z, ...updates } : z)),
        })),

      verwijderZaad: (id) =>
        set((staat) => ({
          zaden: staat.zaden.filter((z) => z.id !== id),
        })),

      markeerGezaaid: (id) =>
        set((staat) => ({
          zaden: staat.zaden.map((z) => (z.id === id ? { ...z, status: "gezaaid" } : z)),
        })),

      laadZaden: (zaden) =>
        set({
          zaden: zaden.map((z) => ({ ...z, aangemaakt: new Date(z.aangemaakt) })),
        }),
    }),
    {
      name: "groenplan-zaadbank",
      onRehydrateStorage: () => (staat) => {
        staat?.zaden.forEach((z) => {
          z.aangemaakt = new Date(z.aangemaakt);
        });
      },
    },
  ),
);
