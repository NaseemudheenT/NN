"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Billboard, Cloud, Sky as DreiSky, Stars } from "@react-three/drei";

/**
 * NN TOWER — the sky it stands under.
 *
 * ── the sky is scattered, not painted ────────────────────────────────
 * `<Sky>` is a Preetham atmospheric-scattering shader: it computes Rayleigh
 * scattering (why the zenith is blue and the horizon is not) and Mie
 * scattering (why there is a bright halo round a low sun) from a real sun
 * vector and a turbidity figure. A painted gradient can be made to look
 * similar in one still and then falls apart the moment the camera orbits,
 * because the gradient does not know where the sun is. This does.
 *
 * ── the sun in the sky and the sun casting shadows are the same sun ──
 * `SUN` is exported and the lighting rig reads it. If the sky shows a low
 * sun in the west while the shadows fall as though it were overhead, the
 * eye catches it instantly even if the viewer cannot say why. One vector,
 * both places.
 *
 * ── why dusk ─────────────────────────────────────────────────────────
 * A 10° sun is the hour that carves a classical facade: long shadows in
 * every reveal, a warm key on the stone, and interior light bright enough
 * to read against the sky. At noon the same cornice flattens to a stripe.
 */

/** The sun. Low, west, dusk. Shared with the lighting rig. */
export const SUN = new THREE.Vector3(62, 13.5, 44);

/** Opposite and higher — a moon already up before the sun is down. */
export const MOON = new THREE.Vector3(-58, 46, -34);

export function Sky({ quality }: { quality: "high" | "medium" | "low" }) {
  const sunNorm = useMemo(() => SUN.clone().normalize().multiplyScalar(420), []);
  const moonPos = useMemo(() => MOON.clone().normalize().multiplyScalar(380), []);

  /* The moon's face. A plain emissive disc reads as a sticker, so the
     surface carries maria — the dark basalt seas — as a generated map. It
     is three hundred metres away and four pixels across most of the time,
     and it still matters: the eye knows what a moon looks like. */
  const moonMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const S = 128;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d8d4cb";
    g.fillRect(0, 0, S, S);
    let seed = 3;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    for (let i = 0; i < 26; i++) {
      const r = 4 + rnd() * 17;
      g.globalAlpha = 0.1 + rnd() * 0.16;
      g.fillStyle = "#8d8a84";
      g.beginPath();
      g.arc(rnd() * S, rnd() * S, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <group>
      {/* The atmosphere itself. Turbidity 7 is a clear evening with some
          haze; rayleigh 2.4 keeps the zenith deep without going black. */}
      <DreiSky
        distance={4500}
        sunPosition={[sunNorm.x, sunNorm.y, sunNorm.z]}
        turbidity={7}
        rayleigh={2.4}
        mieCoefficient={0.009}
        mieDirectionalG={0.82}
      />

      {/* Stars, only where the sky is already dark enough to hold them. */}
      <Stars radius={320} depth={60} count={quality === "low" ? 900 : 2600} factor={3.4} saturation={0} fade speed={0.3} />

      {/* The sun's disc, sitting inside the scattering halo the sky shader
          already draws around it. */}
      <Billboard position={sunNorm.toArray()}>
        <mesh>
          <circleGeometry args={[16, 32]} />
          <meshBasicMaterial color="#fff2d2" toneMapped={false} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <circleGeometry args={[46, 32]} />
          <meshBasicMaterial color="#ffb877" toneMapped={false} transparent opacity={0.16} />
        </mesh>
      </Billboard>

      {/* The moon. */}
      <Billboard position={moonPos.toArray()}>
        <mesh>
          <circleGeometry args={[11, 48]} />
          <meshBasicMaterial map={moonMap ?? undefined} color="#eceae4" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <circleGeometry args={[26, 32]} />
          <meshBasicMaterial color="#b9c8e2" toneMapped={false} transparent opacity={0.1} />
        </mesh>
      </Billboard>

      {/* Cloud banks, low and near the horizon where evening cloud actually
          sits, lit warm on the sun side and cool away from it. */}
      {quality !== "low" && (
        <>
          <Cloud position={[90, 62, -120]} speed={0.1} opacity={0.3} segments={26}
            bounds={[46, 9, 14]} volume={11} color="#ffcba1" />
          <Cloud position={[-130, 74, -90]} speed={0.08} opacity={0.22} segments={22}
            bounds={[52, 8, 16]} volume={10} color="#9fb0cd" />
          <Cloud position={[-40, 86, 150]} speed={0.07} opacity={0.18} segments={20}
            bounds={[60, 7, 18]} volume={9} color="#c9b6c6" />
        </>
      )}
    </group>
  );
}
