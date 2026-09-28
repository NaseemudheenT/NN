/**
 * NERO NOREN — time of day, computed not faked.
 *
 * The showroom is lit by the visitor's own sky. Sun direction comes from the
 * NOAA solar position algorithm (General Solar Position Calculations, NOAA
 * Global Monitoring Laboratory) evaluated for their local clock, calendar date
 * and latitude/longitude. Light colour comes from a Planckian-locus blackbody
 * approximation shifted by atmospheric extinction at low sun elevations — the
 * reason a low sun is red is that the long air path scatters the blue out.
 *
 * Nothing here touches the DOM or React, so it runs on the server too.
 */

export type DayPhase = "morning" | "afternoon" | "evening" | "night";
/* The names the token system uses: day, dusk, night. "night" is the
   brand's default state, because the board is overwhelmingly black. */
export type ThemeName = "day" | "dusk" | "night";
export type ThemeMode = "auto" | ThemeName;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ── the NN phase table ─────────────────────────────────────────────
   06:00–11:59 morning  — crisp European morning light through the windows
   12:00–16:59 afternoon — warm, balanced architectural daylight
   17:00–20:59 evening   — golden hour, long amber shadows on the marble
   21:00–05:59 night     — the lounge: obsidian shadow, gold on the garments

   The visitor never chooses between these. The room is simply lit by
   whatever hour it is where they are standing.                       */

export const PHASE_BOUNDARIES_MIN = [6 * 60, 12 * 60, 17 * 60, 21 * 60, 24 * 60] as const;

export function phaseFromClock(hours: number, minutes = 0): DayPhase {
  const m = hours * 60 + minutes;
  if (m >= 6 * 60 && m < 12 * 60) return "morning";
  if (m >= 12 * 60 && m < 17 * 60) return "afternoon";
  if (m >= 17 * 60 && m < 21 * 60) return "evening";
  return "night";
}

export function phaseFromDate(d: Date = new Date()): DayPhase {
  return phaseFromClock(d.getHours(), d.getMinutes());
}

export function themeForPhase(phase: DayPhase): ThemeName {
  // Morning and afternoon are the ivory light theme. Evening keeps light
  // tokens with a warmer accent. Night is matte black.
  if (phase === "night") return "night";
  if (phase === "evening") return "dusk";
  return "day";
}

/** Minutes until the next phase boundary — used to re-arm the phase timer. */
export function msUntilNextPhase(d: Date = new Date()): number {
  const boundaries = PHASE_BOUNDARIES_MIN;
  const now = d.getHours() * 60 + d.getMinutes();
  const next = boundaries.find((b: number) => b > now) ?? 24 * 60;
  const minutes = next - now;
  return minutes * 60_000 - d.getSeconds() * 1000 - d.getMilliseconds();
}

/* ── NOAA solar position ────────────────────────────────────────── */

export interface SolarPosition {
  /** Degrees above the horizon. Negative after sunset. */
  elevation: number;
  /** Degrees clockwise from true north. */
  azimuth: number;
  /** Solar declination in degrees. */
  declination: number;
  /** Equation of time in minutes. */
  equationOfTime: number;
  /** Fraction of the solar day elapsed, 0 at midnight. */
  dayFraction: number;
}

function julianDay(date: Date): number {
  // Convert local time to UTC-based Julian Day, including fractional day.
  const t = date.getTime();
  return t / 86_400_000 + 2_440_587.5;
}

/**
 * Solar elevation and azimuth for a moment and a place.
 * Follows NOAA's spreadsheet formulation; accurate to ~0.01° for our purposes.
 */
export function solarPosition(
  date: Date = new Date(),
  latitude = 12.9716, // default: Bengaluru — a fair centre of gravity for NN's customers
  longitude = 77.5946,
): SolarPosition {
  const jd = julianDay(date);
  const t = (jd - 2_451_545) / 36_525; // Julian centuries since J2000.0

  // Geometric mean longitude and anomaly of the sun
  const L0 = (280.46646 + t * (36_000.76983 + t * 0.0003032)) % 360;
  const M = 357.52911 + t * (35_999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  // Equation of the centre → true longitude → apparent longitude
  const C =
    Math.sin(M * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * M * RAD) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  // Obliquity of the ecliptic, corrected for nutation
  const meanObliq =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliqCorr = meanObliq + 0.00256 * Math.cos(omega * RAD);

  // Declination
  const declination =
    Math.asin(Math.sin(obliqCorr * RAD) * Math.sin(appLong * RAD)) * DEG;

  // Equation of time, in minutes
  const varY = Math.tan((obliqCorr / 2) * RAD) ** 2;
  const equationOfTime =
    4 *
    DEG *
    (varY * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * varY * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * varY * varY * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));

  // True solar time → hour angle
  const tzOffsetHours = -date.getTimezoneOffset() / 60;
  const localMinutes =
    date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  const trueSolarTime =
    (localMinutes + equationOfTime + 4 * longitude - 60 * tzOffsetHours + 1440) % 1440;
  const hourAngle = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180;

  // Zenith → elevation, with atmospheric refraction near the horizon
  const latR = latitude * RAD;
  const decR = declination * RAD;
  const haR = hourAngle * RAD;
  const cosZenith = clamp(
    Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR),
    -1,
    1,
  );
  const zenith = Math.acos(cosZenith) * DEG;
  const elevationRaw = 90 - zenith;
  const elevation = elevationRaw + atmosphericRefraction(elevationRaw);

  // Azimuth, degrees clockwise from north
  let azimuth: number;
  const denom = Math.cos(latR) * Math.sin(zenith * RAD);
  if (Math.abs(denom) > 1e-9) {
    const cosAz = clamp(
      (Math.sin(latR) * Math.cos(zenith * RAD) - Math.sin(decR)) / denom,
      -1,
      1,
    );
    const az = Math.acos(cosAz) * DEG;
    azimuth = hourAngle > 0 ? (az + 180) % 360 : (540 - az) % 360;
  } else {
    azimuth = latitude > 0 ? 180 : 0;
  }

  return {
    elevation,
    azimuth,
    declination,
    equationOfTime,
    dayFraction: localMinutes / 1440,
  };
}

/** Bennett's refraction formula — bends the apparent sun up near the horizon. */
function atmosphericRefraction(elevationDeg: number): number {
  if (elevationDeg > 85) return 0;
  if (elevationDeg < -1) return 0;
  const e = elevationDeg;
  if (e > 5) {
    return (
      (58.1 / Math.tan(e * RAD) -
        0.07 / Math.tan(e * RAD) ** 3 +
        0.000086 / Math.tan(e * RAD) ** 5) /
      3600
    );
  }
  if (e > -0.575) {
    return (
      (1735 + e * (-518.2 + e * (103.4 + e * (-12.79 + e * 0.711)))) / 3600
    );
  }
  return -20.774 / Math.tan(e * RAD) / 3600;
}

/* ── sun direction in three.js space ───────────────────────────────
   three.js is Y-up, right-handed. We put +Z toward the showroom's
   window wall (south) so azimuth maps intuitively.               */

export function sunDirection(
  elevationDeg: number,
  azimuthDeg: number,
  distance = 1,
): [number, number, number] {
  const el = elevationDeg * RAD;
  const az = azimuthDeg * RAD;
  const horizontal = Math.cos(el);
  return [
    distance * horizontal * Math.sin(az),
    distance * Math.sin(el),
    distance * horizontal * Math.cos(az),
  ];
}

/* ── light colour from physics ─────────────────────────────────────
   Correlated colour temperature of direct sunlight falls as the sun
   drops, because the optical air mass rises and Rayleigh scattering
   strips the short wavelengths. Kasten–Young gives the air mass. */

/** Kasten & Young (1989) relative optical air mass. */
export function airMass(elevationDeg: number): number {
  const e = Math.max(elevationDeg, -0.9);
  return 1 / (Math.sin(e * RAD) + 0.50572 * Math.pow(e + 6.07995, -1.6364));
}

/**
 * Sunlight correlated colour temperature in kelvin.
 * ~5800 K at the zenith falling to ~1900 K at the horizon, tracking
 * measured daylight series. Below the horizon we return moonlight/skylight.
 */
export function sunTemperature(elevationDeg: number): number {
  if (elevationDeg <= -6) return 4100; // deep twilight / moonlit sky, cool and dim
  if (elevationDeg <= 0) {
    // civil twilight: sky is blue-dominant as the direct beam dies
    const k = (elevationDeg + 6) / 6; // 0 at -6°, 1 at 0°
    return 4100 + k * (2000 - 4100);
  }
  const am = airMass(elevationDeg);
  // Empirical fit: each unit of air mass warms the beam sharply at first.
  const kelvin = 5800 - 3900 * (1 - Math.exp(-0.42 * (am - 1)));
  return clamp(kelvin, 1900, 6500);
}

/**
 * Planckian locus → linear sRGB, normalised so the brightest channel is 1.
 * Uses the CIE 1931 approximation of blackbody chromaticity (Kim et al.),
 * then the standard XYZ→linear-sRGB matrix.
 */
export function blackbodyToLinearRGB(kelvin: number): [number, number, number] {
  const T = clamp(kelvin, 1000, 15_000);
  const t = 1000 / T;

  // CIE 1931 x of the Planckian locus
  const x =
    T <= 4000
      ? -0.2661239 * t ** 3 - 0.2343589 * t ** 2 + 0.8776956 * t + 0.179910
      : -3.0258469 * t ** 3 + 2.1070379 * t ** 2 + 0.2226347 * t + 0.240390;

  let y: number;
  if (T <= 2222) {
    y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683;
  } else if (T <= 4000) {
    y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867;
  } else {
    y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
  }

  // xyY (Y = 1) → XYZ
  const Y = 1;
  const X = (x * Y) / y;
  const Z = ((1 - x - y) * Y) / y;

  // XYZ → linear sRGB (sRGB D65 primaries)
  let r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  let g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  let b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);
  const peak = Math.max(r, g, b, 1e-6);
  return [r / peak, g / peak, b / peak];
}

/** Hex string for a blackbody temperature, gamma-encoded for CSS. */
export function temperatureToHex(kelvin: number): string {
  const [r, g, b] = blackbodyToLinearRGB(kelvin);
  const enc = (c: number) => {
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(clamp(s, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${enc(r)}${enc(g)}${enc(b)}`;
}

/**
 * Direct-beam irradiance as a 0–1 factor, from the Meinel clear-sky model
 * I = I0 · 0.7^(AM^0.678). Drives the sun light's intensity so midday is
 * genuinely brighter than late afternoon.
 */
export function beamStrength(elevationDeg: number): number {
  if (elevationDeg <= 0) return 0;
  const am = airMass(elevationDeg);
  return clamp(Math.pow(0.7, Math.pow(am, 0.678)), 0, 1);
}

/* ── the full lighting brief for a moment ──────────────────────── */

export interface SkyState {
  phase: DayPhase;
  theme: ThemeName;
  solar: SolarPosition;
  /** Unit vector toward the sun, three.js coordinates. */
  direction: [number, number, number];
  /** Correlated colour temperature of the beam, kelvin. */
  kelvin: number;
  /** Linear sRGB of the beam. */
  rgb: [number, number, number];
  /** 0–1 clear-sky direct beam strength. */
  beam: number;
  /** 0–1 how far the lamps have come up. Inverse of daylight. */
  lampLevel: number;
  /** Photographic exposure for the tone mapper. */
  exposure: number;
}

export function skyState(
  date: Date = new Date(),
  latitude?: number,
  longitude?: number,
): SkyState {
  const solar = solarPosition(date, latitude, longitude);
  const phase = phaseFromDate(date);
  const kelvin = sunTemperature(solar.elevation);
  const beam = beamStrength(solar.elevation);

  // Lamps come up as the beam dies — a real showroom's staff do this by eye,
  // so we cross-fade rather than switch.
  const lampLevel = clamp(1 - beam * 1.35, 0, 1);

  // Exposure opens up as the room darkens, the way an eye adapts.
  const exposure = 0.85 + 0.55 * lampLevel;

  return {
    phase,
    theme: themeForPhase(phase),
    solar,
    direction: sunDirection(solar.elevation, solar.azimuth),
    kelvin,
    rgb: blackbodyToLinearRGB(kelvin),
    beam,
    lampLevel,
    exposure,
  };
}

/** Test override: ?phase=night forces a phase without moving the clock. */
export function phaseOverrideFromSearch(search: string): DayPhase | null {
  try {
    const value = new URLSearchParams(search).get("phase");
    if (value === "morning" || value === "afternoon" || value === "evening" || value === "night") {
      return value;
    }
  } catch {
    /* malformed query strings are simply ignored */
  }
  return null;
}

/** A representative clock time for a forced phase, so lighting still derives. */
export function clockForPhase(phase: DayPhase, base: Date = new Date()): Date {
  const d = new Date(base);
  const hour = { morning: 9, afternoon: 14, evening: 19, night: 23 }[phase];
  d.setHours(hour, 15, 0, 0);
  return d;
}
