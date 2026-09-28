"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { phaseForHour, type DayPhase } from "@/lib/tokens";
import {
  deviceStore,
  localPref,
  matchesMediaQuery,
  sessionFlag,
  subscribeClock,
  subscribeMediaQuery,
} from "@/lib/client-prefs";

export type Quality = "high" | "medium" | "low" | "off";

interface ShowroomState {
  /** The hour of the showroom, from the visitor's own clock */
  phase: DayPhase;
  /** Null when following the clock */
  override: DayPhase | null;
  setOverride: (p: DayPhase | null) => void;
  /** Rendering budget, lowered automatically on weak devices */
  quality: Quality;
  setQuality: (q: Quality) => void;
  /** Whether the room may be rendered at all */
  spatial: boolean;
  setSpatial: (v: boolean) => void;
  reducedMotion: boolean;
  /** The garment under the light — the atmosphere leans toward it */
  focus: { swatch: string; title: string } | null;
  setFocus: (f: { swatch: string; title: string } | null) => void;
  /** True once the entrance sequence has played this session */
  entered: boolean;
  markEntered: () => void;
}

const Ctx = createContext<ShowroomState | null>(null);

export function useShowroom() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShowroom must be used inside ShowroomProvider");
  return ctx;
}

const PHASE_NAMES: DayPhase[] = ["morning", "afternoon", "evening", "night"];

function isPhase(v: string | null): v is DayPhase {
  return v !== null && (PHASE_NAMES as string[]).includes(v);
}

/** A ?phase= in the address bar wins, so any hour can be previewed. */
function phaseFromUrl(): DayPhase | null {
  try {
    const q = new URL(window.location.href).searchParams.get("phase");
    return isPhase(q) ? q : null;
  } catch {
    return null;
  }
}

const phaseOverride = localPref<DayPhase | null>(
  "nn.phase",
  (raw) => phaseFromUrl() ?? (isPhase(raw) ? raw : null),
  (v) => v,
  null,
);

const spatialPref = localPref<boolean>(
  "nn.spatial",
  (raw) => raw !== "0",
  (v) => (v ? "1" : "0"),
  true,
);

const enteredFlag = sessionFlag("nn.entered", true);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * What this device can reasonably draw. Decided once from the GPU, the
 * memory and the pointer, then lowered at runtime if frames start to drop.
 */
function detectQuality(): Quality {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return "off";

    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    const coarse = matchesMediaQuery("(pointer: coarse)");
    const narrow = window.innerWidth < 768;

    if (mem <= 2 || cores <= 2) return "low";
    if (coarse || narrow) return mem >= 6 && cores >= 6 ? "medium" : "low";
    if (mem >= 8 && cores >= 8) return "high";
    return "medium";
  } catch {
    return "off";
  }
}

const qualityStore = deviceStore<Quality>(detectQuality, "medium");

export function ShowroomProvider({ children }: { children: React.ReactNode }) {
  const clockPhase = useSyncExternalStore(
    subscribeClock,
    () => phaseForHour(new Date().getHours()),
    () => "night" as DayPhase,
  );

  const override = useSyncExternalStore(
    phaseOverride.subscribe,
    phaseOverride.get,
    phaseOverride.server,
  );

  const quality = useSyncExternalStore(qualityStore.subscribe, qualityStore.get, qualityStore.server);

  const spatialChoice = useSyncExternalStore(
    spatialPref.subscribe,
    spatialPref.get,
    spatialPref.server,
  );

  const entered = useSyncExternalStore(enteredFlag.subscribe, enteredFlag.get, enteredFlag.server);

  const reducedMotion = useSyncExternalStore(
    subscribeMediaQuery(REDUCED_MOTION),
    () => matchesMediaQuery(REDUCED_MOTION),
    () => false,
  );

  const [focus, setFocus] = useState<{ swatch: string; title: string } | null>(null);

  const phase = override ?? clockPhase;

  /* Paint the phase on <html> so the CSS tokens and the WebGL lights agree. */
  useEffect(() => {
    document.documentElement.dataset.phase = phase;
  }, [phase]);

  const setOverride = useCallback((p: DayPhase | null) => phaseOverride.set(p), []);
  const setSpatial = useCallback((v: boolean) => spatialPref.set(v), []);
  const setQuality = useCallback((q: Quality) => qualityStore.set(q), []);
  const markEntered = useCallback(() => enteredFlag.set(true), []);

  const value = useMemo<ShowroomState>(
    () => ({
      phase,
      override,
      setOverride,
      quality,
      setQuality,
      spatial: spatialChoice && quality !== "off",
      setSpatial,
      reducedMotion,
      focus,
      setFocus,
      entered,
      markEntered,
    }),
    [
      phase,
      override,
      setOverride,
      quality,
      setQuality,
      spatialChoice,
      setSpatial,
      reducedMotion,
      focus,
      entered,
      markEntered,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
