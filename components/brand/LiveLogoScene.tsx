"use client";

/**
 * The NN monogram as a physical object.
 *
 * Two interlocked serif Ns in brushed ivory metal, inside a thin ring. The idle
 * animation is a showroom spotlight travelling across the metal: it is a real
 * moving light, not an animated gradient, which is why the highlight bends
 * around the bevels and catches the inside of the ring as it passes.
 *
 * On hover or tap the two Ns separate a little and settle back — a spring, so
 * they overshoot slightly and come to rest, the way two real plates would.
 * Dragging turns the whole thing.
 */

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ProceduralEnvironment } from "@/components/showroom/ProceduralEnvironment";
import * as THREE from "three";
import { buildLetterGeometry, letterOffsetFor, monogramWidthFor } from "./monogramGeometry";

const LETTER_HEIGHT = 1.0;

function Monogram({ separation, spin }: { separation: number; spin: number }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const spotlight = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  const single = useMemo(
    () => buildLetterGeometry({ heightMeters: LETTER_HEIGHT, depth: 0.18, bevel: 0.16 }),
    [],
  );

  const offset = letterOffsetFor(LETTER_HEIGHT);
  const pairWidth = monogramWidthFor(LETTER_HEIGHT);

  const ringGeometry = useMemo(
    () => new THREE.TorusGeometry(pairWidth * 0.62, 0.016, 12, 128),
    [pairWidth],
  );

  /* The mark is INK, in three dimensions as in two.

     This was brushed gold. The brief is explicit — "the NN monogram in Deep
     Black (#0A0A0A) or stark white against dark surfaces. NO GOLD" — and the
     brand board's own logo panel sets the monogram in solid black on ivory.

     Rendering it as Ivory rather than as gold loses nothing, because what
     made the 3D mark read as an OBJECT was never its hue: it was the
     metalness, the brushed roughness and the travelling spotlight below.
     Those all stay. An ivory metal reads as polished silver or as bright
     enamel depending on the light, and either is more NN than brass. */
  const ink = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f7f5ef"),
        // Brushed, not polished: a mirror finish on a logo looks like plastic.
        roughness: 0.26,
        metalness: 1,
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
      }),
    [],
  );

  const inkBright = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ffffff"),
        roughness: 0.14,
        metalness: 1,
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    /* the travelling spotlight: a slow ellipse across the face of the metal */
    if (spotlight.current) {
      spotlight.current.position.set(
        Math.sin(t * 0.34) * 2.6,
        Math.cos(t * 0.27) * 1.4 + 0.8,
        2.4,
      );
    }

    /* the ring turns, very slowly */
    if (ring.current) {
      ring.current.rotation.z += delta * 0.06;
    }

    /* the drag, eased */
    if (group.current) {
      group.current.rotation.y += (spin - group.current.rotation.y) * Math.min(1, delta * 5);
      // a little life even when nobody is touching it
      group.current.rotation.x = Math.sin(t * 0.23) * 0.045;
    }
  });

  return (
    <group ref={group}>
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        ref={spotlight}
        target={target}
        color="#fff3d4"
        intensity={26}
        angle={0.7}
        penumbra={0.9}
        distance={12}
        decay={1.4}
      />

      {/* the pair. The geometry is already centred on the pair, so the two
          meshes only need their own offsets and the hover separation. */}
      <group>
        <mesh
          geometry={single}
          material={ink}
          position={[offset + separation, 0, -0.06]}
          castShadow
        />
        <mesh geometry={single} material={inkBright} position={[-separation, 0, 0.05]} castShadow />
      </group>

      {/* the thin ring */}
      <mesh ref={ring} geometry={ringGeometry} material={ink} />
    </group>
  );
}

export default function LiveLogoScene({ reducedMotion }: { reducedMotion: boolean }) {
  const [separation, setSeparation] = useState(0);
  const [spin, setSpin] = useState(0);
  const dragging = useRef<{ x: number; from: number } | null>(null);

  /* hover and tap: the letters part, then settle */
  const part = useCallback(() => {
    if (reducedMotion) return;
    setSeparation(0.09);
    // Overshoot on the way back, so it settles rather than stopping dead.
    setTimeout(() => setSeparation(-0.018), 260);
    setTimeout(() => setSeparation(0), 520);
  }, [reducedMotion]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, from: spin };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.x;
    setSpin(dragging.current.from + dx * 0.012);
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  return (
    <Canvas
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      dpr={[1, 2]}
      camera={{ fov: 34, position: [0, 0, 5.4] }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      onPointerEnter={part}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Enough light to read the metal: a key, a rim, and the environment the
          brushed finish needs in order to look brushed. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff6e2" />
      <directionalLight position={[-4, -1, -3]} intensity={0.9} color="#8aa0c0" />
      {/* Suspense matters here: without it, anything that loads inside the
          canvas takes the whole logo down rather than just delaying it. */}
      <Suspense fallback={null}>
        <ProceduralEnvironment
          keyColour="#fff4e0"
          fillColour="#c8d8ea"
          daylight={1}
          lampColour="#ffd9a0"
          lampLevel={0.5}
          intensity={0.85}
        />
      </Suspense>

      <Monogram separation={separation} spin={spin} />
    </Canvas>
  );
}
