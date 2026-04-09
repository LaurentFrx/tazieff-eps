"use client";
import { useRef, useLayoutEffect } from "react";

export function useReveal(delay = 0) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already visible on screen? Leave it as-is (no flash)
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.8;

    if (alreadyVisible) {
      return;
    }

    // Not yet visible: hide the element
    el.style.opacity = "0";
    el.style.transform = "translateY(60px) scale(0.97)";

    // Listen for scroll to reveal
    function onScroll() {
      const r = el!.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85) {
        setTimeout(() => {
          el!.style.transition =
            "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)";
          el!.style.opacity = "1";
          el!.style.transform = "none";
        }, delay);
        window.removeEventListener("scroll", onScroll, true);
      }
    }

    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [delay]);

  return ref;
}
