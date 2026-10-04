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
