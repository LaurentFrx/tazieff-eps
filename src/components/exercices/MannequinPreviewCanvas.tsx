"use client";

/**
 * Minimal R3F Canvas that renders a static mannequin preview.
 * No background, no shadows, no controls, frameloop="demand".
 * Dynamically imported by ExerciseMannequin3D (ssr: false).
 */

import { Canvas } from "@react-three/fiber";
import MannequinPreviewScene from "./MannequinPreviewScene";

type Props = {
  activeGroups: string[];
  rotationY: number;
};

export default function MannequinPreviewCanvas({ activeGroups, rotationY }: Props) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [0, 0.8, 2.0], fov: 50, near: 0.01, far: 100 }}
      gl={{ antialias: true, stencil: false, alpha: true }}
      style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
    >
      <MannequinPreviewScene activeGroups={activeGroups} rotationY={rotationY} />
    </Canvas>
  );
}
