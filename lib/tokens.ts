/**
 * NERO NOREN design tokens.
 * Single source for values that must exist in both CSS and WebGL.
 * Colours come from the NN Luxury Brand Identity Board.
 */

export const BRAND = {
  black: "#0a0a0a",
  ink: "#050505",
  ivory: "#f7f5ef",
  ivoryWarm: "#efe9dd",
  charcoal: "#2e2e2e",
  stone: "#b7b1a7",
  taupe: "#6d5e52",
  olive: "#4f5443",
  burgundy: "#4a1f34",
  brass: "#c9a43a",
  brassLight: "#e2c87a",
} as const;

export const WORDMARK = "NERO NOREN";
export const SUBMARK = "Men & Boys";
export const TAGLINE = "Timeless style builds character";
export const SECONDARY_TAGLINE = "Crafted for what comes next";

export type DayPhase = "morning" | "afternoon" | "evening" | "night";

export const PHASES: DayPhase[] = ["morning", "afternoon", "evening", "night"];

/** The visitor's own clock decides the showroom's hour. */
export function phaseForHour(hour: number): DayPhase {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function isDarkPhase(phase: DayPhase) {
  return phase === "night";
}

/**
 * Lighting presets for the showroom. Each is a physically-plausible
 * description of the same room at a different hour, not a colour theme.
 */
export interface LightingPreset {
  /** Sun / window key light */
  keyColor: string;
  keyIntensity: number;
  keyPosition: [number, number, number];
  /** Bounced fill off limestone walls */
  ambientColor: string;
  ambientIntensity: number;
  /** Interior lamps and the backlit NN sign */
  lampColor: string;
  lampIntensity: number;
  signIntensity: number;
  /** Atmosphere */
  fogColor: string;
  fogDensity: number;
  background: string;
  floorTint: string;
  exposure: number;
}

export const LIGHTING: Record<DayPhase, LightingPreset> = {
  morning: {
    keyColor: "#cddcf0",
    keyIntensity: 3.1,
    keyPosition: [-9, 7.5, 4],
    ambientColor: "#e9e2d4",
    ambientIntensity: 1.05,
    lampColor: "#f2d9a4",
    lampIntensity: 0.25,
    signIntensity: 0.35,
    fogColor: "#e6e1d6",
    fogDensity: 0.014,
    background: "#e8e4da",
    floorTint: "#d6cfc0",
    exposure: 1.05,
  },
  afternoon: {
    keyColor: "#fff6e4",
    keyIntensity: 3.8,
    keyPosition: [7, 9, 3],
    ambientColor: "#efe9dd",
    ambientIntensity: 1.25,
    lampColor: "#f2d9a4",
    lampIntensity: 0.18,
    signIntensity: 0.28,
    fogColor: "#ebe6db",
    fogDensity: 0.011,
    background: "#ece8de",
    floorTint: "#ded7c8",
    exposure: 1.1,
  },
  evening: {
    keyColor: "#f7b765",
    keyIntensity: 2.2,
    keyPosition: [10, 3.4, 1.5],
    ambientColor: "#d8c3a2",
    ambientIntensity: 0.62,
    lampColor: "#ffc978",
    lampIntensity: 1.5,
    signIntensity: 1.1,
    fogColor: "#c9b596",
    fogDensity: 0.017,
    background: "#d9cfbe",
    floorTint: "#b8a98f",
    exposure: 0.98,
  },
  night: {
    keyColor: "#5f7086",
    keyIntensity: 0.26,
    keyPosition: [-4, 8, -6],
    ambientColor: "#2a2b31",
    ambientIntensity: 0.2,
    lampColor: "#ffbe6d",
    lampIntensity: 3.4,
    signIntensity: 2.6,
    fogColor: "#0a0a0a",
    fogDensity: 0.04,
    background: "#0a0a0a",
    floorTint: "#16150f",
    exposure: 1.0,
  },
};

/** Fixed viewpoints inside the showroom. The visitor never free-flies. */
export interface Viewpoint {
  id: string;
  label: string;
  /** Camera position */
  position: [number, number, number];
  /** What the camera is looking at */
  target: [number, number, number];
  /** Short line shown while the camera settles */
  caption: string;
}

export const VIEWPOINTS: Viewpoint[] = [
  {
    id: "entrance",
    label: "Entrance",
    position: [0, 1.62, 9.2],
    target: [0, 1.5, 0],
    caption: "The monogram is set into the floor at the threshold.",
  },
  {
    id: "hall",
    label: "The hall",
    position: [0, 1.66, 4.4],
    target: [0, 1.7, -3],
    caption: "Limestone walls, honed travertine, light from the tall windows.",
  },
  {
    id: "shirts",
    label: "Shirting",
    position: [-3.05, 1.55, 1.1],
    target: [-4.3, 1.45, -2.6],
    caption: "Shirts hang on brushed brass, spaced a hand apart.",
  },
  {
    id: "trousers",
    label: "Trousers",
    position: [3.1, 1.4, 1.2],
    target: [4.2, 1.0, -2.4],
    caption: "Folded on oak, so the drape is visible along the leg.",
  },
  {
    id: "counter",
    label: "The counter",
    position: [0.2, 1.6, -1.4],
    target: [0, 2.1, -6.4],
    caption: "Walnut counter beneath the backlit sign.",
  },
  {
    id: "mirror",
    label: "The mirror",
    position: [-1.4, 1.6, -3.1],
    target: [-5.6, 1.6, -5.4],
    caption: "A full-length mirror in antique bronze.",
  },
];

/** Motion language. Every animation in the site draws from this. */
export const MOTION = {
  spring: { type: "spring", stiffness: 210, damping: 32, mass: 0.9 } as const,
  springSoft: { type: "spring", stiffness: 120, damping: 24, mass: 1 } as const,
  springSnap: { type: "spring", stiffness: 420, damping: 34, mass: 0.6 } as const,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  fast: 0.18,
  base: 0.32,
  slow: 0.64,
  cinematic: 1.2,
  stagger: 0.06,
  distance: 20,
} as const;
