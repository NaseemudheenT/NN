"use client";

/**
 * The floor: matte microcement, running into dark walnut chevron.
 *
 * Two floors in one room, which is how a Mediterranean house tells you where
 * to walk and where to stay. The circulation is seamless microcement — pale,
 * warm, almost without specular. The couture lounges are laid in dark walnut
 * chevron, and the change underfoot is the only instruction a visitor needs
 * about which part of the room is for standing in.
 *
 * ── matte, and why that is harder than polished ───────────────────────
 * The old floor was polished Nero Marquina with a live reflection in it,
 * which is the cheapest way to make a render look expensive: the whole room
 * appears twice. Matte microcement does not have that, so it has to earn its
 * quality a harder way — a faint sheen at grazing angles only, and an honest
 * reaction to the tight beams overhead. The reflector is kept but the mix is
 * dropped to a fraction of what it was, because sealed microcement does hold
 * a slight bloom of the light above it, and dropping the reflection entirely
 * makes the floor read as paper.
 *
 * ── the chevron ───────────────────────────────────────────────────────
 * A chevron is not a herringbone. Herringbone is rectangular blocks meeting
 * at right angles in a staggered weave; a chevron is blocks cut on a 45° bias
 * so they meet point to point in a continuous V, which is the parquet of a
 * Parisian apartment and considerably more formal. The V is what matters, so
 * the two leaves of each row are mirrored and their ends must align along the
 * seam. Instanced, because a lounge is a few hundred staves and each one is
 * the same box.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { MATERIALS } from "../materials";
import { ROOM } from "./Room";

/** Where the walnut lounges are, in metres: [centre x, centre z, width, depth]. */
export const LOUNGES: readonly [number, number, number, number][] = [
  // The couture lounge by the mirror, where a customer sits and is shown things.
  [4.05, -1.45, 3.3, 3.5],
  // The smaller bay at the fitting-room end.
  [4.05, 2.1, 3.3, 2.6],
];

/** One stave of the chevron, in metres. */
const STAVE = { length: 0.52, width: 0.085, thickness: 0.012 };

/**
 * A chevron field.
 *
 * Each row is a line of staves at +45° meeting a line at −45°. The seam runs
 * down the middle of the field, and the rows step across it. Two tones
 * alternate by row so the pattern reads under low grazing light, where a
 * single-tone parquet goes flat.
 */
function Chevron({
  x,
  z,
  width,
  depth,
  night,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  night: boolean;
}) {
  const { geometry, leftTransforms, rightTransforms } = useMemo(() => {
    const g = new THREE.BoxGeometry(STAVE.length, STAVE.thickness, STAVE.width);

    const left: THREE.Matrix4[] = [];
    const right: THREE.Matrix4[] = [];

    // A stave laid at 45° advances this far along the seam per row.
    const step = STAVE.width * Math.SQRT2;
    // Its 45° run reaches this far from the seam.
    const reach = (STAVE.length / 2) * Math.SQRT1_2;
    const rows = Math.ceil(depth / step) + 2;
    // How many staves fit side by side out from the seam.
    const columns = Math.ceil(width / 2 / (reach * 2)) + 1;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let row = -1; row < rows; row += 1) {
      const seamZ = -depth / 2 + row * step;
      for (let col = 0; col < columns; col += 1) {
        // Out from the seam, one stave length per column.
        const offset = reach + col * reach * 2;

        for (const side of [-1, 1] as const) {
          const px = side * offset;
          const pz = seamZ + offset;
          if (Math.abs(px) > width / 2 + reach) continue;
          if (pz < -depth / 2 - step || pz > depth / 2 + step) continue;

          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * (Math.PI / 4));
          m.compose(new THREE.Vector3(px, 0, pz), q, scale);
          // Alternate the tone by row AND by side, so no two touching staves
          // share a colour and the V never disappears.
          ((row + col) % 2 === 0 ? left : right).push(m.clone());
        }
      }
    }

    return { geometry: g, leftTransforms: left, rightTransforms: right };
  }, [width, depth]);

  const a = night ? MATERIALS.walnutParquetAlt : MATERIALS.walnutParquet;
  const b = night ? MATERIALS.walnutParquet : MATERIALS.walnutParquetAlt;

  return (
    <group position={[x, 0.006, z]}>
      {/* The sub-floor, so no microcement shows between the staves. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.007, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshPhysicalMaterial color={MATERIALS.walnutParquetAlt.colour} roughness={0.7} metalness={0} />
      </mesh>

      {([
        [leftTransforms, a],
        [rightTransforms, b],
      ] as const).map(([transforms, mat], i) => (
        <Staves key={i} geometry={geometry} transforms={transforms} colour={mat.colour} roughness={mat.roughness} />
      ))}
    </group>
  );
}

/** One instanced batch of staves. */
function Staves({
  geometry,
  transforms,
  colour,
  roughness,
}: {
  geometry: THREE.BoxGeometry;
  transforms: THREE.Matrix4[];
  colour: string;
  roughness: number;
}) {
  const mesh = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({ color: colour, roughness, metalness: 0 });
    const instanced = new THREE.InstancedMesh(geometry, material, Math.max(1, transforms.length));
    transforms.forEach((m, i) => instanced.setMatrixAt(i, m));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.castShadow = false;
    instanced.receiveShadow = true;
    // The chevron is clipped by the lounge rectangle, so its bounds have to be
    // computed rather than inferred from one stave or it vanishes at the edge
    // of the frame.
    instanced.frustumCulled = false;
    return instanced;
  }, [geometry, transforms, colour, roughness]);

  return <primitive object={mesh} />;
}

export function Floor({
  night,
  reflections = true,
  reflectionResolution = 1024,
}: {
  night: boolean;
  reflections?: boolean;
  reflectionResolution?: number;
}) {
  const cement = night ? MATERIALS.microcementNight : MATERIALS.microcement;
  const stone = night ? MATERIALS.travertineNight : MATERIALS.travertine;

  return (
    <group>
      {/* ── the microcement field ──────────────────────────────────── */}
      {reflections ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ROOM.width, ROOM.depth]} />
          <MicrocementSurface colour={cement.colour} resolution={reflectionResolution} />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ROOM.width, ROOM.depth]} />
          <meshPhysicalMaterial color={cement.colour} roughness={cement.roughness} metalness={0} />
        </mesh>
      )}

      {/* ── the travertine threshold band ──────────────────────────
          A broad slab of honed travertine laid across the entrance, so
          the first thing underfoot is stone rather than screed. The
          microcement paths run out of it. */}
      <mesh
        position={[-ROOM.halfW + 1.3, 0.0015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[2.6, 3.4]} />
        <meshPhysicalMaterial color={stone.colour} roughness={stone.roughness} metalness={0} />
      </mesh>

      {/* ── the walnut lounges ─────────────────────────────────────── */}
      {LOUNGES.map(([x, z, w, d]) => (
        <Chevron key={`${x}:${z}`} x={x} z={z} width={w} depth={d} night={night} />
      ))}

      {/* ── the brass seam ─────────────────────────────────────────
          Where two floors meet there is always a divider strip, and in
          this house it is the same champagne metal as the rails. It is
          also the one place a hard glint is wanted: a thin bright line
          on the floor reads the edge of the lounge from across the room. */}
      {LOUNGES.map(([x, z, w, d]) => (
        <group key={`seam-${x}:${z}`}>
          {[-1, 1].map((s) => (
            <mesh key={`x${s}`} position={[x + (s * w) / 2, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.016, d]} />
              <meshPhysicalMaterial
                color={MATERIALS.champagne.colour}
                roughness={MATERIALS.champagne.roughness}
                metalness={1}
              />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`z${s}`} position={[x, 0.008, z + (s * d) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, 0.016]} />
              <meshPhysicalMaterial
                color={MATERIALS.champagne.colour}
                roughness={MATERIALS.champagne.roughness}
                metalness={1}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * The reflector, isolated so the tuned numbers sit in one place.
 *
 * mixStrength is 3.4 here, down from the 28 the old polished Nero Marquina
 * used. That one number is the difference between a mirror and a sheen, and a
 * matte floor is what the brief asks for — but dropping it to zero makes the
 * screed read as paper, because a sealed floor does carry a soft bloom of the
 * light above it. The blur is pushed up to match: a rough surface scatters, so
 * what it returns is a suggestion of the beams rather than an image of them.
 */
function MicrocementSurface({ colour, resolution }: { colour: string; resolution: number }) {
  return (
    <MeshReflectorMaterial
      color={colour}
      roughness={0.86}
      metalness={0}
      blur={[420, 140]}
      mixBlur={6}
      mixStrength={3.4}
      resolution={resolution}
      depthScale={0.9}
      minDepthThreshold={0.5}
      maxDepthThreshold={1.4}
      depthToBlurRatioBias={0.4}
      mirror={0}
    />
  );
}
