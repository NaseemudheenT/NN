"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import { PLAN } from "./plan";
import type { SkyState } from "@/lib/daytime";

/**
 * The real hall.
 *
 * Default-exported and lazily imported so three.js, drei and the whole scene
 * graph stay out of the first bundle. Nothing on the page waits for this
 * file; when it arrives it fades in over the painted room behind it.
 */
export default function ShowroomCanvas({
  sky,
  colours,
  still,
  quality,
}: {
  sky: SkyState;
  colours: string[];
  still: boolean;
  quality: "high" | "low";
}) {
  return (
    <Canvas
      className="nn-canvas"
      shadows={quality === "high" ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      gl={{
        antialias: quality === "high",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{
        position: PLAN.camera.position,
        fov: PLAN.camera.fov,
        near: 0.1,
        far: 420,
      }}
      /* The hall is scenery. Every control on the page is DOM, so the canvas
         never needs to hit-test and never steals a click. */
      eventSource={undefined}
      frameloop={still ? "demand" : "always"}
      onCreated={({ gl, scene }) => {
        gl.setClearColor("#0a0a0a");
        scene.matrixWorldAutoUpdate = true;
      }}
    >
      <Scene sky={sky} colours={colours} still={still} quality={quality} />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}
