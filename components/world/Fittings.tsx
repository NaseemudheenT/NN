"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "@/components/showroom/geometry";
import { type Materials } from "@/components/showroom/materials";
import { markTexture } from "./mark-texture";
import { B, SEATS, TABLE, TREES } from "./plan";

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
 * An arched opening with nothing behind it reads as a hole in a wall; one
 * with a cathedral half a kilometre away reads as a window. That difference
 * is the whole illusion of standing somewhere, which is why this exists.
 *
 * Everything out here opts out of the interior's fog. Exponential fog at
 * the hall's density is 98% opaque by 240 m, so with it applied the great
 * window rendered as a flat smear of fog colour. Outdoors, aerial
 * perspective lives in the COLOURS instead: distant things are mixed toward
 * the sky, and they get paler through the day rather than darker, because
 * haze between you and a thing scatters daylight into it.
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

  /* Painted HOT. Standing inside a stone hall looking out, the exterior is
     one to two stops past anything in the room — your eye is adapted to the
     interior, so the window reads as near-white with only the darkest
     things outside holding any detail. A sky painted at the value it "is"
     renders as a flat navy panel and the window stops being a window. */
  useMemo(() => {
    const ctx = sky.canvas.getContext("2d");
    if (!ctx) return;
    const day = 1 - lampLevel;
    const mix = (night: number, noon: number) => Math.round(night + (noon - night) * day);
    const warm = (c: number) => Math.round(Math.min(1, c) * 255);
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, `rgb(${mix(14, 104)} ${mix(20, 148)} ${mix(40, 212)})`);
    g.addColorStop(0.5, `rgb(${mix(28, 168)} ${mix(36, 196)} ${mix(58, 232)})`);
    g.addColorStop(0.82, `rgb(${mix(44, 224)} ${mix(48, 230)} ${mix(66, 238)})`);
    g.addColorStop(1, `rgb(${mix(52, warm(tint.r))} ${mix(50, warm(tint.g))} ${mix(62, warm(tint.b))})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    sky.tex.needsUpdate = true;
  }, [sky, tint, lampLevel]);

  const far = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: new THREE.Color("#141821").lerp(new THREE.Color("#7f93b0"), 1 - lampLevel),
      fog: false,
    }),
    [lampLevel],
  );
  const near = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0b0e14").lerp(new THREE.Color("#2b3340"), 1 - lampLevel),
      fog: false,
    }),
    [lampLevel],
  );

  return (
    <group>
      <mesh position={[0, 54, B.endWall.z - 200]}>
        <planeGeometry args={[760, 400]} />
        <meshBasicMaterial map={sky.tex} toneMapped={false} fog={false} />
      </mesh>

      {/* The cathedral, set OFF the nave's axis and well back. Dead centre
          and close it filled the great window edge to edge, leaving no sky
          at all — and a window with no sky in it is a painting. */}
      <group position={[-13, 0, B.endWall.z - 168]}>
        <mesh position={[0, 11, 0]} material={near}><boxGeometry args={[21, 22, 14]} /></mesh>
        {[-7.4, 7.4].map((x) => (
          <group key={x}>
            <mesh position={[x, 21, 1.5]} material={near}><boxGeometry args={[6, 42, 6]} /></mesh>
            <mesh position={[x, 49, 1.5]} material={near}><coneGeometry args={[4.6, 16, 4]} /></mesh>
          </group>
        ))}
        <mesh position={[0, 30, 0]} material={near}><coneGeometry args={[5.6, 20, 8]} /></mesh>
        <mesh position={[0, 23, 0]} rotation-y={Math.PI / 4} material={near}><coneGeometry args={[11.5, 9, 4]} /></mesh>
      </group>

      {[
        [16, 7, -186], [27, 10, -214], [-32, 8, -202], [38, 6, -176],
        [-48, 9, -232], [52, 11, -244], [8, 5, -252], [-20, 6, -268],
      ].map(([x, h, z]) => (
        <mesh key={`${x}-${z}`} position={[x, h, B.endWall.z + z]} material={far}>
          <boxGeometry args={[11 + (h % 5) * 3, h * 2, 11]} />
        </mesh>
      ))}

      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, B.endWall.z - 150]} material={far}>
        <planeGeometry args={[760, 300]} />
      </mesh>
    </group>
  );
}
