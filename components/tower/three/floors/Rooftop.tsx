"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, LEVELS, ATRIUM_CENTRE, DOME_R } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV, planShape } from "../geometry";

/**
 * NN TOWER — the rooftop. Journey's end.
 *
 * Terrace garden, lounge, and the glass dome that caps the atrium running
 * all the way down to the reception desk. The end of the route, so it is
 * the one floor that is outside.
 *
 * ── the balustrade is frameless, which means it needs a shoe ─────────
 * Structural glass with no top rail is held at the bottom in a channel —
 * a stainless shoe bolted to the slab. Model the glass without it and the
 * panels appear to be standing on the deck by magic, which is the sort of
 * detail that reads as wrong before anyone can name it.
 *
 * ── the planting is clipped, not wild ────────────────────────────────
 * Boxwood in architectural planters, kept to blocks. A roof terrace on a
 * neoclassical building is a garden in the formal sense: geometry first.
 */

const SPEC = LEVELS[8];
const INNER = HALF - 0.9;

export function Rooftop({ visible = true }: { visible?: boolean }) {
  /* Oak decking laid over the slab, with slate paths through it. */
  const deck = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(planShape(1.0), {
      depth: 0.08,
      bevelEnabled: false,
      curveSegments: 24,
    });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);

  /* Frameless glass balustrade with its stainless shoe. */
  const { glass, shoe } = useMemo(() => {
    const gParts: THREE.BufferGeometry[] = [];
    const sParts: THREE.BufferGeometry[] = [];
    const pts = planShape(0.75).getPoints(56);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = a.distanceTo(b);
      if (len < 0.05) continue;
      const mx = (a.x + b.x) / 2;
      const mz = -(a.y + b.y) / 2;
      const ang = Math.atan2(-(b.y - a.y), b.x - a.x);
      const pane = metricUV(new THREE.BoxGeometry(len, 1.1, 0.022), len, 1.1);
      pane.rotateY(ang);
      pane.translate(mx, 0.63, mz);
      gParts.push(pane);
      const sh = metricUV(new THREE.BoxGeometry(len, 0.14, 0.1), len, 0.14);
      sh.rotateY(ang);
      sh.translate(mx, 0.15, mz);
      sParts.push(sh);
    }
    const g = mergeAll(gParts);
    const s = mergeAll(sParts);
    gParts.forEach((p) => p.dispose());
    sParts.forEach((p) => p.dispose());
    return { glass: g, shoe: s };
  }, []);

  /* A modular lounge seat. */
  const seat = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const base = metricUV(new THREE.BoxGeometry(1.5, 0.3, 0.86), 1.5, 0.86);
    base.translate(0, 0.17, 0);
    parts.push(base);
    const cushion = metricUV(new THREE.BoxGeometry(1.44, 0.16, 0.8), 1.44, 0.8);
    cushion.translate(0, 0.4, 0);
    parts.push(cushion);
    const back = metricUV(new THREE.BoxGeometry(1.44, 0.44, 0.16), 1.44, 0.44);
    back.translate(0, 0.66, -0.34);
    parts.push(back);
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  /* A boxwood block in its planter. */
  const planter = useMemo(() => metricUV(new THREE.BoxGeometry(1.5, 0.52, 0.72), 1.5, 0.52), []);
  const box = useMemo(() => metricUV(new THREE.BoxGeometry(1.36, 0.64, 0.58), 1.36, 0.64), []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      <mesh geometry={deck} material={material("oak")} receiveShadow />

      {/* the balustrade */}
      <mesh geometry={shoe} material={material("brushed")} castShadow />
      <mesh geometry={glass} material={material("glasspane")} />

      {/* the lounge, grouped round a low table the way seating actually is */}
      {([[-5.2, 3.0, 0.2], [-3.4, 4.6, -1.4], [-6.6, 4.8, 1.5]] as const).map(([x, z, r], i) => (
        <mesh key={i} geometry={seat} material={material("linen")} position={[x, 0.08, z]} rotation={[0, r, 0]} castShadow receiveShadow />
      ))}
      <mesh position={[-5.0, 0.33, 4.2]} material={material("walnut")} castShadow>
        <boxGeometry args={[1.0, 0.36, 0.7]} />
      </mesh>

      {/* clipped boxwood in architectural planters */}
      {([[2.4, -7.4, 0], [5.0, -7.4, 0], [-7.8, -2.0, Math.PI / 2], [-7.8, 0.6, Math.PI / 2], [8.0, 4.4, 0.6]] as const).map(
        ([x, z, r], i) => (
          <group key={i} position={[x, 0.08, z]} rotation={[0, r, 0]}>
            <mesh geometry={planter} material={material("basalt")} position={[0, 0.26, 0]} castShadow receiveShadow />
            <mesh geometry={box} material={material("linen")} position={[0, 0.84, 0]} castShadow>
              <meshStandardMaterial
                color={new THREE.Color("#44572f").convertSRGBToLinear()}
                roughness={0.95}
                flatShading
              />
            </mesh>
          </group>
        ),
      )}

      {/* the outdoor screen, facing the lounge */}
      <group position={[1.2, 0.08, 7.2]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.9, 0]} material={material("steel")} castShadow>
          <boxGeometry args={[4.6, 2.7, 0.14]} />
        </mesh>
        <mesh position={[0, 1.9, 0.08]} material={lit(4000, 0.4)}>
          <planeGeometry args={[4.4, 2.5]} />
        </mesh>
      </group>

      {/* ground lanterns, which is how a terrace is lit after dark */}
      {([[-2.0, 2.0], [3.6, 2.6], [-6.0, -4.2], [6.2, -4.0]] as const).map(([x, z], i) => (
        <group key={i} position={[x, 0.08, z]}>
          <mesh material={material("brushed")}>
            <cylinderGeometry args={[0.07, 0.09, 0.42, 10]} />
          </mesh>
          <mesh position={[0, 0.23, 0]} material={lit(SPEC.kelvin, 1.4)}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
        </group>
      ))}

      {/* the dome's own light, seen from the terrace and from the street */}
      <pointLight position={[ATRIUM_CENTRE[0], 1.6, ATRIUM_CENTRE[1]]} intensity={30} distance={DOME_R * 4} decay={2} color={warm} />
      <pointLight position={[0, 4.5, 0]} intensity={14} distance={INNER * 2} decay={2} color={warm} />
    </group>
  );
}
