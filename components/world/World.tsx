"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { useDaylight, useDaylightOnDocument } from "@/lib/ui/useDaylight";
import { ShowroomFallback } from "@/components/showroom/ShowroomFallback";
import { Monogram, Wordmark } from "@/components/brand/Monogram";
import { Inspector } from "./Inspector";
import { SidePanel } from "./SidePanel";
import { useWalker } from "./useWalker";
import { ZONES, type Zone } from "./plan";
import type { Product } from "@/lib/catalog/types";

const WorldCanvas = lazy(() => import("./WorldCanvas"));

/**
 * NERO NOREN.
 *
 * One building. One page. The customer arrives in the vestibule facing the
 * doors; the doors open; they walk in and they can go anywhere — down the
 * nave, into either aisle, up the stair to the gallery. Every piece on
 * every rail is a real catalogue product: take one off the rail, turn it
 * over, and carry it with you.
 *
 * ── what is NOT here ────────────────────────────────────────────────
 * Copy. A real showroom has a sign over the door and a price on a tag, and
 * that is all the text in it. Everything this website needs to say, it
 * says by being the thing it is describing.
 */
export function World({ products }: { products: Product[] }) {
  const sky = useDaylight();
  useDaylightOnDocument(sky);

  const [quality, setQuality] = useState<"none" | "low" | "high">("none");
  const [still, setStill] = useState(false);
  const [entered, setEntered] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);
  const [zone, setZone] = useState<string>("entrance");

  const walker = useWalker({ enabled: entered, start: ZONES[0] });
  const host = useRef<HTMLDivElement>(null);

  /* A drag that moved the view is not a click on a garment. Without this,
     every look-around ends by picking up whatever happened to be under the
     pointer when the hand stopped. */
  const drag = useRef({ x: 0, y: 0, moved: 0 });

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

  /* ── pointer: drag to look, tap to take ───────────────────────── */
  useEffect(() => {
    const el = host.current;
    if (!el || !entered) return;

    const isTouch = (e: PointerEvent) => e.pointerType === "touch";
    const down = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
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
  }, [entered, walker.pointerHandlers]);

  const onPick = useCallback((p: Product, _world: THREE.Vector3) => {
    if (drag.current.moved > 7) return; // that was a look, not a touch
    setPicked(p);
  }, []);

  const teleport = useCallback(
    (z: Zone) => {
      setZone(z.id);
      if (!entered) setEntered(true);
      walker.teleport(z);
    },
    [entered, walker],
  );

  const enter = useCallback(() => {
    setEntered(true);
    /* Through the doors and into the nave — the arrival is the point. */
    window.setTimeout(() => {
      setZone("men");
      walker.teleport(ZONES[1]);
    }, 900);
  }, [walker]);

  return (
    <div className="world" ref={host}>
      <ShowroomFallback />

      {quality !== "none" ? (
        <Suspense fallback={null}>
          <WorldCanvas
            sky={sky}
            products={products}
            walker={walker}
            quality={quality}
            still={still}
            doorsOpen={entered}
            onPick={onPick}
            picked={picked?.handle ?? null}
          />
        </Suspense>
      ) : null}

      {/* ── the threshold ──────────────────────────────────────
          The mark, the house name, one line, one door. The single most
          important second of a shop is the one where the door gives. */}
      {!entered ? (
        <div className="thresh">
          <div className="thresh__in">
            <Monogram size={64} className="thresh__mark" title="Nero Noren" />
            <Wordmark size="1.1rem" className="thresh__word" />
            <p className="label label--wide thresh__line">Timeless style builds character</p>
            <button type="button" className="btn btn--glass btn--lg thresh__go" onClick={enter}>
              Enter
            </button>
          </div>
        </div>
      ) : null}

      {entered ? <SidePanel onTeleport={teleport} activeZone={zone} /> : null}

      <Inspector product={picked} onClose={() => setPicked(null)} />

      {/* how to move, said once, then gone */}
      {entered ? <Hint /> : null}
    </div>
  );
}

/**
 * How to move.
 *
 * Shown once, briefly, and never again on this device. A permanent control
 * legend is an admission that the controls are not obvious; a legend that
 * never appears at all leaves people standing still at the door.
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
    }, 7000);
    return () => window.clearTimeout(id);
  }, []);

  if (!shown) return null;
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <p className="hint label glass">
      {touch ? "Drag left to walk · drag right to look" : "W A S D to walk · drag to look"}
    </p>
  );
}
