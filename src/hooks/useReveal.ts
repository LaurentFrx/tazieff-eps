"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observe-once reveal hook. Returns a ref to attach to the element
 * and a boolean that flips to `true` once the element enters the viewport.
 *
 * Uses requestAnimationFrame to defer observation by one frame so the
 * browser paints the initial hidden state (opacity 0) before the
 * IntersectionObserver fires for elements already in the viewport.
 */
export function useReveal(delay = 0): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setVisible(true), delay);
            } else {
              setVisible(true);
            }
            observer.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(el);
    });
    return () => cancelAnimationFrame(raf);
  }, [delay]);

  return [ref, visible];
}
