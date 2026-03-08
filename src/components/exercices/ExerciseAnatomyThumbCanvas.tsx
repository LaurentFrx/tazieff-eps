"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MUSCLE_GROUPS, getGroupForNode } from "@/app/apprendre/anatomie/anatomy-data";

/* Draco decoder — idempotent, same path as HologramMannequin */
useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

type Props = {
  groupKeys: string[];
  posterior: boolean;
  onLoaded: () => void;
};

/* ── Static mannequin with highlighted groups ──────────────────────────── */

function StaticMannequin({
  groupKeys,
  onLoaded,
}: {
  groupKeys: string[];
  onLoaded: () => void;
}) {
  const { scene: musclesOrig } = useGLTF("/models/muscles.glb");
  const { scene: silhouetteOrig } = useGLTF("/models/silhouette.glb");
  const { invalidate } = useThree();
  const initialized = useRef(false);

  /* Clone scenes to avoid shared state with anatomy page */
  const musclesScene = useMemo(() => musclesOrig.clone(true), [musclesOrig]);
  const silhouetteScene = useMemo(() => silhouetteOrig.clone(true), [silhouetteOrig]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const activeGroups = new Set(groupKeys);

    musclesScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const rawName = mesh.name || mesh.parent?.name || "unknown";
      const groupKey = getGroupForNode(rawName);

      if (groupKey && activeGroups.has(groupKey)) {
        const color = new THREE.Color(MUSCLE_GROUPS[groupKey].color);
        mesh.material = new THREE.MeshPhongMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.5),
          shininess: 30,
          side: THREE.DoubleSide,
        });
      } else {
        mesh.material = new THREE.MeshPhongMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.06,
          side: THREE.DoubleSide,
        });
      }
      mesh.renderOrder = 1;
    });

    silhouetteScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: 0x9b7340,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
        side: THREE.BackSide,
        depthWrite: false,
      });
      (child as THREE.Mesh).renderOrder = -2;
    });

    invalidate();
    onLoaded();
  }, [groupKeys, musclesScene, silhouetteScene, invalidate, onLoaded]);

  return (
    <group scale={1.3}>
      <primitive object={silhouetteScene} />
      <primitive object={musclesScene} />
    </group>
  );
}

/* ── Canvas wrapper ────────────────────────────────────────────────────── */

export default function ExerciseAnatomyThumbCanvas({
  groupKeys,
  posterior,
  onLoaded,
}: Props) {
  const cameraZ = posterior ? -3.5 : 3.5;

  return (
    <Canvas
      frameloop="demand"
      camera={{
        position: [0, 0.85, cameraZ],
        fov: 50,
        near: 0.01,
        far: 100,
      }}
      style={{ background: "transparent" }}
      gl={{ antialias: false, alpha: true }}
      dpr={1}
    >
      <ambientLight intensity={0.8} color={0xffeedd} />
      <directionalLight position={[-3, 4, 1]} intensity={1.0} />
      <StaticMannequin groupKeys={groupKeys} onLoaded={onLoaded} />
    </Canvas>
  );
}
