"use client";

/**
 * NERO NOREN — theme and time of day.
 *
 * Three modes: "auto" (default), "day", "night". In auto the
 * theme follows the visitor's own clock via the NN phase table, and re-arms a
 * timer at each phase boundary so a browser left open at 19:29 goes dark by
 * itself. An explicit choice is remembered in localStorage and always wins.
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
  useCallback,
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
  type ThemeMode,
  type ThemeName,
} from "@/lib/daytime";

const STORAGE_KEY = "nn-theme-mode";
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
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** The theme actually applied right now. */
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
  const [mode, setModeState] = useState<ThemeMode>("auto");
  /* null until mounted, so the server and the first client render agree */
  const [now, setNow] = useState<Date | null>(null);
  const [override, setOverride] = useState<DayPhase | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* read the stored preference and the ?phase= test override */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "auto" || stored === "day" || stored === "night") {
        setModeState(stored);
      }
    } catch {
      /* private browsing can throw on access; auto is a fine default */
    }
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

  /* re-arm a timer at each phase boundary, and tick every 5 minutes so the
     sun keeps moving for the 3D scene without burning battery */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const d = new Date();
      const toBoundary = msUntilNextPhase(d);
      const wait = Math.min(toBoundary + 500, 5 * 60_000);
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

  const autoPhase = useMemo(() => phaseFromDate(effectiveDate), [effectiveDate]);

  /* an explicit light/dark choice pins the phase's lighting to that end of the
     day, so the room and the interface never disagree */
  const phase: DayPhase = useMemo(() => {
    if (mode === "auto") return autoPhase;
    if (mode === "night") return "night";
    return autoPhase === "night" ? "afternoon" : autoPhase;
  }, [mode, autoPhase]);

  const theme: ThemeName = useMemo(() => {
    if (mode === "day") return themeForPhase(phase) === "night" ? "day" : themeForPhase(phase);
    if (mode === "night") return "night";
    return themeForPhase(phase);
  }, [mode, phase]);

  const sky = useMemo(() => {
    const base = mode === "auto" ? effectiveDate : clockForPhase(phase, effectiveDate);
    // Longitude comes from the browser's UTC offset, which does not exist on
    // the server — so before mount the reference sky uses zero.
    return skyState(base, DEFAULT_LATITUDE, now ? longitudeFromTimezone() : 0);
  }, [mode, phase, effectiveDate, now]);

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

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setNow(new Date());
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still applies for this visit */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, theme, phase, sky, reducedMotion, overridden: override !== null }),
    [mode, setMode, theme, phase, sky, reducedMotion, override],
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
