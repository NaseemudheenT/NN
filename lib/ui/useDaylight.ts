"use client";

/**
 * The chrono-atmospheric engine, from the customer's side.
 *
 * There is no control for this anywhere on the site and there never will be.
 * The room simply has the light it would have — the visitor's own clock,
 * their own latitude, their own weather — and nothing announces it. A shop
 * does not put a sign in the window saying which lamps are on.
 *
 * Astronomy first, weather second. solarPosition is deterministic and costs
 * nothing, so the room is lit correctly on the very first frame; the weather
 * is a network call that may never land, and when it does it only attenuates
 * what is already there. Nothing waits on it.
 *
 * Re-solved every 60 s, so a visitor who leaves the tab open through sunset
 * watches the room change rather than finding it changed.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyWeather,
  clockForPhase,
  msUntilNextPhase,
  phaseFromDate,
  phaseOverrideFromSearch,
  skyState,
  type SkyState,
} from "@/lib/daytime";
import { CLEAR, readWeather, whereFromTimezone, type WeatherState } from "@/lib/weather";

export function useDaylight(): SkyState {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherState>(CLEAR);
  const [where] = useState(() => {
    if (typeof Intl === "undefined") return null;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return whereFromTimezone(tz, new Date().getTimezoneOffset() * -1);
    } catch {
      return null;
    }
  });

  /* ?phase=night pins a phase for screenshots and for the owner's preview.
     It moves the clock rather than overriding the output, so everything
     downstream — sun angle, colour temperature, lamp level — stays
     self-consistent instead of being a lie layered on top. */
  const pinned = useRef<Date | null>(null);
  if (pinned.current === null && typeof window !== "undefined") {
    const phase = phaseOverrideFromSearch(window.location.search);
    pinned.current = phase ? clockForPhase(phase) : null;
  }

  useEffect(() => {
    if (pinned.current) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  /* The weather, if we can place the visitor at all. whereFromTimezone
     refuses to guess for an unlisted timezone — reporting another
     continent's cloud cover is worse than reporting none. */
  useEffect(() => {
    if (!where?.known) return;
    const ac = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/weather?${new URLSearchParams({ lat: String(where.lat), lon: String(where.lon) })}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        setWeather(readWeather(await res.json(), where.place));
      } catch {
        /* no weather is a fine outcome: the clear-sky model already holds */
      }
    };
    void load();
    const id = window.setInterval(load, 15 * 60_000);
    return () => {
      ac.abort();
      window.clearInterval(id);
    };
  }, [where]);

  return useMemo(() => {
    const at = pinned.current ?? now;
    const clear = skyState(at, where?.lat, where?.lon);
    return applyWeather(clear, weather);
  }, [now, weather, where]);
}

/** Writes the sky onto the document so CSS can read it too. */
export function useDaylightOnDocument(sky: SkyState) {
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.phase = sky.phase;
    el.style.setProperty("--sun-beam", sky.beam.toFixed(3));
    el.style.setProperty("--lamp", sky.lampLevel.toFixed(3));
    const [r, g, b] = sky.rgb;
    /* Raw channels, not an rgb() string: CSS needs them bare to write
       rgb(var(--sun-rgb) / 0.4), which is how every surface in the painted
       hall tints itself without a second variable per opacity. */
    const channels = `${Math.round(Math.min(1, r) * 255)} ${Math.round(Math.min(1, g) * 255)} ${Math.round(Math.min(1, b) * 255)}`;
    el.style.setProperty("--sun-rgb", channels);
    el.style.setProperty("--sun-tint", `rgb(${channels})`);
  }, [sky]);
}

/**
 * Just the phase, for things that only need to know which hour it is —
 * the soundscape, a label. Far cheaper than solving the sun's position, and
 * it re-ticks exactly on the boundary rather than polling for it.
 */
export function usePhase(): import("@/lib/daytime").DayPhase {
  const [phase, setPhase] = useState<import("@/lib/daytime").DayPhase>(() => phaseFromDate());
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setPhase(phaseFromDate());
      id = window.setTimeout(tick, Math.max(1000, msUntilNextPhase()));
    };
    id = window.setTimeout(tick, Math.max(1000, msUntilNextPhase()));
    return () => window.clearTimeout(id);
  }, []);
  return phase;
}
