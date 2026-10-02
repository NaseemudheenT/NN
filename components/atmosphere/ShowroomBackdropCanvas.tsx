"use client";

/**
 * The backdrop's canvas. Split from ShowroomBackdrop so three.js is a
 * dynamic import and never reaches a visitor who will not see it.
 */

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { Scene } from "@/components/showroom/Scene";
import { CameraRig } from "@/components/showroom/CameraRig";
import { rigFromSky } from "@/components/showroom/lightingRig";
import type { Viewpoint } from "@/components/showroom/viewpoints";
import type { SkyState } from "@/lib/daytime";

export default function ShowroomBackdropCanvas({
  station,
  sky,
  reducedMotion,
}: {
  station: Viewpoint;
  sky: SkyState;
  reducedMotion: boolean;
}) {
  const rig = rigFromSky(sky);

  return (
    <Canvas
      /* No alpha: this is the bottom of the page and compositing a
         transparent canvas over the document costs a blend for nothing. */
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      /* Capped hard. A backdrop at device pixel ratio on a 3× phone is
         nine times the fragments for something behind a scrim. */
      dpr={[1, 1.25]}
      shadows={false}
      camera={{ fov: station.fov, near: 0.1, far: 48 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = rig.exposure * 0.9;
        scene.fog = new THREE.Fog(rig.fog.colour, rig.fog.near, rig.fog.far);
      }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <Scene
          /* No products. The backdrop is architecture — garments behind a
             scrim are a blur nobody can shop, and fetching the catalogue a
             second time to render it would be worse. The rails and the
             table are still there; they are simply empty, which is what a
             showroom looks like from the next room anyway. */
          products={[]}
          sky={sky}
          quality="low"
          activeViewpoint={station}
          onViewpoint={() => {}}
          onSelect={() => {}}
          selected={null}
          showHotspots={false}
        />
        <Preload all />
      </Suspense>

      {/* The move between routes is the cinematic part: the camera walks
          from the last page's station to this one, round the furniture,
          using the same choreography the walkable showroom uses. */}
      <CameraRig
        viewpoint={station}
        intro={false}
        reducedMotion={reducedMotion}
        /* No look-around. The pointer belongs to the page in front. */
        lookAmount={0}
      />
    </Canvas>
  );
}
