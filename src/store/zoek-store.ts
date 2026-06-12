import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 6;

interface ZoekGeschiedenisStore {
  geschiedenis: string[];
  voegToe: (naam: string) => void;
  wis: () => void;
}

// Recente zoektermen in Ontdek, persistent via Zustand (i.p.v. losse localStorage
// in de pagina). Dedupliceert hoofdletterongevoelig en houdt de recentste vooraan.
export const useZoekGeschiedenisStore = create<ZoekGeschiedenisStore>()(
  persist(
    (set) => ({
      geschiedenis: [],

      voegToe: (naam) =>
        set((staat) => {
          const schoon = naam.trim();
          if (!schoon) return staat;
          const gefilterd = staat.geschiedenis.filter(
            (n) => n.toLowerCase() !== schoon.toLowerCase(),
          );
          return { geschiedenis: [schoon, ...gefilterd].slice(0, MAX_ITEMS) };
        }),

      wis: () => set({ geschiedenis: [] }),
    }),
    { name: "groenplan-zoek" },
  ),
);

// Eenmalige migratie van de oude rauwe localStorage-array.
(() => {
  if (typeof localStorage === "undefined") return;
  const OUD = "groenplan-zoekgeschiedenis";
  try {
    const ruw = localStorage.getItem(OUD);
    if (!ruw) return;
    const lijst = JSON.parse(ruw) as string[];
    if (
      Array.isArray(lijst) &&
      lijst.length > 0 &&
      useZoekGeschiedenisStore.getState().geschiedenis.length === 0
    ) {
      useZoekGeschiedenisStore.setState({ geschiedenis: lijst.slice(0, MAX_ITEMS) });
    }
    localStorage.removeItem(OUD);
  } catch {
    /* migratie is best-effort */
  }
})();
