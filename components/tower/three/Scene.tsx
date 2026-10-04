"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, CameraControls, Preload } from "@react-three/drei";
import { Rig, GL_SETTINGS } from "./Rig";
import { Shell } from "./Shell";
import { Street } from "./Street";
import { Sky } from "./Sky";
import { Core } from "./Core";
import { Entrance, DOOR_POSITION } from "./Entrance";
import { LEVELS, HALF, type LevelSpec } from "@/lib/tower/spec";

export type Mode = "intro" | "entering" | "inside";

/**
 * NN TOWER — the camera.
 *
 * Three behaviours, one rig.
 *
 * INTRO is a slow automatic orbit with a drifting elevation, so the tower
 * presents its front, its flank, its back and its roof without anyone
 * having to touch anything — the building introduces itself.
 *
 * ENTERING is a two-beat move, because a single interpolation from the
 * street to the reception desk travels straight through a stone wall. The
 * camera first arrives at the threshold, which is the beat where the doors
 * open, and only then pushes through the opening.
 *
 * INSIDE stands the camera on a chosen floor.
 */

const ORBIT_FROM: [number, number, number] = [55, 24, 57];
const ORBIT_TO: [number, number, number] = [0, 19, 0];

function Camera({
  mode,
  floor,
  explode,
}: {
  mode: Mode;
  floor: number | null;
  explode: number;
}) {
  const controls = useRef<CameraControls>(null);
  const t = useRef(0);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;

    if (mode === "intro") {
      c.setLookAt(...ORBIT_FROM, ...ORBIT_TO, true);
      return;
    }

    if (mode === "entering") {
      const [dx, , dz] = DOOR_POSITION;
      // beat one: stop at the threshold, eye height, doors dead ahead
      c.setLookAt(dx + 11.5, 5.2, dz + 12.5, dx, 2.6, dz, true);
      // beat two: through the opening and into the hall
      const id = setTimeout(() => {
        c.setLookAt(dx + 0.6, 2.5, dz + 0.8, -2, 2.3, -2, true);
      }, 1700);
      return () => clearTimeout(id);
    }

    const spec = LEVELS.find((l) => l.index === floor) ?? LEVELS[0];
    const eye = spec.base + Math.min(spec.height * 0.45, 2.1);
    const lift = explode * 13;
    const out = 1 + explode * 0.6;
    c.setLookAt(
      (HALF + 6) * out, eye + 1.7 + lift, (HALF + 7) * out,
      0.5, eye + lift * 0.6, 0.5,
      true,
    );
  }, [mode, floor, explode]);

  /* The automatic orbit. Azimuth advances at a constant rate; elevation
     breathes on a much slower sine so the roof comes into view roughly once
     per revolution and then settles back to a street-level eye. */
  useFrame((_, dt) => {
    if (mode !== "intro") return;
    const c = controls.current;
    if (!c) return;
    t.current += dt;
    c.azimuthAngle += dt * 0.085;
    c.polarAngle = 1.13 + Math.sin(t.current * 0.085) * 0.33;
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={4}
      maxDistance={170}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.9}
      draggingSmoothTime={0.16}
    />
  );
}

export function Scene({
  mode,
  floor,
  explode,
  doorsOpen,
  onSelect,
  quality,
}: {
  mode: Mode;
  floor: number | null;
  explode: number;
  doorsOpen: boolean;
  onSelect: (s: LevelSpec) => void;
  quality: "high" | "medium" | "low";
}) {
  return (
    <Canvas
      shadows
      dpr={quality === "high" ? [1, 2] : [1, 1.4]}
      gl={GL_SETTINGS}
      camera={{ fov: 38, near: 0.15, far: 800, position: ORBIT_FROM }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#07070a").convertSRGBToLinear();
        /* Aerial perspective. Real air scatters, and a tower with perfectly
           clear air between it and the viewer reads as a product photograph
           of a model rather than as a building standing in a city. */
        scene.fog = new THREE.FogExp2(
          new THREE.Color("#0e0c0f").convertSRGBToLinear(),
          0.0052,
        );
      }}
    >
      <Suspense fallback={null}>
        <Sky quality={quality} />
        <Rig quality={quality} />
        <Street />
        <Shell explode={explode} focus={mode === "inside" ? floor : null} onSelect={onSelect} />
        <Core floor={floor ?? 0} />
        <Entrance open={doorsOpen} />
        <Camera mode={mode} floor={floor} explode={explode} />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
