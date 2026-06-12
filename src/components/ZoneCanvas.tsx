import { useState, useMemo } from "react";
import type { PlantPlaatsing, Border } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";
import { berekenBegeleidersCheck, type BegeleidersResultaat } from "../domain/tuin/berekenBegeleidersCheck";

interface Positie { x: number; y: number }
interface DragState { id: string; startMuis: Positie; startPos: Positie }

interface Sectie {
  borderId: string | null;
  naam: string;
  x: number; y: number; w: number; h: number;
  svgVul: string; svgRand: string;
  chipKleur: string;
}

const SECTIE_KLEUREN = [
  { svgVul: "#f0faf0", svgRand: "#86c78a", chipKleur: "#4a8850" },
  { svgVul: "#faf0ff", svgRand: "#d8b4fe", chipKleur: "#7c3aed" },
  { svgVul: "#fffbeb", svgRand: "#fcd34d", chipKleur: "#d97706" },
  { svgVul: "#f0f9ff", svgRand: "#7dd3fc", chipKleur: "#0369a1" },
  { svgVul: "#fdf8f0", svgRand: "#d4a867", chipKleur: "#92650a" },
];
const GEEN_BORDER_KLEUR = { svgVul: "#f8f9fa", svgRand: "#ced4da", chipKleur: "#6c757d" };
const HEADER_H = 24;
const BUITEN = 6;
const TUSSENPAD = 6;
const CHIP_R = 40;

type Tab = "2d" | "3d" | "seizoenen" | "companions" | "analyse";

const TAB_LABELS: Record<Tab, string> = {
  "2d": "2D",
  "3d": "3D",
  seizoenen: "Seizoenen",
  companions: "Companions",
  analyse: "Analyse",
};

const MAAND_KORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

// ── Sectie berekening ──────────────────────────────────────────────────────

function berekenSecties(borders: Border[], heeftZonderBorder: boolean, w: number, h: number): Sectie[] {
  const items: { borderId: string | null; naam: string; kleur: typeof SECTIE_KLEUREN[0] }[] = [
    ...borders.map((b, i) => ({ borderId: b.id, naam: b.naam, kleur: SECTIE_KLEUREN[i % SECTIE_KLEUREN.length] })),
    ...(heeftZonderBorder ? [{ borderId: null, naam: "Zonder border", kleur: GEEN_BORDER_KLEUR }] : []),
  ];
  if (items.length === 0) return [];
  const COLS = Math.min(items.length, 3);
  const ROWS = Math.ceil(items.length / COLS);
  const sectieW = (w - 2 * BUITEN - (COLS - 1) * TUSSENPAD) / COLS;
  const sectieH = (h - 2 * BUITEN - (ROWS - 1) * TUSSENPAD) / ROWS;
  return items.map((item, i) => ({
    borderId: item.borderId, naam: item.naam,
    x: BUITEN + (i % COLS) * (sectieW + TUSSENPAD),
    y: BUITEN + Math.floor(i / COLS) * (sectieH + TUSSENPAD),
    w: sectieW, h: sectieH,
    svgVul: item.kleur.svgVul, svgRand: item.kleur.svgRand, chipKleur: item.kleur.chipKleur,
  }));
}

function initielePositiesInSectie(n: number, s: Sectie): Positie[] {
  if (n === 0) return [];
  const innerX = s.x + 10; const innerY = s.y + HEADER_H + 6;
  const innerW = s.w - 20; const innerH = s.h - HEADER_H - 12;
  const cx = innerX + innerW / 2; const cy = innerY + innerH / 2;
  if (n === 1) return [{ x: cx, y: cy }];
  const straal = Math.min(innerW, innerH) * 0.3;
  return Array.from({ length: n }, (_, i) => ({
    x: cx + straal * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + straal * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

function clampInSectie(x: number, y: number, s: Sectie): Positie {
  return {
    x: Math.max(s.x + CHIP_R, Math.min(s.x + s.w - CHIP_R, x)),
    y: Math.max(s.y + HEADER_H + CHIP_R / 2, Math.min(s.y + s.h - CHIP_R / 2, y)),
  };
}

// ── Kleur-helpers ──────────────────────────────────────────────────────────

function seizoenKleur(bloeit: boolean, maand: number): string {
  if (bloeit) {
    if (maand >= 3 && maand <= 5) return "#86efac";
    if (maand >= 6 && maand <= 8) return "#fde047";
    if (maand >= 9 && maand <= 11) return "#fb923c";
    return "#93c5fd";
  }
  // Niet in bloei: gebladerte in het groeiseizoen (mrt–okt), winterrust daarbuiten.
  if (maand >= 3 && maand <= 10) return "#7FA078";
  return "#d1d5db";
}

const FOLIAGE_KLEUR = "#7FA078";

function companionKleur(
  naam: string,
  geselecteerd: string | null,
  resultaten: BegeleidersResultaat[],
): string {
  if (geselecteerd === null) {
    // Geen selectie: kleur op basis van of de plant ooit conflicten heeft
    const heeftSlecht = resultaten.some(
      (r) => r.relatie === "slecht" && (r.plantA === naam || r.plantB === naam),
    );
    const heeftGoed = resultaten.some(
      (r) => r.relatie === "goed" && (r.plantA === naam || r.plantB === naam),
    );
    if (heeftSlecht) return "#dc2626";
    if (heeftGoed) return "#16a34a";
    return "#9ca3af";
  }
  if (naam === geselecteerd) return "#3b82f6"; // geselecteerde plant = blauw
  const relatie = resultaten.find(
    (r) => (r.plantA === geselecteerd && r.plantB === naam) ||
            (r.plantB === geselecteerd && r.plantA === naam),
  );
  if (!relatie) return "#9ca3af";
  return relatie.relatie === "goed" ? "#16a34a" : "#dc2626";
}

// ── Analyse helpers ────────────────────────────────────────────────────────

function berekenAnalyse(plaatsingen: PlantPlaatsing[], catalog: Record<string, AutoFillResultaat>) {
  const plants = plaatsingen.map((p) => catalog[p.wetenschappelijkeNaam.toLowerCase()]).filter(Boolean) as AutoFillResultaat[];
  const bloeiMaanden = new Set<number>();
  for (const p of plants) p.bloei.maanden.waarde.forEach((m) => bloeiMaanden.add(m));
  const families = new Set(plants.map((p) => p.identificatie.familie).filter(Boolean));
  const metBestuivers = plants.filter((p) => p.ecologie.bestuivers.waarde.length > 0).length;
  const biodiversiteit = plants.length > 0
    ? Math.round((families.size / Math.max(plants.length, 1)) * 50 + (metBestuivers / plants.length) * 50)
    : 0;
  const druk = plants.reduce((som, p) => som + 1 + (p.onderhoud.snoeien.waarde ? 1 : 0) + (p.onderhoud.bemesten.waarde ? 1 : 0), 0);
  const gemDruk = plants.length > 0 ? druk / plants.length : 0;
  return {
    bloeispreiding: Math.round((bloeiMaanden.size / 12) * 100),
    biodiversiteit,
    families: families.size,
    drukLabel: gemDruk < 1.5 ? "Laag" : gemDruk < 2.5 ? "Medium" : "Hoog",
  };
}

// ── 3D isometrische projectie ────────────────────────────────────────────────

const ISO_PALET = ["#4a8850", "#7c3aed", "#d97706", "#0369a1", "#92650a"];

function isoProject(
  u: number, v: number,
  originX: number, originY: number, tileW: number, tileH: number,
): Positie {
  return { x: originX + (u - v) * tileW, y: originY + (u + v) * tileH };
}

function DrieD({
  plaatsingen, catalog, posities, breedte, hoogte,
}: {
  plaatsingen: PlantPlaatsing[];
  catalog: Record<string, AutoFillResultaat>;
  posities: Record<string, Positie>;
  breedte: number;
  hoogte: number;
}) {
  const marge = 40;
  // Hoogte van de hoogste plant (px) en tile-afmetingen zo gekozen dat de
  // hele scène (vloer + opstaande planten) binnen het canvas past.
  const maxPlantPx = (hoogte - 2 * marge) * 0.3;
  const tileH = Math.min(
    (breedte - 2 * marge) / 4,
    (hoogte - 2 * marge - maxPlantPx) / 2,
  );
  const tileW = tileH * 2;
  const originX = breedte / 2;
  const originY = marge + maxPlantPx;

  const innerW = breedte - 2 * CHIP_R;
  const innerH = hoogte - 2 * CHIP_R;

  // Schaal volwassen hoogte (cm) → pixels. Onbekende hoogte → bescheiden default.
  const MAX_CM = 250;
  const items = plaatsingen.map((p, i) => {
    const pos = posities[p.id] ?? { x: breedte / 2, y: hoogte / 2 };
    const u = Math.max(0, Math.min(1, (pos.x - CHIP_R) / innerW));
    const v = Math.max(0, Math.min(1, (pos.y - CHIP_R) / innerH));
    const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
    // Velden zijn ranges {min,max}; toon de volwassen (max) maat.
    const hoogteCm = plant?.groei.volwassenHoogte_cm.waarde?.max ?? null;
    const breedteCm = plant?.groei.volwassenBreedte_cm.waarde?.max ?? null;
    const naam = plant?.identificatie.gewoneNamen.nl ?? p.wetenschappelijkeNaam.split(" ")[0];
    const clampCm = Math.max(10, Math.min(MAX_CM, hoogteCm ?? 40));
    const plantPx = Math.max(12, (clampCm / MAX_CM) * maxPlantPx);
    const kruinR = Math.max(7, Math.min(24, ((breedteCm ?? 50) / 200) * 24));
    return {
      id: p.id, u, v, naam, hoogteCm, plantPx, kruinR,
      base: isoProject(u, v, originX, originY, tileW, tileH),
      kleur: ISO_PALET[i % ISO_PALET.length],
      onbekend: hoogteCm === null,
    };
  });
  // Painter's algorithm: planten verder naar achteren (kleinere u+v) eerst tekenen.
  items.sort((a, b) => a.u + a.v - (b.u + b.v));

  const hoek = (u: number, v: number) => {
    const p = isoProject(u, v, originX, originY, tileW, tileH);
    return `${p.x},${p.y}`;
  };
  const N = 4; // rastercellen per as

  return (
    <div
      className="relative border border-[var(--gp-border)] rounded-b-lg bg-[var(--gp-surface-alt)] overflow-hidden"
      style={{ height: hoogte }}
    >
      <svg width={breedte} height={hoogte} className="absolute inset-0" aria-label="Isometrische 3D-weergave met hoogteprofiel">
        {/* Vloervlak */}
        <polygon
          points={`${hoek(0, 0)} ${hoek(1, 0)} ${hoek(1, 1)} ${hoek(0, 1)}`}
          fill="#eef6ee" stroke="#86c78a" strokeWidth={1.5}
        />
        {/* Rasterlijnen op de vloer */}
        {Array.from({ length: N - 1 }, (_, k) => {
          const t = (k + 1) / N;
          return (
            <g key={t} stroke="#cfe8d0" strokeWidth={0.75}>
              <line x1={isoProject(t, 0, originX, originY, tileW, tileH).x} y1={isoProject(t, 0, originX, originY, tileW, tileH).y}
                    x2={isoProject(t, 1, originX, originY, tileW, tileH).x} y2={isoProject(t, 1, originX, originY, tileW, tileH).y} />
              <line x1={isoProject(0, t, originX, originY, tileW, tileH).x} y1={isoProject(0, t, originX, originY, tileW, tileH).y}
                    x2={isoProject(1, t, originX, originY, tileW, tileH).x} y2={isoProject(1, t, originX, originY, tileW, tileH).y} />
            </g>
          );
        })}
        {/* Planten — schaduw, stam, kruin, label */}
        {items.map((it) => {
          const topY = it.base.y - it.plantPx;
          return (
            <g key={it.id}>
              <ellipse cx={it.base.x} cy={it.base.y} rx={it.kruinR} ry={it.kruinR / 2} fill="rgba(0,0,0,0.10)" />
              <line x1={it.base.x} y1={it.base.y} x2={it.base.x} y2={topY}
                    stroke={it.kleur} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
              <ellipse cx={it.base.x} cy={topY} rx={it.kruinR} ry={it.kruinR * 0.85}
                       fill={it.kleur} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
              <text x={it.base.x} y={topY - it.kruinR - 3} textAnchor="middle"
                    fontSize={9} fontWeight={500} fontFamily="Inter, sans-serif" fill="#374151">
                {it.naam}{it.hoogteCm != null ? ` · ${it.hoogteCm}cm` : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="absolute bottom-2 left-3 text-caption text-[var(--gp-text-mute)] bg-white/80 rounded px-1.5 py-0.5 pointer-events-none">
        Hoogteprofiel — geschat op volwassen hoogte
        {items.some((i) => i.onbekend) && " · onbekende hoogte als 40 cm getoond"}
      </p>
    </div>
  );
}

// ── Props & export ─────────────────────────────────────────────────────────

interface Props {
  plaatsingen: PlantPlaatsing[];
  catalog: Record<string, AutoFillResultaat>;
  borders?: Border[];
  breedte?: number;
  hoogte?: number;
  onPlantClick?: (wetNaam: string) => void;
}

export function ZoneCanvas({
  plaatsingen, catalog, borders = [], breedte = 560, hoogte = 320, onPlantClick,
}: Props) {
  const [actieveTab, setActieveTab] = useState<Tab>("2d");
  const [seizoenMaand, setSeizoenMaand] = useState(new Date().getMonth() + 1);
  const [companionSelectie, setCompanionSelectie] = useState<string | null>(null);
  const [geselecteerdeId, setGeselecteerdeId] = useState<string | null>(null);

  const heeftBorders = borders.length > 0;
  const heeftZonderBorder = heeftBorders && plaatsingen.some((p) => !p.borderId);
  const secties = heeftBorders ? berekenSecties(borders, heeftZonderBorder, breedte, hoogte) : [];

  const [posities, setPosities] = useState<Record<string, Positie>>(() => {
    if (!heeftBorders) {
      const straal = Math.min(breedte, hoogte) * 0.32;
      const cx = breedte / 2; const cy = hoogte / 2;
      return Object.fromEntries(plaatsingen.map((p, i) => {
        if (plaatsingen.length === 1) return [p.id, { x: cx, y: cy }];
        const hoek = (2 * Math.PI * i) / plaatsingen.length - Math.PI / 2;
        return [p.id, { x: cx + straal * Math.cos(hoek), y: cy + straal * Math.sin(hoek) }];
      }));
    } else {
      const result: Record<string, Positie> = {};
      for (const s of secties) {
        const inS = plaatsingen.filter((p) => p.borderId === s.borderId);
        initielePositiesInSectie(inS.length, s).forEach((pos, i) => { result[inS[i].id] = pos; });
      }
      return result;
    }
  });

  const [sleep, setSleep] = useState<DragState | null>(null);
  const getSectie = (p: PlantPlaatsing) => secties.find((s) => s.borderId === p.borderId) ?? null;

  const startSleep = (id: string, mx: number, my: number) => {
    const pos = posities[id] ?? { x: breedte / 2, y: hoogte / 2 };
    setSleep({ id, startMuis: { x: mx, y: my }, startPos: pos });
  };
  const bewegSleep = (mx: number, my: number) => {
    if (!sleep) return;
    let nx = sleep.startPos.x + (mx - sleep.startMuis.x);
    let ny = sleep.startPos.y + (my - sleep.startMuis.y);
    if (heeftBorders) {
      const p = plaatsingen.find((p) => p.id === sleep.id);
      const s = p ? getSectie(p) : null;
      if (s) { const c = clampInSectie(nx, ny, s); nx = c.x; ny = c.y; }
    } else {
      nx = Math.max(CHIP_R, Math.min(breedte - CHIP_R, nx));
      ny = Math.max(CHIP_R, Math.min(hoogte - CHIP_R, ny));
    }
    setPosities((prev) => ({ ...prev, [sleep.id]: { x: nx, y: ny } }));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => { e.preventDefault(); startSleep(id, e.clientX, e.clientY); };
  const handleMouseMove = (e: React.MouseEvent) => bewegSleep(e.clientX, e.clientY);
  const handleMouseUp = () => setSleep(null);
  const handleTouchStart = (e: React.TouchEvent, id: string) => { e.preventDefault(); const t = e.touches[0]; startSleep(id, t.clientX, t.clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { e.preventDefault(); const t = e.touches[0]; bewegSleep(t.clientX, t.clientY); };

  const companionResultaten = useMemo(
    () => berekenBegeleidersCheck(plaatsingen, catalog),
    [plaatsingen, catalog],
  );
  const analyse = useMemo(() => berekenAnalyse(plaatsingen, catalog), [plaatsingen, catalog]);

  const chipKleurVoor = (p: PlantPlaatsing, i: number): string => {
    if (actieveTab === "seizoenen") {
      const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
      return seizoenKleur(plant?.bloei.maanden.waarde.includes(seizoenMaand) ?? false, seizoenMaand);
    }
    if (actieveTab === "companions") return companionKleur(p.wetenschappelijkeNaam, companionSelectie, companionResultaten);
    if (!heeftBorders) return ["#4a8850","#7c3aed","#d97706","#0369a1","#92650a"][i % 5];
    return getSectie(p)?.chipKleur ?? GEEN_BORDER_KLEUR.chipKleur;
  };

  if (plaatsingen.length === 0) return null;

  const isDraggable = actieveTab === "2d";

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* Tab bar */}
      <div className="flex gap-0 border border-[var(--gp-border)] border-b-0 rounded-t-lg overflow-hidden">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActieveTab(tab); setCompanionSelectie(null); setGeselecteerdeId(null); }}
            className={`flex-1 text-caption py-2 font-medium transition-colors
              ${actieveTab === tab
                ? "bg-white text-moss-700 border-b-2 border-moss-600"
                : "bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)] hover:text-moss-600"}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Seizoenen slider */}
      {actieveTab === "seizoenen" && (
        <div className="flex items-center gap-3 px-3 py-2 border border-[var(--gp-border)] border-b-0 bg-white">
          <span className="text-caption text-[var(--gp-text-mute)] shrink-0">Maand:</span>
          <input type="range" min={1} max={12} value={seizoenMaand}
            onChange={(e) => setSeizoenMaand(parseInt(e.target.value))}
            className="flex-1 accent-moss-700" />
          <span className="text-body-sm font-medium text-moss-700 w-8 text-right shrink-0">
            {MAAND_KORT[seizoenMaand - 1]}
          </span>
        </div>
      )}

      {/* Companions legenda */}
      {actieveTab === "companions" && (
        <div className="flex items-center gap-4 px-3 py-2 border border-[var(--gp-border)] border-b-0 bg-white text-caption">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" aria-hidden /> Geselecteerd
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" aria-hidden /> Goede buur
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" aria-hidden /> Slechte buur
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9ca3af]" aria-hidden /> Neutraal
          </span>
          {companionSelectie === null && (
            <span className="text-[var(--gp-text-mute)] italic ml-auto">Klik een plant</span>
          )}
          {companionSelectie !== null && (
            <button onClick={() => setCompanionSelectie(null)}
              className="ml-auto text-moss-600 hover:underline">
              Deselecteer ×
            </button>
          )}
        </div>
      )}

      {/* Companion-detail: benoemde goede/te-vermijden buren voor de geselecteerde plant */}
      {actieveTab === "companions" && companionSelectie && (() => {
        const buren = (relatie: "goed" | "slecht") =>
          companionResultaten
            .filter((r) => r.relatie === relatie && (r.plantA === companionSelectie || r.plantB === companionSelectie))
            .map((r) => (r.plantA === companionSelectie ? r.plantB : r.plantA));
        const naamVan = (wn: string) => catalog[wn.toLowerCase()]?.identificatie.gewoneNamen.nl ?? wn;
        const goede = buren("goed");
        const slechte = buren("slecht");
        return (
          <div className="border border-[var(--gp-border)] border-b-0 bg-white px-3 py-2 text-caption">
            <p className="font-medium text-moss-900 mb-1">{naamVan(companionSelectie)}</p>
            {goede.length === 0 && slechte.length === 0 ? (
              <p className="text-[var(--gp-text-mute)]">Geen bekende begeleidersrelaties met de andere planten in deze zone.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {goede.length > 0 && (
                  <p><span className="text-[#16a34a] font-medium">Goede buren:</span> {goede.map(naamVan).join(", ")}</p>
                )}
                {slechte.length > 0 && (
                  <p><span className="text-[#dc2626] font-medium">Vermijd naast:</span> {slechte.map(naamVan).join(", ")}</p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* 3D isometrische weergave */}
      {actieveTab === "3d" && (
        <DrieD plaatsingen={plaatsingen} catalog={catalog} posities={posities} breedte={breedte} hoogte={hoogte} />
      )}

      {/* Analyse tab */}
      {actieveTab === "analyse" && (
        <div className="border border-[var(--gp-border)] rounded-b-lg bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-moss-50 border border-moss-200 text-center">
              <p className="font-display text-display-md text-moss-700">{analyse.bloeispreiding}%</p>
              <p className="text-caption text-moss-600 font-medium">Bloeispreiding</p>
              <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">maanden met bloei / 12</p>
            </div>
            <div className="p-3 rounded-lg bg-bloom-50 border border-bloom-200 text-center">
              <p className="font-display text-display-md text-bloom-700">{analyse.biodiversiteit}</p>
              <p className="text-caption text-bloom-700 font-medium">Biodiversiteit</p>
              <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">{analyse.families} familie{analyse.families !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <p className="font-display text-display-md text-amber-700">{plaatsingen.length}</p>
              <p className="text-caption text-amber-700 font-medium">Planten</p>
              <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">in deze zone</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--gp-surface-alt)] border border-[var(--gp-border)] text-center">
              <p className="font-display text-display-md text-moss-700">{analyse.drukLabel}</p>
              <p className="text-caption text-[var(--gp-text-mute)] font-medium">Onderhoudsdruk</p>
              <p className="text-caption text-[var(--gp-text-mute)] mt-0.5">snoei + bemesting</p>
            </div>
          </div>
          {companionResultaten.filter((r) => r.relatie === "slecht").length > 0 && (
            <div className="mt-3 p-2.5 rounded-md bg-rust-50 border border-rust-200">
              <p className="text-caption text-rust-700 font-medium">
                {companionResultaten.filter((r) => r.relatie === "slecht").length} begeleidersconflict{companionResultaten.filter((r) => r.relatie === "slecht").length !== 1 ? "en" : ""} — bekijk de Companions-tab voor details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Canvas: 2D + Seizoenen + Companions */}
      {(actieveTab === "2d" || actieveTab === "seizoenen" || actieveTab === "companions") && (
        <div
          className="relative border border-[var(--gp-border)] rounded-b-lg bg-[var(--gp-surface-alt)] overflow-hidden select-none"
          style={{ width: breedte, maxWidth: "100%", height: hoogte }}
          onMouseMove={isDraggable ? handleMouseMove : undefined}
          onMouseUp={isDraggable ? handleMouseUp : undefined}
          onMouseLeave={isDraggable ? handleMouseUp : undefined}
          onTouchMove={isDraggable ? handleTouchMove : undefined}
          onTouchEnd={isDraggable ? () => setSleep(null) : undefined}
          onTouchCancel={isDraggable ? () => setSleep(null) : undefined}
        >
          <svg width={breedte} height={hoogte} className="absolute inset-0 pointer-events-none" aria-hidden>
            <defs>
              <pattern id="gp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--gp-border)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gp-grid)" />
            {secties.map((s) => (
              <g key={s.borderId ?? "_none"}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={6} fill={s.svgVul} stroke={s.svgRand} strokeWidth={1.5} />
                <text x={s.x + 8} y={s.y + 16} fontSize={11} fontFamily="Inter, sans-serif" fontWeight={500} fill="#555"
                  clipPath={`url(#clip-${(s.borderId ?? "none").replace(/[^a-z0-9]/gi, "")})`}>
                  {s.naam}
                </text>
                <clipPath id={`clip-${(s.borderId ?? "none").replace(/[^a-z0-9]/gi, "")}`}>
                  <rect x={s.x} y={s.y} width={s.w - 4} height={HEADER_H} />
                </clipPath>
              </g>
            ))}
          </svg>

          {plaatsingen.map((p, i) => {
            const pos = posities[p.id] ?? { x: breedte / 2, y: hoogte / 2 };
            const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
            const naam = plant?.identificatie.gewoneNamen.nl ?? p.wetenschappelijkeNaam.split(" ")[0];
            const isDragging = sleep?.id === p.id;
            const kleur = chipKleurVoor(p, i);
            const inBloei = plant?.bloei.maanden.waarde.includes(seizoenMaand) ?? false;
            const dormant = actieveTab === "seizoenen" && !inBloei && (seizoenMaand <= 2 || seizoenMaand >= 11);
            const isGeselecteerd = geselecteerdeId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  position: "absolute", left: pos.x, top: pos.y,
                  transform: "translate(-50%, -50%)",
                  zIndex: isDragging ? 10 : 2,
                  cursor: actieveTab === "companions" ? "pointer" : isDraggable ? (isDragging ? "grabbing" : "grab") : "pointer",
                  opacity: dormant ? 0.4 : 1,
                }}
                onMouseDown={isDraggable ? (e) => handleMouseDown(e, p.id) : undefined}
                onTouchStart={isDraggable ? (e) => handleTouchStart(e, p.id) : undefined}
                onClick={() => {
                  if (actieveTab === "companions") {
                    setCompanionSelectie((prev) => prev === p.wetenschappelijkeNaam ? null : p.wetenschappelijkeNaam);
                  } else if (!isDragging) {
                    setGeselecteerdeId((prev) => prev === p.id ? null : p.id);
                  }
                }}
              >
                <div
                  style={{ backgroundColor: kleur, minWidth: 56, maxWidth: 80 }}
                  className={`flex items-center justify-center px-2 py-1 rounded-full shadow-sm border-2 border-white text-white
                    ${isGeselecteerd ? "ring-2 ring-moss-900 ring-offset-1" : ""}
                    ${isDragging ? "shadow-lg scale-105" : isDraggable ? "hover:scale-105" : "hover:brightness-110"} transition-transform`}
                >
                  <span className="text-center leading-tight line-clamp-2" style={{ fontSize: 9, fontWeight: 500 }}>
                    {naam}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Seizoens-legende — bloei · blad · winterrust */}
          {actieveTab === "seizoenen" && (
            <div className="absolute bottom-2 left-3 flex flex-wrap gap-2 pointer-events-none">
              <span className="flex items-center gap-1 text-caption bg-white/80 rounded px-1.5 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: seizoenKleur(true, seizoenMaand) }} />
                Bloeit
              </span>
              <span className="flex items-center gap-1 text-caption bg-white/80 rounded px-1.5 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: FOLIAGE_KLEUR }} />
                Blad
              </span>
              <span className="flex items-center gap-1 text-caption bg-white/80 rounded px-1.5 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-300" />
                Winterrust
              </span>
            </div>
          )}

          {isDraggable && (
            <p className="absolute bottom-2 right-3 text-caption text-[var(--gp-text-mute)] pointer-events-none" aria-hidden>
              Sleep om te herpositioneren
            </p>
          )}
        </div>
      )}

      {/* Geselecteerde-plant detailkaart (klik op een plant in 2D / seizoenen) */}
      {geselecteerdeId && (() => {
        const p = plaatsingen.find((pp) => pp.id === geselecteerdeId);
        if (!p) return null;
        const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
        const gewone = plant?.identificatie.gewoneNamen.nl;
        const bloei = plant?.bloei.maanden.waarde ?? [];
        const breedteCm = plant?.groei.volwassenBreedte_cm.waarde?.max;
        const hoogteCm = plant?.groei.volwassenHoogte_cm.waarde?.max;
        return (
          <div className="mt-2 p-3 rounded-lg border border-[var(--gp-border)] bg-white flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="gp-scientific text-body-sm font-medium text-moss-900 truncate">{p.wetenschappelijkeNaam}</p>
              {gewone && <p className="text-caption text-[var(--gp-text-mute)]">{gewone}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-caption text-[var(--gp-text-mute)]">
                {bloei.length > 0 && <span>Bloei: {bloei.map((m) => MAAND_KORT[m - 1]).join(", ")}</span>}
                {breedteCm != null && <span>Breedte tot {breedteCm} cm</span>}
                {hoogteCm != null && <span>Hoogte tot {hoogteCm} cm</span>}
              </div>
            </div>
            {onPlantClick && (
              <button
                onClick={() => onPlantClick(p.wetenschappelijkeNaam)}
                className="shrink-0 text-caption text-moss-600 hover:underline whitespace-nowrap"
              >
                Open plantdetail →
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
