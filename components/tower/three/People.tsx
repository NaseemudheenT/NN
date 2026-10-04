"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { material } from "./materials";
import { figureGeometry, crowd, type Figure } from "./crowd";
import { ATRIUM_CENTRE, ATRIUM_R } from "@/lib/tower/spec";

/**
 * The people on a floor, as four instanced batches.
 *
 * ── why instancing matters here specifically ─────────────────────────
 * Thirty-odd figures across nine floors is three hundred draw calls if
 * each is its own mesh, and draw calls are the thing that actually caps
 * frame rate on a tablet — not triangles. Grouping by what they are
 * wearing gives four InstancedMeshes per floor, whatever the crowd size.
 *
 * Heights vary per person, so each instance carries its own matrix rather
 * than sharing one scale. That is the whole reason they read as a crowd
 * and not as a row of clones.
 */

const WEAR_MATERIAL: Record<Figure["wear"], string> = {
  charcoal: "basalt",
  black: "steel",
  stone: "linen",
  taupe: "leather",
};

export function People({
  seed,
  count,
  bounds,
  y = 0,
  avoidAtrium = true,
  extraAvoid = [],
}: {
  seed: number;
  count: number;
  /** Radius of the usable floor, in metres. */
  bounds: number;
  y?: number;
  avoidAtrium?: boolean;
  extraAvoid?: { at: [number, number]; r: number }[];
}) {
  const figures = useMemo(() => {
    const avoid = [...extraAvoid];
    if (avoidAtrium) avoid.push({ at: [ATRIUM_CENTRE[0], ATRIUM_CENTRE[1]], r: ATRIUM_R + 0.8 });
    return crowd(seed, count, bounds, avoid);
  }, [seed, count, bounds, avoidAtrium, extraAvoid]);

  /* One geometry per pose at a nominal height; per-instance scale does the
     rest, so three lathes serve any number of people. */
  const geos = useMemo(
    () => ({
      stand: figureGeometry(1.76, "stand"),
      walk: figureGeometry(1.76, "walk"),
      lean: figureGeometry(1.76, "lean"),
    }),
    [],
  );

  /* Group by (wear, pose) so each batch shares a geometry AND a material. */
  const batches = useMemo(() => {
    const map = new Map<string, { wear: Figure["wear"]; pose: Figure["pose"]; items: Figure[] }>();
    for (const f of figures) {
      const k = `${f.wear}:${f.pose}`;
      if (!map.has(k)) map.set(k, { wear: f.wear, pose: f.pose, items: [] });
      map.get(k)!.items.push(f);
    }
    return [...map.values()];
  }, [figures]);

  return (
    <group position={[0, y, 0]}>
      {batches.map((b, i) => (
        <Batch key={i} batch={b} geo={geos[b.pose]} />
      ))}
    </group>
  );
}

function Batch({
  batch,
  geo,
}: {
  batch: { wear: Figure["wear"]; pose: Figure["pose"]; items: Figure[] };
  geo: THREE.BufferGeometry;
}) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, material(WEAR_MATERIAL[batch.wear]), batch.items.length);
    const o = new THREE.Object3D();
    batch.items.forEach((f, i) => {
      o.position.set(f.at[0], 0, f.at[1]);
      o.rotation.set(0, f.turn, 0);
      const s = f.height / 1.76;
      o.scale.set(s, s, s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = true;
    return m;
  }, [batch, geo]);

  return <primitive object={mesh} />;
}
