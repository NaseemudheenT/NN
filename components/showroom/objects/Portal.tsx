"use client";

/**
 * The entrance portal.
 *
 * A showroom begins at its door, and the door is the one piece of a flagship
 * that a customer touches before anything else. So it is built properly — and
 * in this house it is built as a massive Romanesque Spanish arch.
 *
 * ── what makes it read as Spanish rather than merely arched ───────────
 * Three things, all of them structural. The head is a TRUE SEMICIRCLE struck
 * from the springing line, so the rise is exactly half the span: that single
 * proportion is the difference between Romanesque weight and Gothic aspiration.
 * The archivolt is a broad band of fired clay — the brief's rich Colonial
 * Brick Red — standing proud of the hand-troweled Antico White stucco around
 * it, because a Mediterranean opening is always framed in a harder material
 * than the wall. And the whole thing is DEEP-SET: 450 mm of reveal, so from
 * the pavement you look down a tunnel of stucco before you reach the glass.
 *
 * That depth is the facade's entire argument. A thin arch is a shape; a deep
 * one is a passage, and the graded shadow running round its soffit is what
 * tells you the wall is made of something.
 *
 * It stands at x = −6, in the entrance wall, and the camera passes through it
 * on the way in. Smoked glass is the point of the leaves — from outside the
 * showroom is a suggestion rather than a display, and you have to come in.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "../materials";
import { Surface, ROOM } from "./Room";
import { BULLNOSE, BullnosedBox, MASONRY, MasonryArch } from "./Masonry";

export const PORTAL = {
  /** Clear opening, metres. Tall enough to feel like an entrance. */
  width: 2.6,
  /** Where the straight jamb stops and the semicircle begins. */
  springing: 2.5,
  /** Total height to the crown: springing plus half the span, by definition. */
  get height() { return this.springing + this.width / 2; },
  /** How far the reveal is recessed. The brief's deep-set opening. */
  reveal: MASONRY.deep,
  /** Width of the brick-red archivolt band. */
  ring: 0.26,
  x: -ROOM.halfW,
} as const;

function Leaf({
  side,
  open,
}: {
  side: -1 | 1;
  /** 0 shut, 1 fully swung. The camera never waits for it. */
  open: number;
}) {
  const w = PORTAL.width / 2 - 0.02;
  // A door swings about its outer jamb, not its centre: the hinge is at the
  // edge, so the group is offset by half a leaf before it is rotated.
  const swing = side * open * 0.62;

  return (
    <group position={[0, 0, side * (PORTAL.width / 2)]} rotation={[0, swing, 0]}>
      <group position={[0, 0, -side * (w / 2)]}>
        {/* the smoked glass */}
        <mesh castShadow>
          <boxGeometry args={[0.032, PORTAL.height - 0.1, w]} />
          <meshPhysicalMaterial
            color={MATERIALS.smokedGlass.colour}
            roughness={MATERIALS.smokedGlass.roughness}
            metalness={0}
            transparent
            opacity={MATERIALS.smokedGlass.opacity}
            transmission={MATERIALS.smokedGlass.transmission}
            ior={MATERIALS.smokedGlass.ior}
            thickness={0.032}
          />
        </mesh>

        {/* brushed stainless stile and rails around the leaf */}
        {[
          { p: [0, (PORTAL.height - 0.1) / 2 - 0.05, 0], a: [0.045, 0.1, w] },
          { p: [0, -(PORTAL.height - 0.1) / 2 + 0.05, 0], a: [0.045, 0.1, w] },
          { p: [0, 0, -side * (w / 2 - 0.04)], a: [0.045, PORTAL.height - 0.1, 0.08] },
        ].map((bar, i) => (
          <Surface
            key={i}
            material="brushedSteel"
            position={bar.p as [number, number, number]}
            castShadow
          >
            <boxGeometry args={bar.a as [number, number, number]} />
          </Surface>
        ))}

        {/* the pull: a champagne-gold tube on stand-offs, at hand height.
            Long pulls are a flagship signature — they say the door is heavy
            and that someone will hold it for you. */}
        <group position={[-0.09, -0.05, side * (w / 2 - 0.22)]}>
          <mesh rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.019, 0.019, 1.15, 16]} />
            <meshPhysicalMaterial
              color={MATERIALS.champagne.colour}
              roughness={MATERIALS.champagne.roughness}
              metalness={1}
            />
          </mesh>
          {[-0.48, 0.48].map((y) => (
            <mesh key={y} position={[0.045, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.011, 0.011, 0.09, 12]} />
              <meshPhysicalMaterial
                color={MATERIALS.champagneBright.colour}
                roughness={MATERIALS.champagneBright.roughness}
                metalness={1}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export function Portal({
  /** 0 at the pavement, 1 once the visitor is through. Drives the swing. */
  progress = 1,
  night,
}: {
  progress?: number;
  night: boolean;
}) {
  const open = Math.min(1, Math.max(0, progress));
  const stucco = night ? "stuccoNight" : "stucco";
  const brickTrim = night ? "brickNight" : "brick";
  const travertine = night ? "travertineNight" : "travertine";

  // The light that falls in through the open door. It is warm because it is
  // the showroom's own light spilling out, not daylight coming in.
  const spill = useMemo(() => new THREE.Color(night ? "#ffc27a" : "#fff0d4"), [night]);

  return (
    <group position={[PORTAL.x, 0, 0]}>
      {/* ── the archivolt ───────────────────────────────────────────
          The band of fired clay that frames the opening, extruded
          through the full 450 mm of reveal so its soffit is a real
          curved surface rather than a painted arc. See ./Masonry. */}
      <MasonryArch
        spec={{
          width: PORTAL.width,
          springing: PORTAL.springing,
          depth: PORTAL.reveal,
          ring: PORTAL.ring,
        }}
        material={stucco}
        ringMaterial={brickTrim}
        position={[PORTAL.reveal / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* ── the stucco around it ────────────────────────────────────
          Hand-troweled Antico White, bullnosed at every arris, built
          as two cheeks and a head so the arch sits in a wall rather
          than floating in a gap. */}
      {[-1, 1].map((side) => (
        <BullnosedBox
          key={`cheek-${side}`}
          width={PORTAL.reveal}
          height={PORTAL.height + 1.1}
          depth={1.5}
          material={stucco}
          position={[
            PORTAL.reveal / 2,
            (PORTAL.height + 1.1) / 2,
            side * (PORTAL.width / 2 + PORTAL.ring + 0.75),
          ]}
          castShadow
          receiveShadow
        />
      ))}
      <BullnosedBox
        width={PORTAL.reveal}
        height={ROOM.height - PORTAL.height - PORTAL.ring}
        depth={PORTAL.width + PORTAL.ring * 2 + 3}
        material={stucco}
        position={[
          PORTAL.reveal / 2,
          (ROOM.height + PORTAL.height + PORTAL.ring) / 2,
          0,
        ]}
        castShadow
        receiveShadow
      />

      {/* ── the keystone ────────────────────────────────────────────
          A single dressed block at the crown, standing proud of the
          ring. Structurally it is the stone that locks an arch; here
          it is also the one place the eye settles as you walk under,
          which is why it is the only cut stone on the facade. */}
      <BullnosedBox
        width={PORTAL.reveal + 0.05}
        height={0.46}
        depth={0.34}
        radius={BULLNOSE.trim}
        material={travertine}
        position={[PORTAL.reveal / 2 + 0.02, PORTAL.height + PORTAL.ring / 2, 0]}
        castShadow
        receiveShadow
      />

      {/* the threshold: a travertine saddle, worn smooth, level with the floor */}
      <mesh position={[PORTAL.reveal / 2, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PORTAL.width + 0.6, PORTAL.reveal]} />
        <meshPhysicalMaterial
          color={MATERIALS.travertine.colour}
          roughness={MATERIALS.travertine.roughness}
          metalness={0}
        />
      </mesh>

      {/* the two leaves */}
      <group position={[PORTAL.reveal - 0.06, PORTAL.height / 2, 0]}>
        <Leaf side={-1} open={open} />
        <Leaf side={1} open={open} />
      </group>

      {/* light spilling through the opening onto the threshold stone */}
      <pointLight
        position={[0.5, 1.9, 0]}
        color={spill}
        intensity={(night ? 5.5 : 2.2) * (0.25 + open * 0.75)}
        distance={5.5}
        decay={2}
      />
    </group>
  );
}
