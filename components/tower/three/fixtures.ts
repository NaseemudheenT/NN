/**
 * NN TOWER — the furniture that repeats.
 *
 * Rails, pedestals, shelving and hanging garments appear on most of the
 * retail floors. Building them once here means a change to how a coat
 * hangs is one edit, and — more importantly — it means every floor shares
 * the same geometry object, so the renderer can batch them instead of
 * issuing a draw call per shirt.
 */

import * as THREE from "three";
import { mergeAll, metricUV } from "./geometry";

/**
 * A garment on a hanger.
 *
 * A box is a box. What makes cloth read as cloth at this distance is the
 * silhouette: shoulders wider than the hem for a jacket, a slight A-line
 * for a coat, and the hanger hook above it. Lathed from a profile so the
 * shoulder line is a curve rather than a corner.
 */
export function garmentGeometry(
  kind: "jacket" | "coat" | "shirt" | "trouser",
  height = 0.92,
): THREE.BufferGeometry {
  const profile: Record<string, [number, number][]> = {
    // [radius, t] from hem (t=0) to shoulder (t=1)
    jacket: [[0.17, 0], [0.175, 0.3], [0.185, 0.62], [0.2, 0.84], [0.16, 0.95], [0.05, 1]],
    coat: [[0.22, 0], [0.21, 0.34], [0.2, 0.66], [0.205, 0.86], [0.165, 0.96], [0.05, 1]],
    shirt: [[0.145, 0], [0.15, 0.36], [0.158, 0.68], [0.168, 0.87], [0.13, 0.96], [0.04, 1]],
    trouser: [[0.1, 0], [0.105, 0.4], [0.12, 0.78], [0.135, 0.94], [0.1, 1]],
  };
  const pts = profile[kind].map(([r, t]) => new THREE.Vector2(r, t * height));
  const g = new THREE.LatheGeometry(pts, 14);
  // flatten it: a garment on a rail is not a solid of revolution
  g.scale(1, 1, 0.42);
  g.computeVertexNormals();
  return g;
}

/** A run of rail with garments on it, merged into one buffer. */
export function railGeometry(length: number, count: number): THREE.BufferGeometry {
  const bar = new THREE.CylinderGeometry(0.022, 0.022, length, 10);
  bar.rotateZ(Math.PI / 2);
  bar.translate(0, 1.72, 0);
  const parts: THREE.BufferGeometry[] = [bar];
  for (const x of [-length / 2 + 0.05, length / 2 - 0.05]) {
    const post = new THREE.CylinderGeometry(0.03, 0.045, 1.74, 10);
    post.translate(x, 0.87, 0);
    parts.push(post);
    const foot = metricUV(new THREE.BoxGeometry(0.5, 0.03, 0.44), 0.5, 0.44);
    foot.translate(x, 0.015, 0);
    parts.push(foot);
  }
  void count;
  const m = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return m;
}

/** The garments that hang on that rail, as one merged mesh. */
export function hangingGeometry(
  length: number,
  count: number,
  kind: "jacket" | "coat" | "shirt" | "trouser",
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const pitch = (length - 0.3) / Math.max(count - 1, 1);
  const h = kind === "coat" ? 1.18 : kind === "trouser" ? 0.82 : 0.92;
  for (let i = 0; i < count; i++) {
    const g = garmentGeometry(kind, h);
    // Hems do not line up on a real rail. A few centimetres of variation is
    // the difference between a shop and a spreadsheet.
    const jitter = ((i * 37) % 7) * 0.012;
    g.rotateY(((i * 53) % 11) * 0.04);
    g.translate(-length / 2 + 0.15 + i * pitch, 1.66 - h + jitter, 0);
    parts.push(g);
  }
  const m = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return m;
}

/** A display pedestal: brushed base, glass case. */
export function pedestalGeometry(w: number, d: number, h: number): THREE.BufferGeometry {
  const base = metricUV(new THREE.BoxGeometry(w, h, d), w, h);
  base.translate(0, h / 2, 0);
  const top = metricUV(new THREE.BoxGeometry(w + 0.04, 0.03, d + 0.04), w, d);
  top.translate(0, h + 0.015, 0);
  const m = mergeAll([base, top]);
  base.dispose();
  top.dispose();
  return m;
}

/** Shelving: a stack of boards between two cheeks. */
export function shelvingGeometry(w: number, h: number, d: number, shelves: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const x of [-w / 2, w / 2]) {
    const cheek = metricUV(new THREE.BoxGeometry(0.04, h, d), 0.04, h);
    cheek.translate(x, h / 2, 0);
    parts.push(cheek);
  }
  for (let i = 0; i <= shelves; i++) {
    const y = (h / shelves) * i;
    const board = metricUV(new THREE.BoxGeometry(w, 0.035, d), w, d);
    board.translate(0, y, 0);
    parts.push(board);
  }
  const m = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  return m;
}

/**
 * A tailor's dress form on its stand.
 *
 * Lathed from a real block profile — bust, waist, hip — because a dress
 * form is the one object in a tailoring room whose proportions everyone
 * recognises instantly. Get the waist wrong and the whole floor reads as
 * a shop-window dummy rather than as a workroom.
 */
export function dressFormGeometry(height = 0.84): THREE.BufferGeometry {
  // radius against height, from hem to shoulder
  const prof: [number, number][] = [
    [0.21, 0.0], [0.225, 0.1], [0.215, 0.26],   // hip
    [0.17, 0.44],                                // waist
    [0.215, 0.62], [0.228, 0.74],                // chest
    [0.2, 0.88], [0.13, 0.97], [0.06, 1.0],      // shoulder, neck
  ];
  const body = new THREE.LatheGeometry(
    prof.map(([r, t]) => new THREE.Vector2(r, 0.72 + t * height)),
    20,
  );
  body.scale(1, 1, 0.78);
  const post = new THREE.CylinderGeometry(0.025, 0.025, 0.74, 10);
  post.translate(0, 0.37, 0);
  const foot = new THREE.CylinderGeometry(0.26, 0.3, 0.035, 18);
  foot.translate(0, 0.018, 0);
  const m = mergeAll([body, post, foot]);
  [body, post, foot].forEach((g) => g.dispose());
  m.computeVertexNormals();
  return m;
}

/** A bolt of cloth, rolled. */
export function clothBoltGeometry(length = 0.92, radius = 0.075): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, length, 14);
  g.rotateZ(Math.PI / 2);
  return g;
}

/** A simple side chair: seat, back, four legs. */
export function chairGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const seat = metricUV(new THREE.BoxGeometry(0.46, 0.055, 0.44), 0.46, 0.44);
  seat.translate(0, 0.45, 0);
  parts.push(seat);
  const back = metricUV(new THREE.BoxGeometry(0.44, 0.5, 0.045), 0.44, 0.5);
  back.translate(0, 0.72, -0.2);
  parts.push(back);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]] as const) {
    const leg = new THREE.CylinderGeometry(0.018, 0.022, 0.45, 8);
    leg.translate(x, 0.225, z);
    parts.push(leg);
  }
  const m = mergeAll(parts);
  parts.forEach((g) => g.dispose());
  return m;
}

/**
 * A run of books on a shelf.
 *
 * What makes a bookshelf read as a library rather than as a cabinet is
 * irregularity: spines of different heights and thicknesses, a few leaning,
 * and gaps where volumes have been taken out. A uniform row of identical
 * blocks reads as a texture of a bookshelf, which is exactly the thing that
 * gives a CG interior away.
 */
export function booksGeometry(length: number, height: number, seed = 1): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  let x = -length / 2 + 0.02;
  let st = seed >>> 0;
  const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
  while (x < length / 2 - 0.05) {
    if (rnd() > 0.93) { x += 0.05 + rnd() * 0.07; continue; } // a gap
    const w = 0.022 + rnd() * 0.034;
    const h = height * (0.62 + rnd() * 0.34);
    const d = 0.17 + rnd() * 0.07;
    const b = metricUV(new THREE.BoxGeometry(w, h, d), w, h);
    const lean = rnd() > 0.9 ? (rnd() - 0.5) * 0.22 : 0;
    b.translate(0, h / 2, 0);
    if (lean) b.rotateZ(lean);
    b.translate(x + w / 2, 0, 0);
    parts.push(b);
    x += w + 0.004;
  }
  const m = mergeAll(parts);
  parts.forEach((g) => g.dispose());
  return m;
}

/** A wingback armchair, roughed in: seat, back, wings, arms, legs. */
export function wingbackGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const seat = metricUV(new THREE.BoxGeometry(0.66, 0.16, 0.62), 0.66, 0.62);
  seat.translate(0, 0.42, 0);
  parts.push(seat);
  const back = metricUV(new THREE.BoxGeometry(0.66, 0.78, 0.14), 0.66, 0.78);
  back.translate(0, 0.78, -0.26);
  parts.push(back);
  for (const x of [-0.33, 0.33]) {
    const wing = metricUV(new THREE.BoxGeometry(0.11, 0.56, 0.4), 0.11, 0.56);
    wing.translate(x, 0.84, -0.12);
    parts.push(wing);
    const arm = metricUV(new THREE.BoxGeometry(0.13, 0.22, 0.6), 0.13, 0.6);
    arm.translate(x, 0.56, 0.02);
    parts.push(arm);
  }
  for (const [x, z] of [[-0.27, -0.24], [0.27, -0.24], [-0.27, 0.24], [0.27, 0.24]] as const) {
    const leg = new THREE.CylinderGeometry(0.025, 0.03, 0.34, 8);
    leg.translate(x, 0.17, z);
    parts.push(leg);
  }
  const m = mergeAll(parts);
  parts.forEach((g) => g.dispose());
  return m;
}
