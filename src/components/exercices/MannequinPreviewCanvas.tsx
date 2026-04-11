"use client";

/**
 * Minimal R3F Canvas that renders a static mannequin preview.
 * No background, no shadows, no controls.
 * Dynamically imported by ExerciseMannequin3D (ssr: false).
 *
 * Uses a ResizeObserver to feed explicit pixel dimensions to the
 * Canvas — avoids the "0×0 canvas on Windows Chrome" bug where
 * percentage-based sizing resolves too late for WebGL init.
 */

import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import MannequinPreviewScene from "./MannequinPreviewScene";

type Props = {
  activeGroups: string[];
  rotationY: number;
  onFrameComputed?: (containerHeight: number) => void;
};

export default function MannequinPreviewCanvas({ activeGroups, rotationY, onFrameComputed }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    };

    // Initial measure
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {size && (
        <Canvas
          camera={{ position: [0, 1.0, 1.8], fov: 45, near: 0.01, far: 100 }}
          gl={{ antialias: true, stencil: true, alpha: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
          style={{ position: "absolute", top: 0, left: 0, width: size.w, height: size.h, background: "transparent", pointerEvents: "none" }}
        >
          <MannequinPreviewScene activeGroups={activeGroups} rotationY={rotationY} onFrameComputed={onFrameComputed} />
        </Canvas>
      )}
    </div>
  );
}
