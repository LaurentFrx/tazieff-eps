"use client";

import { useState } from "react";
import { LearnMethodChips } from "./LearnMethodChips";

type Method = { label: string; href: string };
type Props = {
  title: string;
  subtitle: string;
  color: "green" | "blue" | "orange";
  description: string;
  methods: Method[];
};

const COLORS = {
  green: { main: "#22c55e", light: "#4ade80" },
  blue: { main: "#3b82f6", light: "#60a5fa" },
  orange: { main: "#f97316", light: "#fb923c" },
};

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnThemeCard({ title, subtitle, color, description, methods }: Props) {
  const [open, setOpen] = useState(false);
  const c = COLORS[color];

  return (
    <div
      className="p-[14px_16px]"
      style={{
        background: `rgba(${hexToRgb(c.main)},0.04)`,
        border: `1px solid rgba(${hexToRgb(c.main)},0.12)`,
        borderLeft: `3px solid ${c.main}`,
        borderRadius: "0 16px 16px 0",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-[14px] text-zinc-800 dark:text-zinc-200">{title}</span>
          <span className="block text-[11px] text-zinc-500">{subtitle}</span>
        </span>
        <svg
          width="16"
          height="16"
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
          <div
            className="pt-3 flex flex-col gap-3"
            style={{ borderTop: `1px solid rgba(${hexToRgb(c.main)},0.08)`, marginTop: "12px" }}
          >
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">{description}</p>
            <LearnMethodChips methods={methods} accentColor={c.main} />
          </div>
        </div>
      </div>
    </div>
  );
}
