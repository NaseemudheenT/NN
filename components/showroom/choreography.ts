/**
 * How the camera moves through the room.
 *
 * A camera in a showroom is carried by a person, and that single fact decides
 * everything here. A person walks around the table rather than over it, turns
 * their head before their feet arrive, takes longer to cross the room than to
 * step to the next rail, and never stands inside a mannequin.
 *
 * Interpolating straight between two viewpoints breaks every one of those.
 * Measured against the room as it is actually built, a straight line from the
 * entrance to the mirror passes 0.2 m from the centre of the trousers table,
 * and a straight line from the shirts to the fitting room passes 0.5 m from a
 * dressed mannequin — through both. So the path is routed, not interpolated.
 *
 * This module is pure geometry and pure arithmetic: no React, no three.js
 * scene, nothing that needs a renderer. That is deliberate — it means the
 * floor plan can be checked against every viewpoint and every path by a
 * script, which is what `npm run showroom:check` does, and a camera placed
 * inside the furniture becomes a build failure instead of something a visitor
 * discovers.
 */

import * as THREE from "three";
import { ROOM } from "./objects/Room";

/* ── the floor plan ──────────────────────────────────────────────────
   What the camera has to get around, measured off the geometry in
   objects/Fixtures.tsx rather than estimated. Each is a rectangle with a
   rounded skirt: `hx`/`hz` are the half-extents of the footprint and `pad`
   is the radius added to it. A mannequin is a point with a wide skirt; a
   table is a long rectangle with none.

   Height matters as much as footprint, and in two different ways. The
   table is 0.44 m high, so it never meets the lens — but a person still
   cannot walk through it, so it blocks the path. The mannequins are 1.7 m
   with shoulders at 1.56 m, just under eye height, so they block the path
   AND fill the frame. Both are obstacles; only one can be collided with. */
export interface FloorObstacle {
  id: string;
  /** Centre on the floor, metres. */
  x: number;
  z: number;
  /** Footprint half-extents. Zero for anything round. */
  hx: number;
  hz: number;
  /** Radius added to the footprint — the skirt, and whatever is draped on it. */
  pad: number;
  /** Top of the object. Below eye height it blocks the walk but not the view. */
  height: number;
}

export const FLOOR_PLAN: readonly FloorObstacle[] = [
  // The low oak table: 2.2 × 0.95, top at 0.44. Folded trousers on it.
  { id: "table", x: -0.4, z: -0.9, hx: 1.1, hz: 0.475, pad: 0.06, height: 0.5 },
  // The two dressed forms. Base ø 0.56, shoulders 0.57 across at 1.56 m,
  // plus a shirt on them — 0.34 covers the lot whichever way they face.
  { id: "mannequin-a", x: -2.1, z: 1.5, hx: 0, hz: 0, pad: 0.34, height: 1.75 },
  { id: "mannequin-b", x: 1.5, z: 1.75, hx: 0, hz: 0, pad: 0.34, height: 1.75 },
  // The rails stand 150 mm off the back wall and the garments hang on them,
  // so the last half-metre of that wall is not walkable.
  { id: "rail-a", x: -3.3, z: ROOM.halfD - 0.3, hx: 0.9, hz: 0.22, pad: 0.1, height: 2.0 },
  { id: "rail-b", x: -1.0, z: ROOM.halfD - 0.3, hx: 0.9, hz: 0.22, pad: 0.1, height: 2.0 },
  // The full-length mirror, flat against the right-hand wall.
  { id: "mirror", x: ROOM.halfW - 0.1, z: -1.4, hx: 0.06, hz: 0.6, pad: 0.08, height: 2.3 },
];

/** Shoulder room. The camera is a person's eyes, not a point. */
export const CLEARANCE = 0.42;

/** How close the camera may come to a wall before it reads as scraping it. */
export const WALL_MARGIN = 0.4;

/* ── clearance ───────────────────────────────────────────────────── */

/** Distance from a floor point to an obstacle's skirt. Negative means inside. */
export function distanceToObstacle(x: number, z: number, o: FloorObstacle): number {
  const dx = Math.max(Math.abs(x - o.x) - o.hx, 0);
  const dz = Math.max(Math.abs(z - o.z) - o.hz, 0);
  return Math.hypot(dx, dz) - o.pad;
}

export interface Clearance {
  /** Metres to the nearest obstacle. Negative means inside one. */
  distance: number;
  obstacle: FloorObstacle | null;
}

/** How much room the camera has at a point on the floor. */
export function clearanceAt(
  x: number,
  z: number,
  plan: readonly FloorObstacle[] = FLOOR_PLAN,
): Clearance {
  let distance = Infinity;
  let obstacle: FloorObstacle | null = null;
  for (const o of plan) {
    const d = distanceToObstacle(x, z, o);
    if (d < distance) {
      distance = d;
      obstacle = o;
    }
  }
  return { distance, obstacle };
}

/** Distance to the nearest wall. Negative means outside the room. */
export function wallClearance(x: number, z: number): number {
  return Math.min(
    ROOM.halfW - Math.abs(x),
    ROOM.halfD - Math.abs(z),
  );
}

/* ── routing ─────────────────────────────────────────────────────── */

/** One sample every 45 cm of path. A long walk needs more than a short step:
    with too few samples the smoothing pass simply drags a pushed sample back
    into the furniture, because its neighbours are still on the far side of
    the obstacle. Measured — eleven samples across the nine-metre entrance-to-
    mirror walk left the path 0.23 m inside the table. */
const SAMPLE_SPACING = 0.45;
const MIN_SAMPLES = 9;
const MAX_SAMPLES = 41;
const ITERATIONS = 120;
/** How strongly a kinked path straightens itself out each pass. */
const SMOOTHING = 0.2;
/** How strongly an obstacle pushes the path away each pass. */
const REPULSION = 0.85;
/** Closing passes with repulsion only, so smoothing cannot undo the last of it. */
const SETTLE_PASSES = 24;

/**
 * A walkable path from one point to another.
 *
 * This is an elastic band: the straight line is sampled, every interior
 * sample is pushed out of whatever it is standing in and then pulled back
 * toward the midpoint of its neighbours, and the two forces are iterated to a
 * standstill. Repulsion gets the path out of the furniture; smoothing keeps it
 * from kinking while it does. Both endpoints are pinned, because a viewpoint
 * is a design decision and nudging one silently would move the composition
 * someone chose.
 *
 * Deterministic, and about a third of a millisecond — it runs once when a move
 * begins, never per frame.
 */
export function routeBetween(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  plan: readonly FloorObstacle[] = FLOOR_PLAN,
): THREE.Vector3[] {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);

  const samples = THREE.MathUtils.clamp(
    Math.round(a.distanceTo(b) / SAMPLE_SPACING),
    MIN_SAMPLES,
    MAX_SAMPLES,
  );

  const points: THREE.Vector3[] = [a.clone()];
  for (let i = 1; i < samples - 1; i += 1) {
    points.push(a.clone().lerp(b, i / (samples - 1)));
  }
  points.push(b.clone());

  /** Push one sample out of whatever it is standing in. Returns how deep it was. */
  const repel = (p: THREE.Vector3): number => {
    let depth = 0;
    for (const o of plan) {
      const penetration = CLEARANCE - distanceToObstacle(p.x, p.z, o);
      if (penetration <= 0) continue;

      // Away from the nearest point on the obstacle's footprint, which for a
      // rectangle is not the same direction as away from its centre.
      const nearX = THREE.MathUtils.clamp(p.x, o.x - o.hx, o.x + o.hx);
      const nearZ = THREE.MathUtils.clamp(p.z, o.z - o.hz, o.z + o.hz);
      let ax = p.x - nearX;
      let az = p.z - nearZ;
      let len = Math.hypot(ax, az);

      if (len < 1e-4) {
        // Dead centre of the footprint: there is no "away", so leave along
        // whichever axis is the shorter way out.
        const outX = o.hx + o.pad + CLEARANCE;
        const outZ = o.hz + o.pad + CLEARANCE;
        if (outX < outZ) {
          ax = p.x >= o.x ? 1 : -1;
          az = 0;
        } else {
          ax = 0;
          az = p.z >= o.z ? 1 : -1;
        }
        len = 1;
      }

      const step = (penetration * REPULSION) / len;
      p.x += ax * step;
      p.z += az * step;
      depth += penetration;
    }
    return depth;
  };

  const confine = (p: THREE.Vector3) => {
    // Only inside the building. The approach shot deliberately stands outside
    // the portal, and clamping it to the walls would drag it indoors.
    if (p.x < -ROOM.halfW) return;
    p.x = THREE.MathUtils.clamp(p.x, -ROOM.halfW + WALL_MARGIN, ROOM.halfW - WALL_MARGIN);
    p.z = THREE.MathUtils.clamp(p.z, -ROOM.halfD + WALL_MARGIN, ROOM.halfD - WALL_MARGIN);
  };

  for (let pass = 0; pass < ITERATIONS; pass += 1) {
    let depth = 0;
    for (let i = 1; i < points.length - 1; i += 1) {
      const p = points[i];

      // straighten: toward the midpoint of the neighbours
      const midX = (points[i - 1].x + points[i + 1].x) / 2;
      const midZ = (points[i - 1].z + points[i + 1].z) / 2;
      p.x += (midX - p.x) * SMOOTHING;
      p.z += (midZ - p.z) * SMOOTHING;

      depth += repel(p);
      confine(p);
    }
    if (depth < 1e-4 && pass > 4) break;
  }

  // Smoothing and repulsion reach a standstill where they balance, which can
  // leave a sample a few centimetres inside a long obstacle. These passes
  // drop the smoothing so the path finishes genuinely clear.
  for (let pass = 0; pass < SETTLE_PASSES; pass += 1) {
    let depth = 0;
    for (let i = 1; i < points.length - 1; i += 1) {
      depth += repel(points[i]);
      confine(points[i]);
    }
    if (depth < 1e-5) break;
  }

  return points;
}

/** The routed path as a curve the camera can be dragged along. */
export function curveBetween(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  plan: readonly FloorObstacle[] = FLOOR_PLAN,
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(routeBetween(from, to, plan), false, "catmullrom", 0.5);
}

/* ── timing ──────────────────────────────────────────────────────── */

/**
 * How long a move takes.
 *
 * Not walking speed — a literal 1.15 m/s would make crossing this room a
 * nine-second move, and nobody waits nine seconds to look at a shirt. Film
 * language compresses distance but keeps its ORDER: a longer move still takes
 * longer, and a bigger turn of the head still takes longer than a small one.
 * That ordering is what makes the room feel like a fixed size.
 *
 * Turning is weighted heavily on purpose. Stepping from the shirts to the
 * trousers is three metres but a 180° turn, and it should feel like the turn
 * it is rather than the three metres it is.
 */
export function moveDuration(metres: number, sweepRadians: number): number {
  const d = 0.95 + metres * 0.145 + sweepRadians * 0.28;
  return THREE.MathUtils.clamp(d, 1.2, 3.2);
}

/** The angle between two look directions, in radians. */
export function sweepBetween(
  fromEye: readonly [number, number, number],
  fromTarget: readonly [number, number, number],
  toEye: readonly [number, number, number],
  toTarget: readonly [number, number, number],
): number {
  const a = Math.atan2(fromTarget[2] - fromEye[2], fromTarget[0] - fromEye[0]);
  const b = Math.atan2(toTarget[2] - toEye[2], toTarget[0] - toEye[0]);
  let d = Math.abs(b - a) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

/** Long enough that the camera looks where it is going before it looks at the thing. */
export const LOOK_AHEAD_FROM = 3.5;

/**
 * Where the eyes go mid-move.
 *
 * On a long walk a person looks along their path and only turns to the
 * subject as they arrive. This is that intermediate point: a little way
 * further along the route than the camera itself, at eye height.
 */
export function lookAheadPoint(
  curve: THREE.CatmullRomCurve3,
  eyeHeight: number,
): [number, number, number] {
  const ahead = curve.getPointAt(0.78);
  return [ahead.x, eyeHeight, ahead.z];
}
