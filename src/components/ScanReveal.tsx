"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAnatomyAnim } from "@/lib/storage";

const SCAN_DURATION = 3000;
const SCAN_DELAY = 200;
const GRADIENT_SIZE = 30;

export function ScanReveal({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [scanY, setScanY] = useState(0);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !getAnatomyAnim()) {
      setPhase("done");
      return;
    }
    setEnabled(true);
  }, []);

  const startScan = useCallback(() => {
    if (!containerRef.current) return;
    setPhase("scanning");
    const containerH = containerRef.current.offsetHeight;
    const viewportH = window.innerHeight;
    const targetY = Math.min(containerH, viewportH);

    startTimeRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / SCAN_DURATION, 1);
      setScanY(progress * targetY);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase("done");
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(startScan, SCAN_DELAY);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, startScan]);

  // Fade-in below-fold sections via IntersectionObserver
  useEffect(() => {
    if (phase !== "done" || !containerRef.current) return;

    const sections = containerRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "none";
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [phase]);

  if (!enabled) {
    return <div>{children}</div>;
  }

  const isDone = phase === "done";

  return (
    <div ref={containerRef} className="scan-reveal-container" style={{ position: "relative" }}>
      {/* Scan line */}
      {phase === "scanning" && (
        <div
          data-testid="scan-line"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "1px",
            transform: `translateY(${scanY}px)`,
            background: "rgba(255,255,255,0.6)",
            boxShadow: "0 0 6px 2px rgba(0,229,255,0.4), 0 0 20px 8px rgba(0,229,255,0.1)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* Content with progressive mask */}
      <div
        style={
          isDone
            ? undefined
            : {
                maskImage: `linear-gradient(to bottom, black ${Math.max(0, scanY - GRADIENT_SIZE)}px, transparent ${scanY + GRADIENT_SIZE}px)`,
                WebkitMaskImage: `linear-gradient(to bottom, black ${Math.max(0, scanY - GRADIENT_SIZE)}px, transparent ${scanY + GRADIENT_SIZE}px)`,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
