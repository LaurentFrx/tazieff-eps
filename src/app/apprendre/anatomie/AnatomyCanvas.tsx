"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import {
  Box3,
  PCFSoftShadowMap,
  Vector3,
  type DirectionalLight,
  type Group,
} from "three";
import type CameraControlsImpl from "camera-controls";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string | null, groupKey: string | null, x: number, y: number) => void;
  onLongPressMuscle: (frName: string, groupKey: string, x: number, y: number) => void;
  bgRef: RefObject<HTMLDivElement | null>;
};

/** Y-offset so mannequin feet sit at shadow line on background image. */
const FEET_Y = -1.28;
/** Background base zoom + offset (%) — negative X = left, negative Y = up. */
const BASE_BG_SCALE = 1.25;
const BG_OFFSET_X = -6;
const BG_OFFSET_Y = -22;
/** Mannequin is 50 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Double-tap detection threshold (ms). */
const DOUBLE_TAP_MS = 300;
/** Max distance (px²) to still count as a tap, not a drag. */
const TAP_THRESHOLD_SQ = 25;
/** Max duration (ms) for a single tap gesture. */
const TAP_MAX_DURATION = 200;

/* ── Inner scene: CameraControls + background sync ───────────────────── */

function Scene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  bgRef,
}: Props) {
  const mannequinGroupRef = useRef<Group>(null);
  const shadowRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const controlsRef = useRef<CameraControlsImpl>(null);

  /* Double-tap state */
  const lastTapTime = useRef(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });

  const { gl } = useThree();

  /* Add shadow-light target to scene graph (required for Three.js shadows) */
  useEffect(() => {
    const light = lightRef.current;
    const parent = shadowRef.current;
    if (light && parent) {
      parent.add(light.target);
      light.target.position.set(0, 0.5, 0);
    }
  }, []);

  /* Phase 3 — Center camera on mannequin bounding box at mount */
  useEffect(() => {
    const controls = controlsRef.current;
    const mannequin = mannequinGroupRef.current;
    if (!controls || !mannequin) return;

    // Wait a frame for geometry to be ready
    const id = requestAnimationFrame(() => {
      const box = new Box3().setFromObject(mannequin);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());

      // Target = mannequin center
      controls.setTarget(center.x, center.y, center.z, false);

      // Distance: fit ~80% viewport height
      const distance = Math.max(size.y * 1.2, size.x * 2);
      controls.dollyTo(distance, false);

      // Save as reset position
      controls.saveState();
    });

    return () => cancelAnimationFrame(id);
  }, []);

  /* Phase 4 — Double-tap to reset */
  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      const duration = Date.now() - pointerStart.current.time;

      // Only count as tap if short movement and short duration
      if (dx * dx + dy * dy > TAP_THRESHOLD_SQ || duration > TAP_MAX_DURATION) return;

      const now = Date.now();
      if (now - lastTapTime.current < DOUBLE_TAP_MS) {
        // Double-tap detected → animated reset
        controlsRef.current?.reset(true);
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  /* Per-frame sync: background parallax + shadow counter-rotation */
  useFrame(({ camera: cam }) => {
    /* Sync background position with camera truck offset */
    if (bgRef.current && controlsRef.current) {
      const target = controlsRef.current.getTarget(new Vector3());
      // How far camera target has moved from default center
      const box = mannequinGroupRef.current
        ? new Box3().setFromObject(mannequinGroupRef.current).getCenter(new Vector3())
        : new Vector3(0, FEET_Y + 1.5, 0);
      const panX = target.x - box.x;
      const panY = target.y - box.y;

      const distance = controlsRef.current.distance;
      const zoomFactor = 4.5 / Math.max(distance, 0.01);  // initial distance ~4.5

      const bgX = BG_OFFSET_X - panX * 12;
      const bgY = BG_OFFSET_Y + panY * 12;
      bgRef.current.style.transform =
        `translate(${bgX.toFixed(2)}%, ${bgY.toFixed(2)}%) scale(${(BASE_BG_SCALE * zoomFactor).toFixed(4)})`;
    }

    /* Counter-rotate shadow so it stays fixed relative to the static background */
    if (shadowRef.current) {
      shadowRef.current.rotation.y = Math.atan2(cam.position.x, cam.position.z);
    }
  });

  return (
    <>
      <group position={[0, FEET_Y, 0]}>
        {/* Sun light — counter-rotates with camera so shadow matches static background */}
        <group ref={shadowRef}>
          <directionalLight
            ref={lightRef}
            position={[-3, 6, -2]}
            intensity={0.6}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={6}
            shadow-camera-bottom={-2}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-bias={-0.003}
            shadow-radius={4}
          />
        </group>

        {/* Ground plane receives the mannequin silhouette shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow renderOrder={-1}>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial transparent opacity={0.35} depthWrite={false} />
        </mesh>

        <group ref={mannequinGroupRef}>
          <group scale={MANNEQUIN_SCALE} position={[0, 0, -0.15]}>
            <HologramMannequin
              selectedGroup={selectedGroup}
              highlightedMuscle={highlightedMuscle}
              hoveredMuscle={null}
              wireframe={false}
              silhouetteOpacity={0.36}
              onHoverMuscle={onHoverMuscle}
              onClickMuscle={onClickMuscle}
              onLongPressMuscle={onLongPressMuscle}
            />
          </group>
        </group>
      </group>

      <CameraControls
        ref={controlsRef}
        dollyToCursor
        smoothTime={0.25}
        draggingSmoothTime={0.12}
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.95}
        minDistance={1.2}
        maxDistance={8}
        dollySpeed={0.5}
        truckSpeed={1.0}
      />
    </>
  );
}

/* ── Exported canvas ─────────────────────────────────────────────────── */

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  bgRef,
}: Props) {
  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      camera={{ position: [0, 0, 4.5], fov: 60, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        onLongPressMuscle={onLongPressMuscle}
        bgRef={bgRef}
      />
    </Canvas>
  );
}
