/**
 * The floor plan, in metres.
 *
 * One file, because every other part of the room measures itself against it:
 * the lights aim at these coordinates, the camera routes between them, the
 * rails stand on them. When a dimension is wrong it is wrong here and
 * nowhere else.
 *
 * The plan is a basilica — a tall central nave with a lower aisle down each
 * side behind an arcade — because that is the one European plan that gives a
 * clothing floor what it needs: a long axis to walk, a high window at the end
 * to walk toward, and side bays deep enough to hold rails out of the traffic.
 */

export const PLAN = {
  /** The nave: the walking hall. */
  nave: { halfWidth: 6.5, front: 7.5, back: -24, height: 14.6 },
  /** The arcade walls, one each side, pierced by the bays. */
  arcade: { x: 6.5, thickness: 0.5, openingWidth: 4.2, openingHeight: 7.2 },
  /** The outer aisle walls. */
  aisle: { x: 9.4, height: 7.8 },
  /** The great window wall at the end of the nave. */
  endWall: { z: -24, thickness: 0.6, width: 19.4 },
  /** The three openings in it. Sill, width and total height from the sill. */
  windows: [
    { cx: 0, width: 5.0, height: 11.0, sill: 1.2 },
    { cx: -4.6, width: 2.6, height: 7.6, sill: 1.2 },
    { cx: 4.6, width: 2.6, height: 7.6, sill: 1.2 },
  ],
  /** Bay centres down the nave — arcade openings and transverse arches align. */
  bays: [-19.3, -12.4, -5.6, 1.3],
  /** Where the transverse arches spring. */
  springline: 7.4,

  /* ── what is in the room ─────────────────────────────────────── */
  rails: [
    { x: -4.9, z: -16.5, length: 4.4, rotation: 0 },
    { x: -4.9, z: -8.6, length: 4.4, rotation: 0 },
    { x: 4.9, z: -16.5, length: 4.4, rotation: 0 },
    { x: 4.9, z: -8.6, length: 4.4, rotation: 0 },
  ],
  /** Olive trees in their planters — the only things in here nobody manufactured. */
  trees: [
    { x: -7.9, z: -18.4, scale: 1.0, seed: 11 },
    { x: 7.9, z: -18.4, scale: 0.94, seed: 29 },
    { x: -7.9, z: -10.1, scale: 1.08, seed: 47 },
    { x: 7.9, z: -10.1, scale: 0.98, seed: 63 },
    { x: -2.9, z: -22.2, scale: 0.86, seed: 81 },
    { x: 2.9, z: -22.2, scale: 0.9, seed: 97 },
  ],
  /** The presentation table, under the great window. */
  table: { x: 0, z: -18.8, width: 2.6, depth: 1.3, height: 0.76 },
  /** Two chairs, off the axis so they never block the walk. */
  chairs: [
    { x: 3.4, z: -3.2, rotation: -0.5 },
    { x: -3.6, z: -1.4, rotation: 0.65 },
  ],
  /** Mannequins on their plinths. */
  mannequins: [
    { x: -2.3, z: -12.8, rotation: 0.34 },
    { x: 2.3, z: -12.8, rotation: -0.34 },
  ],
  /** Wall sconces: warm 2700 K, mounted on the piers. */
  sconces: [-19.3, -12.4, -5.6, 1.3].flatMap((z) => [
    { x: -5.9, y: 4.5, z },
    { x: 5.9, y: 4.5, z },
  ]),

  /** Where the camera stands, and what it looks at. */
  camera: {
    position: [0.25, 1.78, 7.2] as [number, number, number],
    target: [0, 4.6, -22] as [number, number, number],
    fov: 36,
  },
} as const;
