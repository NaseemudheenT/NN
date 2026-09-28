"use client";

/**
 * The walk.
 *
 * A tall scroll container with the showroom stuck to the viewport inside it.
 * The customer scrolls; the camera walks the room; real content passes in
 * front of it. That is the whole mechanism, and it gives the brief's
 * scroll-driven storytelling without a scroll-jacking library — the page
 * scrolls exactly as a page does, so the scrollbar, the keyboard, a trackpad
 * and a screen reader all behave normally.
 *
 * The copy is in normal document flow, not painted into the canvas or faded in
 * by transform. It is readable with 3D off, with JavaScript slow, and with
 * every animation frozen.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogueResult, Product } from "@/lib/catalog/types";
import { useDayPhase } from "@/components/theme/ThemeProvider";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";
import { track } from "@/components/layout/ConsentBanner";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { ProductPanel } from "@/components/showroom/ProductPanel";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";
import type { Quality } from "./ShowroomWalkCanvas";

const ShowroomWalkCanvas = dynamic(() => import("./ShowroomWalkCanvas"), {
  ssr: false,
  loading: () => null,
});

const PREF_3D = "nn-showroom-3d";

/** A coarse first guess, refined by measured frame rate. */
function guessQuality(): Quality {
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (connection?.saveData) return "low";
  if (connection?.effectiveType && /(^|-)(slow-)?2g$/.test(connection.effectiveType)) return "low";
  if (cores <= 4) return "low";
  if (cores <= 6) return "medium";
  return "high";
}

/** The stations the copy is written against, as scroll fractions. */
const BEATS = [
  {
    at: [0, 0.16],
    label: "The house",
    heading: "Timeless style\nbuilds character.",
    body: "European-inspired menswear for men and boys, cut for Indian life. Eight considered pieces that work together, season after season.",
    action: { href: "/collection", label: "Discover the collection" },
  },
  {
    at: [0.2, 0.42],
    label: "The room",
    heading: "Open at\nevery hour.",
    body: "The showroom is lit by your own clock. The sun's position, its colour and the length of every shadow are computed from the hour, the date and where you are — so the room at nine in the morning is not the room at nine at night.",
  },
  {
    at: [0.46, 0.68],
    label: "Collection 001",
    heading: "The\nFoundations.",
    body: "Two Oxfords, a Poplin, a Stripe, three Tailored trousers and a Pleated. Every shirt is cut to meet every trouser — that is the whole idea of a foundation.",
    action: { href: "/collection", label: "See all eight" },
  },
  {
    at: [0.72, 0.98],
    label: "The fit",
    heading: "Your size,\nworked out.",
    body: "The trial room estimates your measurements from your height and weight, then compares them against the finished measurements of the garment. It tells you the room you have at the chest, the waist and the hip — and which numbers it estimated.",
    action: { href: "/trial-room", label: "Enter the trial room" },
  },
] as const;

export function ShowroomWalk({ catalogue }: { catalogue: CatalogueResult }) {
  const { sky, phase } = useDayPhase();
  const reducedMotion = usePrefersReducedMotion();

  const walk = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [selected, setSelected] = useState<Product | null>(null);
  /* The sky is computed from a clock, and the server's clock is not the
     visitor's. Rendering its numbers during SSR guarantees a hydration
     mismatch, so the reading waits for the client. */
  const [mounted, setMounted] = useState(false);

  /* 0 at the top of the walk, 1 when its last screen leaves */
  const { scrollYProgress } = useScroll({
    target: walk,
    offset: ["start start", "end end"],
  });

  useEffect(() => setMounted(true), []);

  /* decide whether to run 3D at all */
  useEffect(() => {
    let choice: boolean | null = null;
    try {
      const stored = window.localStorage.getItem(PREF_3D);
      if (stored === "on") choice = true;
      if (stored === "off") choice = false;
    } catch {
      /* fall through to the automatic decision */
    }
    if (choice === null) {
      const probe = document.createElement("canvas");
      choice = !!(probe.getContext("webgl2") ?? probe.getContext("webgl"));
    }
    setQuality(guessQuality());
    setEnabled(choice);
  }, []);

  const set3D = useCallback((on: boolean) => {
    setEnabled(on);
    try {
      window.localStorage.setItem(PREF_3D, on ? "on" : "off");
    } catch {
      /* the choice holds for this visit */
    }
    track("showroom_3d", { on });
  }, []);

  const onSelect = useCallback((product: Product) => {
    setSelected(product);
    track("showroom_garment", { handle: product.handle });
  }, []);

  /* The hero lockup fades as the walk begins. Fading OUT is safe: if the
     animation is frozen it simply stays visible, which is the readable state. */
  const heroOut = useTransform(scrollYProgress, [0, 0.13], [1, 0]);
  const heroLift = useTransform(scrollYProgress, [0, 0.13], [0, reducedMotion ? 0 : -60]);

  const monogramWidth = useMemo(() => N_INTERLOCK_X + 84, []);

  return (
    <>
      {/* ═══ the walk ═══ */}
      <div ref={walk} className="nn-walk">
        <div className="nn-walk__viewport">
          {/* the room */}
          {enabled ? (
            <ShowroomWalkCanvas
              products={catalogue.products}
              sky={sky}
              reducedMotion={reducedMotion}
              progress={scrollYProgress}
              onSelect={onSelect}
              selected={selected}
              initialQuality={quality}
            />
          ) : null}

          {/* a scrim so type stays legible whatever the room is doing */}
          <div className="nn-walk__scrim" aria-hidden="true" />

          {/* ── the hero lockup, as the board sets it ── */}
          <motion.div className="nn-walk__hero" style={{ opacity: heroOut, y: heroLift }}>
            <svg
              className="nn-walk__mark"
              viewBox={`0 0 ${monogramWidth} 100`}
              role="img"
              aria-label="Nero Noren"
            >
              <defs>
                <linearGradient id="nn-hero-metal" x1="0" y1="0" x2="1" y2="0.42">
                  <stop offset="0%" stopColor="var(--metal-shadow)" />
                  <stop offset="32%" stopColor="var(--metal-body)" />
                  <stop offset="50%" stopColor="var(--metal-spec)" />
                  <stop offset="68%" stopColor="var(--metal-body)" />
                  <stop offset="100%" stopColor="var(--metal-shadow)" />
                </linearGradient>
              </defs>
              <g fill="url(#nn-hero-metal)">
                <path d={N_PATH} />
                <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
              </g>
            </svg>

            <h1 className="nn-walk__wordmark">Nero Noren</h1>
            <p className="nn-walk__audience">Men &amp; Boys</p>
            <p className="nn-walk__tagline">
              Timeless style
              <br />
              builds character
            </p>

            <Link href="/collection" className="nn-walk__discover">
              <span>Discover the collection</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>

          {/* the 2D way through, always one tap away */}
          <div className="nn-walk__escape">
            <GlassButton
              tone="quiet"
              size="sm"
              onClick={() => set3D(!(enabled ?? true))}
              magnetism={0}
            >
              {enabled ? "Turn 3D off" : "Turn 3D on"}
            </GlassButton>
            <Link href="/collection" className="nn-link text-[var(--text-micro)] uppercase tracking-[var(--tracking-label)]">
              Shop in 2D
            </Link>
          </div>
        </div>

        {/* ── the beats. Real content in normal flow, passing in front of
               the room. Each is a full screen, which is what gives the
               camera its distance to travel. ── */}
        {BEATS.map((beat, i) => (
          <section key={beat.label} className="nn-walk__beat" data-first={i === 0}>
            <motion.div
              className="nn-walk__plate glass glass--panel glass--dispersive"
              initial={{ y: 26 }}
              whileInView={{ y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.72, ease: [0.16, 0.84, 0.24, 1] }}
            >
              <p className="nn-label nn-label--metal">{beat.label}</p>
              <h2 className="nn-walk__heading">{beat.heading}</h2>
              <p className="nn-walk__body">{beat.body}</p>
              {"action" in beat && beat.action ? (
                <Link href={beat.action.href} className="mt-2 inline-block">
                  <GlassButton tone="metal" size="md">
                    {beat.action.label}
                  </GlassButton>
                </Link>
              ) : null}
              {i === 1 && mounted ? (
                <p className="nn-walk__reading">
                  Right now: {phase}, sun {Math.abs(Math.round(sky.solar.elevation))}°{" "}
                  {sky.solar.elevation >= 0 ? "above" : "below"} your horizon,{" "}
                  {Math.round(sky.kelvin)} K.
                </p>
              ) : null}
            </motion.div>
          </section>
        ))}
      </div>

      <ProductPanel product={selected} onClose={() => setSelected(null)} source={catalogue.source} />
    </>
  );
}
