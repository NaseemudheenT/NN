/**
 * Turning the sky into a lighting rig.
 *
 * lib/daytime.ts works out where the sun is and what colour it is. This module
 * turns that into the handful of numbers the scene needs, and blends between
 * them so a visitor watching at 19:29 sees the room go to night over a minute
 * rather than in a jump cut.
 *
 * The four named phases exist because the brand describes the room that way.
 * The numbers inside them are still driven by the computed sun, so the room at
 * 08:00 in June is not the room at 08:00 in December.
 */

import type { DayPhase, SkyState } from "@/lib/daytime";
import { temperatureToHex } from "@/lib/daytime";

/** How long a phase change takes to complete, in milliseconds. */
export const BLEND_MS = 60_000;

export interface LightingRig {
  /** Sun position in metres, scaled out from the room. */
  sunPosition: [number, number, number];
  sunColour: string;
  sunIntensity: number;
  /** Bounce off the floor and walls. */
  ambientColour: string;
  ambientIntensity: number;
  /** The rectangle of sky seen through the windows. */
  windowColour: string;
  windowIntensity: number;
  /** Interior lamps: 0 in full daylight, 1 at night. */
  lampIntensity: number;
  lampColour: string;
  /** Backlit NN sign, brightest at night. */
  signIntensity: number;
  /** Tone-mapping exposure. */
  exposure: number;
  /** Shadow softness, in world units of light radius. */
  shadowRadius: number;
  /** Bloom threshold and strength, kept off the cloth and on the gold. */
  bloom: { threshold: number; intensity: number };
  /** Fog, used lightly at night to give the room depth. */
  fog: { colour: string; near: number; far: number };
}

/** Warm tungsten for the picture lamps — a real showroom does not use daylight bulbs. */
const LAMP_KELVIN = 2700;

/** Per-phase character, applied on top of the computed sun. */
const PHASE_CHARACTER: Record<
  DayPhase,
  { sunGain: number; ambientGain: number; windowGain: number; signGain: number; shadowRadius: number; fogFar: number }
> = {
  // Cool, soft, long shadows: the sun is low and the sky does more of the work.
  morning: { sunGain: 0.9, ambientGain: 1.15, windowGain: 1.1, signGain: 0.15, shadowRadius: 5, fogFar: 46 },
  // Bright and neutral, crisp shadows.
  afternoon: { sunGain: 1.15, ambientGain: 0.95, windowGain: 1.25, signGain: 0.1, shadowRadius: 2.6, fogFar: 52 },
  // Golden hour, and the staff start switching lamps on.
  evening: { sunGain: 1.0, ambientGain: 0.85, windowGain: 0.9, signGain: 0.55, shadowRadius: 6.5, fogFar: 38 },
  // Windows dark, warm pools of lamp light, the gold glowing.
  night: { sunGain: 0, ambientGain: 0.4, windowGain: 0.08, signGain: 1, shadowRadius: 7.5, fogFar: 26 },
};

/** Distance the sun light is placed from the room centre. */
const SUN_DISTANCE = 28;

export function rigFromSky(sky: SkyState): LightingRig {
  const c = PHASE_CHARACTER[sky.phase];
  const [dx, dy, dz] = windowSunDirection(sky);

  // Keep the sun above the horizon for shadow purposes even at night, so the
  // moon/skylight still casts something rather than the room going flat.
  const height = Math.max(dy, 0.12);

  const sunColour = temperatureToHex(sky.kelvin);
  const lampColour = temperatureToHex(LAMP_KELVIN);

  // Skylight is much bluer than the beam: it is scattered short wavelengths.
  const skyKelvin = sky.solar.elevation > 0 ? 11_000 - sky.beam * 3500 : 8000;
  const windowColour = temperatureToHex(skyKelvin);

  return {
    sunPosition: [dx * SUN_DISTANCE, height * SUN_DISTANCE, dz * SUN_DISTANCE],
    sunColour,
    sunIntensity: 3.4 * sky.beam * c.sunGain,
    ambientColour: windowColour,
    ambientIntensity: (0.22 + 0.5 * sky.beam) * c.ambientGain,
    windowColour,
    windowIntensity: (0.35 + 2.4 * sky.beam) * c.windowGain,
    lampIntensity: sky.lampLevel * 2.6,
    lampColour,
    signIntensity: c.signGain * (0.4 + sky.lampLevel),
    exposure: sky.exposure,
    shadowRadius: c.shadowRadius,
    bloom: {
      // At night the threshold drops so the gold and the lamps glow; in
      // daylight it sits high so nothing but a specular highlight blooms.
      threshold: 0.92 - sky.lampLevel * 0.28,
      intensity: 0.22 + sky.lampLevel * 0.5,
    },
    fog: {
      colour: sky.phase === "night" ? "#07070a" : windowColour,
      near: 9,
      far: c.fogFar,
    },
  };
}

/** Linear interpolation between two rigs, for the 60 second crossfade. */
export function blendRigs(a: LightingRig, b: LightingRig, t: number): LightingRig {
  const n = (x: number, y: number) => x + (y - x) * t;
  const v = (x: [number, number, number], y: [number, number, number]) =>
    [n(x[0], y[0]), n(x[1], y[1]), n(x[2], y[2])] as [number, number, number];
  // Colours are crossfaded by the material's own lerp in the component; here we
  // simply hand over the target past the halfway point to keep this pure.
  const pick = <T,>(x: T, y: T) => (t < 0.5 ? x : y);

  return {
    sunPosition: v(a.sunPosition, b.sunPosition),
    sunColour: pick(a.sunColour, b.sunColour),
    sunIntensity: n(a.sunIntensity, b.sunIntensity),
    ambientColour: pick(a.ambientColour, b.ambientColour),
    ambientIntensity: n(a.ambientIntensity, b.ambientIntensity),
    windowColour: pick(a.windowColour, b.windowColour),
    windowIntensity: n(a.windowIntensity, b.windowIntensity),
    lampIntensity: n(a.lampIntensity, b.lampIntensity),
    lampColour: pick(a.lampColour, b.lampColour),
    signIntensity: n(a.signIntensity, b.signIntensity),
    exposure: n(a.exposure, b.exposure),
    shadowRadius: n(a.shadowRadius, b.shadowRadius),
    bloom: {
      threshold: n(a.bloom.threshold, b.bloom.threshold),
      intensity: n(a.bloom.intensity, b.bloom.intensity),
    },
    fog: {
      colour: pick(a.fog.colour, b.fog.colour),
      near: n(a.fog.near, b.fog.near),
      far: n(a.fog.far, b.fog.far),
    },
  };
}

/* ── orienting the room to the sun ──────────────────────────────── */

/**
 * The showroom's windows run along one wall, at z = −4. A real building is
 * oriented deliberately, and this one is built so its windows catch the day:
 * we keep the computed elevation and colour exactly, and map the solar azimuth
 * onto a sweep across the window wall, from −70° at sunrise to +70° at sunset.
 *
 * Without this the sun would spend half of every day behind a solid wall and
 * the room would go flat for no reason a visitor could see. With it, light
 * genuinely crosses the floor over the course of the day, and the length and
 * direction of every shadow still comes from the real sun.
 */
export function windowSunDirection(sky: SkyState): [number, number, number] {
  const RAD = Math.PI / 180;
  const el = sky.solar.elevation * RAD;

  // Azimuth 90° (due east, sunrise) → 270° (due west, sunset).
  const az = sky.solar.azimuth;
  const t = Math.min(1, Math.max(0, (az - 90) / 180));
  const swing = (-70 + t * 140) * RAD;

  const horizontal = Math.cos(el);
  return [
    Math.sin(swing) * horizontal,
    Math.sin(el),
    // Negative z: the window wall.
    -Math.cos(swing) * horizontal,
  ];
}
