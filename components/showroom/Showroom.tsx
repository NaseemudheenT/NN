"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { useDaylight, useDaylightOnDocument } from "@/lib/ui/useDaylight";
import { ShowroomFallback } from "./ShowroomFallback";

const Canvas3D = lazy(() => import("./ShowroomCanvas"));

/**
 * The showroom, as the page mounts it.
 *
 * The CSS room renders first and renders always. The real one is loaded
 * after, and only onto a device that can carry it. That ordering is the
 * whole reliability story: there is no frame in which the hero is empty, no
 * spinner standing in for the building, and nothing to go wrong on a phone
 * that has no business running a thousand-shadow scene — it simply keeps the
 * painted hall, which is complete on its own.
 */
export function Showroom({ colours, fixed = false }: { colours: string[]; fixed?: boolean }) {
  const sky = useDaylight();
  useDaylightOnDocument(sky);

  const [quality, setQuality] = useState<"none" | "low" | "high">("none");
  const [still, setStill] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(motion.matches);
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    /* Capability, measured rather than guessed from the user agent. If there
       is no WebGL2 context to be had, there is no argument to have. */
    let ok = false;
    try {
      const probe = document.createElement("canvas");
      ok = !!probe.getContext("webgl2");
    } catch {
      ok = false;
    }
    if (!ok) return;

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const mem = nav.deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    /* Core count alone is a bad test: plenty of perfectly capable desktops
       report 2 or 4, and browsers deliberately under-report it for
       fingerprinting resistance. Memory and the pointer type are the honest
       signals — a coarse pointer on a narrow screen is a phone, and 4 GB or
       less will not hold a shadow map and a scene graph at once. Save-Data
       is the visitor telling us outright. */
    const weak =
      (mem !== undefined && mem <= 4) ||
      nav.connection?.saveData === true ||
      (coarse && (cores <= 6 || window.innerWidth < 900));

    const target: "low" | "high" = weak ? "low" : "high";

    /* Mount on idle so the hall never competes with first paint. */
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const start = () => setQuality(target);
    if (idle) {
      const id = idle(start, { timeout: 1800 });
      return () => (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 400);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="nn-stage"
      data-fixed={fixed || undefined}
      aria-hidden="true"
    >
      <ShowroomFallback />
      {quality !== "none" ? (
        <Suspense fallback={null}>
          <Canvas3D sky={sky} colours={colours} still={still} quality={quality} />
        </Suspense>
      ) : null}
    </div>
  );
}
