import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { BORDERRECEPTEN } from "../data/borderrecepten";
import { schatKosten } from "../services/tuinontwerp/kosten";

interface Props {
  /** Zoek een soort uit het recept op in Ontdek (zet de zoekbalk + voert uit). */
  onZoekSoort: (wetenschappelijkeNaam: string) => void;
}

export function BorderRecepten({ onZoekSoort }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section aria-label="Borderrecepten" className="mt-10 pt-6 border-t border-[var(--gp-border)]">
      <div className="mb-3">
        <h2 className="font-display text-heading-md text-moss-900">Plantcombinaties</h2>
        <p className="text-body-sm text-[var(--gp-text-mute)]">
          Borderrecepten · gecureerde, beproefde mixen — scores en prijzen zijn een indicatie.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {BORDERRECEPTEN.map((r) => {
          const kosten = schatKosten(r.aantalPlanten);
          const isOpen = open === r.id;
          return (
            <article key={r.id} className="rounded-xl border border-[var(--gp-border)] bg-white overflow-hidden flex flex-col">
              <div className={`relative h-20 bg-gradient-to-br ${r.gradient}`}>
                <span className="absolute top-2 left-2 text-caption font-medium bg-white/90 rounded-full px-2 py-0.5 text-moss-800">
                  {r.type}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-display text-heading-sm text-moss-900">{r.naam}</h3>
                <p className="text-caption text-[var(--gp-text-mute)]">
                  {r.soorten.length} soorten · ±{r.m2} m² · {r.bloeiVenster} · onderhoud {r.onderhoud}
                </p>
                <p className="text-body-sm text-moss-700 flex-1">{r.beschrijving}</p>
                <p className="text-caption text-moss-800">
                  🐝 Bijen {r.bijenScore}/10 · 🦋 Vlinders {r.vlinderScore}/10
                  {kosten && (
                    <span title="Ruwe schatting: gangbare vasteplanten-prijzen, geen winkelprijs">
                      {" "}· €{kosten.min}–{kosten.max}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className="flex items-center gap-1 text-caption text-moss-600 hover:underline w-fit"
                >
                  {isOpen ? <ChevronUp size={12} aria-hidden /> : <ChevronDown size={12} aria-hidden />}
                  {isOpen ? "Verberg soorten" : "Bekijk soorten"}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.soorten.map((s) => (
                      <button
                        key={s}
                        onClick={() => onZoekSoort(s)}
                        title={`Zoek ${s} en bereken de match voor jouw zone`}
                        className="gp-scientific flex items-center gap-1 text-caption px-2 py-0.5 rounded-full border border-[var(--gp-border)]
                                   bg-white text-moss-700 hover:border-moss-400 hover:bg-moss-50 transition-colors"
                      >
                        <Search size={9} aria-hidden /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
