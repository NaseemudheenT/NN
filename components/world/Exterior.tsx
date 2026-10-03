"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { archPath, pierceWall, seeded } from "@/components/showroom/geometry";
import { type Materials } from "@/components/showroom/materials";
import { markTexture } from "./mark-texture";
import { B, FACADE } from "./plan";

/**
 * The street, and the face the building shows it.
 *
 * It exists for about eight seconds. The camera comes down the street,
 * swings round the facade, and goes in — and then nobody ever looks at it
 * again. That is not a reason to build it badly; it is a reason to build
 * exactly the parts a camera in motion can see and nothing else.
 *
 * So: the entrance bay in full, with real depth in its reveal, lit
 * lettering, and two windows glowing from the lobby behind them. The flanks
 * are a cornice, a plinth and a rhythm of pilasters, because a moving
 * camera reads rhythm and silhouette and nothing finer. No interior behind
 * the flanks, no roof, no back.
 *
 * ── on the windows ───────────────────────────────────────────────────
 * Seen from a dark street, a lit interior is the brightest thing in the
 * frame — the exact inverse of standing inside looking out. The glass is
 * therefore emissive and well past white, so the bloom pass catches it and
 * the building reads as OCCUPIED. A dark window is an empty building, and
 * an empty building is the wrong first impression for a shop.
 */
export function Exterior({ m, lampLevel }: { m: Materials; lampLevel: number }) {
  const warmth = 0.35 + lampLevel * 0.65;

  const facade = useMemo(
    () =>
      pierceWall(FACADE.width, FACADE.height, FACADE.thickness, [
        archPath(0, B.doors.width, B.doors.height, 0),
        ...FACADE.windows.map((w) => archPath(w.cx, w.width, w.height, w.sill)),
      ]),
    [],
  );

  const sign = useMemo(() => markTexture("#e8d4a4", "#13100c"), []);

  /* Cobbles: one instanced grid, jittered from a seed so the street is the
     same street on every visit. */
  const cobbles = useMemo(() => {
    const rnd = seeded(5150);
    return Array.from({ length: 170 }, () => ({
      x: (rnd() - 0.5) * 54,
      z: FACADE.z + 3 + rnd() * 30,
      s: 0.5 + rnd() * 0.5,
      r: rnd() * Math.PI,
      v: 0.72 + rnd() * 0.5,
    }));
  }, []);

  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a2a18",
        emissive: "#ffb963",
        emissiveIntensity: 2.6 * warmth,
        roughness: 0.3,
        metalness: 0,
      }),
    [warmth],
  );

  return (
    <group>
      {/* ── the facade ─────────────────────────────────────────── */}
      <mesh
        geometry={facade}
        position={[0, 0, FACADE.z]}
        material={m.stone}
        castShadow
        receiveShadow
      />

      {/* the lit glass behind each window, set back in its reveal */}
      {FACADE.windows.map((w) => (
        <mesh key={w.cx} position={[w.cx, w.sill + w.height * 0.46, FACADE.z + 0.1]} material={glass}>
          <planeGeometry args={[w.width - 0.2, w.height - w.width / 2 - 0.2]} />
        </mesh>
      ))}

      {/* ── the entrance bay: pilasters, a lintel, a lamp each side ── */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (B.doors.width / 2 + 0.85), 0, FACADE.z + FACADE.thickness]}>
          <mesh position={[0, B.doors.height / 2 + 0.4, 0.14]} material={m.stone} castShadow receiveShadow>
            <boxGeometry args={[0.9, B.doors.height + 0.8, 0.28]} />
          </mesh>
          {/* a capital */}
          <mesh position={[0, B.doors.height + 0.9, 0.2]} material={m.stone} castShadow>
            <boxGeometry args={[1.14, 0.26, 0.42]} />
          </mesh>
          {/* the lamp: a small warm fixture, and the light it actually throws */}
          <mesh position={[side * 0.42, 3.2, 0.34]} material={m.goldDark} castShadow>
            <boxGeometry args={[0.16, 0.5, 0.16]} />
          </mesh>
          <mesh position={[side * 0.42, 3.2, 0.34]}>
            <boxGeometry args={[0.11, 0.42, 0.11]} />
            <meshStandardMaterial
              color="#2a1f12"
              emissive="#ffc072"
              emissiveIntensity={3.4 * warmth}
              roughness={0.6}
            />
          </mesh>
          <pointLight position={[side * 0.42, 3.2, 0.7]} intensity={5 * warmth} distance={9} decay={2} color="#ffb765" />
        </group>
      ))}

      {/* ── the lintel and the lit lettering ───────────────────── */}
      <mesh position={[0, B.doors.height + 0.9, FACADE.z + FACADE.thickness + 0.22]} material={m.stone} castShadow>
        <boxGeometry args={[B.doors.width + 2.6, 0.3, 0.46]} />
      </mesh>
      <group position={[0, FACADE.sign.y, FACADE.z + FACADE.thickness + 0.12]}>
        <mesh>
          <planeGeometry args={[2.0, 1.6]} />
          <meshStandardMaterial
            map={sign}
            emissive="#c5a059"
            emissiveMap={sign}
            emissiveIntensity={1.9}
            roughness={0.42}
            metalness={0.6}
            transparent
          />
        </mesh>
        <pointLight position={[0, -0.9, 1.1]} intensity={4.4} distance={6} decay={2} color="#e8d4a4" />
      </group>

      {/* ── cornice, plinth, and the rhythm of pilasters along the flanks ── */}
      <mesh position={[0, FACADE.height - 0.5, FACADE.z + FACADE.thickness + 0.3]} material={m.stone} castShadow>
        <boxGeometry args={[FACADE.width + 1.4, 1.0, 0.9]} />
      </mesh>
      <mesh position={[0, 0.3, FACADE.z + FACADE.thickness + 0.2]} material={m.stone} receiveShadow>
        <boxGeometry args={[FACADE.width + 0.8, 0.6, 0.7]} />
      </mesh>
      {[-12.4, -5.2, 5.2, 12.4].map((x) => (
        <mesh key={x} position={[x, 7.4, FACADE.z + FACADE.thickness + 0.1]} material={m.stone} castShadow>
          <boxGeometry args={[1.0, 13.6, 0.22]} />
        </mesh>
      ))}

      {/* ── the steps up to the threshold ──────────────────────── */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0, 0.09 + i * 0.0, FACADE.z + FACADE.thickness + 0.9 + i * 0.52]}
          material={m.marbleLight}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[B.doors.width + 3.4 - i * 0.6, 0.18 - i * 0.055, 0.56]} />
        </mesh>
      ))}

      {/* ── the street ─────────────────────────────────────────── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, FACADE.z + 20]} receiveShadow>
        <planeGeometry args={[90, 56]} />
        <meshStandardMaterial color="#1b1712" roughness={0.78} metalness={0.05} />
      </mesh>
      {cobbles.map((c, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={c.r} position={[c.x, 0.002, c.z]}>
          <planeGeometry args={[c.s, c.s]} />
          <meshStandardMaterial
            color={new THREE.Color("#2b241b").multiplyScalar(c.v)}
            roughness={0.62}
            metalness={0.06}
          />
        </mesh>
      ))}

      {/* ── two clipped bays opposite, so the street has a street ──
          Silhouette only. A camera that never crosses the road cannot read
          anything finer, and anything finer is frames nobody sees. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 30, 0, FACADE.z + 26]} rotation-y={side * -0.22}>
          <mesh position={[0, 8, 0]} material={m.sand} receiveShadow>
            <boxGeometry args={[22, 16, 10]} />
          </mesh>
          {[2.6, 6.4].map((y) =>
            [-6, -2, 2, 6].map((x) => (
              <mesh key={`${y}-${x}`} position={[x, y, -5.06]}>
                <planeGeometry args={[1.1, 2.0]} />
                <meshStandardMaterial
                  color="#241a10"
                  emissive="#ffb463"
                  emissiveIntensity={(y > 4 ? 0.7 : 1.5) * warmth}
                  roughness={0.5}
                />
              </mesh>
            )),
          )}
        </group>
      ))}

      {/* ── planters either side of the door, as on the brand board ── */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (B.doors.width / 2 + 2.3), 0, FACADE.z + FACADE.thickness + 1.5]}>
          <mesh position={[0, 0.36, 0]} material={m.planter} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.72, 0.9]} />
          </mesh>
          <mesh position={[0, 1.5, 0]} material={m.foliage} castShadow>
            <coneGeometry args={[0.52, 1.9, 7]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * The sky, as a dome rather than a plane.
 *
 * A plane behind the great window worked while the camera never left the
 * building. The intro takes it outside and swings it through a hundred and
 * forty degrees, at which point a plane is a billboard that rotates with
 * you. A sphere is the actual shape of the sky and costs the same.
 */
export function SkyDome({ tint, lampLevel }: { tint: THREE.Color; lampLevel: number }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
  }, []);

  useMemo(() => {
    const ctx = texture.canvas.getContext("2d");
    if (!ctx) return;
    const day = 1 - lampLevel;
    const mix = (night: number, noon: number) => Math.round(night + (noon - night) * day);
    const warm = (c: number) => Math.round(Math.min(1, c * 1.3) * 255);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, `rgb(${mix(10, 96)} ${mix(16, 142)} ${mix(34, 214)})`);
    g.addColorStop(0.42, `rgb(${mix(22, 168)} ${mix(30, 198)} ${mix(52, 238)})`);
    g.addColorStop(0.72, `rgb(${mix(40, 236)} ${mix(42, 238)} ${mix(58, 244)})`);
    g.addColorStop(0.88, `rgb(${mix(54, warm(tint.r))} ${mix(50, warm(tint.g))} ${mix(62, warm(tint.b))})`);
    g.addColorStop(1, `rgb(${mix(18, 148)} ${mix(16, 128)} ${mix(22, 110)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    texture.tex.needsUpdate = true;
  }, [texture, tint, lampLevel]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[320, 24, 20]} />
      <meshBasicMaterial map={texture.tex} toneMapped={false} fog={false} side={THREE.FrontSide} />
    </mesh>
  );
}
