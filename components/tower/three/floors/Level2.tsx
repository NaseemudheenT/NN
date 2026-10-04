"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { dressFormGeometry, clothBoltGeometry, chairGeometry, shelvingGeometry } from "../fixtures";

/**
 * NN TOWER — Level 2. The atelier.
 *
 * A workroom, not a showroom. The difference is in what is on the surfaces:
 * a cutting table long enough to lay a coat length, bolts of cloth stacked
 * on open shelving, dress forms mid-fitting, chairs that have been moved.
 *
 * ── the cutting table is 3.2 m for a reason ──────────────────────────
 * You cannot cut a coat on a desk. A tailor's table has to take a full
 * length of cloth — a little over three metres — plus room to walk the
 * shears down it. Model it at two metres and every tailor who sees it
 * knows immediately, even if a customer only feels that something is off.
 *
 * ── the light is 3200 K and it comes from above the table ────────────
 * Task lighting in a tailoring room is directional and neutral-warm, hung
 * low over the work. The ledger gives this floor 3200 K: warm enough to
 * belong to the house, cool enough to judge a navy against a charcoal.
 */

const SPEC = LEVELS[2];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

export function Level2({ visible = true }: { visible?: boolean }) {
  /* The cutting table: a thick oak top on a trestle base. */
  const table = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const top = metricUV(new THREE.BoxGeometry(3.2, 0.07, 1.35), 3.2, 1.35);
    top.translate(0, 0.92, 0);
    parts.push(top);
    const apron = metricUV(new THREE.BoxGeometry(3.0, 0.16, 1.15), 3.0, 0.16);
    apron.translate(0, 0.8, 0);
    parts.push(apron);
    for (const x of [-1.34, 1.34]) {
      for (const z of [-0.5, 0.5]) {
        const leg = metricUV(new THREE.BoxGeometry(0.09, 0.72, 0.09), 0.09, 0.72);
        leg.translate(x, 0.36, z);
        parts.push(leg);
      }
      const rail = metricUV(new THREE.BoxGeometry(0.06, 0.06, 1.0), 0.06, 1.0);
      rail.translate(x, 0.22, 0);
      parts.push(rail);
    }
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* Cloth on the table, half unrolled — a workroom is mid-task. */
  const laid = useMemo(() => {
    const g = metricUV(new THREE.BoxGeometry(2.1, 0.02, 1.0), 2.1, 1.0);
    g.translate(-0.3, 0.965, 0.05);
    return g;
  }, []);

  const shelves = useMemo(() => shelvingGeometry(3.4, 2.5, 0.42, 5), []);
  const bolt = useMemo(() => clothBoltGeometry(0.92, 0.075), []);
  const form = useMemo(() => dressFormGeometry(), []);
  const chair = useMemo(() => chairGeometry(), []);

  /* The bolts, racked. Stacked three deep per shelf and staggered, because
     cloth is stored by the roll and rolls do not stack in a neat grid. */
  const boltPositions = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let s = 0; s < 5; s++) {
      for (let i = 0; i < 6; i++) {
        out.push([
          -1.4 + i * 0.56 + (s % 2) * 0.1,
          0.12 + s * 0.5,
          -0.02 + ((i + s) % 3) * 0.1,
        ]);
      }
    }
    return out;
  }, []);

  /* A full-height mirror, which is the other thing every fitting room has. */
  const mirror = useMemo(() => metricUV(new THREE.BoxGeometry(1.1, 2.1, 0.06), 1.1, 2.1), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("plaster")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>

      {/* the cutting table, under its own light */}
      <group position={[-3.4, 0, 1.2]} rotation={[0, 0.22, 0]}>
        <mesh geometry={table} material={material("oak")} castShadow receiveShadow />
        <mesh geometry={laid} material={material("linen")} castShadow />
        {/* two pendants, hung low over the work the way a bench light is */}
        {[-0.85, 0.85].map((x, i) => (
          <group key={i} position={[x, 2.15, 0]}>
            <mesh material={material("steel")}>
              <coneGeometry args={[0.22, 0.2, 16, 1, true]} />
            </mesh>
            <mesh position={[0, -0.07, 0]} material={lit(SPEC.kelvin, 1.25)}>
              <circleGeometry args={[0.19, 16]} />
            </mesh>
            <pointLight position={[0, -0.2, 0]} intensity={26} distance={8} decay={2} color={warm} />
          </group>
        ))}
      </group>

      {/* cloth store */}
      <group position={[2.2, 0, -INNER + 0.9]}>
        <mesh geometry={shelves} material={material("walnut")} castShadow receiveShadow />
        {boltPositions.map((p, i) => (
          <mesh
            key={i}
            geometry={bolt}
            material={material(i % 3 === 0 ? "linen" : i % 3 === 1 ? "leather" : "walnut")}
            position={p}
            castShadow
          />
        ))}
      </group>

      {/* dress forms, mid-fitting */}
      {[[-7.2, -3.6, 0.3], [-6.1, -2.2, -0.8], [5.4, 4.2, 1.9]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={form} material={material("linen")} castShadow receiveShadow />
          <mesh geometry={form} material={material("walnut")} scale={[1.001, 0.42, 1.001]} castShadow />
        </group>
      ))}

      {/* chairs, not squared up */}
      {[[-2.0, 3.4, 0.6], [-1.1, 4.1, -1.3], [4.4, -5.2, 2.4]].map(([x, z, r], i) => (
        <mesh key={i} geometry={chair} material={material("oak")} position={[x, 0, z]} rotation={[0, r, 0]} castShadow />
      ))}

      {/* the fitting mirror */}
      <group position={[-INNER + 0.5, 0, 5.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={mirror} material={material("walnut")} position={[0, 1.15, 0]} castShadow />
        <mesh position={[0, 1.15, 0.035]} material={material("brushed")}>
          <planeGeometry args={[0.98, 1.98]} />
        </mesh>
      </group>

      <pointLight position={[0, CLEAR * 0.75, 0]} intensity={44} distance={26} decay={2} color={warm} />
    </group>
  );
}
