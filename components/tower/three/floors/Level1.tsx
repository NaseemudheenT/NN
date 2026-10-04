"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { People } from "../People";
import { mergeAll, metricUV } from "../geometry";
import { railGeometry, hangingGeometry, pedestalGeometry, mannequinGeometry, frameGeometry } from "../fixtures";
import { monogramTexture } from "../textures";

/**
 * NN TOWER — Level 1. The hero board and the collection gallery.
 *
 * The first floor a customer sees from inside the atrium, so it is the one
 * that has to say what the house makes. Travertine cladding, dark oak
 * acoustic slats, a curved campaign wall, pedestals under spot track, and
 * the season's coats on rail.
 *
 * ── the slat wall is acoustic, not decorative ────────────────────────
 * Vertical timber slats on a backing absorb mid-frequencies, which is why
 * every quiet retail interior built in the last decade has them. Modelled
 * as real battens at 60 mm on 90 mm centres: at that pitch the shadow
 * between them does the work, and it is cheap because the whole wall
 * merges into one buffer.
 *
 * ── the spotlights are tracked and aimed ─────────────────────────────
 * Retail lighting is not an even wash. It is a dark room with bright
 * objects in it: roughly 3:1 between what is lit and what is not, aimed at
 * merchandise. An evenly lit shop floor reads as a supermarket.
 */

const SPEC = LEVELS[1];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

export function Level1({ visible = true }: { visible?: boolean }) {
  /* The acoustic slat wall: real battens, merged. */
  const slats = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const run = 15;
    const n = Math.floor(run / 0.09);
    for (let i = 0; i < n; i++) {
      const b = metricUV(new THREE.BoxGeometry(0.06, CLEAR - 0.5, 0.045), 0.06, CLEAR);
      b.translate(-run / 2 + i * 0.09, (CLEAR - 0.5) / 2, 0);
      parts.push(b);
    }
    const back = metricUV(new THREE.BoxGeometry(run, CLEAR - 0.5, 0.03), run, CLEAR);
    back.translate(0, (CLEAR - 0.5) / 2, -0.04);
    parts.push(back);
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  /* The campaign wall: curved, because a flat screen in a classical room
     looks bolted on and a curve follows the rotunda the room already has. */
  const campaign = useMemo(
    () => new THREE.CylinderGeometry(7.4, 7.4, 2.6, 40, 1, true, Math.PI * 0.14, Math.PI * 0.52),
    [],
  );

  /* Spot track: a rail with heads on it, aimed down at the merchandise. */
  const track = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const z of [-5, 0, 5]) {
      const bar = metricUV(new THREE.BoxGeometry(INNER * 1.7, 0.05, 0.05), INNER * 1.7, 0.05);
      bar.translate(0, 0, z);
      parts.push(bar);
      for (let i = -3; i <= 3; i++) {
        const head = new THREE.CylinderGeometry(0.045, 0.062, 0.14, 10);
        head.translate(i * 2.3, -0.1, z);
        parts.push(head);
      }
    }
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  const rail = useMemo(() => railGeometry(3.4, 9), []);
  const coats = useMemo(() => hangingGeometry(3.4, 9, "coat"), []);
  const pedestal = useMemo(() => pedestalGeometry(1.1, 1.1, 0.72), []);
  const mannequin = useMemo(() => mannequinGeometry(1.82), []);
  const frame = useMemo(() => frameGeometry(1.3, 1.8), []);
  const mark = useMemo(() => monogramTexture(256), []);

  /* The HERO BOARD. The reference puts a tall dark signage wall on this
     floor carrying the house name — it is the first thing you read when
     you come up from reception, and the floor is named after it. */
  const board = useMemo(() => {
    const g = metricUV(new THREE.BoxGeometry(7.2, CLEAR - 0.9, 0.22), 7.2, CLEAR - 0.9);
    g.translate(0, (CLEAR - 0.9) / 2, 0);
    return g;
  }, []);

  if (!visible) return null;
  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      {/* exposed concrete soffit — the ledger calls for it, and it is what
          gives a gallery its height */}
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("concrete")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>
      <mesh geometry={track} material={material("steel")} position={[0, CLEAR - 0.34, 0]} castShadow />

      {/* the slat wall, on the long elevation */}
      <mesh
        geometry={slats}
        material={material("walnut")}
        position={[-2, 0, -INNER + 0.4]}
        castShadow
        receiveShadow
      />

      {/* the campaign wall, curved into the corner */}
      <group position={[2.6, 0, 2.6]}>
        <mesh geometry={campaign} material={material("steel")} position={[0, 1.9, 0]} />
        <mesh geometry={campaign} material={lit(5200, 0.72)} position={[0, 1.9, 0]} scale={[0.985, 0.94, 0.985]} />
      </group>

      {/* the season, on rail */}
      {[[-7.4, -2.2, 0], [-7.4, 3.4, 0], [6.6, -6.6, Math.PI / 2]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={rail} material={material("steel")} castShadow />
          <mesh geometry={coats} material={material("linen")} castShadow />
        </group>
      ))}

      {/* pedestals under the track */}
      {[[-2.4, 6.2], [0.6, 7.2], [-5.2, 7.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={pedestal} material={material("brushed")} castShadow receiveShadow />
          <mesh position={[0, 1.1, 0]} material={material("glass")}>
            <boxGeometry args={[1.0, 0.72, 1.0]} />
          </mesh>
          {/* the spot that makes it merchandise rather than furniture */}
        </group>
      ))}

      {/* the hero board */}
      <group position={[6.4, 0, -5.2]} rotation={[0, -Math.PI / 2.6, 0]}>
        <mesh geometry={board} material={material("walnut")} castShadow receiveShadow />
        <mesh position={[0, CLEAR * 0.56, 0.12]}>
          <planeGeometry args={[1.5, 1.18]} />
          <meshBasicMaterial map={mark ?? undefined} color="#c5a059" transparent toneMapped={false} />
        </mesh>
        {/* a lit rule under the mark, which is how signage is actually
            picked out on a dark board */}
        <mesh position={[0, CLEAR * 0.33, 0.12]} material={lit(2900, 0.85)}>
          <planeGeometry args={[4.4, 0.012]} />
        </mesh>
      </group>

      {/* mannequins — a whole outfit standing up, which a rail cannot show */}
      {([[-4.6, 5.4, 0.4], [-3.1, 6.3, -0.9], [1.4, -6.4, 2.1]] as const).map(([x, z, r], i) => (
        <mesh key={i} geometry={mannequin} material={material(i === 1 ? "linen" : "basalt")}
              position={[x, 0, z]} rotation={[0, r, 0]} castShadow receiveShadow />
      ))}

      {/* framed campaign work on the slat wall */}
      {[-4.6, -1.6, 1.4].map((x, i) => (
        <group key={i} position={[x, 2.1, -INNER + 0.52]}>
          <mesh geometry={frame} material={material("walnut")} castShadow />
          <mesh position={[0, 0, 0.012]} material={lit(3200, 0.3)}>
            <planeGeometry args={[1.2, 1.7]} />
          </mesh>
        </group>
      ))}

      {/* the ambient the spots sit against — deliberately low */}
      <pointLight position={[0, CLEAR * 0.72, 0]} intensity={34} distance={26} decay={2} color={warm} />

      {/* The people in the room. Without them a luxury interior reads as
          closed, and there is nothing in frame to tell you how tall the
          ceiling is — a 4 m soffit is a number until a 1.75 m figure
          stands under it. */}
      <People seed={23} count={11} bounds={9.2} y={0} />
    </group>
  );
}
