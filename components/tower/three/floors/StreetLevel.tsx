"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { People } from "../People";
import { mergeAll, metricUV } from "../geometry";
import { monogramTexture } from "../textures";

/**
 * NN TOWER — Street Level. Entrance, reception, check-in.
 *
 * A 6.5 m double-height volume, which is what gives a luxury ground floor
 * its presence and is why the storey above it is only 4 m. Honed travertine
 * underfoot with milled brass inlay lines, a coffered plaster ceiling, and
 * four Doric-proportioned columns carrying it.
 *
 * ── the columns are 1:8, and that is not decoration ──────────────────
 * A classical column's whole character is its slenderness ratio. Roman
 * Doric runs about eight diameters tall; Corinthian about ten. Model a
 * column at 1:5 and it reads as a bollard, at 1:14 as scaffolding. The
 * entasis — the slight swell at a third of the height — is the detail that
 * separates a drawn column from a turned one, and it is three lines of
 * lathe maths.
 *
 * ── everything here is furniture, not signage ────────────────────────
 * The reception desk is a desk: a 1.1 m oak carcass with a 40 mm brushed
 * ledge at transaction height. The check-in portals are glass on brushed
 * stands at 2.1 m. The working map is a lit screen in a blackened frame.
 * None of it is a label floating in space.
 */

const SPEC = LEVELS[0];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;

/** A turned column with entasis, built as a lathe profile. */
function columnGeometry(height: number, diameter: number): THREE.BufferGeometry {
  const r = diameter / 2;
  const pts: THREE.Vector2[] = [];
  const SEGS = 22;
  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    // Entasis: the swell peaks a third of the way up and tapers to ~82% at
    // the neck. A straight cylinder reads as a pipe.
    const swell = Math.sin((t * 0.86 + 0.07) * Math.PI) * 0.055;
    const taper = 1 - t * 0.18;
    pts.push(new THREE.Vector2(r * (taper + swell), t * (height - r * 1.4)));
  }
  // the capital: a necking, an echinus and a square abacus
  const top = height - r * 1.4;
  pts.push(new THREE.Vector2(r * 0.9, top + r * 0.1));
  pts.push(new THREE.Vector2(r * 1.18, top + r * 0.52));
  pts.push(new THREE.Vector2(r * 1.3, top + r * 0.78));
  pts.push(new THREE.Vector2(r * 1.3, top + r * 1.2));
  pts.push(new THREE.Vector2(0, top + r * 1.2));
  const g = new THREE.LatheGeometry(pts, 28);
  g.computeVertexNormals();
  return g;
}

export function StreetLevel({ visible = true }: { visible?: boolean }) {
  /* The floor: travertine, with brass inlay lines set into it on a 4 m
     grid — the detail that tells you a floor was laid rather than poured. */
  const brass = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const span = INNER * 2 - 1.2;
    for (let i = -2; i <= 2; i++) {
      const a = metricUV(new THREE.BoxGeometry(span, 0.012, 0.045), span, 0.045);
      a.translate(0, 0, i * 4);
      parts.push(a);
      const b = metricUV(new THREE.BoxGeometry(0.045, 0.012, span), 0.045, span);
      b.translate(i * 4, 0, 0);
      parts.push(b);
    }
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  /* The coffered ceiling: a grid of recessed panels. Coffering is not
     ornament — it is how you span a wide room in stone and it is what makes
     a tall ceiling read as held up rather than floating. */
  const coffers = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const n = 5;
    const pitch = (INNER * 2 - 2) / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -(INNER - 1) + pitch * (i + 0.5);
        const z = -(INNER - 1) + pitch * (j + 0.5);
        if (Math.hypot(x, z) > INNER - 1.4) continue;
        const b = metricUV(
          new THREE.BoxGeometry(pitch * 0.82, 0.3, pitch * 0.82),
          pitch * 0.82, pitch * 0.82,
        );
        b.translate(x, 0, z);
        parts.push(b);
      }
    }
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  const column = useMemo(() => columnGeometry(CLEAR - 0.4, 0.86), []);
  const columnAt: [number, number][] = [[-6.5, -6.5], [-6.5, 4.5], [4.5, -6.5], [-1, 8.5]];

  /* The reception desk. */
  const desk = useMemo(() => {
    const carcass = metricUV(new THREE.BoxGeometry(3.6, 1.06, 0.78), 3.6, 1.06);
    carcass.translate(0, 0.53, 0);
    return carcass;
  }, []);
  const ledge = useMemo(() => {
    const g = metricUV(new THREE.BoxGeometry(3.78, 0.045, 0.94), 3.78, 0.94);
    g.translate(0, 1.08, 0);
    return g;
  }, []);

  /* Check-in portals: glass blades on brushed stands. */
  const portalGlass = useMemo(() => metricUV(new THREE.BoxGeometry(0.86, 1.3, 0.035), 0.86, 1.3), []);
  const portalStand = useMemo(() => new THREE.CylinderGeometry(0.06, 0.09, 0.95, 12), []);

  /* The working map: a lit screen in a blackened frame. */
  const mapFrame = useMemo(() => metricUV(new THREE.BoxGeometry(2.3, 1.45, 0.09), 2.3, 1.45), []);
  const mark = useMemo(() => monogramTexture(256), []);

  if (!visible) return null;

  const warm = kelvinToColor(SPEC.kelvin);

  return (
    <group position={[0, SLAB, 0]}>
      {/* brass inlay set into the travertine */}
      <mesh geometry={brass} material={material("gold")} position={[0, 0.006, 0]} receiveShadow />

      {/* the ceiling and its coffers */}
      <mesh position={[0, CLEAR - 0.1, 0]} material={material("plaster")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.2, INNER * 2]} />
      </mesh>
      <mesh geometry={coffers} material={material("plaster")} position={[0, CLEAR - 0.36, 0]} receiveShadow />

      {/* the order */}
      {columnAt.map(([x, z], i) => (
        <mesh key={i} geometry={column} material={material("travertine")} position={[x, 0, z]} castShadow receiveShadow />
      ))}

      {/* reception */}
      <group position={[-5.5, 0, -4.2]} rotation={[0, Math.PI * 0.18, 0]}>
        <mesh geometry={desk} material={material("oak")} castShadow receiveShadow />
        <mesh geometry={ledge} material={material("brushed")} castShadow />
        {/* the task light over it, which is what makes a desk read as staffed */}
        <pointLight position={[0, 2.6, 0.3]} intensity={18} distance={9} decay={2} color={warm} />
        <mesh position={[0, 1.12, -0.1]} material={lit(SPEC.kelvin, 0.5)}>
          <planeGeometry args={[3.2, 0.02]} />
        </mesh>
      </group>

      {/* The house name behind reception. A hotel or a flagship puts its
          mark on the wall the desk stands against, lit from above — it is
          what tells you which building you have walked into. */}
      <group position={[-5.5, 0, -6.1]} rotation={[0, Math.PI * 0.18, 0]}>
        <mesh material={material("travertine")} position={[0, 2.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[5.4, 4.2, 0.14]} />
        </mesh>
        <mesh position={[0, 2.5, 0.09]}>
          <planeGeometry args={[1.25, 0.98]} />
          <meshBasicMaterial map={mark ?? undefined} color="#c5a059" transparent toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.62, 0.09]} material={lit(2800, 0.6)}>
          <planeGeometry args={[3.0, 0.01]} />
        </mesh>
      </group>

      {/* check-in portals */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[2.6 + i * 1.5, 0, -7.4]}>
          <mesh geometry={portalStand} material={material("brushed")} position={[0, 0.48, 0]} castShadow />
          <mesh geometry={portalGlass} material={material("smartglass")} position={[0, 1.6, 0]} />
          <mesh position={[0, 1.6, 0.025]} material={lit(4200, 0.5)}>
            <planeGeometry args={[0.78, 1.2]} />
          </mesh>
        </group>
      ))}

      {/* the working map */}
      <group position={[-9.2, 0, 3.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={mapFrame} material={material("steel")} position={[0, 1.95, 0]} castShadow />
        <mesh position={[0, 1.95, 0.05]} material={lit(4600, 0.62)}>
          <planeGeometry args={[2.1, 1.26]} />
        </mesh>
      </group>

      {/* the wash that lights the volume */}
      <pointLight position={[0, CLEAR * 0.78, 0]} intensity={90} distance={34} decay={2} color={warm} />
      <pointLight position={[7, 2.6, 7]} intensity={26} distance={16} decay={2} color={warm} />

      {/* The people in the room. Without them a luxury interior reads as
          closed, and there is nothing in frame to tell you how tall the
          ceiling is — a 4 m soffit is a number until a 1.75 m figure
          stands under it. */}
      <People seed={11} count={9} bounds={9.0} y={0} />
    </group>
  );
}
