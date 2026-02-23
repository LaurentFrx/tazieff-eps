type ScoreBarProps = {
  label: string;
  value: number;
  max?: number;
};

export function ScoreBar({ label, value, max = 5 }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-[color:var(--muted)]">{label}</span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < value
                ? "bg-[color:var(--accent)]"
                : "bg-[color:var(--bg-2)]"
            }`}
          />
        ))}
      </div>
      <span className="w-6 text-right text-xs font-semibold text-[color:var(--ink)]">
        {value}/{max}
      </span>
    </div>
  );
}

type ScoresBlockProps = {
  scores: {
    endurance: number;
    hypertrophie: number;
    force: number;
    puissance: number;
  };
  labels: {
    endurance: string;
    hypertrophie: string;
    force: string;
    puissance: string;
  };
};

export function ScoresBlock({ scores, labels }: ScoresBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <ScoreBar label={labels.endurance} value={scores.endurance} />
      <ScoreBar label={labels.hypertrophie} value={scores.hypertrophie} />
      <ScoreBar label={labels.force} value={scores.force} />
      <ScoreBar label={labels.puissance} value={scores.puissance} />
    </div>
  );
}
