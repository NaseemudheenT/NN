"use client";

/**
 * The NN Atelier orb.
 *
 * A small object of light at the corner of every page: a lens of optical glass
 * with a champagne-gold iridescence turning slowly inside it, breathing at
 * roughly the rate of a resting person. Tapping it opens the concierge.
 *
 * It is built from stacked conic and radial gradients rather than a canvas,
 * for three reasons: it costs no WebGL context on a page that may already have
 * one, it animates entirely on the compositor, and it collapses to a single
 * static disc under prefers-reduced-motion without any branching in the markup.
 *
 * Iridescence is the whole trick. A single gold glow reads as a notification
 * badge; what makes a surface look lit from within is two or three hues of
 * nearly the same value drifting across each other at different speeds, so the
 * highlight never settles anywhere the eye can fix on.
 */

export type OrbState = "idle" | "listening" | "thinking" | "answering";

const SIZES = { sm: 34, md: 46, lg: 64 } as const;

export function AtelierOrb({
  state = "idle",
  size = "md",
  className = "",
}: {
  state?: OrbState;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];

  return (
    <span
      className={`nn-orb nn-orb--${state} ${className}`}
      style={{ width: px, height: px }}
      data-state={state}
      aria-hidden="true"
    >
      {/* the glass shell, catching a highlight at the top left */}
      <span className="nn-orb__shell" />
      {/* the iridescence: three hues turning at three speeds */}
      <span className="nn-orb__iris nn-orb__iris--a" />
      <span className="nn-orb__iris nn-orb__iris--b" />
      <span className="nn-orb__iris nn-orb__iris--c" />
      {/* the core, which is what actually breathes */}
      <span className="nn-orb__core" />
      {/* a single specular point, so it reads as a sphere rather than a disc */}
      <span className="nn-orb__spec" />
    </span>
  );
}
