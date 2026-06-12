import { Fragment, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Leaf, MapPin, Plus, Check, X,
  AlertTriangle, Scissors, Trash2, ExternalLink, ShieldAlert,
} from "lucide-react";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import { matchScore } from "../match/score";
import { MatchScoreBadge } from "../components/MatchScoreBadge";
import { MatchScoreBreakdown } from "../components/MatchScoreBreakdown";
import type { ZoneInvoer } from "../match/types";
import { useDagboekStore, OBSERVATIE_TYPE_LABEL, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import { SourceAttribution } from "../components/SourceAttribution";
import { Button } from "../components/ui";
import type { ObservatieType } from "../domain/dagboek/types";
import type { AutoFillBron, VeldMetBron } from "../domain/plant/types";

type Tabblad = "overzicht" | "onderhoud" | "journal" | "taken" | "bronnen" | "combinaties";

const ALLE_OBSERVATIE_TYPES: ObservatieType[] = [
  "bloei", "groei", "plaag", "ziekte", "snoei", "bemesting", "overwintering", "overig",
];

const VANDAAG_ISO = new Date().toISOString().slice(0, 10);

function plantThumbnailKlasse(kleuren: string[]): string {
  const k = kleuren[0]?.toLowerCase() ?? "";
  if (["purple", "violet", "lavender", "mauve", "lila"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-bloom-100 to-bloom-400";
  if (["yellow", "orange", "gold", "amber", "geel", "oranje"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-amber-100 to-amber-400";
  if (["pink", "red", "crimson", "rose", "magenta", "rood", "roze"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-rust-100 to-bloom-200";
  if (["blue", "indigo", "blauw"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-sky-100 to-sky-300";
  if (["white", "cream", "ivory", "wit"].some((c) => k.includes(c)))
    return "bg-gradient-to-br from-moss-50 to-moss-100";
  return "bg-gradient-to-br from-moss-100 to-moss-300";
}

const MAAND_KORT: Record<number, string> = {
  1: "jan", 2: "feb", 3: "mrt", 4: "apr", 5: "mei", 6: "jun",
  7: "jul", 8: "aug", 9: "sep", 10: "okt", 11: "nov", 12: "dec",
};

const BESTUIVER_INFO: Record<string, { label: string; emoji: string }> = {
  bees:        { label: "Bijen",        emoji: "🐝" },
  butterflies: { label: "Vlinders",     emoji: "🦋" },
  hoverflies:  { label: "Zweefvliegen", emoji: "🪰" },
  moths:       { label: "Nachtvlinders",emoji: "🌙" },
  birds:       { label: "Vogels",       emoji: "🐦" },
};

const BRON_KLASSE: Record<AutoFillBron, string> = {
  RHS:            "text-moss-700 bg-moss-50 border-moss-200",
  Trefle:         "text-moss-700 bg-moss-50 border-moss-200",
  GBIF:           "text-moss-700 bg-moss-50 border-moss-200",
  USDA:           "text-moss-700 bg-moss-50 border-moss-200",
  Velt:           "text-moss-700 bg-moss-50 border-moss-200",
  Wikipedia:      "text-amber-700 bg-amber-50 border-amber-200",
  "AI-knowledge": "text-amber-700 bg-amber-50 border-amber-200",
  handmatig:      "text-moss-700 bg-moss-50 border-moss-200",
  unknown:        "text-[var(--gp-rust-700)] bg-[var(--gp-rust-50)] border-[var(--gp-rust-200)]",
};

const TABS: { id: Tabblad; label: string }[] = [
  { id: "overzicht",   label: "Overzicht"    },
  { id: "onderhoud",   label: "Onderhoud"    },
  { id: "journal",     label: "Journal"      },
  { id: "taken",       label: "Taken"        },
  { id: "bronnen",     label: "Bronnen"      },
  { id: "combinaties", label: "Combinaties"  },
];

interface BronRij {
  sectie: string;
  veld: string;
  waarde: string;
  bron: AutoFillBron;
  terugval: boolean;
  notitie?: string;
}

function toonWaarde(w: unknown): string {
  if (w === null || w === undefined) return "—";
  if (typeof w === "boolean") return w ? "Ja" : "Nee";
  if (typeof w === "string") return w || "—";
  if (typeof w === "number") return String(w);
  if (Array.isArray(w)) {
    if (w.length === 0) return "—";
    if (typeof w[0] === "number") return (w as number[]).map((m) => MAAND_KORT[m]).join(", ");
    return (w as string[]).join(", ");
  }
  if (typeof w === "object") {
    const obj = w as Record<string, unknown>;
    if ("usda_min" in obj) {
      return `USDA ${obj.usda_min}${obj.usda_max != null ? `–${obj.usda_max}` : "+"}`;
    }
    if ("min" in obj && "max" in obj) {
      return obj.max != null ? `${obj.min}–${obj.max}` : `≥${obj.min}`;
    }
    if ("wanneer" in obj && "hoe" in obj) return `${obj.wanneer} — ${obj.hoe}`;
    if ("goed" in obj && "slecht" in obj) {
      const goed = (obj.goed as string[]).join(", ");
      const slecht = (obj.slecht as string[]).join(", ");
      return [goed && `Goed: ${goed}`, slecht && `Slecht: ${slecht}`].filter(Boolean).join(" · ") || "—";
    }
  }
  return String(w);
}

export function PlantDetailPagina() {
  const { wetNaam } = useParams<{ wetNaam: string }>();
  const navigate = useNavigate();

  const plantCatalog = useTuinStore((s) => s.plantCatalog);
  const tuin = useTuinStore((s) => s.tuin);
  const setActieveZone = useTuinStore((s) => s.setActieveZone);
  const actieveZoneId = useTuinStore((s) => s.actieveZoneId);
  const actieveZone = tuin.zones.find((z) => z.id === actieveZoneId) ?? null;

  const { taken, voegTaakToe, toggleStatus, verwijderTaak } = useTakenStore();
  const voegObservatieToe = useDagboekStore((s) => s.voegObservatieToe);
  const alleObservaties = useDagboekStore((s) => s.observaties);
  const plantObservaties = useMemo(() => {
    const sleutel = wetNaam ? decodeURIComponent(wetNaam).toLowerCase() : "";
    return alleObservaties.filter(
      (o) => o.wetenschappelijkeNaam?.toLowerCase() === sleutel,
    );
  }, [alleObservaties, wetNaam]);

  const [actieveTab, setActieveTab] = useState<Tabblad>("overzicht");

  // Journal form
  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState<ObservatieType>("overig");
  const [logTekst, setLogTekst] = useState("");
  const [logDatum, setLogDatum] = useState(VANDAAG_ISO);

  // Taken form
  const [taakOpen, setTaakOpen] = useState(false);
  const [taakTitel, setTaakTitel] = useState("");
  const [taakDatum, setTaakDatum] = useState("");
  const [taakZoneId, setTaakZoneId] = useState("");

  const decodedNaam = wetNaam ? decodeURIComponent(wetNaam) : "";
  const plant = plantCatalog[decodedNaam.toLowerCase()];

  const plaatsingenInTuin = tuin.zones.flatMap((zone) =>
    zone.plantPlaatsingen
      .filter((p) => p.wetenschappelijkeNaam.toLowerCase() === decodedNaam.toLowerCase())
      .map((p) => ({
        zone,
        plaatsing: p,
        border: p.borderId ? zone.borders.find((b) => b.id === p.borderId) ?? null : null,
      })),
  );

  const zoneIdsMetPlant = useMemo(
    () => new Set(plaatsingenInTuin.map((p) => p.zone.id)),
    [plaatsingenInTuin],
  );

  const matchResultaat = useMemo(() => {
    if (!actieveZone || !plant) return null;
    const zoneInvoer: ZoneInvoer = {
      zon: actieveZone.zon,
      grondsoort: actieveZone.grondsoort,
      pH: actieveZone.pH,
      drainage: actieveZone.drainage,
      regenval_mm_7d: actieveZone.regenval_mm_7d ?? undefined,
    };
    const bestaandeBloeiMaanden = actieveZone.plantPlaatsingen.flatMap((p) => {
      const cat = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
      return cat?.bloei.maanden.waarde ?? [];
    });
    return matchScore({
      plant: {
        wetenschappelijkeNaam: plant.identificatie.wetenschappelijkeNaam,
        omstandigheden: {
          zon: plant.omstandigheden.zon.waarde,
          grondsoorten: plant.omstandigheden.grondsoorten.waarde,
          pH: plant.omstandigheden.pH.waarde,
          drainage: plant.omstandigheden.drainage.waarde,
          waterbehoeften: plant.omstandigheden.waterbehoeften.waarde,
          hardheid: plant.omstandigheden.hardheid.waarde,
        },
        bloei: { maanden: plant.bloei.maanden.waarde },
      },
      zone: zoneInvoer,
      tuinHardheid: tuin.hardheid,
      bestaandeBloeiMaanden,
    });
  }, [actieveZone, plant, tuin.hardheid, plantCatalog]);

  const plantTaken = useMemo(
    () => taken.filter((t) => t.zoneId !== null && zoneIdsMetPlant.has(t.zoneId)),
    [taken, zoneIdsMetPlant],
  );

  // Build bronnen rows grouped by section
  const bronGroepen = useMemo(() => {
    const groepen = new Map<string, BronRij[]>();
    if (!plant) return groepen;
    const { omstandigheden, bloei, groei, onderhoud, ecologie, veiligheid } = plant;
    const rijen: BronRij[] = [];
    function add(sectie: string, veld: string, vm: VeldMetBron<unknown>) {
      rijen.push({
        sectie,
        veld,
        waarde: toonWaarde(vm.waarde),
        bron: vm.bron,
        terugval: vm.terugval ?? false,
        notitie: vm.notitie,
      });
    }

    add("Groei", "Hoogte",          groei.volwassenHoogte_cm as VeldMetBron<unknown>);
    add("Groei", "Breedte",         groei.volwassenBreedte_cm as VeldMetBron<unknown>);
    add("Groei", "Plantafstand",    groei.plantafstand_cm as VeldMetBron<unknown>);
    add("Groei", "Groeisnelheid",   groei.groeisnelheid as VeldMetBron<unknown>);

    add("Standplaats", "Zonlicht",       omstandigheden.zon as VeldMetBron<unknown>);
    add("Standplaats", "Grondsoorten",   omstandigheden.grondsoorten as VeldMetBron<unknown>);
    add("Standplaats", "pH",             omstandigheden.pH as VeldMetBron<unknown>);
    add("Standplaats", "Drainage",       omstandigheden.drainage as VeldMetBron<unknown>);
    add("Standplaats", "Waterbehoeften", omstandigheden.waterbehoeften as VeldMetBron<unknown>);
    add("Standplaats", "Hardheid (USDA)",omstandigheden.hardheid as VeldMetBron<unknown>);

    add("Bloei", "Bloeimaanden",  bloei.maanden as VeldMetBron<unknown>);
    add("Bloei", "Bloemkleuren", bloei.kleuren as VeldMetBron<unknown>);
    add("Bloei", "Geurig",       bloei.geurig as VeldMetBron<unknown>);

    add("Onderhoud", "Snoeien",     onderhoud.snoeien as VeldMetBron<unknown>);
    add("Onderhoud", "Bemesten",    onderhoud.bemesten as VeldMetBron<unknown>);
    add("Onderhoud", "Overwinteren",onderhoud.overwinteren as VeldMetBron<unknown>);

    add("Ecologie", "Bestuivers",    ecologie.bestuivers as VeldMetBron<unknown>);
    add("Ecologie", "Begeleiders",   ecologie.begeleiders as VeldMetBron<unknown>);
    add("Ecologie", "Plagen",        ecologie.plagen as VeldMetBron<unknown>);
    add("Ecologie", "Ziekten",       ecologie.ziekten as VeldMetBron<unknown>);
    add("Ecologie", "Inheems (BE)",  ecologie.inheems_belgie as VeldMetBron<unknown>);
    add("Ecologie", "Invasief (BE)", ecologie.invasief_belgie as VeldMetBron<unknown>);

    add("Veiligheid", "Giftig (mensen)",    veiligheid.giftig_mensen as VeldMetBron<unknown>);
    add("Veiligheid", "Giftig (huisdieren)",veiligheid.giftig_huisdieren as VeldMetBron<unknown>);
    add("Veiligheid", "Eetbare delen",      veiligheid.eetbare_delen as VeldMetBron<unknown>);

    for (const rij of rijen) {
      if (!groepen.has(rij.sectie)) groepen.set(rij.sectie, []);
      groepen.get(rij.sectie)!.push(rij);
    }
    return groepen;
  }, [plant]);

  if (!plant) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
        <Leaf size={40} className="text-[var(--gp-mute)] mb-4" aria-hidden />
        <h2 className="font-display text-heading-lg text-moss-900 mb-2">Plant niet gevonden</h2>
        <p className="text-body text-moss-500 mb-6">
          Deze plant staat nog niet in jouw catalogus. Zoek hem op via Ontdek.
        </p>
        <Button onClick={() => navigate("/ontdek")}>
          Ga naar Ontdek
        </Button>
      </div>
    );
  }

  const { identificatie, omstandigheden, bloei, groei, onderhoud, ecologie, veiligheid, zekerheid, notities } = plant;

  const slaObservatieOp = () => {
    if (!logTekst.trim()) return;
    voegObservatieToe({
      datum: logDatum,
      type: logType,
      tekst: logTekst.trim(),
      zoneId: null,
      wetenschappelijkeNaam: decodedNaam,
      afbeeldingUrl: null,
    });
    setLogTekst("");
    setLogOpen(false);
  };

  const slaTaakOp = () => {
    if (!taakTitel.trim()) return;
    voegTaakToe({
      titel: taakTitel.trim(),
      zoneId: taakZoneId || plaatsingenInTuin[0]?.zone.id || null,
      vervaldatum: taakDatum || null,
      herhaling: null,
    });
    setTaakTitel("");
    setTaakDatum("");
    setTaakOpen(false);
  };

  const openTaken = plantTaken.filter((t) => t.status === "open");
  const klaarleTaken = plantTaken.filter((t) => t.status === "klaar");

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Terug */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[var(--gp-text-mute)] mb-6 -ml-1"
      >
        <ArrowLeft size={16} aria-hidden /> Terug
      </Button>

      <div className="flex gap-8 items-start">
      <div className="flex-1 min-w-0">

      {/* Identificatieheader */}
      <h1 className="gp-scientific font-display text-display-md text-moss-900 mb-1">
        {identificatie.wetenschappelijkeNaam}
        {identificatie.cultivar && (
          <span className="gp-cultivar ml-2">{identificatie.cultivar}</span>
        )}
      </h1>
      {identificatie.gewoneNamen.nl && (
        <p className="text-body text-moss-500 mb-1">{identificatie.gewoneNamen.nl}</p>
      )}
      <p className="text-body-sm text-[var(--gp-text-mute)] mb-3">
        {identificatie.familie} · {identificatie.type} · {Math.round(zekerheid.algemeen * 100)}% zeker
      </p>

      {/* Match score voor actieve zone */}
      {matchResultaat && actieveZone && (
        <div className="flex items-center gap-2.5 mb-5">
          <MatchScoreBadge score={matchResultaat.score} />
          <span className="text-body-sm text-[var(--gp-text-mute)]">
            match voor <span className="text-moss-800 font-medium">{actieveZone.naam}</span>
          </span>
        </div>
      )}

      {/* Zones waar plant staat */}
      {plaatsingenInTuin.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {plaatsingenInTuin.map(({ zone, plaatsing, border }) => (
            <button
              key={plaatsing.id}
              onClick={() => { setActieveZone(zone.id); navigate("/tuinkaart"); }}
              className="flex items-center gap-1.5 text-body-sm text-moss-700 bg-moss-50 border border-moss-200 rounded-full px-3 py-1 hover:bg-moss-100 transition-colors"
            >
              <MapPin size={12} className="shrink-0" aria-hidden />
              {zone.naam}
              {border && <span className="text-[var(--gp-text-mute)] ml-1">· {border.naam}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Tabbalk */}
      <div className="flex border-b border-[var(--gp-border)] mb-6 overflow-x-auto -mx-1 px-1">
        {TABS.map((tab) => {
          const badge =
            tab.id === "journal" && plantObservaties.length > 0
              ? plantObservaties.length
              : tab.id === "taken" && openTaken.length > 0
              ? openTaken.length
              : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              className={`px-4 py-2.5 text-body-sm whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                actieveTab === tab.id
                  ? "border-moss-600 text-moss-700 font-medium"
                  : "border-transparent text-[var(--gp-text-mute)] hover:text-moss-600 hover:border-moss-300"
              }`}
            >
              {tab.label}
              {badge !== null && (
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none ${
                    tab.id === "journal"
                      ? "bg-moss-100 text-moss-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────── OVERZICHT ─────────────── */}
      {actieveTab === "overzicht" && (
        <div className="space-y-6">
          {/* Bloeistrip */}
          {bloei.maanden.waarde.length > 0 && (
            <Section titel="Bloei">
              <div className="mb-3">
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const bloeit = bloei.maanden.waarde.includes(m);
                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full h-5 rounded-sm transition-colors ${
                            bloeit
                              ? "bg-bloom-400"
                              : "bg-[var(--gp-surface-alt)] border border-[var(--gp-border)]"
                          }`}
                          role={bloeit ? "img" : undefined}
                          aria-label={bloeit ? `bloeit in ${MAAND_KORT[m]}` : undefined}
                        />
                        <span className="text-[10px] text-[var(--gp-text-mute)] uppercase leading-none">
                          {MAAND_KORT[m]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Bron bron={bloei.maanden.bron} terugval={bloei.maanden.terugval} />
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
                {bloei.kleuren.waarde.length > 0 && (
                  <Item label="Kleuren">
                    {bloei.kleuren.waarde.join(", ")}
                    <Bron bron={bloei.kleuren.bron} terugval={bloei.kleuren.terugval} />
                  </Item>
                )}
                {bloei.geurig.waarde != null && (
                  <Item label="Geurig">{bloei.geurig.waarde ? "Ja" : "Nee"}</Item>
                )}
              </dl>
            </Section>
          )}

          {/* Groei */}
          <Section titel="Groei">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
              {groei.volwassenHoogte_cm.waarde && (
                <Item label="Hoogte">
                  {groei.volwassenHoogte_cm.waarde.min}–{groei.volwassenHoogte_cm.waarde.max} cm
                  <Bron bron={groei.volwassenHoogte_cm.bron} terugval={groei.volwassenHoogte_cm.terugval} />
                </Item>
              )}
              {groei.volwassenBreedte_cm.waarde && (
                <Item label="Breedte">
                  {groei.volwassenBreedte_cm.waarde.min}–{groei.volwassenBreedte_cm.waarde.max} cm
                  <Bron bron={groei.volwassenBreedte_cm.bron} terugval={groei.volwassenBreedte_cm.terugval} />
                </Item>
              )}
              {groei.plantafstand_cm.waarde && (
                <Item label="Plantafstand">
                  {groei.plantafstand_cm.waarde} cm
                  <Bron bron={groei.plantafstand_cm.bron} terugval={groei.plantafstand_cm.terugval} />
                </Item>
              )}
              {groei.groeisnelheid.waarde && (
                <Item label="Groeisnelheid">
                  {groei.groeisnelheid.waarde}
                  <Bron bron={groei.groeisnelheid.bron} terugval={groei.groeisnelheid.terugval} />
                </Item>
              )}
            </dl>
          </Section>

          {/* Standplaats */}
          <Section titel="Standplaats & bodem">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
              <Item label="Zonlicht">
                {omstandigheden.zon.waarde}
                <Bron bron={omstandigheden.zon.bron} terugval={omstandigheden.zon.terugval} />
              </Item>
              {omstandigheden.grondsoorten.waarde.length > 0 && (
                <Item label="Grondsoorten">
                  {omstandigheden.grondsoorten.waarde.join(", ")}
                  <Bron bron={omstandigheden.grondsoorten.bron} terugval={omstandigheden.grondsoorten.terugval} />
                </Item>
              )}
              {omstandigheden.pH.waarde && (
                <Item label="pH">
                  {omstandigheden.pH.waarde.min}–{omstandigheden.pH.waarde.max}
                  <Bron bron={omstandigheden.pH.bron} terugval={omstandigheden.pH.terugval} />
                </Item>
              )}
              <Item label="Drainage">
                {omstandigheden.drainage.waarde}
                <Bron bron={omstandigheden.drainage.bron} terugval={omstandigheden.drainage.terugval} />
              </Item>
              <Item label="Waterbehoeften">
                {omstandigheden.waterbehoeften.waarde}
                <Bron bron={omstandigheden.waterbehoeften.bron} terugval={omstandigheden.waterbehoeften.terugval} />
              </Item>
              {omstandigheden.hardheid.waarde && (
                <Item label="USDA hardheid">
                  {omstandigheden.hardheid.waarde.usda_min}
                  {omstandigheden.hardheid.waarde.usda_max != null
                    ? `–${omstandigheden.hardheid.waarde.usda_max}`
                    : "+"}
                  <Bron bron={omstandigheden.hardheid.bron} terugval={omstandigheden.hardheid.terugval} />
                </Item>
              )}
            </dl>
          </Section>

          {/* Match breakdown voor actieve zone */}
          {matchResultaat && actieveZone && (
            <Section titel={`Match voor ${actieveZone.naam}`}>
              <div className="flex items-center gap-2 mb-1">
                <MatchScoreBadge score={matchResultaat.score} />
                <span className="text-body-sm text-[var(--gp-text-mute)]">totaalscore</span>
              </div>
              <MatchScoreBreakdown match={matchResultaat} />
            </Section>
          )}

          {notities && (
            <p className="text-body-sm text-[var(--gp-text-mute)] italic">{notities}</p>
          )}
        </div>
      )}

      {/* ─────────────── ONDERHOUD ─────────────── */}
      {actieveTab === "onderhoud" && (
        <div className="space-y-4">
          {/* Snoeien */}
          {onderhoud.snoeien.waarde ? (
            <OnderhoudKaart icoon={<Scissors size={16} className="text-moss-600" aria-hidden />} titel="Snoeien">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
                <div>
                  <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-0.5">Wanneer</dt>
                  <dd className="text-moss-900">{onderhoud.snoeien.waarde.wanneer}</dd>
                </div>
                <div>
                  <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-0.5">Hoe</dt>
                  <dd className="text-moss-900">{onderhoud.snoeien.waarde.hoe}</dd>
                </div>
              </div>
              <Bron bron={onderhoud.snoeien.bron} terugval={onderhoud.snoeien.terugval} />
            </OnderhoudKaart>
          ) : (
            <LegeKaart tekst="Geen snoeiinformatie beschikbaar." />
          )}

          {/* Bemesten */}
          {onderhoud.bemesten.waarde ? (
            <OnderhoudKaart icoon={<span className="text-base" aria-hidden>🌿</span>} titel="Bemesten">
              <p className="text-body-sm text-moss-900">{onderhoud.bemesten.waarde}</p>
              <Bron bron={onderhoud.bemesten.bron} terugval={onderhoud.bemesten.terugval} />
            </OnderhoudKaart>
          ) : (
            <LegeKaart tekst="Geen bemestingsinformatie beschikbaar." />
          )}

          {/* Overwinteren */}
          {onderhoud.overwinteren.waarde ? (
            <OnderhoudKaart icoon={<span className="text-base" aria-hidden>❄️</span>} titel="Overwinteren">
              <p className="text-body-sm text-moss-900">{onderhoud.overwinteren.waarde}</p>
              <Bron bron={onderhoud.overwinteren.bron} terugval={onderhoud.overwinteren.terugval} />
            </OnderhoudKaart>
          ) : (
            <LegeKaart tekst="Geen overwinteringsinformatie beschikbaar." />
          )}

          {/* Plagen & Ziekten */}
          {(ecologie.plagen.waarde.length > 0 || ecologie.ziekten.waarde.length > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-amber-600" aria-hidden />
                <h3 className="text-heading-sm text-amber-900">Plagen &amp; Ziekten</h3>
              </div>
              {ecologie.plagen.waarde.length > 0 && (
                <div className="mb-3">
                  <p className="text-caption text-amber-700 uppercase tracking-wide mb-1.5">Plagen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ecologie.plagen.waarde.map((p) => (
                      <span key={p} className="text-caption bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {ecologie.ziekten.waarde.length > 0 && (
                <div>
                  <p className="text-caption text-amber-700 uppercase tracking-wide mb-1.5">Ziekten</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ecologie.ziekten.waarde.map((z) => (
                      <span key={z} className="text-caption bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Veiligheid */}
          <div className="rounded-xl border border-[var(--gp-border)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={15} className="text-[var(--gp-rust-600)]" aria-hidden />
              <h3 className="text-heading-sm text-moss-900">Veiligheid</h3>
            </div>
            <div className="space-y-2 text-body-sm">
              <VeiligheidRij label="Giftig voor mensen" waarde={veiligheid.giftig_mensen.waarde} />
              <VeiligheidRij label="Giftig voor huisdieren" waarde={veiligheid.giftig_huisdieren.waarde} />
              {veiligheid.eetbare_delen.waarde.length > 0 && (
                <div className="pt-1">
                  <span className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">Eetbare delen: </span>
                  <span className="text-moss-900">{veiligheid.eetbare_delen.waarde.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── JOURNAL ─────────────── */}
      {actieveTab === "journal" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-body-sm text-[var(--gp-text-mute)]">
              {plantObservaties.length} observatie{plantObservaties.length !== 1 ? "s" : ""} voor deze plant
            </p>
            <Button
              onClick={() => setLogOpen((v) => !v)}
              className="flex items-center gap-1.5 text-body-sm py-1.5 px-3"
            >
              <Plus size={14} aria-hidden /> Observatie
            </Button>
          </div>

          {logOpen && (
            <div className="mb-4 p-4 rounded-xl border border-moss-300 bg-moss-50 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={logDatum}
                  onChange={(e) => setLogDatum(e.target.value)}
                  className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                             focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
                />
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as ObservatieType)}
                  className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                             focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
                >
                  {ALLE_OBSERVATIE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {OBSERVATIE_TYPE_ICOON[t]} {OBSERVATIE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                autoFocus
                value={logTekst}
                onChange={(e) => setLogTekst(e.target.value)}
                placeholder="Wat heb je geobserveerd?"
                rows={3}
                className="w-full px-3 py-2 text-body-sm border border-[var(--gp-border)] rounded-lg resize-none
                           focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
              />
              <div className="flex gap-2">
                <Button
                  onClick={slaObservatieOp}
                  className="text-body-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Check size={13} aria-hidden /> Opslaan
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLogOpen(false)}
                  className="text-body-sm py-1.5 px-2"
                >
                  <X size={13} aria-hidden />
                </Button>
              </div>
            </div>
          )}

          {plantObservaties.length > 0 ? (
            <ul className="space-y-2">
              {plantObservaties.map((o) => {
                const zoneName = o.zoneId
                  ? tuin.zones.find((z) => z.id === o.zoneId)?.naam
                  : null;
                return (
                  <li
                    key={o.id}
                    className="flex gap-3 p-3.5 rounded-xl border border-[var(--gp-border)] bg-white"
                  >
                    <span className="shrink-0 mt-0.5 text-lg" aria-hidden>
                      {OBSERVATIE_TYPE_ICOON[o.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-moss-900 whitespace-pre-wrap">{o.tekst}</p>
                      <p className="text-caption text-[var(--gp-text-mute)] mt-1">
                        {o.datum} · {OBSERVATIE_TYPE_LABEL[o.type]}
                        {zoneName && ` · ${zoneName}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            !logOpen && (
              <div className="py-12 text-center">
                <p className="text-body text-[var(--gp-text-mute)]">
                  Nog geen observaties voor deze plant.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setLogOpen(true)}
                  className="mt-3 text-body-sm text-moss-600"
                >
                  Eerste observatie toevoegen
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* ─────────────── TAKEN ─────────────── */}
      {actieveTab === "taken" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-body-sm text-[var(--gp-text-mute)]">
              Taken in zones waar deze plant staat
            </p>
            {plaatsingenInTuin.length > 0 && (
              <Button
                onClick={() => {
                  if (!taakOpen) setTaakZoneId(plaatsingenInTuin[0]?.zone.id ?? "");
                  setTaakOpen((v) => !v);
                }}
                className="flex items-center gap-1.5 text-body-sm py-1.5 px-3"
              >
                <Plus size={14} aria-hidden /> Taak
              </Button>
            )}
          </div>

          {taakOpen && (
            <div className="mb-4 p-4 rounded-xl border border-moss-300 bg-moss-50 space-y-2">
              <input
                type="text"
                value={taakTitel}
                onChange={(e) => setTaakTitel(e.target.value)}
                placeholder="Taakomschrijving..."
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") slaTaakOp(); }}
                className="w-full text-body-sm border border-[var(--gp-border)] rounded px-3 py-1.5 bg-white
                           focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
              />
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={taakDatum}
                  onChange={(e) => setTaakDatum(e.target.value)}
                  className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                             focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
                />
                {plaatsingenInTuin.length > 1 && (
                  <select
                    value={taakZoneId}
                    onChange={(e) => setTaakZoneId(e.target.value)}
                    className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                               focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
                  >
                    {plaatsingenInTuin.map(({ zone }) => (
                      <option key={zone.id} value={zone.id}>{zone.naam}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={slaTaakOp}
                  className="text-body-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Check size={13} aria-hidden /> Toevoegen
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setTaakOpen(false)}
                  className="text-body-sm py-1.5 px-2"
                >
                  <X size={13} aria-hidden />
                </Button>
              </div>
            </div>
          )}

          {plaatsingenInTuin.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-[var(--gp-text-mute)]">
                Deze plant staat nog niet in een zone. Voeg hem toe via de Tuinkaart.
              </p>
              <Button
                variant="ghost"
                onClick={() => navigate("/tuinkaart")}
                className="mt-3 text-body-sm text-moss-600"
              >
                Naar Tuinkaart →
              </Button>
            </div>
          ) : plantTaken.length === 0 ? (
            <p className="py-8 text-center text-body text-[var(--gp-text-mute)]">
              Geen taken voor deze plant.
            </p>
          ) : (
            <div className="space-y-2">
              {openTaken.map((taak) => {
                const zone = tuin.zones.find((z) => z.id === taak.zoneId);
                return (
                  <div
                    key={taak.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gp-border)] bg-white"
                  >
                    <button
                      onClick={() => toggleStatus(taak.id)}
                      className="shrink-0 w-5 h-5 rounded border-2 border-moss-400 hover:border-moss-600 hover:bg-moss-50 transition-colors"
                      aria-label="Markeer als klaar"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-moss-900">{taak.titel}</p>
                      <p className="text-caption text-[var(--gp-text-mute)]">
                        {zone?.naam}
                        {taak.vervaldatum && ` · ${taak.vervaldatum}`}
                      </p>
                    </div>
                    <button
                      onClick={() => verwijderTaak(taak.id)}
                      className="shrink-0 p-1 text-[var(--gp-text-mute)] hover:text-[var(--gp-rust-600)] transition-colors"
                      aria-label="Verwijder taak"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                );
              })}

              {klaarleTaken.length > 0 && (
                <details className="mt-3">
                  <summary className="list-none flex items-center gap-1.5 text-caption text-[var(--gp-text-mute)] cursor-pointer hover:text-moss-600 select-none">
                    <Check size={12} aria-hidden />
                    {klaarleTaken.length} voltooide taken
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {klaarleTaken.map((taak) => {
                      const zone = tuin.zones.find((z) => z.id === taak.zoneId);
                      return (
                        <div
                          key={taak.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface-alt)] opacity-70"
                        >
                          <button
                            onClick={() => toggleStatus(taak.id)}
                            className="shrink-0 w-5 h-5 rounded bg-moss-500 border-2 border-moss-500 flex items-center justify-center hover:opacity-80 transition-opacity"
                            aria-label="Markeer als open"
                          >
                            <Check size={11} className="text-white" aria-hidden />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm text-[var(--gp-text-mute)] line-through">{taak.titel}</p>
                            <p className="text-caption text-[var(--gp-text-mute)]">{zone?.naam}</p>
                          </div>
                          <button
                            onClick={() => verwijderTaak(taak.id)}
                            className="shrink-0 p-1 text-[var(--gp-text-mute)] hover:text-[var(--gp-rust-600)] transition-colors"
                            aria-label="Verwijder taak"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── BRONNEN ─────────────── */}
      {actieveTab === "bronnen" && (
        <div>
          <p className="text-body-sm text-[var(--gp-text-mute)] mb-4">
            Alle velden zijn automatisch ingevuld via AI en externe bronnen.
            Terugvalwaarden worden afzonderlijk aangeduid.
          </p>

          {/* Legenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-caption text-[var(--gp-text-mute)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-moss-50 border border-moss-200 inline-block" aria-hidden />
              Geverifieerde bron
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" aria-hidden />
              Wikipedia / AI-knowledge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[var(--gp-rust-50)] border border-[var(--gp-rust-200)] inline-block" aria-hidden />
              Onbekende bron
            </span>
          </div>

          <div className="rounded-xl border border-[var(--gp-border)] overflow-hidden">
            <table className="w-full text-body-sm border-collapse">
              <thead>
                <tr className="bg-[var(--gp-surface-alt)]">
                  <th className="text-left px-4 py-2.5 font-medium text-moss-700 border-b border-[var(--gp-border)] w-36">
                    Veld
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-moss-700 border-b border-[var(--gp-border)]">
                    Waarde
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-moss-700 border-b border-[var(--gp-border)] w-36">
                    Bron
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(bronGroepen.entries()).map(([sectie, rijen]) => (
                  <Fragment key={sectie}>
                    <tr className="bg-moss-50">
                      <td
                        colSpan={3}
                        className="px-4 py-1.5 text-caption font-semibold text-moss-700 uppercase tracking-wide border-b border-[var(--gp-border)]"
                      >
                        {sectie}
                      </td>
                    </tr>
                    {rijen.map((rij, i) => (
                      <tr
                        key={rij.veld}
                        className={i % 2 === 0 ? "bg-white" : "bg-[var(--gp-surface-alt)]"}
                      >
                        <td className="px-4 py-2 border-b border-[var(--gp-border)] text-[var(--gp-text-mute)] align-top">
                          {rij.veld}
                        </td>
                        <td className="px-4 py-2 border-b border-[var(--gp-border)] text-moss-900 align-top">
                          {rij.waarde}
                          {rij.terugval && (
                            <span className="ml-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 align-middle">
                              terugval
                            </span>
                          )}
                          {rij.notitie && (
                            <span className="block text-caption text-[var(--gp-text-mute)] mt-0.5">
                              {rij.notitie}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 border-b border-[var(--gp-border)] align-top">
                          <span
                            className={`text-caption border rounded px-1.5 py-0.5 ${BRON_KLASSE[rij.bron]}`}
                          >
                            {rij.bron}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-caption text-[var(--gp-text-mute)] mt-3">
            Algemene zekerheid: {Math.round(zekerheid.algemeen * 100)}%
            {zekerheid.notities ? ` — ${zekerheid.notities}` : ""}
          </p>
        </div>
      )}

      {/* ─────────────── COMBINATIES ─────────────── */}
      {actieveTab === "combinaties" && (
        <div className="space-y-6">
          {/* Bestuivers */}
          <Section titel="Bestuivers">
            {ecologie.bestuivers.waarde.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-3 mb-2">
                  {ecologie.bestuivers.waarde.map((b) => {
                    const info = BESTUIVER_INFO[b] ?? { label: b, emoji: "🦗" };
                    return (
                      <div
                        key={b}
                        className="flex items-center gap-2 bg-bloom-50 border border-bloom-200 rounded-xl px-4 py-2"
                      >
                        <span className="text-xl" aria-hidden>{info.emoji}</span>
                        <span className="text-body-sm text-bloom-700 font-medium">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
                <Bron bron={ecologie.bestuivers.bron} terugval={ecologie.bestuivers.terugval} />
              </>
            ) : (
              <p className="text-body-sm text-[var(--gp-text-mute)] italic">
                Geen bestuiversinformatie beschikbaar.
              </p>
            )}
          </Section>

          {/* Goede buren */}
          <Section titel="Goede buren">
            {ecologie.begeleiders.waarde.goed.length > 0 ? (
              <>
                <p className="text-body-sm text-[var(--gp-text-mute)] mb-2">
                  Klik op een buur om hem op te zoeken in Ontdek.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ecologie.begeleiders.waarde.goed.map((naam) => (
                    <button
                      key={naam}
                      onClick={() => navigate(`/ontdek?zoek=${encodeURIComponent(naam)}`)}
                      className="flex items-center gap-1.5 text-body-sm bg-moss-50 text-moss-700 border border-moss-200
                                 rounded-full px-3 py-1 hover:bg-moss-100 transition-colors"
                    >
                      {naam}
                      <ExternalLink size={11} aria-hidden />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-body-sm text-[var(--gp-text-mute)] italic">
                Geen goede buren gekend.
              </p>
            )}
          </Section>

          {/* Slechte buren */}
          <Section titel="Slechte buren">
            {ecologie.begeleiders.waarde.slecht.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ecologie.begeleiders.waarde.slecht.map((naam) => (
                  <span
                    key={naam}
                    className="flex items-center gap-1.5 text-body-sm bg-[var(--gp-rust-50)] text-[var(--gp-rust-700)]
                               border border-[var(--gp-rust-200)] rounded-full px-3 py-1"
                  >
                    <AlertTriangle size={11} aria-hidden />
                    {naam}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-[var(--gp-text-mute)] italic">
                Geen slechte buren gekend.
              </p>
            )}
          </Section>

          {/* Ecologische status */}
          {(ecologie.inheems_belgie.waarde != null || ecologie.invasief_belgie.waarde != null) && (
            <Section titel="Ecologische status">
              <div className="flex flex-wrap gap-2">
                {ecologie.inheems_belgie.waarde != null && (
                  <span
                    className={`text-body-sm border rounded-full px-3 py-1 ${
                      ecologie.inheems_belgie.waarde
                        ? "bg-moss-50 border-moss-200 text-moss-700"
                        : "bg-[var(--gp-surface-alt)] border-[var(--gp-border)] text-[var(--gp-text-mute)]"
                    }`}
                  >
                    {ecologie.inheems_belgie.waarde ? "✓" : "✗"} Inheems in België
                  </span>
                )}
                {ecologie.invasief_belgie.waarde != null && (
                  <span
                    className={`text-body-sm border rounded-full px-3 py-1 ${
                      ecologie.invasief_belgie.waarde
                        ? "bg-[var(--gp-rust-50)] border-[var(--gp-rust-200)] text-[var(--gp-rust-700)]"
                        : "bg-[var(--gp-surface-alt)] border-[var(--gp-border)] text-[var(--gp-text-mute)]"
                    }`}
                  >
                    {ecologie.invasief_belgie.waarde ? "⚠ Invasief in België" : "✓ Niet invasief"}
                  </span>
                )}
              </div>
            </Section>
          )}
        </div>
      )}

      </div> {/* end flex-1 main */}

      {/* Rechter context-sidebar */}
      <aside className="hidden xl:flex flex-col gap-4 w-48 shrink-0 sticky top-6">
        {/* Kleur-thumbnail */}
        <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden ${plantThumbnailKlasse(bloei.kleuren.waarde)}`}>
          <span className="font-display italic text-white/50 text-body-sm text-center px-4 leading-snug">
            {identificatie.familie}
          </span>
        </div>

        {/* In jouw tuin */}
        {plaatsingenInTuin.length > 0 && (
          <div className="gp-card-bordered">
            <h3 className="text-body-sm font-semibold text-moss-900 mb-3">In jouw tuin</h3>
            <ul className="space-y-2">
              {plaatsingenInTuin.map(({ zone, plaatsing, border }) => (
                <li key={plaatsing.id}>
                  <button
                    onClick={() => { setActieveZone(zone.id); navigate("/tuinkaart"); }}
                    className="flex items-start gap-1.5 text-body-sm text-moss-700 hover:text-moss-600 text-left w-full"
                  >
                    <MapPin size={11} className="shrink-0 mt-0.5" aria-hidden />
                    <span>
                      <span className="font-medium">{zone.naam}</span>
                      {border && <span className="text-[var(--gp-text-mute)]"> · {border.naam}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Match score samenvatting */}
        {matchResultaat && actieveZone && (
          <div className="gp-card-bordered">
            <h3 className="text-body-sm font-semibold text-moss-900 mb-2">
              Match {actieveZone.naam}
            </h3>
            <div className="font-display text-2xl font-bold text-moss-700 mb-3">
              {Math.round(matchResultaat.score * 100)}
              <span className="text-body-sm font-sans text-[var(--gp-text-mute)]">/100</span>
            </div>
            <MatchScoreBreakdown match={matchResultaat} />
          </div>
        )}

        <p className="text-caption text-[var(--gp-text-mute)] text-center">
          {identificatie.type} · {Math.round(zekerheid.algemeen * 100)}% zekerheid
        </p>
      </aside>
      </div> {/* end flex gap-8 */}
    </div>
  );
}

// ─── Hulpcomponenten ─────────────────────────────────────────────

function Section({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide mb-3 border-b border-[var(--gp-border)] pb-1">
        {titel}
      </h2>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide">{label}</dt>
      <dd className="text-moss-900 mt-0.5">{children}</dd>
    </div>
  );
}

function Bron({ bron, terugval }: { bron: string; terugval?: boolean }) {
  return <SourceAttribution bron={bron as never} terugval={terugval} />;
}

function OnderhoudKaart({
  icoon,
  titel,
  children,
}: {
  icoon: React.ReactNode;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--gp-border)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icoon}
        <h3 className="text-heading-sm text-moss-900">{titel}</h3>
      </div>
      {children}
    </div>
  );
}

function LegeKaart({ tekst }: { tekst: string }) {
  return (
    <div className="rounded-xl border border-[var(--gp-border)] p-4 bg-[var(--gp-surface-alt)]">
      <p className="text-body-sm text-[var(--gp-text-mute)] italic">{tekst}</p>
    </div>
  );
}

function VeiligheidRij({ label, waarde }: { label: string; waarde: boolean | null }) {
  if (waarde === null) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-caption font-medium border rounded px-2 py-0.5 ${
          waarde
            ? "bg-[var(--gp-rust-50)] border-[var(--gp-rust-200)] text-[var(--gp-rust-700)]"
            : "bg-moss-50 border-moss-200 text-moss-700"
        }`}
      >
        {waarde ? "Ja" : "Nee"}
      </span>
      <span className="text-body-sm text-moss-900">{label}</span>
    </div>
  );
}
