"use client";

type Param = { value: string; label: string };
type Props = { params: Param[] };

export function LearnParamGrid({ params }: Props) {
  return (
    <div className="grid grid-cols-3 gap-[6px]">
      {params.map((p) => (
        <div
          key={p.label}
          className="rounded-xl p-[12px_8px] text-center"
          style={{
            background: "rgba(0,229,255,0.04)",
            border: "1px solid rgba(0,229,255,0.08)",
          }}
        >
          <p className="text-[20px] font-medium font-mono text-cyan-600 dark:text-cyan-400">{p.value}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{p.label}</p>
        </div>
      ))}
    </div>
  );
}
