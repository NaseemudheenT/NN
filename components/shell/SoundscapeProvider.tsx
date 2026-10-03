"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSoundscapeEngine } from "@/lib/soundscape-engine";
import { soundscapeForPhase, soundscapeById, type SoundscapeId } from "@/lib/soundscape";
import type { DayPhase } from "@/lib/daytime";

interface SoundValue {
  playing: boolean;
  supported: boolean;
  /** The soundscape currently selected, named. */
  name: string;
  toggle: () => void;
}

const Ctx = createContext<SoundValue | null>(null);

/**
 * The showroom's atmosphere.
 *
 * Five synthesised rooms, and which one is playing is decided by the hour —
 * the visitor never picks one, exactly as they never pick the lighting. All
 * they ever decide is whether there is sound at all, and they have to decide
 * that because no browser will start audio without a gesture.
 *
 * The choice is remembered. Someone who turned it on last time gets it back
 * on their next gesture rather than having to find the control again; someone
 * who turned it off is never asked twice.
 */
export function SoundscapeProvider({ phase, children }: { phase: DayPhase; children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const [id, setId] = useState<SoundscapeId>(() => soundscapeForPhase(phase).id);
  const wanted = useRef(false);

  useEffect(() => {
    try {
      wanted.current = window.localStorage.getItem("nn-sound") === "on";
    } catch {
      /* private mode: the default is off, which is the safer default anyway */
    }
  }, []);

  /* The hour turns over and the room's tone turns with it — cross-faded by
     the engine, not cut. */
  useEffect(() => {
    const next = soundscapeForPhase(phase).id;
    setId(next);
    if (playing) getSoundscapeEngine().select(next);
  }, [phase, playing]);

  const toggle = useCallback(() => {
    const engine = getSoundscapeEngine();
    if (playing) {
      void engine.suspend();
      setPlaying(false);
      wanted.current = false;
      try { window.localStorage.setItem("nn-sound", "off"); } catch {}
      return;
    }
    void (async () => {
      const ok = await engine.resume();
      if (!ok) {
        setSupported(false);
        return;
      }
      engine.select(id);
      setPlaying(true);
      wanted.current = true;
      try { window.localStorage.setItem("nn-sound", "on"); } catch {}
    })();
  }, [playing, id]);

  /* Nothing is torn down on unmount — the engine is a module singleton and
     outlives any one page, which is the point: walking from the collection
     to a product must not restart the room tone. */
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && playing) void getSoundscapeEngine().suspend();
      else if (!document.hidden && playing && wanted.current) void getSoundscapeEngine().resume();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [playing]);

  const value = useMemo<SoundValue>(
    () => ({ playing, supported, name: soundscapeById(id)?.title ?? "", toggle }),
    [playing, supported, id, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSoundscape(): SoundValue {
  const ctx = useContext(Ctx);
  const fallback = useMemo<SoundValue>(
    () => ({ playing: false, supported: false, name: "", toggle: () => {} }),
    [],
  );
  return ctx ?? fallback;
}
