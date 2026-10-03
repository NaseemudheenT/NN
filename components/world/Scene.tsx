"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { buildMaterials, disposeMaterials } from "@/components/showroom/materials";
import { Building, Doors } from "./Building";
import { SoftShadows } from "@react-three/drei";
import { Exterior, SkyDome } from "./Exterior";
import { Fittings, Outside } from "./Fittings";
import { introShot, type Shot } from "./intro";
import { Dust } from "./Dust";
import { Markers } from "./Markers";
import type { Zone } from "./plan";
import { Cinema } from "./Cinema";
import { WorldLight } from "./Light";
import { Stock } from "./Garments";
import type { WalkerState } from "./useWalker";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";

/* A RectAreaLight is black until its lookup tables are uploaded. Once, at
   module scope, is both sufficient and cheap. */
RectAreaLightUniformsLib.init();

/**
 * Who is holding the camera.
 *
 * During the arrival, the choreography. After it, the walker. One place
 * decides, every frame, so there is never a moment where both are writing
 * to the camera and the result is whichever ran last.
 */
function Rig({
  state,
  step,
  introTime,
  introHold,
  onShot,
}: {
  state: React.RefObject<WalkerState>;
  step: (dt: number) => void;
  /** Seconds into the arrival, or null once the customer has the camera. */
  introTime: React.RefObject<number | null>;
  /** True while the camera is parked at the doors, waiting to be let in. */
  introHold: React.RefObject<boolean>;
  onShot: (shot: Shot) => void;
}) {
  const { camera } = useThree();
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const shot = useMemo<Shot>(
    () => ({ position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 52, doorsOpen: false }),
    [],
  );

  useFrame((_, dt) => {
    const t = introTime.current;

    if (t !== null) {
      /* The clock stops while the camera is parked at the doors. Holding
         the SHOT rather than pausing a separate timer means the frame on
         screen is exactly the last frame of the approach — there is no
         seam between the film stopping and the customer being asked in. */
      /* dt is clamped because a tab that was hidden hands back a delta of
         several seconds, which would otherwise skip the whole arrival. */
      const at = introHold.current ? t : t + Math.min(dt, 0.05);
      introTime.current = at;
      introShot(at, shot);
      camera.position.copy(shot.position);
      camera.lookAt(shot.target);
      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - shot.fov) > 0.01) {
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
      }
      onShot(shot);
      return;
    }

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
  introTime,
  introHold,
  live,
  onShot,
  onTeleport,
  activeZone,
  onPick,
  onFloor,
  picked,
}: {
  sky: SkyState;
  products: Product[];
  walker: { state: React.RefObject<WalkerState>; step: (dt: number) => void };
  quality: "high" | "low";
  still: boolean;
  doorsOpen: boolean;
  introTime: React.RefObject<number | null>;
  introHold: React.RefObject<boolean>;
  live: boolean;
  onShot: (shot: Shot) => void;
  onTeleport: (zone: Zone) => void;
  activeZone: string;
  onPick: (p: Product, world: THREE.Vector3) => void;
  onFloor: (point: THREE.Vector3) => void;
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
      <Rig
        state={walker.state}
        step={walker.step}
        introTime={introTime}
        introHold={introHold}
        onShot={onShot}
      />
      {/* fog is the air in the hall: tinted by the sun, thinning as the
          lamps come up, because a lit room's haze is lit haze */}
      <fogExp2
        attach="fog"
        args={[tint.clone().lerp(new THREE.Color("#0c0f16"), 0.74).getHex(), 0.0072]}
      />
      {/* Contact-hardening shadows: sharp where an object meets the floor,
          softening with distance, which is what a real penumbra does. The
          flat-edged shadow of a single-sample map is the other half of why
          a render looks like a render. */}
      {quality === "high" ? <SoftShadows size={22} samples={12} focus={0.6} /> : null}
      <WorldLight sky={sky} quality={quality} />
      <Dust beam={sky.beam} tint={tint} count={quality === "high" ? 420 : 160} />
      <SkyDome tint={tint} lampLevel={sky.lampLevel} />
      <Building m={m} quality={quality} />

      {/* ── the floor you can click ─────────────────────────────
          An invisible plane lying just over the real floor, and the ONLY
          thing in the building that answers a click on empty space. Making
          the real floor clickable would mean every garment, plinth and
          chair had to stop the event from reaching it; one dedicated plane
          at the bottom of the stack catches whatever nothing else wanted,
          which is exactly what "click the floor" means. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, -5]}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onFloor(e.point);
        }}
      >
        <planeGeometry args={[20, 42]} />
      </mesh>
      <Exterior m={m} lampLevel={sky.lampLevel} />
      <Doors m={m} open={doorsOpen} />
      <Outside tint={tint} lampLevel={sky.lampLevel} />
      <Fittings m={m} still={still} quality={quality} />
      <Stock m={m} products={products} onPick={onPick} picked={picked} />
      <Markers live={live} activeZone={activeZone} onTeleport={onTeleport} />
      <Cinema enabled={quality === "high"} />
    </>
  );
}
