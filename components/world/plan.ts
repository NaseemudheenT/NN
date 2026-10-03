/**
 * NERO NOREN — the building.
 *
 * Not a page with a 3D picture on it. A building, with two floors, that a
 * customer walks around. Everything else measures itself against this file:
 * the walker collides with it, the camera teleports to it, the lights aim at
 * it, the stock stands on it.
 *
 * ── the plan ─────────────────────────────────────────────────────────
 * A European basilica, because it is the one plan that gives a clothing
 * floor what it needs: a long axis to walk, a great window at the end to
 * walk toward, side bays deep enough to hold rails out of the traffic, and
 * — the reason it is used here — a GALLERY over those bays, which is the
 * second floor.
 *
 *   z = +16 ··· +10   the vestibule, behind the doors
 *   z = +10           THE DOORS. Closed on arrival. They open and you walk in.
 *   z = +10 ··· -24   the nave, 13 m wide and 14.6 m to the vault
 *   x = ±6.5          the arcade: four bays a side, open to the aisles
 *   x = ±9.4          the outer wall
 *   y = 0             GROUND FLOOR — Men
 *   y = 7.6           THE GALLERY — Boys, over the aisles, open to the nave
 *   z = -24           the great window wall
 *
 * Measurements are metres and eye height is 1.65 m, because a hall only
 * reads as a hall if it is the size of one.
 */

export type ZoneId =
  | "entrance"
  | "men"
  | "boys"
  | "atelier"
  | "trial"
  | "collection";

export const EYE = 1.65;

/** The street outside, and the face the building shows it. */
export const FACADE = {
  z: 16,
  width: 27,
  height: 17.5,
  thickness: 0.9,
  /* two tall windows flanking the entrance, lit warm from the lobby */
  windows: [
    { cx: -8.4, width: 3.0, height: 8.0, sill: 1.6 },
    { cx: 8.4, width: 3.0, height: 8.0, sill: 1.6 },
  ],
  sign: { y: 10.4 },
} as const;

export const B = {
  nave: { halfWidth: 6.5, front: 10, back: -24, height: 14.6 },
  vestibule: { front: 16 },
  /* The doors are in the STREET FACADE, not in an inner wall. That is what
     lets the arrival be an arrival: the camera comes down the street, the
     doors give, and the lobby and the hall are both still ahead. Doors set
     one room in means the customer is already inside when they open, which
     is a corridor, not an entrance. */
  doors: { z: 16, width: 4.4, height: 6.6, leaf: 2.2 },
  arcade: { x: 6.5, thickness: 0.5, openingWidth: 4.2, openingHeight: 6.6, upperHeight: 2.6 },
  aisle: { x: 9.4 },
  gallery: { y: 7.6, inner: 6.5, outer: 9.4, rail: 1.05, height: 6.4 },
  endWall: { z: -24, thickness: 0.6, width: 19.4 },
  windows: [
    { cx: 0, width: 5.0, height: 11.0, sill: 1.2 },
    { cx: -4.6, width: 2.6, height: 7.6, sill: 1.2 },
    { cx: 4.6, width: 2.6, height: 7.6, sill: 1.2 },
  ],
  /** Bay centres down the nave. Arcade openings and vault arches align. */
  bays: [-19.3, -12.4, -5.6, 1.3, 7.6],
  /* Where the vault springs, and how far it rises.
     Three numbers have to agree here and all three were wrong: the crown
     (springline + rise + band) must clear the ceiling, the springing must
     clear the gallery's handrail, and the gallery's openings must fit
     between its floor and the springing. A semicircular vault over a 13 m
     nave rises 6.5 m on its own, which blew through the roof — so the
     vault is SEGMENTAL, which is what a hall broader than it is tall
     actually gets built with. */
  springline: 10.4,
  vaultRise: 3.6,
  vaultBand: 0.5,

  /** The stair up to the gallery: one straight flight in the west aisle. */
  /* 44 treads over 12.3 m to climb 7.6 m: a 173 mm rise on a 280 mm going,
     which is a staircase. It was 22 treads over 9 m — a 345 mm rise, which
     is a climbing wall, and exactly the sort of number that looks fine in a
     plan file and is unusable in the building. */
  stair: {
    x: -7.95,
    bottomZ: 8.4,
    topZ: -3.9,
    steps: 44,
    width: 2.4,
  },
} as const;

/* ── where the customer can stand ──────────────────────────────────
   Walkable area as rectangles per floor. The walker is kept inside the
   union of these and outside the obstacles below, which is cheaper and far
   more predictable than mesh collision — and predictability is the whole
   difference between walking a building and fighting one. */
export interface Rect { x0: number; x1: number; z0: number; z1: number }

export const FLOORS: { y: number; areas: Rect[] }[] = [
  {
    y: 0,
    areas: [
      { x0: -6.2, x1: 6.2, z0: -23.4, z1: 15.4 },   // the nave and vestibule
      { x0: -9.1, x1: -6.2, z0: -23.4, z1: 9.4 },   // the west aisle
      { x0: 6.2, x1: 9.1, z0: -23.4, z1: 9.4 },     // the east aisle
    ],
  },
  {
    y: B.gallery.y,
    areas: [
      { x0: -9.1, x1: -6.4, z0: -23.4, z1: 8.4 },   // the west gallery
      { x0: 6.4, x1: 9.1, z0: -23.4, z1: 8.4 },     // the east gallery
      { x0: -9.1, x1: 9.1, z0: 5.4, z1: 8.4 },      // the bridge, over the entrance
    ],
  },
];

/** Solid things a walker cannot pass through, as circles on the plan. */
export interface Blocker { x: number; z: number; r: number; floor: number }

/* ── zones: what the panel teleports to ─────────────────────────────
   Each is a standing position and something to look at. They are places in
   the building, not pages — "Boys" is the gallery, and going there means
   climbing the stair or being carried up it. */
export interface Zone {
  id: ZoneId;
  label: string;
  floor: number;
  /** Where the customer ends up standing. */
  at: [number, number];
  /** What they are facing, as a yaw in radians (0 = looking down -z). */
  yaw: number;
}

/* Each one stands where a customer would stand and faces what they came
   to see. A teleport that lands you looking at a wall is worse than a
   walk, because at least a walk is your own fault. */
export const ZONES: Zone[] = [
  { id: "entrance", label: "Entrance", floor: 0, at: [0, 12.5], yaw: 0 },
  { id: "men", label: "Men", floor: 0, at: [4.4, -2.0], yaw: -0.5 },
  { id: "collection", label: "Collection", floor: 0, at: [0, -12.6], yaw: 0 },
  { id: "trial", label: "Trial room", floor: 0, at: [7.9, -4.2], yaw: 0 },
  { id: "atelier", label: "Atelier", floor: 0, at: [-7.9, -12.6], yaw: 0 },
  { id: "boys", label: "Boys", floor: 1, at: [-7.9, -10.6], yaw: 0 },
];

/** The fitting alcove, cut into the east outer wall. */
export const FITTING = { x: 9.4, z: -8.6, width: 3.6, depth: 1.9, height: 3.2 } as const;

/* ── the fittings ───────────────────────────────────────────────── */

export interface RailSpec {
  id: string;
  x: number;
  z: number;
  length: number;
  floor: number;
  /** "men" on the ground, "boys" in the gallery. */
  audience: "men" | "boys";
}

export const RAILS: RailSpec[] = [
  { id: "w1", x: -7.9, z: -17.0, length: 4.6, floor: 0, audience: "men" },
  { id: "w2", x: -7.9, z: -9.5, length: 4.6, floor: 0, audience: "men" },
  { id: "e1", x: 7.9, z: -17.0, length: 4.6, floor: 0, audience: "men" },
  { id: "e2", x: 7.9, z: 1.5, length: 4.6, floor: 0, audience: "men" },
  { id: "gw", x: -7.9, z: -14.5, length: 4.6, floor: 1, audience: "boys" },
  { id: "ge", x: 7.9, z: -14.5, length: 4.6, floor: 1, audience: "boys" },
  { id: "ge2", x: 7.9, z: -4.0, length: 4.0, floor: 1, audience: "boys" },
];

export const PLINTHS = [
  { x: -2.6, z: -9.0, floor: 0 },
  { x: 2.6, z: -9.0, floor: 0 },
  { x: -2.6, z: -16.5, floor: 0 },
  { x: 2.6, z: -16.5, floor: 0 },
];

export const TREES = [
  { x: -8.0, z: -21.0, scale: 1.0, seed: 11 },
  { x: 8.0, z: -21.0, scale: 0.94, seed: 29 },
  { x: -3.4, z: 6.0, scale: 1.06, seed: 47 },
  { x: 3.4, z: 6.0, scale: 0.98, seed: 63 },
];

export const TABLE = { x: 0, z: -21.2, width: 2.8, depth: 1.4, height: 0.76 };

export const SEATS = [
  { x: 3.6, z: -4.4, rotation: -0.5 },
  { x: -3.7, z: 2.2, rotation: 0.7 },
];

/** Warm sconces on the piers, both floors. */
export const SCONCES = B.bays.flatMap((z) => [
  { x: -6.15, y: 4.2, z },
  { x: 6.15, y: 4.2, z },
  { x: -6.15, y: B.gallery.y + 3.1, z },
  { x: 6.15, y: B.gallery.y + 3.1, z },
]);

/** Everything a walker bumps into. */
export const BLOCKERS: Blocker[] = [
  ...PLINTHS.map((p) => ({ x: p.x, z: p.z, r: 0.75, floor: p.floor })),
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.9 * t.scale, floor: 0 })),
  ...SEATS.map((s) => ({ x: s.x, z: s.z, r: 0.75, floor: 0 })),
  { x: TABLE.x, z: TABLE.z, r: 1.7, floor: 0 },
  ...RAILS.map((r) => ({ x: r.x, z: r.z, r: 0.6, floor: r.floor })),
];
