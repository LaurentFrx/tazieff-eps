"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls, Environment } from "@react-three/drei";
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
};

/** Y-offset so mannequin feet sit at shadow line on background image. */
const FEET_Y = -1.28;
/** Mannequin is 50 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Double-tap detection threshold (ms). */
const DOUBLE_TAP_MS = 300;
/** Max distance (px²) to still count as a tap, not a drag. */
const TAP_THRESHOLD_SQ = 25;
/** Max duration (ms) for a single tap gesture. */
const TAP_MAX_DURATION = 200;

/* ── Inner scene: CameraControls + HDRI environment ──────────────────── */

function Scene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
}: Props) {
  const mannequinGroupRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const controlsRef = useRef<CameraControlsImpl>(null);

  /* Double-tap state */
  const lastTapTime = useRef(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });

  const { gl } = useThree();

  /* Add shadow-light target to scene graph (required for Three.js shadows) */
  useEffect(() => {
    const light = lightRef.current;
    if (light?.parent) {
      light.parent.add(light.target);
      light.target.position.set(0, 0.5, 0);
    }
  }, []);

  /* Center camera on mannequin bounding box at mount */
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

  /* Double-tap to reset */
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

  return (
    <>
      {/* HDRI environment — 360° background + subtle IBL reflections */}
      <Suspense fallback={null}>
        <Environment
          files="/hdri/anatomy-env.hdr"
          background
          backgroundBlurriness={0.02}
          backgroundIntensity={0.8}
          environmentIntensity={0.3}
        />
      </Suspense>

      <group position={[0, FEET_Y, 0]}>
        {/* Fixed directional light for shadow */}
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
        smoothTime={0.1}
        draggingSmoothTime={0.04}
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
}: Props) {
  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      camera={{ position: [0, 0, 4.5], fov: 60, near: 0.01, far: 100 }}
      gl={{ antialias: true }}
    >
      <Scene
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        onLongPressMuscle={onLongPressMuscle}
      />
    </Canvas>
  );
}
