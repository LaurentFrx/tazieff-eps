"use client";
import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

export function AnimatedCount({
  target,
  duration = 800,
}: {
  target: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
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
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const count = useCountUp(target, visible, duration);
  return <span ref={ref}>{count}</span>;
}
