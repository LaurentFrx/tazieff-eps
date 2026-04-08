"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SPRING = "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)";
const HIDDEN = "translateY(60px) scale(0.97)";

/**
 * Observe-once reveal hook using useLayoutEffect to avoid flash.
 * Elements above the fold are shown instantly (no animation).
 * Elements below the fold animate in when they enter the viewport.
 * Returns [ref, visible] — attach ref to the element, the hook
 * manages all styles imperatively via el.style.
 */
export function useReveal(delay = 0): [
  React.RefObject<HTMLElement | null>,
  boolean,
] {
  const ref = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [visible, setVisible] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const isAboveFold = rect.top < window.innerHeight + 100;

    if (isAboveFold) {
      // Above the fold: show immediately, no animation, no flash
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.transition = "none";
      setVisible(true);
      return;
    }

    // Below the fold: hide before paint, animate on scroll
    el.style.opacity = "0";
    el.style.transform = HIDDEN;
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = SPRING;
          if (delay > 0) el.style.transitionDelay = `${delay}ms`;
          el.style.opacity = "1";
          el.style.transform = "none";
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [delay]);

  return [ref, visible];
}
