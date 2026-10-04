"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { Plate } from "./Plate";
import type { PlateId } from "@/lib/tower/plates";

/**
 * The arrival.
 *
 * Black, the mark, then three views of NN Tower in sequence — the city from
 * above, the street, the door — and then a way in. It runs once. After
 * that the building remembers you and opens on the door.
 *
 * ── why three plates and not a turntable ─────────────────────────────
 * The brief asked for the building to rotate. A real turntable needs the
 * building photographed at every angle around it, and the render boards
 * contain three: the aerial, the street and the facade. Three cuts that
 * genuinely describe the building beat a fake orbit that reveals it has
 * no back — and cutting wide, medium, close is how a title sequence
 * establishes a place anyway.
 *
 * ── why all three shots are mounted from the first frame ─────────────
 * They used to mount at their own cue, which meant each cut arrived at an
 * image the browser had not fetched yet and the film played as a series
 * of black rectangles. Now every plate is in the document from t=0 and
 * only its opacity changes. The cut is then guaranteed to land on a
 * decoded image, and cross-fading opacity on the compositor is smoother
 * than mounting a new element besides.
 *
 * ── why it can always be skipped ─────────────────────────────────────
 * Because someone who came back to buy a shirt did not come back for a
 * film. Skip is on screen from the first frame, not after a polite delay,
 * and reduced-motion goes straight to the door.
 */

type Stage = "mark" | "aerial" | "street" | "door";

interface Shot {
  stage: Stage;
  plate: PlateId;
  alt: string;
  /** The push, in and out, for as long as the shot is up. */
  from: number;
  to: number;
  caption?: string;
  sub?: string;
}

const SHOTS: Shot[] = [
  {
    stage: "aerial",
    plate: "aerial",
    alt: "NN Tower from above: the glass dome over the atrium, the rooftop terrace garden and the streets around the block.",
    from: 1.16,
    to: 1.02,
    caption: "NN Tower",
    sub: "The flagship",
  },
  {
    stage: "street",
    plate: "street",
    alt: "NN Tower from the boulevard at dusk, lit along a wet European street lined with trees.",
    from: 1.0,
    to: 1.1,
    caption: "Street level",
    sub: "Entrance · Reception",
  },
  {
    stage: "door",
    plate: "facade",
    alt: "The front of NN Tower at dusk: lit arched windows, NN banners down the stone piers, and the entrance beneath the dome.",
    from: 1.07,
    to: 1.0,
  },
];

const BEATS: { next: Stage; at: number }[] = [
  { next: "aerial", at: 3200 },
  { next: "street", at: 6100 },
  { next: "door", at: 9100 },
];

const VISITED = "nn-tower-visited";

export function Overture({ onEnter }: { onEnter: () => void }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("mark");
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const toDoor = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage("door");
    setReady(true);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(VISITED) === "yes";
    } catch {
      /* private browsing has nothing to remember with; just play it */
    }
    if (seen || reduce) {
      toDoor();
      return;
    }
    timers.current = BEATS.map((b) =>
      setTimeout(() => {
        setStage(b.next);
        if (b.next === "door") setReady(true);
      }, b.at),
    );
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, [reduce, toDoor]);

  const enter = () => {
    try {
      window.localStorage.setItem(VISITED, "yes");
    } catch {
      /* then the film simply plays again next time */
    }
    onEnter();
  };

  return (
    <div className="ovr" data-stage={stage}>
      {SHOTS.map((s) => {
        const on = stage === s.stage;
        return (
          <motion.div
            key={s.stage}
            className="ovr__shot"
            data-on={on || undefined}
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <motion.div
              className="ovr__frame"
              initial={false}
              animate={{ scale: on && !reduce ? s.to : s.from }}
              transition={{ duration: on ? 7 : 0, ease: "linear" }}
            >
              <Plate
                id={s.plate}
                alt={s.alt}
                /* The first cut gets the preload; the other two are fetched
                   eagerly from the first frame so that their cut, six and
                   nine seconds later, lands on a decoded image. */
                priority={s.stage === "aerial"}
                loading="eager"
                sizes="100vw"
                className="ovr__plate"
              />
            </motion.div>

            {s.caption && (
              <motion.div
                className="ovr__cap"
                initial={false}
                animate={{ opacity: on ? 1 : 0, y: on ? 0 : 10 }}
                transition={{ duration: 1, delay: on ? 0.6 : 0 }}
              >
                <p className="ovr__capTitle">{s.caption}</p>
                {s.sub && <p className="label label--soft">{s.sub}</p>}
              </motion.div>
            )}
          </motion.div>
        );
      })}

      <AnimatePresence>
        {stage === "mark" && (
          <motion.div
            key="mark"
            className="ovr__mark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            /* Out faster than the plate comes in, so the wordmark has
               cleared the frame before the building arrives underneath it
               rather than hanging over the roof at half opacity. */
            exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeIn" } }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Monogram size={140} className="ovr__monogram" title="Nero Noren" />
            </motion.div>
            <motion.p
              className="ovr__word"
              initial={{ opacity: 0, letterSpacing: "0.62em" }}
              animate={{ opacity: 1, letterSpacing: "0.34em" }}
              transition={{ duration: 1.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              NERO NOREN
            </motion.p>
            <motion.p
              className="ovr__tag label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.5 }}
            >
              Timeless style builds character
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && (
          <motion.div
            className="ovr__door"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className="btn btn--glass btn--lg ovr__enter" onClick={enter}>
              Enter the tower
            </button>
            <p className="ovr__hint small">Nine levels · Men &amp; boys</p>
          </motion.div>
        )}
      </AnimatePresence>

      {stage !== "door" && (
        <button type="button" className="ovr__skip label" onClick={toDoor}>
          Skip
        </button>
      )}
    </div>
  );
}
