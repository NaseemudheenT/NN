"use client";

/**
 * The 3D canvas, in its own chunk.
 *
 * three.js, R3F, drei and postprocessing come to something over 500 kB raw.
 * Loading them with the page would blow the performance budget in CLAUDE.md and
 * delay first paint on exactly the mid-range Android the budget exists for. So
 * this module is imported dynamically: the page paints the CSS room first, then
 * the 3D arrives and takes over.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";
import { Scene } from "./Scene";
import { CameraRig } from "./CameraRig";
import { INTRO, type Viewpoint } from "./viewpoints";
import { rigFromSky } from "./lightingRig";

export type Quality = "low" | "medium" | "high";

export interface ShowroomCanvasProps {
  products: Product[];
  sky: SkyState;
  reducedMotion: boolean;
  viewpoint: Viewpoint;
  onViewpoint: (id: string) => void;
  onSelect: (product: Product) => void;
  selected: Product | null;
  initialQuality: Quality;
  onReady: () => void;
}

export default function ShowroomCanvas({
  products,
  sky,
  reducedMotion,
  viewpoint,
  onViewpoint,
  onSelect,
  selected,
  initialQuality,
  onReady,
}: ShowroomCanvasProps) {
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const [introDone, setIntroDone] = useState(false);
  const degraded = useRef(0);

  const rig = useMemo(() => rigFromSky(sky), [sky]);

  /* Drop quality rather than frames. Climbing back up is allowed once, so a
     brief stall does not permanently cost the visitor the good version, but a
     genuinely weak device is not asked twice. */
  const onDecline = useCallback(() => {
    degraded.current += 1;
    setQuality((q) => (q === "high" ? "medium" : "low"));
  }, []);
  const onIncline = useCallback(() => {
    if (degraded.current > 1) return;
    setQuality((q) => (q === "low" ? "medium" : "high"));
  }, []);

  const onIntroDone = useCallback(() => setIntroDone(true), []);

  /* A safety net. The hotspots are how a visitor moves around the room, so they
     must appear even if the entry move never reports finishing — a dropped
     frame or a backgrounded tab must not leave someone stuck at the door. */
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), (INTRO.duration + 1.5) * 1000);
    return () => clearTimeout(t);
  }, []);

  const showEffects = quality !== "low" && !reducedMotion;

  return (
    <Canvas
      className="absolute inset-0"
      shadows={quality !== "low"}
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      gl={{
        antialias: quality === "high",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: viewpoint.fov, near: 0.1, far: 120, position: viewpoint.position }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = rig.exposure;
        scene.background = new THREE.Color(sky.phase === "night" ? "#050507" : "#d9d3c6");
        onReady();
      }}
    >
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} bounds={() => [38, 58]} flipflops={3} />
      <AdaptiveDpr pixelated={false} />

      <Suspense fallback={null}>
        <Scene
          products={products}
          sky={sky}
          quality={quality}
          activeViewpoint={viewpoint}
          onViewpoint={onViewpoint}
          onSelect={onSelect}
          selected={selected}
          showHotspots={introDone || reducedMotion}
        />
        <Preload all />
      </Suspense>

      <CameraRig
        viewpoint={viewpoint}
        intro={!reducedMotion}
        reducedMotion={reducedMotion}
        onIntroDone={onIntroDone}
        lookAmount={selected ? 0.25 : 1}
      />

      {showEffects ? (
        <EffectComposer enableNormalPass={false}>
          {/* Bloom sits on the lamps, the backlit sign and the brass only: the
              threshold rises in daylight so cloth never glows. */}
          <Bloom
            intensity={rig.bloom.intensity}
            luminanceThreshold={rig.bloom.threshold}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <Vignette offset={0.32} darkness={sky.phase === "night" ? 0.55 : 0.3} />
          {quality === "high" ? <SMAA /> : <></>}
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
