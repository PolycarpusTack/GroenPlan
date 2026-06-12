import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PhMeting {
  id: string;
  zoneId: string;
  ph: number;
  datum: string; // ISO-datum (YYYY-MM-DD)
  notitie: string | null;
}

interface BodemStore {
  metingen: PhMeting[];
  voegMetingToe: (invoer: Omit<PhMeting, "id">) => void;
  verwijderMeting: (id: string) => void;
}

// pH-metingen per zone, persistent via Zustand (consistent met de andere stores
// i.p.v. losse localStorage-toegang in de pagina — zo blijven migratie, rehydratie
// en toekomstige export/import op één plek).
export const useBodemStore = create<BodemStore>()(
  persist(
    (set) => ({
      metingen: [],

      voegMetingToe: (invoer) =>
        set((staat) => ({
          metingen: [...staat.metingen, { id: crypto.randomUUID(), ...invoer }].sort(
            (a, b) => b.datum.localeCompare(a.datum),
          ),
        })),

      verwijderMeting: (id) =>
        set((staat) => ({ metingen: staat.metingen.filter((m) => m.id !== id) })),
    }),
    { name: "groenplan-bodem" },
  ),
);

// Eenmalige migratie van de oude losse localStorage-sleutel naar de store, zodat
// bestaande pH-logs niet verloren gaan bij het overstappen op Zustand-persist.
(() => {
  if (typeof localStorage === "undefined") return;
  const OUD = "groenplan_bodem_metingen";
  try {
    const ruw = localStorage.getItem(OUD);
    if (!ruw) return;
    const metingen = JSON.parse(ruw) as PhMeting[];
    if (
      Array.isArray(metingen) &&
      metingen.length > 0 &&
      useBodemStore.getState().metingen.length === 0
    ) {
      useBodemStore.setState({
        metingen: [...metingen].sort((a, b) => b.datum.localeCompare(a.datum)),
      });
    }
    localStorage.removeItem(OUD);
  } catch {
    /* migratie is best-effort */
  }
})();
