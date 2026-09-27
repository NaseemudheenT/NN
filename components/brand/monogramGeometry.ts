/**
 * The interlocked NN, as extruded geometry.
 *
 * One builder for every 3D use: the brass inlay in the floor, the backlit wall
 * sign, the woven back-neck label, and the logo on the hero. They are the same
 * letterform at different sizes, so they are the same geometry at different
 * scales — a change to the mark changes all of them at once.
 */

import * as THREE from "three";
import { N_HEIGHT, N_INTERLOCK_X, N_OUTLINE } from "./monogram";

export interface MonogramGeometryOptions {
  /** Finished height of the letterform, in metres. */
  heightMeters: number;
  /** Extrusion depth, in metres. */
  depth?: number;
  /** Bevel size as a fraction of the depth. 0 disables the bevel. */
  bevel?: number;
  /** Centre the geometry on its bounding box. */
  center?: boolean;
}

export function buildMonogramGeometry({
  heightMeters,
  depth = heightMeters * 0.06,
  bevel = 0.12,
  center = true,
}: MonogramGeometryOptions): THREE.ExtrudeGeometry {
  const scale = heightMeters / N_HEIGHT;

  const shapes = [0, N_INTERLOCK_X].map((offsetX) => {
    const shape = new THREE.Shape();
    N_OUTLINE.forEach(([x, y], i) => {
      const px = (x + offsetX) * scale;
      // The outline is authored y-down, the way SVG is; flip it for world space.
      const py = (N_HEIGHT - y) * scale;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    });
    shape.closePath();
    return shape;
  });

  const bevelSize = depth * bevel;
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 2,
    curveSegments: 4,
  });

  if (center) geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/** Width of the monogram for a given height, so callers can lay it out. */
export const monogramWidthFor = (heightMeters: number) =>
  ((N_INTERLOCK_X + 84) / N_HEIGHT) * heightMeters;
