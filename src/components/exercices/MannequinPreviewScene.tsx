"use client";

/**
 * Lightweight Three.js scene that renders only the HologramMannequin
 * in a fixed pose — no background, no shadows, no controls.
 * Used as the miniature preview on exercise detail pages.
 * Must be rendered inside a R3F <Canvas>.
 */

import { useRef, useCallback, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import HologramMannequin from "@/app/[locale]/apprendre/anatomie/HologramMannequin";
import { getGroupForMeshNode, MUSCLE_GROUP_COLORS, type MuscleGroupId } from "@/lib/exercices/muscleGroups";

type Props = {
  activeGroups: string[];
  rotationY: number;
  onFrameComputed?: (containerHeight: number) => void;
};

/** Build mapping: group key → hex color */
function buildGroupColorMap(activeGroups: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of activeGroups) {
    const color = MUSCLE_GROUP_COLORS[key as MuscleGroupId];
    if (color) {
      map[key] = color;
    }
  }
  return map;
}

export default function MannequinPreviewScene({ activeGroups, rotationY, onFrameComputed }: Props) {
  const mannequinRef = useRef<THREE.Group>(null);
  const centeredRef = useRef(false);
  const waitFramesRef = useRef(0);
  const pendingHeightRef = useRef<number | null>(null);
  const { camera, invalidate } = useThree();
  const activeGroupsRef = useRef(activeGroups);
  activeGroupsRef.current = activeGroups;

  const noop = useCallback(() => {}, []);
  const groupColorMap = useMemo(() => buildGroupColorMap(activeGroups), [activeGroups]);

  // Reset centering when activeGroups change (e.g. session navigation)
  useEffect(() => {
    centeredRef.current = false;
    waitFramesRef.current = 0;
    invalidate();
  }, [activeGroups, invalidate]);

  // Flush pending height update outside the render loop to avoid layout thrashing
  useEffect(() => {
    if (pendingHeightRef.current !== null && onFrameComputed) {
      onFrameComputed(pendingHeightRef.current);
      pendingHeightRef.current = null;
    }
  });

  // Center mannequin + frame camera on active muscles once GLBs are loaded
  useFrame(() => {
    if (centeredRef.current) return;
    // Keep requesting frames until centering is done
    invalidate();
    const m = mannequinRef.current;
    if (!m) return;
    const groups = activeGroupsRef.current;
    const fullBox = new THREE.Box3().setFromObject(m);
    if (fullBox.isEmpty()) return;

    // Compute bounding box of active muscles
    const activeBox = new THREE.Box3();
    let hasActiveMesh = false;
    m.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name) {
        const groupKey = getGroupForMeshNode(child.name);
        if (groupKey && groups.includes(groupKey)) {
          activeBox.expandByObject(child);
          hasActiveMesh = true;
        }
      }
    });

    // Wait up to ~0.5s for muscle meshes to load if we expect them
    if (!hasActiveMesh && groups.length > 0) {
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
          const groupKey = getGroupForMeshNode(child.name);
          if (groupKey && groups.includes(groupKey)) {
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

    // Store height for next React commit (avoid setState inside useFrame)
    if (onFrameComputed) {
      const ratio = size.y / Math.max(size.x, 0.01);
      pendingHeightRef.current = Math.min(350, Math.max(250, ratio * 280));
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
