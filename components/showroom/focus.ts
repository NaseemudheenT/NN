/**
 * Where the lens is focused.
 *
 * Depth of field needs to know how far away the subject is, and the only
 * thing that knows that is the camera rig — it is the one holding the look
 * target. But the rig lives inside the scene graph and the effect stack lives
 * beside it, and React state is the wrong channel between them: the distance
 * changes every frame, and a setState per frame re-renders the whole canvas
 * sixty times a second to move one number.
 *
 * So it is a mutable box. The rig writes to it in useFrame; the grade reads
 * it in useFrame. No renders, no allocation, and the two never need to know
 * about each other.
 *
 * ── why this follows the subject at all ───────────────────────────────
 * A fixed focus plane is worse than none. Walk the camera forward with focus
 * pinned at four metres and the garment you are approaching goes soft exactly
 * as you reach it, which is the opposite of what a lens does in the hands of
 * someone competent. A focus puller keeps the subject sharp as the camera
 * moves, and this is that: the rigs already compute what the camera is
 * looking at, so the distance to it is free.
 */

/** Metres from the camera to whatever it is looking at. */
export const focus = {
  /** Live distance, written by whichever rig is mounted. */
  distance: 6,
  /**
   * Eased value the effect actually uses.
   *
   * A lens does not snap. Racking focus instantly between two subjects reads
   * as a glitch rather than as a camera, so the grade eases toward `distance`
   * at roughly the speed a hand can turn a focus ring.
   */
  eased: 6,
};

/** How fast focus racks, per second. 2.2 is a quick but human pull. */
export const FOCUS_RATE = 2.2;

/** Ease `eased` toward `distance`. Called once per frame by the grade. */
export function rackFocus(delta: number) {
  const k = Math.min(1, delta * FOCUS_RATE);
  focus.eased += (focus.distance - focus.eased) * k;
  return focus.eased;
}
