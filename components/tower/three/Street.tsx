"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Instance, Instances } from "@react-three/drei";
import { HALF, PARAPET } from "@/lib/tower/spec";
import { material, lit } from "./materials";
import { mergeAll, metricUV } from "./geometry";

/**
 * NN TOWER — the block it stands on.
 *
 * A building photographed against black is a model of a building. What makes
 * a tower read as *built* is the ordinary stuff around it: a kerb, a
 * pavement with a joint pattern, street lamps at a believable spacing, trees
 * at a believable height, and neighbours that are plainly lower and duller.
 *
 * ── the neighbours are deliberately boring ───────────────────────────
 * They are untextured dark masses with a scattering of lit windows and no
 * detail at all. That is not laziness — it is the trick. Context buildings
 * exist to give NN Tower something to be *better* than and to stop the sky
 * meeting the pavement. Model them properly and they compete with the
 * flagship for attention while costing a hundred thousand triangles.
 */

const BLOCKS: { x: number; z: number; w: number; d: number; h: number }[] = [
  { x: -46, z: 10, w: 26, d: 30, h: 26 },
  { x: -40, z: -34, w: 30, d: 24, h: 31 },
  { x: 8, z: -52, w: 34, d: 22, h: 22 },
  { x: 54, z: -28, w: 26, d: 34, h: 28 },
  { x: 58, z: 26, w: 22, d: 26, h: 19 },
  { x: 16, z: 58, w: 38, d: 22, h: 24 },
  { x: -34, z: 56, w: 26, d: 24, h: 17 },
  { x: -72, z: -8, w: 24, d: 40, h: 34 },
];

/** Lamp posts, at the spacing a real street uses. */
const LAMPS: [number, number][] = [
  [HALF + 9, HALF + 9], [HALF + 10, -6], [HALF + 10, -24],
  [-6, HALF + 10], [-24, HALF + 10], [-HALF - 10, 8], [-HALF - 10, -14],
];

const TREES: [number, number][] = [
  [HALF + 7, HALF + 16], [HALF + 16, HALF + 7], [HALF + 8, -2], [HALF + 8, -16],
  [-2, HALF + 8], [-16, HALF + 8], [-HALF - 8, 2], [-HALF - 8, -18],
  [-HALF - 8, 20], [HALF + 8, 18],
];

export function Street() {
  /* The pavement: a raised slab around the building with a kerb, because the
     single clearest signal that a building is sitting on a street rather
     than floating is the step up to its threshold. */
  const pavement = useMemo(() => {
    const w = HALF * 2 + 18;
    const g = new THREE.BoxGeometry(w, 0.18, w);
    metricUV(g, w, w);
    g.translate(0, -1.03, 0);
    return g;
  }, []);

  const kerb = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const r = HALF + 9;
    for (const [w, d, x, z] of [
      [r * 2, 0.5, 0, r], [r * 2, 0.5, 0, -r],
    ] as const) {
      const b = metricUV(new THREE.BoxGeometry(w, 0.3, d), w, 0.3);
      b.translate(x, -1.0, z);
      parts.push(b);
    }
    for (const [w, d, x, z] of [
      [0.5, r * 2, r, 0], [0.5, r * 2, -r, 0],
    ] as const) {
      const b = metricUV(new THREE.BoxGeometry(w, 0.3, d), d, 0.3);
      b.translate(x, -1.0, z);
      parts.push(b);
    }
    const m = mergeAll(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);

  /* Neighbouring blocks with their lit windows baked in as one emissive
     mesh — eight buildings and a few hundred windows in two draw calls. */
  const { shells, windows } = useMemo(() => {
    const shellParts: THREE.BufferGeometry[] = [];
    const winParts: THREE.BufferGeometry[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const b of BLOCKS) {
      const box = metricUV(new THREE.BoxGeometry(b.w, b.h, b.d), b.w, b.h);
      box.translate(b.x, b.h / 2 - 1, b.z);
      shellParts.push(box);
      const cols = Math.floor(b.w / 3.2);
      const rows = Math.floor(b.h / 3.6);
      for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rnd() > 0.42) continue; // most windows are dark; cities are
          const pane = new THREE.PlaneGeometry(1.1, 1.5);
          const px = b.x - b.w / 2 + (c + 0.5) * (b.w / cols);
          const py = r * 3.6 - 1;
          // put it on whichever face points roughly at the tower
          if (b.z > 0) { pane.translate(px, py, b.z - b.d / 2 - 0.05); pane.rotateY(Math.PI); }
          else pane.translate(px, py, b.z + b.d / 2 + 0.05);
          winParts.push(pane);
        }
      }
    }
    const s = mergeAll(shellParts);
    const w = mergeAll(winParts);
    shellParts.forEach((p) => p.dispose());
    winParts.forEach((p) => p.dispose());
    return { shells: s, windows: w };
  }, []);

  const lampPost = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 5.2, 8), []);
  const canopy = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.1, 0.17, 2.6, 7), []);

  return (
    <group>
      {/* pavement and kerb */}
      <mesh geometry={pavement} material={material("travertine")} receiveShadow />
      <mesh geometry={kerb} material={material("basalt")} receiveShadow castShadow />

      {/* The city behind. Dark, but not invisible: at #15161a these read as
          nothing at all and their lit windows floated in a black void with
          no building behind them. A city at dusk is grey-blue, not black. */}
      <mesh geometry={shells} castShadow receiveShadow>
        <meshStandardMaterial
          color={new THREE.Color("#2c2f36").convertSRGBToLinear()}
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>
      <mesh geometry={windows} material={lit(3100, 0.46)} />

      {/* street lamps — the pools of light on wet stone are most of the mood */}
      <Instances geometry={lampPost} material={material("steel")} limit={24}>
        {LAMPS.map(([x, z], i) => (
          <Instance key={i} position={[x, 1.6, z]} />
        ))}
      </Instances>
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 4.3, z]}>
          <mesh material={lit(2400, 1.9)}>
            <sphereGeometry args={[0.22, 12, 10]} />
          </mesh>
          <pointLight intensity={16} distance={16} decay={2} color="#ffcf96" />
        </group>
      ))}

      {/* street trees */}
      <Instances geometry={trunk} material={material("walnut")} limit={32}>
        {TREES.map(([x, z], i) => (
          <Instance key={i} position={[x, 0.4, z]} />
        ))}
      </Instances>
      {/* Foliage is not a dark green ball. It is thousands of small leaves
          scattering light, so it reads much lighter than its own pigment and
          picks up whatever is lighting the street. */}
      <Instances geometry={canopy} limit={32}>
        <meshStandardMaterial
          color={new THREE.Color("#4a5c38").convertSRGBToLinear()}
          roughness={0.95}
          flatShading
        />
        {TREES.map(([x, z], i) => (
          <Instance
            key={i}
            position={[x, 2.9 + (i % 3) * 0.22, z]}
            scale={[1.5 + (i % 4) * 0.12, 1.75, 1.5 + (i % 3) * 0.14]}
          />
        ))}
      </Instances>

      {/* the house name, lit above the entrance arch */}
      <mesh position={[HALF - 2.2, 5.6, HALF - 2.2]} rotation={[0, Math.PI / 4, 0]} material={lit(2800, 1.5)}>
        <planeGeometry args={[2.1, 0.5]} />
      </mesh>

      {/* a soft wash on the facade from below, the way a real building is
          uplit at night */}
      <spotLight
        position={[HALF + 16, 2, HALF + 16]}
        target-position={[0, PARAPET * 0.5, 0]}
        angle={0.55}
        penumbra={0.9}
        intensity={420}
        distance={90}
        decay={2}
        color="#ffe2bb"
      />
    </group>
  );
}
