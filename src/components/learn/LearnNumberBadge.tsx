"use client";

type Props = { number: number; accentColor: string };

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnNumberBadge({ number, accentColor }: Props) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{
        background: `rgba(${hexToRgb(accentColor)},0.08)`,
        border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
      }}
    >
      <span className="font-mono text-[18px] font-medium" style={{ color: accentColor }}>{number}</span>
    </span>
  );
}
