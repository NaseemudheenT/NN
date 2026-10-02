"use client";

/**
 * The lighting design.
 *
 * This is a VIGNETTE schema, which is a specific thing and not a synonym for
 * "moody". The principle is that a luxury interior is lit in pools: the
 * merchandise is hit hard and narrowly, the architecture is grazed softly, and
 * the circulation between them is deliberately left dim. The customer's eye is
 * pulled from one bright thing to the next and reads the dark floor in between
 * as depth rather than as absence.
 *
 * It is also what makes a pale room work. These walls are Warm Sand Beige
 * limewash — high albedo. Flood them evenly and the showroom is a bright box.
 * Light them in pools and the same cream plaster gives you a glowing arch
 * beside a wall falling into shadow, which is the entire Mediterranean effect.
 *
 * Three systems, and the reason it looks expensive is that you can see all
 * three working at once:
 *
 *   1. TIGHT-BEAM DIRECTIONAL SPOTS on a ceiling track, aimed at the
 *      garments. 15°–24° beams: narrow enough to leave the floor around a
 *      rail almost untouched, which is what makes cloth look lit rather than
 *      merely visible. High-CRI, which has a real rendered consequence — see
 *      `highCri` below.
 *   2. FLOOR-WASHING UPLIGHTS at the foot of each pier, grazing straight up
 *      the limewash. These do the architecture: they tell you the room has
 *      height, and on a troweled surface they rake the texture so you can
 *      see the hand of the trowel in it.
 *   3. HIDDEN COVE STRIPS at 2700 K, tucked behind a plaster upstand at the
 *      head of the wall. The fixture is never visible from anywhere a
 *      customer can stand; only the glow is. This is the system that makes
 *      the lime read as velvet.
 *
 * Every fixture here is a real object with a real emitter in it. The light and
 * the thing making the light are never separated, because a pool of light on a
 * floor with no fixture above it is the single fastest way to make an interior
 * look fake.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "../materials";
import { ROOM, Surface } from "./Room";
import { MASONRY } from "./Masonry";

/** How far the pierced wall stands into the room. */
const MASONRY_FACE = MASONRY.wall;

/* ── the beam ─────────────────────────────────────────────────────
   Beam angle is quoted as the FULL cone in lighting practice, and
   three.js wants the half-angle, so the brief's 15°–24° is 0.131 to
   0.209 radians here. Worth being pedantic about: the old value was
   0.34 rad, which is a 39° flood — nearly twice the brief — and a
   39° beam from 4.4 m lights a 3 m circle of floor. That is a room
   light pretending to be a display light, and it is exactly why the
   walkways were as bright as the merchandise.                      */
const BEAM = {
  /** 17° full cone. The merchandise spots. */
  narrow: 0.148,
  /** 24° full cone. The counter and the wider table wash. */
  medium: 0.209,
} as const;

/**
 * High-CRI, as it actually renders.
 *
 * CRI is not a three.js parameter, but it has a concrete visual meaning that
 * can be modelled: a low-CRI lamp has gaps in its spectrum, so saturated
 * surfaces under it lose chroma and everything drifts toward the lamp's own
 * colour. A 97-CRI lamp renders the terracotta as terracotta and the sage as
 * sage.
 *
 * So the merchandise spots are pulled partway back toward neutral from the
 * ambient lamp colour. The room still reads warm — the coves and uplights are
 * full-strength 2700 K — but the light actually falling on cloth and clay is
 * close to white, which is what a real high-CRI display lamp does and the
 * reason a garment under one looks like its true colour.
 */
function highCri(lampColour: string): THREE.Color {
  return new THREE.Color(lampColour).lerp(new THREE.Color("#fff6ec"), 0.45);
}

/** Where the ceiling track runs, and what each head is aimed at. */
const SPOTS: {
  at: [number, number, number];
  aim: [number, number, number];
  angle: number;
}[] = [
  // Over the two garment rails. The tightest beams in the room: these are
  // aimed into the arched niches, and the whole point is that the garment is
  // lit and the floor in front of it is not.
  { at: [-3.3, ROOM.height - 0.06, ROOM.halfD - 1.5], aim: [-3.3, 1.5, ROOM.halfD - 0.3], angle: BEAM.narrow },
  { at: [-1.0, ROOM.height - 0.06, ROOM.halfD - 1.5], aim: [-1.0, 1.5, ROOM.halfD - 0.3], angle: BEAM.narrow },
  // Over the folding table — wider, because it is lighting a surface rather
  // than a hanging piece.
  { at: [-0.4, ROOM.height - 0.06, -0.3], aim: [-0.4, 0.7, -0.9], angle: BEAM.medium },
  // Over each dressed form. Tight, so the form is modelled by one key light
  // and reads three-dimensionally.
  { at: [-2.1, ROOM.height - 0.06, 1.0], aim: [-2.1, 1.3, 1.5], angle: BEAM.narrow },
  { at: [1.5, ROOM.height - 0.06, 1.25], aim: [1.5, 1.3, 1.75], angle: BEAM.narrow },
  // Washing the counter, where someone has to read and sign something.
  { at: [3.4, ROOM.height - 0.06, ROOM.halfD - 1.4], aim: [3.4, 1.0, ROOM.halfD - 0.5], angle: BEAM.medium },
];

/* ── the coves ────────────────────────────────────────────────────
   Three runs: the rail wall and both end walls. Each one is a plaster
   upstand with a strip behind it and an area emitter inside it.

   The geometry is the detail. The upstand stands 120 mm proud of the
   wall and rises 180 mm; the strip sits 60 mm behind its face and
   140 mm below its top. Those numbers are a real cove section, and
   between them they guarantee the strip is out of sight from any eye
   height below about 2.6 m — which is everyone.                     */
const COVE_LIP = { proud: 0.12, rise: 0.18 };
const COVE_Y = ROOM.height - 0.34;

const COVES: {
  lip: [number, number, number];
  lipSize: [number, number, number];
  strip: [number, number, number];
  stripSize: [number, number, number];
  emitter: [number, number, number];
  emitterRotation: [number, number, number];
  emitterSize: [number, number];
}[] = [
  // the rail wall, z = +4
  {
    lip: [0, COVE_Y, ROOM.halfD - MASONRY_FACE - COVE_LIP.proud / 2],
    lipSize: [ROOM.width - 0.4, COVE_LIP.rise, COVE_LIP.proud],
    strip: [0, COVE_Y + 0.07, ROOM.halfD - MASONRY_FACE - 0.03],
    stripSize: [ROOM.width - 0.5, 0.03, 0.05],
    emitter: [0, COVE_Y + 0.1, ROOM.halfD - MASONRY_FACE - 0.07],
    // facing up and slightly in at the wall
    emitterRotation: [-Math.PI / 2.3, 0, 0],
    emitterSize: [ROOM.width - 0.5, 0.26],
  },
  // the entrance wall, x = −6
  {
    lip: [-ROOM.halfW + COVE_LIP.proud / 2, COVE_Y, 0],
    lipSize: [COVE_LIP.proud, COVE_LIP.rise, ROOM.depth - 0.4],
    strip: [-ROOM.halfW + 0.03, COVE_Y + 0.07, 0],
    stripSize: [0.05, 0.03, ROOM.depth - 0.5],
    emitter: [-ROOM.halfW + 0.07, COVE_Y + 0.1, 0],
    emitterRotation: [-Math.PI / 2, 0, Math.PI / 2.3],
    emitterSize: [ROOM.depth - 0.5, 0.26],
  },
  // the mirror wall, x = +6
  {
    lip: [ROOM.halfW - COVE_LIP.proud / 2, COVE_Y, 0],
    lipSize: [COVE_LIP.proud, COVE_LIP.rise, ROOM.depth - 0.4],
    strip: [ROOM.halfW - 0.03, COVE_Y + 0.07, 0],
    stripSize: [0.05, 0.03, ROOM.depth - 0.5],
    emitter: [ROOM.halfW - 0.07, COVE_Y + 0.1, 0],
    emitterRotation: [-Math.PI / 2, 0, -Math.PI / 2.3],
    emitterSize: [ROOM.depth - 0.5, 0.26],
  },
];

/** Uplights sit at the foot of the pilasters, on both long walls. */
const UPLIGHT_Z = [-3.9, -1.3, 1.3, 3.9];

function RecessedSpot({
  at,
  aim,
  colour,
  lensColour,
  intensity,
  angle,
  shadows,
}: {
  at: [number, number, number];
  aim: [number, number, number];
  /** The beam, pulled toward neutral for high CRI. */
  colour: THREE.Color;
  /** The visible lens, which stays the warm ambient colour. */
  lensColour: string;
  intensity: number;
  angle: number;
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
          <meshBasicMaterial color={lensColour} toneMapped={false} transparent opacity={0.4 + intensity * 0.5} />
        </mesh>
      </group>

      {/* The beam. Tight and soft-edged: a wide beam lights a room, a narrow
          one lights a garment, and only the second sells anything.

          Intensity rises as the cone narrows, because the same lamp
          concentrated into half the solid angle is roughly four times as
          bright on axis — which is the whole reason a display lamp is
          specified by its beam rather than its wattage. */}
      <spotLight
        position={at}
        target-position={aim}
        angle={angle}
        penumbra={0.72}
        distance={9}
        decay={2}
        intensity={intensity * 16 * (BEAM.medium / angle) ** 2}
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

  /* The merchandise beams, pulled toward neutral so the clay and the cloth
     keep their own colour under them. The coves and uplights stay at the
     full 2700 K — the warmth belongs on the architecture, not on the stock. */
  const beamColour = useMemo(() => highCri(lampColour), [lampColour]);
  /* The upstand is part of the wall, so it takes the wall's finish. */
  const limewash = level > 0.6 ? ("limewashNight" as const) : ("limewash" as const);

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
          colour={beamColour}
          lensColour={lampColour}
          angle={s.angle}
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

      {/* ── 3. the hidden cove ──────────────────────────────────
          A continuous strip tucked BEHIND a plaster upstand at the head
          of the wall, throwing light up the lime and across the ceiling
          soffit between the beams.

          The upstand is the part that matters and the part usually left
          out. Without it the strip is a visible bright line, which is a
          ceiling detail from an office. With it, the strip is invisible
          from every standing eye height in the room and all you see is
          a wall that gets brighter towards the top — and on troweled
          lime that gradient rakes across the texture and shows you the
          trowel marks, which is the single most convincing thing a
          limewash wall can do.

          2700 K, uncorrected. This is the system carrying the warmth. */}
      {COVES.map((cove, i) => (
        <group key={`cove-${i}`}>
          {/* the plaster upstand that hides the strip */}
          <Surface
            material={limewash}
            position={cove.lip}
            castShadow
          >
            <boxGeometry args={cove.lipSize} />
          </Surface>
          {/* the strip itself, behind it and aimed up */}
          <mesh position={cove.strip}>
            <boxGeometry args={cove.stripSize} />
            <meshBasicMaterial
              color={lampColour}
              toneMapped={false}
              transparent
              opacity={0.3 + level * 0.55}
            />
          </mesh>
        </group>
      ))}
      {/* The cove's actual contribution. Rect area lights are the right
          primitive for a linear source — a point light at the head of a wall
          gives a hotspot, where a strip gives an even gradient — and the
          renderer treats them as genuine area emitters. */}
      {quality !== "low" &&
        COVES.map((cove, i) => (
          <rectAreaLight
            key={`cove-light-${i}`}
            position={cove.emitter}
            rotation={cove.emitterRotation}
            width={cove.emitterSize[0]}
            height={cove.emitterSize[1]}
            color={lampColour}
            intensity={(0.5 + level * 2.1) * 2.6}
          />
        ))}
      {/* On low quality the area lights are dropped and two soft points stand
          in for them, which costs a fraction and still keeps the room from
          going flat. */}
      {quality === "low" &&
        [-2.6, 2.6].map((x) => (
          <pointLight
            key={`cove-fallback-${x}`}
            position={[x, ROOM.height - 0.5, 0]}
            color={lampColour}
            intensity={(0.4 + level * 1.6) * 2.2}
            distance={9}
            decay={2}
          />
        ))}
    </group>
  );
}
