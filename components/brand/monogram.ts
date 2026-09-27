/**
 * The NN letterform, defined once.
 *
 * A serif N: thin verticals, a heavy diagonal, slab serifs top and bottom —
 * the way a Garamond N distributes its weight. Traced as one closed simple
 * polygon in a 84 × 100 box with y pointing down (SVG convention), so the same
 * coordinates drive the flat SVG in the header and the extruded geometry in
 * the showroom. One source, two renderings, no drift between them.
 *
 * The two counters (the enclosed white shapes) fall out of the trace:
 * the lower-left triangle between the left stem and the diagonal, and the
 * upper-right triangle between the diagonal and the right stem.
 */

export const N_WIDTH = 84;
export const N_HEIGHT = 100;

/** Closed outline of the serif N, y-down. */
export const N_OUTLINE: readonly [number, number][] = [
  [2, 0],   [2, 4],   [8, 4],   [8, 96],  [2, 96],  [2, 100],
  [24, 100],[24, 96], [18, 96], [18, 4],  [54, 96], [54, 100],
  [82, 100],[82, 96], [76, 96], [76, 4],  [82, 4],  [82, 0],
  [60, 0],  [60, 4],  [66, 4],  [66, 96], [30, 0],
];

/** SVG path data for the N. */
export const N_PATH = `M${N_OUTLINE.map(([x, y]) => `${x},${y}`).join(" L")} Z`;

/**
 * How far the second N sits to the right of the first. Less than the letter's
 * width, so the right stem of the first N and the left stem of the second
 * share space — that overlap is what makes the monogram read as interlocked
 * rather than as two letters standing side by side.
 */
export const N_INTERLOCK_X = 58;

/** Total width of the interlocked pair. */
export const MONOGRAM_WIDTH = N_INTERLOCK_X + N_WIDTH;

/** Gap in metres between the two letters' extrusion planes, so the overlap
    resolves as one plate in front of another rather than as z-fighting. */
export const N_INTERLOCK_Z = 0.28;

/** The thin ring the monogram sits inside. */
export const RING = {
  /** Radius as a multiple of the monogram's half-diagonal. */
  radius: 96,
  thickness: 2.4,
};
