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

/* Sync CSS background transform with camera for parallax illusion.
   BASE_SCALE > 1 lets the background shrink on zoom-out while still
   filling the viewport (the -20 % inset buffer covers the remainder). */
const BASE_SCALE = 1.4;
const REF_DIST = 2.2;

function CameraSync({ bgRef }: Pick<Props, "bgRef">) {
  useFrame(({ camera }) => {
    const el = bgRef.current;
    if (!el) return;
    const dx = camera.position.x;
    const dy = camera.position.y - 0.7;
    const dz = camera.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const scale = BASE_SCALE * (REF_DIST / dist);
    const azimuth = Math.atan2(dx, dz);
    const offsetX = -(azimuth / Math.PI) * 5;
    el.style.transform = `scale(${scale.toFixed(4)}) translateX(${offsetX.toFixed(2)}%)`;
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
      camera={{ position: [0, 0.7, 2.2], fov: 50, near: 0.01, far: 100 }}
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
        target={[0, 0.7, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={3.5}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
