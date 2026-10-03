"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { useDaylight, useDaylightOnDocument } from "@/lib/ui/useDaylight";
import { ShowroomFallback } from "@/components/showroom/ShowroomFallback";
import { Inspector } from "./Inspector";
import { SidePanel } from "./SidePanel";
import { Overture } from "./Overture";
import { useWalker } from "./useWalker";
import { INTRO_TOTAL, type Shot } from "./intro";
import { ZONES, type Zone } from "./plan";
import type { Product } from "@/lib/catalog/types";

const WorldCanvas = lazy(() => import("./WorldCanvas"));

/** logo → the mark reveals · ready → Start · arriving → the camera flies · live → yours */
export type Phase = "logo" | "ready" | "arriving" | "live";

const VISITED = "nn-visited";

/**
 * NERO NOREN.
 *
 * One building. One page. The first time you come, you come down the
 * street: the mark resolves out of black, you press Start, and the camera
 * swings round the facade, pushes to the doors, and carries you through
 * them into the hall. Then it is yours — walk anywhere, two floors, take
 * anything off a rail.
 *
 * ── the second visit ────────────────────────────────────────────────
 * The arrival is a nine-second film, and a nine-second film is magnificent
 * once and an obstacle every time after. So the device remembers: a
 * returning visitor gets Skip from the first frame, sitting quietly in the
 * corner, and taking it drops them straight into the hall. The film is
 * never taken away — it is just never compulsory twice.
 */
export function World({ products }: { products: Product[] }) {
  const sky = useDaylight();
  useDaylightOnDocument(sky);

  const [quality, setQuality] = useState<"none" | "low" | "high">("none");
  const [still, setStill] = useState(false);
  const [phase, setPhase] = useState<Phase>("logo");
  const [returning, setReturning] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);
  const [zone, setZone] = useState<string>("entrance");

  const walker = useWalker({ enabled: phase === "live", start: ZONES[0] });
  const host = useRef<HTMLDivElement>(null);

  /* Seconds into the arrival, or null once the customer has the camera.
     A ref, not state: the rig advances it sixty times a second and nothing
     about the page needs to re-render when it does. */
  const introTime = useRef<number | null>(null);
  const landed = useRef(false);
  const swung = useRef(false);

  /* A drag that moved the view is not a click on a garment. Without this,
     every look-around ends by picking up whatever was under the pointer. */
  const drag = useRef({ x: 0, y: 0, moved: 0, t: 0 });

  useEffect(() => {
    try {
      setReturning(window.localStorage.getItem(VISITED) === "yes");
    } catch {
      /* private mode: treat them as new, which is the generous way to be wrong */
    }
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(motion.matches);
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let ok = false;
    try {
      ok = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      ok = false;
    }
    if (!ok) return;

    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    /* Core count alone is a bad test — capable desktops report 2, and
       browsers under-report it for fingerprinting resistance. Memory and
       the pointer type are the honest signals. */
    const weak =
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
      nav.connection?.saveData === true ||
      (coarse && (cores <= 6 || window.innerWidth < 900));

    const target: "low" | "high" = weak ? "low" : "high";
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) {
      const id = idle(() => setQuality(target), { timeout: 1600 });
      return () => (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setQuality(target), 400);
    return () => window.clearTimeout(id);
  }, []);

  const handOver = useCallback(() => {
    if (landed.current) return;
    landed.current = true;
    introTime.current = null;
    setDoorsOpen(true);
    setPhase("live");
    setZone("entrance");
    try { window.localStorage.setItem(VISITED, "yes"); } catch {}
  }, []);

  /* The rig reports the shot it just rendered. Two things are read off it,
     and both are guarded so this never becomes a setState per frame. */
  const onShot = useCallback(
    (shot: Shot) => {
      /* Both of these are latched. onShot runs on every frame of the film,
         and a setState per frame — even one React bails out of — is sixty
         pointless reconciliations a second during the only nine seconds of
         this site that must not drop a frame. */
      if (shot.doorsOpen && !swung.current) {
        swung.current = true;
        setDoorsOpen(true);
      }
      if ((introTime.current ?? 0) >= INTRO_TOTAL) handOver();
    },
    [handOver],
  );

  /* Stable, so the Overture's timers are not cancelled and re-armed on
     every render of this component. */
  const ready = useCallback(() => setPhase("ready"), []);

  const begin = useCallback(() => {
    introTime.current = 0;
    landed.current = false;
    swung.current = false;
    setPhase("arriving");
  }, []);

  const skip = useCallback(() => handOver(), [handOver]);

  /* ── pointer: drag to look, tap to take ───────────────────────── */
  useEffect(() => {
    const el = host.current;
    if (!el || phase !== "live") return;

    const isTouch = (e: PointerEvent) => e.pointerType === "touch";
    const down = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
      walker.pointerHandlers.onPointerDown(e, isTouch(e));
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      drag.current.moved = Math.max(
        drag.current.moved,
        Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y),
      );
      walker.pointerHandlers.onPointerMove(e);
    };
    const up = (e: PointerEvent) => {
      walker.pointerHandlers.onPointerUp(e);
      el.releasePointerCapture?.(e.pointerId);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [phase, walker.pointerHandlers]);

  /** A tap is a tap; a drag is a look. 7 px and 400 ms is the line. */
  const wasATap = useCallback(
    () => drag.current.moved <= 7 && performance.now() - drag.current.t < 400,
    [],
  );

  const onPick = useCallback(
    (p: Product, _world: THREE.Vector3) => {
      if (!wasATap()) return;
      setPicked(p);
    },
    [wasATap],
  );

  const onFloor = useCallback(
    (point: THREE.Vector3) => {
      if (!wasATap() || phase !== "live") return;
      walker.walkTo(point.x, point.z);
    },
    [wasATap, phase, walker],
  );

  const teleport = useCallback(
    (z: Zone) => {
      setZone(z.id);
      if (phase !== "live") handOver();
      walker.teleport(z);
    },
    [phase, handOver, walker],
  );

  return (
    <div className="world" ref={host} data-phase={phase}>
      <ShowroomFallback />

      {quality !== "none" ? (
        <Suspense fallback={null}>
          <WorldCanvas
            sky={sky}
            products={products}
            walker={walker}
            quality={quality}
            still={still}
            doorsOpen={doorsOpen}
            introTime={introTime}
            onShot={onShot}
            onPick={onPick}
            onFloor={onFloor}
            picked={picked?.handle ?? null}
          />
        </Suspense>
      ) : null}

      <Overture
        phase={phase}
        returning={returning}
        onReady={ready}
        onBegin={begin}
        onSkip={skip}
      />

      {phase === "live" ? <SidePanel onTeleport={teleport} activeZone={zone} /> : null}

      <Inspector product={picked} onClose={() => setPicked(null)} />

      {phase === "live" ? <Hint /> : null}
    </div>
  );
}

/**
 * How to move.
 *
 * Shown once, briefly, and never again on this device. A permanent control
 * legend is an admission that the controls are not obvious; a legend that
 * never appears leaves people standing still at the door.
 */
function Hint() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem("nn-walked") === "yes";
    } catch {
      /* private mode: show it, which is the safer way to be wrong */
    }
    if (seen) return;
    setShown(true);
    const id = window.setTimeout(() => {
      setShown(false);
      try { window.localStorage.setItem("nn-walked", "yes"); } catch {}
    }, 8000);
    return () => window.clearTimeout(id);
  }, []);

  if (!shown) return null;
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <p className="hint label glass">
      {touch ? "Drag to look · tap the floor to walk" : "Drag to look · click the floor to walk · W A S D"}
    </p>
  );
}
