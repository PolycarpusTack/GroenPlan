import { useMemo } from "react";
import type { Zone } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";
import { berekenBegeleidersCheck } from "../domain/tuin/berekenBegeleidersCheck";

export type OverlayTab = "kaart" | "zon" | "irrigatie" | "bodem";

// Interactieve topdown-plattegrond. Zones zonder echte afmetingen worden
// deterministisch ingedeeld (tegelgrootte ~ aantal planten); zones mét
// breedte_m/diepte_m wegen mee met hun werkelijke oppervlakte. Geen verzonnen
// schaalmaat: de caption claimt alleen wat de data echt draagt.

const VB_W = 800;
const VB_H = 440;
const FOOT = 44;
const GAP = 10;

export function zoneOppervlakte(zone: Zone): number | null {
  return zone.breedte_m != null && zone.diepte_m != null
    ? zone.breedte_m * zone.diepte_m
    : null;
}

interface Tegel { zone: Zone; x: number; y: number; w: number; h: number; index: number }

function legIn(zones: Zone[]): Tegel[] {
  const n = zones.length;
  if (n === 0) return [];
  // Gewicht = echte oppervlakte waar bekend; onbekende zones krijgen de
  // mediaan van de bekende oppervlaktes (of plantenaantal als niets bekend is).
  const bekend = zones.map(zoneOppervlakte).filter((o): o is number => o !== null).sort((a, b) => a - b);
  const mediaan = bekend.length > 0 ? bekend[Math.floor(bekend.length / 2)] : null;
  const gewichtVan = (z: Zone): number =>
    zoneOppervlakte(z) ?? mediaan ?? z.plantPlaatsingen.length + 1;
  const rijen = Math.max(1, Math.round(Math.sqrt(n)));
  const perRij = Math.ceil(n / rijen);
  const rijH = (VB_H - GAP * (rijen - 1)) / rijen;
  const tegels: Tegel[] = [];
  let index = 0;
  for (let r = 0; r < rijen; r++) {
    const rijZones = zones.slice(r * perRij, (r + 1) * perRij);
    if (rijZones.length === 0) continue;
    const gewichten = rijZones.map(gewichtVan);
    const totaal = gewichten.reduce((a, b) => a + b, 0);
    const beschikbaar = VB_W - GAP * (rijZones.length - 1);
    const y = r * (rijH + GAP);
    let x = 0;
    rijZones.forEach((z, i) => {
      const w = beschikbaar * (gewichten[i] / totaal);
      tegels.push({ zone: z, x, y, w, h: rijH, index: index++ });
      x += w + GAP;
    });
  }
  return tegels;
}

const KAART_PALET = ["#DCEAD8", "#E5DCEF", "#FAE9C5", "#CDE3EC", "#F2DDD6", "#D9E7D5"];
const KAART_RAND = ["#8FB98A", "#B89BD6", "#E6C36A", "#8FB8CC", "#D89B8A", "#8FB98A"];

function tegelKleur(zone: Zone, overlay: OverlayTab, i: number): { fill: string; rand: string } {
  if (overlay === "zon") {
    if (zone.zon === "full") return { fill: "#F8D98A", rand: "#D89216" };
    if (zone.zon === "partial") return { fill: "#FCE9BE", rand: "#E6B450" };
    return { fill: "#CBD5E1", rand: "#94A3B8" };
  }
  if (overlay === "irrigatie") {
    if (zone.drainage === "well-drained") return { fill: "#BCD4B3", rand: "#7FA078" };
    if (zone.drainage === "moist") return { fill: "#A8C8D8", rand: "#4F8EA8" };
    return { fill: "#93C5FD", rand: "#3B82F6" };
  }
  if (overlay === "bodem") {
    const m: Record<string, string> = { clay: "#D9C3A0", sand: "#ECE0BF", loam: "#CDB089", chalk: "#E6E2D4", peat: "#BCAE9C" };
    return { fill: m[zone.grondsoort] ?? "#E5E1D8", rand: "#C19A6B" };
  }
  return { fill: KAART_PALET[i % KAART_PALET.length], rand: KAART_RAND[i % KAART_RAND.length] };
}

const GROND_LABEL: Record<string, string> = { clay: "Klei", sand: "Zand", loam: "Leem", chalk: "Kalk", peat: "Veen" };
const ZON_LABEL: Record<string, string> = { full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw" };
const DRAIN_LABEL: Record<string, string> = { "well-drained": "Goed doorlatend", moist: "Vochtig", wet: "Nat" };

function overlayWaarde(zone: Zone, overlay: OverlayTab): string | null {
  if (overlay === "zon") return ZON_LABEL[zone.zon] ?? zone.zon;
  if (overlay === "irrigatie") return DRAIN_LABEL[zone.drainage] ?? zone.drainage;
  if (overlay === "bodem") return zone.pH != null ? `${GROND_LABEL[zone.grondsoort] ?? zone.grondsoort} · pH ${zone.pH}` : (GROND_LABEL[zone.grondsoort] ?? zone.grondsoort);
  return null;
}

function kort(tekst: string, breedte: number): string {
  const max = Math.max(4, Math.floor(breedte / 8));
  return tekst.length > max ? tekst.slice(0, max - 1) + "…" : tekst;
}

interface Props {
  zones: Zone[];
  overlay: OverlayTab;
  actieveZoneId: string | null;
  catalog: Record<string, AutoFillResultaat>;
  onZoneClick: (id: string) => void;
  /** Aandachtspunten per zone-id (bv. droogte, achterstallige taken) — amber dot + tooltip. */
  aandacht?: Record<string, string[]>;
}

export function TuinkaartSVG({ zones, overlay, actieveZoneId, catalog, onZoneClick, aandacht }: Props) {
  const tegels = useMemo(() => legIn(zones), [zones]);
  const aantalMetMaat = zones.filter((z) => zoneOppervlakte(z) !== null).length;
  const caption =
    aantalMetMaat === zones.length && zones.length > 0
      ? "Tegelgrootte ~ werkelijke oppervlakte · klik een zone"
      : aantalMetMaat > 0
      ? "Tegelgrootte ~ oppervlakte (waar bekend) · klik een zone"
      : "Automatische indeling · tegelgrootte ~ aantal planten · klik een zone";

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H + FOOT}`}
      width="100%"
      role="img"
      aria-label="Tuinplattegrond"
      className="rounded-xl border border-[var(--gp-border)] bg-[#f6f8f2]"
      style={{ height: "auto", display: "block" }}
    >
      {/* Decoratief: huis-glyph linksonder als oriëntatiepunt */}
      <g aria-hidden transform={`translate(10 ${VB_H + 8})`} opacity={0.7}>
        <polygon points="0,12 9,3 18,12" fill="#C19A6B" />
        <rect x="2" y="12" width="14" height="14" rx="1.5" fill="#D9C3A0" stroke="#C19A6B" />
        <text x="24" y="24" fontSize={11} fontFamily="Inter, sans-serif" fill="#808080">
          {caption}
        </text>
      </g>

      {tegels.map((t) => {
        const { fill, rand } = tegelKleur(t.zone, overlay, t.index);
        const actief = t.zone.id === actieveZoneId;
        const conflict = berekenBegeleidersCheck(t.zone.plantPlaatsingen, catalog).some((r) => r.relatie === "slecht");
        const alerts = [
          ...(conflict ? ["Begeleidersconflict"] : []),
          ...(aandacht?.[t.zone.id] ?? []),
        ];
        const aantal = t.zone.plantPlaatsingen.length;
        const opp = zoneOppervlakte(t.zone);
        const subtitel = opp !== null
          ? `${Math.round(opp * 10) / 10} m² · ${aantal} plant${aantal !== 1 ? "en" : ""}`
          : `${aantal} plant${aantal !== 1 ? "en" : ""}`;
        const ruim = t.w > 90 && t.h > 56;
        const waarde = overlayWaarde(t.zone, overlay);
        return (
          <g
            key={t.zone.id}
            role="button"
            tabIndex={0}
            aria-label={`Zone ${t.zone.naam}${alerts.length > 0 ? ` — ${alerts.join(", ")}` : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onZoneClick(t.zone.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZoneClick(t.zone.id); } }}
          >
            <title>{alerts.length > 0 ? `${t.zone.naam} — ${alerts.join(" · ")}` : t.zone.naam}</title>
            <rect
              x={t.x} y={t.y} width={t.w} height={t.h} rx={12}
              fill={fill}
              stroke={actief ? "#1F3026" : rand}
              strokeWidth={actief ? 3 : 1.5}
            />
            <text x={t.x + 12} y={t.y + 24} fontSize={13} fontWeight={600} fontFamily="Fraunces, serif" fill="#1F3026">
              {kort(t.zone.naam, t.w - 24)}
            </text>
            <text x={t.x + 12} y={t.y + 40} fontSize={10} fontFamily="Inter, sans-serif" fill="#5b6b5e">
              {kort(subtitel, t.w - 24)}
            </text>
            {ruim && waarde && (
              <text x={t.x + 12} y={t.y + 56} fontSize={10} fontFamily="Inter, sans-serif" fill="#5b6b5e">
                {kort(waarde, t.w - 24)}
              </text>
            )}
            {alerts.length > 0 && (
              <g aria-hidden>
                {/* Rust = conflict in de beplanting zelf; amber = omgevings-aandacht */}
                <circle cx={t.x + t.w - 14} cy={t.y + 14} r={6} fill={conflict ? "#9C3D2E" : "#D97706"} />
                <text x={t.x + t.w - 14} y={t.y + 17.5} fontSize={9} fontWeight={700} textAnchor="middle" fill="#fff">!</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
