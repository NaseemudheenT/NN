"use client";

/**
 * The showroom, behind every page.
 *
 * The brief's central claim is that NN is one continuous building rather than
 * a set of pages, and until now that was only true on the homepage. Every
 * other route sat on a flat surface with a CSS atmosphere over it, which is a
 * good imitation of a room and is not the room.
 *
 * This mounts the actual showroom in the layout, where it survives navigation,
 * and walks the camera to a different part of the floor for each route — the
 * rails for the collection, the table for a product, the fitting-room door for
 * the trial room, the entrance for the bag. See ../showroom/routeStations.
 *
 * ── it is a backdrop, and it is budgeted like one ────────────────────
 * This is not the hero. Nobody came to /checkout to look at masonry, and a
 * backdrop that costs what a hero costs is a backdrop that makes the checkout
 * slow — which is the one page where that is unforgivable. So:
 *
 *   · it renders at the LOW tier regardless of what the device could manage,
 *   · it never draws hotspots, since nothing here is clickable,
 *   · it is dimmed and blurred behind a scrim, because the content in front
 *     of it has to be the thing you read,
 *   · it is not mounted at all on the two routes that already carry a
 *     showroom of their own, and
 *   · it stops rendering entirely when the tab is hidden.
 *
 * ── and it is optional, in three different ways ──────────────────────
 * It respects the visitor's existing 3D preference, the WebGL probe, and
 * reduced motion. Any of the three turning it off leaves LiveAtmosphere doing
 * what it already did, which is a complete and good-looking room on its own.
 * Nothing on any page depends on this being here.
 */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useDayPhase } from "@/components/theme/ThemeProvider";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";
import { stationFor } from "@/components/showroom/routeStations";

/* three.js arrives only once we know we are going to draw something. */
const BackdropCanvas = dynamic(() => import("./ShowroomBackdropCanvas"), {
  ssr: false,
  loading: () => null,
});

const PREF_3D = "nn-showroom-3d";

export function ShowroomBackdrop() {
  const pathname = usePathname();
  const { sky } = useDayPhase();
  const reducedMotion = usePrefersReducedMotion();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);

  const station = useMemo(() => stationFor(pathname), [pathname]);

  /* The same decision the showroom pages make, read from the same key — a
     visitor who turned 3D off on the homepage must not find it running
     behind the checkout. */
  useEffect(() => {
    let choice: boolean | null = null;
    try {
      const stored = window.localStorage.getItem(PREF_3D);
      if (stored === "on") choice = true;
      if (stored === "off") choice = false;
    } catch {
      /* fall through to the probe */
    }
    if (choice === null) {
      const probe = document.createElement("canvas");
      choice = !!(probe.getContext("webgl2") ?? probe.getContext("webgl"));
    }
    setAllowed(choice);
  }, []);

  /* A backdrop nobody is looking at is pure cost. requestAnimationFrame
     already throttles in a hidden tab, but the renderer still holds its
     buffers and still wakes on every visible frame of a background tab in
     some engines — unmounting is the honest version. */
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!station || allowed !== true || !visible) return null;

  return (
    <div className="nn-backdrop" aria-hidden="true">
      <BackdropCanvas station={station} sky={sky} reducedMotion={reducedMotion} />
      {/* The scrim. Without it the page's own type sits on a lit room and
          loses, which is the lesson the hero lockup already taught — see
          the measurements in components/showroom/materials.ts. */}
      <div className="nn-backdrop__scrim" />
    </div>
  );
}
