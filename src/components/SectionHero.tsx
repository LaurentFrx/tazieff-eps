import type { ReactNode } from "react";

interface SectionHeroProps {
  title: string;
  count?: number;
  subtitle?: string;
  gradient: string;
  illustration: ReactNode;
}

export function SectionHero({ title, count, subtitle, gradient, illustration }: SectionHeroProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-5 py-6 min-h-[110px] flex flex-col justify-end shadow-lg`}
    >
      {illustration}
      <div className="relative z-10 flex items-end gap-3">
        <h1 className="text-2xl font-extrabold text-white drop-shadow-sm">{title}</h1>
        {count !== undefined && (
          <span className="text-3xl font-black text-white/90 drop-shadow-sm tabular-nums">{count}</span>
        )}
      </div>
      {subtitle && (
        <p className="relative z-10 text-sm text-white/80 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
