"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, useTexture } from "@react-three/drei";
import {
  Box3,
  ClampToEdgeWrapping,
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

/** Mannequin is 50 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Double-tap detection threshold (ms). */
const DOUBLE_TAP_MS = 300;
/** Max distance (px²) to still count as a tap, not a drag. */
const TAP_THRESHOLD_SQ = 25;
/** Max duration (ms) for a single tap gesture. */
const TAP_MAX_DURATION = 200;
/** Turntable: radians per pixel of horizontal drag. */
const ROTATE_SPEED = 0.006;
/** Turntable inertia decay per frame (0 = instant stop, 1 = never). */
const INERTIA_DECAY = 0.92;
/** Angular velocity threshold below which inertia stops. */
const INERTIA_EPSILON = 0.0001;

/* ── Background plane — fixed in scene, follows camera zoom/pan ──── */

function BackgroundPlane() {
  const texture = useTexture("/media/anatomy-bg.webp");
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;

  return (
    <mesh position={[0, 0.8, -1.5]} renderOrder={-2}>
      <planeGeometry args={[5, 3.75]} />
      <meshBasicMaterial map={texture} depthWrite={false} />
    </mesh>
  );
}

/* ── Inner scene: turntable + CameraControls (dolly/truck only) ──── */

function Scene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
}: Props) {
  const mannequinGroupRef = useRef<Group>(null);
  const turntableRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const controlsRef = useRef<CameraControlsImpl>(null);

  /* Turntable state */
  const rotationY = useRef(0);
  const angularVelocity = useRef(0);
  const isDragging = useRef(false);
  const lastPointerX = useRef(0);
  const activePointers = useRef(new Set<number>());

  /* Double-tap state */
  const lastTapTime = useRef(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });

  const { gl } = useThree();

  /* Disable CameraControls single-finger rotation — turntable handles it */
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.mouseButtons.left = 0;   // ACTION.NONE
    controls.touches.one = 0;         // ACTION.NONE
    // Keep defaults: right-click=TRUCK, wheel=DOLLY, two-finger=DOLLY_TRUCK
  }, []);

  /* Add shadow-light target to scene graph */
  useEffect(() => {
    const light = lightRef.current;
    if (light?.parent) {
      light.parent.add(light.target);
      light.target.position.set(0, 0.5, 0);
    }
  }, []);

  /* Center camera on mannequin + anchor feet to ground */
  useEffect(() => {
    const controls = controlsRef.current;
    const mannequin = mannequinGroupRef.current;
    if (!controls || !mannequin) return;

    const id = requestAnimationFrame(() => {
      const box = new Box3().setFromObject(mannequin);
      // Anchor feet to y=0
      mannequin.position.y -= box.min.y;
      // Recompute after repositioning
      box.setFromObject(mannequin);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      const distance = Math.max(size.y * 1.2, size.x * 2);

      // Camera at chest height looking straight ahead (horizontal view)
      controls.setLookAt(0, center.y, distance, 0, center.y, 0, false);
      controls.saveState();
    });

    return () => cancelAnimationFrame(id);
  }, []);

  /* Turntable single-finger drag + double-tap reset */
  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.current.add(e.pointerId);
      pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };

      if (activePointers.current.size === 1) {
        isDragging.current = true;
        lastPointerX.current = e.clientX;
        angularVelocity.current = 0;
      } else {
        // Multi-touch → stop rotation, let CameraControls handle dolly/truck
        isDragging.current = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || activePointers.current.size !== 1) return;
      const dx = e.clientX - lastPointerX.current;
      rotationY.current += dx * ROTATE_SPEED;
      angularVelocity.current = dx * ROTATE_SPEED;
      lastPointerX.current = e.clientX;
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) {
        isDragging.current = false;
      }

      // Double-tap detection
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      const duration = Date.now() - pointerStart.current.time;
      if (dx * dx + dy * dy <= TAP_THRESHOLD_SQ && duration <= TAP_MAX_DURATION) {
        const now = Date.now();
        if (now - lastTapTime.current < DOUBLE_TAP_MS) {
          // Reset camera position AND mannequin rotation
          controlsRef.current?.reset(true);
          rotationY.current = 0;
          angularVelocity.current = 0;
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) {
        isDragging.current = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [gl]);

  /* Apply turntable rotation + inertia each frame */
  useFrame(() => {
    if (!isDragging.current && Math.abs(angularVelocity.current) > INERTIA_EPSILON) {
      rotationY.current += angularVelocity.current;
      angularVelocity.current *= INERTIA_DECAY;
    } else if (!isDragging.current) {
      angularVelocity.current = 0;
    }

    if (turntableRef.current) {
      turntableRef.current.rotation.y = rotationY.current;
    }
  });

  return (
    <>
      {/* Background plane — fixed in scene, does NOT rotate */}
      <BackgroundPlane />

      <group>
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

        {/* Turntable — rotates mannequin on Y axis */}
        <group ref={turntableRef}>
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
      </group>

      {/* CameraControls: dolly (zoom) + truck (pan) only — no rotation */}
      <CameraControls
        ref={controlsRef}
        dollyToCursor
        smoothTime={0.1}
        draggingSmoothTime={0.04}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
        minDistance={2.0}
        maxDistance={5.0}
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
