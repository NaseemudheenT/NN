"use client";

/**
 * NERO NOREN — the chrono-atmospheric engine.
 *
 * There is no theme control anywhere in the interface, and there never should
 * be. A showroom does not offer its customers a light switch: the room is lit
 * by whatever hour it is outside, and the only honest digital equivalent is to
 * read the visitor's own clock and light the room to match.
 *
 * The engine re-arms a timer at each phase boundary, so a browser left open at
 * 20:59 dims into the night lounge by itself, and ticks every minute in
 * between so the sun keeps moving. Every change is a slow cross-fade measured
 * in minutes — see --chrono-fade in tokens.css — so nothing ever flashes.
 *
 * The provider also publishes the full sky state — sun direction, colour
 * temperature, beam strength, lamp level — because the 3D showroom lights
 * itself from these numbers rather than from hand-picked presets.
 *
 * Longitude is inferred from the browser's UTC offset (offset hours × 15°),
 * which needs no permission and no geolocation prompt. Latitude defaults to
 * 20°N, the middle of India, since we cannot know it without asking.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clockForPhase,
  msUntilNextPhase,
  phaseFromDate,
  phaseOverrideFromSearch,
  skyState,
  themeForPhase,
  type DayPhase,
  type SkyState,
  type ThemeName,
} from "@/lib/daytime";

const DEFAULT_LATITUDE = 20;

/**
 * The clock the server renders by.
 *
 * Everything downstream — the atmosphere's inline styles, the settings
 * footnote, the theme switch's announcement — is derived from the sky, and the
 * sky is derived from a clock. The server's clock is never the visitor's, so
 * rendering the real one during SSR guarantees a hydration mismatch on every
 * page that touches it. React reports that as error #418 and throws away the
 * server HTML.
 *
 * So the first render on both sides uses this fixed reference instead, and the
 * real clock takes over on mount. The reference is an evening hour because
 * night is the brand's resting state and the document already ships with
 * data-theme="night" — which means the common case has nothing to correct.
 */
const SSR_REFERENCE = new Date("2026-01-01T21:00:00Z");

interface ThemeContextValue {
  /** The theme actually applied right now. Derived, never chosen. */
  theme: ThemeName;
  /** The phase of the visitor's day, or the forced phase in test mode. */
  phase: DayPhase;
  /** Physically derived lighting for the 3D showroom. */
  sky: SkyState;
  reducedMotion: boolean;
  /** True while a ?phase= override is in force. */
  overridden: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Longitude from the UTC offset — no permission needed, close enough for the sun. */
function longitudeFromTimezone(): number {
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  return Math.max(-180, Math.min(180, offsetHours * 15));
}

export function ThemeProvider({
  children,
  /**
   * A phase the owner has pinned for everyone from the console, for a campaign.
   * Null — the normal state — means every visitor sees their own hour. A
   * visitor's explicit light/dark choice still wins over it, because the theme
   * switch must never look broken.
   */
  housePhase = null,
}: {
  children: React.ReactNode;
  housePhase?: DayPhase | null;
}) {
  /* null until mounted, so the server and the first client render agree */
  const [now, setNow] = useState<Date | null>(null);
  const [override, setOverride] = useState<DayPhase | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* the ?phase= test override, for QA only — never surfaced in the interface */
  useEffect(() => {
    setOverride(phaseOverrideFromSearch(window.location.search));
    // the real clock takes over here, after hydration has matched
    setNow(new Date());
    setHydrated(true);
  }, []);

  /* prefers-reduced-motion, watched live */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* Re-arm at each phase boundary, and tick every minute in between so the
     sun crawls across the room instead of stepping. A minute of wall clock is
     a quarter of a degree of sun: far below the threshold of noticing, which
     is exactly the point. */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const d = new Date();
      const toBoundary = msUntilNextPhase(d);
      const wait = Math.min(toBoundary + 500, 60_000);
      timer.current = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, Math.max(wait, 1000));
    };
    schedule();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hydrated]);

  /* The clock we light the room by. A ?phase= test override wins over the
     owner's pinned phase, which in turn wins over the visitor's real clock. */
  const forced = override ?? housePhase;
  const effectiveDate = useMemo(() => {
    const base = now ?? SSR_REFERENCE;
    return forced ? clockForPhase(forced, base) : base;
  }, [forced, now]);

  const phase: DayPhase = useMemo(() => phaseFromDate(effectiveDate), [effectiveDate]);

  const theme: ThemeName = useMemo(() => themeForPhase(phase), [phase]);

  const sky = useMemo(
    // Longitude comes from the browser's UTC offset, which does not exist on
    // the server — so before mount the reference sky uses zero.
    () => skyState(effectiveDate, DEFAULT_LATITUDE, now ? longitudeFromTimezone() : 0),
    [effectiveDate, now],
  );

  /* paint the theme onto <html> */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.phase = phase;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      // matches --surface-base for each theme
      meta.setAttribute(
        "content",
        theme === "night" ? "#0a0a0a" : theme === "dusk" ? "#12151c" : "#f7f5ef",
      );
    }
  }, [theme, phase]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, phase, sky, reducedMotion, overridden: override !== null }),
    [theme, phase, sky, reducedMotion, override],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export const useTheme = useThemeContext;

/**
 * The hook the 3D showroom is built on: which part of the day it is, and the
 * physically derived light that goes with it.
 */
export function useDayPhase(): {
  phase: DayPhase;
  theme: ThemeName;
  sky: SkyState;
  reducedMotion: boolean;
} {
  const { phase, theme, sky, reducedMotion } = useThemeContext();
  return { phase, theme, sky, reducedMotion };
}
