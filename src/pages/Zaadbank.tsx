import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bean, Plus, Trash2, Sprout, AlertTriangle, CalendarRange } from "lucide-react";
import { INVOER_KLASSE } from "../components/Veld";
import { useZaadbankStore } from "../store/zaadbank-store";
import { useTakenStore } from "../store/taken-store";
import { useTuinStore } from "../store/tuin-store";
import { isZaaibaarInMaand, isVerlopen, isBijnaVerlopen, zaaivensterLabel, MAAND_KORT } from "../domain/zaadbank/zaadbank";
import type { Zaad, ZaadStatus } from "../domain/zaadbank/types";
import { Button } from "../components/ui";

const VANDAAG = new Date().toISOString().slice(0, 10);
const DEZE_MAAND = new Date().getMonth() + 1;

type Filter = "alle" | "zaaibaar" | "voorraad" | "gezaaid";

const FILTERS: { sleutel: Filter; label: string }[] = [
  { sleutel: "alle", label: "Alle" },
  { sleutel: "zaaibaar", label: `Zaaibaar in ${MAAND_KORT[DEZE_MAAND - 1]}` },
  { sleutel: "voorraad", label: "Voorraad" },
  { sleutel: "gezaaid", label: "Gezaaid" },
];

const STATUS_STIJL: Record<ZaadStatus, string> = {
  voorraad: "bg-moss-100 text-moss-700",
  gezaaid: "bg-sky-100 text-sky-700",
  op: "bg-[var(--gp-surface-alt)] text-[var(--gp-text-mute)]",
};
const STATUS_LABEL: Record<ZaadStatus, string> = {
  voorraad: "Voorraad",
  gezaaid: "Gezaaid",
  op: "Op",
};

const LEEG_FORMULIER = {
  naam: "",
  wetenschappelijkeNaam: "",
  leverancier: "",
  aantal: "",
  houdbaarTot: "",
  zaaiVan: "",
  zaaiTot: "",
  notitie: "",
};

export function ZaadbankPagina() {
  const navigate = useNavigate();
  const zaden = useZaadbankStore((s) => s.zaden);
  const voegZaadToe = useZaadbankStore((s) => s.voegZaadToe);
  const verwijderZaad = useZaadbankStore((s) => s.verwijderZaad);
  const markeerGezaaid = useZaadbankStore((s) => s.markeerGezaaid);
  const voegTaakToe = useTakenStore((s) => s.voegTaakToe);
  const plantCatalog = useTuinStore((s) => s.plantCatalog);

  const [filter, setFilter] = useState<Filter>("alle");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(LEEG_FORMULIER);
  const [fout, setFout] = useState<string | null>(null);

  const catalogusNamen = useMemo(
    () => Object.values(plantCatalog).map((p) => p.identificatie.wetenschappelijkeNaam),
    [plantCatalog],
  );

  const gefilterd = useMemo(() => {
    return zaden.filter((z) => {
      if (filter === "zaaibaar") return isZaaibaarInMaand(z, DEZE_MAAND) && z.status !== "op";
      if (filter === "voorraad") return z.status === "voorraad";
      if (filter === "gezaaid") return z.status === "gezaaid";
      return true;
    });
  }, [zaden, filter]);

  const aantalZaaibaar = useMemo(
    () => zaden.filter((z) => isZaaibaarInMaand(z, DEZE_MAAND) && z.status === "voorraad").length,
    [zaden],
  );

  const opslaan = () => {
    if (!form.naam.trim()) {
      setFout("Geef het zaad een naam.");
      return;
    }
    const zaaiVan = form.zaaiVan ? Number(form.zaaiVan) : null;
    const zaaiTot = form.zaaiTot ? Number(form.zaaiTot) : null;
    voegZaadToe({
      naam: form.naam.trim(),
      wetenschappelijkeNaam: form.wetenschappelijkeNaam.trim() || null,
      leverancier: form.leverancier.trim() || null,
      aantal: form.aantal ? Number(form.aantal) : null,
      houdbaarTot: form.houdbaarTot || null,
      zaaiVan,
      zaaiTot,
      notitie: form.notitie.trim() || null,
    });
    setForm(LEEG_FORMULIER);
    setFout(null);
    setFormOpen(false);
  };

  const zaaiNu = (zaad: Zaad) => {
    markeerGezaaid(zaad.id);
    voegTaakToe({
      titel: `Zaaien: ${zaad.naam}`,
      zoneId: null,
      vervaldatum: VANDAAG,
      herhaling: null,
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <Bean size={26} className="text-moss-600" aria-hidden />
          <div>
            <h1 className="font-display text-display-md text-moss-900">Zaadbank</h1>
            <p className="text-body text-moss-500">Beheer je zaadvoorraad, zaaivensters en houdbaarheid.</p>
          </div>
        </div>
        <Button onClick={() => setFormOpen((o) => !o)} className="flex items-center gap-1.5 shrink-0">
          <Plus size={16} aria-hidden /> Zaad toevoegen
        </Button>
      </div>

      {aantalZaaibaar > 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-moss-50 border border-moss-200 text-body-sm text-moss-800">
          <Sprout size={16} className="text-moss-600 shrink-0" aria-hidden />
          {aantalZaaibaar} zaad{aantalZaaibaar !== 1 ? "soorten" : ""} kun je deze maand ({MAAND_KORT[DEZE_MAAND - 1]}) zaaien.
        </div>
      )}

      {/* Toevoegformulier */}
      {formOpen && (
        <div className="mt-4 p-4 rounded-xl border border-[var(--gp-border)] bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Naam *</span>
              <input
                value={form.naam}
                onChange={(e) => setForm({ ...form, naam: e.target.value })}
                placeholder="bijv. Tomaat 'Coeur de Boeuf'"
                className={INVOER_KLASSE}
              />
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Wetenschappelijke naam</span>
              <input
                list="catalogus-namen"
                value={form.wetenschappelijkeNaam}
                onChange={(e) => setForm({ ...form, wetenschappelijkeNaam: e.target.value })}
                placeholder="bijv. Solanum lycopersicum"
                className={`gp-scientific ${INVOER_KLASSE}`}
              />
              <datalist id="catalogus-namen">
                {catalogusNamen.map((n) => <option key={n} value={n} />)}
              </datalist>
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Leverancier</span>
              <input
                value={form.leverancier}
                onChange={(e) => setForm({ ...form, leverancier: e.target.value })}
                placeholder="bijv. De Bolster"
                className={INVOER_KLASSE}
              />
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Aantal (zaden/zakjes)</span>
              <input
                type="number" min={0}
                value={form.aantal}
                onChange={(e) => setForm({ ...form, aantal: e.target.value })}
                placeholder="bijv. 25"
                className={INVOER_KLASSE}
              />
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Zaaien van</span>
              <select
                value={form.zaaiVan}
                onChange={(e) => setForm({ ...form, zaaiVan: e.target.value })}
                className={INVOER_KLASSE}
              >
                <option value="">—</option>
                {MAAND_KORT.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Zaaien tot</span>
              <select
                value={form.zaaiTot}
                onChange={(e) => setForm({ ...form, zaaiTot: e.target.value })}
                className={INVOER_KLASSE}
              >
                <option value="">—</option>
                {MAAND_KORT.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-caption text-moss-700 font-medium">Houdbaar tot</span>
              <input
                type="month"
                value={form.houdbaarTot}
                onChange={(e) => setForm({ ...form, houdbaarTot: e.target.value })}
                className={INVOER_KLASSE}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-caption text-moss-700 font-medium">Notitie</span>
              <input
                value={form.notitie}
                onChange={(e) => setForm({ ...form, notitie: e.target.value })}
                placeholder="bijv. voorzaaien binnen, daarna uitplanten"
                className={INVOER_KLASSE}
              />
            </label>
          </div>
          {fout && <p role="alert" className="text-caption text-[var(--gp-rust-700)]">{fout}</p>}
          <div className="flex gap-2">
            <Button onClick={opslaan}>Opslaan</Button>
            <Button variant="ghost" onClick={() => { setFormOpen(false); setFout(null); }}>Annuleren</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mt-6 mb-4">
        {FILTERS.map(({ sleutel, label }) => (
          <button
            key={sleutel}
            onClick={() => setFilter(sleutel)}
            className={`text-body-sm px-3 py-1.5 rounded-full border transition-colors ${
              filter === sleutel
                ? "bg-moss-600 text-white border-moss-600"
                : "bg-white text-moss-700 border-[var(--gp-border)] hover:border-moss-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lijst */}
      {gefilterd.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[var(--gp-border)] text-center">
          <Bean size={32} className="text-[var(--gp-mute)] mx-auto mb-3" aria-hidden />
          <p className="text-body text-moss-500">
            {zaden.length === 0
              ? "Nog geen zaden. Voeg je eerste zakje toe om je voorraad bij te houden."
              : "Geen zaden in deze weergave."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {gefilterd.map((z) => {
            const venster = zaaivensterLabel(z);
            const zaaibaar = isZaaibaarInMaand(z, DEZE_MAAND) && z.status === "voorraad";
            const verlopen = isVerlopen(z, VANDAAG);
            const bijnaVerlopen = !verlopen && isBijnaVerlopen(z, VANDAAG);
            return (
              <li key={z.id} className="p-4 rounded-xl border border-[var(--gp-border)] bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body font-semibold text-moss-900">{z.naam}</span>
                      <span className={`text-caption px-2 py-0.5 rounded-full ${STATUS_STIJL[z.status]}`}>{STATUS_LABEL[z.status]}</span>
                      {zaaibaar && (
                        <span className="text-caption px-2 py-0.5 rounded-full bg-moss-600 text-white flex items-center gap-1">
                          <Sprout size={11} aria-hidden /> Zaaibaar nu
                        </span>
                      )}
                      {verlopen && (
                        <span className="text-caption px-2 py-0.5 rounded-full bg-[var(--gp-rust-100)] text-[var(--gp-rust-700)] flex items-center gap-1">
                          <AlertTriangle size={11} aria-hidden /> Verlopen
                        </span>
                      )}
                      {bijnaVerlopen && (
                        <span className="text-caption px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                          <AlertTriangle size={11} aria-hidden /> Bijna verlopen
                        </span>
                      )}
                    </div>
                    {z.wetenschappelijkeNaam && (
                      <button
                        onClick={() => navigate(`/ontdek?zoek=${encodeURIComponent(z.wetenschappelijkeNaam!)}`)}
                        className="gp-scientific text-caption text-moss-600 hover:underline"
                      >
                        {z.wetenschappelijkeNaam}
                      </button>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-caption text-[var(--gp-text-mute)]">
                      {venster && <span className="flex items-center gap-1"><CalendarRange size={11} aria-hidden /> Zaaien {venster}</span>}
                      {z.aantal != null && <span>{z.aantal} stuks</span>}
                      {z.leverancier && <span>{z.leverancier}</span>}
                      {z.houdbaarTot && <span>Houdbaar tot {z.houdbaarTot}</span>}
                    </div>
                    {z.notitie && <p className="text-body-sm text-moss-700 mt-1.5">{z.notitie}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {z.status === "voorraad" && (
                      <Button
                        variant="ghost"
                        onClick={() => zaaiNu(z)}
                        className="border border-moss-300 text-caption py-1 px-2 flex items-center gap-1"
                        aria-label={`Zaai ${z.naam} en maak een taak`}
                      >
                        <Sprout size={13} aria-hidden /> Zaai nu
                      </Button>
                    )}
                    <button
                      onClick={() => verwijderZaad(z.id)}
                      className="text-[var(--gp-text-mute)] hover:text-[var(--gp-rust-700)]"
                      aria-label={`Verwijder ${z.naam}`}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
