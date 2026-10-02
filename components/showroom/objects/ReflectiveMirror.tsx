"use client";

/**
 * The full-length mirror, actually reflecting.
 *
 * A mirror that does not reflect is a grey rectangle, and a grey rectangle on
 * a showroom wall is the single most obvious tell that a space is modelled
 * rather than photographed. It is also the one object in the room whose
 * entire purpose is to show you something else — a wall can be flat and still
 * be a wall; a mirror cannot.
 *
 * ── what it was, and why that was not enough ─────────────────────────
 * The placeholder used a very smooth metal with envMapIntensity turned up,
 * which reflects the procedural environment — a handful of lightformers.
 * That reads correctly at a grazing angle and costs nothing, which is why it
 * was the right first answer. But walk the camera to the mirror viewpoint,
 * which is where the rig deliberately sends people, and you are looking at it
 * nearly head-on, and head-on it shows you a soft grey nothing where the room
 * should be.
 *
 * So this is a real planar reflection: a second render of the scene from the
 * mirrored camera position. Stand in front of it and the arcade, the lit
 * niches and the garments are all in there.
 *
 * ── the cost, stated honestly ────────────────────────────────────────
 * One extra full render pass per frame. That is the most expensive single
 * thing in the room, more than the depth of field, and it is why this is
 * high-tier only and why the reflection renders at half resolution — a
 * mirror image is judged on what is in it, not on how sharp it is, and
 * nobody has ever walked up to a mirror in a shop and checked its pixel
 * density.
 *
 * Below the top tier it falls back to the smooth-metal version, which is
 * the same object lit the same way and simply does not carry the room.
 */

import { MeshReflectorMaterial } from "@react-three/drei";
import { MATERIALS } from "../materials";

const GLASS = { width: 0.92, height: 2.16 } as const;

export function ReflectiveMirror({
  position = [0, 0, 0] as [number, number, number],
  rotation = 0,
  /** Real reflection on high only; smooth metal everywhere else. */
  quality = "high",
}: {
  position?: [number, number, number];
  rotation?: number;
  quality?: "low" | "medium" | "high";
}) {
  const real = quality === "high";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <planeGeometry args={[GLASS.width, GLASS.height]} />
        {real ? (
          <MeshReflectorMaterial
            /* mirror = 1 is a true mirror; the floor uses 0, which is why
               the floor returns a bloom of the lights and this returns the
               room itself. */
            mirror={1}
            /* Silvered glass is not perfect. A trace of blur and a roughness
               floor keep it from looking like a hole cut in the wall, which
               is what mirror={1} with zero roughness actually looks like. */
            blur={[128, 48]}
            mixBlur={0.9}
            mixStrength={1.6}
            resolution={512}
            roughness={0.04}
            metalness={0.9}
            depthScale={0.2}
            minDepthThreshold={0.85}
            maxDepthThreshold={1}
            color={MATERIALS.mirror.colour}
          />
        ) : (
          <meshPhysicalMaterial
            color={MATERIALS.mirror.colour}
            roughness={0.03}
            metalness={1}
            envMapIntensity={1.4}
          />
        )}
      </mesh>

      {/* bronze frame, four members */}
      {[
        { p: [0, 1.11, -0.02], a: [1.02, 0.06, 0.05] },
        { p: [0, -1.11, -0.02], a: [1.02, 0.06, 0.05] },
        { p: [-0.48, 0, -0.02], a: [0.06, 2.28, 0.05] },
        { p: [0.48, 0, -0.02], a: [0.06, 2.28, 0.05] },
      ].map((bar, i) => (
        <mesh key={i} position={bar.p as [number, number, number]} castShadow>
          <boxGeometry args={bar.a as [number, number, number]} />
          <meshPhysicalMaterial
            color={MATERIALS.bronze.colour}
            roughness={MATERIALS.bronze.roughness}
            metalness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
