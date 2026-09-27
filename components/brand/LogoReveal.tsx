"use client";

/**
 * The NN opening.
 *
 * The brand introduces itself the way a name is spoken: the monogram first,
 * a beat of silence, then each N opening out into the word it stands for.
 *
 *   0.0s  the interlocked NN draws itself in gold
 *   1.4s  it goes dark — one full second of nothing, which is what gives the
 *         letters that follow their weight
 *   2.4s  the first N returns, and E·R·O trail out of it — NERO
 *   3.5s  the second N returns, and O·R·E·N trail out of it — NOREN
 *   4.6s  the rule draws, the tagline settles
 *   5.4s  the curtain lifts and the showroom is behind it
 *
 * It plays once per session. A returning customer is not made to watch it
 * again, and anyone who wants past it can press a key or tap. With reduced
 * motion it does not play at all.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { LogoMark } from "./LogoMark";

const SESSION_KEY = "nn-intro-played";

/** Letters that trail out of each N. */
const NERO = ["E", "R", "O"];
const NOREN = ["O", "R", "E", "N"];

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function LogoReveal() {
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  /** 0 monogram · 1 dark · 2 NERO · 3 NOREN · 4 settle */
  const [beat, setBeat] = useState(0);

  const finish = useCallback(() => {
    setPlaying(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* the intro simply plays again next time */
    }
    document.documentElement.style.removeProperty("overflow");
  }, []);

  /* decide whether to play at all */
  useEffect(() => {
    if (reducedMotion) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* no storage: play it */
    }
    if (seen) return;

    setPlaying(true);
    // Hold the page still underneath, so the showroom is not scrolled past
    // while the curtain is down.
    document.documentElement.style.overflow = "hidden";
  }, [reducedMotion]);

  /* the beats */
  useEffect(() => {
    if (!playing) return;
    const timers = [
      setTimeout(() => setBeat(1), 1400), // the monogram goes
      setTimeout(() => setBeat(2), 2400), // NERO
      setTimeout(() => setBeat(3), 3500), // NOREN
      setTimeout(() => setBeat(4), 4600), // settle
      setTimeout(finish, 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playing, finish]);

  /* any key or tap gets you past it */
  useEffect(() => {
    if (!playing) return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
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

  const word = (letters: string[], visible: boolean, delayBase: number) =>
    letters.map((letter, i) => (
      <motion.span
        key={letter + i}
        initial={{ opacity: 0, x: -18, filter: "blur(6px)" }}
        animate={
          visible
            ? { opacity: 1, x: 0, filter: "blur(0px)" }
            : { opacity: 0, x: -18, filter: "blur(6px)" }
        }
        transition={{ duration: 0.5, ease: EASE, delay: visible ? delayBase + i * 0.075 : 0 }}
        className="inline-block"
      >
        {letter}
      </motion.span>
    ));

  return (
    <AnimatePresence>
      {playing ? (
        <motion.div
          key="nn-intro"
          className="fixed inset-0 z-[200] grid place-items-center"
          style={{ background: "#000000" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}
          aria-hidden="true"
        >
          {/* a single lamp above, so the gold has something to catch */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 45% at 50% 38%, rgba(201,164,58,0.16), transparent 70%)",
            }}
            animate={{ opacity: beat === 1 ? 0.25 : 1 }}
            transition={{ duration: 0.8, ease: EASE }}
          />

          <div className="relative flex flex-col items-center px-6">
            {/* ── the monogram ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.86, filter: "blur(10px)" }}
              animate={
                beat === 0
                  ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                  : { opacity: 0, scale: 1.08, filter: "blur(8px)" }
              }
              transition={{ duration: beat === 0 ? 1.0 : 0.55, ease: EASE }}
              className="absolute"
            >
              <LogoMark size={128} shimmer={false} title={null} />
            </motion.div>

            {/* ── the two words ── */}
            <motion.div
              className="flex flex-col items-center gap-1 font-[family-name:var(--font-display)] uppercase"
              style={{ color: "#efe9dd" }}
              animate={{ opacity: beat >= 2 ? 1 : 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* NERO */}
              <span className="flex text-[clamp(2.4rem,11vw,5.5rem)] leading-[1.02] tracking-[0.16em]">
                <motion.span
                  initial={{ opacity: 0, scale: 1.5 }}
                  animate={beat >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="inline-block"
                  style={{ color: "#c9a43a" }}
                >
                  N
                </motion.span>
                {word(NERO, beat >= 2, 0.28)}
              </span>

              {/* NOREN */}
              <span className="flex text-[clamp(2.4rem,11vw,5.5rem)] leading-[1.02] tracking-[0.16em]">
                <motion.span
                  initial={{ opacity: 0, scale: 1.5 }}
                  animate={beat >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="inline-block"
                  style={{ color: "#c9a43a" }}
                >
                  N
                </motion.span>
                {word(NOREN, beat >= 3, 0.28)}
              </span>

              {/* the rule, then the tagline */}
              <motion.span
                className="mt-6 block h-px"
                style={{ background: "#c9a43a" }}
                initial={{ width: 0 }}
                animate={{ width: beat >= 4 ? "min(20rem, 70vw)" : 0 }}
                transition={{ duration: 0.8, ease: EASE }}
              />
              <motion.span
                className="mt-5 font-[family-name:var(--font-ui)] text-[0.7rem] tracking-[0.42em]"
                style={{ color: "#b8ae9c" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              >
                THE ART OF DRESSING WELL
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
