"use client";

/**
 * Lightweight Three.js scene that renders only the HologramMannequin
 * in a fixed pose — no background, no shadows, no controls.
 * Used as the miniature preview on exercise detail pages.
 * Must be rendered inside a R3F <Canvas>.
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import HologramMannequin from "@/app/[locale]/apprendre/anatomie/HologramMannequin";

type Props = {
  activeGroups: string[];
  rotationY: number;
};

/* ── Map anatomy-data group keys → simplified 5-group legend colors ─── */

const GROUP_COLORS: Record<string, string> = {
  dos: "#3b82f6",
  "membres-inferieurs": "#22c55e",
  "membres-superieurs": "#f97316",
  abdominaux: "#a855f7",
  pectoraux: "#ef4444",
};

const ANATOMY_TO_SIMPLIFIED: Record<string, string> = {
  pectoraux: "pectoraux",
  epaules: "membres-superieurs",
  bras_anterieurs: "membres-superieurs",
  triceps: "membres-superieurs",
  abdominaux: "abdominaux",
  dos: "dos",
  fessiers: "membres-inferieurs",
  cuisses_avant: "membres-inferieurs",
  cuisses_arriere: "membres-inferieurs",
  adducteurs: "membres-inferieurs",
  mollets: "membres-inferieurs",
  flechisseurs: "membres-inferieurs",
};

/** Build mapping: anatomy groupKey → hex color matching the 5-group legend */
function buildGroupColorMap(activeGroups: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of activeGroups) {
    const simplified = ANATOMY_TO_SIMPLIFIED[key];
    if (simplified && GROUP_COLORS[simplified]) {
      map[key] = GROUP_COLORS[simplified];
    }
  }
  return map;
}

export default function MannequinPreviewScene({ activeGroups, rotationY }: Props) {
  const mannequinRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  const noop = useCallback(() => {}, []);

  const groupColorMap = useMemo(() => buildGroupColorMap(activeGroups), [activeGroups]);

  // Center mannequin (anchor feet to y=0) after GLB loads
  useEffect(() => {
    const m = mannequinRef.current;
    if (!m) return;
    const id = requestAnimationFrame(() => {
      const box = new THREE.Box3().setFromObject(m);
      if (box.isEmpty()) return;
      m.position.y -= box.min.y;
      invalidate();
    });
    return () => cancelAnimationFrame(id);
  }, [invalidate]);

  return (
    <group rotation-y={rotationY}>
      <group ref={mannequinRef}>
        <group scale={1.5} position={[0, 0, -0.15]}>
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
            groupColorMap={groupColorMap}
          />
        </group>
      </group>
    </group>
  );
}
