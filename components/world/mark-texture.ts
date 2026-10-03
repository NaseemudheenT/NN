import * as THREE from "three";
import { MARK_PATH } from "@/components/brand/Monogram";

/**
 * The NN mark, as a texture.
 *
 * The monogram is already geometry — one path, defined once, used by the
 * logo, the favicon and the share card. This turns that same path into a
 * texture so the mark on a neck label in the showroom is literally the same
 * letterform as the mark in the header. Nothing is redrawn by hand, so
 * nothing can drift.
 *
 * Cached: a rail of twelve shirts shares one texture.
 */
const cache = new Map<string, THREE.CanvasTexture>();

export function markTexture(ink = "#f7f5ef", ground = "#0a0a0a"): THREE.CanvasTexture {
  const key = `${ink}|${ground}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, size, size);

  /* The path is authored in a -12 -6 222 176 viewBox; fit it to the square
     with a margin so the serifs are not clipped by the label's edge. */
  const scale = (size * 0.74) / 222;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-99, -82);
  ctx.fillStyle = ink;
  ctx.fill(new Path2D(MARK_PATH));
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}
