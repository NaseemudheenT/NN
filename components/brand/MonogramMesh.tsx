"use client";

/**
 * The interlocked NN, as two meshes.
 *
 * Used by the brass inlay in the floor, the backlit wall sign, the woven label
 * and the hero logo — one letterform, one builder, four places. The second N
 * sits a little further back so the overlap resolves as one plate in front of
 * another, which is what "interlocked" actually looks like.
 */

import { useMemo } from "react";
import type * as THREE from "three";
import { buildLetterGeometry, letterOffsetFor } from "./monogramGeometry";
import { N_INTERLOCK_Z } from "./monogram";

export function MonogramMesh({
  height,
  depth,
  bevel = 0.12,
  material,
  backMaterial,
  castShadow = false,
}: {
  /** Height of the letterform, metres. */
  height: number;
  depth: number;
  bevel?: number;
  material: THREE.Material;
  /** Optional distinct material for the N behind. */
  backMaterial?: THREE.Material;
  castShadow?: boolean;
}) {
  const geometry = useMemo(
    () => buildLetterGeometry({ heightMeters: height, depth, bevel }),
    [height, depth, bevel],
  );
  const offset = letterOffsetFor(height);
  const z = depth * N_INTERLOCK_Z;

  return (
    <group>
      {/* the N behind */}
      <mesh
        geometry={geometry}
        material={backMaterial ?? material}
        position={[offset, 0, -z]}
        castShadow={castShadow}
      />
      {/* the N in front */}
      <mesh geometry={geometry} material={material} position={[0, 0, z]} castShadow={castShadow} />
    </group>
  );
}
