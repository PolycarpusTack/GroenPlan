import { useState } from "react";
import { Repeat2 } from "lucide-react";
import type { HerhalingConfig, WeekDag, WeekdagOrdinal } from "../domain/taken/types";
import { WEEKDAG_KORT, WEEKDAG_LANG, MAAND_LABELS, ORDINAL_LABELS } from "../domain/taken/herhaling";

type HerhalingType = "geen" | "dagelijks" | "wekelijks" | "maandelijks" | "jaarlijks";

interface EditorState {
  herhalingType: HerhalingType;
  interval: number;
  // dagelijks
  alleenWerkdagen: boolean;
  // wekelijks
  weekdagen: WeekDag[];
  // maandelijks
  maandSubtype: "dag" | "weekdag";
  maandDag: number;
  maandOrdinal: WeekdagOrdinal;
  maandWeekdag: WeekDag;
  // jaarlijks
  jaarMaand: number;
  jaarSubtype: "dag" | "weekdag";
  jaarDag: number;
  jaarOrdinal: WeekdagOrdinal;
  jaarWeekdag: WeekDag;
}

function configNaarStaat(c: HerhalingConfig | null): EditorState {
  const d: EditorState = {
    herhalingType: "geen", interval: 1,
    alleenWerkdagen: false, weekdagen: [0],
    maandSubtype: "dag", maandDag: 1, maandOrdinal: 1, maandWeekdag: 0,
    jaarMaand: 1, jaarSubtype: "dag", jaarDag: 1, jaarOrdinal: 1, jaarWeekdag: 0,
  };
  if (!c) return d;
  switch (c.type) {
    case "dagelijks":
      return { ...d, herhalingType: "dagelijks", interval: c.interval, alleenWerkdagen: c.alleenWerkdagen };
    case "wekelijks":
      return { ...d, herhalingType: "wekelijks", interval: c.interval, weekdagen: c.weekdagen };
    case "maandelijks":
      return {
        ...d, herhalingType: "maandelijks", interval: c.interval,
        maandSubtype: c.regel.soort,
        maandDag: c.regel.soort === "dag" ? c.regel.dagNummer : 1,
        maandOrdinal: c.regel.soort === "weekdag" ? c.regel.ordinal : 1,
        maandWeekdag: c.regel.soort === "weekdag" ? c.regel.weekdag : 0,
      };
    case "jaarlijks":
      return {
        ...d, herhalingType: "jaarlijks", interval: c.interval, jaarMaand: c.maand,
        jaarSubtype: c.regel.soort,
        jaarDag: c.regel.soort === "dag" ? c.regel.dagNummer : 1,
        jaarOrdinal: c.regel.soort === "weekdag" ? c.regel.ordinal : 1,
        jaarWeekdag: c.regel.soort === "weekdag" ? c.regel.weekdag : 0,
      };
  }
}

function staatNaarConfig(s: EditorState): HerhalingConfig | null {
  switch (s.herhalingType) {
    case "geen": return null;
    case "dagelijks": return { type: "dagelijks", interval: s.interval, alleenWerkdagen: s.alleenWerkdagen };
    case "wekelijks": return { type: "wekelijks", interval: s.interval, weekdagen: s.weekdagen.length ? s.weekdagen : [0] };
    case "maandelijks": return {
      type: "maandelijks", interval: s.interval,
      regel: s.maandSubtype === "dag"
        ? { soort: "dag", dagNummer: s.maandDag }
        : { soort: "weekdag", ordinal: s.maandOrdinal, weekdag: s.maandWeekdag },
    };
    case "jaarlijks": return {
      type: "jaarlijks", interval: s.interval, maand: s.jaarMaand,
      regel: s.jaarSubtype === "dag"
        ? { soort: "dag", dagNummer: s.jaarDag }
        : { soort: "weekdag", ordinal: s.jaarOrdinal, weekdag: s.jaarWeekdag },
    };
  }
}

const SELECT_KLS = "text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white focus:outline-none focus:shadow-[var(--gp-shadow-focus)]";
const NUM_KLS = `${SELECT_KLS} w-16 text-center`;

interface Props {
  waarde: HerhalingConfig | null;
  onChange: (c: HerhalingConfig | null) => void;
}

export function HerhalingEditor({ waarde, onChange }: Props) {
  const [staat, setStaat] = useState<EditorState>(() => configNaarStaat(waarde));

  const update = (updates: Partial<EditorState>) => {
    const next = { ...staat, ...updates };
    setStaat(next);
    onChange(staatNaarConfig(next));
  };

  const toggleWeekdag = (wd: WeekDag) => {
    const huidig = staat.weekdagen;
    const nieuw = huidig.includes(wd)
      ? huidig.filter((d) => d !== wd)
      : [...huidig, wd].sort((a, b) => a - b);
    if (nieuw.length > 0) update({ weekdagen: nieuw as WeekDag[] });
  };

  const { herhalingType: type, interval } = staat;

  return (
    <div className="space-y-2 pt-1">
      {/* Type selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Repeat2 size={13} className="text-[var(--gp-text-mute)] shrink-0" aria-hidden />
        <select
          value={type}
          onChange={(e) => update({ herhalingType: e.target.value as HerhalingType, interval: 1 })}
          className={SELECT_KLS}
          aria-label="Herhalingstype"
        >
          <option value="geen">– geen herhaling –</option>
          <option value="dagelijks">Dagelijks</option>
          <option value="wekelijks">Wekelijks</option>
          <option value="maandelijks">Maandelijks</option>
          <option value="jaarlijks">Jaarlijks</option>
        </select>

        {/* Inline interval for dagelijks / wekelijks */}
        {(type === "wekelijks" || (type === "dagelijks" && !staat.alleenWerkdagen)) && (
          <>
            <span className="text-body-sm text-[var(--gp-text-mute)]">Elke</span>
            <input
              type="number" min={1} max={99}
              value={interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className={NUM_KLS}
              aria-label="Interval"
            />
            <span className="text-body-sm text-[var(--gp-text-mute)]">
              {type === "dagelijks" ? (interval === 1 ? "dag" : "dagen") : (interval === 1 ? "week" : "weken")}
            </span>
          </>
        )}
      </div>

      {/* ── Dagelijks ── */}
      {type === "dagelijks" && (
        <div className="flex items-center gap-3 pl-5 flex-wrap">
          <label className="flex items-center gap-1.5 text-body-sm cursor-pointer">
            <input
              type="radio" name="dagelijks-sub" value="interval"
              checked={!staat.alleenWerkdagen}
              onChange={() => update({ alleenWerkdagen: false })}
              className="accent-moss-700"
            />
            Elke
            <input
              type="number" min={1} max={365}
              value={interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className={NUM_KLS}
              aria-label="Interval in dagen"
              disabled={staat.alleenWerkdagen}
            />
            {interval === 1 ? "dag" : "dag(en)"}
          </label>
          <label className="flex items-center gap-1.5 text-body-sm cursor-pointer">
            <input
              type="radio" name="dagelijks-sub" value="werkdagen"
              checked={staat.alleenWerkdagen}
              onChange={() => update({ alleenWerkdagen: true })}
              className="accent-moss-700"
            />
            Elke werkdag
          </label>
        </div>
      )}

      {/* ── Wekelijks — dag-toggles ── */}
      {type === "wekelijks" && (
        <div className="flex items-center gap-1 pl-5 flex-wrap">
          <span className="text-body-sm text-[var(--gp-text-mute)] mr-1">Op:</span>
          {(WEEKDAG_KORT as readonly string[]).map((label, i) => {
            const wd = i as WeekDag;
            const actief = staat.weekdagen.includes(wd);
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleWeekdag(wd)}
                aria-pressed={actief}
                aria-label={WEEKDAG_LANG[i]}
                className={`px-2 py-1 rounded-md text-body-sm font-medium transition-colors border
                  ${actief
                    ? "bg-moss-600 text-white border-moss-600"
                    : "bg-white text-moss-700 border-[var(--gp-border)] hover:border-moss-400"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Maandelijks ── */}
      {type === "maandelijks" && (
        <div className="pl-5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm text-[var(--gp-text-mute)]">Elke</span>
            <input
              type="number" min={1} max={24}
              value={interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className={NUM_KLS}
            />
            <span className="text-body-sm text-[var(--gp-text-mute)]">{interval === 1 ? "maand" : "maanden"}</span>
          </div>

          <label className="flex items-center gap-2 text-body-sm cursor-pointer flex-wrap">
            <input type="radio" name="maand-sub" value="dag"
              checked={staat.maandSubtype === "dag"}
              onChange={() => update({ maandSubtype: "dag" })}
              className="accent-moss-700"
            />
            Op dag
            <input
              type="number" min={1} max={31}
              value={staat.maandDag}
              onChange={(e) => update({ maandDag: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
              className={NUM_KLS}
              disabled={staat.maandSubtype !== "dag"}
            />
            van de maand
          </label>

          <label className="flex items-center gap-2 text-body-sm cursor-pointer flex-wrap">
            <input type="radio" name="maand-sub" value="weekdag"
              checked={staat.maandSubtype === "weekdag"}
              onChange={() => update({ maandSubtype: "weekdag" })}
              className="accent-moss-700"
            />
            Op de
            <select
              value={staat.maandOrdinal}
              onChange={(e) => update({ maandOrdinal: parseInt(e.target.value) as WeekdagOrdinal })}
              className={SELECT_KLS}
              disabled={staat.maandSubtype !== "weekdag"}
            >
              {[1, 2, 3, 4, -1].map((o) => <option key={o} value={o}>{ORDINAL_LABELS[o].toLowerCase()}</option>)}
            </select>
            <select
              value={staat.maandWeekdag}
              onChange={(e) => update({ maandWeekdag: parseInt(e.target.value) as WeekDag })}
              className={SELECT_KLS}
              disabled={staat.maandSubtype !== "weekdag"}
            >
              {WEEKDAG_LANG.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
            van de maand
          </label>
        </div>
      )}

      {/* ── Jaarlijks ── */}
      {type === "jaarlijks" && (
        <div className="pl-5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm text-[var(--gp-text-mute)]">Elke</span>
            <input
              type="number" min={1} max={10}
              value={interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className={NUM_KLS}
            />
            <span className="text-body-sm text-[var(--gp-text-mute)]">{interval === 1 ? "jaar" : "jaar"}</span>
            <span className="text-body-sm text-[var(--gp-text-mute)]">in</span>
            <select
              value={staat.jaarMaand}
              onChange={(e) => update({ jaarMaand: parseInt(e.target.value) })}
              className={SELECT_KLS}
            >
              {MAAND_LABELS.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-body-sm cursor-pointer flex-wrap">
            <input type="radio" name="jaar-sub" value="dag"
              checked={staat.jaarSubtype === "dag"}
              onChange={() => update({ jaarSubtype: "dag" })}
              className="accent-moss-700"
            />
            Op dag
            <input
              type="number" min={1} max={31}
              value={staat.jaarDag}
              onChange={(e) => update({ jaarDag: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
              className={NUM_KLS}
              disabled={staat.jaarSubtype !== "dag"}
            />
          </label>

          <label className="flex items-center gap-2 text-body-sm cursor-pointer flex-wrap">
            <input type="radio" name="jaar-sub" value="weekdag"
              checked={staat.jaarSubtype === "weekdag"}
              onChange={() => update({ jaarSubtype: "weekdag" })}
              className="accent-moss-700"
            />
            Op de
            <select
              value={staat.jaarOrdinal}
              onChange={(e) => update({ jaarOrdinal: parseInt(e.target.value) as WeekdagOrdinal })}
              className={SELECT_KLS}
              disabled={staat.jaarSubtype !== "weekdag"}
            >
              {[1, 2, 3, 4, -1].map((o) => <option key={o} value={o}>{ORDINAL_LABELS[o].toLowerCase()}</option>)}
            </select>
            <select
              value={staat.jaarWeekdag}
              onChange={(e) => update({ jaarWeekdag: parseInt(e.target.value) as WeekDag })}
              className={SELECT_KLS}
              disabled={staat.jaarSubtype !== "weekdag"}
            >
              {WEEKDAG_LANG.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
