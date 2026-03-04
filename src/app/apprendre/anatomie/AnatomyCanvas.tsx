"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string, groupKey: string) => void;
  bgRef: RefObject<HTMLDivElement | null>;
};

/** Y-offset so mannequin feet sit at ≈ 18 % from viewport bottom. */
const FEET_Y = -1.1;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.5;
/** Background base zoom + offset (%) — negative X = left, negative Y = up. */
const BASE_BG_SCALE = 1.2;
const BG_OFFSET_X = -6;
const BG_OFFSET_Y = -27;
/** Mannequin is 25 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* ── Inner scene: custom zoom that scales around the feet ─────────────── */

function ZoomableScene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  bgRef,
}: Props) {
  const scaleRef = useRef<Group>(null);
  const zoomRef = useRef(1);
  const pinchRef = useRef(0);
  const { gl } = useThree();

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

  /* Sync 3D scale + CSS background each frame */
  useFrame(() => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${BG_OFFSET_X}%, ${BG_OFFSET_Y}%) scale(${(BASE_BG_SCALE * z).toFixed(4)})`;
    }
  });

  return (
    <group position={[0, FEET_Y, 0]}>
      {/* Fake shadow — ellipse on ground, offset right to match sun from left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.01, 0.15]} renderOrder={-1}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.18} depthWrite={false} />
      </mesh>

      <group ref={scaleRef}>
        <group scale={MANNEQUIN_SCALE} position={[0, 0, -0.15]}>
          <HologramMannequin
            selectedGroup={selectedGroup}
            highlightedMuscle={highlightedMuscle}
            hoveredMuscle={null}
            wireframe={false}
            silhouetteOpacity={0.4}
            onHoverMuscle={onHoverMuscle}
            onClickMuscle={onClickMuscle}
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
  bgRef,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 60, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ZoomableScene
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        bgRef={bgRef}
      />
      <OrbitControls
        target={[0, 0, 0]}
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
