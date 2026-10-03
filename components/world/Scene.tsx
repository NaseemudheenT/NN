"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { buildMaterials, disposeMaterials } from "@/components/showroom/materials";
import { Building, Doors } from "./Building";
import { Fittings, Outside } from "./Fittings";
import { WorldLight } from "./Light";
import { Stock } from "./Garments";
import type { WalkerState } from "./useWalker";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";

/* A RectAreaLight is black until its lookup tables are uploaded. Once, at
   module scope, is both sufficient and cheap. */
RectAreaLightUniformsLib.init();

/** Puts the walker's eye behind the camera, every frame. */
function Rig({ state, step }: { state: React.RefObject<WalkerState>; step: (dt: number) => void }) {
  const { camera } = useThree();
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  useFrame((_, dt) => {
    step(dt);
    const s = state.current;
    camera.position.copy(s.eye);
    euler.set(s.pitch, s.yaw, 0);
    camera.quaternion.setFromEuler(euler);
  });

  return null;
}

export function Scene({
  sky,
  products,
  walker,
  quality,
  still,
  doorsOpen,
  onPick,
  picked,
}: {
  sky: SkyState;
  products: Product[];
  walker: { state: React.RefObject<WalkerState>; step: (dt: number) => void };
  quality: "high" | "low";
  still: boolean;
  doorsOpen: boolean;
  onPick: (p: Product, world: THREE.Vector3) => void;
  picked: string | null;
}) {
  const { gl } = useThree();
  const m = useMemo(() => buildMaterials(), []);
  useEffect(() => () => disposeMaterials(m), [m]);

  /* Exposure is the eye adapting. The hall at midnight is not a dark
     version of the hall at noon; it is a hall your pupils have opened for. */
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = sky.exposure;
  }, [gl, sky.exposure]);

  const tint = useMemo(() => new THREE.Color(...sky.rgb), [sky.rgb]);

  return (
    <>
      <Rig state={walker.state} step={walker.step} />
      {/* fog is the air in the hall: tinted by the sun, thinning as the
          lamps come up, because a lit room's haze is lit haze */}
      <fogExp2
        attach="fog"
        args={[tint.clone().lerp(new THREE.Color("#0c0f16"), 0.74).getHex(), 0.0072]}
      />
      <WorldLight sky={sky} quality={quality} />
      <Building m={m} quality={quality} />
      <Doors m={m} open={doorsOpen} />
      <Outside tint={tint} lampLevel={sky.lampLevel} />
      <Fittings m={m} still={still} quality={quality} />
      <Stock m={m} products={products} onPick={onPick} picked={picked} />
    </>
  );
}
