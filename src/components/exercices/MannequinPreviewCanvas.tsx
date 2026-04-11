"use client";

/**
 * Minimal R3F Canvas for mannequin preview.
 * Dynamically imported (ssr: false) — only loaded on user tap.
 * Disposes WebGL context on unmount to prevent context loss.
 */

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import MannequinPreviewScene from "./MannequinPreviewScene";

type Props = {
  activeGroups: string[];
  rotationY: number;
  onFrameComputed?: (containerHeight: number) => void;
};

export default function MannequinPreviewCanvas({ activeGroups, rotationY, onFrameComputed }: Props) {
  const glRef = useRef<RootState["gl"] | null>(null);

  // Dispose WebGL context on unmount
  useEffect(() => {
    return () => {
      const gl = glRef.current;
      if (gl) {
        gl.dispose();
        gl.forceContextLoss();
        glRef.current = null;
      }
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 1.0, 1.8], fov: 45, near: 0.01, far: 100 }}
      gl={{ antialias: true, stencil: true }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => { glRef.current = gl; }}
    >
      <MannequinPreviewScene activeGroups={activeGroups} rotationY={rotationY} onFrameComputed={onFrameComputed} />
    </Canvas>
  );
}
