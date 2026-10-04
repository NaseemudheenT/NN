/**
 * NN TOWER — the people in it.
 *
 * ── why a shop with nobody in it looks shut ──────────────────────────
 * The single largest difference between the reference board and the build
 * was not a material or a light: it was that the reference is full of
 * people and the model was empty. An empty luxury interior does not read
 * as calm, it reads as closed — and worse, it removes the only thing in
 * the frame that tells you how big the room is. A 4 m ceiling is just a
 * number until there is a 1.75 m figure standing under it.
 *
 * ── why they are simple, and why that is right ───────────────────────
 * These are lathed silhouettes: head, shoulders, torso tapering to the
 * hem, legs. No faces, no hands, no animation. That is a deliberate
 * ceiling, not a budget. A detailed character at this distance costs
 * thousands of triangles and lands in the uncanny valley the moment it
 * stops moving; a well-proportioned silhouette in dark cloth reads as a
 * person at a glance and never pretends to be more. Architectural
 * visualisation has used exactly this convention for decades for exactly
 * this reason.
 *
 * Proportion is the whole job. Head is one seventh of height, shoulders
 * are two head-widths, the hem of a coat falls at mid-thigh. Get those
 * wrong and the figure reads as a mannequin or a child.
 */

import * as THREE from "three";
import { mergeAll } from "./geometry";

export type Pose = "stand" | "walk" | "lean";

/**
 * One figure.
 *
 * `height` is real metres — 1.60 to 1.88 for adults, around 1.35 for a
 * child, because the house dresses men AND boys and a floor with only
 * adult-height figures on it quietly contradicts the brand.
 */
export function figureGeometry(height = 1.76, pose: Pose = "stand"): THREE.BufferGeometry {
  const h = height;
  const head = h / 7.4;              // classical canon, near enough
  const shoulder = head * 2.0;
  const parts: THREE.BufferGeometry[] = [];

  /* Torso: lathed from shoulder to hem so the silhouette has a waist. */
  const torsoTop = h - head * 1.25;
  const torsoBot = h * 0.44;
  const prof: [number, number][] = [
    [shoulder * 0.46, 0.0],
    [shoulder * 0.42, 0.22],
    [shoulder * 0.40, 0.46],
    [shoulder * 0.47, 0.74],
    [shoulder * 0.50, 0.92],
    [shoulder * 0.34, 1.0],
  ];
  const torso = new THREE.LatheGeometry(
    prof.map(([r, t]) => new THREE.Vector2(r, torsoBot + t * (torsoTop - torsoBot))),
    14,
  );
  torso.scale(1, 1, 0.62);           // people are not cylinders
  parts.push(torso);

  /* Head, with a neck. */
  const neck = new THREE.CylinderGeometry(head * 0.26, head * 0.3, head * 0.3, 10);
  neck.translate(0, torsoTop + head * 0.12, 0);
  parts.push(neck);
  const skull = new THREE.SphereGeometry(head * 0.48, 12, 10);
  skull.scale(0.88, 1.08, 0.9);
  skull.translate(0, torsoTop + head * 0.62, 0);
  parts.push(skull);

  /* Legs. In a walk the stride opens; standing, they are close. */
  const stride = pose === "walk" ? h * 0.11 : h * 0.035;
  for (const s of [-1, 1]) {
    const leg = new THREE.CylinderGeometry(shoulder * 0.15, shoulder * 0.12, torsoBot, 8);
    leg.translate(s * shoulder * 0.19, torsoBot / 2, pose === "walk" ? s * stride : 0);
    parts.push(leg);
  }

  /* Arms, hanging or one raised to lean. */
  for (const s of [-1, 1]) {
    const len = (torsoTop - torsoBot) * 0.86;
    const arm = new THREE.CylinderGeometry(shoulder * 0.11, shoulder * 0.09, len, 8);
    const drop = pose === "lean" && s > 0 ? 0.26 : 0;
    arm.rotateZ(s * (0.07 + drop));
    arm.translate(s * shoulder * 0.54, torsoTop - len / 2 - head * 0.1, 0);
    parts.push(arm);
  }

  const m = mergeAll(parts);
  parts.forEach((g) => g.dispose());
  m.computeVertexNormals();
  return m;
}

export interface Figure {
  /** x, z in floor-local metres. */
  at: [number, number];
  /** Facing, radians. */
  turn: number;
  height: number;
  pose: Pose;
  /** Which material: the house wears its own palette. */
  wear: "charcoal" | "black" | "stone" | "taupe";
}

/**
 * Lay out a believable crowd for a floor.
 *
 * Deterministic from a seed, so the same floor has the same people on
 * every load — a shop whose customers teleport between visits is worse
 * than an empty one. Figures avoid a radius around the atrium so nobody
 * stands in the stairwell, and they cluster slightly, because people in
 * shops stand in twos and threes rather than on a grid.
 */
export function crowd(
  seed: number,
  count: number,
  bounds: number,
  avoid: { at: [number, number]; r: number }[] = [],
): Figure[] {
  let st = (seed * 2654435761) >>> 0;
  const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
  const wears: Figure["wear"][] = ["charcoal", "black", "charcoal", "stone", "taupe", "black"];
  const out: Figure[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = (rnd() - 0.5) * bounds * 2;
    const z = (rnd() - 0.5) * bounds * 2;
    if (Math.hypot(x, z) > bounds) continue;
    if (avoid.some((a) => Math.hypot(x - a.at[0], z - a.at[1]) < a.r)) continue;
    // cluster: half of them stand near someone already placed
    if (out.length && rnd() > 0.55) {
      const near = out[Math.floor(rnd() * out.length)];
      const a = rnd() * Math.PI * 2;
      const d = 0.8 + rnd() * 0.9;
      const cx = near.at[0] + Math.cos(a) * d;
      const cz = near.at[1] + Math.sin(a) * d;
      if (Math.hypot(cx, cz) > bounds) continue;
      if (avoid.some((v) => Math.hypot(cx - v.at[0], cz - v.at[1]) < v.r)) continue;
      out.push({
        at: [cx, cz],
        // two people standing together face roughly toward each other
        turn: Math.atan2(near.at[0] - cx, near.at[1] - cz) + (rnd() - 0.5) * 0.7,
        height: 1.6 + rnd() * 0.26,
        pose: rnd() > 0.8 ? "lean" : "stand",
        wear: wears[Math.floor(rnd() * wears.length)],
      });
      continue;
    }
    out.push({
      at: [x, z],
      turn: rnd() * Math.PI * 2,
      height: rnd() > 0.88 ? 1.3 + rnd() * 0.12 : 1.6 + rnd() * 0.28,
      pose: rnd() > 0.7 ? "walk" : "stand",
      wear: wears[Math.floor(rnd() * wears.length)],
    });
  }
  return out;
}
