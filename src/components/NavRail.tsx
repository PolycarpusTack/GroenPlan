import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Leaf, LayoutDashboard, Search, Map, CheckSquare, CalendarDays, BookOpen, ChevronUp, Layers, Shovel, Bean, HelpCircle, Settings } from "lucide-react";
import { useTakenStore } from "../store/taken-store";
import { useTuinStore } from "../store/tuin-store";

const NAV_ITEMS = [
  { naar: "/", label: "Dashboard", Icoon: LayoutDashboard },
  { naar: "/ontdek", label: "Ontdek", Icoon: Search },
  { naar: "/tuinkaart", label: "Tuinkaart", Icoon: Map },
  { naar: "/taken", label: "Taken", Icoon: CheckSquare },
  { naar: "/kalender", label: "Bloeikalender", Icoon: CalendarDays },
  { naar: "/dagboek", label: "Groeidagboek", Icoon: BookOpen },
  { naar: "/bodem", label: "Bodem & Metingen", Icoon: Layers },
  { naar: "/zaadbank", label: "Zaadbank", Icoon: Bean },
  { naar: "/veld", label: "Veld-modus", Icoon: Shovel },
  { naar: "/gids", label: "Gids", Icoon: HelpCircle },
  { naar: "/instellingen", label: "Instellingen", Icoon: Settings },
] as const;

const VANDAAG = new Date().toISOString().slice(0, 10);

export function NavRail() {
  const taken = useTakenStore((s) => s.taken);
  const tuin = useTuinStore((s) => s.tuin);
  const achterstallig = useMemo(
    () =>
      taken.filter(
        (t) => t.status === "open" && t.vervaldatum !== null && t.vervaldatum < VANDAAG,
      ).length,
    [taken],
  );

  const initiaal = tuin.naam.charAt(0).toUpperCase();

  return (
    <nav
      className="hidden md:flex flex-col h-screen w-60 bg-moss-700 px-3 py-5 shrink-0"
      aria-label="Hoofdnavigatie"
    >
      {/* Logo + tagline */}
      <div className="px-1 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-moss-500 rounded-lg flex items-center justify-center shrink-0">
            <Leaf size={20} className="text-moss-100" aria-hidden />
          </div>
          <span className="font-display font-bold text-lg text-white leading-none">GroenPlan</span>
        </div>
        <p className="text-xs text-moss-200 leading-snug pl-1">
          Beheer je tuin als<br />een levend systeem
        </p>
      </div>

      {/* Nav items */}
      <ul className="flex flex-col gap-1 flex-1" role="list">
        {NAV_ITEMS.map(({ naar, label, Icoon }) => (
          <li key={naar}>
            <NavLink
              to={naar}
              end={naar === "/"}
              className={({ isActive }) =>
                `gp-nav-item ${isActive ? "gp-nav-item-active" : ""}`
              }
            >
              <Icoon size={18} aria-hidden />
              {label}
              {naar === "/taken" && achterstallig > 0 && (
                <span
                  className="ml-auto min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-[var(--gp-rust-700)] text-white text-[10px] font-bold px-1 tabular-nums"
                  aria-label={`${achterstallig} achterstallige taken`}
                >
                  {achterstallig > 99 ? "99+" : achterstallig}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* User / tuin profiel */}
      <div className="mt-4 flex items-center gap-3 p-3 bg-moss-800 rounded-lg">
        <div className="w-9 h-9 rounded-full bg-clay-400 flex items-center justify-center text-moss-900 font-semibold text-sm shrink-0">
          {initiaal}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white leading-tight truncate">{tuin.naam}</div>
          <div className="text-xs text-moss-200 leading-tight">Hardheidszone {tuin.hardheid}</div>
        </div>
        <ChevronUp size={16} className="text-moss-200 shrink-0" aria-hidden />
      </div>
    </nav>
  );
}
