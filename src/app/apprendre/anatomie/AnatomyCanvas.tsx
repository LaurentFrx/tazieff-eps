"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PCFSoftShadowMap, type DirectionalLight, type Group } from "three";
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
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.5;
/** Background base zoom + offset (%) — negative X = left, negative Y = up. */
const BASE_BG_SCALE = 1.2;
const BG_OFFSET_X = -6;
const BG_OFFSET_Y = -27;
/** Mannequin is 25 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Orbit / zoom target — mannequin center of mass (torso), not feet. */
const TARGET_Y = FEET_Y + 0.8;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* ── Inner scene: custom zoom that scales around the feet ─────────────── */

function ZoomableScene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  bgRef,
}: Props) {
  const scaleRef = useRef<Group>(null);
  const shadowRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const zoomRef = useRef(1);
  const pinchRef = useRef(0);
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

  /* Wheel → zoom */
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = clamp(
        zoomRef.current * (1 - e.deltaY * 0.001),
        MIN_ZOOM,
        MAX_ZOOM,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  /* Pinch → zoom (mobile) */
  useEffect(() => {
    const el = gl.domElement;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchRef.current > 0) {
        zoomRef.current = clamp(
          zoomRef.current * (dist / pinchRef.current),
          MIN_ZOOM,
          MAX_ZOOM,
        );
      }
      pinchRef.current = dist;
    };
    const resetPinch = () => {
      pinchRef.current = 0;
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", resetPinch);
    el.addEventListener("touchcancel", resetPinch);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", resetPinch);
      el.removeEventListener("touchcancel", resetPinch);
    };
  }, [gl]);

  /* Sync 3D scale + CSS background + shadow orientation each frame */
  useFrame(({ camera }) => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${BG_OFFSET_X}%, ${BG_OFFSET_Y}%) scale(${(BASE_BG_SCALE * z).toFixed(4)})`;
    }
    /* Counter-rotate shadow so it stays fixed relative to the static background */
    if (shadowRef.current) {
      shadowRef.current.rotation.y = Math.atan2(camera.position.x, camera.position.z);
    }
  });

  return (
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

      <group ref={scaleRef}>
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
      camera={{ position: [0, 0, 3], fov: 60, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ZoomableScene
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        onLongPressMuscle={onLongPressMuscle}
        bgRef={bgRef}
      />
      <OrbitControls
        target={[0, TARGET_Y, 0]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
