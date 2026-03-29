"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MUSCLE_GROUPS, getGroupForNode, getFrenchName, getSide, isLayeredGroup, getSubMuscleColor } from "./anatomy-data";

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
  activeGroups?: string[];
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

/* ─── Shared ShaderMaterial for vertex points (gl_PointSize in pixels) ───── */

function makePointsShaderMaterial(color: string, size: number, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = uOpacity * (1.0 - smoothstep(0.3, 0.5, d));
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });
}

function SilhouetteBody({ opacity, pointSize, pointOpacity, pointColor }: {
  opacity: number;
  pointSize: number;
  pointOpacity: number;
  pointColor: string;
}) {
  const { scene } = useGLTF("/models/silhouette_fixed.glb");
  const groupRef = useRef<THREE.Group>(null);
  const pointMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const pointsObjsRef = useRef<THREE.Points[]>([]);

  /* Detect inner/outer meshes, apply wireframe material, add GL_POINTS pass. */
  useEffect(() => {
    const pointsMat = makePointsShaderMaterial(pointColor, pointSize, pointOpacity);
    pointMatRef.current = pointsMat;
    const createdPoints: THREE.Points[] = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Recompute normals for reliable orientation detection
        mesh.geometry.computeVertexNormals();

        const positions = mesh.geometry.getAttribute("position");
        const normals = mesh.geometry.getAttribute("normal");

        if (positions && normals) {
          // Compute centroid
          let cx = 0, cy = 0, cz = 0;
          for (let i = 0; i < positions.count; i++) {
            cx += positions.getX(i);
            cy += positions.getY(i);
            cz += positions.getZ(i);
          }
          cx /= positions.count;
          cy /= positions.count;
          cz /= positions.count;

          // Average dot(normal, position - centroid): positive = outward, negative = inward
          let dotSum = 0;
          for (let i = 0; i < positions.count; i++) {
            const dx = positions.getX(i) - cx;
            const dy = positions.getY(i) - cy;
            const dz = positions.getZ(i) - cz;
            const nx = normals.getX(i);
            const ny = normals.getY(i);
            const nz = normals.getZ(i);
            dotSum += dx * nx + dy * ny + dz * nz;
          }
          const avgDot = dotSum / positions.count;
          const isInner = avgDot < 0;

          // Hide inner meshes (normals pointing inward = internal face)
          if (isInner) {
            mesh.visible = false;
            return;
          }
        }

        mesh.material = new THREE.MeshBasicMaterial({
          color: 0x9b7340,
          transparent: true,
          opacity,
          wireframe: true,
          side: THREE.FrontSide,
          depthWrite: false,
          depthTest: true,
          stencilWrite: true,
          stencilRef: 0,
          stencilFunc: THREE.EqualStencilFunc,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
        });
        mesh.renderOrder = 2;

        // Cast solid silhouette shadow (shadow map from DirectionalLight)
        mesh.castShadow = true;
        mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
          depthPacking: THREE.RGBADepthPacking,
        });

        // GL_POINTS pass — child of mesh, identity transform.
        // Same geometry + same modelViewMatrix = exact vertex alignment.
        const pts = new THREE.Points(mesh.geometry, pointsMat);
        pts.renderOrder = 2;
        pts.raycast = () => {};
        mesh.add(pts);
        createdPoints.push(pts);
      }
    });

    pointsObjsRef.current = createdPoints;

    return () => {
      for (const p of createdPoints) {
        p.parent?.remove(p);
      }
      pointsMat.dispose();
      pointMatRef.current = null;
      pointsObjsRef.current = [];
    };
  }, [scene]);

  /* Update wireframe opacity on visible meshes when slider changes */
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.visible) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = opacity;
      }
    });
  }, [scene, opacity]);

  /* Update point shader uniforms in real time when sliders change */
  useEffect(() => {
    const mat = pointMatRef.current;
    if (!mat) return;
    mat.uniforms.uSize.value = pointSize;
    mat.uniforms.uOpacity.value = pointOpacity;
    mat.uniforms.uColor.value.set(pointColor);
  }, [pointSize, pointOpacity, pointColor]);

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
  activeGroups = [],
  wireframe,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
}: Omit<Props, "hoveredMuscle">) {
  const { scene } = useGLTF("/models/muscles.glb");
  const { scene: sceneExtra } = useGLTF("/models/muscles_manquants.glb");
  const { gl } = useThree();
  const canvasElRef = useRef(gl.domElement);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const hoveredRef = useRef<THREE.Mesh | null>(null);

  // Initialize muscle materials and userData on load
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    const initMesh = (mesh: THREE.Mesh) => {
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
      const sideFull = side === "D" ? "droit" : side === "G" ? "gauche" : "";
      const displayName = sideFull ? `${frName} ${sideFull}` : frName;
      mesh.userData = {
        groupKey,
        rawName,
        frName: displayName,
        baseFrName: frName,
        originalColor: color.clone(),
      } as MuscleUserData;
      /* Render BEFORE wireframe — muscles write stencil=1 to mask wireframe. */
      mesh.renderOrder = 1;
      mesh.material.stencilWrite = true;
      mesh.material.stencilRef = 1;
      mesh.material.stencilFunc = THREE.AlwaysStencilFunc;
      mesh.material.stencilZPass = THREE.ReplaceStencilOp;
      mesh.material.stencilFail = THREE.KeepStencilOp;
      mesh.material.stencilZFail = THREE.KeepStencilOp;
      meshes.push(mesh);
    };
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) initMesh(child as THREE.Mesh);
    });
    sceneExtra.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) initMesh(child as THREE.Mesh);
    });
    meshesRef.current = meshes;
  }, [scene, sceneExtra]);

  // Update materials when selection/highlight/wireframe changes
  /* eslint-disable react-hooks/immutability -- Three.js materials are mutable by design */
  useEffect(() => {
    for (const mesh of meshesRef.current) {
      const ud = mesh.userData as MuscleUserData;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.wireframe = wireframe;

      // Default: visible
      mesh.visible = true;

      if (highlightedMuscle) {
        if (ud.baseFrName === highlightedMuscle) {
          mat.opacity = 1;
          if (selectedGroup && isLayeredGroup(selectedGroup)) {
            const sc = getSubMuscleColor(selectedGroup, ud.baseFrName);
            if (sc) {
              const c = new THREE.Color(sc);
              mat.color.copy(c);
              mat.emissive.copy(c).multiplyScalar(0.5);
            } else {
              mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
            }
          } else {
            mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
          }
        } else if (selectedGroup && ud.groupKey === selectedGroup) {
          // Same group, different sub-muscle → dimmed with own color
          if (isLayeredGroup(selectedGroup)) {
            const sc = getSubMuscleColor(selectedGroup, ud.baseFrName);
            if (sc) {
              const c = new THREE.Color(sc);
              mat.color.copy(c);
              mat.emissive.copy(c).multiplyScalar(0.15);
            }
            mat.opacity = 0.4;
          } else {
            mat.opacity = 0.4;
            mat.emissive.set(0x000000);
          }
        } else if (!selectedGroup && activeGroups.length > 0 && ud.groupKey && activeGroups.includes(ud.groupKey)) {
          // Exercise mode: other muscles in active groups → dimmed
          mat.color.copy(ud.originalColor);
          mat.opacity = 0.4;
          mat.emissive.set(0x000000);
        } else {
          // Outside selected/active groups → invisible
          mesh.visible = false;
        }
      } else if (selectedGroup) {
        if (ud.groupKey === selectedGroup) {
          mat.opacity = 1;
          if (isLayeredGroup(selectedGroup)) {
            const sc = getSubMuscleColor(selectedGroup, ud.baseFrName);
            if (sc) {
              const c = new THREE.Color(sc);
              mat.color.copy(c);
              mat.emissive.copy(c).multiplyScalar(0.3);
            } else {
              mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
            }
          } else {
            mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
          }
        } else {
          // Outside selected group → invisible
          mesh.visible = false;
        }
      } else if (activeGroups.length > 0) {
        // Multi-group mode (from exercise): highlight all active groups
        if (ud.groupKey && activeGroups.includes(ud.groupKey)) {
          mat.color.copy(ud.originalColor);
          mat.opacity = 1;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.3);
        } else {
          mesh.visible = false;
        }
      } else {
        // No selection: restore original group color
        mat.color.copy(ud.originalColor);
        mat.opacity = 1;
        mat.emissive.set(0x000000);
      }

      // Stencil: block wireframe ONLY where muscle is visible and opaque
      mat.stencilWrite = mesh.visible && mat.opacity > 0.5;
    }
  }, [selectedGroup, highlightedMuscle, activeGroups, wireframe]);
  /* eslint-enable react-hooks/immutability */

  // Raycasting for hover and click
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  useFrame(({ camera, pointer }) => {
    mouse.copy(pointer);
    raycaster.setFromCamera(mouse, camera);

    // Only raycast against visible meshes from the active selection
    const targets = selectedGroup
      ? meshesRef.current.filter((m) => (m.userData as MuscleUserData).groupKey === selectedGroup)
      : activeGroups.length > 0
        ? meshesRef.current.filter((m) => {
            const ud = m.userData as MuscleUserData;
            return ud.groupKey && activeGroups.includes(ud.groupKey);
          })
        : meshesRef.current;
    const hits = raycaster.intersectObjects(targets, false);

    const noGroupLock = !selectedGroup;
    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh;
      if (mesh !== hoveredRef.current) {
        // Un-glow previous
        if (hoveredRef.current && noGroupLock) {
          const prevUd = hoveredRef.current.userData as MuscleUserData;
          const prevMat = hoveredRef.current.material as THREE.MeshPhongMaterial;
          // Restore to base emissive (dimmed glow for activeGroups, none otherwise)
          if (activeGroups.length > 0) {
            prevMat.emissive.copy(prevUd.originalColor).multiplyScalar(0.3);
          } else {
            prevMat.emissive.set(0x000000);
          }
        }
        hoveredRef.current = mesh;
        // Glow current
        if (noGroupLock) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          const ud = mesh.userData as MuscleUserData;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
        }
        const ud = mesh.userData as MuscleUserData;
        onHoverMuscle(ud.frName, ud.groupKey);
      }
      canvasElRef.current.style.cursor = "pointer";
    } else {
      if (hoveredRef.current && noGroupLock) {
        const prevUd = hoveredRef.current.userData as MuscleUserData;
        const prevMat = hoveredRef.current.material as THREE.MeshPhongMaterial;
        if (activeGroups.length > 0) {
          prevMat.emissive.copy(prevUd.originalColor).multiplyScalar(0.3);
        } else {
          prevMat.emissive.set(0x000000);
        }
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

  return (
    <>
      <primitive object={scene} />
      <primitive object={sceneExtra} />
    </>
  );
}

/* ─── Skeleton layer ────────────────────────────────────────────────────── */

function SkeletonBody() {
  const { scene } = useGLTF("/models/squelette.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshPhongMaterial({
          color: 0xe8dcc8,
          emissive: new THREE.Color(0x222211),
          shininess: 20,
          transparent: false,
          opacity: 1.0,
          side: THREE.FrontSide,
          depthWrite: true,
          depthTest: true,
          stencilWrite: true,
          stencilRef: 1,
          stencilFunc: THREE.AlwaysStencilFunc,
          stencilZPass: THREE.ReplaceStencilOp,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
        });
        mesh.renderOrder = 1;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

/* ─── Exported component ─────────────────────────────────────────────────── */

export default function HologramMannequin({
  selectedGroup,
  highlightedMuscle,
  activeGroups = [],
  wireframe,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  showSkeleton = false,
  showWireframe = true,
  showMuscles = true,
  silhouetteOpacity = 0.4,
  pointSize = 1.0,
  pointOpacity = 1.0,
  pointColor = "#00ffff",
  ambientIntensity = 0.8,
  mainLightIntensity = 1.2,
}: Props & {
  showSkeleton?: boolean;
  showWireframe?: boolean;
  showMuscles?: boolean;
  silhouetteOpacity?: number;
  pointSize?: number;
  pointOpacity?: number;
  pointColor?: string;
  ambientIntensity?: number;
  mainLightIntensity?: number;
}) {

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} color={0xffeedd} />
      <directionalLight position={[-3, 4, 1]} intensity={mainLightIntensity} color={0xfff5e0} />
      <directionalLight position={[-2, 1, -1]} intensity={0.5} color={0x88aaff} />
      <directionalLight position={[0, 2, -3]} intensity={0.3} />

      {showSkeleton && <SkeletonBody />}
      {showWireframe && (
        <SilhouetteBody
          opacity={silhouetteOpacity}
          pointSize={pointSize}
          pointOpacity={pointOpacity}
          pointColor={pointColor}
        />
      )}
      {showMuscles && (
        <MusclesModel
          selectedGroup={selectedGroup}
          highlightedMuscle={highlightedMuscle}
          activeGroups={activeGroups}
          wireframe={wireframe}
          onHoverMuscle={onHoverMuscle}
          onClickMuscle={onClickMuscle}
          onLongPressMuscle={onLongPressMuscle}
        />
      )}
    </group>
  );
}
