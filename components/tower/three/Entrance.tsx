"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { material, lit } from "./materials";
import { monogramTexture } from "./textures";
import { bannerGeometry } from "./fixtures";
import { ROTUNDA } from "./geometry";

/**
 * NN TOWER — the front door.
 *
 * Two leaves of heavy architectural glass in a blackened steel portal, set
 * into the rotunda on the corner the camera arrives at.
 *
 * ── why the doors are damped and not tweened ─────────────────────────
 * `lerp(current, target, 1 - 0.0001^dt)` chases a target every frame
 * instead of playing a fixed animation. Heavy glass doors do not move
 * linearly — they accelerate, then ease into the stop — and a damped chase
 * gives exactly that for free. It also means the doors can be told to close
 * halfway through opening and they simply turn around, which a timeline
 * cannot do without fighting itself.
 *
 * The frame-rate independence matters too: raising the damping to a power
 * of delta keeps the motion identical at 30 fps and at 144.
 */

/** The outward normal of the rotunda at its midpoint — where the door goes. */
const DOOR_ANGLE = (ROTUNDA.start + ROTUNDA.end) / 2;
const DOOR_X = ROTUNDA.centre.x + Math.cos(DOOR_ANGLE) * ROTUNDA.r;
const DOOR_Z = -(ROTUNDA.centre.y + Math.sin(DOOR_ANGLE) * ROTUNDA.r);
/** Rotation so the portal's local +Z points out of the building. */
const DOOR_FACING = Math.atan2(DOOR_X, DOOR_Z);

const LEAF_W = 1.42;
const LEAF_H = 3.4;
const TRAVEL = 1.46;

export function Entrance({ open }: { open: boolean }) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.0009, Math.min(dt, 0.1));
    if (left.current) {
      const t = open ? -TRAVEL : 0;
      left.current.position.x += (t - left.current.position.x) * k;
    }
    if (right.current) {
      const t = open ? TRAVEL : 0;
      right.current.position.x += (t - right.current.position.x) * k;
    }
  });

  const leaf = useMemo(() => new THREE.BoxGeometry(LEAF_W, LEAF_H, 0.07), []);
  const jamb = useMemo(() => new THREE.BoxGeometry(0.2, LEAF_H + 0.9, 0.34), []);
  const head = useMemo(() => new THREE.BoxGeometry(LEAF_W * 2 + 0.6, 0.28, 0.4), []);
  const pull = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 1.5, 10), []);
  const mark = useMemo(() => monogramTexture(256), []);
  const banner = useMemo(() => bannerGeometry(0.9, 2.6), []);
  const step = useMemo(() => new THREE.BoxGeometry(5.2, 0.16, 0.42), []);
  const planter = useMemo(() => new THREE.BoxGeometry(0.72, 0.78, 0.72), []);

  return (
    <group position={[DOOR_X, 0, DOOR_Z]} rotation={[0, DOOR_FACING, 0]}>
      {/* the portal */}
      <mesh geometry={jamb} material={material("steel")} position={[-(LEAF_W + 0.2), LEAF_H / 2, 0]} castShadow />
      <mesh geometry={jamb} material={material("steel")} position={[LEAF_W + 0.2, LEAF_H / 2, 0]} castShadow />
      <mesh geometry={head} material={material("steel")} position={[0, LEAF_H + 0.3, 0]} castShadow />

      {/* the leaves */}
      <mesh ref={left} geometry={leaf} material={material("glass")} position={[0, LEAF_H / 2, 0]}>
        <mesh geometry={pull} material={material("gold")} position={[LEAF_W / 2 - 0.22, 0, 0.08]} />
      </mesh>
      <mesh ref={right} geometry={leaf} material={material("glass")} position={[0, LEAF_H / 2, 0]}>
        <mesh geometry={pull} material={material("gold")} position={[-(LEAF_W / 2 - 0.22), 0, 0.08]} />
      </mesh>

      {/* The reception light spilling out onto the pavement — what tells a
          passer-by that a shop is open. It used to be a full-height plane
          at 0.8, which from outside read as two slabs of orange filling the
          doorway; the actual effect is a pool of light at FOOT level, so it
          is now a low band well behind the leaves. */}
      <mesh position={[0, 0.85, -1.4]} material={lit(2700, 0.42)}>
        <planeGeometry args={[LEAF_W * 2.1, 1.7]} />
      </mesh>
      <pointLight position={[0, 2.4, 0.6]} intensity={30} distance={13} decay={2} color="#ffd9a8" />

      {/* The black canvas banners that flank the entrance — the single
          most recognisable thing on the reference board's street view, and
          the only place the monogram appears at architectural scale. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.9, LEAF_H + 0.55, 0.3]}>
          <mesh geometry={banner} material={material("steel")} castShadow>
            <meshStandardMaterial
              color={new THREE.Color("#0a0a0a").convertSRGBToLinear()}
              roughness={0.92}
              metalness={0}
            />
          </mesh>
          <mesh position={[0, -1.1, 0.02]}>
            <planeGeometry args={[0.6, 0.47]} />
            <meshBasicMaterial map={mark ?? undefined} color="#c5a059" transparent toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Three steps up to the threshold. A shop you step UP into reads as
          a different order of thing from one you walk straight into, and
          the reference puts the entrance on a plinth. */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={step}
          material={material("limestone")}
          position={[0, -0.08 - i * 0.16, 1.5 + i * 0.42]}
          receiveShadow
          castShadow
        />
      ))}

      {/* clipped bay trees either side of the door */}
      {[-2.5, 2.5].map((x, i) => (
        <group key={i} position={[x, 0, 1.5]}>
          <mesh geometry={planter} material={material("basalt")} position={[0, 0.39, 0]} castShadow receiveShadow />
          <mesh position={[0, 1.22, 0]} castShadow>
            <sphereGeometry args={[0.46, 12, 10]} />
            <meshStandardMaterial color={new THREE.Color("#3c4e2c").convertSRGBToLinear()} roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 0.88, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.4, 8]} />
            <meshStandardMaterial color={new THREE.Color("#3b2d24").convertSRGBToLinear()} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* The mark above the door — the real monogram, lit, not a blank
          rectangle standing in for one. */}
      <mesh position={[0, LEAF_H + 1.15, 0.14]}>
        <planeGeometry args={[1.0, 0.79]} />
        <meshBasicMaterial
          map={mark ?? undefined}
          color={new THREE.Color("#f0e2c0").multiplyScalar(1.5)}
          transparent
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export const DOOR_POSITION: [number, number, number] = [DOOR_X, 0, DOOR_Z];
export const DOOR_OUTWARD: [number, number] = [Math.sin(DOOR_FACING), Math.cos(DOOR_FACING)];
