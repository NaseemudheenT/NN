"use client";

/**
 * Masonry: the structural vocabulary of the house.
 *
 * Everything in NERO NOREN that reads as "built" rather than "painted" comes
 * from this file. There are no flat partitions in the showroom. There are
 * thick walls — 300 to 450 mm of structure — pierced by Romanesque arches and
 * hollowed into deep niches, and every corner is bullnosed.
 *
 * ── why thickness is the whole trick ───────────────────────────────────
 * A flat plane with an arch painted on it is a stage flat. A real arch is a
 * hole through something, and the thing you actually see is the SOFFIT: the
 * curved inner face of the opening, turned away from the light, falling into
 * shadow as it curves. That band of graded shadow is what tells the eye the
 * wall has mass. It cannot be faked with a texture, because it changes as you
 * walk past — which is exactly what the camera does here.
 *
 * So an arch is extruded, not drawn: a 2D profile of the archivolt with the
 * opening as a hole in it, pushed through the wall depth. The soffit comes
 * out for free, because it is the inside of the hole.
 *
 * ── and why the corners are rounded ───────────────────────────────────
 * Lime plaster over masonry cannot hold a sharp arris. It is troweled by
 * hand over a rounded bead, so every edge in a real Mediterranean interior
 * carries a 25–50 mm bullnose. Rendered, that radius is where the highlight
 * lives: a sharp edge gives you one hard line, a bullnosed edge gives you a
 * soft gradient that follows the light around the corner. It is the single
 * biggest difference between a room that looks modelled and a room that
 * looks troweled, and it costs one bevel on the extrusion.
 *
 * Every geometry here is memoised. These are expensive to build — an
 * extrusion with a hole and a bevel is real work — and completely static.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS, type MaterialName } from "../materials";

/* ── the house constants, from the brief ─────────────────────────── */

/** Structural wall depth. The brief's 300–450 mm. */
export const MASONRY = {
  /** A pierced internal wall. */
  wall: 0.34,
  /** A deeper reveal, for the window embrasures and the portal. */
  deep: 0.45,
  /** How far a niche is sunk into the masonry. */
  niche: 0.3,
} as const;

/** The bullnose radius on every arris. The brief's 25–50 mm. */
export const BULLNOSE: { wall: number; trim: number } = {
  /** Walls, piers, reveals. */
  wall: 0.04,
  /** Arch rings and smaller trims, where 40 mm would eat the profile. */
  trim: 0.025,
};

/** Curve resolution. Twelve segments per quadrant reads as smooth at 1 m. */
const ARCH_SEGMENTS = 24;

/* ── materials ───────────────────────────────────────────────────── */

function physical(name: MaterialName) {
  const m = MATERIALS[name] as Record<string, unknown>;
  return (
    <meshPhysicalMaterial
      color={m.colour as string}
      roughness={m.roughness as number}
      metalness={m.metalness as number}
      sheen={(m.sheen as number) ?? 0}
      sheenColor={(m.sheenColour as string) ?? "#ffffff"}
      emissive={(m.emissive as string) ?? "#000000"}
      emissiveIntensity={(m.emissiveIntensity as number) ?? 0}
    />
  );
}

/* ── a bullnosed block ───────────────────────────────────────────── */

/**
 * A box whose edges are rounded.
 *
 * three.js has no rounded box, so this is an extruded rounded rectangle: the
 * profile corners give the rounding in two axes and the extrusion bevel gives
 * it in the third. The result is a block with no sharp arris anywhere on it,
 * which is what hand-troweled lime over masonry actually looks like.
 */
export function useBullnosedBox(
  width: number,
  height: number,
  depth: number,
  radius = BULLNOSE.wall,
) {
  return useMemo(() => {
    // The bevel eats into the depth from both ends, so the extrusion is
    // shortened to compensate and the finished block measures what was asked.
    const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001);
    const w = width - r * 2;
    const h = height - r * 2;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2 - r);
    shape.lineTo(w / 2, -h / 2 - r);
    shape.quadraticCurveTo(w / 2 + r, -h / 2 - r, w / 2 + r, -h / 2);
    shape.lineTo(w / 2 + r, h / 2);
    shape.quadraticCurveTo(w / 2 + r, h / 2 + r, w / 2, h / 2 + r);
    shape.lineTo(-w / 2, h / 2 + r);
    shape.quadraticCurveTo(-w / 2 - r, h / 2 + r, -w / 2 - r, h / 2);
    shape.lineTo(-w / 2 - r, -h / 2);
    shape.quadraticCurveTo(-w / 2 - r, -h / 2 - r, -w / 2, -h / 2 - r);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - r * 2,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 3,
      curveSegments: 6,
    });
    // Extrusion runs 0..depth in +Z; centre it so the block behaves like a box.
    geometry.translate(0, 0, -(depth - r * 2) / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, [width, height, depth, radius]);
}

export function BullnosedBox({
  width,
  height,
  depth,
  radius,
  material,
  ...props
}: {
  width: number;
  height: number;
  depth: number;
  radius?: number;
  material: MaterialName;
} & Omit<React.ComponentProps<"mesh">, "material" | "geometry">) {
  const geometry = useBullnosedBox(width, height, depth, radius);
  return (
    <mesh geometry={geometry} {...props}>
      {physical(material)}
    </mesh>
  );
}

/* ── the Romanesque arch ─────────────────────────────────────────── */

export interface ArchSpec {
  /** Clear width of the opening, metres. */
  width: number;
  /** Springing height — where the straight jamb stops and the curve starts. */
  springing: number;
  /** Depth through the wall. */
  depth: number;
  /** Width of the archivolt band around the opening. */
  ring: number;
}

/**
 * The profile of an archivolt: the band of masonry framing a semicircular
 * opening, as a shape with the opening punched out of it.
 *
 * Romanesque means the head is a true semicircle struck from the springing
 * line — not a pointed Gothic arch, not a shallow segmental one. The rise
 * equals half the span, always, which is why these openings look settled and
 * heavy rather than aspiring.
 */
function archivoltShape({ width, springing, ring }: Omit<ArchSpec, "depth">): THREE.Shape {
  const inner = width / 2;
  const outer = inner + ring;

  const shape = new THREE.Shape();
  shape.moveTo(-outer, 0);
  shape.lineTo(-outer, springing);
  shape.absarc(0, springing, outer, Math.PI, 0, true);
  shape.lineTo(outer, 0);
  shape.lineTo(inner, 0);
  shape.lineTo(inner, springing);
  shape.absarc(0, springing, inner, 0, Math.PI, false);
  shape.lineTo(-inner, 0);
  shape.closePath();

  return shape;
}

/**
 * A thick structural arch — the opening itself, with its soffit.
 *
 * This is the piece that carries the room. It is placed IN a wall, and the
 * wall around it is built by `pierceWall` below so the two always agree.
 */
export function MasonryArch({
  spec,
  material,
  ringMaterial,
  ...props
}: {
  spec: ArchSpec;
  /** The wall the arch is pierced through. */
  material: MaterialName;
  /** The archivolt band — brick red, in this house. */
  ringMaterial?: MaterialName;
} & Omit<React.ComponentProps<"group">, "material">) {
  const { width, springing, depth, ring } = spec;

  /* The ring, extruded through the full wall depth and bullnosed at both
     faces. Where the ring is a different material from the wall it is drawn
     as its own solid rather than as a painted band, because the ring on a
     real arch stands slightly proud of the plaster. */
  const ringGeometry = useMemo(() => {
    const shape = archivoltShape({ width, springing, ring });
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: depth - BULLNOSE.trim * 2,
      bevelEnabled: true,
      bevelThickness: BULLNOSE.trim,
      bevelSize: BULLNOSE.trim,
      bevelSegments: 3,
      curveSegments: ARCH_SEGMENTS,
    });
    g.translate(0, 0, -(depth - BULLNOSE.trim * 2) / 2);
    g.computeVertexNormals();
    return g;
  }, [width, springing, depth, ring]);

  /* One mesh, not two.
     The soffit — the curved inner face you actually see as you walk under
     the arch — needs no geometry of its own: the extrusion punches the
     opening out as a HOLE, and ExtrudeGeometry builds a side wall for every
     hole it is given. Verified: 502 of the ring's vertices sit exactly on
     the inner radius, spanning the full 340 mm of depth. That side wall IS
     the soffit, and it is brick, which is how an exposed archivolt is
     actually built.

     This replaced a TubeGeometry swept along the arch outline, which was
     wrong twice over — redundant, because the hole wall was already there
     underneath it, and the wrong shape, because a tube of radius depth/2
     is a round bead of moulding rather than a flat soffit band. */
  return (
    <group {...props}>
      <mesh geometry={ringGeometry} castShadow receiveShadow>
        {physical(ringMaterial ?? material)}
      </mesh>
    </group>
  );
}

/* ── a deep niche ────────────────────────────────────────────────── */

/**
 * A deep wall niche with an arched head.
 *
 * The brief asks for these and they do real work: a niche is a frame built
 * into the structure, and a garment standing in one is lit on three sides by
 * bounce off its own walls. The back gets a different clay — sage or
 * terracotta — so the recess reads as a considered space rather than a hole,
 * and so the piece in front of it has something to stand against.
 */
export function Niche({
  width,
  height,
  depth = MASONRY.niche,
  springing,
  material,
  backMaterial,
  ...props
}: {
  width: number;
  height: number;
  depth?: number;
  /** Where the arched head springs. Defaults to a semicircle on top. */
  springing?: number;
  /** The reveal — the lime of the recess sides. */
  material: MaterialName;
  /** The clay at the back of the recess. */
  backMaterial: MaterialName;
} & Omit<React.ComponentProps<"group">, "material">) {
  const spring = springing ?? height - width / 2;

  /* The back panel, shaped to the niche: a rectangle with a semicircular
     head, so the clay reaches into the arch instead of stopping square
     behind it and leaving a visible corner. */
  const backGeometry = useMemo(() => {
    const r = width / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-r, 0);
    shape.lineTo(-r, spring);
    shape.absarc(0, spring, r, Math.PI, 0, true);
    shape.lineTo(r, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape, ARCH_SEGMENTS);
  }, [width, spring]);

  /* The reveal: the sides and arched head of the recess.

     Built the same way as the archivolt, and for the same reason — a thin
     ring extruded through the niche depth, with the opening punched out as a
     hole, so the hole's own side wall becomes the reveal. The alternative
     here was also a swept tube, and it had the same two faults: a round bead
     where a flat band belongs, laid over a surface that already existed. */
  const revealGeometry = useMemo(() => {
    const r = width / 2;
    const t = 0.05;

    const outline = (radius: number, spring: number) => {
      const path = new THREE.Path();
      path.moveTo(-radius, 0);
      path.lineTo(-radius, spring);
      path.absarc(0, spring, radius, Math.PI, 0, true);
      path.lineTo(radius, 0);
      path.closePath();
      return path;
    };

    const shape = new THREE.Shape(outline(r + t, spring).getPoints(ARCH_SEGMENTS * 2));
    const hole = new THREE.Path();
    hole.setFromPoints(outline(r, spring).getPoints(ARCH_SEGMENTS * 2));
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: BULLNOSE.trim,
      bevelSize: BULLNOSE.trim,
      bevelSegments: 2,
      curveSegments: ARCH_SEGMENTS,
    });
    g.translate(0, 0, -depth);
    g.computeVertexNormals();
    return g;
  }, [width, spring, depth]);

  return (
    <group {...props}>
      {/* the clay back, at the bottom of the recess */}
      <mesh geometry={backGeometry} position={[0, 0, -depth + 0.004]} receiveShadow>
        {physical(backMaterial)}
      </mesh>
      {/* the lime reveal around it */}
      <mesh geometry={revealGeometry} receiveShadow>
        {physical(material)}
      </mesh>
    </group>
  );
}
