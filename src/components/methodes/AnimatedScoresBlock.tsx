"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  scores: {
    endurance: number;
    hypertrophie: number;
    force: number;
    puissance: number;
  };
  labels: {
    endurance: string;
    hypertrophie: string;
    force: string;
    puissance: string;
  };
  max?: number;
};

export function AnimatedScoresBlock({ scores, labels, max = 5 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const entries = [
    { label: labels.endurance, value: scores.endurance },
    { label: labels.hypertrophie, value: scores.hypertrophie },
    { label: labels.force, value: scores.force },
    { label: labels.puissance, value: scores.puissance },
  ];

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <div key={entry.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-[color:var(--muted)]">
            {entry.label}
          </span>
          <div className="relative flex-1 h-2 rounded-full bg-[color:var(--bg-2)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--accent)]"
              style={{
                width: visible ? `${(entry.value / max) * 100}%` : "0%",
                transition: "width 0.8s ease-out",
                transitionDelay: `${i * 100}ms`,
              }}
            />
          </div>
          <span className="w-6 text-right text-xs font-semibold text-[color:var(--ink)]">
            {entry.value}/{max}
          </span>
        </div>
      ))}
    </div>
  );
}
