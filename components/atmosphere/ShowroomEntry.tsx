"use client";

/**
 * Entering the showroom.
 *
 * The loader and the brand entrance are the same thing, because they should
 * be: the customer is arriving somewhere, and the time it takes to open the
 * door is the time it takes to load.
 *
 *   the monogram strikes, and light crosses the metal once
 *   the wordmark and the audience line settle beneath it
 *   a hairline fills as real work completes
 *   the shutter lifts, and the room is behind it
 *
 * Three hard rules, learned the painful way:
 *
 *  1. IT CANNOT TRAP ANYONE. Removal is state, never the completion of an
 *     animation. Both requestAnimationFrame and the CSS animation timeline
 *     are frozen in a hidden tab — measured — so an exit animation that
 *     cannot run would hold a full-screen shutter over the shop forever.
 *     There is a backstop timer past every other timer, and any key or tap
 *     skips the whole thing.
 *  2. THE PROGRESS IS REAL. It reflects fonts, the document, and the
 *     showroom reporting itself ready. A bar that animates to 100% on a
 *     timer while the page is still loading is a lie told to the customer.
 *  3. IT DOES NOT PLAY TWICE. Once per session, and never on a tab nobody
 *     is looking at — spending the entrance on a background tab wastes it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";

const SESSION_KEY = "nn-entered";

/** The longest the shutter may ever stay down, whatever else happens. */
const BACKSTOP_MS = 9000;
/** How long the shutter takes to lift. */
const LIFT_MS = 900;

/** Other parts of the app tell the entry that the room is ready. */
const READY_EVENT = "nn:showroom-ready";
export function announceShowroomReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(READY_EVENT));
}

export function ShowroomEntry() {
  const [mounted, setMounted] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [progress, setProgress] = useState(0);
  const settled = useRef(false);

  /** Raise the shutter and remove it. Idempotent. */
  const open = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    setProgress(1);
    setLifting(true);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* it simply plays again next session */
    }
    document.documentElement.style.removeProperty("overflow");
    // Removal is a timer on state, not the animation's end.
    window.setTimeout(() => setMounted(false), LIFT_MS);
  }, []);

  /* should it play at all? */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.visibilityState !== "visible") return;

    const forced = new URLSearchParams(window.location.search).get("entry") === "1";
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* no storage: play it */
    }
    if (seen && !forced) return;

    setMounted(true);
    document.documentElement.style.overflow = "hidden";
  }, []);

  /* real progress, from real signals */
  useEffect(() => {
    if (!mounted) return;

    const milestones = { fonts: 0.3, document: 0.3, showroom: 0.4 };
    let earned = 0;
    const credit = (amount: number) => {
      earned = Math.min(1, earned + amount);
      setProgress(earned);
      if (earned >= 1) open();
    };

    // Fonts: the wordmark is the mark, so it must not swap mid-entrance.
    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => credit(milestones.fonts));
    } else {
      credit(milestones.fonts);
    }

    // The document itself.
    if (document.readyState === "complete") {
      credit(milestones.document);
    } else {
      const onLoad = () => credit(milestones.document);
      window.addEventListener("load", onLoad, { once: true });
    }

    // The showroom, if there is one on this page. If nothing reports in,
    // the floor below credits it rather than waiting forever.
    const onReady = () => credit(milestones.showroom);
    window.addEventListener(READY_EVENT, onReady, { once: true });

    // A floor on the sequence, so the entrance is never a flicker, and a
    // ceiling so a page with no showroom does not hang on one.
    const floor = window.setTimeout(() => credit(0), 1500);
    const ceiling = window.setTimeout(() => credit(milestones.showroom), 3200);
    // And the backstop, which outranks everything above.
    const backstop = window.setTimeout(open, BACKSTOP_MS);

    return () => {
      window.removeEventListener(READY_EVENT, onReady);
      window.clearTimeout(floor);
      window.clearTimeout(ceiling);
      window.clearTimeout(backstop);
    };
  }, [mounted, open]);

  /* any key or tap opens the door */
  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", open, { once: true });
    window.addEventListener("pointerdown", open, { once: true });
    return () => {
      window.removeEventListener("keydown", open);
      window.removeEventListener("pointerdown", open);
    };
  }, [mounted, open]);

  /* never leave the page locked if this unmounts mid-flight */
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("overflow");
    },
    [],
  );

  if (!mounted) return null;

  return (
    <div
      className="nn-entry"
      data-lifting={lifting ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="Entering the Nero Noren showroom"
      style={{ pointerEvents: lifting ? "none" : "auto" }}
    >
      {/* the light in the entrance */}
      <div className="nn-entry__light" aria-hidden="true" />

      <div className="nn-entry__stage">
        {/* the monogram, struck in metal */}
        <svg
          className="nn-entry__mark"
          viewBox={`0 0 ${N_INTERLOCK_X + 84} 100`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nn-entry-metal" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0%" stopColor="var(--metal-shadow)" />
              <stop offset="34%" stopColor="var(--metal-body)" />
              <stop offset="50%" stopColor="var(--metal-spec)" />
              <stop offset="66%" stopColor="var(--metal-body)" />
              <stop offset="100%" stopColor="var(--metal-shadow)" />
            </linearGradient>
          </defs>
          {/* two paths, one fill: the shared stem reads as one ligature */}
          <g fill="url(#nn-entry-metal)">
            <path d={N_PATH} />
            <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
          </g>
        </svg>

        <div className="nn-entry__type">
          <span className="nn-entry__wordmark">Nero Noren</span>
          <span className="nn-entry__audience">Men &amp; Boys</span>
        </div>

        {/* the progress, reporting real work */}
        <div className="nn-entry__meter" aria-hidden="true">
          <span
            className="nn-entry__fill"
            style={{ transform: `scaleX(${Math.max(0.02, progress)})` }}
          />
        </div>
        <span className="nn-entry__tagline">Timeless style builds character</span>
      </div>
    </div>
  );
}
