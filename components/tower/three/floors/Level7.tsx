"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { wingbackGeometry, chairGeometry } from "../fixtures";

/**
 * NN TOWER — Level 7. The owner's console and office.
 *
 * The private floor. Dark French oak slat panelling, hand-scraped planks, a
 * black walnut desk, a meeting table, and the dashboards that show the
 * state of the house.
 *
 * ── the dashboards show nothing, and that is deliberate ──────────────
 * They are lit panels with no numbers on them. Modelling invented revenue
 * figures into the architecture would put fabricated business data inside
 * the product — the exact thing this project forbids. The real owner
 * console already exists at /owner, behind real authentication, reading
 * real data. The screens here are furniture.
 */

const SPEC = LEVELS[7];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

export function Level7({ visible = true }: { visible?: boolean }) {
  /* Vertical oak slat panelling. */
  const panelling = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const run = 13;
    const h = CLEAR - 0.4;
    const back = metricUV(new THREE.BoxGeometry(run, h, 0.04), run, h);
    back.translate(0, h / 2, 0);
    parts.push(back);
    const n = Math.floor(run / 0.11);
    for (let i = 0; i < n; i++) {
      const b = metricUV(new THREE.BoxGeometry(0.07, h, 0.05), 0.07, h);
      b.translate(-run / 2 + i * 0.11 + 0.055, h / 2, 0.04);
      parts.push(b);
    }
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* The desk: a solid walnut slab on two blades. */
  const desk = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const top = metricUV(new THREE.BoxGeometry(2.6, 0.075, 1.05), 2.6, 1.05);
    top.translate(0, 0.76, 0);
    parts.push(top);
    for (const x of [-1.1, 1.1]) {
      const blade = metricUV(new THREE.BoxGeometry(0.06, 0.73, 0.9), 0.06, 0.73);
      blade.translate(x, 0.365, 0);
      parts.push(blade);
    }
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* The meeting table and its chairs. */
  const table = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const top = new THREE.CylinderGeometry(1.25, 1.25, 0.07, 36);
    top.translate(0, 0.74, 0);
    parts.push(top);
    const col = new THREE.CylinderGeometry(0.12, 0.22, 0.7, 18);
    col.translate(0, 0.35, 0);
    parts.push(col);
    const foot = new THREE.CylinderGeometry(0.5, 0.56, 0.04, 24);
    foot.translate(0, 0.02, 0);
    parts.push(foot);
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  const chair = useMemo(() => chairGeometry(), []);
  const wing = useMemo(() => wingbackGeometry(), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("plaster")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>
      {/* concealed warm trim lighting round the ceiling perimeter */}
      <mesh position={[0, CLEAR - 0.26, 0]} material={lit(SPEC.kelvin, 0.7)}>
        <torusGeometry args={[INNER - 0.7, 0.025, 6, 48]} />
      </mesh>

      <mesh geometry={panelling} material={material("walnut")} position={[-2, 0, -INNER + 0.3]} receiveShadow castShadow />

      {/* the desk, facing the window */}
      <group position={[-4.6, 0, 2.6]} rotation={[0, 0.5, 0]}>
        <mesh geometry={desk} material={material("walnut")} castShadow receiveShadow />
        <mesh geometry={chair} material={material("leather")} position={[0, 0, -0.85]} castShadow />
        {/* a desk lamp, which is what tells you someone works here */}
        <mesh position={[0.95, 0.95, -0.25]} material={material("gold")}>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 10]} />
        </mesh>
        <mesh position={[0.95, 1.14, -0.25]} material={lit(2600, 1.0)}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        <pointLight position={[0.95, 1.14, -0.25]} intensity={10} distance={5} decay={2} color={warm} />
      </group>

      {/* the meeting table */}
      <group position={[4.4, 0, -2.4]}>
        <mesh geometry={table} material={material("walnut")} castShadow receiveShadow />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={chair}
              material={material("leather")}
              position={[Math.cos(a) * 1.68, 0, Math.sin(a) * 1.68]}
              rotation={[0, -a + Math.PI / 2, 0]}
              castShadow
            />
          );
        })}
      </group>

      {/* the dashboards — lit panels, deliberately blank */}
      <group position={[-INNER + 0.4, 0, -2.0]} rotation={[0, Math.PI / 2, 0]}>
        {[-1.5, 0, 1.5].map((x, i) => (
          <group key={i} position={[x, 2.0, 0]}>
            <mesh material={material("steel")}>
              <boxGeometry args={[1.35, 0.82, 0.05]} />
            </mesh>
            <mesh position={[0, 0, 0.03]} material={lit(5200, 0.34)}>
              <planeGeometry args={[1.26, 0.74]} />
            </mesh>
          </group>
        ))}
      </group>

      <mesh geometry={wing} material={material("leather")} position={[6.6, 0, 4.4]} rotation={[0, -2.2, 0]} castShadow />

      <pointLight position={[0, CLEAR * 0.76, 0]} intensity={22} distance={22} decay={2} color={warm} />
    </group>
  );
}
