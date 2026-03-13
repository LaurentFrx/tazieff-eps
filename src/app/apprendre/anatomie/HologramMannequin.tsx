"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MUSCLE_GROUPS, getGroupForNode, getFrenchName, getSide } from "./anatomy-data";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type MuscleUserData = {
  groupKey: string | null;
  rawName: string;
  frName: string;
  baseFrName: string;
  originalColor: THREE.Color;
};

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  hoveredMuscle: string | null;
  wireframe: boolean;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string | null, groupKey: string | null, x: number, y: number) => void;
  onLongPressMuscle: (frName: string, groupKey: string, x: number, y: number) => void;
};

/* ─── Configure Draco for useGLTF ────────────────────────────────────────── */

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

/* ─── Silhouette body (wireframe) ────────────────────────────────────────── */

function SilhouetteBody({ opacity }: { opacity: number }) {
  const { scene } = useGLTF("/models/silhouette.glb");
  const groupRef = useRef<THREE.Group>(null);

  /* Apply wireframe material to silhouette meshes.
     The silhouette envelope is geometrically larger than the muscle meshes,
     so stencil-based masking cannot work reliably (different topology/pixel coverage).
     Instead, the wireframe uses very low opacity (0.08) so it's imperceptible
     over opaque colored muscles but still faintly visible on bare areas
     (head, hands, feet). No glow points — the wireframe alone suffices. */
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0x9b7340,
          transparent: true,
          opacity,
          wireframe: true,
          side: THREE.FrontSide,
          depthWrite: false,
          depthTest: true,
          stencilWrite: false,
          stencilRef: 1,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
        });
        mesh.renderOrder = 2;
        mesh.castShadow = true;
        mesh.customDepthMaterial = new THREE.MeshDepthMaterial();
      }
    });
  }, [scene, opacity]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = opacity;
      }
    });
  }, [scene, opacity]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ─── Muscles model ──────────────────────────────────────────────────────── */

function MusclesModel({
  selectedGroup,
  highlightedMuscle,
  wireframe,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
}: Omit<Props, "hoveredMuscle">) {
  const { scene } = useGLTF("/models/muscles.glb");
  const { gl } = useThree();
  const canvasElRef = useRef(gl.domElement);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const hoveredRef = useRef<THREE.Mesh | null>(null);

  // Initialize muscle materials and userData on load
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const rawName =
          mesh.name || (mesh.parent ? mesh.parent.name : "unknown");
        const groupKey = getGroupForNode(rawName);
        const color = new THREE.Color(
          groupKey ? MUSCLE_GROUPS[groupKey].color : 0x888888,
        );
        mesh.material = new THREE.MeshPhongMaterial({
          color,
          emissive: new THREE.Color(0x000000),
          shininess: 30,
          transparent: true,
          opacity: 1.0,
          side: THREE.FrontSide,
        });
        const frName = getFrenchName(rawName);
        const side = getSide(rawName);
        const displayName = side ? `${frName} (${side})` : frName;
        mesh.userData = {
          groupKey,
          rawName,
          frName: displayName,
          baseFrName: frName,
          originalColor: color.clone(),
        } as MuscleUserData;
        /* Render BEFORE wireframe — muscles write to depth buffer,
           blocking wireframe fragments behind them. */
        mesh.renderOrder = 0;
        mesh.material.stencilWrite = true;
        mesh.material.stencilRef = 1;
        mesh.material.stencilFunc = THREE.AlwaysStencilFunc;
        mesh.material.stencilZPass = THREE.ReplaceStencilOp;
        mesh.material.stencilFail = THREE.KeepStencilOp;
        mesh.material.stencilZFail = THREE.KeepStencilOp;
        mesh.castShadow = true;
        meshes.push(mesh);
      }
    });
    meshesRef.current = meshes;
  }, [scene]);

  // Update materials when selection/highlight/wireframe changes
  /* eslint-disable react-hooks/immutability -- Three.js materials are mutable by design */
  useEffect(() => {
    for (const mesh of meshesRef.current) {
      const ud = mesh.userData as MuscleUserData;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.wireframe = wireframe;

      if (highlightedMuscle) {
        if (ud.baseFrName === highlightedMuscle) {
          mat.opacity = 1;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
        } else if (selectedGroup && ud.groupKey === selectedGroup) {
          mat.opacity = 0.4;
          mat.emissive.set(0x000000);
        } else {
          mat.opacity = 0.05;
          mat.emissive.set(0x000000);
        }
      } else if (selectedGroup) {
        if (ud.groupKey === selectedGroup) {
          mat.opacity = 1;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
        } else {
          mat.opacity = 0.07;
          mat.emissive.set(0x000000);
        }
      } else {
        mat.opacity = 1;
        mat.emissive.set(0x000000);
      }
    }
  }, [selectedGroup, highlightedMuscle, wireframe]);
  /* eslint-enable react-hooks/immutability */

  // Raycasting for hover and click
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  useFrame(({ camera, pointer }) => {
    mouse.copy(pointer);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(meshesRef.current, false);

    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh;
      if (mesh !== hoveredRef.current) {
        // Un-glow previous
        if (hoveredRef.current && !selectedGroup) {
          const mat = hoveredRef.current
            .material as THREE.MeshPhongMaterial;
          mat.emissive.set(0x000000);
        }
        hoveredRef.current = mesh;
        // Glow current
        if (!selectedGroup) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          const ud = mesh.userData as MuscleUserData;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
        }
        const ud = mesh.userData as MuscleUserData;
        onHoverMuscle(ud.frName, ud.groupKey);
      }
      canvasElRef.current.style.cursor = "pointer";
    } else {
      if (hoveredRef.current && !selectedGroup) {
        const mat = hoveredRef.current.material as THREE.MeshPhongMaterial;
        mat.emissive.set(0x000000);
      }
      hoveredRef.current = null;
      onHoverMuscle(null, null);
      canvasElRef.current.style.cursor = "grab";
    }
  });

  // Pointer interaction: tap → label, long press → sheet, dblclick → sheet
  useEffect(() => {
    const el = canvasElRef.current;
    let lpTimer: ReturnType<typeof setTimeout> | null = null;
    let lpFired = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      lpFired = false;
      lpTimer = setTimeout(() => {
        lpFired = true;
        const mesh = hoveredRef.current;
        if (mesh) {
          const ud = mesh.userData as MuscleUserData;
          if (ud.groupKey) {
            onLongPressMuscle(ud.baseFrName, ud.groupKey, e.clientX, e.clientY);
          }
        }
      }, 500);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!lpTimer) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy > 100) {
        clearTimeout(lpTimer);
        lpTimer = null;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      if (lpFired) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy > 100) return; // drag — not a tap
      const mesh = hoveredRef.current;
      if (mesh) {
        const ud = mesh.userData as MuscleUserData;
        if (ud.groupKey) {
          onClickMuscle(ud.baseFrName, ud.groupKey, e.clientX, e.clientY);
          return;
        }
      }
      onClickMuscle(null, null, e.clientX, e.clientY);
    };

    const onCtxMenu = (e: Event) => e.preventDefault();

    const onDblClick = (e: MouseEvent) => {
      const mesh = hoveredRef.current;
      if (mesh) {
        const ud = mesh.userData as MuscleUserData;
        if (ud.groupKey) {
          onLongPressMuscle(ud.baseFrName, ud.groupKey, e.clientX, e.clientY);
        }
      }
    };

    /* Block iOS callout / text selection on long press */
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("contextmenu", onCtxMenu);
    el.addEventListener("dblclick", onDblClick);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("contextmenu", onCtxMenu);
      el.removeEventListener("dblclick", onDblClick);
      if (lpTimer) clearTimeout(lpTimer);
    };
  }, [onClickMuscle, onLongPressMuscle]);

  return <primitive object={scene} />;
}

/* ─── Exported component ─────────────────────────────────────────────────── */

export default function HologramMannequin({
  selectedGroup,
  highlightedMuscle,
  wireframe,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  silhouetteOpacity = 0.4,
}: Props & { silhouetteOpacity?: number }) {

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.8} color={0xffeedd} />
      <directionalLight position={[-3, 4, 1]} intensity={1.2} color={0xfff5e0} />
      <directionalLight position={[-2, 1, -1]} intensity={0.5} color={0x88aaff} />
      <directionalLight position={[0, 2, -3]} intensity={0.3} />

      <SilhouetteBody opacity={silhouetteOpacity} />
      <MusclesModel
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        wireframe={wireframe}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        onLongPressMuscle={onLongPressMuscle}
      />
    </group>
  );
}
