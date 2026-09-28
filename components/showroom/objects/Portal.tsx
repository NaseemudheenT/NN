"use client";

/**
 * The entrance portal.
 *
 * A showroom begins at its door, and the door is the one piece of a flagship
 * that a customer touches before anything else. So it is built properly: a
 * dressed limestone reveal, a brushed stainless frame, two tall leaves of
 * smoked glass, and a champagne-gold pull long enough to need a whole hand.
 *
 * It stands at x = −6, in the entrance wall, and the camera passes through it
 * on the way in. Smoked glass is the point of the thing — from outside the
 * showroom is a suggestion rather than a display, and you have to come in.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "../materials";
import { Surface, ROOM } from "./Room";

export const PORTAL = {
  /** Clear opening, metres. Tall enough to feel like an entrance. */
  width: 2.6,
  height: 3.1,
  /** How far the reveal is recessed from the wall face. */
  reveal: 0.42,
  x: -ROOM.halfW,
} as const;

function Leaf({
  side,
  open,
}: {
  side: -1 | 1;
  /** 0 shut, 1 fully swung. The camera never waits for it. */
  open: number;
}) {
  const w = PORTAL.width / 2 - 0.02;
  // A door swings about its outer jamb, not its centre: the hinge is at the
  // edge, so the group is offset by half a leaf before it is rotated.
  const swing = side * open * 0.62;

  return (
    <group position={[0, 0, side * (PORTAL.width / 2)]} rotation={[0, swing, 0]}>
      <group position={[0, 0, -side * (w / 2)]}>
        {/* the smoked glass */}
        <mesh castShadow>
          <boxGeometry args={[0.032, PORTAL.height - 0.1, w]} />
          <meshPhysicalMaterial
            color={MATERIALS.smokedGlass.colour}
            roughness={MATERIALS.smokedGlass.roughness}
            metalness={0}
            transparent
            opacity={MATERIALS.smokedGlass.opacity}
            transmission={MATERIALS.smokedGlass.transmission}
            ior={MATERIALS.smokedGlass.ior}
            thickness={0.032}
          />
        </mesh>

        {/* brushed stainless stile and rails around the leaf */}
        {[
          { p: [0, (PORTAL.height - 0.1) / 2 - 0.05, 0], a: [0.045, 0.1, w] },
          { p: [0, -(PORTAL.height - 0.1) / 2 + 0.05, 0], a: [0.045, 0.1, w] },
          { p: [0, 0, -side * (w / 2 - 0.04)], a: [0.045, PORTAL.height - 0.1, 0.08] },
        ].map((bar, i) => (
          <Surface
            key={i}
            material="brushedSteel"
            position={bar.p as [number, number, number]}
            castShadow
          >
            <boxGeometry args={bar.a as [number, number, number]} />
          </Surface>
        ))}

        {/* the pull: a champagne-gold tube on stand-offs, at hand height.
            Long pulls are a flagship signature — they say the door is heavy
            and that someone will hold it for you. */}
        <group position={[-0.09, -0.05, side * (w / 2 - 0.22)]}>
          <mesh rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.019, 0.019, 1.15, 16]} />
            <meshPhysicalMaterial
              color={MATERIALS.champagne.colour}
              roughness={MATERIALS.champagne.roughness}
              metalness={1}
            />
          </mesh>
          {[-0.48, 0.48].map((y) => (
            <mesh key={y} position={[0.045, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.011, 0.011, 0.09, 12]} />
              <meshPhysicalMaterial
                color={MATERIALS.champagneBright.colour}
                roughness={MATERIALS.champagneBright.roughness}
                metalness={1}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export function Portal({
  /** 0 at the pavement, 1 once the visitor is through. Drives the swing. */
  progress = 1,
  night,
}: {
  progress?: number;
  night: boolean;
}) {
  const open = Math.min(1, Math.max(0, progress));
  const stone = night ? "limestoneNight" : "limestone";

  // The light that falls in through the open door. It is warm because it is
  // the showroom's own light spilling out, not daylight coming in.
  const spill = useMemo(() => new THREE.Color(night ? "#ffc27a" : "#fff0d4"), [night]);

  return (
    <group position={[PORTAL.x, 0, 0]}>
      {/* the limestone reveal: a deep, dressed opening rather than a hole */}
      {[
        { p: [PORTAL.reveal / 2, PORTAL.height / 2, PORTAL.width / 2 + 0.22], a: [PORTAL.reveal, PORTAL.height, 0.44] },
        { p: [PORTAL.reveal / 2, PORTAL.height / 2, -PORTAL.width / 2 - 0.22], a: [PORTAL.reveal, PORTAL.height, 0.44] },
        { p: [PORTAL.reveal / 2, PORTAL.height + 0.22, 0], a: [PORTAL.reveal, 0.44, PORTAL.width + 0.88] },
      ].map((jamb, i) => (
        <Surface
          key={i}
          material={stone}
          position={jamb.p as [number, number, number]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={jamb.a as [number, number, number]} />
        </Surface>
      ))}

      {/* the threshold: a Carrara saddle, worn smooth, level with the floor */}
      <mesh position={[PORTAL.reveal / 2, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PORTAL.width + 0.6, PORTAL.reveal]} />
        <meshPhysicalMaterial
          color={MATERIALS.carrara.colour}
          roughness={MATERIALS.carrara.roughness}
          metalness={0}
        />
      </mesh>

      {/* the two leaves */}
      <group position={[PORTAL.reveal - 0.06, PORTAL.height / 2, 0]}>
        <Leaf side={-1} open={open} />
        <Leaf side={1} open={open} />
      </group>

      {/* light spilling through the opening onto the threshold stone */}
      <pointLight
        position={[0.5, 1.9, 0]}
        color={spill}
        intensity={(night ? 5.5 : 2.2) * (0.25 + open * 0.75)}
        distance={5.5}
        decay={2}
      />
    </group>
  );
}
