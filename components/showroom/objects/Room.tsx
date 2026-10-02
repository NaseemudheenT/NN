"use client";

/**
 * The room: floor, walls, ceiling, the arched window wall, and the brass NN
 * monogram inlaid in the travertine at the entrance.
 *
 * Real-world scale throughout — 12 m × 8 m on plan, 4.5 m to the ceiling, as
 * specified in the Blender brief. Coordinates: the room is centred on the
 * origin, x runs the 12 m length, z the 8 m depth, y is up. The entrance is at
 * x = −6, the window wall at z = −4, the counter wall at z = +4, the mirror
 * wall at x = +6.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { ROOM_MODELS } from "../assets";
import { MATERIALS } from "../materials";
import { OptionalModel } from "../OptionalModel";
import { monogramWidthFor } from "@/components/brand/monogramGeometry";
import { MonogramMesh } from "@/components/brand/MonogramMesh";
import { BULLNOSE, BullnosedBox, MASONRY, MasonryArch, Niche } from "./Masonry";
import { Floor } from "./Floor";

export const ROOM = {
  width: 12,
  depth: 8,
  height: 4.5,
  get halfW() { return this.width / 2; },
  get halfD() { return this.depth / 2; },
} as const;

/** A physically based surface, from the materials table. */
function Surface({
  material,
  children,
  ...props
}: {
  /** Name from the materials table. Omitted from the mesh props below because
      three's own `material` prop means something else entirely. */
  material: keyof typeof MATERIALS;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "material">) {
  const m = MATERIALS[material] as Record<string, unknown>;
  return (
    <mesh {...props}>
      {children}
      <meshPhysicalMaterial
        color={m.colour as string}
        roughness={m.roughness as number}
        metalness={m.metalness as number}
        sheen={(m.sheen as number) ?? 0}
        sheenColor={(m.sheenColour as string) ?? "#ffffff"}
        emissive={(m.emissive as string) ?? "#000000"}
        emissiveIntensity={(m.emissiveIntensity as number) ?? 0}
        transparent={(m.transparent as boolean) ?? false}
        opacity={(m.opacity as number) ?? 1}
        transmission={(m.transmission as number) ?? 0}
        ior={(m.ior as number) ?? 1.5}
      />
    </mesh>
  );
}

/* ── the brass NN monogram set into the floor ──────────────────── */

function FloorMonogram({ intensity = 1 }: { intensity?: number }) {
  // Brass inlay, 0.7 m tall, standing a few millimetres proud of the stone the
  // way a real inlay does once the floor has been honed back.
  const brass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: MATERIALS.brass.colour,
        roughness: MATERIALS.brass.roughness,
        metalness: 1,
        emissive: new THREE.Color("#c9a43a"),
        emissiveIntensity: 0.12 * intensity,
      }),
    [intensity],
  );

  const ring = useMemo(
    () => new THREE.TorusGeometry(monogramWidthFor(0.7) * 0.78, 0.008, 8, 96),
    [],
  );

  // Two things decide whether an inlay in a floor can actually be read.
  // It has to be far enough from the door that you are not standing on it —
  // directly inside, it sits under the camera and foreshortens into a
  // scribble. And it has to be turned across the approach: laid along the way
  // you walk in, you read it edge-on and it is just a row of strokes. So the
  // letters are laid flat, then turned a quarter turn to face the entrance.
  return (
    <group position={[-3.3, 0.003, 0]} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <MonogramMesh height={0.7} depth={0.006} bevel={0.34} material={brass} />
        <mesh geometry={ring}>
          <meshPhysicalMaterial
            color={MATERIALS.brassBright.colour}
            roughness={MATERIALS.brassBright.roughness}
            metalness={1}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ── one tall arched window ────────────────────────────────────── */

const WINDOW = { width: 1.9, sill: 0.85, straight: 2.2, arch: 0.95 };

/**
 * The solid stretches of the window wall: everything from one edge of the room
 * to the next opening, and between openings. Derived from the opening centres
 * so a window can be moved without leaving a hole in the masonry.
 */
function pierSegments(centres: number[]): [number, number][] {
  const half = WINDOW.width / 2;
  const openings = [...centres].sort((a, b) => a - b).map((c) => [c - half, c + half] as const);
  const segments: [number, number][] = [];
  let cursor = -ROOM.halfW;
  for (const [from, to] of openings) {
    if (from > cursor + 0.01) segments.push([cursor, from]);
    cursor = Math.max(cursor, to);
  }
  if (cursor < ROOM.halfW - 0.01) segments.push([cursor, ROOM.halfW]);
  return segments;
}

function ArchedWindow({
  x,
  colour,
  intensity,
}: {
  x: number;
  colour: string;
  intensity: number;
}) {
  const { glazing, archFrame } = useMemo(() => {
    const w = WINDOW.width;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, WINDOW.straight);
    // A true semicircular head, radius = half the opening.
    shape.absarc(0, WINDOW.straight, w / 2, 0, Math.PI, false);
    shape.lineTo(-w / 2, 0);

    const glazing = new THREE.ShapeGeometry(shape);
    const archFrame = new THREE.TorusGeometry(w / 2, 0.035, 8, 40, Math.PI);
    return { glazing, archFrame };
  }, []);

  const mullions: [number, number, number, number, number][] = [
    // [x, y, z, width, height] — two verticals and three transoms
    [-WINDOW.width / 6, WINDOW.straight / 2, 0, 0.035, WINDOW.straight],
    [WINDOW.width / 6, WINDOW.straight / 2, 0, 0.035, WINDOW.straight],
  ];
  const transoms = [0.72, 1.46, WINDOW.straight];

  return (
    <group position={[x, WINDOW.sill, -ROOM.halfD + 0.06]}>
      {/* the sky, seen through the opening. This is the light the room reads as
          daylight, so its colour is the computed skylight temperature. */}
      <mesh geometry={glazing}>
        <meshBasicMaterial color={colour} toneMapped={false} opacity={Math.min(1, 0.25 + intensity * 0.3)} transparent />
      </mesh>

      {/* glazing itself, just in front of the sky plane */}
      <mesh geometry={glazing} position={[0, 0, 0.012]}>
        <meshPhysicalMaterial
          color={MATERIALS.glass.colour}
          roughness={MATERIALS.glass.roughness}
          metalness={0}
          transparent
          opacity={0.16}
          transmission={0.9}
          ior={1.52}
        />
      </mesh>

      {/* blackened steel frame */}
      <group position={[0, 0, 0.03]}>
        {mullions.map(([mx, my, , mw, mh], i) => (
          <Surface key={`v${i}`} material="steel" position={[mx, my, 0]} castShadow>
            <boxGeometry args={[mw, mh, 0.05]} />
          </Surface>
        ))}
        {transoms.map((ty, i) => (
          <Surface key={`h${i}`} material="steel" position={[0, ty, 0]} castShadow>
            <boxGeometry args={[WINDOW.width, 0.035, 0.05]} />
          </Surface>
        ))}
        {/* jambs and the arch head */}
        <Surface material="steel" position={[-WINDOW.width / 2, WINDOW.straight / 2, 0]}>
          <boxGeometry args={[0.06, WINDOW.straight, 0.06]} />
        </Surface>
        <Surface material="steel" position={[WINDOW.width / 2, WINDOW.straight / 2, 0]}>
          <boxGeometry args={[0.06, WINDOW.straight, 0.06]} />
        </Surface>
        <mesh geometry={archFrame} position={[0, WINDOW.straight, 0]}>
          <meshPhysicalMaterial color={MATERIALS.steel.colour} roughness={0.42} metalness={1} />
        </mesh>
      </group>

      {/* stone sill */}
      <Surface material="travertine" position={[0, -0.06, 0.12]} receiveShadow>
        <boxGeometry args={[WINDOW.width + 0.35, 0.1, 0.34]} />
      </Surface>
    </group>
  );
}

/* ── the arcade ───────────────────────────────────────────────────
   Four Romanesque bays on the rail wall, on a 2.3 m pitch.

   The pitch is not a design choice: it is the distance between the two
   garment rails, which were already placed. The architecture frames the
   merchandise rather than the other way round, so the bays are anchored
   on the rails at x = −3.3 and −1.0 and the pattern continues from
   there. A 1.5 m opening on a 2.3 m pitch leaves 520 mm of solid pier
   between each arch, which is a real pier — wide enough to carry the
   spandrel above it and read as structure. Widen the openings to 1.8 m
   and the piers drop to 160 mm, at which point they read as mullions
   and the whole wall turns back into a partition with holes in it.

   The springing line sits at 2.05 m — just above a tall man's head — so
   every arch begins its curve above eye level and a visitor reads the
   opening as something to walk under rather than something in the way.

   The clay alternates sage and terracotta. Four identical openings in
   one colour read as a corridor; alternating them reads as a room.   */
export const ARCADE = { springing: 2.05, ring: 0.14 } as const;

export const ARCADE_BAYS: readonly { x: number; width: number; clay: "sage" | "terracotta" }[] = [
  { x: -3.3, width: 1.5, clay: "sage" },
  { x: -1.0, width: 1.5, clay: "terracotta" },
  { x: 1.3, width: 1.5, clay: "terracotta" },
  { x: 3.6, width: 1.5, clay: "sage" },
];

/**
 * The solid masonry between the arches.
 *
 * Derived from the openings rather than listed, exactly as `pierSegments`
 * does for the windows, so a bay can be moved or resized without leaving a
 * hole in the wall or a pier overlapping an arch ring.
 */
function arcadePiers(): [number, number][] {
  const piers: [number, number][] = [];
  let cursor = -ROOM.halfW;
  for (const bay of [...ARCADE_BAYS].sort((a, b) => a.x - b.x)) {
    const left = bay.x - bay.width / 2 - ARCADE.ring;
    const right = bay.x + bay.width / 2 + ARCADE.ring;
    if (left > cursor + 0.01) piers.push([cursor, left]);
    cursor = Math.max(cursor, right);
  }
  if (cursor < ROOM.halfW - 0.01) piers.push([cursor, ROOM.halfW]);
  return piers;
}

/* ── the ceiling structure ───────────────────────────────────────
   A 220 × 160 mm beam on a 1.1 m centre. Both numbers are structural:
   that is roughly what a timber beam has to measure to carry a 12 m
   room, and roughly how close together they have to sit. Getting them
   right matters more than it sounds, because a viewer who has stood in
   a building reads an under-sized beam as a prop immediately.        */
const BEAM = { height: 0.22, width: 0.16 } as const;
const BEAM_ZS = [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3] as const;

/* ── the room shell ───────────────────────────────────────────── */

export function Room({
  windowColour,
  windowIntensity,
  night,
  /** Whether the floor renders a live reflection. Off on constrained devices. */
  reflections = true,
  /** Reflection buffer size. Lowered with the quality tier. */
  reflectionResolution = 1024,
}: {
  windowColour: string;
  windowIntensity: number;
  night: boolean;
  reflections?: boolean;
  reflectionResolution?: number;
}) {
  const lime = night ? "limewashNight" : "limewash";
  const clayWarm = night ? "terracottaNight" : "terracotta";
  const claySage = night ? "sageNight" : "sage";
  const limeStucco = night ? "stuccoNight" : "stucco";
  const brickTrim = night ? "brickNight" : "brick";
  const beam = night ? "timberNight" : "timber";
  const soffit = night ? "ceilingNight" : "ceiling";
  const stoneSill = night ? "travertineNight" : "travertine";
  const windowXs = [-4.4, -1.5, 1.5, 4.4];

  return (
    <OptionalModel
      path={ROOM_MODELS.shell}
      placeholder={
        <group>
          {/* ── the floor ───────────────────────────────────────────
              Matte microcement paths running into dark walnut chevron
              where the couture lounges are. See ./Floor.            */}
          <Floor
            night={night}
            reflections={reflections}
            reflectionResolution={reflectionResolution}
          />

          {/* ══ THE ARCADE ══════════════════════════════════════════
              The long walls are not partitions. They are 340 mm of
              structure, pierced by four Romanesque arches and hollowed
              behind each one into a deep niche with a clay back.

              This is the single biggest change from the old room, and
              the reason is structural rather than decorative. A flat
              wall gives the light one plane to fall on, so it reads as
              a backdrop however it is painted. A pierced wall gives it
              a jamb, a soffit, a reveal and a recess — four surfaces at
              four angles, each catching a different amount — and the
              eye reads mass from the gradient between them. That is
              what makes a garment look like it is standing IN
              somewhere rather than in front of something.

              The niches also do the lighting a favour: a piece in a
              recess is lit on three sides by bounce off its own clay,
              which fills the shadows a single tight beam would leave. */}
          {[-1, 1].map((side) => {
            // side −1 is the window wall (z = −4); +1 is the rail wall.
            const z = side * ROOM.halfD;
            // The window wall is already pierced by its openings, so only
            // the rail wall carries the arcade.
            if (side < 0) return null;

            return (
              <group key={`arcade-${side}`}>
                {/* the wall body, built as piers between the arches */}
                {arcadePiers().map(([from, to]) => (
                  <BullnosedBox
                    key={`pier-${from}`}
                    width={to - from}
                    height={ROOM.height}
                    depth={MASONRY.wall}
                    material={lime}
                    position={[(from + to) / 2, ROOM.height / 2, z - (side * MASONRY.wall) / 2]}
                    castShadow
                    receiveShadow
                  />
                ))}

                {/* the arches, and the niches behind them */}
                {ARCADE_BAYS.map((bay) => (
                  <group key={`bay-${bay.x}`}>
                    <MasonryArch
                      spec={{
                        width: bay.width,
                        springing: ARCADE.springing,
                        depth: MASONRY.wall,
                        ring: ARCADE.ring,
                      }}
                      material={lime}
                      ringMaterial={brickTrim}
                      position={[bay.x, 0, z - (side * MASONRY.wall) / 2]}
                      rotation={[0, side > 0 ? Math.PI : 0, 0]}
                    />
                    {/* the recess, sunk a further 300 mm into the masonry */}
                    <Niche
                      width={bay.width - 0.12}
                      height={ARCADE.springing + (bay.width - 0.12) / 2}
                      springing={ARCADE.springing}
                      material={limeStucco}
                      backMaterial={bay.clay === "sage" ? claySage : clayWarm}
                      position={[bay.x, 0, z - side * MASONRY.wall]}
                      rotation={[0, side > 0 ? Math.PI : 0, 0]}
                    />
                    {/* the spandrel above the arch, closing the wall to the
                        ceiling — without this you see daylight over the head
                        of every arch, which is the classic giveaway that a
                        wall was assembled rather than built */}
                    <BullnosedBox
                      width={bay.width + ARCADE.ring * 2}
                      height={ROOM.height - (ARCADE.springing + bay.width / 2 + ARCADE.ring)}
                      depth={MASONRY.wall}
                      material={lime}
                      position={[
                        bay.x,
                        (ROOM.height + ARCADE.springing + bay.width / 2 + ARCADE.ring) / 2,
                        z - (side * MASONRY.wall) / 2,
                      ]}
                      castShadow
                      receiveShadow
                    />
                  </group>
                ))}
              </group>
            );
          })}

          {/* ══ THE CEILING ═════════════════════════════════════════
              Heavy exposed timber over troweled lime. Seven beams on a
              1.1 m centre, which is a real structural spacing for a
              12 m span and not a decorative one — and the shadows they
              throw across the lime are most of what makes the ceiling
              read as a ceiling rather than a lid.

              The beams are the darkest thing in the house. That is
              deliberate: a pale interior with nothing dark overhead
              reads as a gallery, and the weight up there is what makes
              it read as a building.                                  */}
          <Surface
            material={soffit}
            position={[0, ROOM.height, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[ROOM.width, ROOM.depth]} />
          </Surface>
          {BEAM_ZS.map((bz) => (
            <BullnosedBox
              key={`beam-${bz}`}
              width={ROOM.width - 0.1}
              height={BEAM.height}
              depth={BEAM.width}
              radius={BULLNOSE.trim}
              material={beam}
              position={[0, ROOM.height - BEAM.height / 2, bz]}
              castShadow
              receiveShadow
            />
          ))}
          {/* the wall plates the beams sit on */}
          {[-1, 1].map((side) => (
            <BullnosedBox
              key={`plate-${side}`}
              width={0.16}
              height={0.2}
              depth={ROOM.depth - 0.1}
              radius={BULLNOSE.trim}
              material={beam}
              position={[side * (ROOM.halfW - 0.08), ROOM.height - BEAM.height - 0.1, 0]}
              castShadow
            />
          ))}

          {/* counter wall, z = +4 */}
          <Surface
            material={lime}
            position={[0, ROOM.height / 2, ROOM.halfD]}
            rotation={[0, Math.PI, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.width, ROOM.height]} />
          </Surface>

          {/* entrance wall, x = −6 */}
          <Surface
            material={lime}
            position={[-ROOM.halfW, ROOM.height / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.depth, ROOM.height]} />
          </Surface>

          {/* mirror wall, x = +6 */}
          <Surface
            material={lime}
            position={[ROOM.halfW, ROOM.height / 2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.depth, ROOM.height]} />
          </Surface>

          {/* ══ THE WINDOW WALL ═════════════════════════════════════
              Deep-set openings, as the brief asks: 450 mm of masonry
              with the glass at the far face, so from inside the room you
              look down an embrasure of stucco before you reach the
              daylight.

              That depth is not decoration either. A window in a thin
              wall is a bright rectangle, and a bright rectangle in a
              dark room is a glare source — it flattens everything near
              it and the eye goes to the hole instead of the clothes. Set
              the glass back 450 mm and the reveal does two things at
              once: it shades the opening so the glass is no longer the
              brightest thing in frame, and it catches the daylight on
              its own jamb and soffit, which puts a graded wash of real
              sunlight on the wall beside every window. That wash is the
              best light in the building and it is free.

              The arch is Romanesque here too, and it already was: a
              0.95 m rise on a 1.9 m span is exactly half, so the window
              heads and the arcade are the same geometry at two scales. */}
          <group>
            {/* the thickness, as piers between the openings — worked out
                from the openings themselves so the two can never
                disagree */}
            {pierSegments(windowXs).map(([from, to]) => (
              <BullnosedBox
                key={`wpier-${from}`}
                width={to - from}
                height={ROOM.height}
                depth={MASONRY.deep}
                material={limeStucco}
                position={[(from + to) / 2, ROOM.height / 2, -ROOM.halfD + MASONRY.deep / 2]}
                castShadow
                receiveShadow
              />
            ))}
            {/* the header above the openings, and the dado below the sills */}
            <BullnosedBox
              width={ROOM.width}
              height={ROOM.height - (WINDOW.sill + WINDOW.straight + WINDOW.arch)}
              depth={MASONRY.deep}
              material={limeStucco}
              position={[
                0,
                (WINDOW.sill + WINDOW.straight + WINDOW.arch + ROOM.height) / 2,
                -ROOM.halfD + MASONRY.deep / 2,
              ]}
              castShadow
              receiveShadow
            />
            <BullnosedBox
              width={ROOM.width}
              height={WINDOW.sill}
              depth={MASONRY.deep}
              material={limeStucco}
              position={[0, WINDOW.sill / 2, -ROOM.halfD + MASONRY.deep / 2]}
              castShadow
              receiveShadow
            />

            {/* the embrasures: the same thick-arch primitive as the
                arcade, in stucco rather than brick, so the reveal is a
                real curved soffit the daylight grades across */}
            {windowXs.map((x) => (
              <group key={`reveal-${x}`}>
                <MasonryArch
                  spec={{
                    width: WINDOW.width,
                    springing: WINDOW.straight,
                    depth: MASONRY.deep,
                    ring: 0.18,
                  }}
                  material={limeStucco}
                  ringMaterial={limeStucco}
                  position={[x, WINDOW.sill, -ROOM.halfD + MASONRY.deep / 2]}
                />
                {/* a travertine sill, sloped out so water would run off
                    it — which is why a real sill is never flat, and why
                    a flat one reads as a render rather than a building */}
                <BullnosedBox
                  width={WINDOW.width + 0.42}
                  height={0.09}
                  depth={MASONRY.deep + 0.08}
                  radius={BULLNOSE.trim}
                  material={stoneSill}
                  position={[x, WINDOW.sill - 0.03, -ROOM.halfD + MASONRY.deep / 2 + 0.02]}
                  rotation={[0.035, 0, 0]}
                  castShadow
                  receiveShadow
                />
              </group>
            ))}
          </group>

          {/* the windows */}
          <OptionalModel
            path={ROOM_MODELS.windows}
            placeholder={
              <>
                {windowXs.map((x) => (
                  <ArchedWindow key={x} x={x} colour={windowColour} intensity={windowIntensity} />
                ))}
              </>
            }
          />

          {/* skirting and cornice. Two hairlines of brass at the floor and the
              ceiling are what stop a dark room reading as an empty void: they
              give the eye the edges of the architecture. */}
          {[
            { p: [0, 0.07, ROOM.halfD - 0.02] as [number, number, number], a: [ROOM.width, 0.14, 0.035] as [number, number, number] },
            { p: [-ROOM.halfW + 0.02, 0.07, 0] as [number, number, number], a: [0.035, 0.14, ROOM.depth] as [number, number, number] },
            { p: [ROOM.halfW - 0.02, 0.07, 0] as [number, number, number], a: [0.035, 0.14, ROOM.depth] as [number, number, number] },
            { p: [0, ROOM.height - 0.08, ROOM.halfD - 0.02] as [number, number, number], a: [ROOM.width, 0.1, 0.05] as [number, number, number] },
            { p: [-ROOM.halfW + 0.02, ROOM.height - 0.08, 0] as [number, number, number], a: [0.05, 0.1, ROOM.depth] as [number, number, number] },
            { p: [ROOM.halfW - 0.02, ROOM.height - 0.08, 0] as [number, number, number], a: [0.05, 0.1, ROOM.depth] as [number, number, number] },
          ].map((band, i) => (
            <Surface key={i} material="brass" position={band.p}>
              <boxGeometry args={band.a} />
            </Surface>
          ))}

          <OptionalModel
            path={ROOM_MODELS.floorMonogram}
            placeholder={<FloorMonogram intensity={night ? 2 : 1} />}
          />
        </group>
      }
    />
  );
}

export { Surface, FloorMonogram, ArchedWindow, WINDOW };
