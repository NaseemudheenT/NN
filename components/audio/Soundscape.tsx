"use client";

/**
 * The room tone, and the only thing on screen that admits it exists.
 *
 * A physical flagship has sound in it before you notice the sound. The digital
 * equivalent has to respect two things a shop does not: a browser will not let
 * audio start without a gesture, and a visitor who did not ask for sound must
 * be able to stop it in one move and never be asked again.
 *
 * So: the engine arms itself on the first real interaction with the page, the
 * soundscape follows the hour the room is in, and the whole interface for it is
 * eight hairlines of light in the header, three millimetres tall. Tapping them
 * mutes. There is nothing else — no tray, no volume slider, no track list.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useDayPhase } from "@/components/theme/ThemeProvider";
import { getSoundscapeEngine } from "@/lib/soundscape-engine";
import { soundscapeForPhase } from "@/lib/soundscape";

const PREF = "nn-sound";
const BARS = 8;

export function Soundscape() {
  const { phase, reducedMotion } = useDayPhase();
  const [on, setOn] = useState(false);
  /** null until the stored choice has been read, so nothing flickers. */
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const bars = useRef<HTMLSpanElement[]>([]);
  const raf = useRef(0);
  const data = useRef(new Uint8Array(BARS));

  /* the stored choice. Silence is the default: sound is something a visitor
     opts into by interacting, never something that happens to them. */
  useEffect(() => {
    let choice = true;
    try {
      choice = window.localStorage.getItem(PREF) !== "off";
    } catch {
      /* private browsing: the default stands */
    }
    setAllowed(choice);
  }, []);

  /* Arm on the first genuine interaction. Browsers require a gesture; this
     uses the one the visitor was already making rather than asking for one. */
  useEffect(() => {
    if (allowed !== true) return;

    const engine = getSoundscapeEngine();
    let done = false;

    const start = () => {
      if (done) return;
      done = true;
      engine.select(soundscapeForPhase(phase).id);
      void engine.resume().then((ok) => setOn(ok));
    };

    window.addEventListener("pointerdown", start, { once: true, passive: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("scroll", start, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("scroll", start);
    };
  }, [allowed, phase]);

  /* the soundscape follows the hour, and cross-fades rather than cutting */
  useEffect(() => {
    if (!on) return;
    getSoundscapeEngine().select(soundscapeForPhase(phase).id);
  }, [on, phase]);

  /* a tab in the background is a room you are not standing in */
  useEffect(() => {
    if (!on) return;
    const engine = getSoundscapeEngine();
    const onVisibility = () => {
      if (document.hidden) void engine.suspend();
      else void engine.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [on]);

  /* the bars. Written straight to style, never through React: this runs at
     sixty hertz and a setState here would re-render the shell sixty times a
     second for eight numbers. */
  useEffect(() => {
    if (!on || reducedMotion) return;
    const engine = getSoundscapeEngine();

    const tick = () => {
      engine.levels(data.current);
      for (let i = 0; i < BARS; i++) {
        const el = bars.current[i];
        if (!el) continue;
        const v = data.current[i] / 255;
        el.style.transform = `scaleY(${(0.16 + v * 0.84).toFixed(3)})`;
        el.style.opacity = String(0.4 + v * 0.6);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [on, reducedMotion]);

  const toggle = useCallback(() => {
    const engine = getSoundscapeEngine();
    if (on) {
      void engine.suspend();
      setOn(false);
      setAllowed(false);
      try {
        window.localStorage.setItem(PREF, "off");
      } catch {
        /* the choice holds for this visit */
      }
    } else {
      setAllowed(true);
      try {
        window.localStorage.setItem(PREF, "on");
      } catch {
        /* as above */
      }
      engine.select(soundscapeForPhase(phase).id);
      void engine.resume().then((ok) => setOn(ok));
    }
  }, [on, phase]);

  // Nothing renders until the stored choice is known, so the header never
  // shows one state and then corrects itself.
  if (allowed === null) return null;

  const scape = soundscapeForPhase(phase);

  return (
    <button
      type="button"
      onClick={toggle}
      className="nn-sound"
      data-on={on}
      aria-pressed={on}
      title={on ? `${scape.title} — tap for silence` : "Room sound is off"}
      aria-label={
        on
          ? `Room sound on: ${scape.title}. ${scape.note}. Tap to silence.`
          : "Room sound is off. Tap to turn it on."
      }
    >
      <span className="nn-sound__wave" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) bars.current[i] = el;
            }}
            className="nn-sound__bar"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </span>
    </button>
  );
}
