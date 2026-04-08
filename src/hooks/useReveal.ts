"use client";

import { useEffect, useRef, useState } from "react";

const SPRING = "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)";
const HIDDEN = "translateY(60px) scale(0.97)";

/**
 * Observe-once reveal hook.
 * Returns [ref, visible, style] — attach ref to the element,
 * spread style on it for guaranteed inline animation.
 */
export function useReveal(delay = 0): [
  React.RefObject<HTMLElement | null>,
  boolean,
  React.CSSProperties,
] {
  const ref = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply hidden state immediately via DOM to avoid FOUC
    el.style.opacity = "0";
    el.style.transform = HIDDEN;
    el.style.transition = SPRING;
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;

    // Double-RAF ensures browser paints opacity:0 before observing
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisible(true);
              observerRef.current?.disconnect();
            }
          },
          { threshold: 0.05 },
        );
        observerRef.current.observe(el);
      });
    });

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
    };
  }, [delay]);

  // Apply visible state via DOM imperatively for immediate effect
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    el.style.opacity = "1";
    el.style.transform = "none";
  }, [visible]);

  // Style object for SSR initial render (hidden)
  const style: React.CSSProperties = visible
    ? { opacity: 1, transform: "none", transition: SPRING }
    : { opacity: 0, transform: HIDDEN, transition: SPRING };

  return [ref, visible, style];
}
