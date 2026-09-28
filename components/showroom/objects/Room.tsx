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
import { MeshReflectorMaterial } from "@react-three/drei";
import { ROOM_MODELS } from "../assets";
import { MATERIALS } from "../materials";
import { OptionalModel } from "../OptionalModel";
import { monogramWidthFor } from "@/components/brand/monogramGeometry";
import { MonogramMesh } from "@/components/brand/MonogramMesh";

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
      <Surface material="marbleBorder" position={[0, -0.06, 0.12]} receiveShadow>
        <boxGeometry args={[WINDOW.width + 0.35, 0.1, 0.34]} />
      </Surface>
    </group>
  );
}

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
  const wallMaterial = night ? "plasterNight" : "plaster";
  const stoneMaterial = night ? "limestoneNight" : "limestone";
  const panelMaterial = night ? "concreteNight" : "concrete";
  const windowXs = [-4.4, -1.5, 1.5, 4.4];

  return (
    <OptionalModel
      path={ROOM_MODELS.shell}
      placeholder={
        <group>
          {/* ── the floor ──────────────────────────────────────────
              Nero Marquina, polished rather than honed, with a real
              reflection rendered into it each frame. This is the single
              most expensive-looking thing in the room and the cheapest
              to justify: a polished stone floor genuinely does carry the
              whole room upside down in it, and every gold fitting
              appears twice — once on the wall, once underfoot.

              On weaker hardware `reflections` is false and the same
              stone falls back to a plain physical material, which costs
              one draw call instead of a second render pass.        */}
          {reflections ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[ROOM.width, ROOM.depth]} />
              <MeshReflectorMaterial
                color={MATERIALS.marble.colour}
                roughness={0.26}
                metalness={0.35}
                /* Blur in the reflection is what separates polished stone
                   from a mirror: stone scatters, so the image underfoot is
                   recognisable but soft, and softer with distance. */
                blur={[300, 90]}
                mixBlur={2.4}
                mixStrength={28}
                resolution={reflectionResolution}
                depthScale={1.1}
                minDepthThreshold={0.35}
                maxDepthThreshold={1.25}
                depthToBlurRatioBias={0.28}
                mirror={0}
              />
            </mesh>
          ) : (
            <Surface material="marble" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[ROOM.width, ROOM.depth]} />
            </Surface>
          )}

          {/* ── the Carrara border ─────────────────────────────────
              A white marble band set a metre in from the walls, framing
              the dark field. Two marbles is how a European floor is
              actually laid: the dark stone gives depth, the light band
              draws the geometry of the room so the eye can read its
              shape even at night.                                   */}
          {[
            { p: [0, 0.0015, -ROOM.halfD + 1.06] as [number, number, number], a: [ROOM.width - 1.9, 0.16] as [number, number] },
            { p: [0, 0.0015, ROOM.halfD - 1.06] as [number, number, number], a: [ROOM.width - 1.9, 0.16] as [number, number] },
          ].map((band, i) => (
            <mesh key={`cx${i}`} position={band.p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={band.a} />
              <meshPhysicalMaterial
                color={MATERIALS.carrara.colour}
                roughness={MATERIALS.carrara.roughness}
                metalness={0}
              />
            </mesh>
          ))}
          {[-ROOM.halfW + 1.06, ROOM.halfW - 1.06].map((x) => (
            <mesh key={`cz${x}`} position={[x, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[0.16, ROOM.depth - 1.9]} />
              <meshPhysicalMaterial
                color={MATERIALS.carrara.colour}
                roughness={MATERIALS.carrara.roughness}
                metalness={0}
              />
            </mesh>
          ))}

          {/* a brass band inlaid a metre in from the walls, the way a stone
              floor in a European house is framed rather than simply laid */}
          {[
            { p: [0, 0.002, -ROOM.halfD + 1] as [number, number, number], a: [ROOM.width - 2, 0.03] as [number, number] },
            { p: [0, 0.002, ROOM.halfD - 1] as [number, number, number], a: [ROOM.width - 2, 0.03] as [number, number] },
          ].map((band, i) => (
            <mesh key={`bx${i}`} position={band.p} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={band.a} />
              <meshPhysicalMaterial
                color={MATERIALS.brass.colour}
                roughness={MATERIALS.brass.roughness}
                metalness={1}
              />
            </mesh>
          ))}
          {[-ROOM.halfW + 1, ROOM.halfW - 1].map((x) => (
            <mesh key={`bz${x}`} position={[x, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.03, ROOM.depth - 2]} />
              <meshPhysicalMaterial
                color={MATERIALS.brass.colour}
                roughness={MATERIALS.brass.roughness}
                metalness={1}
              />
            </mesh>
          ))}

          {/* ── pilasters and panels ───────────────────────────────
              The long walls are not flat plaster. They are dressed
              limestone pilasters standing proud of recessed board-formed
              concrete panels, with a hairline shadow gap at every joint.

              This is what makes an interior read as built rather than
              painted: the eye picks up the rhythm of the bays and the
              crisp line where two materials meet, and it reads depth
              even when the room is almost dark.                     */}
          {[-ROOM.halfW + 0.09, ROOM.halfW - 0.09].map((x) => {
            const inward = x < 0 ? 1 : -1;
            return (
              <group key={`bay-${x}`}>
                {/* recessed concrete panels between the pilasters */}
                {[-2.6, 0, 2.6].map((z) => (
                  <Surface
                    key={`panel-${z}`}
                    material={panelMaterial}
                    position={[x + inward * 0.02, ROOM.height / 2 + 0.05, z]}
                    rotation={[0, inward * (Math.PI / 2), 0]}
                    receiveShadow
                  >
                    <planeGeometry args={[2.15, ROOM.height - 0.9]} />
                  </Surface>
                ))}
                {/* the pilasters themselves, standing 90 mm off the wall */}
                {[-3.9, -1.3, 1.3, 3.9].map((z) => (
                  <Surface
                    key={`pilaster-${z}`}
                    material={stoneMaterial}
                    position={[x + inward * 0.055, ROOM.height / 2 + 0.05, z]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.13, ROOM.height - 0.7, 0.46]} />
                  </Surface>
                ))}
                {/* the entablature the pilasters carry */}
                <Surface
                  material={stoneMaterial}
                  position={[x + inward * 0.05, ROOM.height - 0.34, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.16, 0.2, ROOM.depth - 0.2]} />
                </Surface>
              </group>
            );
          })}

          {/* ceiling */}
          <Surface
            material="ceiling"
            position={[0, ROOM.height, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[ROOM.width, ROOM.depth]} />
          </Surface>

          {/* counter wall, z = +4 */}
          <Surface
            material={wallMaterial}
            position={[0, ROOM.height / 2, ROOM.halfD]}
            rotation={[0, Math.PI, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.width, ROOM.height]} />
          </Surface>

          {/* entrance wall, x = −6 */}
          <Surface
            material={wallMaterial}
            position={[-ROOM.halfW, ROOM.height / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.depth, ROOM.height]} />
          </Surface>

          {/* mirror wall, x = +6 */}
          <Surface
            material={wallMaterial}
            position={[ROOM.halfW, ROOM.height / 2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[ROOM.depth, ROOM.height]} />
          </Surface>

          {/* window wall, z = −4, built as piers between the openings so the
              light genuinely comes through gaps in a wall */}
          <group>
            {/* header above the windows */}
            <Surface
              material={wallMaterial}
              position={[0, (WINDOW.sill + WINDOW.straight + WINDOW.arch + ROOM.height) / 2, -ROOM.halfD]}
              receiveShadow
            >
              <planeGeometry
                args={[ROOM.width, ROOM.height - (WINDOW.sill + WINDOW.straight + WINDOW.arch)]}
              />
            </Surface>
            {/* dado below the sills */}
            <Surface material={wallMaterial} position={[0, WINDOW.sill / 2, -ROOM.halfD]} receiveShadow>
              <planeGeometry args={[ROOM.width, WINDOW.sill]} />
            </Surface>
            {/* piers: the solid wall left between the openings, worked out
                from the openings themselves so the two can never disagree */}
            {pierSegments(windowXs).map(([from, to]) => (
              <Surface
                key={`pier-${from}`}
                material={wallMaterial}
                position={[
                  (from + to) / 2,
                  WINDOW.sill + (WINDOW.straight + WINDOW.arch) / 2,
                  -ROOM.halfD,
                ]}
                receiveShadow
              >
                <planeGeometry args={[to - from, WINDOW.straight + WINDOW.arch]} />
              </Surface>
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
