/**
 * NN TOWER — the architecture, as numbers.
 *
 * Every dimension the 3D build uses lives here, in metres, and nowhere else.
 * The geometry, the camera, the exploded view and the HUD all read the same
 * array, so a floor cannot be in one place for the camera and another for the
 * stair.
 *
 * ── on the units ─────────────────────────────────────────────────────
 * Real metres, not arbitrary world units. A 4 m floor-to-floor and a 2.4 m
 * door are what a building actually has, and keeping the model at true scale
 * is what makes a camera at eye height read as eye height rather than as a
 * doll's house. It also means the lighting falloff is physically sensible.
 */

import type { LevelId } from "./floors";

/* ── the envelope ──────────────────────────────────────────────────── */

/** Half-width of the square footprint. The building is 24 m on a side. */
export const HALF = 12;

/** How deep the corner rotunda is cut back from the square corner. */
export const CHAMFER = 7.2;

/** Radius of the curved corner bay that carries the dome. */
export const ROTUNDA_R = 5.1;

/** Thickness of the perimeter masonry. Real ashlar, not a cardboard box. */
export const WALL = 0.62;

/** Floor plate thickness: slab plus finish. */
export const SLAB = 0.42;

/** The atrium void, cut through every plate from Level 1 to the dome. */
export const ATRIUM_R = 3.6;

/** Where the atrium sits in plan — pulled toward the rotunda corner. */
export const ATRIUM_CENTRE: [number, number] = [3.4, 3.4];

/* ── the stack ─────────────────────────────────────────────────────── */

export interface LevelSpec {
  id: LevelId;
  /** 0 at the street, 8 on the roof. Drives the exploded offset. */
  index: number;
  /** Underside of this level's floor plate, in metres above the pavement. */
  base: number;
  /** Floor to floor. The street is double height because shops are. */
  height: number;
  /** The ledger: what this floor is actually made of. */
  walls: MaterialId;
  floor: MaterialId;
  ceiling: MaterialId;
  /** Colour temperature of this floor's own light, in kelvin. */
  kelvin: number;
  /** How bright this floor reads from outside at dusk, 0–1. */
  glow: number;
}

export type MaterialId =
  | "limestone"
  | "travertine"
  | "oak"
  | "walnut"
  | "basalt"
  | "brushed"
  | "steel"
  | "glass"
  | "smartglass"
  | "linen"
  | "leather"
  | "plaster"
  | "concrete"
  | "microcement";

/**
 * The nine levels, bottom up.
 *
 * Heights are not uniform and must not be: the street is a double-height
 * retail volume, the upper floors are ordinary 4 m commercial plates, and the
 * roof is a terrace rather than a storey. A tower with nine identical slices
 * reads as a parking garage.
 */
export const LEVELS: LevelSpec[] = [
  { id: "street",   index: 0, base:  0.0, height: 6.5, walls: "limestone",  floor: "travertine",  ceiling: "plaster",     kelvin: 2700, glow: 0.95 },
  { id: "gallery",  index: 1, base:  6.5, height: 4.0, walls: "travertine", floor: "travertine",  ceiling: "concrete",    kelvin: 3000, glow: 0.88 },
  { id: "atelier",  index: 2, base: 10.5, height: 4.0, walls: "plaster",    floor: "oak",         ceiling: "plaster",     kelvin: 3200, glow: 0.74 },
  { id: "menboys",  index: 3, base: 14.5, height: 4.0, walls: "linen",      floor: "oak",         ceiling: "plaster",     kelvin: 2900, glow: 0.82 },
  { id: "journal",  index: 4, base: 18.5, height: 4.0, walls: "walnut",     floor: "walnut",      ceiling: "walnut",      kelvin: 2600, glow: 0.62 },
  { id: "stylist",  index: 5, base: 22.5, height: 4.0, walls: "smartglass", floor: "microcement", ceiling: "plaster",     kelvin: 5000, glow: 1.00 },
  { id: "checkout", index: 6, base: 26.5, height: 4.0, walls: "brushed",    floor: "basalt",      ceiling: "steel",       kelvin: 3400, glow: 0.70 },
  { id: "owner",    index: 7, base: 30.5, height: 4.0, walls: "walnut",     floor: "walnut",      ceiling: "plaster",     kelvin: 2700, glow: 0.58 },
  { id: "rooftop",  index: 8, base: 34.5, height: 3.2, walls: "glass",      floor: "oak",         ceiling: "glass",       kelvin: 2500, glow: 0.90 },
];

export const TOP = LEVELS[LEVELS.length - 1];

/** Total height to the parapet, before the dome. */
export const PARAPET = TOP.base + TOP.height;

/** The dome over the rotunda. */
export const DOME_R = ROTUNDA_R * 0.92;
export const DOME_BASE = PARAPET + 0.6;

export const levelByIndex = (i: number) =>
  LEVELS.find((l) => l.index === i) ?? LEVELS[0];

export const specFor = (id: LevelId) =>
  LEVELS.find((l) => l.id === id) ?? LEVELS[0];

/* ── the exploded view ─────────────────────────────────────────────── */

/**
 * How far apart the plates travel when the model opens.
 *
 * The brief gives `targetY = index * 5.5`, which would also throw away the
 * real floor heights and leave nine evenly spaced slices — the parking garage
 * again, just further apart. Adding the gap to the true base keeps the
 * building's own proportions and still separates every tier cleanly.
 */
export const EXPLODE_GAP = 5.5;

export const explodedY = (index: number, amount: number) => index * EXPLODE_GAP * amount;

/* ── the openings ──────────────────────────────────────────────────── */

/**
 * The arched bays.
 *
 * Five to a face on the long elevations, with the rotunda carrying its own
 * run of glazing. The arch springs at 62% of the opening height, which is
 * what a round-headed window does; take it higher and it reads as a doorway
 * with a sticker on top.
 */
/* ── what can be touched on each floor ─────────────────────────────── */

/**
 * Points in the building that open something.
 *
 * Positions are in metres, local to their floor's origin. Every entry with
 * a `handle` names a REAL product in the catalogue — the price is looked up
 * at render and written down nowhere, because an invented price is the one
 * thing on a commercial site that must never exist.
 */
export interface Touch {
  id: string;
  level: LevelId;
  at: [number, number, number];
  label: string;
  /** A real catalogue handle. */
  handle?: string;
  /** Or one of the building's own services. */
  opens?: "collection" | "stylist" | "fit" | "bag" | "checkout";
}

export const TOUCHES: Touch[] = [
  { id: "t-coat-1",   level: "gallery", at: [-7.4, 1.5, -0.6], label: "The Oxford", handle: "oxford-azure" },
  { id: "t-coat-2",   level: "gallery", at: [-7.4, 1.5, 5.0],  label: "The Poplin", handle: "poplin-ecru" },
  { id: "t-ped-1",    level: "gallery", at: [-2.4, 1.3, 6.2],  label: "The whole collection", opens: "collection" },

  { id: "t-jacket",   level: "menboys", at: [-7.0, 1.5, -2.8], label: "The Stripe", handle: "stripe-marine" },
  { id: "t-trouser",  level: "menboys", at: [-2.2, 1.5, -7.2], label: "The Tailored Trouser", handle: "tailored-charcoal" },
  { id: "t-boys",     level: "menboys", at: [6.0, 1.2, 3.0],   label: "Boys", opens: "collection" },

  { id: "t-pod",      level: "stylist", at: [4.2, 1.7, 4.6],   label: "Ask the stylist", opens: "stylist" },
  { id: "t-mirror",   level: "stylist", at: [-6.6, 1.5, 3.2],  label: "Virtual fit", opens: "fit" },

  { id: "t-counter",  level: "checkout", at: [6.4, 1.3, -3.0], label: "Checkout", opens: "checkout" },
  { id: "t-bags",     level: "checkout", at: [3.0, 1.4, 4.4],  label: "Your bag", opens: "bag" },
];

export const touchesFor = (id: LevelId) => TOUCHES.filter((t) => t.level === id);

export const BAYS_PER_FACE = 5;
export const BAY_SPRING = 0.62;

/** Window opening proportion within its bay. */
export const BAY_W = 0.54;
export const BAY_H = 0.70;
