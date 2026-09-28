/**
 * Every 3D asset the showroom can load, in one place.
 *
 * Each entry is a path under /public/models. When the file exists it is used;
 * when it does not, the matching component renders a procedural stand-in at
 * the correct real-world scale and in the correct material. Dropping the real
 * .glb files in place upgrades the showroom without touching any component.
 */
export const MODELS = {
  room: "/models/showroom.glb",
  counter: "/models/counter.glb",
  rail: "/models/rail.glb",
  table: "/models/table.glb",
  mannequin: "/models/mannequin.glb",
  mirror: "/models/mirror.glb",
  bench: "/models/bench.glb",
  body: "/models/body.glb",
  shirt: "/models/garment-shirt.glb",
  trouser: "/models/garment-trouser.glb",
} as const;

export type ModelKey = keyof typeof MODELS;

/** Real-world dimensions in metres — placeholders match these exactly. */
export const ROOM = {
  width: 12,
  depth: 14,
  height: 4.5,
  /** Floor plane sits at y = 0 */
  backWallZ: -7,
  frontZ: 7,
  leftWallX: -6,
  rightWallX: 6,
} as const;
