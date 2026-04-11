"use client";
import { useRef, useLayoutEffect } from "react";

/**
 * Reveal-on-scroll hook using IntersectionObserver (no scroll listener).
 * Elements above the fold on mount stay visible. Elements below are
 * hidden then animated in when they enter ~85% of the viewport.
 */
export function useReveal(delay = 0) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already visible on screen? Leave it as-is (no flash)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) return;

    // Not yet visible: hide the element
    el.style.opacity = "0";
    el.style.transform = "translateY(60px) scale(0.97)";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setTimeout(() => {
            el.style.transition =
              "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)";
            el.style.opacity = "1";
            el.style.transform = "none";
          }, delay);
        }
      },
      { rootMargin: "-15% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}
