"use client";

type Props = {
  name: string;
  role: string;
  antagonist?: string;
};

export function LearnMuscleRow({ name, role, antagonist }: Props) {
  return (
    <div className="flex items-center gap-3 p-[10px_12px] rounded-[10px] bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.04] dark:border-white/[0.04]">
      <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200 min-w-[100px] shrink-0">{name}</span>
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex-1">{role}</span>
      {antagonist && (
        <span
          className="text-[11px] rounded-full px-[8px] py-[2px] shrink-0"
          style={{ background: "rgba(123,47,255,0.08)", color: "#a070ff", border: "1px solid rgba(123,47,255,0.15)" }}
        >
          ↔ {antagonist}
        </span>
      )}
    </div>
  );
}
