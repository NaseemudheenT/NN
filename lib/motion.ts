/**
 * NN motion, in one place.
 *
 * Every duration, curve and spring in the interface comes from here. A site
 * where each component picked its own numbers reads as several websites
 * wearing the same colours — the timing is as much a part of an identity as
 * the typeface.
 *
 * The physics is deliberately narrow: three springs and four curves. Anything
 * that needs a fifth is usually a sign the interaction is wrong.
 */

/** Curves. Names describe what they are for, not their control points. */
export const EASE = {
  /** Almost everything: decisive, settles without bouncing. */
  out: [0.22, 1, 0.36, 1],
  /** Symmetrical, for something that leaves and returns. */
  inOut: [0.83, 0, 0.17, 1],
  /** Camera moves and room changes: slow to start, long to settle. */
  architect: [0.16, 0.84, 0.24, 1],
  /** A physical object being set down. Overshoots a little. */
  material: [0.34, 1.26, 0.64, 1],
} as const;

/** Seconds, because Framer Motion works in seconds. */
export const DURATION = {
  instant: 0.12,
  tap: 0.18,
  hover: 0.32,
  panel: 0.52,
  room: 0.82,
  cinematic: 1.4,
} as const;

/**
 * Springs. Stiffness and damping rather than duration, because a spring
 * interrupted mid-flight has to know where it was going and how fast.
 */
export const SPRING = {
  /** A control responding to a press. Fast, barely overshoots. */
  tap: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 },
  /** A surface moving into place. The default for panels and sheets. */
  surface: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 },
  /** Something with weight: a drawer, a large card. */
  heavy: { type: "spring", stiffness: 170, damping: 26, mass: 1.4 },
  /** Magnetic hover. Loose enough to feel attracted rather than snapped. */
  magnetic: { type: "spring", stiffness: 190, damping: 18, mass: 0.6 },
} as const;

/** How far things travel. Small: a reveal should suggest, not slide. */
export const DISTANCE = {
  hair: 4,
  near: 10,
  mid: 22,
  far: 44,
} as const;

/** Stagger, for lists and letters. */
export const STAGGER = {
  letters: 0.028,
  words: 0.055,
  items: 0.07,
  sections: 0.12,
} as const;

/* ── ready-made variants ───────────────────────────────────────────
   Used directly by components so the same reveal is not rewritten
   in nine places with nine slightly different numbers.          */

export const REVEAL = {
  /** Rises into place. Never animates opacity from 0 on content that
      matters — a frozen animation must not leave a page unreadable. */
  rise: {
    hidden: { y: DISTANCE.mid, opacity: 0.001 },
    shown: {
      y: 0,
      opacity: 1,
      transition: { duration: DURATION.panel, ease: EASE.out },
    },
  },
  /** For imagery: unmasks from the bottom rather than fading. */
  unmask: {
    hidden: { clipPath: "inset(100% 0 0 0)" },
    shown: {
      clipPath: "inset(0% 0 0 0)",
      transition: { duration: DURATION.room, ease: EASE.architect },
    },
  },
  /** A container whose children arrive in sequence. */
  sequence: {
    hidden: {},
    shown: { transition: { staggerChildren: STAGGER.items, delayChildren: 0.05 } },
  },
} as const;

/** What reduced motion collapses to: the end state, immediately. */
export const STILL = {
  hidden: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" },
  shown: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", transition: { duration: 0 } },
} as const;
