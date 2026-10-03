"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import type { Shot } from "./intro";
import { EYE } from "./plan";
import type { WalkerState } from "./useWalker";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";

/**
 * The building, on screen.
 *
 * Default-exported and lazily imported so three.js, drei and the whole
 * scene graph stay out of the first bundle. Nothing on the page waits for
 * this file; when it arrives it fades in over the painted hall behind it.
 */
export default function WorldCanvas(props: {
  sky: SkyState;
  products: Product[];
  walker: { state: React.RefObject<WalkerState>; step: (dt: number) => void };
  quality: "high" | "low";
  still: boolean;
  doorsOpen: boolean;
  introTime: React.RefObject<number | null>;
  onShot: (shot: Shot) => void;
  onPick: (p: Product, world: THREE.Vector3) => void;
  onFloor: (point: THREE.Vector3) => void;
  picked: string | null;
}) {
  const high = props.quality === "high";
  return (
    <Canvas
      className="nn-canvas"
      shadows={high ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={high ? [1, 1.75] : [1, 1.2]}
      gl={{
        antialias: high,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
      }}
      camera={{ position: [0, EYE, 12.6], fov: 62, near: 0.08, far: 700 }}
      onCreated={({ gl }) => gl.setClearColor("#0a0a0a")}
    >
      <Scene {...props} />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}
