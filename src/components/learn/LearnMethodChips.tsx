"use client";

import { LocaleLink } from "@/components/LocaleLink";

type Method = { label: string; href: string };
type Props = { methods: Method[]; accentColor: string };

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const LIGHT_MAP: Record<string, string> = {
  "#00E5FF": "#00E5FF",
  "#7B2FFF": "#a070ff",
  "#FF006E": "#ff4090",
  "#22c55e": "#4ade80",
  "#3b82f6": "#60a5fa",
  "#f97316": "#fb923c",
};

export function LearnMethodChips({ methods, accentColor }: Props) {
  const textColor = LIGHT_MAP[accentColor] ?? accentColor;

  return (
    <div className="flex flex-wrap gap-[6px]">
      {methods.map((m) => (
        <LocaleLink
          key={m.href}
          href={m.href}
          className="text-[11px] px-3 py-[5px] rounded-full transition-opacity hover:opacity-80"
          style={{
            background: `rgba(${hexToRgb(accentColor)},0.08)`,
            color: textColor,
            border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
          }}
        >
          {m.label}
        </LocaleLink>
      ))}
    </div>
  );
}
