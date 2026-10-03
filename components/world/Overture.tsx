"use client";

import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import type { Phase } from "./World";

/**
 * The first ten seconds.
 *
 * Black. The mark resolves. The name opens out of its own centre — the
 * letters start tight and the tracking expands, which is the one typographic
 * move that reads as a name being SET rather than as text appearing. Then
 * the tagline, then one word: Start.
 *
 * Press it and this whole layer gets out of the way so the camera can do
 * its work; all that remains over the film is Skip, and even that only
 * fades in after a couple of seconds so it never competes with the opening
 * frame.
 *
 * ── why the timings are in CSS ───────────────────────────────────────
 * Every reveal here is a CSS animation, not a JavaScript one. A JavaScript
 * animation runs on requestAnimationFrame, and rAF does not fire in a
 * hidden tab — so a visitor who opens Nero Noren in a background tab and
 * comes back to it later would find a permanently black screen with an
 * invisible button on it. CSS animations are handed to the compositor and
 * finish whether or not anyone was watching. The one timer in this file
 * only decides when the Start button becomes available, and it uses
 * setTimeout, which fires in a hidden tab.
 */
export function Overture({
  phase,
  returning,
  onReady,
  onBegin,
  onEnter,
  onSkip,
}: {
  phase: Phase;
  returning: boolean;
  onReady: () => void;
  onBegin: () => void;
  onEnter: () => void;
  onSkip: () => void;
}) {
  const [skipVisible, setSkipVisible] = useState(false);

  /* The mark takes 2.6 s to resolve. A returning visitor should not be made
     to sit through even that before Start is live, so for them it is 1.5.

     ── the bug that was here ────────────────────────────────────────
     A `fired` ref guarded this so the timer could only be set once. That
     is exactly backwards. The effect's cleanup clears the timeout on every
     re-run, and a re-run that hits the guard returns WITHOUT setting a new
     one — so the first time anything re-rendered this component (and the
     localStorage read guarantees one), the timer was cancelled and never
     replaced. Start stayed disabled forever and the site could not be
     entered at all.

     The fix is to have no guard and stable callbacks: the effect owns its
     timer, cleans it up, and re-arms it, which is what an effect is for. */
  useEffect(() => {
    if (phase !== "logo") return;
    const id = window.setTimeout(onReady, returning ? 1500 : 2600);
    return () => window.clearTimeout(id);
  }, [phase, returning, onReady]);

  /* Skip appears a beat into the film, never on its first frame — except
     for a returning visitor, who gets it immediately. */
  useEffect(() => {
    if (phase !== "arriving" && phase !== "door" && phase !== "entering") return;
    const id = window.setTimeout(() => setSkipVisible(true), returning ? 80 : 2200);
    return () => window.clearTimeout(id);
  }, [phase, returning]);

  if (phase === "live") return null;

  const titling = phase === "logo" || phase === "ready";

  return (
    <>
      {titling ? (
        <div className="ovt" role="presentation">
          <div className="ovt__in">
            <Monogram size={72} className="ovt__mark" title="Nero Noren" />

            {/* set as individual letters so the tracking can open from the
                centre out rather than pushing the whole line to the right */}
            <span className="ovt__name" aria-label="Nero Noren">
              {"NERO NOREN".split("").map((ch, i) => (
                <span key={i} className="ovt__ch" style={{ "--i": i } as React.CSSProperties}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </span>

            <span className="ovt__rule" aria-hidden />
            <p className="label label--wide ovt__line">Timeless style builds character</p>

            <button
              type="button"
              className="btn btn--glass btn--lg ovt__start"
              data-live={phase === "ready" || undefined}
              onClick={onBegin}
              disabled={phase !== "ready"}
            >
              Start
            </button>

            {returning ? (
              <button type="button" className="ovt__skip label" onClick={onSkip}>
                Skip the arrival
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "door" ? (
        <div className="ovt ovt--door">
          <div className="ovt__in">
            <p className="label label--wide ovt__line ovt__line--still">The showroom</p>
            <button type="button" className="btn btn--glass btn--lg ovt__start" data-live onClick={onEnter}>
              Enter the showroom
            </button>
          </div>
        </div>
      ) : null}

      {(phase === "arriving" || phase === "door" || phase === "entering") && skipVisible ? (
        <button type="button" className="ovt__skip ovt__skip--film label" onClick={onSkip}>
          Skip
        </button>
      ) : null}
    </>
  );
}
