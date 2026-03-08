"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  PCFSoftShadowMap,
  Raycaster,
  Vector2,
  Vector3,
  type DirectionalLight,
  type Group,
} from "three";
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
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.5;
/** Background base zoom + offset (%) — negative X = left, negative Y = up. */
const BASE_BG_SCALE = 1.25;
const BG_OFFSET_X = -6;
const BG_OFFSET_Y = -22;
/** Mannequin is 50 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Orbit / zoom target — mannequin vertical center (head-to-feet midpoint). */
const TARGET_Y = FEET_Y + 1.5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* eslint-disable @typescript-eslint/no-explicit-any -- drei OrbitControls ref has no exported instance type */
type OrbitControlsRef = React.RefObject<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Inner scene: custom zoom + dolly-to-cursor ────────────────────────── */

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
  const orbitRef: OrbitControlsRef = useRef(null);

  /* Zoom + pan state */
  const zoomRef = useRef(1);
  const panRef = useRef(new Vector3(0, 0, 0));  // offset from defaultTarget
  const defaultTarget = useMemo(() => new Vector3(0, TARGET_Y, 0), []);
  const lerpVec = useRef(new Vector3());
  const zeroVec = useRef(new Vector3(0, 0, 0));
  const raycasterObj = useRef(new Raycaster());
  const ndcVec = useRef(new Vector2());
  const prevPinchRef = useRef<{ dist: number; mx: number; my: number } | null>(null);

  const { gl, camera, scene } = useThree();

  const FOV_RAD = (60 * Math.PI) / 180;

  /** Unproject screen point onto z=0 world plane (mannequin plane). */
  const screenToWorld = (sx: number, sy: number) => {
    const el = gl.domElement;
    const rect = el.getBoundingClientRect();
    ndcVec.current.set(
      ((sx - rect.left) / rect.width) * 2 - 1,
      -((sy - rect.top) / rect.height) * 2 + 1,
    );
    raycasterObj.current.setFromCamera(ndcVec.current, camera);
    const ray = raycasterObj.current.ray;
    const t = -ray.origin.z / ray.direction.z;
    return ray.origin.clone().addScaledVector(ray.direction, Math.max(0.001, t));
  };

  /* Add shadow-light target to scene graph (required for Three.js shadows) */
  useEffect(() => {
    const light = lightRef.current;
    const parent = shadowRef.current;
    if (light && parent) {
      parent.add(light.target);
      light.target.position.set(0, 0.5, 0);
    }
  }, []);

  /* Set initial orbit target */
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.copy(defaultTarget);
    }
  }, [defaultTarget]);

  /* Wheel → zoom-to-cursor (desktop) */
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const oldZoom = zoomRef.current;
      const newZoom = clamp(oldZoom * (1 - e.deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);
      if (newZoom === oldZoom) return;

      /* Zoom toward cursor: shift pan offset so content under cursor stays put */
      const worldCursor = screenToWorld(e.clientX, e.clientY);
      const feetPos = new Vector3(0, FEET_Y, 0);
      const shift = worldCursor.sub(feetPos).multiplyScalar(newZoom / oldZoom - 1);
      panRef.current.add(shift);

      zoomRef.current = newZoom;

      /* Reset pan when fully dezoomed */
      if (newZoom <= 1.02) {
        panRef.current.set(0, 0, 0);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, camera, scene]);

  /* Pinch → zoom-to-point + 2-finger pan (mobile) */
  useEffect(() => {
    const el = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { prevPinchRef.current = null; return; }
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      prevPinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), mx, my };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !prevPinchRef.current) return;
      e.preventDefault();

      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const prev = prevPinchRef.current;

      /* 1. Zoom */
      const oldZoom = zoomRef.current;
      const newZoom = clamp(oldZoom * (dist / prev.dist), MIN_ZOOM, MAX_ZOOM);

      /* 2. Zoom-to-point: keep content under midpoint fixed on screen */
      if (newZoom !== oldZoom) {
        const worldMid = screenToWorld(mx, my);
        const feetPos = new Vector3(0, FEET_Y, 0);
        /* Scene scales around FEET_POS; compensate orbit target shift */
        const shift = worldMid.sub(feetPos).multiplyScalar(newZoom / oldZoom - 1);
        panRef.current.add(shift);
      }
      zoomRef.current = newZoom;

      /* 3. Pan: translate orbit target to follow finger midpoint movement */
      const rect = el.getBoundingClientRect();
      const visibleH = 2 * camera.position.z * Math.tan(FOV_RAD / 2);
      const worldPerPx = visibleH / rect.height;
      panRef.current.x -= (mx - prev.mx) * worldPerPx;
      panRef.current.y += (my - prev.my) * worldPerPx;

      prevPinchRef.current = { dist, mx, my };
    };

    const resetPinch = () => {
      prevPinchRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", resetPinch);
    el.addEventListener("touchcancel", resetPinch);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", resetPinch);
      el.removeEventListener("touchcancel", resetPinch);
    };
  }, [gl, camera, scene, FOV_RAD]);

  /* Per-frame sync: scale, orbit target, background, shadow */
  useFrame(({ camera: cam }) => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);

    const orbit = orbitRef.current;
    if (orbit) {
      /* Gradually return pan to zero when fully dezoomed */
      if (z <= 1.02) {
        panRef.current.lerp(zeroVec.current, 0.12);
      }

      /* Clamp pan so mannequin stays visible — more zoom = more pan allowed */
      const maxPan = Math.max(0, (z - 1) * 1.8);
      panRef.current.x = clamp(panRef.current.x, -maxPan, maxPan);
      panRef.current.y = clamp(panRef.current.y, -maxPan, maxPan);

      lerpVec.current.copy(defaultTarget).add(panRef.current);
      orbit.target.lerp(lerpVec.current, 0.15);
    }

    if (bgRef.current) {
      /* Sync background position with pan offset */
      const bgX = BG_OFFSET_X - panRef.current.x * 12;
      const bgY = BG_OFFSET_Y + panRef.current.y * 12;
      bgRef.current.style.transform =
        `translate(${bgX.toFixed(2)}%, ${bgY.toFixed(2)}%) scale(${(BASE_BG_SCALE * z).toFixed(4)})`;
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

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
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
      <ZoomableScene
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
