"use client";

type Item = { label: string; correct: string; incorrect: string };
type Props = { items: Item[] };

export function LearnCorrectIncorrect({ items }: Props) {
  return (
    <div className="flex flex-col gap-[6px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex justify-between items-center p-[9px_12px] rounded-[10px] bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.04] dark:border-white/[0.04]"
        >
          <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{item.label}</span>
          <span className="flex gap-[6px]">
            <span
              className="text-[11px] px-[10px] py-[3px] rounded-full"
              style={{
                background: "rgba(80,200,120,0.1)",
                color: "#50c878",
                border: "1px solid rgba(80,200,120,0.15)",
              }}
            >
              {item.correct}
            </span>
            <span
              className="text-[11px] px-[10px] py-[3px] rounded-full"
              style={{
                background: "rgba(255,60,60,0.08)",
                color: "#ff5555",
                border: "1px solid rgba(255,60,60,0.12)",
              }}
            >
              {item.incorrect}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
