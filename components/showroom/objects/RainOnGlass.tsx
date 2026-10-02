"use client";

/**
 * Rain on the window, when it is actually raining where the visitor is.
 *
 * The weather has been reaching the lighting for a while — cloud dims the
 * beam, the lamps come up on a grey afternoon — but none of it was visible.
 * A customer in Chennai during a downpour saw a room that had quietly gone
 * dim and warm for reasons they could not see. This is the reason, on the
 * glass.
 *
 * ── it is on the pane, not in the air ────────────────────────────────
 * The instinct is falling particles, and that is the wrong model for an
 * interior. From inside a building you do not see rain; you see what it does
 * to the window. Droplets hold still, swell as they gather more, and then
 * break and run — leaving a clear track that the next drops follow. Falling
 * geometry outside the glass would be both more expensive and less like what
 * anybody has ever actually looked at from indoors.
 *
 * So this is a shader on a plane sitting in the glazing: static beads with a
 * handful of runnels among them, and no particle system anywhere.
 *
 * ── what makes a drop read as water ──────────────────────────────────
 * Not its shape — a circle is a circle. It is that a drop is a LENS. It
 * gathers the bright thing behind it, which from inside a dark room is the
 * sky, and concentrates it into a small intense highlight offset toward the
 * light. The code below brightens each bead by the window's own colour for
 * exactly that reason; a flat grey circle reads as dirt on the glass, which
 * is a real thing but not the thing being drawn.
 *
 * ── and it is honest about strength ──────────────────────────────────
 * Drizzle is not a thunderstorm. Density and the number of runnels come from
 * the actual precipitation reading and the WMO code, so light rain is a few
 * beads and heavy rain is a running sheet. Showing a storm to someone in
 * light drizzle would be the same class of lie as showing them Spanish
 * weather.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WeatherState } from "@/lib/weather";
import { WINDOW } from "./Room";

/** WMO codes, roughly bucketed by how hard it is coming down. */
function intensityFor(weather: WeatherState): number {
  if (!weather.raining && !weather.snowing) return 0;
  const { code, precipitation } = weather;
  // Heavy rain, showers, thunderstorm.
  if (code >= 95 || code === 65 || code === 82) return 1;
  if (code === 63 || code === 81) return 0.72;
  if (code === 61 || code === 80) return 0.5;
  // Drizzle.
  if (code >= 51 && code <= 57) return 0.3;
  // Fall back on the measured millimetres when the code is unfamiliar.
  return Math.min(1, 0.25 + precipitation * 0.18);
}

function rainMaterial(tint: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: tint },
      /** 0 dry, 1 streaming. */
      uStrength: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uStrength;
      uniform vec3  uTint;
      varying vec2  vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      /* One cell of beads. Each cell holds a drop at a random offset and
         size, which is cheaper and more convincing than scattering points:
         real droplets are roughly evenly spaced because each one drains the
         glass around it. */
      float beads(vec2 uv, float scale, float seed) {
        vec2 g = uv * scale;
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;

        float r1 = hash(id + seed);
        float r2 = hash(id + seed + 7.3);
        float r3 = hash(id + seed + 19.1);

        // Thin the field out as the rain eases.
        if (r3 > uStrength * 0.85 + 0.1) return 0.0;

        vec2 centre = vec2(r1 - 0.5, r2 - 0.5) * 0.62;
        float radius = 0.12 + r3 * 0.2;
        float d = length(f - centre);
        return smoothstep(radius, radius * 0.35, d);
      }

      /* A runnel: a drop heavy enough to break and run, leaving a track.
         It accelerates — water on glass does not fall at a constant rate,
         it picks up as it gathers what is already there. */
      float runnel(vec2 uv, float seed) {
        float lane = floor(uv.x * 9.0 + seed);
        float r = hash(vec2(lane, seed));
        if (r > uStrength * 0.55) return 0.0;

        float speed = 0.12 + r * 0.26;
        // t accelerates with distance fallen.
        float t = fract(uTime * speed + r * 10.0);
        float head = 1.0 - t * t;

        float x = fract(uv.x * 9.0 + seed) - 0.5;
        // The track wavers; a dead-straight line is a scratch, not water.
        x += sin(uv.y * 14.0 + r * 6.2) * 0.06;

        float across = smoothstep(0.08, 0.0, abs(x));
        float along  = smoothstep(0.1, 0.0, abs(uv.y - head));
        // The wet trail left behind the head, fading as it dries.
        float trail  = smoothstep(0.0, 0.5, head - uv.y) * 0.22 * across;
        return across * along + trail;
      }

      void main() {
        if (uStrength < 0.01) discard;

        float w =
          beads(vUv, 26.0, 0.0) * 0.55 +
          beads(vUv, 41.0, 4.7) * 0.35;
        w += runnel(vUv, 0.0) + runnel(vUv, 3.1);
        w = clamp(w, 0.0, 1.0);

        if (w < 0.01) discard;

        /* A drop is a LENS. It gathers the sky behind it into a small
           bright point, which is why this brightens toward the window's own
           colour rather than painting grey. */
        float a = w * (0.1 + uStrength * 0.26);
        gl_FragColor = vec4(uTint * (0.6 + w * 0.8), a);
      }
    `,
  });
}

export function RainOnGlass({
  weather,
  windowColour,
  windowXs,
  quality,
}: {
  weather: WeatherState;
  windowColour: string;
  windowXs: readonly number[];
  quality: "low" | "medium" | "high";
}) {
  const strength = intensityFor(weather);
  const tint = useMemo(() => new THREE.Color(windowColour), [windowColour]);

  const materials = useRef<THREE.ShaderMaterial[]>([]);
  const mats = useMemo(() => {
    materials.current = windowXs.map(() => rainMaterial(tint));
    return materials.current;
  }, [windowXs, tint]);

  useFrame((state) => {
    for (const m of materials.current) {
      m.uniforms.uTime.value = state.clock.elapsedTime;
      /* Eased rather than set, so a change in the forecast arrives as the
         rain starting rather than as it appearing. */
      const u = m.uniforms.uStrength;
      u.value += (strength - u.value) * 0.015;
    }
  });

  // Dry, or a device with better things to do with its fragments.
  if (strength <= 0 || quality === "low") return null;

  return (
    <group>
      {windowXs.map((x, i) => (
        <mesh
          key={x}
          material={mats[i]}
          /* On the inner face of the glazing, which is where condensation
             and run actually sit from the viewer's side. */
          position={[x, WINDOW.sill + WINDOW.straight / 2, -4 + 0.09]}
          renderOrder={3}
        >
          <planeGeometry args={[WINDOW.width * 0.98, WINDOW.straight]} />
        </mesh>
      ))}
    </group>
  );
}
