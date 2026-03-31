"use client";

type Row = { param: string; value: string };
type Props = { rows: Row[] };

export function LearnParamTable({ rows }: Props) {
  return (
    <div className="rounded-xl overflow-hidden bg-white/[0.02] dark:bg-white/[0.02]">
      <div
        className="flex justify-between p-[8px_12px] text-[11px] font-medium tracking-wide uppercase"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <span className="text-zinc-500 dark:text-zinc-400">Paramètre</span>
        <span className="text-zinc-500 dark:text-zinc-400">Valeur</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.param}
          className="flex justify-between items-center p-[8px_12px]"
          style={i < rows.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : undefined}
        >
          <span className="text-[12px] text-zinc-600 dark:text-zinc-300">{row.param}</span>
          <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-100">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
