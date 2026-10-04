"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { shelvingGeometry } from "../fixtures";

/**
 * NN TOWER — Level 6. The bag and the checkout.
 *
 * The back-of-house floor made visible. Dark basalt underfoot, brushed
 * slat walls, inventory racking, a packing bench with boxes and ribbon, and
 * the counters where it becomes an order.
 *
 * ── a slat wall is a system, not a pattern ───────────────────────────
 * Retail slat wall is a real product: horizontal channels at 100 mm
 * centres that brackets clip into. Modelled as the channels, so the
 * shadows run horizontally and the shelving plainly hangs off it. Drawn as
 * a vertical pattern it would read as cladding, and nothing could hang.
 *
 * ── the bags are the brand ───────────────────────────────────────────
 * Matte black boxes and bags with the gold mark: on this floor the
 * packaging IS the merchandise, which is why they get the only gold on the
 * level and the light is aimed at them.
 */

const SPEC = LEVELS[6];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

export function Level6({ visible = true }: { visible?: boolean }) {
  /* Slat wall: horizontal channels at 100 mm centres. */
  const slatwall = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const run = 14;
    const h = CLEAR - 0.5;
    const back = metricUV(new THREE.BoxGeometry(run, h, 0.05), run, h);
    back.translate(0, h / 2, 0);
    parts.push(back);
    for (let i = 1; i * 0.1 < h - 0.2; i++) {
      const ch = metricUV(new THREE.BoxGeometry(run, 0.055, 0.035), run, 0.055);
      ch.translate(0, i * 0.1, 0.042);
      parts.push(ch);
    }
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  const racking = useMemo(() => shelvingGeometry(3.2, CLEAR - 0.9, 0.5, 5), []);

  /* A carton. Boxes read as boxes; what matters is that they are stacked
     imperfectly and that some are open. */
  const carton = useMemo(() => metricUV(new THREE.BoxGeometry(0.46, 0.3, 0.34), 0.46, 0.3), []);
  const cartons = useMemo(() => {
    const out: { p: [number, number, number]; r: number }[] = [];
    let st = 11;
    const rnd = () => ((st = (st * 1103515245 + 12345) >>> 0) / 4294967296);
    for (let s = 0; s < 5; s++) {
      for (let i = 0; i < 5; i++) {
        if (rnd() > 0.82) continue;
        out.push({
          p: [-1.3 + i * 0.62, 0.17 + s * ((CLEAR - 0.9) / 5), (rnd() - 0.5) * 0.08],
          r: (rnd() - 0.5) * 0.16,
        });
      }
    }
    return out;
  }, []);

  /* The packing bench. */
  const bench = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const top = metricUV(new THREE.BoxGeometry(2.8, 0.06, 0.95), 2.8, 0.95);
    top.translate(0, 0.92, 0);
    parts.push(top);
    const body = metricUV(new THREE.BoxGeometry(2.7, 0.84, 0.85), 2.7, 0.84);
    body.translate(0, 0.45, 0);
    parts.push(body);
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* The checkout counter and its terminal. */
  const counter = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const body = metricUV(new THREE.BoxGeometry(2.2, 1.0, 0.72), 2.2, 1.0);
    body.translate(0, 0.5, 0);
    parts.push(body);
    const top = metricUV(new THREE.BoxGeometry(2.32, 0.05, 0.84), 2.32, 0.84);
    top.translate(0, 1.02, 0);
    parts.push(top);
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  const bag = useMemo(() => metricUV(new THREE.BoxGeometry(0.3, 0.38, 0.14), 0.3, 0.38), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      {/* linear black baffle ceiling */}
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("steel")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>

      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material("basalt")} receiveShadow>
        <planeGeometry args={[INNER * 2, INNER * 2]} />
      </mesh>

      <mesh geometry={slatwall} material={material("brushed")} position={[-1.5, 0, -INNER + 0.35]} receiveShadow castShadow />

      {/* inventory racking */}
      {([[-7.2, -2.0, Math.PI / 2], [-7.2, 2.2, Math.PI / 2]] as const).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={racking} material={material("steel")} castShadow receiveShadow />
          {cartons.map((c, k) => (
            <mesh key={k} geometry={carton} material={material("walnut")} position={c.p} rotation={[0, c.r, 0]} castShadow />
          ))}
        </group>
      ))}

      {/* the packing bench, with bags lined up on it */}
      <group position={[3.0, 0, 4.4]} rotation={[0, -0.3, 0]}>
        <mesh geometry={bench} material={material("steel")} castShadow receiveShadow />
        {[-0.9, -0.5, -0.1, 0.3, 0.75].map((x, i) => (
          <mesh key={i} geometry={bag} material={material("leather")} position={[x, 1.14, (i % 2) * 0.1 - 0.05]} castShadow />
        ))}
        <spotLight position={[0, CLEAR - 0.6, 0.4]} target-position={[3.0, 1.1, 4.4]}
          angle={0.5} penumbra={0.7} intensity={62} distance={8} decay={2} color={warm} />
      </group>

      {/* checkout */}
      {([[6.4, -3.0, 0.5], [7.2, 0.6, 0.2]] as const).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={counter} material={material("walnut")} castShadow receiveShadow />
          {/* the terminal, and the brass edge that is the only gold here */}
          <mesh position={[0.6, 1.1, 0]} rotation={[-0.5, 0, 0]} material={lit(4200, 0.56)}>
            <planeGeometry args={[0.3, 0.2]} />
          </mesh>
          <mesh position={[0, 1.05, 0.42]} material={material("gold")}>
            <boxGeometry args={[2.3, 0.02, 0.03]} />
          </mesh>
        </group>
      ))}

      <pointLight position={[0, CLEAR * 0.76, 0]} intensity={24} distance={22} decay={2} color={warm} />
    </group>
  );
}
