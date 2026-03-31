"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentColor: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function LearnAccordion({ title, subtitle, icon, accentColor, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl border p-4 transition-colors bg-white/[0.03] border-white/[0.06] dark:bg-white/[0.03] dark:border-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.12]"
      style={{ ["--acc" as string]: accentColor }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `rgba(${hexToRgb(accentColor)},0.08)`,
            border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
          }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium text-zinc-800 dark:text-zinc-100">{title}</span>
          <span className="block text-[11px] text-zinc-500">{subtitle}</span>
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pt-4 flex flex-col gap-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
