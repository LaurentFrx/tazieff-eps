"use client";

type Session = { day: string; title: string; detail: string };
type Props = { sessions: Session[]; accentColor: string };

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnWeekProgram({ sessions, accentColor }: Props) {
  return (
    <div className="flex flex-col gap-[6px]">
      {sessions.map((s) => (
        <div
          key={s.day + s.title}
          className="flex items-start gap-3 p-[10px_14px] rounded-xl bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.04] dark:border-white/[0.04]"
        >
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide min-w-[32px] pt-0.5">
            {s.day}
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] font-medium" style={{ color: accentColor }}>{s.title}</span>
            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">{s.detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
