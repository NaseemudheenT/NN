/**
 * The NN monogram.
 *
 * Two serif Ns, the second overlapping the first so they SHARE A STEM —
 * the board's own words. It is drawn rather than set in a typeface so the
 * interlock is exact at every size and never depends on a web font having
 * loaded.
 *
 * Geometry of one N, in a 140-unit cap height:
 *   thin stems 11 wide at x 0–11 and 89–100
 *   the thick diagonal is 26.4 perpendicular — 2.4× the stem, which is the
 *     stroke contrast of a Garamond, the face the wordmark is set in
 *   serifs are 5 deep and reach 9 past the stem on each side
 *
 * The second N is placed at x+89, which lands its left stem exactly on the
 * first N's right stem, and dropped 24 so the two read as a lockup rather
 * than as a repeat.
 *
 * Black or white, both of which the board requires. NO GOLD: gold is a
 * finish on a physical object — foil, an engraved button, lit signage —
 * never the mark's own colour.
 */

const STEM = 11;
const CAP = 140;
const BODY = 100;
const SERIF_OUT = 9;
const SERIF_DEEP = 5;

/** One serif N as a path, offset to (x, y). */
function nPath(x: number, y: number): string {
  const p = (px: number, py: number) => `${(px + x).toFixed(1)},${(py + y).toFixed(1)}`;
  return [
    // the glyph: left stem, thick diagonal, right stem, as one outline
    `M${p(0, 0)}`,
    `L${p(25, 0)}`,        // top edge — left stem plus the diagonal's shoulder
    `L${p(89, 119.4)}`,    // the diagonal's right edge, meeting the right stem
    `L${p(89, 0)}`,
    `L${p(BODY, 0)}`,
    `L${p(BODY, CAP)}`,
    `L${p(70, CAP)}`,      // bottom edge — right stem plus the diagonal's foot
    `L${p(STEM, 30)}`,     // the diagonal's left edge, meeting the left stem
    `L${p(STEM, CAP)}`,
    `L${p(0, CAP)}`,
    "Z",
    // four serifs, each reaching past its stem on both sides
    `M${p(-SERIF_OUT, 0)}h${STEM + SERIF_OUT * 2}v${SERIF_DEEP}h-${STEM + SERIF_OUT * 2}Z`,
    `M${p(-SERIF_OUT, CAP - SERIF_DEEP)}h${STEM + SERIF_OUT * 2}v${SERIF_DEEP}h-${STEM + SERIF_OUT * 2}Z`,
    `M${p(BODY - STEM - SERIF_OUT, 0)}h${STEM + SERIF_OUT * 2}v${SERIF_DEEP}h-${STEM + SERIF_OUT * 2}Z`,
    `M${p(BODY - STEM - SERIF_OUT, CAP - SERIF_DEEP)}h${STEM + SERIF_OUT * 2}v${SERIF_DEEP}h-${STEM + SERIF_OUT * 2}Z`,
  ].join("");
}

/* N1 at the origin, N2 sharing its right stem and dropped a quarter cap. */
const MARK = `${nPath(0, 24)} ${nPath(89, 0)}`;

/**
 * The mark as raw geometry, for the places that cannot render a React
 * component — the favicon, the apple icon and the share card, which are all
 * drawn in Satori at the edge. They draw from this, so a change to the
 * letterform reaches every one of them without anyone remembering to
 * re-export a PNG.
 */
export const MARK_PATH = MARK;
export const MARK_VIEWBOX = "-12 -6 222 176";
export const MARK_RATIO = 222 / 176;

export function Monogram({
  size = 28,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="-12 -6 222 176"
      width={(size * 222) / 176}
      height={size}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="currentColor"
      fillRule="nonzero"
    >
      {title ? <title>{title}</title> : null}
      <path d={MARK} />
    </svg>
  );
}

/** The wordmark: NERO NOREN, refined serif, wide letterspacing. */
export function Wordmark({
  size = "1rem",
  className,
}: {
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--serif)",
        fontSize: size,
        fontWeight: 400,
        letterSpacing: "0.3em",
        textIndent: "0.3em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      NERO NOREN
    </span>
  );
}

/** The stacked lockup — mark over wordmark over audience line. */
export function Lockup({
  size = 44,
  tagline = false,
  className,
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: size * 0.26 }}
    >
      <Monogram size={size} title="Nero Noren" />
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.17 }}>
        <Wordmark size={`${size * 0.37}px`} />
        <span
          className="label"
          style={{ fontSize: `${Math.max(8, size * 0.17)}px`, letterSpacing: "0.34em", textIndent: "0.34em", opacity: 0.62 }}
        >
          {tagline ? "Timeless style builds character" : "Men & Boys"}
        </span>
      </span>
    </span>
  );
}
