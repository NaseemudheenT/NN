"use client";

/**
 * Sunlight, made visible.
 *
 * The one thing every photograph of a real Mediterranean showroom has and no
 * raw render does: shafts of light leaning in through the windows and landing
 * on the floor. Air is not empty — it carries dust, and dust is what you are
 * actually seeing when you see a beam of light. A renderer gives you the lit
 * floor without the beam that got there, and the result is a room that is
 * correctly lit and still looks computed.
 *
 * ── why these are built rather than post-processed ───────────────────
 * The obvious tool is the GodRays pass, and it is the wrong one here. GodRays
 * works radially from a single bright object in frame — a sun, a lamp — and
 * fails for a wall of four separate windows, each throwing its own parallel
 * shaft in the same direction. Worse, it only produces rays where its source
 * is actually visible on screen, so the shafts would vanish the moment the
 * camera turned away from the windows, which is most of the time.
 *
 * So each shaft is geometry: a slab the width of its window, extruded along
 * the real sun direction, drawn additively, and faded along its length. It
 * costs four transparent quads and it works from every angle.
 *
 * ── and why they track the actual sun ────────────────────────────────
 * The direction comes from lib/daytime's solar position, the same calculation
 * that drives the key light — so at nine in the morning the shafts lean one
 * way across the floor and by five they lean the other, and in December they
 * come in lower than in June. They are not an effect layered on top of the
 * chrono engine; they are that engine made visible, which is the whole point
 * of having built it.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { temperatureToHex, type SkyState } from "@/lib/daytime";
import { windowSunDirection } from "../lightingRig";
import { ROOM, WINDOW } from "./Room";

/** Where the windows are, from Room. */
const WINDOW_XS = [-4.4, -1.5, 1.5, 4.4];

/** How far a shaft travels before it has faded out entirely, in metres. */
const REACH = 11;

/**
 * The shaft material.
 *
 * Additive, depth-tested but not depth-written, and faded at both ends. The
 * two details that decide whether this reads as light or as a plastic wedge:
 *
 *  · It must not WRITE depth. A transparent additive slab that writes depth
 *    occludes everything behind it, so the garments on the far rail would
 *    disappear wherever a shaft crossed them.
 *  · It fades toward the window as well as away from it. A beam that starts
 *    at full strength has a hard edge at the glass, which no real shaft has —
 *    the air near an opening is lit from every direction and the beam only
 *    separates from it a little way in.
 */
function shaftMaterial(colour: THREE.Color, strength: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColour: { value: colour },
      uStrength: { value: strength },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3  uColour;
      uniform float uStrength;
      uniform float uTime;
      varying vec2  vUv;
      varying vec3  vLocal;

      /* Cheap value noise. This is the dust: without some variation along
         the beam it reads as a solid wedge of plastic, and a full noise
         texture is a download for something nobody looks at directly. */
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        /* Along the shaft: ramp up out of the window, then fall away. */
        float along = vUv.y;
        float entry = smoothstep(0.0, 0.18, along);
        float decay = 1.0 - smoothstep(0.25, 1.0, along);

        /* Across it: soft edges, because a beam has no outline. */
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
        across = pow(clamp(across, 0.0, 1.0), 1.6);

        /* The dust, drifting slowly. Two octaves at different speeds so it
           never reads as a repeating pattern. */
        float dust =
          noise(vec2(vLocal.x * 2.4, along * 7.0 - uTime * 0.06)) * 0.6 +
          noise(vec2(vLocal.x * 5.1 + 11.0, along * 13.0 - uTime * 0.11)) * 0.4;
        dust = 0.72 + dust * 0.28;

        float a = entry * decay * across * dust * uStrength;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColour * a, a);
      }
    `,
  });
}

export function LightShafts({
  sky,
  quality,
}: {
  sky: SkyState;
  quality: "low" | "medium" | "high";
}) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<THREE.ShaderMaterial[]>([]);

  /* Direction, strength and colour all come from the same solar calculation
     that drives the key light, so the shafts and the shadows they belong to
     can never disagree. */
  const [dx, dy, dz] = windowSunDirection(sky);

  const geometry = useMemo(() => {
    /* A slab as wide as the opening and as tall as its glazed height, laid
       flat along +Y so it can be pointed down the sun vector. The UVs run
       0→1 along the length, which is what the shader fades on. */
    const g = new THREE.PlaneGeometry(WINDOW.width * 0.92, REACH, 1, 24);
    g.translate(0, REACH / 2, 0);
    return g;
  }, []);

  /* The shaft takes the sun's own colour, which the rig already computes
     from its elevation — so a low morning sun comes in warm and a high one
     comes in near-white, without a second table of colours to disagree. */
  const colour = useMemo(
    () => new THREE.Color(temperatureToHex(sky.kelvin)),
    [sky.kelvin],
  );

  /* Strength follows the beam: strongest in clear low sun, weaker at noon,
     and nothing at all once the sun is down.

     THE SUN HAS TO BE ABOVE THE HORIZON. windowSunDirection keeps returning
     a vector after sunset — the lighting rig deliberately floors the key
     light's height so the moon still casts something — and taking its
     negative then points the shaft UPWARD, which renders as beams of light
     rising out of the floor. Caught by the direction check at 23:00, where
     the shaft came back at y = +0.76 and was still bright enough to draw.
     Below a couple of degrees of elevation there is no shaft to see
     regardless, so that is where it is cut. */
  const strength = useMemo(() => {
    if (sky.solar.elevation < 2) return 0;
    const base = 0.055 + sky.beam * 0.22;
    // Grazing sun throws long dramatic shafts; overhead sun throws almost
    // none into a room, which is why midday interiors look flat.
    const graze = 1 - Math.min(1, Math.abs(dy));
    return base * (0.35 + graze * 0.9);
  }, [sky.solar.elevation, sky.beam, dy]);

  const mats = useMemo(() => {
    materials.current = WINDOW_XS.map(() => shaftMaterial(colour, strength));
    return materials.current;
  }, [colour, strength]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const m of materials.current) m.uniforms.uTime.value = t;
  });

  // Below the top tier the shafts are dropped: four additive full-height
  // quads with a noise shader is real overdraw, and it is the first thing
  // worth losing on a phone.
  if (quality !== "high" || strength < 0.012) return null;

  /* Point each slab down the sun vector. The sun travels toward the room
     from outside, so the shaft runs along the NEGATIVE of the incoming
     direction — getting this backwards sends the light out of the window,
     which looks almost right and is completely wrong. */
  const dir = new THREE.Vector3(-dx, -dy, -dz).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group ref={group}>
      {WINDOW_XS.map((x, i) => (
        <mesh
          key={x}
          geometry={geometry}
          material={mats[i]}
          position={[x, WINDOW.sill + WINDOW.straight * 0.55, -ROOM.halfD + 0.5]}
          quaternion={quat}
          renderOrder={2}
        />
      ))}
    </group>
  );
}
