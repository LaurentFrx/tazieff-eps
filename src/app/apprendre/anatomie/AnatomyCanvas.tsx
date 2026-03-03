"use client";

import type { RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  wireframe: boolean;
  silhouetteOpacity: number;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string, groupKey: string) => void;
  bgRef: RefObject<HTMLDivElement | null>;
};

/* Sync CSS background with camera zoom (scale only, no crop at default). */
const REF_DIST = 3.0;
const TARGET_Y = 0.85;

function CameraSync({ bgRef }: Pick<Props, "bgRef">) {
  useFrame(({ camera }) => {
    const el = bgRef.current;
    if (!el) return;
    const dx = camera.position.x;
    const dy = camera.position.y - TARGET_Y;
    const dz = camera.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const scale = Math.max(1, REF_DIST / dist);
    el.style.transform = `scale(${scale.toFixed(4)})`;
  });
  return null;
}

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  wireframe,
  silhouetteOpacity,
  onHoverMuscle,
  onClickMuscle,
  bgRef,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, TARGET_Y, REF_DIST], fov: 55, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraSync bgRef={bgRef} />
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
        target={[0, TARGET_Y, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.8}
        maxDistance={REF_DIST}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
