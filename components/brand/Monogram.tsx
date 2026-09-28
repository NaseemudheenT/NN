import type { SVGProps } from "react";

/**
 * The NN monogram: two serif N's, interlocked, as on the brand board.
 * Drawn as geometry so it stays crisp at every size and needs no webfont.
 *
 * One N occupies 0–100 × 0–120. The second is offset so its left stem
 * passes through the first's right stem — the interlock of the mark.
 */
const STEM = 10;
const SERIF = 4.5;
const TOP = 16;
const BOT = 104;
const OFFSET = 58;

function SingleN({ x }: { x: number }) {
  const l = x + 20;
  const r = x + 70;
  return (
    <g>
      {/* diagonal — the thick stroke of the letter */}
      <polygon points={`${l},${TOP} ${l + 24},${TOP} ${r + STEM},${BOT} ${r + STEM - 24},${BOT}`} />
      {/* stems */}
      <rect x={l} y={TOP} width={STEM} height={BOT - TOP} />
      <rect x={r} y={TOP} width={STEM} height={BOT - TOP} />
      {/* serifs — hairline slabs, top and foot of each stem */}
      <rect x={l - 9} y={TOP - SERIF} width={STEM + 18} height={SERIF} />
      <rect x={r - 9} y={TOP - SERIF} width={STEM + 18} height={SERIF} />
      <rect x={l - 9} y={BOT} width={STEM + 18} height={SERIF} />
      <rect x={r - 9} y={BOT} width={STEM + 18} height={SERIF} />
    </g>
  );
}

export function Monogram({
  title = "Nero Noren",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${100 + OFFSET} 120`}
      fill="currentColor"
      role="img"
      aria-label={title}
      {...props}
    >
      <SingleN x={0} />
      <SingleN x={OFFSET} />
    </svg>
  );
}

/**
 * The monogram with a slow spotlight travelling across the metal —
 * the small, cheap counterpart to the 3D sign in the showroom.
 */
export function LiveMonogram({
  className,
  title = "Nero Noren",
}: {
  className?: string;
  title?: string;
}) {
  const id = "nn-sheen-grad";
  return (
    <svg
      viewBox={`0 0 ${100 + OFFSET} 120`}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="42%" stopColor="currentColor" />
          <stop offset="50%" stopColor="var(--nn-brass-light)" />
          <stop offset="58%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="1 0"
            dur="6s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <SingleN x={0} />
        <SingleN x={OFFSET} />
      </g>
    </svg>
  );
}
