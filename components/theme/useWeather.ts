"use client";

/**
 * The weather, in the room.
 *
 * Fetched once per visit, from the region the visitor's time zone names. It
 * updates every fifteen minutes for anyone who leaves the tab open, which is
 * the same cadence the server caches at — polling faster would only return
 * the same reading.
 *
 * Returns clear-sky defaults until the fetch lands, so the room opens
 * immediately and the sky corrects itself a moment later. That ordering is
 * deliberate: a showroom that waits for a weather API before it will show you
 * anything has its priorities exactly backwards.
 */

import { useEffect, useState } from "react";
import { CLEAR, whereFromTimezone, type WeatherState } from "@/lib/weather";

/** Fifteen minutes, matching the server's cache. */
const REFRESH_MS = 15 * 60 * 1000;

export function useWeather(): WeatherState {
  const [weather, setWeather] = useState<WeatherState>(CLEAR);

  useEffect(() => {
    let alive = true;

    const read = async () => {
      try {
        const where = whereFromTimezone();
        const url = `/api/weather?lat=${where.lat}&lon=${where.lon}&place=${encodeURIComponent(where.place)}`;
        const response = await fetch(url);
        if (!response.ok) return;
        const json = (await response.json()) as WeatherState;
        if (alive) setWeather(json);
      } catch {
        /* Keep the clear sky. The room is fully usable without this and the
           failure is not worth a console line on a customer's machine. */
      }
    };

    read();
    const timer = setInterval(read, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return weather;
}
