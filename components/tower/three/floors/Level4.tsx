"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { shelvingGeometry, booksGeometry, wingbackGeometry, chairGeometry } from "../fixtures";

/**
 * NN TOWER — Level 4. The journal and the archive.
 *
 * The quiet floor. Dark oak from floor to ceiling, espresso planks under
 * silk rugs, a long reading table, swatch stations with lit tops, and
 * wingbacks that have been pulled round to face each other.
 *
 * ── this floor is dark on purpose ────────────────────────────────────
 * The ledger gives it 2600 K and the lowest glow of any level, and that is
 * the point: an archive is lit to read by, not to shop in. Pools of warm
 * light on tables with everything between them falling away is what makes
 * a library feel like a library — and it is the strongest contrast on the
 * whole tower against the 5000 K daylight of the stylist floor above.
 *
 * ── the beams are structure, not trim ────────────────────────────────
 * Coffered oak beams at 1.6 m centres spanning the short way, which is how
 * a timber ceiling is actually framed. Run them the long way and a joiner
 * sees it instantly.
 */

const SPEC = LEVELS[4];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

export function Level4({ visible = true }: { visible?: boolean }) {
  /* Coffered beams, spanning the short way. */
  const beams = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const span = INNER * 2 - 1;
    for (let i = -6; i <= 6; i++) {
      const b = metricUV(new THREE.BoxGeometry(0.17, 0.3, span), 0.17, span);
      b.translate(i * 1.6, 0, 0);
      parts.push(b);
    }
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  const stack = useMemo(() => shelvingGeometry(3.6, CLEAR - 0.6, 0.36, 6), []);
  const row = useMemo(() => booksGeometry(3.5, 0.3, 7), []);
  const wing = useMemo(() => wingbackGeometry(), []);
  const chair = useMemo(() => chairGeometry(), []);

  /* The reading table: 3.4 m of reclaimed oak on a pair of trestles. */
  const readingTable = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const top = metricUV(new THREE.BoxGeometry(3.4, 0.08, 1.15), 3.4, 1.15);
    top.translate(0, 0.76, 0);
    parts.push(top);
    for (const x of [-1.3, 1.3]) {
      const trestle = metricUV(new THREE.BoxGeometry(0.12, 0.7, 0.9), 0.12, 0.7);
      trestle.translate(x, 0.35, 0);
      parts.push(trestle);
    }
    const stretcher = metricUV(new THREE.BoxGeometry(2.7, 0.09, 0.1), 2.7, 0.09);
    stretcher.translate(0, 0.26, 0);
    parts.push(stretcher);
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* A swatch station: a lit, slightly raked top for looking at cloth. */
  const swatch = useMemo(() => {
    const g = metricUV(new THREE.BoxGeometry(1.1, 0.06, 0.8), 1.1, 0.8);
    g.rotateX(-0.16);
    g.translate(0, 0.96, 0);
    return g;
  }, []);

  /* A silk rug. Not a texture on the floor — a thing lying on it, with an
     edge you can see and a shadow under it. */
  const rug = useMemo(() => metricUV(new THREE.BoxGeometry(4.6, 0.016, 3.2), 4.6, 3.2), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("walnut")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>
      <mesh geometry={beams} material={material("walnut")} position={[0, CLEAR - 0.35, 0]} castShadow receiveShadow />

      {/* the stacks, with their reading lights */}
      {([[-INNER + 0.5, -3.6, Math.PI / 2], [-INNER + 0.5, 1.2, Math.PI / 2], [-1.5, -INNER + 0.5, 0]] as const).map(
        ([x, z, r], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
            <mesh geometry={stack} material={material("walnut")} castShadow receiveShadow />
            {[0, 1, 2, 3, 4].map((sh) => (
              <mesh
                key={sh}
                geometry={row}
                material={material(sh % 2 ? "leather" : "walnut")}
                position={[0, 0.04 + sh * ((CLEAR - 0.6) / 6), 0]}
                castShadow
              />
            ))}
            {/* brass picture light over each bay */}
            <mesh position={[0, CLEAR - 0.75, 0.22]} material={material("gold")}>
              <boxGeometry args={[2.4, 0.05, 0.12]} />
            </mesh>
            <mesh position={[0, CLEAR - 0.79, 0.22]} material={lit(2500, 0.8)}>
              <planeGeometry args={[2.3, 0.03]} />
            </mesh>
          </group>
        ),
      )}

      {/* the reading table on its rug */}
      <group position={[3.2, 0, 2.4]} rotation={[0, -0.24, 0]}>
        <mesh geometry={rug} material={material("leather")} position={[0, 0.012, 0]} receiveShadow />
        <mesh geometry={readingTable} material={material("oak")} castShadow receiveShadow />
        {[-1.0, 0, 1.0].map((x, i) => (
          <mesh key={i} geometry={chair} material={material("walnut")} position={[x, 0, 0.92]} rotation={[0, Math.PI + i * 0.1, 0]} castShadow />
        ))}
        {/* two low pendants: an archive is lit to read by */}
        {[-0.8, 0.8].map((x, i) => (
          <group key={i} position={[x, 1.95, 0]}>
            <mesh material={material("gold")}>
              <coneGeometry args={[0.17, 0.16, 14, 1, true]} />
            </mesh>
            <mesh position={[0, -0.06, 0]} material={lit(SPEC.kelvin, 1.1)}>
              <circleGeometry args={[0.15, 14]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* swatch stations, lit from within the top */}
      {[[-5.4, 5.8], [-3.2, 6.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, 0.3 - i * 0.5, 0]}>
          <mesh geometry={swatch} material={material("walnut")} castShadow />
          <mesh position={[0, 1.0, 0.02]} rotation={[-Math.PI / 2 - 0.16, 0, 0]} material={lit(3600, 0.72)}>
            <planeGeometry args={[1.0, 0.7]} />
          </mesh>
        </group>
      ))}

      {/* wingbacks, turned to face each other */}
      {([[6.6, -4.4, 2.5], [8.0, -2.6, -0.7]] as const).map(([x, z, r], i) => (
        <mesh key={i} geometry={wing} material={material("leather")} position={[x, 0, z]} rotation={[0, r, 0]} castShadow receiveShadow />
      ))}

      {/* deliberately low: everything between the pools falls away */}
      <pointLight position={[0, CLEAR * 0.7, 0]} intensity={16} distance={20} decay={2} color={warm} />
    </group>
  );
}
