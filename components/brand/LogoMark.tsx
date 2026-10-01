"use client";

/**
 * The 2D NN monogram — the header mark and every flat use of the logo.
 *
 * This is the one place in the interface where gold is correct, because here
 * it is not a colour choice: the mark is plated metal, and the sheen crossing
 * it is a showroom spotlight moving over that plate. It therefore reads from
 * --metal-* directly and never from --accent, which is ink.
 *
 * Two motions. A spotlight crosses the metal and then rests, repeating slowly
 * enough that it reads as the light moving rather than as a loop. And on
 * approach the two Ns ease apart and settle back together — the ligature
 * breathing, which is what makes a shared stem legible as a deliberate join
 * rather than a collision.
 *
 * With reduced motion neither runs. Inline SVG geometry throughout: no image
 * request, no font dependency, a little over a kilobyte on the wire.
 */

import { useId } from "react";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";
import {
  MONOGRAM_WIDTH,
  N_HEIGHT,
  N_INTERLOCK_X,
  N_PATH,
  RING,
} from "./monogram";

/**
 * How the spotlight behaves.
 *
 * "once" is right for the header: the light crosses the metal as the page
 * arrives and then leaves it alone, because a mark that keeps glinting in the
 * corner of the eye while someone is reading is a distraction, not a brand.
 * "loop" is for the large display marks — the 404, the order confirmation,
 * the console — where the mark IS the page and a slow returning light reads
 * as a lit object rather than a logo.
 */
export type LogoSheen = "once" | "loop" | "none";

interface LogoMarkProps {
  /** Rendered height in pixels. */
  size?: number;
  /** Draw the enclosing gold ring. */
  ring?: boolean;
  /** How the spotlight crosses the metal. */
  sheen?: LogoSheen;
  className?: string;
  /** Accessible name, or null when a sibling already names the logo. */
  title?: string | null;
}

export function LogoMark({
  size = 34,
  ring = true,
  sheen = "once",
  className = "",
  title = "Nero Noren",
}: LogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();

  /* Derived, not scheduled.
     This used to wait for a requestAnimationFrame before mounting the SMIL,
     which meant the sheen silently never ran in a background tab — a frame
     callback does not fire in a page the browser is not painting. The SMIL
     carries its own 0.15s begin, so the frame's delay bought nothing it did
     not already have. Rendering it straight also puts it in the server HTML,
     so the light crosses the metal on first paint without waiting on JS. */
  const play = sheen !== "none" && !reducedMotion;

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
      className={`nn-mark ${className}`}
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
          <stop offset="50%" stopColor="var(--metal-spec)" />
          <stop offset="62%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" />
          {/* Looping, the sweep takes 2.2s of an 11s cycle and rests for the
              other nine: a highlight that crossed continuously would read as
              a loading shimmer, one that crosses and waits reads as a lamp.
              Once, it simply crosses and freezes where it left off. */}
          {play ? (
            <>
              <animate
                attributeName="x1"
                values={sheen === "loop" ? "-1.4;1;1" : "-1.4;1"}
                keyTimes={sheen === "loop" ? "0;0.2;1" : undefined}
                dur={sheen === "loop" ? "11s" : "2.2s"}
                begin="0.15s"
                repeatCount={sheen === "loop" ? "indefinite" : undefined}
                fill={sheen === "loop" ? undefined : "freeze"}
                calcMode="spline"
                keySplines={
                  sheen === "loop" ? "0.22 0.61 0.36 1;0 0 1 1" : "0.22 0.61 0.36 1"
                }
              />
              <animate
                attributeName="x2"
                values={sheen === "loop" ? "-0.4;2;2" : "-0.4;2"}
                keyTimes={sheen === "loop" ? "0;0.2;1" : undefined}
                dur={sheen === "loop" ? "11s" : "2.2s"}
                begin="0.15s"
                repeatCount={sheen === "loop" ? "indefinite" : undefined}
                fill={sheen === "loop" ? undefined : "freeze"}
                calcMode="spline"
                keySplines={
                  sheen === "loop" ? "0.22 0.61 0.36 1;0 0 1 1" : "0.22 0.61 0.36 1"
                }
              />
            </>
          ) : null}
        </linearGradient>
      </defs>

      {ring ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--metal-body)"
          strokeWidth={RING.thickness}
          opacity="0.85"
        />
      ) : null}

      <g transform={`translate(${pad} ${pad})`} fill={`url(#${uid}sheen)`}>
        {/* The second N sits behind the first, overlapping its right stem.
            Both at full strength: the board shows one solid ligature, and a
            faded second N would put a seam down the shared stem.

            The two halves carry their own classes so the ligature can ease
            apart on approach. The CSS translates them a hair in opposite
            directions and settles them back, which is the whole gesture —
            any further and the shared stem separates and the mark stops
            being one letterform. */}
        <path
          className="nn-mark__n nn-mark__n--b"
          d={N_PATH}
          transform={`translate(${N_INTERLOCK_X} 0)`}
        />
        <path className="nn-mark__n nn-mark__n--a" d={N_PATH} />
      </g>
    </svg>
  );
}

/** The wordmark used beside the monogram in the header and the footer. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-[family-name:var(--font-display)] uppercase tracking-[0.3em] ${className}`}
    >
      Nero Noren
    </span>
  );
}
