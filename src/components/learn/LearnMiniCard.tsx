"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  accentColor: string;
};

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnMiniCard({ label, children, accentColor }: Props) {
  return (
    <div
      className="rounded-[10px] p-[10px_12px]"
      style={{
        background: `rgba(${hexToRgb(accentColor)},0.04)`,
        border: `1px solid rgba(${hexToRgb(accentColor)},0.08)`,
      }}
    >
      <p className="text-[11px] font-medium" style={{ color: accentColor }}>{label}</p>
      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">{children}</p>
    </div>
  );
}
