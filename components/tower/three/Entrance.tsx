"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { material, lit } from "./materials";
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

      {/* the warm reception light spilling out onto the pavement, which is
          what tells a passer-by that a shop is open */}
      <mesh position={[0, LEAF_H / 2, -0.5]} material={lit(2700, 0.8)}>
        <planeGeometry args={[LEAF_W * 2, LEAF_H]} />
      </mesh>
      <pointLight position={[0, 2.4, 1.1]} intensity={26} distance={14} decay={2} color="#ffd9a8" />

      {/* the mark above the door */}
      <mesh position={[0, LEAF_H + 1.1, 0.12]} material={lit(2900, 1.35)}>
        <planeGeometry args={[1.5, 0.74]} />
      </mesh>
    </group>
  );
}

export const DOOR_POSITION: [number, number, number] = [DOOR_X, 0, DOOR_Z];
export const DOOR_OUTWARD: [number, number] = [Math.sin(DOOR_FACING), Math.cos(DOOR_FACING)];
