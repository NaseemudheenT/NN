/**
 * NERO NOREN — the boutique soundscape.
 *
 * Five acoustic environments, each synthesised in the browser rather than
 * streamed. That is a deliberate choice and not a shortcut: a flagship's room
 * tone has no beginning and no end, and any file long enough not to loop
 * audibly would be a multi-megabyte download on a phone — which is the exact
 * opposite of what the room is for.
 *
 * Everything here is built from the same three ingredients a real room gives
 * you: a bed of filtered noise standing in for air and ventilation, a few
 * sustained tones a long way apart, and a convolution reverb whose impulse
 * response is generated to the dimensions of the showroom itself. The result
 * is quiet, slow, and has nothing in it that repeats on a period a listener
 * could catch.
 *
 * Nothing here touches React or the DOM.
 */

export type SoundscapeId =
  | "milan-morning"
  | "piano-lounge"
  | "boutique-hum"
  | "evening-keys"
  | "flagship-silence";

export interface SoundscapeDef {
  id: SoundscapeId;
  /** What it is called in the one place it is ever named. */
  title: string;
  /** One line, for the label and the accessible description. */
  note: string;
  /** Which hour of the showroom it belongs to. */
  phases: ("morning" | "afternoon" | "evening" | "night")[];
  /** Root of the tonal bed, in hertz. */
  root: number;
  /** Scale degrees above the root, as frequency ratios. */
  voicing: number[];
  /** Corner frequency of the air bed, in hertz. */
  airCutoff: number;
  /** How loud the air bed sits under the tones, 0–1. */
  airLevel: number;
  /** Seconds between one tone being touched and the next. */
  restSeconds: [number, number];
  /** Overall level. Every one of these is deliberately very quiet. */
  gain: number;
  /** Whether a struck, piano-like envelope is used instead of a bowed one. */
  struck: boolean;
}

/* Ratios for a major ninth voicing, spread wide. Wide voicings are what make
   a chord sound like a room rather than a keyboard: the intervals are far
   enough apart that the ear hears them as separate events. */
const WIDE_MAJOR = [1, 1.5, 2, 3, 3.75, 5];
const WIDE_MINOR = [1, 1.2, 1.5, 2, 2.4, 3];
const QUARTAL = [1, 1.3348, 1.7818, 2.6697, 3.5636];

export const SOUNDSCAPES: SoundscapeDef[] = [
  {
    id: "milan-morning",
    title: "Milan Morning Resonance",
    note: "Cool air, a high room, and the street a long way off",
    phases: ["morning"],
    root: 146.83, // D3
    voicing: WIDE_MAJOR,
    airCutoff: 900,
    airLevel: 0.1,
    restSeconds: [9, 17],
    gain: 0.1,
    struck: false,
  },
  {
    id: "piano-lounge",
    title: "Acoustic Grand Lounge",
    note: "A grand piano in the next room, played for nobody",
    phases: ["afternoon"],
    root: 130.81, // C3
    voicing: WIDE_MAJOR,
    airCutoff: 1400,
    airLevel: 0.06,
    restSeconds: [6, 13],
    gain: 0.11,
    struck: true,
  },
  {
    id: "boutique-hum",
    title: "Spatial Boutique Hum",
    note: "The sound a large, well-built, empty room actually makes",
    phases: ["afternoon", "morning"],
    root: 98, // G2
    voicing: QUARTAL,
    airCutoff: 620,
    airLevel: 0.16,
    restSeconds: [14, 26],
    gain: 0.085,
    struck: false,
  },
  {
    id: "evening-keys",
    title: "Evening Minimalist Keys",
    note: "Single notes, a long way apart, as the light goes",
    phases: ["evening"],
    root: 110, // A2
    voicing: WIDE_MINOR,
    airCutoff: 780,
    airLevel: 0.09,
    restSeconds: [8, 16],
    gain: 0.105,
    struck: true,
  },
  {
    id: "flagship-silence",
    title: "The Flagship Silence",
    note: "Almost nothing: the room, the air, and the lights",
    phases: ["night"],
    root: 73.42, // D2
    voicing: [1, 1.5, 2, 3],
    airCutoff: 420,
    airLevel: 0.2,
    restSeconds: [20, 38],
    gain: 0.07,
    struck: false,
  },
];

export const soundscapeById = (id: SoundscapeId) =>
  SOUNDSCAPES.find((s) => s.id === id) ?? SOUNDSCAPES[SOUNDSCAPES.length - 1];

/** The soundscape that belongs to an hour of the showroom. */
export function soundscapeForPhase(
  phase: "morning" | "afternoon" | "evening" | "night",
): SoundscapeDef {
  return SOUNDSCAPES.find((s) => s.phases[0] === phase) ?? SOUNDSCAPES[SOUNDSCAPES.length - 1];
}

/* ── the room ───────────────────────────────────────────────────── */

/**
 * An impulse response for a hall of the given size.
 *
 * Exponentially decaying noise, high-frequency damped over time because air
 * and soft furnishings absorb treble faster than bass — which is why a big
 * stone room sounds dark rather than bright. Early reflections are stamped in
 * at the delays the geometry implies, because those, not the tail, are what
 * the ear reads as size.
 */
export function buildRoomImpulse(
  ctx: BaseAudioContext,
  seconds = 3.6,
  decay = 2.6,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);

  // Early reflections, in seconds, for a room roughly 12 m × 8 m × 4.5 m.
  const early = [0.011, 0.019, 0.027, 0.036, 0.048, 0.061, 0.079];

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    // A one-pole low-pass, whose corner falls as the tail decays.
    let last = 0;

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.pow(1 - t, decay);
      const white = Math.random() * 2 - 1;
      // more damping later in the tail
      const alpha = 0.34 - 0.24 * t;
      last = last + alpha * (white - last);
      data[i] = last * envelope;
    }

    // stamp the early reflections, offset per channel so the room has width
    early.forEach((delay, n) => {
      const index = Math.floor((delay + channel * 0.0017) * rate);
      if (index < length) {
        data[index] += (n % 2 === 0 ? 0.42 : -0.34) / (n + 1);
      }
    });
  }

  return impulse;
}

/** Pink-ish noise: the spectrum of air, not of a hiss. */
export function buildAirBuffer(ctx: BaseAudioContext, seconds = 6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    // Voss-McCartney: sum of octave-spaced random walks, which gives a 1/f
    // spectrum — the distribution of most natural background sound.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.055;
    }

    // Cross-fade the last half second into the first, so the loop has no seam.
    const fade = Math.floor(rate * 0.5);
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      data[i] = data[i] * t + data[length - fade + i] * (1 - t);
    }
  }

  return buffer;
}
