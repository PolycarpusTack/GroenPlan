import { matchScoreColor } from "../styles/theme";

interface Props {
  score: number; // 0–1
}

export function MatchScoreBadge({ score }: Props) {
  const procent = Math.round(score * 100);
  const { bg, fg, tier } = matchScoreColor(procent);

  const tierLabel: Record<string, string> = {
    uitstekend: "uitstekend",
    goed: "goed",
    matig: "matig",
    slecht: "slecht",
  };

  return (
    <span
      className="gp-match-badge"
      style={{ background: bg, color: fg }}
      aria-label={`Match score: ${procent}% — ${tierLabel[tier] ?? tier}`}
    >
      {procent}%
    </span>
  );
}
