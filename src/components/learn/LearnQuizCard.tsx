"use client";

import { useState } from "react";

type Props = {
  question: string;
  answer: string;
  color: string;
};

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function LearnQuizCard({ question, answer, color }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed(!revealed)}
      className="w-full flex justify-between items-center p-[14px_16px] rounded-[14px] text-left transition-colors duration-200 bg-white/[0.02] dark:bg-white/[0.02]"
      style={{
        border: revealed ? `1px solid rgba(${hexToRgb(color)},0.4)` : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{question}</span>
      <span
        className="text-[12px] font-medium transition-opacity duration-200"
        style={{ color, opacity: revealed ? 1 : 0.3 }}
      >
        {answer}
      </span>
    </button>
  );
}
