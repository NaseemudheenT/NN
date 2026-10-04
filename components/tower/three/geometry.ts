/**
 * NN TOWER — the shapes.
 *
 * Pure geometry builders. No React, no materials, no state: give them
 * metres, they give back a BufferGeometry. Everything is memoised by the
 * components that call them, so each distinct shape is tessellated once for
 * the life of the page.
 *
 * ── a note on the coordinate frame ───────────────────────────────────
 * Plan shapes are authored in 2D and then laid flat with `rotation.x =
 * -PI/2`, which maps shape-Y onto world -Z. Rather than fight that with
 * flipped scales (which would invert every normal and break the lighting),
 * the plan is simply authored with its rotunda corner at shape (+HALF,
 * -HALF) so that it lands at world (+HALF, +HALF) — the corner facing the
 * default camera.
 */

import * as THREE from "three";
import { HALF, CHAMFER, WALL, SLAB, ATRIUM_R, ATRIUM_CENTRE, BAY_W, BAY_H } from "@/lib/tower/spec";

/* ── the chamfered corner ──────────────────────────────────────────── */

/**
 * The rotunda arc, solved rather than guessed.
 *
 * The corner bay has to pass through both chamfer points and bulge toward
 * the missing corner by a chosen sagitta. Given the chord and that sagitta,
 * the radius is forced: R = (c² + s²) / 2s. Eyeballing a radius here is what
 * produces a bay that either flattens into the facade or balloons past it.
 */
const SAGITTA = 2.25;

function solveRotunda() {
  const a = new THREE.Vector2(HALF, -HALF + CHAMFER);
  const b = new THREE.Vector2(HALF - CHAMFER, -HALF);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const half = a.distanceTo(b) / 2;
  const r = (half * half + SAGITTA * SAGITTA) / (2 * SAGITTA);
  // push the centre back from the chord, away from the corner
  const toCorner = new THREE.Vector2(HALF, -HALF).sub(mid).normalize();
  const centre = mid.clone().sub(toCorner.clone().multiplyScalar(r - SAGITTA));
  return {
    r,
    centre,
    start: Math.atan2(a.y - centre.y, a.x - centre.x),
    end: Math.atan2(b.y - centre.y, b.x - centre.x),
  };
}

export const ROTUNDA = solveRotunda();

/**
 * The footprint, optionally offset by `inset` (positive pulls in, negative
 * pushes out for a projecting band).
 *
 * Wound counter-clockwise. Winding is not cosmetic here: ExtrudeGeometry
 * derives its cap normals from it, and a clockwise outline gives a floor
 * plate that is lit from underneath.
 */
export function planShape(inset = 0): THREE.Shape {
  const h = HALF - inset;
  const c = CHAMFER;
  const r = Math.max(0.2, ROTUNDA.r - inset);
  const s = new THREE.Shape();
  // bottom edge, left to the start of the chamfer
  s.moveTo(-h, -h);
  s.lineTo(h - c, -h);
  // around the corner bay, counter-clockwise
  s.absarc(ROTUNDA.centre.x, ROTUNDA.centre.y, r, ROTUNDA.end, ROTUNDA.start, false);
  // up the right face, across the top, down the left
  s.lineTo(h, h);
  s.lineTo(-h, h);
  s.closePath();
  return s;
}

/* ── floor plates ──────────────────────────────────────────────────── */

/**
 * A floor slab, with the atrium punched through it when it has one.
 *
 * The street level is solid — the void starts at Level 1, which is how an
 * atrium works: you stand in the reception and look *up* into it.
 */
export function plateGeometry(atrium: boolean): THREE.BufferGeometry {
  const shape = planShape(0);
  if (atrium) {
    const hole = new THREE.Path();
    hole.absarc(ATRIUM_CENTRE[0], -ATRIUM_CENTRE[1], ATRIUM_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
    curveSegments: 36,
  });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/* ── openings ──────────────────────────────────────────────────────── */

/**
 * A round-headed window.
 *
 * The arch is a true semicircle of the opening's own half-width, springing
 * at `h - w/2`. That relationship is not stylistic — it is what makes a
 * round-headed opening look structural instead of like a rectangle with a
 * curve drawn on top, which is the single most common way computer-generated
 * classicism gives itself away.
 */
export function archShape(w: number, h: number): THREE.Path {
  const hw = w / 2;
  const spring = Math.max(hw * 0.2, h - hw);
  const p = new THREE.Path();
  p.moveTo(-hw, 0);
  p.lineTo(hw, 0);
  p.lineTo(hw, spring);
  p.absarc(0, spring, hw, 0, Math.PI, false);
  p.lineTo(-hw, 0);
  p.closePath();
  return p;
}

/**
 * A length of wall with its bays cut through it.
 *
 * Built as one extrusion with holes rather than as a lintel-and-pier
 * assembly, so the reveals are genuinely solid and the openings cast real
 * shadows into the room behind.
 */
export function wallGeometry(
  width: number,
  height: number,
  bays: number,
  opts: { sill?: number; thickness?: number } = {},
): THREE.BufferGeometry {
  const { sill = 0.9, thickness = WALL } = opts;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height);
  shape.lineTo(-width / 2, height);
  shape.closePath();

  if (bays > 0) {
    const pitch = width / bays;
    const w = pitch * BAY_W;
    const h = (height - sill) * BAY_H;
    for (let i = 0; i < bays; i++) {
      const cx = -width / 2 + pitch * (i + 0.5);
      const hole = archShape(w, h);
      // Path has no transform, so translate the points we just made.
      const moved = new THREE.Path();
      const pts = hole.getPoints(28);
      moved.moveTo(pts[0].x + cx, pts[0].y + sill);
      for (let k = 1; k < pts.length; k++) moved.lineTo(pts[k].x + cx, pts[k].y + sill);
      moved.closePath();
      shape.holes.push(moved);
    }
  }

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 20,
  });
  g.translate(0, 0, -thickness / 2);
  g.computeVertexNormals();
  return g;
}

/** The glass that fills a bay, as one flat pane per opening. */
export function glazingGeometry(
  width: number,
  height: number,
  bays: number,
  sill = 0.9,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const pitch = width / bays;
  const w = pitch * BAY_W;
  const h = (height - sill) * BAY_H;
  const hw = w / 2;
  const spring = Math.max(hw * 0.2, h - hw);
  for (let i = 0; i < bays; i++) {
    const cx = -width / 2 + pitch * (i + 0.5);
    const rect = new THREE.PlaneGeometry(w * 0.94, spring * 0.98);
    rect.translate(cx, sill + spring / 2, 0);
    parts.push(rect);
    const head = new THREE.CircleGeometry(hw * 0.94, 20, 0, Math.PI);
    head.translate(cx, sill + spring, 0);
    parts.push(head);
  }
  const merged = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/* ── the rotunda ───────────────────────────────────────────────────── */

/** The curved corner bay: a cylindrical band of glazing. */
export function rotundaGlassGeometry(height: number): THREE.BufferGeometry {
  const span = Math.abs(ROTUNDA.end - ROTUNDA.start);
  const g = new THREE.CylinderGeometry(
    ROTUNDA.r, ROTUNDA.r, height, 44, 1, true,
    ROTUNDA.start, -span,
  );
  g.translate(ROTUNDA.centre.x, height / 2, -ROTUNDA.centre.y);
  return g;
}

/** The slim mullions standing in front of it. */
export function rotundaMullionsGeometry(height: number, count: number): THREE.BufferGeometry {
  const span = Math.abs(ROTUNDA.end - ROTUNDA.start);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i <= count; i++) {
    const a = ROTUNDA.start - (span * i) / count;
    const x = ROTUNDA.centre.x + Math.cos(a) * ROTUNDA.r;
    const z = -(ROTUNDA.centre.y + Math.sin(a) * ROTUNDA.r);
    const bar = new THREE.BoxGeometry(0.12, height, 0.22);
    bar.translate(x, height / 2, z);
    parts.push(bar);
  }
  const merged = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/* ── the dome ──────────────────────────────────────────────────────── */

/** The glass cap over the rotunda, with its meridian ribs. */
export function domeGeometry(radius: number): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.46);
}

export function domeRibsGeometry(radius: number, meridians: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < meridians; i++) {
    const a = (i / meridians) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 12 }, (_, k) => {
        const phi = (k / 11) * Math.PI * 0.46;
        return new THREE.Vector3(
          Math.sin(phi) * Math.cos(a) * radius,
          Math.cos(phi) * radius,
          Math.sin(phi) * Math.sin(a) * radius,
        );
      }),
    );
    parts.push(new THREE.TubeGeometry(curve, 16, 0.055, 5, false));
  }
  // the ring the ribs land on
  const ring = new THREE.TorusGeometry(radius * 0.999, 0.07, 8, 56);
  ring.rotateX(Math.PI / 2);
  parts.push(ring);
  const merged = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/* ── classical mouldings ───────────────────────────────────────────── */

/**
 * A projecting band following the plan outline — cornice, string course,
 * or plinth depending on where it is put and how far it sticks out.
 *
 * Real buildings are articulated horizontally. A tower with nine flush
 * plates and no projecting course has no shadow line anywhere on it, and a
 * facade with no shadow line is why untextured architecture reads as a
 * cardboard model.
 */
export function bandGeometry(project: number, depth: number): THREE.BufferGeometry {
  const outer = planShape(-project);
  const inner = planShape(0.0);
  const pts = inner.getPoints(80).map((p) => new THREE.Vector2(p.x, p.y));
  const hole = new THREE.Path();
  hole.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) hole.lineTo(pts[i].x, pts[i].y);
  hole.closePath();
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: Math.min(0.08, depth * 0.4),
    bevelSize: Math.min(0.08, project * 0.5),
    bevelSegments: 2,
    curveSegments: 36,
  });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/* ── UV units ──────────────────────────────────────────────────────── */

/**
 * Rescale a geometry's UVs from 0–1 into metres.
 *
 * Three.js is inconsistent here and it bites every project exactly once:
 * ExtrudeGeometry writes UVs in WORLD UNITS, while BoxGeometry,
 * PlaneGeometry, CylinderGeometry and the rest write them 0–1 across each
 * face. A material's texture repeat therefore means "tiles per metre" on
 * one mesh and "tiles across the whole face" on the next — so the same
 * travertine that tiled correctly on a wall came out as four enormous
 * blobs across a forty-metre pavement.
 *
 * Rather than keeping two sets of repeat values and remembering which is
 * which, every primitive is converted to metres on creation. One
 * convention, one repeat value, every surface at the right scale.
 */
export function metricUV(g: THREE.BufferGeometry, sx: number, sy: number): THREE.BufferGeometry {
  const uv = g.getAttribute("uv");
  if (!uv) return g;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
  }
  uv.needsUpdate = true;
  return g;
}

/* ── merge helper ──────────────────────────────────────────────────── */

/**
 * Merge a batch of geometries into one buffer.
 *
 * Every separate mesh is a draw call, and a facade of five hundred
 * individually drawn mullions is how a scene like this ends up at fifteen
 * frames a second. Written out rather than pulled from three's examples so
 * there is no deep-import that Next has to transpile.
 */
export function mergeAll(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = list.map((g) => (g.index ? g.toNonIndexed() : g.clone()));
  const attrs = ["position", "normal", "uv"] as const;
  const total: Record<string, number> = {};
  for (const g of nonIndexed) {
    for (const a of attrs) {
      const at = g.getAttribute(a);
      if (at) total[a] = (total[a] ?? 0) + at.array.length;
    }
  }
  const out = new THREE.BufferGeometry();
  for (const a of attrs) {
    if (!total[a]) continue;
    const size = nonIndexed.find((g) => g.getAttribute(a))!.getAttribute(a).itemSize;
    const arr = new Float32Array(total[a]);
    let off = 0;
    for (const g of nonIndexed) {
      const at = g.getAttribute(a);
      if (!at) continue;
      arr.set(at.array as Float32Array, off);
      off += at.array.length;
    }
    out.setAttribute(a, new THREE.BufferAttribute(arr, size));
  }
  nonIndexed.forEach((g, i) => {
    if (g !== list[i]) g.dispose();
  });
  out.computeBoundingSphere();
  return out;
}
