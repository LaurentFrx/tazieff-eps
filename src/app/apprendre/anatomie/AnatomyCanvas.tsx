"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selected: string | null;
  antagonist: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export default function AnatomyCanvas({
  selected,
  antagonist,
  hovered,
  onSelect,
  onHover,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 2.5], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <HologramMannequin
        selected={selected}
        antagonist={antagonist}
        hovered={hovered}
        onSelect={onSelect}
        onHover={onHover}
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.5}
        maxDistance={4}
        autoRotate={!selected}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
