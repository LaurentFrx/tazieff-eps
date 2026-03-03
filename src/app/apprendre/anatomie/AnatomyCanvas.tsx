"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  wireframe: boolean;
  silhouetteOpacity: number;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string, groupKey: string) => void;
};

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  wireframe,
  silhouetteOpacity,
  onHoverMuscle,
  onClickMuscle,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 2.2], fov: 45, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{
        antialias: true,
        alpha: true,
      }}
    >
      <HologramMannequin
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        hoveredMuscle={null}
        wireframe={wireframe}
        silhouetteOpacity={silhouetteOpacity}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
      />
      <OrbitControls
        target={[0, 0.85, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={5}
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
