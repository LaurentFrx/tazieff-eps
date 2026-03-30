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
  scanYRef?: React.MutableRefObject<number | null>;
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
    stencilFuncMask: 0x01,
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
          stencilFuncMask: 0x01,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
        });
        mesh.renderOrder = 2;

        // Solid stencil mask clone — writes bit 1 for scan line masking
        const maskClone = mesh.clone();
        maskClone.material = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: false,
          side: THREE.FrontSide,
          stencilWrite: true,
          stencilRef: 0x02,
          stencilWriteMask: 0x02,
          stencilFunc: THREE.AlwaysStencilFunc,
          stencilZPass: THREE.ReplaceStencilOp,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
        });
        maskClone.renderOrder = -1;
        if (mesh.parent) mesh.parent.add(maskClone);

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

/* ─── Exercise mode: high-contrast palette per individual muscle ─────────── */

const EXERCISE_PALETTE = [
  new THREE.Color("#e63946"), // rouge vif
  new THREE.Color("#2a9d8f"), // teal
  new THREE.Color("#e9c46a"), // jaune doré
  new THREE.Color("#457b9d"), // bleu acier
  new THREE.Color("#f4a261"), // orange sable
  new THREE.Color("#8338ec"), // violet
  new THREE.Color("#06d6a0"), // vert menthe
  new THREE.Color("#ef476f"), // rose fuchsia
  new THREE.Color("#118ab2"), // bleu océan
  new THREE.Color("#ffd166"), // jaune clair
  new THREE.Color("#073b4c"), // bleu nuit
  new THREE.Color("#b5179e"), // magenta
  new THREE.Color("#fb8500"), // orange vif
  new THREE.Color("#00b4d8"), // cyan
  new THREE.Color("#9b5de5"), // lavande
  new THREE.Color("#00f5d4"), // turquoise
  new THREE.Color("#f15bb5"), // pink
  new THREE.Color("#fee440"), // jaune électrique
  new THREE.Color("#3a86ff"), // bleu roi
  new THREE.Color("#ff006e"), // framboise
];

/** Build a map: baseFrName → palette color, for all visible muscles in exercise mode */
function buildExerciseMuscleColorMap(
  meshes: THREE.Mesh[],
  activeGroups: string[],
): Map<string, THREE.Color> {
  const colorMap = new Map<string, THREE.Color>();
  const seen = new Set<string>();
  for (const mesh of meshes) {
    const ud = mesh.userData as MuscleUserData;
    if (!ud.groupKey || !activeGroups.includes(ud.groupKey)) continue;
    if (seen.has(ud.baseFrName)) continue;
    seen.add(ud.baseFrName);
    colorMap.set(ud.baseFrName, EXERCISE_PALETTE[colorMap.size % EXERCISE_PALETTE.length]);
  }
  return colorMap;
}

/* ─── Muscles model ──────────────────────────────────────────────────────── */

function MusclesModel({
  selectedGroup,
  highlightedMuscle,
  activeGroups = [],
  scanYRef,
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
  const exColorMapRef = useRef<Map<string, THREE.Color> | null>(null);

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
      /* Render BEFORE wireframe — muscles write stencil bit 0 to mask wireframe. */
      mesh.renderOrder = 1;
      mesh.material.stencilWrite = true;
      mesh.material.stencilRef = 1;
      mesh.material.stencilWriteMask = 0x01;
      mesh.material.stencilFunc = THREE.AlwaysStencilFunc;
      mesh.material.stencilZPass = THREE.ReplaceStencilOp;
      mesh.material.stencilFail = THREE.KeepStencilOp;
      mesh.material.stencilZFail = THREE.KeepStencilOp;

      // Scan reveal shader injection — progressive Y-based coloring
      mesh.material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
        shader.uniforms.uScanY = { value: -999.0 };
        shader.vertexShader = "varying float vWorldY;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vWorldY = (modelMatrix * vec4(position, 1.0)).y;`,
        );
        shader.fragmentShader = "varying float vWorldY;\nuniform float uScanY;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `float scanMix = smoothstep(uScanY - 0.04, uScanY + 0.04, vWorldY);
          gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.1, gl_FragColor.rgb, scanMix);
          #include <dithering_fragment>`,
        );
        (mesh.material as THREE.MeshPhongMaterial).userData.scanShader = shader;
      };
      (mesh.material as THREE.MeshPhongMaterial).customProgramCacheKey = () => "phong-scan";
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
    // Build color map once for all muscles (exercise mode)
    const exColorMap = activeGroups.length > 0
      ? buildExerciseMuscleColorMap(meshesRef.current, activeGroups)
      : null;
    exColorMapRef.current = exColorMap;

    for (const mesh of meshesRef.current) {
      const ud = mesh.userData as MuscleUserData;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.wireframe = wireframe;

      // Default: visible
      mesh.visible = true;

      // Exercise mode: high-contrast color per individual muscle
      const exColor = exColorMap?.get(ud.baseFrName) ?? null;

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
          } else if (exColor) {
            // Exercise mode: highlighted muscle uses its group's contrast color
            mat.color.copy(exColor);
            mat.emissive.copy(exColor).multiplyScalar(0.6);
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
          // Exercise mode: other muscles in active groups → dimmed with contrast color
          mat.color.copy(exColor ?? ud.originalColor);
          mat.opacity = 0.35;
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
        // Multi-group mode (from exercise): high-contrast colors per group
        if (ud.groupKey && activeGroups.includes(ud.groupKey)) {
          const gc = exColor ?? ud.originalColor;
          mat.color.copy(gc);
          mat.opacity = 1;
          mat.emissive.copy(gc).multiplyScalar(0.3);
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

  // Update scan Y uniform each frame for progressive muscle reveal
  useFrame(() => {
    const sy = scanYRef?.current;
    for (const mesh of meshesRef.current) {
      const shader = (mesh.material as THREE.MeshPhongMaterial).userData?.scanShader;
      if (shader?.uniforms?.uScanY) {
        shader.uniforms.uScanY.value = sy ?? -999;
      }
    }
  });

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
          if (activeGroups.length > 0) {
            const pc = exColorMapRef.current?.get(prevUd.baseFrName) ?? prevUd.originalColor;
            prevMat.emissive.copy(pc).multiplyScalar(0.3);
          } else {
            prevMat.emissive.set(0x000000);
          }
        }
        hoveredRef.current = mesh;
        // Glow current
        if (noGroupLock) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          const ud = mesh.userData as MuscleUserData;
          const gc = activeGroups.length > 0
            ? exColorMapRef.current?.get(ud.baseFrName) ?? ud.originalColor
            : ud.originalColor;
          mat.emissive.copy(gc).multiplyScalar(0.8);
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
          const pc = exColorMapRef.current?.get(prevUd.baseFrName) ?? prevUd.originalColor;
          prevMat.emissive.copy(pc).multiplyScalar(0.3);
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
          stencilWriteMask: 0x01,
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
  scanYRef,
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
          scanYRef={scanYRef}
          wireframe={wireframe}
          onHoverMuscle={onHoverMuscle}
          onClickMuscle={onClickMuscle}
          onLongPressMuscle={onLongPressMuscle}
        />
      )}
    </group>
  );
}
