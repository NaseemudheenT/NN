/**
 * The weather outside the showroom.
 *
 * The chrono engine already knows what the sun is doing — where it is, what
 * colour it is, how strong its beam is. All of that assumes a clear sky,
 * which is a reasonable default and wrong most of the time. A real showroom
 * on a grey Tuesday is a different room from the same showroom in sunshine,
 * and the staff turn the lamps on at three in the afternoon because it is
 * dark outside, not because the clock says so.
 *
 * So this fetches the actual weather where the visitor is and hands the
 * lighting rig three things it cannot work out from astronomy: how much cloud
 * is between the sun and the window, whether it is raining, and how cold it
 * looks out there.
 *
 * ── no API key, and no permission prompt ─────────────────────────────
 * Open-Meteo is free and keyless, which matters because NN has no weather
 * credential and should not need one for a lighting effect.
 *
 * Location is harder. Asking the browser for geolocation raises a permission
 * dialog, and under the DPDP Act that is consent we have not got and do not
 * need — so instead the visitor's IANA time zone is mapped to the centre of
 * its region. "Asia/Kolkata" becomes Bengaluru, "Europe/London" becomes
 * London. The time zone is already in the page (the sun calculation uses it)
 * and it is not a location in the sense the Act means: it identifies a region
 * the size of a country, not a person.
 *
 * It is also entirely good enough. Weather is regional — if it is overcast in
 * Chennai it is almost certainly overcast forty kilometres away, and the
 * lighting rig is being asked for "how grey is it", not for a forecast.
 */

export interface WeatherState {
  /** 0 clear, 1 complete overcast. */
  cloud: number;
  /** Millimetres in the last hour. 0 is dry. */
  precipitation: number;
  /** WMO code. 0 clear, 45 fog, 51–67 rain, 71–77 snow, 95+ thunderstorm. */
  code: number;
  /** Degrees Celsius. Drives nothing optical; shown in the room's own reading. */
  temperature: number;
  /** Derived, because the codes are tedious and three questions cover it. */
  raining: boolean;
  snowing: boolean;
  foggy: boolean;
  /** Where this was measured, for the reading the room shows. */
  place: string;
  /** False when the fetch failed and these are clear-sky defaults. */
  live: boolean;
}

/** A clear day. What the room assumes when the fetch fails or has not landed. */
export const CLEAR: WeatherState = {
  cloud: 0,
  precipitation: 0,
  code: 0,
  temperature: 24,
  raining: false,
  snowing: false,
  foggy: false,
  place: "",
  live: false,
};

/* ── where the visitor is, roughly ───────────────────────────────────
   The centre of each time zone's region. Deliberately coarse: this is
   used to ask "is it cloudy over there", and a city is a far better
   answer than the UTC-offset meridian the sun calculation makes do
   with — that meridian runs through the sea for half the world. */
const ZONES: Record<string, { lat: number; lon: number; place: string }> = {
  "Asia/Kolkata": { lat: 12.97, lon: 77.59, place: "Bengaluru" },
  "Asia/Calcutta": { lat: 12.97, lon: 77.59, place: "Bengaluru" },
  "Asia/Dubai": { lat: 25.2, lon: 55.27, place: "Dubai" },
  "Asia/Singapore": { lat: 1.35, lon: 103.82, place: "Singapore" },
  "Asia/Tokyo": { lat: 35.68, lon: 139.69, place: "Tokyo" },
  "Asia/Shanghai": { lat: 31.23, lon: 121.47, place: "Shanghai" },
  "Europe/London": { lat: 51.51, lon: -0.13, place: "London" },
  "Europe/Paris": { lat: 48.86, lon: 2.35, place: "Paris" },
  "Europe/Berlin": { lat: 52.52, lon: 13.4, place: "Berlin" },
  "Europe/Rome": { lat: 41.9, lon: 12.5, place: "Rome" },
  "Europe/Madrid": { lat: 40.42, lon: -3.7, place: "Madrid" },
  "Europe/Moscow": { lat: 55.76, lon: 37.62, place: "Moscow" },
  "America/New_York": { lat: 40.71, lon: -74.01, place: "New York" },
  "America/Chicago": { lat: 41.88, lon: -87.63, place: "Chicago" },
  "America/Los_Angeles": { lat: 34.05, lon: -118.24, place: "Los Angeles" },
  "America/Sao_Paulo": { lat: -23.55, lon: -46.63, place: "São Paulo" },
  "Australia/Sydney": { lat: -33.87, lon: 151.21, place: "Sydney" },
  "Australia/Melbourne": { lat: -37.81, lon: 144.96, place: "Melbourne" },
  "Australia/Perth": { lat: -31.95, lon: 115.86, place: "Perth" },
  "Pacific/Auckland": { lat: -36.85, lon: 174.76, place: "Auckland" },
  "America/Buenos_Aires": { lat: -34.6, lon: -58.38, place: "Buenos Aires" },
  "America/Argentina/Buenos_Aires": { lat: -34.6, lon: -58.38, place: "Buenos Aires" },
  "America/Santiago": { lat: -33.45, lon: -70.67, place: "Santiago" },
  "Asia/Jakarta": { lat: -6.21, lon: 106.85, place: "Jakarta" },
  "Asia/Karachi": { lat: 24.86, lon: 67.0, place: "Karachi" },
  "Asia/Dhaka": { lat: 23.81, lon: 90.41, place: "Dhaka" },
  "Asia/Colombo": { lat: 6.93, lon: 79.86, place: "Colombo" },
  "Asia/Seoul": { lat: 37.57, lon: 126.98, place: "Seoul" },
  "Asia/Hong_Kong": { lat: 22.32, lon: 114.17, place: "Hong Kong" },
  "Europe/Amsterdam": { lat: 52.37, lon: 4.9, place: "Amsterdam" },
  "Europe/Milan": { lat: 45.46, lon: 9.19, place: "Milan" },
  "Europe/Lisbon": { lat: 38.72, lon: -9.14, place: "Lisbon" },
  "Europe/Istanbul": { lat: 41.01, lon: 28.98, place: "Istanbul" },
  "America/Toronto": { lat: 43.65, lon: -79.38, place: "Toronto" },
  "America/Mexico_City": { lat: 19.43, lon: -99.13, place: "Mexico City" },
  "Africa/Cairo": { lat: 30.04, lon: 31.24, place: "Cairo" },
  "Africa/Nairobi": { lat: -1.29, lon: 36.82, place: "Nairobi" },
  "Africa/Accra": { lat: 5.6, lon: -0.19, place: "Accra" },
  "Africa/Casablanca": { lat: 33.57, lon: -7.59, place: "Casablanca" },
  "America/Bogota": { lat: 4.71, lon: -74.07, place: "Bogotá" },
  "America/Lima": { lat: -12.05, lon: -77.04, place: "Lima" },
  "America/Denver": { lat: 39.74, lon: -104.99, place: "Denver" },
  "America/Phoenix": { lat: 33.45, lon: -112.07, place: "Phoenix" },
  "America/Vancouver": { lat: 49.28, lon: -123.12, place: "Vancouver" },
  "America/Halifax": { lat: 44.65, lon: -63.58, place: "Halifax" },
  "Asia/Bangkok": { lat: 13.76, lon: 100.5, place: "Bangkok" },
  "Asia/Manila": { lat: 14.6, lon: 120.98, place: "Manila" },
  "Asia/Kuala_Lumpur": { lat: 3.14, lon: 101.69, place: "Kuala Lumpur" },
  "Asia/Ho_Chi_Minh": { lat: 10.82, lon: 106.63, place: "Ho Chi Minh City" },
  "Asia/Riyadh": { lat: 24.71, lon: 46.68, place: "Riyadh" },
  "Asia/Qatar": { lat: 25.29, lon: 51.53, place: "Doha" },
  "Asia/Jerusalem": { lat: 31.78, lon: 35.22, place: "Jerusalem" },
  "Asia/Tehran": { lat: 35.69, lon: 51.39, place: "Tehran" },
  "Asia/Kathmandu": { lat: 27.72, lon: 85.32, place: "Kathmandu" },
  "Asia/Taipei": { lat: 25.03, lon: 121.57, place: "Taipei" },
  "Atlantic/Reykjavik": { lat: 64.15, lon: -21.94, place: "Reykjavík" },
  "Europe/Dublin": { lat: 53.35, lon: -6.26, place: "Dublin" },
  "Europe/Brussels": { lat: 50.85, lon: 4.35, place: "Brussels" },
  "Europe/Zurich": { lat: 47.38, lon: 8.54, place: "Zürich" },
  "Europe/Vienna": { lat: 48.21, lon: 16.37, place: "Vienna" },
  "Europe/Prague": { lat: 50.08, lon: 14.44, place: "Prague" },
  "Europe/Warsaw": { lat: 52.23, lon: 21.01, place: "Warsaw" },
  "Europe/Stockholm": { lat: 59.33, lon: 18.07, place: "Stockholm" },
  "Europe/Oslo": { lat: 59.91, lon: 10.75, place: "Oslo" },
  "Europe/Copenhagen": { lat: 55.68, lon: 12.57, place: "Copenhagen" },
  "Europe/Helsinki": { lat: 60.17, lon: 24.94, place: "Helsinki" },
  "Europe/Athens": { lat: 37.98, lon: 23.73, place: "Athens" },
  "Europe/Kyiv": { lat: 50.45, lon: 30.52, place: "Kyiv" },
  "Pacific/Honolulu": { lat: 21.31, lon: -157.86, place: "Honolulu" },
  "Africa/Lagos": { lat: 6.52, lon: 3.38, place: "Lagos" },
  "Africa/Johannesburg": { lat: -26.2, lon: 28.05, place: "Johannesburg" },
};

export interface Where {
  lat: number;
  lon: number;
  place: string;
  /**
   * True when the time zone was in the table and these are real coordinates.
   *
   * False means we guessed, and a guess is NOT good enough to ask a weather
   * service about. An unlisted zone falls back to a longitude from the UTC
   * offset and a latitude from the hemisphere, which put Reykjavik at 40°N —
   * roughly Madrid, 2,700 km and one climate away. Showing an Icelandic
   * visitor Spanish weather is worse than showing them nothing, so when this
   * is false the fetch is skipped and the room keeps its clear sky.
   */
  known: boolean;
}

/**
 * The visitor's region, from their time zone.
 *
 * Falls back to the UTC-offset meridian when the zone is not in the table,
 * which is the same approximation the sun calculation already makes — a
 * longitude without a latitude. Latitude then defaults to NN's own centre of
 * gravity rather than to the equator, because a wrong hemisphere would put
 * the season upside down.
 */
export function whereFromTimezone(tz?: string, offsetMinutes?: number): Where {
  const zone = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const listed = ZONES[zone];
  if (listed) return { ...listed, known: true };

  const offset = offsetMinutes ?? -new Date().getTimezoneOffset();
  const lon = Math.max(-180, Math.min(180, (offset / 60) * 15));
  // Name the zone's own last segment: "Asia/Kathmandu" → "Kathmandu".
  const place = zone?.split("/").pop()?.replace(/_/g, " ") ?? "";

  /* Latitude matters for exactly one thing — which hemisphere's seasons the
     room is in — and getting it wrong dresses a Sydney January as winter.
     Rather than assert a hemisphere we cannot know, this reads it off the
     clock: see hemisphere() below. Unlisted zones get a representative mid-
     latitude in whichever half they actually belong to. */
  return { lat: 40 * hemisphere(), lon, place, known: false };
}

/**
 * Which hemisphere, read off daylight saving.
 *
 * A neat consequence of how DST works: the northern hemisphere springs
 * forward for ITS summer, in July, and the southern does the same for its
 * own, in January. So comparing a zone's January and July UTC offsets names
 * the hemisphere without a lookup table and without asking anyone anything.
 *
 *   northern → July offset is the smaller one (clocks moved forward then)
 *   southern → January offset is the smaller one
 *   equal    → the zone keeps no DST at all
 *
 * The equal case is most of the tropics — India, most of Africa, much of
 * south-east Asia — where DST is pointless precisely because the day length
 * barely moves, which is the same reason the seasons the room would dress for
 * are nearly meaningless there. Defaulting those to northern is therefore the
 * least consequential guess available, and it is right for the majority of
 * them by land area anyway.
 *
 * Returns +1 for north, −1 for south.
 */
export function hemisphere(reference = new Date()): 1 | -1 {
  const year = reference.getFullYear();
  const jan = new Date(year, 0, 1).getTimezoneOffset();
  const jul = new Date(year, 6, 1).getTimezoneOffset();
  if (jan === jul) return 1;
  return jul < jan ? 1 : -1;
}

/* ── WMO weather codes, as three questions ───────────────────────── */

export const isRain = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
export const isSnow = (code: number) =>
  (code >= 71 && code <= 77) || code === 85 || code === 86;
export const isFog = (code: number) => code === 45 || code === 48;

/**
 * How much the sun is attenuated by what is in front of it.
 *
 * Not linear in cloud cover, and that matters. Thin high cloud barely touches
 * the beam; complete overcast kills it almost entirely and replaces it with
 * sky, which is why an overcast day has no shadows rather than faint ones.
 * The curve is steep at the top end for that reason.
 */
export function beamThroughCloud(cloud: number, code: number): number {
  const base = 1 - Math.pow(Math.min(1, Math.max(0, cloud)), 1.7) * 0.94;
  // Rain and fog are thicker than their cloud fraction suggests.
  if (isFog(code)) return base * 0.25;
  if (isRain(code)) return base * 0.55;
  if (isSnow(code)) return base * 0.6;
  return base;
}

/**
 * How much the SKY contributes, which goes the other way.
 *
 * Overcast does not darken a room as much as the lost beam suggests, because
 * the whole sky becomes one large soft source. Losing the sun and gaining
 * that is why grey days are flat rather than dim.
 */
export function skylightThroughCloud(cloud: number): number {
  return 1 + Math.min(1, Math.max(0, cloud)) * 0.55;
}

/* ── the season, which is a latitude question ────────────────────── */

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * Meteorological season for a date and hemisphere.
 *
 * Southern latitudes are six months out of phase, which is the whole reason
 * this takes a latitude at all — hard-coding northern seasons would have the
 * room dressed for winter in a Sydney January.
 */
export function seasonFor(date: Date, latitude: number): Season {
  const m = date.getMonth(); // 0–11
  const north: Season[] = [
    "winter", "winter", "spring", "spring", "spring", "summer",
    "summer", "summer", "autumn", "autumn", "autumn", "winter",
  ];
  const s = north[m];
  if (latitude >= 0) return s;
  const flip: Record<Season, Season> = {
    winter: "summer", summer: "winter", spring: "autumn", autumn: "spring",
  };
  return flip[s];
}

/* ── the fetch ───────────────────────────────────────────────────── */

export function weatherUrl({ lat, lon }: Where): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: "temperature_2m,precipitation,weather_code,cloud_cover",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  precipitation?: number;
  weather_code?: number;
  cloud_cover?: number;
}

/** Turn Open-Meteo's payload into the room's own state. Never throws. */
export function readWeather(
  json: { current?: OpenMeteoCurrent } | null,
  place: string,
): WeatherState {
  const c = json?.current;
  if (!c || typeof c.cloud_cover !== "number") return { ...CLEAR, place };

  const code = c.weather_code ?? 0;
  return {
    cloud: Math.min(1, Math.max(0, c.cloud_cover / 100)),
    precipitation: c.precipitation ?? 0,
    code,
    temperature: c.temperature_2m ?? CLEAR.temperature,
    raining: isRain(code),
    snowing: isSnow(code),
    foggy: isFog(code),
    place,
    live: true,
  };
}
