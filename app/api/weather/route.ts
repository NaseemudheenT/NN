/**
 * The weather, fetched once and shared.
 *
 * A server route rather than a browser fetch, for three reasons that are all
 * about not being a bad citizen of a free API. It caches, so a thousand
 * visitors in Bengaluru cost one request every fifteen minutes rather than a
 * thousand. It rounds the coordinates, so the cache actually hits instead of
 * fragmenting across every decimal place. And it never fails loudly — a
 * lighting effect must not be able to break a shop, so every error path
 * returns clear-sky defaults with `live: false` and the room carries on
 * assuming sunshine.
 *
 * No credential is involved. Open-Meteo is keyless, which is why it was
 * chosen: NN has no weather account and should not need one to decide how
 * grey its windows look.
 */

import { NextResponse } from "next/server";
import { CLEAR, readWeather, weatherUrl, type Where } from "@/lib/weather";

/** Fifteen minutes. Weather does not change faster than a room's lighting can. */
export const revalidate = 900;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  /* Round to a tenth of a degree — about 11 km. Finer than the weather
     varies, and coarse enough that everyone in a city shares one cache
     entry instead of each holding their own. */
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const place = (params.get("place") ?? "").slice(0, 48);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ ...CLEAR, place }, { status: 200 });
  }

  const where: Where = {
    lat: Math.round(lat * 10) / 10,
    lon: Math.round(lon * 10) / 10,
    place,
    /* The caller only reaches this route with coordinates it trusts — the
       hook refuses to ask for an unlisted zone — so by the time a request
       lands here the location is as known as it is going to get. */
    known: true,
  };

  try {
    /* A short timeout. If the weather is slow the room should open anyway —
       nobody waits for a cloud reading to see a shop. */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(weatherUrl(where), {
      signal: controller.signal,
      next: { revalidate },
    });
    clearTimeout(timer);

    if (!response.ok) return NextResponse.json({ ...CLEAR, place }, { status: 200 });

    const json = await response.json();
    return NextResponse.json(readWeather(json, place), {
      status: 200,
      headers: {
        // Let the CDN hold it too, and keep serving a stale reading while it
        // refreshes rather than making anyone wait.
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch {
    // Abort, network failure, malformed JSON — all the same answer. The room
    // assumes a clear sky, which is the state it was built for.
    return NextResponse.json({ ...CLEAR, place }, { status: 200 });
  }
}
