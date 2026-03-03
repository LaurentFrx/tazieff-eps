"use client";

import type { RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string, groupKey: string) => void;
  bgRef: RefObject<HTMLDivElement | null>;
};

/* Camera target at the mannequin's feet so they stay fixed during zoom.
   Background is oversized (140 % height) and bottom-aligned so the
   shadow line on the deck matches the viewport center (= feet). */
const REF_DIST = 3.0;

function CameraSync({ bgRef }: Pick<Props, "bgRef">) {
  useFrame(({ camera }) => {
    const el = bgRef.current;
    if (!el) return;
    const { x, y, z } = camera.position;
    const dist = Math.sqrt(x * x + y * y + z * z);
    const scale = Math.max(1, REF_DIST / dist);
    el.style.transform = `scale(${scale.toFixed(4)})`;
  });
  return null;
}

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  bgRef,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, REF_DIST], fov: 60, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraSync bgRef={bgRef} />
      <HologramMannequin
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        hoveredMuscle={null}
        wireframe={false}
        silhouetteOpacity={0.4}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
      />
      <OrbitControls
        target={[0, 0, 0]}
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
