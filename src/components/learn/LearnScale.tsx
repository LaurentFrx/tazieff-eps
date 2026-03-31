"use client";

type Level = { value: string; label: string; color: string };
type Props = { levels: Level[]; accentColor: string };

export function LearnScale({ levels, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-[4px]">
      {levels.map((lvl) => (
        <div key={lvl.value} className="flex items-center gap-3 p-[6px_12px] rounded-[8px]">
          <span className="w-[3px] h-5 rounded-full shrink-0" style={{ background: lvl.color }} />
          <span className="font-mono text-[14px] font-medium min-w-[36px]" style={{ color: accentColor }}>{lvl.value}</span>
          <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{lvl.label}</span>
        </div>
      ))}
    </div>
  );
}
