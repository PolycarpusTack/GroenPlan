import { useMemo } from "react";
import type { AutoFillResultaat } from "../domain/plant/types";
import { berekenVoorstelLayout } from "../services/tuinontwerp/voorstelLayout";

// Ruimtelijke preview van een AI-beplantingsvoorstel: cirkels = volwassen
// breedte, hoog achteraan. De plaatsing is een deterministische auto-layout
// (zie voorstelLayout.ts) — geen AI-posities; de caption zegt dat expliciet.

const VB_W = 560;

function bloeiKleur(plant: AutoFillResultaat | undefined): string {
  const k = plant?.bloei.kleuren.waarde[0]?.toLowerCase() ?? "";
  if (["purple", "violet", "lavender", "mauve", "lila", "paars"].some((c) => k.includes(c))) return "#7c3aed";
  if (["yellow", "gold", "amber", "geel", "goud"].some((c) => k.includes(c))) return "#d97706";
  if (["orange", "oranje"].some((c) => k.includes(c))) return "#ea580c";
  if (["pink", "roze"].some((c) => k.includes(c))) return "#db2777";
  if (["red", "rood", "crimson"].some((c) => k.includes(c))) return "#dc2626";
  if (["blue", "blauw", "indigo"].some((c) => k.includes(c))) return "#2563eb";
  if (["white", "wit", "cream", "ivory"].some((c) => k.includes(c))) return "#9ca3af";
  return "#4a7c59";
}

interface Props {
  soorten: string[];
  catalog: Record<string, AutoFillResultaat>;
  zoneBreedteM: number | null;
  zoneDiepteM: number | null;
}

export function VoorstelCanvas({ soorten, catalog, zoneBreedteM, zoneDiepteM }: Props) {
  // Zonder echte afmetingen tekenen we op een nominaal vlak zonder maatclaim.
  const opSchaal = zoneBreedteM != null && zoneDiepteM != null && zoneBreedteM > 0 && zoneDiepteM > 0;
  const breedteM = opSchaal ? zoneBreedteM! : 8;
  const diepteM = opSchaal ? zoneDiepteM! : 4;

  const layout = useMemo(
    () => berekenVoorstelLayout(soorten, catalog, breedteM, diepteM),
    [soorten, catalog, breedteM, diepteM],
  );

  if (layout.length === 0) return null;

  const schaal = VB_W / breedteM;
  const vbH = diepteM * schaal;
  const onbekend = layout.filter((p) => !p.breedteBekend).length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VB_W} ${vbH}`}
        width="100%"
        role="img"
        aria-label="Indicatieve plaatsing van het voorstel"
        className="rounded-lg border border-[var(--gp-border)] bg-[#f6f8f2]"
        style={{ display: "block" }}
      >
        <rect
          x={3} y={3} width={VB_W - 6} height={vbH - 6} rx={10}
          fill="#f0faf0" fillOpacity={0.6} stroke="#4a8850" strokeWidth={1.5} strokeDasharray="6 4"
        />
        <text x={10} y={16} fontSize={10} fontFamily="Inter, sans-serif" fill="#5b6b5e">
          {opSchaal ? `${zoneBreedteM} × ${zoneDiepteM} m` : "schaal indicatief"} · achteraan hoog → vooraan laag
        </text>
        {layout.map((p) => {
          const plant = catalog[p.naam.toLowerCase()];
          const kleur = bloeiKleur(plant);
          const initialen = (plant?.identificatie.gewoneNamen.nl ?? p.naam).slice(0, 2);
          const cx = p.x * schaal;
          const cy = p.y * schaal;
          const r = Math.max(9, p.r * schaal);
          return (
            <g key={p.naam}>
              <title>
                {p.naam}
                {p.hoogteCm != null ? ` · tot ${p.hoogteCm} cm hoog` : ""}
                {!p.breedteBekend ? " · breedte onbekend (getoond als 40 cm)" : ""}
              </title>
              <circle
                cx={cx} cy={cy} r={r}
                fill={kleur} fillOpacity={0.78}
                stroke="#fff" strokeWidth={1.5}
                strokeDasharray={p.breedteBekend ? undefined : "3 3"}
              />
              <text
                x={cx} y={cy + 3} textAnchor="middle"
                fontSize={Math.min(11, r)} fontWeight={600} fontFamily="Inter, sans-serif" fill="#fff"
              >
                {initialen}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1.5 text-caption text-[var(--gp-text-mute)]">
        Indicatieve plaatsing — automatisch gerangschikt op hoogte, géén AI-posities. Cirkel = volwassen breedte
        {onbekend > 0 && ` (${onbekend} soort${onbekend !== 1 ? "en" : ""} onbekend, gestippeld als 40 cm)`}.
        {!opSchaal && " Stel zone-afmetingen in voor weergave op schaal."}
      </p>
    </div>
  );
}
