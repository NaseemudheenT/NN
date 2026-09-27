"use client";

/**
 * The NN opening.
 *
 * The brand introduces itself the way a name is spoken: the monogram first, a
 * beat of silence, then each N opening out into the word it stands for.
 *
 *   0.0s  the interlocked NN draws itself in gold
 *   1.4s  it goes dark — one full second of nothing, which is what gives the
 *         letters that follow their weight
 *   2.4s  the first N returns, and E·R·O trail out of it — NERO
 *   3.5s  the second N returns, and O·R·E·N trail out of it — NOREN
 *   4.6s  the rule draws, the tagline settles
 *   5.4s  the curtain lifts and the showroom is behind it
 *
 * Two rules this obeys, because a full-screen overlay that fails is the worst
 * thing on a storefront:
 *
 *  1. The whole sequence is CSS keyframes, not a JavaScript animation.
 *     requestAnimationFrame does not fire in a hidden tab, so an rAF-driven
 *     intro would freeze mid-sequence and — worse — its exit could never
 *     complete, leaving the customer looking at a black screen with no way
 *     out. CSS animations are composited and finish regardless.
 *  2. Removal is state, never animation. When the timer says done, the element
 *     is gone. There is also a hard backstop well past the end, so even if a
 *     timer is throttled into oblivion the overlay cannot outlive it.
 *
 * It plays once per session, only when the tab is actually being looked at,
 * and not at all under reduced motion. Any key or tap skips it.
 */

import { useCallback, useEffect, useState } from "react";
import { LogoMark } from "./LogoMark";

const SESSION_KEY = "nn-intro-played";

/** Total run time, and the backstop that cannot be outlived. */
const RUN_MS = 5400;
const FADE_MS = 700;
const BACKSTOP_MS = RUN_MS + FADE_MS + 3000;

export function LogoReveal() {
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* it simply plays again next session */
    }
    document.documentElement.style.removeProperty("overflow");
  }, []);

  /* decide whether to play at all */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // ?intro=1 forces it, for review. Same idea as ?phase=night.
    const forced = new URLSearchParams(window.location.search).get("intro") === "1";

    // Don't spend the one-per-session opening on a tab nobody is looking at.
    if (!forced && document.visibilityState !== "visible") return;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* no storage: play it */
    }
    if (seen && !forced) return;

    setPlaying(true);
    // Hold the page still underneath while the curtain is down.
    document.documentElement.style.overflow = "hidden";
  }, []);

  /* the end, and the backstop */
  useEffect(() => {
    if (!playing) return;
    const done = setTimeout(finish, RUN_MS);
    const gone = setTimeout(() => setPlaying(false), RUN_MS + FADE_MS);
    // If either of the above is throttled away, this still clears the screen.
    const backstop = setTimeout(() => {
      setPlaying(false);
      document.documentElement.style.removeProperty("overflow");
    }, BACKSTOP_MS);
    return () => {
      clearTimeout(done);
      clearTimeout(gone);
      clearTimeout(backstop);
    };
  }, [playing, finish]);

  /* any key or tap gets you past it */
  useEffect(() => {
    if (!playing) return;
    const skip = () => {
      finish();
      setTimeout(() => setPlaying(false), FADE_MS);
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [playing, finish]);

  /* never leave the page locked if this unmounts mid-flight */
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("overflow");
    },
    [],
  );

  if (!playing) return null;

  return (
    <div
      className="nn-intro"
      data-leaving={leaving ? "true" : "false"}
      aria-hidden="true"
      // Never able to swallow a tap, even if something above goes wrong.
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      <div className="nn-intro__lamp" />

      <div className="nn-intro__stage">
        {/* the monogram, then its absence */}
        <div className="nn-intro__mark">
          <LogoMark size={128} shimmer={false} title={null} />
        </div>

        {/* the two words */}
        <div className="nn-intro__words">
          <span className="nn-intro__word">
            <span className="nn-intro__n" style={{ animationDelay: "2.40s" }}>
              N
            </span>
            {["E", "R", "O"].map((letter, i) => (
              <span
                key={letter}
                className="nn-intro__letter"
                style={{ animationDelay: `${2.68 + i * 0.075}s` }}
              >
                {letter}
              </span>
            ))}
          </span>

          <span className="nn-intro__word">
            <span className="nn-intro__n" style={{ animationDelay: "3.50s" }}>
              N
            </span>
            {["O", "R", "E", "N"].map((letter, i) => (
              <span
                key={letter + i}
                className="nn-intro__letter"
                style={{ animationDelay: `${3.78 + i * 0.075}s` }}
              >
                {letter}
              </span>
            ))}
          </span>

          <span className="nn-intro__rule" />
          <span className="nn-intro__tagline">THE ART OF DRESSING WELL</span>
        </div>
      </div>
    </div>
  );
}
