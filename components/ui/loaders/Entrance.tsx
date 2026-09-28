"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { useShowroom } from "@/components/layout/ShowroomProvider";
import { MOTION, TAGLINE } from "@/lib/tokens";

/**
 * The entrance. The light comes up on an empty room, the mark appears, the
 * doors part. It runs once per session, is over in under two seconds, and
 * any key or tap skips it. It never waits on the network — the showroom
 * finishes loading behind it.
 *
 * Every moving part is a variant so that AnimatePresence waits for the whole
 * sequence before unmounting, rather than leaving the doors closed.
 */

const shell: Variants = {
  open: {},
  close: { transition: { staggerChildren: 0.04 } },
};

const leftDoor: Variants = {
  open: { x: "0%" },
  close: { x: "-101%", transition: { duration: 0.9, ease: MOTION.ease } },
};

const rightDoor: Variants = {
  open: { x: "0%" },
  close: { x: "101%", transition: { duration: 0.9, ease: MOTION.ease } },
};

const plate: Variants = {
  open: { opacity: 1 },
  close: { opacity: 0, transition: { duration: 0.34, ease: MOTION.ease } },
};

export function Entrance() {
  const { entered, markEntered, reducedMotion, phase } = useShowroom();
  const [dismissed, setDismissed] = useState(false);

  // Derived, not set from inside the effect: a visitor who has already
  // stepped inside this session never sees the doors again.
  const show = !entered && !dismissed;

  useEffect(() => {
    if (!show) return;

    const finish = () => {
      setDismissed(true);
      markEntered();
    };

    const timer = window.setTimeout(finish, reducedMotion ? 300 : 2000);
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [show, markEntered, reducedMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="entrance"
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
          variants={shell}
          initial="open"
          animate="open"
          exit="close"
          role="status"
          aria-label="Entering the Nero Noren showroom"
        >
          {/* the doors */}
          <motion.div variants={leftDoor} className="absolute inset-y-0 left-0 w-[50.5%] bg-nnblack" />
          <motion.div variants={rightDoor} className="absolute inset-y-0 right-0 w-[50.5%] bg-nnblack" />

          {/* the light coming up in an empty room */}
          <motion.div
            variants={plate}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 45%, rgba(201,164,58,0.2), transparent 62%)",
            }}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: MOTION.ease }}
          />

          <motion.div
            variants={plate}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: MOTION.ease }}
            >
              <Monogram className="h-14 w-auto text-[#c9a43a] sm:h-[4.5rem]" />
            </motion.div>

            <motion.span
              className="nn-wordmark mt-7 text-[0.68rem] text-ivory sm:text-[0.78rem]"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: MOTION.ease, delay: 0.25 }}
            >
              Nero Noren
            </motion.span>

            <motion.span
              className="nn-meta mt-4 text-[#8a8378]"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {TAGLINE}
            </motion.span>

            {/* a line of light laid across the floor */}
            <motion.div
              className="mt-9 h-px w-40 origin-center bg-gradient-to-r from-transparent via-[#c9a43a] to-transparent"
              initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.3, ease: MOTION.ease, delay: 0.4 }}
            />

            <motion.span
              className="nn-meta mt-4 text-[0.5rem] text-[#6a655c]"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
            >
              Preparing the {phase} showroom — tap to skip
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
