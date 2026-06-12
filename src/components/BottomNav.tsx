import { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, Map, CheckSquare, Shovel, Menu,
  Library, CalendarDays, BookOpen, Layers, Bean, HelpCircle, type LucideIcon,
} from "lucide-react";
import { useTakenStore } from "../store/taken-store";
import { MobileSheet } from "./MobileSheet";

const NAV_ITEMS = [
  { naar: "/", label: "Dashboard", Icoon: LayoutDashboard },
  { naar: "/ontdek", label: "Ontdek", Icoon: Search },
  { naar: "/tuinkaart", label: "Tuinkaart", Icoon: Map },
  { naar: "/taken", label: "Taken", Icoon: CheckSquare },
  { naar: "/veld", label: "Veld", Icoon: Shovel },
] as const;

// Routes die niet in de onderbalk passen → bereikbaar via "Meer".
const MEER_ITEMS: { naar: string; label: string; Icoon: LucideIcon }[] = [
  { naar: "/catalogus", label: "Catalogus", Icoon: Library },
  { naar: "/kalender", label: "Bloeikalender", Icoon: CalendarDays },
  { naar: "/dagboek", label: "Groeidagboek", Icoon: BookOpen },
  { naar: "/bodem", label: "Bodem", Icoon: Layers },
  { naar: "/zaadbank", label: "Zaadbank", Icoon: Bean },
  { naar: "/gids", label: "Gids", Icoon: HelpCircle },
];

const VANDAAG = new Date().toISOString().slice(0, 10);

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [meerOpen, setMeerOpen] = useState(false);
  const taken = useTakenStore((s) => s.taken);
  const achterstallig = useMemo(
    () =>
      taken.filter(
        (t) => t.status === "open" && t.vervaldatum !== null && t.vervaldatum < VANDAAG,
      ).length,
    [taken],
  );

  const meerActief = MEER_ITEMS.some((i) => i.naar === location.pathname);
  const gaNaar = (naar: string) => { setMeerOpen(false); navigate(naar); };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[var(--gp-border)] z-40 safe-area-inset-bottom"
      aria-label="Mobiele navigatie"
    >
      <ul className="flex h-full" role="list">
        {NAV_ITEMS.map(({ naar, label, Icoon }) => (
          <li key={naar} className="flex-1 min-w-0">
            <NavLink
              to={naar}
              end={naar === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-full w-full px-0.5 text-caption transition-colors ${
                  isActive ? "text-moss-700" : "text-[var(--gp-text-mute)] hover:text-moss-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icoon size={20} aria-hidden />
                    {naar === "/taken" && achterstallig > 0 && (
                      <span
                        className="absolute -top-1 -right-1.5 min-w-[1rem] h-4 flex items-center justify-center rounded-full bg-[var(--gp-rust-700)] text-white text-[9px] font-bold px-0.5 tabular-nums"
                        aria-label={`${achterstallig} achterstallige taken`}
                      >
                        {achterstallig > 99 ? "99+" : achterstallig}
                      </span>
                    )}
                  </span>
                  <span className={`text-caption truncate max-w-full ${isActive ? "font-medium" : ""}`}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}

        {/* Meer */}
        <li className="flex-1 min-w-0">
          <button
            onClick={() => setMeerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={meerOpen}
            className={`flex flex-col items-center justify-center gap-1 h-full w-full px-0.5 text-caption transition-colors ${
              meerActief ? "text-moss-700" : "text-[var(--gp-text-mute)] hover:text-moss-600"
            }`}
          >
            <Menu size={20} aria-hidden />
            <span className={`text-caption ${meerActief ? "font-medium" : ""}`}>Meer</span>
          </button>
        </li>
      </ul>

      <MobileSheet open={meerOpen} onSluit={() => setMeerOpen(false)}>
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Meer</p>
        <ul className="grid grid-cols-3 gap-2">
          {MEER_ITEMS.map(({ naar, label, Icoon }) => (
            <li key={naar}>
              <button
                onClick={() => gaNaar(naar)}
                className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[var(--gp-border)] bg-white hover:border-moss-400 active:scale-[0.98] transition-all text-center"
              >
                <Icoon size={22} className="text-moss-700" aria-hidden />
                <span className="text-caption text-moss-900 leading-tight">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </MobileSheet>
    </nav>
  );
}
