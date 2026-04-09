"use client";

/**
 * Lightweight Three.js scene that renders only the HologramMannequin
 * in a fixed pose — no background, no shadows, no controls.
 * Used as the miniature preview on exercise detail pages.
 * Must be rendered inside a R3F <Canvas>.
 */

import { useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import HologramMannequin from "@/app/[locale]/apprendre/anatomie/HologramMannequin";

type Props = {
  activeGroups: string[];
  rotationY: number;
};

export default function MannequinPreviewScene({ activeGroups, rotationY }: Props) {
  const mannequinRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  const noop = useCallback(() => {}, []);

  // Center mannequin (anchor feet to y=0) after GLB loads
  useEffect(() => {
    const m = mannequinRef.current;
    if (!m) return;
    const id = requestAnimationFrame(() => {
      const box = new THREE.Box3().setFromObject(m);
      if (box.isEmpty()) return;
      m.position.y -= box.min.y;
      // Trigger a re-render after repositioning
      invalidate();
    });
    return () => cancelAnimationFrame(id);
  }, [invalidate]);

  return (
    <group rotation-y={rotationY}>
      <group ref={mannequinRef}>
        <group scale={0.55} position={[0, 0, -0.15]}>
          <HologramMannequin
            selectedGroup={null}
            highlightedMuscle={null}
            activeGroups={activeGroups}
            hoveredMuscle={null}
            wireframe={false}
            showSkeleton={false}
            showWireframe={true}
            showMuscles={true}
            onHoverMuscle={noop}
            onClickMuscle={noop}
            onLongPressMuscle={noop}
            silhouetteOpacity={0.12}
            ambientIntensity={0.9}
            mainLightIntensity={1.0}
          />
        </group>
      </group>
    </group>
  );
}
