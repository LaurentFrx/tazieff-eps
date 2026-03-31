"use client";

import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function LearnWarning({ children }: Props) {
  return (
    <div
      className="flex gap-[10px] items-start rounded-[10px] p-[10px_12px]"
      style={{
        background: "rgba(255,160,0,0.06)",
        border: "1px solid rgba(255,160,0,0.12)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="text-[11px] leading-snug" style={{ color: "#dda040" }}>{children}</p>
    </div>
  );
}
