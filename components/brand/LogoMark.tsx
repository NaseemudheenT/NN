"use client";

/**
 * The 2D NN monogram — the header mark and every flat use of the logo.
 *
 * Plays a single gold shimmer on first paint, as though a showroom spotlight
 * crossed the metal, then holds still. With reduced motion it is static from
 * the start. The whole thing is inline SVG geometry: no image request, no font
 * dependency, a little over a kilobyte on the wire.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  MONOGRAM_WIDTH,
  N_HEIGHT,
  N_INTERLOCK_X,
  N_PATH,
  RING,
} from "./monogram";

interface LogoMarkProps {
  /** Rendered height in pixels. */
  size?: number;
  /** Draw the enclosing gold ring. */
  ring?: boolean;
  /** Run the shimmer once on mount. */
  shimmer?: boolean;
  className?: string;
  /** Accessible name, or null when a sibling already names the logo. */
  title?: string | null;
}

export function LogoMark({
  size = 34,
  ring = true,
  shimmer = true,
  className = "",
  title = "Nero Noren",
}: LogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const [play, setPlay] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (shimmer && !reduced.current) {
      // One frame's delay so the animation is seen starting, not mid-way.
      const id = requestAnimationFrame(() => setPlay(true));
      return () => cancelAnimationFrame(id);
    }
  }, [shimmer]);

  // The ring is centred on the monogram's bounding box with a little air.
  const pad = 26;
  const vbW = MONOGRAM_WIDTH + pad * 2;
  const vbH = N_HEIGHT + pad * 2;
  const cx = vbW / 2;
  const cy = vbH / 2;
  const r = Math.min(vbW, vbH) / 2 - RING.thickness;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      height={size}
      width={size * (vbW / vbH)}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        {/* the travelling highlight, swept once across the letterforms */}
        <linearGradient id={`${uid}sheen`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="38%" stopColor="currentColor" />
          <stop offset="50%" stopColor="var(--accent-soft)" />
          <stop offset="62%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" />
          {play ? (
            <animate
              attributeName="x1"
              values="-1.4;1"
              dur="2.2s"
              begin="0.15s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 0.61 0.36 1"
            />
          ) : null}
          {play ? (
            <animate
              attributeName="x2"
              values="-0.4;2"
              dur="2.2s"
              begin="0.15s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 0.61 0.36 1"
            />
          ) : null}
        </linearGradient>
      </defs>

      {ring ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={RING.thickness}
          opacity="0.85"
        />
      ) : null}

      <g transform={`translate(${pad} ${pad})`} fill={`url(#${uid}sheen)`}>
        {/* the second N sits behind the first, overlapping its right stem */}
        <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} opacity="0.62" />
        <path d={N_PATH} />
      </g>
    </svg>
  );
}

/** The wordmark used beside the monogram in the header and the footer. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-[family-name:var(--font-display)] uppercase tracking-[0.34em] ${className}`}
    >
      Nero Noren
    </span>
  );
}
