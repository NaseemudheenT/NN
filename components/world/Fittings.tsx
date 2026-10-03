"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { seeded } from "@/components/showroom/geometry";
import { type Materials } from "@/components/showroom/materials";
import { markTexture } from "./mark-texture";
import { B, FITTING, SEATS, TABLE, TREES } from "./plan";

/** An olive tree — the only thing in the building nobody manufactured. */
function Tree({
  x, z, scale, seed, m, still,
}: {
  x: number; z: number; scale: number; seed: number; m: Materials; still: boolean;
}) {
  const crown = useRef<THREE.Group>(null);
  const blobs = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: 10 }, () => ({
      p: [(rnd() - 0.5) * 1.6, 1.6 + rnd() * 1.4, (rnd() - 0.5) * 1.6] as [number, number, number],
      r: 0.38 + rnd() * 0.36,
    }));
  }, [seed]);

  /* Two frequencies, not one. A single sine reads as a metronome, and
     nothing alive moves on a metronome. */
  useFrame(({ clock }) => {
    if (still || !crown.current) return;
    const t = clock.elapsedTime + seed;
    crown.current.rotation.z = Math.sin(t * 0.34) * 0.016 + Math.sin(t * 0.81) * 0.007;
    crown.current.rotation.x = Math.cos(t * 0.27) * 0.012;
  });

  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.32, 0]} material={m.planter} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.64, 1.25]} />
      </mesh>
      <mesh position={[0, 0.66, 0]} material={m.trunk}>
        <boxGeometry args={[1.1, 0.06, 1.1]} />
      </mesh>
      <group ref={crown}>
        <mesh position={[0, 1.1, 0]} material={m.trunk} castShadow>
          <cylinderGeometry args={[0.09, 0.14, 1.05, 7]} />
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

export function Fittings({ m, still, quality }: { m: Materials; still: boolean; quality: "high" | "low" }) {
  const sign = useMemo(() => markTexture("#c5a059", "#0a0a0a"), []);

  return (
    <group>
      {TREES.map((t) => <Tree key={`${t.x}-${t.z}`} {...t} m={m} still={still} />)}

      {/* ── the presentation table, under the great window ─────── */}
      <group position={[TABLE.x, 0, TABLE.z]}>
        <mesh position={[0, TABLE.height, 0]} material={m.walnut} castShadow receiveShadow>
          <boxGeometry args={[TABLE.width, 0.08, TABLE.depth]} />
        </mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
          <mesh
            key={`${sx}${sz}`}
            position={[(sx * (TABLE.width - 0.24)) / 2, TABLE.height / 2, (sz * (TABLE.depth - 0.24)) / 2]}
            material={m.gold}
            castShadow
          >
            <boxGeometry args={[0.045, TABLE.height, 0.045]} />
          </mesh>
        ))}
      </group>

      {/* ── seats, off the walking line ─────────────────────────── */}
      {SEATS.map((c) => (
        <group key={`${c.x}-${c.z}`} position={[c.x, 0, c.z]} rotation-y={c.rotation}>
          <mesh position={[0, 0.44, 0]} material={m.leather} castShadow receiveShadow>
            <boxGeometry args={[0.82, 0.18, 0.78]} />
          </mesh>
          <mesh position={[0, 0.78, -0.34]} material={m.leather} castShadow>
            <boxGeometry args={[0.82, 0.68, 0.12]} />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.35, 0.175, sz * 0.32]} material={m.gold} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── the signage over the entrance ───────────────────────
          Illuminated champagne-gold lettering on a dark ground, which is
          exactly where the brand board puts gold: on a lit physical sign.
          It is emissive, so it reads at night when nothing else does. */}
      <group position={[0, B.doors.height + 1.5, B.doors.z - 0.48]}>
        <mesh>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial
            map={sign}
            emissive="#c5a059"
            emissiveMap={sign}
            emissiveIntensity={0.8}
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
        <pointLight position={[0, -0.3, 0.8]} intensity={2.2} distance={4} decay={2} color="#e8d4a4" />
      </group>

      {/* ══ the fitting alcove ═══════════════════════════════════
          A recess in the east wall with a real mirror in it — and it is a
          REAL mirror, a planar reflection, not a grey panel. That matters
          more here than anywhere else in the building: a fitting room whose
          mirror shows nothing is a cupboard, and the one thing a customer
          does in one is look. */}
      <group position={[FITTING.x, 0, FITTING.z]}>
        {/* the recess: back, two returns, a soffit */}
        <mesh position={[FITTING.depth, FITTING.height / 2, 0]} rotation-y={-Math.PI / 2} material={m.sand}>
          <planeGeometry args={[FITTING.width, FITTING.height]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[FITTING.depth / 2, FITTING.height / 2, (side * FITTING.width) / 2]}
            rotation-y={side > 0 ? 0 : Math.PI}
            material={m.sand}
          >
            <planeGeometry args={[FITTING.depth, FITTING.height]} />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2} position={[FITTING.depth / 2, FITTING.height, 0]} material={m.sand}>
          <planeGeometry args={[FITTING.depth, FITTING.width]} />
        </mesh>

        {/* the mirror, full height, in a champagne-gold surround */}
        <mesh position={[FITTING.depth - 0.04, 1.35, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[1.5, 2.3]} />
          {quality === "high" ? (
            <MeshReflectorMaterial
              color="#cfd3d6"
              roughness={0.03}
              metalness={0.9}
              resolution={512}
              mixBlur={0.2}
              mixStrength={1.2}
              blur={[60, 20]}
              mirror={0.96}
            />
          ) : (
            <meshStandardMaterial color="#8e979c" roughness={0.08} metalness={0.95} />
          )}
        </mesh>
        <mesh position={[FITTING.depth - 0.02, 1.35, 0]} rotation-y={-Math.PI / 2} material={m.gold}>
          <boxGeometry args={[1.62, 2.42, 0.03]} />
        </mesh>

        {/* the bench */}
        <mesh position={[0.55, 0.44, 0]} material={m.leather} castShadow receiveShadow>
          <boxGeometry args={[0.56, 0.12, 1.5]} />
        </mesh>
        {[-0.6, 0.6].map((dz) => (
          <mesh key={dz} position={[0.55, 0.19, dz]} material={m.gold} castShadow>
            <boxGeometry args={[0.46, 0.38, 0.05]} />
          </mesh>
        ))}

        {/* a curtain track, and the curtain drawn back */}
        <mesh position={[0.1, FITTING.height - 0.2, 0]} rotation-x={Math.PI / 2} material={m.gold}>
          <cylinderGeometry args={[0.018, 0.018, FITTING.width, 10]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0.14, (FITTING.height - 0.3) / 2 + 0.1, (side * FITTING.width) / 2 - side * 0.3]}
            material={m.leather}
            castShadow
          >
            <boxGeometry args={[0.1, FITTING.height - 0.5, 0.55]} />
          </mesh>
        ))}
      </group>

      {/* ══ the atelier case ═════════════════════════════════════
          The four places the brand board puts gold — the woven label, the
          hangtag, the engraved button, the packaging — in a lit case on the
          west wall, which is the only part of this building where gold is
          the point rather than the trim. */}
      <group position={[-B.aisle.x + 0.25, 0, -12.6]}>
        <mesh position={[0, 0.95, 0]} material={m.walnut} castShadow receiveShadow>
          <boxGeometry args={[0.45, 1.9, 2.6]} />
        </mesh>
        <mesh position={[0.24, 1.35, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[2.3, 0.9]} />
          <meshPhysicalMaterial
            color="#aebcc4" roughness={0.05} transmission={0.9} thickness={0.02}
            transparent opacity={0.3}
          />
        </mesh>
        {[-0.75, -0.25, 0.25, 0.75].map((dz, i) => (
          <mesh key={dz} position={[0.14, 1.3, dz]} material={i % 2 ? m.gold : m.goldDark} castShadow>
            {i % 2 ? <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} /> : <boxGeometry args={[0.02, 0.2, 0.13]} />}
          </mesh>
        ))}
        <pointLight position={[0.5, 1.8, 0]} intensity={2.4} distance={3} decay={2} color="#ffe9c4" />
      </group>

      {/* ── a runner down the nave, so the floor is not one slab ── */}
      {quality === "high" ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, -6]} receiveShadow>
          <planeGeometry args={[2.6, 22]} />
          <meshStandardMaterial color="#231d18" roughness={0.94} metalness={0} />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * What is outside the windows.
 *
 * Nothing but light.
 *
 * There was a cathedral and a city out there, and it was wrong — not badly
 * drawn, wrong in kind. Standing inside a stone hall looking out, your eye
 * is adapted to the interior, so the exterior is one to two STOPS past
 * anything in the room: it blows out. You do not read architecture through
 * a window from inside a dark hall; you read a shape of blinding light with
 * a hint of something at the bottom of it. Putting legible buildings there
 * makes the window a painting hanging on the wall, which is the one thing
 * a window must never become.
 *
 * So: a sky painted hot, a band of haze where the ground would be, and the
 * windows' own glare. The room is the subject. The window is the light.
 */
export function Outside({ tint, lampLevel }: { tint: THREE.Color; lampLevel: number }) {
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
  }, []);

  useMemo(() => {
    const ctx = sky.canvas.getContext("2d");
    if (!ctx) return;
    const day = 1 - lampLevel;
    const mix = (night: number, noon: number) => Math.round(night + (noon - night) * day);
    const warm = (c: number) => Math.round(Math.min(1, c) * 255);
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    /* Deliberately past white at the horizon band. The tone mapper pulls it
       back to a glare with a little colour left in it, which is exactly what
       an over-exposed window looks like in a photograph of a dark room. */
    g.addColorStop(0, `rgb(${mix(16, 128)} ${mix(24, 168)} ${mix(44, 226)})`);
    g.addColorStop(0.46, `rgb(${mix(32, 196)} ${mix(40, 216)} ${mix(62, 242)})`);
    g.addColorStop(0.74, `rgb(${mix(52, 252)} ${mix(54, 250)} ${mix(70, 248)})`);
    g.addColorStop(0.9, `rgb(${mix(60, warm(tint.r * 1.35))} ${mix(56, warm(tint.g * 1.3))} ${mix(70, warm(tint.b * 1.2))})`);
    g.addColorStop(1, `rgb(${mix(34, 214)} ${mix(32, 196)} ${mix(40, 170)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    sky.tex.needsUpdate = true;
  }, [sky, tint, lampLevel]);

  return (
    <group>
      <mesh position={[0, 48, B.endWall.z - 150]}>
        <planeGeometry args={[620, 340]} />
        <meshBasicMaterial map={sky.tex} toneMapped={false} fog={false} />
      </mesh>

      {/* A soft band of haze just above the sill line. It is the only thing
          out there with any structure, and all it does is stop the sky
          meeting the window frame as a hard edge — which is the giveaway
          that there is a plane two metres behind the glass. */}
      <mesh position={[0, 4, B.endWall.z - 42]}>
        <planeGeometry args={[220, 26]} />
        <meshBasicMaterial
          color={tint.clone().lerp(new THREE.Color("#ffffff"), 0.55)}
          transparent
          opacity={0.5 * (1 - lampLevel)}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
