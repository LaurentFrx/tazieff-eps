"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up from 0 to `target` over `duration` ms.
 * Uses ease-out cubic curve. Only starts when `trigger` is true.
 */
export function useCountUp(target: number, trigger: boolean, duration = 1000): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const progress = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * progress));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, target, duration]);

  return value;
}
