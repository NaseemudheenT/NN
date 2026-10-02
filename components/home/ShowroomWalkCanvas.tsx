"use client";

/**
 * The 3D showroom, as the homepage's backdrop.
 *
 * Its own chunk: three.js, R3F, drei and postprocessing together are over half
 * a megabyte, and loading them with the document would break the performance
 * budget on exactly the mid-range Android the budget exists for. The page
 * paints the CSS atmosphere first, then this arrives and takes over.
 *
 * The camera is driven by the page's scroll rather than by clicks, so the
 * customer walks the room by reading it.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";
import { Scene } from "@/components/showroom/Scene";
import { ScrollCamera, HOME_WALK } from "@/components/showroom/ScrollCamera";
import { CinematicGrade } from "@/components/showroom/CinematicGrade";
import { rigFromSky } from "@/components/showroom/lightingRig";
import { viewpointById } from "@/components/showroom/viewpoints";
import { announceShowroomReady } from "@/components/atmosphere/ShowroomEntry";

export type Quality = "low" | "medium" | "high";

export interface ShowroomWalkCanvasProps {
  products: Product[];
  sky: SkyState;
  reducedMotion: boolean;
  progress: MotionValue<number>;
  onSelect: (product: Product) => void;
  selected: Product | null;
  initialQuality: Quality;
}

export default function ShowroomWalkCanvas({
  products,
  sky,
  reducedMotion,
  progress,
  onSelect,
  selected,
  initialQuality,
}: ShowroomWalkCanvasProps) {
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const degraded = useRef(0);
  const rig = useMemo(() => rigFromSky(sky), [sky]);

  /* Tell the entrance the room is ready, so its progress reflects real work
     rather than a timer pretending to. */
  const onCreated = useCallback(
    ({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = rig.exposure;
      scene.background = new THREE.Color(sky.phase === "night" ? "#060607" : "#1a1a1e");
      announceShowroomReady();
    },
    [rig.exposure, sky.phase],
  );

  /* Drop quality rather than frames. One climb back up is allowed, so a
     brief stall does not permanently cost the good version, but a genuinely
     weak device is not asked twice. */
  const onDecline = useCallback(() => {
    degraded.current += 1;
    setQuality((q) => (q === "high" ? "medium" : "low"));
  }, []);
  const onIncline = useCallback(() => {
    if (degraded.current > 1) return;
    setQuality((q) => (q === "low" ? "medium" : "high"));
  }, []);

  /* A fallback in case nothing reports in — the entrance must never wait on
     a signal that is not coming. */
  useEffect(() => {
    const t = setTimeout(announceShowroomReady, 2600);
    return () => clearTimeout(t);
  }, []);

  const effects = quality !== "low" && !reducedMotion;

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
      camera={{ fov: HOME_WALK[0].fov, near: 0.1, far: 140, position: HOME_WALK[0].position }}
      onCreated={onCreated}
    >
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} bounds={() => [38, 58]} flipflops={3} />
      <AdaptiveDpr pixelated={false} />

      <Suspense fallback={null}>
        <Scene
          products={products}
          sky={sky}
          quality={quality}
          activeViewpoint={viewpointById("entrance")}
          onViewpoint={() => {}}
          onSelect={onSelect}
          selected={selected}
          /* The walk replaces the hotspots on the homepage: pins floating in
             the room would compete with the scrolling copy for attention. */
          showHotspots={false}
        />
        <Preload all />
      </Suspense>

      <ScrollCamera
        stations={HOME_WALK}
        progress={progress}
        reducedMotion={reducedMotion}
        lookAmount={selected ? 0.2 : 1}
      />

      {effects ? (
        <CinematicGrade
          quality={quality}
          phase={sky.phase}
          bloom={rig.bloom}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </Canvas>
  );
}
