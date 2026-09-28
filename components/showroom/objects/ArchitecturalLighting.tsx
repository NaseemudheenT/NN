"use client";

/**
 * The lighting design.
 *
 * A flagship is lit by three separate systems, and the reason it looks
 * expensive is that you can see all three working at once:
 *
 *   1. Recessed ceiling spots on a track line, aimed down at the garments.
 *      These do the selling — a narrow beam on cloth is what makes fabric
 *      read as fabric from across a room.
 *   2. Floor-washing uplights at the base of each pilaster, throwing light
 *      up the stone. These do the architecture: they tell you the room has
 *      height, and they are the reason the walls do not go flat at night.
 *   3. A continuous perimeter cove washing the top of the walls, which fills
 *      the shadows the other two leave without ever being visible itself.
 *
 * Every fixture here is a real object with a real emitter in it. The light and
 * the thing making the light are never separated, because a pool of light on a
 * floor with no fixture above it is the single fastest way to make an interior
 * look fake.
 */

import { MATERIALS } from "../materials";
import { ROOM, Surface } from "./Room";

/** Where the ceiling track runs, and what each head is aimed at. */
const SPOTS: { at: [number, number, number]; aim: [number, number, number] }[] = [
  // over the two garment rails
  { at: [-3.3, ROOM.height - 0.06, ROOM.halfD - 1.5], aim: [-3.3, 1.5, ROOM.halfD - 0.3] },
  { at: [-1.0, ROOM.height - 0.06, ROOM.halfD - 1.5], aim: [-1.0, 1.5, ROOM.halfD - 0.3] },
  // over the folding table
  { at: [-0.4, ROOM.height - 0.06, -0.3], aim: [-0.4, 0.7, -0.9] },
  // over each mannequin
  { at: [-2.1, ROOM.height - 0.06, 1.0], aim: [-2.1, 1.3, 1.5] },
  { at: [1.5, ROOM.height - 0.06, 1.25], aim: [1.5, 1.3, 1.75] },
  // washing the counter
  { at: [3.4, ROOM.height - 0.06, ROOM.halfD - 1.4], aim: [3.4, 1.0, ROOM.halfD - 0.5] },
];

/** Uplights sit at the foot of the pilasters, on both long walls. */
const UPLIGHT_Z = [-3.9, -1.3, 1.3, 3.9];

function RecessedSpot({
  at,
  aim,
  colour,
  intensity,
  shadows,
}: {
  at: [number, number, number];
  aim: [number, number, number];
  colour: string;
  intensity: number;
  shadows: boolean;
}) {
  return (
    <group>
      {/* the housing: a blackened cylinder set into the ceiling, with a
          champagne-gold trim ring just proud of the plaster */}
      <group position={at}>
        <Surface material="steel" position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.12, 20]} />
        </Surface>
        <mesh position={[0, -0.032, 0]}>
          <torusGeometry args={[0.078, 0.008, 8, 24]} />
          <meshPhysicalMaterial
            color={MATERIALS.champagne.colour}
            roughness={MATERIALS.champagne.roughness}
            metalness={1}
          />
        </mesh>
        {/* the lens, which is the bit you actually see glowing */}
        <mesh position={[0, -0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.062, 20]} />
          <meshBasicMaterial color={colour} toneMapped={false} transparent opacity={0.4 + intensity * 0.5} />
        </mesh>
      </group>

      {/* the beam. Narrow and soft-edged: a wide beam lights a room, a narrow
          one lights a garment, and only the second sells anything. */}
      <spotLight
        position={at}
        target-position={aim}
        angle={0.34}
        penumbra={0.86}
        distance={9}
        decay={2}
        intensity={intensity * 16}
        color={colour}
        castShadow={shadows}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
      />
    </group>
  );
}

function Uplight({
  position,
  colour,
  intensity,
}: {
  position: [number, number, number];
  colour: string;
  intensity: number;
}) {
  return (
    <group position={position}>
      {/* a slim champagne slot set flush into the floor at the pilaster foot */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 0.38]} />
        <meshBasicMaterial color={colour} toneMapped={false} transparent opacity={0.3 + intensity * 0.6} />
      </mesh>
      <Surface material="champagne" position={[0, 0.006, 0]}>
        <boxGeometry args={[0.1, 0.012, 0.42]} />
      </Surface>
      {/* the wash itself, aimed straight up the stone */}
      <spotLight
        position={[0, 0.06, 0]}
        target-position={[position[0] > 0 ? position[0] + 0.3 : position[0] - 0.3, ROOM.height, position[2]]}
        angle={0.5}
        penumbra={1}
        distance={6}
        decay={2}
        intensity={intensity * 5}
        color={colour}
      />
    </group>
  );
}

export function ArchitecturalLighting({
  /** Warm interior colour, from the rig. */
  lampColour,
  /** 0 in full daylight, 1 at night — the fixtures come up as the sun goes. */
  level,
  quality,
}: {
  lampColour: string;
  level: number;
  quality: "low" | "medium" | "high";
}) {
  // The spots never go fully off: a flagship keeps its display lighting on all
  // day, because daylight alone makes cloth look flat. They simply matter more
  // after dark. The floor is 0.3 even at noon.
  const spotLevel = 0.3 + level * 0.7;
  const uplightLevel = level;
  const shadows = quality === "high";

  return (
    <group>
      {/* ── 1. the ceiling track and its heads ─────────────────── */}
      {/* the track itself: a blackened channel the heads sit in */}
      {[ROOM.halfD - 1.5, -0.3, 1.1].map((z) => (
        <Surface key={`track-${z}`} material="steel" position={[0, ROOM.height - 0.02, z]}>
          <boxGeometry args={[ROOM.width - 1.6, 0.04, 0.09]} />
        </Surface>
      ))}
      {SPOTS.map((s, i) => (
        <RecessedSpot
          key={i}
          at={s.at}
          aim={s.aim}
          colour={lampColour}
          intensity={spotLevel}
          /* Only the two heads over the rails cast a map. Six shadow-casting
             spots would cost six extra render passes for shadows nobody can
             tell apart once they overlap. */
          shadows={shadows && i < 2}
        />
      ))}

      {/* ── 2. floor-washing uplights at the pilasters ──────────── */}
      {quality !== "low" &&
        [-ROOM.halfW + 0.33, ROOM.halfW - 0.33].map((x) =>
          UPLIGHT_Z.map((z) => (
            <Uplight
              key={`${x}-${z}`}
              position={[x, 0, z]}
              colour={lampColour}
              intensity={uplightLevel}
            />
          )),
        )}

      {/* ── 3. the perimeter cove ───────────────────────────────
          A continuous slot at the head of the wall, washing the top of
          the stone. The fixture is never seen; only its effect is. */}
      {[
        { p: [0, ROOM.height - 0.22, ROOM.halfD - 0.14] as [number, number, number], a: [ROOM.width - 0.6, 0.05, 0.1] as [number, number, number] },
        { p: [-ROOM.halfW + 0.14, ROOM.height - 0.22, 0] as [number, number, number], a: [0.1, 0.05, ROOM.depth - 0.6] as [number, number, number] },
        { p: [ROOM.halfW - 0.14, ROOM.height - 0.22, 0] as [number, number, number], a: [0.1, 0.05, ROOM.depth - 0.6] as [number, number, number] },
      ].map((cove, i) => (
        <mesh key={`cove-${i}`} position={cove.p}>
          <boxGeometry args={cove.a} />
          <meshBasicMaterial
            color={lampColour}
            toneMapped={false}
            transparent
            opacity={0.18 + level * 0.42}
          />
        </mesh>
      ))}
      {/* two soft sources doing the cove's actual work */}
      {[-2.6, 2.6].map((x) => (
        <pointLight
          key={`cove-light-${x}`}
          position={[x, ROOM.height - 0.4, 0]}
          color={lampColour}
          intensity={(0.4 + level * 1.6) * 2.2}
          distance={9}
          decay={2}
        />
      ))}
    </group>
  );
}
