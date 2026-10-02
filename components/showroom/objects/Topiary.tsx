"use client";

/**
 * Olive topiary in stone planters.
 *
 * The reference photograph has them flanking the floor and the room did not,
 * which is a bigger absence than it sounds. Every other object in here is
 * rectilinear and man-made — masonry, rails, a table, a mirror — and a room
 * built entirely of straight lines reads as a model however well it is lit. A
 * plant is the only thing in a showroom that was not manufactured, and the eye
 * uses it to calibrate everything else.
 *
 * ── the motion, which is the part worth getting right ────────────────
 * The Founder asked for correct animation "even for plants", and the correct
 * animation for an indoor plant is very nearly none. There is no wind in a
 * showroom. What actually moves foliage indoors is the building's own air —
 * convection off warm lamps, the draught when a door opens — and it moves it
 * at a scale of a degree or two over several seconds, not the metronomic
 * swaying a game applies to vegetation.
 *
 * So the sway here is:
 *   · about 1.1° at the crown, which is at the threshold of perception,
 *   · driven by two incommensurable periods (7.3 s and 11.9 s) so it never
 *     repeats visibly — a single sine is the thing that makes CG foliage look
 *     like CG foliage,
 *   · scaled by height, because a planter does not move and a leaf does, and
 *   · stopped completely under reduced motion.
 *
 * ── and the leaves are instanced ─────────────────────────────────────
 * Two hundred leaves per plant drawn individually would be four hundred draw
 * calls for decoration. They are one instanced mesh each, placed on a
 * Fibonacci sphere so the canopy is evenly dense without looking patterned,
 * and the sway is applied to the whole crown rather than per leaf — which is
 * also what really happens, since a branch moves and its leaves go with it.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MATERIALS } from "../materials";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";

/** Where the planters stand, chosen to frame without blocking a sightline. */
export const PLANTERS: readonly [number, number][] = [
  // flanking the entrance, inside the portal
  [-4.6, -2.5],
  [-4.6, 2.5],
  // at the far corners of the floor, reading against the arcade
  [4.9, -3.1],
];

/** Leaves per crown. Enough to read as foliage, few enough to be free. */
const LEAVES = 190;

/**
 * Olive, muted far toward the board's Stone.
 *
 * Real olive foliage is grey-green rather than green — the underside of the
 * leaf is nearly silver — and that is precisely why it belongs in this room:
 * a saturated green would be the only pure hue in a palette of earth tones
 * and would pull the eye off the clothes, which is the one thing nothing in
 * here is allowed to do.
 */
const LEAF_TOP = "#6f7d63";
const LEAF_UNDER = "#97a08b";

function Plant({
  x,
  z,
  seed,
  reducedMotion,
}: {
  x: number;
  z: number;
  seed: number;
  reducedMotion: boolean;
}) {
  const crown = useRef<THREE.Group>(null);

  /* The canopy, placed once. A Fibonacci sphere gives an even distribution
     with no visible lattice — a random scatter clumps, and a lat/long grid
     reads as a globe. */
  const leaves = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.075, 0.034);
    const matrices: THREE.Matrix4[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    for (let i = 0; i < LEAVES; i += 1) {
      const y = 1 - (i / (LEAVES - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * golden + seed;

      /* An olive is pruned to a ball, but a real one is never a perfect
         one — the radius wobbles so the silhouette has some life in it. */
      const wobble = 0.86 + 0.14 * Math.sin(theta * 3.1 + y * 5.0);
      const radius = 0.3 * wobble;

      p.set(Math.cos(theta) * r * radius, y * radius * 0.92, Math.sin(theta) * r * radius);

      // Each leaf faces outward, with a random twist about its own stem.
      e.set(
        Math.sin(theta * 1.7) * 0.9,
        Math.atan2(p.x, p.z),
        Math.cos(theta * 2.3) * 0.8,
      );
      q.setFromEuler(e);
      // Leaves nearer the outside of the crown are a little larger.
      const scale = 0.72 + 0.4 * r;
      s.set(scale, scale, scale);
      m.compose(p, q, s);
      matrices.push(m.clone());
    }
    return { geometry, matrices };
  }, [seed]);

  const mesh = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: LEAF_TOP,
      roughness: 0.78,
      metalness: 0,
      /* Leaves are thin and light passes through them. Without transmission
         a canopy reads as a ball of painted card; with it, the leaves facing
         away from the lamp still glow slightly, which is most of what makes
         foliage look alive. */
      transmission: 0.22,
      thickness: 0.02,
      side: THREE.DoubleSide,
      sheen: 0.4,
      sheenColor: new THREE.Color(LEAF_UNDER),
    });
    const instanced = new THREE.InstancedMesh(leaves.geometry, material, LEAVES);
    leaves.matrices.forEach((m, i) => instanced.setMatrixAt(i, m));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    return instanced;
  }, [leaves]);

  useFrame((state) => {
    if (!crown.current || reducedMotion) return;
    const t = state.clock.elapsedTime + seed;
    /* Two incommensurable periods, so the pattern never visibly repeats.
       7.3 and 11.9 share no common factor at any length anyone watches. */
    crown.current.rotation.z = Math.sin(t / 7.3) * 0.019;
    crown.current.rotation.x = Math.sin(t / 11.9 + 1.4) * 0.013;
  });

  return (
    <group position={[x, 0, z]}>
      {/* the planter: a tapered stone tub, bullnosed at the rim */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.21, 0.17, 0.34, 24]} />
        <meshPhysicalMaterial
          color={MATERIALS.travertine.colour}
          roughness={MATERIALS.travertine.roughness}
          metalness={0}
        />
      </mesh>
      <mesh position={[0, 0.345, 0]} castShadow>
        <torusGeometry args={[0.208, 0.016, 8, 28]} />
        <meshPhysicalMaterial
          color={MATERIALS.travertine.colour}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      {/* the soil, just below the rim */}
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#2a241d" roughness={1} />
      </mesh>

      {/* The trunk. Olive trunks are not straight, and a straight cylinder
          is the giveaway — two slightly offset segments read as grown. */}
      <mesh position={[0, 0.52, 0]} rotation={[0, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.027, 0.034, 0.36, 10]} />
        <meshPhysicalMaterial color="#5a4b3c" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0.012, 0.84, 0.006]} rotation={[0.03, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.022, 0.027, 0.3, 10]} />
        <meshPhysicalMaterial color="#5a4b3c" roughness={0.88} metalness={0} />
      </mesh>

      {/* the crown, which is the only part that moves */}
      <group ref={crown} position={[0, 0.99, 0]}>
        <primitive object={mesh} />
      </group>
    </group>
  );
}

export function Topiary({ quality }: { quality: "low" | "medium" | "high" }) {
  /* Read here rather than passed in. The sway is this component's own
     business, and a boolean threaded down from the Scene is a boolean that
     can be threaded down wrong — which it was, on the first attempt. */
  const reducedMotion = usePrefersReducedMotion();

  // Three instanced canopies is cheap, but on a phone every draw counts and
  // a plant is the most skippable thing in a shop.
  const plants = quality === "low" ? PLANTERS.slice(0, 1) : PLANTERS;

  return (
    <group>
      {plants.map(([x, z], i) => (
        <Plant key={`${x}:${z}`} x={x} z={z} seed={i * 2.4} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
