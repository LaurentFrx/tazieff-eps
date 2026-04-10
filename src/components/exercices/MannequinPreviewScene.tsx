"use client";

/**
 * Lightweight Three.js scene that renders only the HologramMannequin
 * in a fixed pose — no background, no shadows, no controls.
 * Used as the miniature preview on exercise detail pages.
 * Must be rendered inside a R3F <Canvas>.
 */

import { useRef, useCallback, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import HologramMannequin from "@/app/[locale]/apprendre/anatomie/HologramMannequin";
import { getGroupForNode } from "@/app/[locale]/apprendre/anatomie/anatomy-data";

type Props = {
  activeGroups: string[];
  rotationY: number;
  onFrameComputed?: (containerHeight: number) => void;
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

export default function MannequinPreviewScene({ activeGroups, rotationY, onFrameComputed }: Props) {
  const mannequinRef = useRef<THREE.Group>(null);
  const centeredRef = useRef(false);
  const waitFramesRef = useRef(0);
  const { camera } = useThree();

  const noop = useCallback(() => {}, []);
  const groupColorMap = useMemo(() => buildGroupColorMap(activeGroups), [activeGroups]);

  // Center mannequin + frame camera on active muscles once GLBs are loaded
  useFrame(() => {
    if (centeredRef.current) return;
    const m = mannequinRef.current;
    if (!m) return;
    const fullBox = new THREE.Box3().setFromObject(m);
    if (fullBox.isEmpty()) return;

    // Compute bounding box of active muscles
    const activeBox = new THREE.Box3();
    let hasActiveMesh = false;
    m.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name) {
        const groupKey = getGroupForNode(child.name);
        if (groupKey && activeGroups.includes(groupKey)) {
          activeBox.expandByObject(child);
          hasActiveMesh = true;
        }
      }
    });

    // Wait up to ~0.5s for muscle meshes to load if we expect them
    if (!hasActiveMesh && activeGroups.length > 0) {
      waitFramesRef.current++;
      if (waitFramesRef.current < 30) return;
    }

    // Anchor feet to y=0
    m.position.y -= fullBox.min.y;

    // Recompute after repositioning
    if (hasActiveMesh) {
      activeBox.makeEmpty();
      m.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.name) {
          const groupKey = getGroupForNode(child.name);
          if (groupKey && activeGroups.includes(groupKey)) {
            activeBox.expandByObject(child);
          }
        }
      });
    }
    const targetBox = hasActiveMesh ? activeBox : new THREE.Box3().setFromObject(m);
    const center = targetBox.getCenter(new THREE.Vector3());
    const size = targetBox.getSize(new THREE.Vector3());

    // Frame the active muscles with 40% padding
    const maxDim = Math.max(size.x, size.y) * 1.4;
    const fovRad = THREE.MathUtils.degToRad(
      (camera as THREE.PerspectiveCamera).fov,
    );
    const dist = Math.max(maxDim / (2 * Math.tan(fovRad / 2)), 1.2);

    camera.position.set(0, center.y, dist);
    camera.lookAt(0, center.y, 0);
    camera.updateProjectionMatrix();

    // Report dynamic container height
    if (onFrameComputed) {
      const ratio = size.y / Math.max(size.x, 0.01);
      const h = Math.min(350, Math.max(250, ratio * 280));
      setTimeout(() => onFrameComputed(h), 0);
    }

    centeredRef.current = true;
  });

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
            showWireframe={false}
            showMuscles={true}
            onHoverMuscle={noop}
            onClickMuscle={noop}
            onLongPressMuscle={noop}
            ambientIntensity={0.9}
            mainLightIntensity={1.0}
            groupColorMap={groupColorMap}
          />
        </group>
      </group>
    </group>
  );
}
