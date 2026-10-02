"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { garmentShape, hangerGeometry, seeded } from "./geometry";
import { PLAN } from "./plan";
import { cloth, type Materials } from "./materials";

/**
 * Everything in the room that was carried in rather than built.
 *
 * Each piece earns its place by doing a job a clothing floor needs doing —
 * a rail holds stock, a plinth raises a look to eye level, a table is where
 * the folded pieces go, a chair is where someone waits. Nothing is here to
 * fill space. The one exception is the olive trees, and they are the
 * exception on purpose: they are the only things in the hall that nobody
 * manufactured, and a room of nothing but manufactured objects reads as a
 * rendering rather than as a place.
 */

/** A rail: two uprights, a tube across, and the stock hanging off it. */
function Rail({
  x,
  z,
  length,
  colours,
  m,
}: {
  x: number;
  z: number;
  length: number;
  colours: string[];
  m: Materials;
}) {
  const bar = 1.72; // hanging height — a shoulder's reach
  const coat = useMemo(() => garmentShape(1.16, 0.52, 0.6), []);
  const shirt = useMemo(() => garmentShape(0.8, 0.46, 0.5), []);
  const hanger = useMemo(() => hangerGeometry(0.52), []);

  /* Spacing is deterministic: the same hall every time it opens. A rail
     whose stock shuffles on reload stops being a place you remember. */
  const pieces = useMemo(() => {
    const rnd = seeded(Math.round((x + 10) * 1000 + (z + 30)));
    const n = Math.max(4, Math.floor(length / 0.17));
    return Array.from({ length: n }, (_, i) => ({
      z: -length / 2 + 0.12 + (i * (length - 0.24)) / (n - 1),
      colour: colours[i % colours.length],
      long: rnd() > 0.55,
      yaw: (rnd() - 0.5) * 0.14,
      tilt: (rnd() - 0.5) * 0.05,
    }));
  }, [x, z, length, colours]);

  return (
    <group position={[x, 0, z]}>
      {[-length / 2, length / 2].map((dz) => (
        <group key={dz} position={[0, 0, dz]}>
          <mesh position={[0, bar / 2 + 0.06, 0]} material={m.blackMetal} castShadow>
            <cylinderGeometry args={[0.028, 0.034, bar + 0.12, 12]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} material={m.blackMetal} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.24, 0.04, 20]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, bar + 0.12, 0]} rotation-x={Math.PI / 2} material={m.steel} castShadow>
        <cylinderGeometry args={[0.022, 0.022, length, 14]} />
      </mesh>

      {pieces.map((p, i) => (
        <group key={i} position={[0, bar + 0.1, p.z]} rotation-y={p.yaw} rotation-z={p.tilt}>
          <mesh geometry={hanger} material={m.steel} />
          <mesh
            geometry={p.long ? coat : shirt}
            position={[0, -0.03, 0]}
            material={cloth(p.colour)}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  );
}

/**
 * An olive tree.
 *
 * Built from a seed so it is the same tree on every visit, and swayed by a
 * two-frequency sine rather than one — a single frequency reads as a metronome,
 * and nothing alive moves on a metronome. The sway is skipped entirely when
 * the visitor has asked for reduced motion; the tree is still there, it is
 * simply still.
 */
function Tree({
  x,
  z,
  scale,
  seed,
  m,
  still,
}: {
  x: number;
  z: number;
  scale: number;
  seed: number;
  m: Materials;
  still: boolean;
}) {
  const crown = useRef<THREE.Group>(null);

  const blobs = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: 9 }, () => ({
      p: [(rnd() - 0.5) * 1.5, 1.55 + rnd() * 1.25, (rnd() - 0.5) * 1.5] as [number, number, number],
      r: 0.38 + rnd() * 0.34,
    }));
  }, [seed]);

  useFrame(({ clock }) => {
    if (still || !crown.current) return;
    const t = clock.elapsedTime + seed;
    crown.current.rotation.z = Math.sin(t * 0.34) * 0.016 + Math.sin(t * 0.81) * 0.007;
    crown.current.rotation.x = Math.cos(t * 0.27) * 0.012;
  });

  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.3, 0]} material={m.planter} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 1.2]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={m.trunk}>
        <boxGeometry args={[1.06, 0.06, 1.06]} />
      </mesh>
      <group ref={crown}>
        <mesh position={[0, 1.05, 0]} material={m.trunk} castShadow>
          <cylinderGeometry args={[0.085, 0.13, 1.0, 7]} />
        </mesh>
        {blobs.map((b, i) => (
          <mesh key={i} position={b.p} material={m.foliage} castShadow>
            <icosahedronGeometry args={[b.r, 1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A mannequin on its plinth. Abstract on purpose — a face would be a face. */
function Mannequin({ x, z, rotation, m }: { x: number; z: number; rotation: number; m: Materials }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position={[0, 0.09, 0]} material={m.stone} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.5, 0.18, 32]} />
      </mesh>
      <mesh position={[0, 0.52, 0]} material={m.blackMetal} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.7, 10]} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.24, 0]} material={m.plaster} castShadow receiveShadow>
        <capsuleGeometry args={[0.2, 0.52, 6, 16]} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 1.5, 0]} rotation-z={Math.PI / 2} material={m.plaster} castShadow>
        <capsuleGeometry args={[0.095, 0.34, 4, 12]} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 1.66, 0]} material={m.plaster} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.17, 12]} />
      </mesh>
    </group>
  );
}

export function Fixtures({
  m,
  colours,
  still,
  quality,
}: {
  m: Materials;
  colours: string[];
  still: boolean;
  quality: "high" | "low";
}) {
  const t = PLAN.table;

  return (
    <group>
      {PLAN.rails.map((r) => (
        <Rail key={`${r.x}-${r.z}`} x={r.x} z={r.z} length={r.length} colours={colours} m={m} />
      ))}

      {PLAN.trees.map((tr) => (
        <Tree key={`${tr.x}-${tr.z}`} {...tr} m={m} still={still} />
      ))}

      {PLAN.mannequins.map((mn) => (
        <Mannequin key={`${mn.x}-${mn.z}`} {...mn} m={m} />
      ))}

      {/* the presentation table, on the dais under the great window */}
      <group position={[t.x, 0.2, t.z]}>
        <mesh position={[0, t.height, 0]} material={m.walnut} castShadow receiveShadow>
          <boxGeometry args={[t.width, 0.07, t.depth]} />
        </mesh>
        {[
          [-1, -1], [1, -1], [-1, 1], [1, 1],
        ].map(([sx, sz]) => (
          <mesh
            key={`${sx}${sz}`}
            position={[(sx * (t.width - 0.22)) / 2, t.height / 2, (sz * (t.depth - 0.22)) / 2]}
            material={m.blackMetal}
            castShadow
          >
            <boxGeometry args={[0.055, t.height, 0.055]} />
          </mesh>
        ))}
        {/* folded stock on the table */}
        {quality === "high" &&
          colours.slice(0, 3).map((c, i) => (
            <mesh
              key={c + i}
              position={[-0.72 + i * 0.72, t.height + 0.08, 0]}
              material={cloth(c)}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.46, 0.1, 0.36]} />
            </mesh>
          ))}
      </group>

      {/* chairs, off the walking line */}
      {PLAN.chairs.map((c) => (
        <group key={`${c.x}-${c.z}`} position={[c.x, 0, c.z]} rotation-y={c.rotation}>
          <mesh position={[0, 0.42, 0]} material={m.leather} castShadow receiveShadow>
            <boxGeometry args={[0.78, 0.18, 0.74]} />
          </mesh>
          <mesh position={[0, 0.74, -0.32]} material={m.leather} castShadow>
            <boxGeometry args={[0.78, 0.66, 0.12]} />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
            <mesh
              key={`${sx}${sz}`}
              position={[sx * 0.33, 0.165, sz * 0.3]}
              material={m.blackMetal}
              castShadow
            >
              <cylinderGeometry args={[0.022, 0.022, 0.33, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the NN mark, engraved into the end wall above the dais */}
      <mesh position={[0, 0.28, PLAN.endWall.z + 3.3]} rotation-x={-Math.PI / 2} material={m.stone} receiveShadow>
        <planeGeometry args={[7, 0.02]} />
      </mesh>
    </group>
  );
}
