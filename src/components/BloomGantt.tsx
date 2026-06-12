const MAANDEN = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

interface BloomRij {
  naam: string;
  gewoneNaam?: string | null;
  maanden: number[]; // 1-gebaseerd
}

interface Props {
  rijen: BloomRij[];
}

export function BloomGantt({ rijen }: Props) {
  if (rijen.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm border-collapse" aria-label="Bloeiperiodes per plant">
        <thead>
          <tr>
            <th className="text-left pr-3 pb-1 text-caption text-[var(--gp-text-mute)] font-normal w-32">
              Plant
            </th>
            {MAANDEN.map((m, i) => (
              <th
                key={i}
                className="text-center pb-1 text-caption text-[var(--gp-text-mute)] font-normal w-7"
                aria-label={["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"][i]}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((rij, ri) => (
            <tr key={ri} className="group">
              <td className="pr-3 py-1 align-middle">
                <p className="gp-scientific text-moss-900 truncate max-w-[8rem]" title={rij.naam}>
                  {rij.naam}
                </p>
                {rij.gewoneNaam && (
                  <p className="text-caption text-[var(--gp-text-mute)] truncate max-w-[8rem]">
                    {rij.gewoneNaam}
                  </p>
                )}
              </td>
              {Array.from({ length: 12 }, (_, i) => {
                const bloeit = rij.maanden.includes(i + 1);
                return (
                  <td key={i} className="py-1 px-0.5 align-middle text-center">
                    <span
                      className={`inline-block w-5 h-5 rounded-sm transition-colors ${
                        bloeit
                          ? "bg-bloom-500 group-hover:bg-bloom-600"
                          : "bg-[var(--gp-border)]"
                      }`}
                      aria-label={bloeit ? "bloeit" : "bloeit niet"}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
