import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Taak } from "../domain/taken/types";
import { berekenVolgendeDatum } from "../domain/taken/herhaling";

interface TakenStore {
  taken: Taak[];

  voegTaakToe: (taak: Omit<Taak, "id" | "status" | "aangemaakt">) => void;
  toggleStatus: (taakId: string) => void;
  updateTaak: (taakId: string, updates: Partial<Pick<Taak, "titel" | "zoneId" | "vervaldatum" | "herhaling">>) => void;
  verwijderTaak: (taakId: string) => void;
  laadTaken: (taken: Taak[]) => void;
}

export const useTakenStore = create<TakenStore>()(
  persist(
    (set) => ({
      taken: [],

      voegTaakToe: (invoer) =>
        set((staat) => ({
          taken: [
            ...staat.taken,
            {
              id: crypto.randomUUID(),
              status: "open",
              aangemaakt: new Date(),
              ...invoer,
            },
          ],
        })),

      toggleStatus: (taakId) =>
        set((staat) => {
          const taak = staat.taken.find((t) => t.id === taakId);
          if (!taak) return staat;

          // Recurring task completing: mark klaar + spawn next occurrence
          if (taak.status === "open" && taak.herhaling !== null && taak.vervaldatum !== null) {
            const volgendeDatum = berekenVolgendeDatum(taak.vervaldatum, taak.herhaling);
            const nieuweTaak: Taak = {
              id: crypto.randomUUID(),
              titel: taak.titel,
              zoneId: taak.zoneId,
              vervaldatum: volgendeDatum,
              status: "open",
              aangemaakt: new Date(),
              herhaling: taak.herhaling,
            };
            return {
              taken: staat.taken
                .map((t) => t.id === taakId ? { ...t, status: "klaar" as const } : t)
                .concat(nieuweTaak),
            };
          }

          return {
            taken: staat.taken.map((t) =>
              t.id === taakId
                ? { ...t, status: t.status === "open" ? "klaar" : "open" }
                : t,
            ),
          };
        }),

      updateTaak: (taakId, updates) =>
        set((staat) => ({
          taken: staat.taken.map((t) => t.id === taakId ? { ...t, ...updates } : t),
        })),

      verwijderTaak: (taakId) =>
        set((staat) => ({
          taken: staat.taken.filter((t) => t.id !== taakId),
        })),

      laadTaken: (taken) =>
        set({
          taken: taken.map((t) => ({ ...t, aangemaakt: new Date(t.aangemaakt) })),
        }),
    }),
    {
      name: "groenplan-taken",
      onRehydrateStorage: () => (staat) => {
        staat?.taken.forEach((t) => {
          t.aangemaakt = new Date(t.aangemaakt);
        });
      },
    },
  ),
);
