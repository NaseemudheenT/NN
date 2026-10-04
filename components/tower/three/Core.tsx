"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ATRIUM_CENTRE, ATRIUM_R, LEVELS, SLAB, levelByIndex } from "@/lib/tower/spec";
import { material, lit } from "./materials";
import { mergeAll } from "./geometry";

/**
 * NN TOWER — the central core.
 *
 * The glass capsule lift and the oak spiral stair, both running in the
 * atrium void that is punched through every plate from Level 1 to the dome.
 *
 * ── the lift travels to real heights ─────────────────────────────────
 * The pasted spec moves the car to `floor * 4.8`. That is a number, not a
 * building: the street here is a 6.5 m double-height volume and the upper
 * plates are 4 m, so a fixed multiplier would stop the car between floors
 * on every level above the first. It reads its stop from the same ledger
 * the architecture is built from, so the doors always line up with a floor.
 */

const CX = ATRIUM_CENTRE[0];
const CZ = ATRIUM_CENTRE[1];
const CAR_R = 1.15;
const CAR_H = 2.9;

export function Core({ floor }: { floor: number }) {
  const car = useRef<THREE.Group>(null);

  /* The stair: real treads, winding round the shaft. 17 risers per floor at
     a 178 mm rise and a 280 mm going is a staircase a person can actually
     climb — the proportion is what makes it read as architecture rather
     than as a decorative helix. */
  const stair = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const innerR = CAR_R + 0.5;
    const outerR = ATRIUM_R - 0.18;
    const top = LEVELS[LEVELS.length - 1].base;
    const rise = 0.178;
    const steps = Math.floor(top / rise);
    const perTurn = 26;
    for (let i = 0; i < steps; i++) {
      const a = (i / perTurn) * Math.PI * 2;
      const tread = new THREE.BoxGeometry(outerR - innerR, 0.055, 0.3);
      tread.translate((innerR + outerR) / 2, 0, 0);
      tread.rotateY(-a);
      tread.translate(0, LEVELS[1].base * 0 + i * rise, 0);
      parts.push(tread);
    }
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  /* The balustrade: a lit glass ribbon following the same helix. */
  const rail = useMemo(() => {
    const top = LEVELS[LEVELS.length - 1].base;
    const rise = 0.178;
    const steps = Math.floor(top / rise);
    const perTurn = 26;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i += 2) {
      const a = (i / perTurn) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(-a) * (ATRIUM_R - 0.3),
        i * rise + 0.98,
        Math.sin(-a) * (ATRIUM_R - 0.3),
      ));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.045, 6, false);
  }, []);

  const shaft = useMemo(() => {
    const top = LEVELS[LEVELS.length - 1].base + 2;
    const g = new THREE.CylinderGeometry(CAR_R + 0.22, CAR_R + 0.22, top, 28, 1, true);
    g.translate(0, top / 2, 0);
    return g;
  }, []);

  const carShell = useMemo(
    () => new THREE.CylinderGeometry(CAR_R, CAR_R, CAR_H, 28, 1, true),
    [],
  );
  const carFloor = useMemo(() => new THREE.CylinderGeometry(CAR_R, CAR_R, 0.08, 28), []);

  useFrame((_, dt) => {
    if (!car.current) return;
    const spec = levelByIndex(floor);
    const target = spec.base + SLAB;
    const k = 1 - Math.pow(0.004, Math.min(dt, 0.1));
    car.current.position.y += (target - car.current.position.y) * k;
  });

  return (
    <group position={[CX, 0, CZ]}>
      {/* the shaft glazing */}
      <mesh geometry={shaft} material={material("glass")} />

      {/* the stair */}
      <mesh geometry={stair} material={material("oak")} castShadow receiveShadow />
      <mesh geometry={rail} material={lit(3000, 0.55)} />

      {/* the car */}
      <group ref={car} position={[0, SLAB, 0]}>
        <mesh geometry={carFloor} material={material("brushed")} />
        <mesh geometry={carShell} material={material("glass")} position={[0, CAR_H / 2, 0]} />
        <mesh position={[0, CAR_H - 0.06, 0]} material={lit(3000, 1.1)}>
          <cylinderGeometry args={[CAR_R * 0.82, CAR_R * 0.82, 0.05, 24]} />
        </mesh>
        <pointLight position={[0, CAR_H * 0.7, 0]} intensity={12} distance={9} decay={2} color="#ffe0b4" />
      </group>
    </group>
  );
}
