"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { railGeometry, hangingGeometry, pedestalGeometry, chairGeometry } from "../fixtures";

/**
 * NN TOWER — Level 3. Men & boys.
 *
 * One room, two scales. The house's whole argument is that a boy and his
 * father wear the same cloth and the same cut, so this floor must not read
 * as two shops sharing a landing: same parquet, same linen walls, same
 * picture rail — and then everything on the boys' side built at about 72%.
 *
 * ── 72%, not 50% ─────────────────────────────────────────────────────
 * A ten-year-old is roughly three-quarters of an adult's height, not half.
 * Scale the rails and mirrors to 50% and the area reads as a toy shop; at
 * 72% it reads as a tailor who also cuts for children, which is the thing
 * the brand actually claims.
 *
 * ── the picture rail is load-bearing, visually ───────────────────────
 * Belgian linen panels framed in dark oak moulding at 2.4 m give the wall
 * a horizontal line at head height. Without it a 4 m wall of fabric is a
 * blank, and blank walls are what make a CG interior feel like a box.
 */

const SPEC = LEVELS[3];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;
const BOY = 0.72;

/** Linen panels in an oak picture rail, as one merged run of wall. */
function panelledWall(length: number, height: number, rail: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const back = metricUV(new THREE.BoxGeometry(length, height, 0.04), length, height);
  back.translate(0, height / 2, 0);
  parts.push(back);
  // the rail itself
  for (const y of [rail, 0.14]) {
    const r = metricUV(new THREE.BoxGeometry(length, 0.075, 0.06), length, 0.075);
    r.translate(0, y, 0.035);
    parts.push(r);
  }
  // vertical stiles every 1.5 m
  const n = Math.max(2, Math.round(length / 1.5));
  for (let i = 0; i <= n; i++) {
    const st = metricUV(new THREE.BoxGeometry(0.055, rail - 0.14, 0.05), 0.055, rail);
    st.translate(-length / 2 + (length / n) * i, (rail + 0.14) / 2, 0.03);
    parts.push(st);
  }
  const m = mergeAll(parts);
  parts.forEach((g) => g.dispose());
  return m;
}

export function Level3({ visible = true }: { visible?: boolean }) {
  const wall = useMemo(() => panelledWall(16, CLEAR - 0.3, 2.4), []);
  const rail = useMemo(() => railGeometry(3.2, 10), []);
  const jackets = useMemo(() => hangingGeometry(3.2, 10, "jacket"), []);
  const shirts = useMemo(() => hangingGeometry(3.2, 12, "shirt"), []);
  const trousers = useMemo(() => hangingGeometry(3.0, 10, "trouser"), []);
  const table = useMemo(() => pedestalGeometry(1.6, 0.8, 0.46), []);
  const chair = useMemo(() => chairGeometry(), []);

  /* A loafer, in the only way that reads at this size: a lasted shape. */
  const shoe = useMemo(() => {
    const prof: [number, number][] = [
      [0.035, 0], [0.052, 0.18], [0.055, 0.45], [0.048, 0.72], [0.03, 0.93], [0.01, 1],
    ];
    const g = new THREE.LatheGeometry(prof.map(([r, t]) => new THREE.Vector2(r, t * 0.3)), 12);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 1, 0.62);
    return g;
  }, []);

  const mirror = useMemo(() => metricUV(new THREE.BoxGeometry(1.05, 2.0, 0.07), 1.05, 2.0), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("plaster")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>

      {/* the parquet, laid over the plate */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material("parquet")} receiveShadow>
        <planeGeometry args={[INNER * 2, INNER * 2]} />
      </mesh>

      {/* linen walls in their picture rail */}
      <mesh geometry={wall} material={material("linen")} position={[-2, 0, -INNER + 0.3]} receiveShadow castShadow />
      <mesh
        geometry={wall}
        material={material("linen")}
        position={[-INNER + 0.3, 0, 1]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
        castShadow
      />

      {/* ── men ─────────────────────────────────────────────────────── */}
      {([
        [-7.0, -4.4, 0, jackets],
        [-7.0, 0.4, 0, shirts],
        [-2.2, -7.2, Math.PI / 2, trousers],
      ] as const).map(([x, z, r, g], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={rail} material={material("steel")} castShadow />
          <mesh geometry={g} material={material(i === 1 ? "linen" : "walnut")} castShadow />
        </group>
      ))}

      {/* the accessory table, with loafers on it */}
      <group position={[-3.4, 0, 3.8]} rotation={[0, 0.3, 0]}>
        <mesh geometry={table} material={material("leather")} castShadow receiveShadow />
        {[-0.45, -0.1, 0.3].map((x, i) => (
          <group key={i} position={[x, 0.5, (i % 2) * 0.16 - 0.08]}>
            <mesh geometry={shoe} material={material("leather")} castShadow />
            <mesh geometry={shoe} material={material("leather")} position={[0, 0, 0.17]} castShadow />
          </group>
        ))}
      </group>

      {/* ── boys, at 72% ────────────────────────────────────────────── */}
      <group position={[6.0, 0, 3.0]}>
        {([
          [0, 0, 0] as const,
          [0, 3.4, 0] as const,
        ]).map(([x, z, r], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]} scale={[BOY, BOY, BOY]}>
            <mesh geometry={rail} material={material("steel")} castShadow />
            <mesh geometry={i === 0 ? jackets : shirts} material={material(i === 0 ? "walnut" : "linen")} castShadow />
          </group>
        ))}
        <mesh geometry={chair} material={material("oak")} position={[2.0, 0, 1.6]} rotation={[0, -0.5, 0]} scale={[BOY, BOY, BOY]} castShadow />
      </group>

      {/* fitting mirrors, with the warm vanity light beside them that makes
          a customer look at the cloth rather than at themselves */}
      {[[-INNER + 0.6, 6.4, Math.PI / 2], [8.4, -4.0, 0]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={mirror} material={material("walnut")} position={[0, 1.1, 0]} castShadow />
          <mesh position={[0, 1.1, 0.04]} material={material("brushed")}>
            <planeGeometry args={[0.95, 1.9]} />
          </mesh>
          <mesh position={[0.64, 1.5, 0.05]} material={lit(2700, 1.0)}>
            <planeGeometry args={[0.05, 1.1]} />
          </mesh>
          <pointLight position={[0.5, 1.5, 0.6]} intensity={9} distance={5} decay={2} color={warm} />
        </group>
      ))}

      <pointLight position={[-3, CLEAR * 0.76, -1]} intensity={40} distance={24} decay={2} color={warm} />
      <pointLight position={[6, CLEAR * 0.76, 4]} intensity={30} distance={20} decay={2} color={warm} />
    </group>
  );
}
