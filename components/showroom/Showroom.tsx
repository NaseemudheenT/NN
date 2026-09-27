"use client";

/**
 * The showroom as the visitor meets it.
 *
 * This module is deliberately light: chrome, the CSS room, the decision about
 * whether to run 3D at all, and the product panel. The three.js half is a
 * dynamic import, so the page paints and becomes interactive before any of it
 * arrives — which is what the four-second budget in CLAUDE.md is really about.
 *
 * With 3D off, or on a device without WebGL, everything here still works and
 * the collection is one tap away.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { CatalogueResult, Product } from "@/lib/catalog/types";
import { useDayPhase } from "@/components/theme/ThemeProvider";
import { track } from "@/components/layout/ConsentBanner";
import { DEFAULT_VIEWPOINT, VIEWPOINTS, viewpointById } from "./viewpoints";
import { ProductPanel } from "./ProductPanel";
import { ShowroomPlate } from "./ShowroomPlate";
import type { Quality } from "./ShowroomCanvas";

/** three.js and friends, fetched only once we know we are going to use them. */
const ShowroomCanvas = dynamic(() => import("./ShowroomCanvas"), {
  ssr: false,
  loading: () => null,
});

const PREF_3D = "nn-showroom-3d";

/** A coarse first guess at what this device can manage, refined by measurement. */
function guessQuality(): Quality {
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;

  // Someone on a metered connection who has asked to save data gets the light version.
  if (connection?.saveData) return "low";
  if (connection?.effectiveType && /(^|-)(slow-)?2g$/.test(connection.effectiveType)) return "low";
  if (cores <= 4) return "low";
  if (cores <= 6) return "medium";
  return "high";
}

export function Showroom({ catalogue }: { catalogue: CatalogueResult }) {
  const { sky, reducedMotion, phase } = useDayPhase();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [viewpointId, setViewpointId] = useState(DEFAULT_VIEWPOINT.id);
  const [selected, setSelected] = useState<Product | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  const viewpoint = useMemo(() => viewpointById(viewpointId), [viewpointId]);

  /* Decide whether to run 3D: a remembered choice, or WebGL support. */
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
      const canvas = document.createElement("canvas");
      choice = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    }

    setQuality(guessQuality());
    setEnabled(choice);
  }, []);

  const set3D = useCallback((on: boolean) => {
    setEnabled(on);
    if (!on) setCanvasReady(false);
    try {
      window.localStorage.setItem(PREF_3D, on ? "on" : "off");
    } catch {
      /* the choice holds for this visit */
    }
    track("showroom_3d", { on });
  }, []);

  const goTo = useCallback((id: string) => {
    setViewpointId(id);
    setSelected(null);
    track("showroom_viewpoint", { viewpoint: id });
  }, []);

  const step = useCallback(
    (direction: -1 | 1) => {
      const i = VIEWPOINTS.findIndex((v) => v.id === viewpointId);
      goTo(VIEWPOINTS[(i + direction + VIEWPOINTS.length) % VIEWPOINTS.length].id);
    },
    [viewpointId, goTo],
  );

  /* Arrow keys walk the room; Escape closes the panel. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const onSelect = useCallback((product: Product) => {
    setSelected(product);
    track("showroom_garment", { handle: product.handle });
  }, []);

  return (
    <section
      aria-label="The Nero Noren showroom"
      className="relative"
      style={{ height: "min(100svh, 980px)", minHeight: "34rem" }}
    >
      {/* The CSS room. Always rendered, fading out once 3D has taken over. */}
      <ShowroomPlate phase={phase} visible={!enabled || !canvasReady} />

      {enabled ? (
        <ShowroomCanvas
          products={catalogue.products}
          sky={sky}
          reducedMotion={reducedMotion}
          viewpoint={viewpoint}
          onViewpoint={goTo}
          onSelect={onSelect}
          selected={selected}
          initialQuality={quality}
          onReady={() => setCanvasReady(true)}
        />
      ) : null}

      {/* ── chrome ── */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        <div className="nn-wrap pointer-events-auto pt-24">
          <p className="nn-eyebrow">
            {enabled && canvasReady ? viewpoint.label : "Collection 001 — The Foundations"}
          </p>
          <h1 className="mt-2 max-w-[18ch] text-[var(--text-step-3)]">
            <span className="block">The art</span>
            <span className="block pl-[0.14em] italic text-[var(--accent)]">of dressing</span>
            <span className="block">well.</span>
          </h1>
          <p className="mt-5 max-w-[42ch] text-[var(--ink-soft)]">
            European-inspired menswear, cut for Indian life. Eight considered pieces that work
            together, season after season.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="nn-btn nn-btn--gold" href="/collection">
              <span>Shop Collection 001</span>
            </Link>
            <Link className="nn-btn nn-btn--quiet" href="/stylist">
              <span>Ask the NN stylist</span>
            </Link>
          </div>
        </div>

        <div className="nn-wrap pointer-events-auto pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {enabled && canvasReady ? (
              <nav aria-label="Showroom viewpoints" className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="nn-btn nn-btn--sm nn-btn--quiet"
                  onClick={() => step(-1)}
                  aria-label="Previous viewpoint"
                >
                  <span aria-hidden="true">←</span>
                </button>
                {VIEWPOINTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => goTo(v.id)}
                    aria-current={v.id === viewpointId ? "true" : undefined}
                    className="nn-link px-2 text-[var(--text-eyebrow)] uppercase tracking-[0.16em]"
                    data-active={v.id === viewpointId}
                  >
                    {v.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="nn-btn nn-btn--sm nn-btn--quiet"
                  onClick={() => step(1)}
                  aria-label="Next viewpoint"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </nav>
            ) : (
              <p className="max-w-[34ch] text-[var(--text-step--1)] text-[var(--ink-faint)]">
                {enabled === false
                  ? "The 3D showroom is off. Everything is still here in two dimensions."
                  : " "}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* always one tap away, exactly as the brief requires */}
              <Link className="nn-btn nn-btn--sm" href="/collection">
                <span>Shop in 2D</span>
              </Link>
              {enabled === null ? null : (
                <button
                  type="button"
                  className="nn-link text-[var(--text-eyebrow)] uppercase tracking-[0.16em]"
                  onClick={() => set3D(!enabled)}
                >
                  {enabled ? "Turn 3D off" : "Turn 3D on"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductPanel product={selected} onClose={() => setSelected(null)} source={catalogue.source} />
    </section>
  );
}
