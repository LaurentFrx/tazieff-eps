"use client";

const ROWS = [
  { dot: "#22c55e", title: "Charge lgre", sub: "< 60 % 1RM", reps: "15-20+ reps", theme: "Endurance", themeColor: "#22c55e" },
  { dot: "#3b82f6", title: "Charge modre", sub: "60-75 % 1RM", reps: "8-15 reps", theme: "Volume", themeColor: "#3b82f6" },
  { dot: "#f97316", title: "Charge lourde", sub: "> 80 % 1RM", reps: "1-6 reps", theme: "Puissance", themeColor: "#f97316" },
];

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnChargeReps() {
  return (
    <div className="rounded-2xl p-1 bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.06] dark:border-white/[0.06]">
      {ROWS.map((row, i) => (
        <div
          key={row.title}
          className="flex items-center p-3 gap-3"
          style={i < ROWS.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : undefined}
        >
          <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: row.dot }} />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{row.title}</span>
            <span className="block text-[11px] text-zinc-500">{row.sub} · {row.reps}</span>
          </span>
          <span
            className="text-[11px] px-[10px] py-1 rounded-full shrink-0"
            style={{
              background: `rgba(${hexToRgb(row.themeColor)},0.1)`,
              color: row.themeColor,
              border: `1px solid rgba(${hexToRgb(row.themeColor)},0.15)`,
            }}
          >
            {row.theme}
          </span>
        </div>
      ))}
    </div>
  );
}
