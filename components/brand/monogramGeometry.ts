/**
 * The interlocked NN, as extruded geometry.
 *
 * One builder for every 3D use: the brass inlay in the floor, the backlit wall
 * sign, the woven back-neck label, and the logo on the hero. They are the same
 * letterform at different sizes, so they are the same geometry at different
 * scales — a change to the mark changes all of them at once.
 */

import * as THREE from "three";
import { N_HEIGHT, N_INTERLOCK_X, N_OUTLINE, N_WIDTH } from "./monogram";

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

/**
 * A single extruded N.
 *
 * One letter per geometry, deliberately. The two Ns of the monogram overlap,
 * and handing overlapping shapes to a single ExtrudeGeometry makes the
 * triangulator fold the shared region into a mess. Two meshes at slightly
 * different depths give a clean interlock and cost nothing.
 */
export function buildLetterGeometry({
  heightMeters,
  depth = heightMeters * 0.06,
  bevel = 0.12,
  center = true,
}: MonogramGeometryOptions): THREE.ExtrudeGeometry {
  const scale = heightMeters / N_HEIGHT;

  const shape = new THREE.Shape();
  N_OUTLINE.forEach(([x, y], i) => {
    const px = x * scale;
    // The outline is authored y-down, the way SVG is; flip it for world space.
    const py = (N_HEIGHT - y) * scale;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();

  const bevelSize = depth * bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 2,
    curveSegments: 4,
  });

  if (center) {
    // Centre on the PAIR, not on this letter, so two meshes built from this
    // geometry sit symmetrically about the origin.
    geometry.translate(
      -((N_INTERLOCK_X + N_WIDTH) / 2) * scale,
      -(N_HEIGHT / 2) * scale,
      -depth / 2,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Horizontal gap between the two letters, in metres, for a given height. */
export const letterOffsetFor = (heightMeters: number) =>
  (N_INTERLOCK_X / N_HEIGHT) * heightMeters;

/** Width of the monogram for a given height, so callers can lay it out. */
export const monogramWidthFor = (heightMeters: number) =>
  ((N_INTERLOCK_X + N_WIDTH) / N_HEIGHT) * heightMeters;
