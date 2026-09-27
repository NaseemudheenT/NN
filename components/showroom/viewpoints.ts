/**
 * Where a visitor can stand.
 *
 * No free-flying camera: a showroom is walked, not flown, and on a phone a
 * free camera is how people end up inside a wall. These are the five places
 * the camera goes, at eye height, each with something to look at.
 */

export interface Viewpoint {
  id: string;
  label: string;
  /** What the visitor will see there, for the hotspot's accessible name. */
  description: string;
  /** Camera position, metres. Eye height is 1.55–1.65. */
  position: [number, number, number];
  /** What the camera looks at. */
  target: [number, number, number];
  /** Field of view in degrees; a tighter lens for looking at one garment. */
  fov: number;
  /** Where the hotspot marker sits in the room, for the 3D pin. */
  pin?: [number, number, number];
}

export const VIEWPOINTS: Viewpoint[] = [
  {
    id: "entrance",
    label: "Entrance",
    description: "The doorway, with the NN monogram inlaid in the stone floor",
    position: [-5.4, 1.64, 0.1],
    target: [0.4, 1.28, 0.2],
    fov: 54,
    pin: [-3.3, 0.05, 0],
  },
  {
    id: "shirts",
    label: "Shirts",
    description: "The two brass rails, where the Oxford, the Poplin and the Stripe hang",
    position: [-3.3, 1.55, 1.15],
    target: [-3.3, 1.5, 3.9],
    fov: 46,
    pin: [-3.3, 1.9, 3.5],
  },
  {
    id: "trousers",
    label: "Trousers",
    description: "The low oak table, with the Tailored and Pleated trousers folded",
    position: [-0.4, 1.34, 0.55],
    target: [-0.4, 0.5, -0.9],
    fov: 44,
    pin: [-0.4, 0.55, -0.9],
  },
  {
    id: "mirror",
    label: "Mirror",
    description: "The full-length mirror, and the two dressed mannequins behind you",
    position: [4.0, 1.6, -1.4],
    target: [5.85, 1.2, -1.4],
    fov: 50,
    pin: [5.7, 1.15, -1.4],
  },
  {
    id: "trial",
    label: "Trial room",
    description: "The doorway through to the fitting room",
    position: [4.3, 1.6, 1.3],
    target: [5.85, 1.45, 2.3],
    fov: 52,
    pin: [5.7, 1.5, 2.3],
  },
];

export const DEFAULT_VIEWPOINT = VIEWPOINTS[0];

export const viewpointById = (id: string) =>
  VIEWPOINTS.find((v) => v.id === id) ?? DEFAULT_VIEWPOINT;

/**
 * The cinematic entry: a slow push in from the doorway, played once on first
 * load. It starts outside the room looking in, so the first thing a visitor
 * sees is the monogram in the floor and the light coming through the windows.
 */
export const INTRO = {
  from: { position: [-8.6, 1.75, 0.0] as [number, number, number], fov: 62 },
  to: DEFAULT_VIEWPOINT,
  /** Seconds. Long enough to read as a camera move, short enough not to trap anyone. */
  duration: 4.2,
};
