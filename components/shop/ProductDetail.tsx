"use client";

/**
 * A single piece, in full.
 *
 * The garment can be turned around here, which is the point at which the woven
 * NN label at the back neck becomes visible — the same detail the showroom shows
 * in 3D. Turning it is a real transform on a real back view, not a crossfade
 * between two pictures.
 */

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "./GarmentArt";
import { SizePicker } from "./SizePicker";
import { useBag } from "./BagProvider";
import { LogoMark } from "@/components/brand/LogoMark";
import { track } from "@/components/layout/ConsentBanner";

export function ProductDetail({
  product,
  source,
}: {
  product: Product;
  source: "shopify" | "seed";
}) {
  const [size, setSize] = useState<string | null>(null);
  const [turned, setTurned] = useState(false);
  const { add, openBag } = useBag();

  const variant = product.variants.find((v) => v.size === size);
  const soldOut = product.variants.every((v) => !v.available);

  return (
    <div className="nn-wrap grid gap-14 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      {/* ── the garment ── */}
      <div>
        <div
          className="nn-plate grid place-items-center p-[10%]"
          style={{ background: "var(--paper)", perspective: "1200px" }}
        >
          <div
            className="w-full transition-transform duration-[900ms] ease-[var(--ease-showroom)]"
            style={{
              transformStyle: "preserve-3d",
              transform: turned ? "rotateY(180deg)" : "none",
            }}
          >
            {/* front */}
            <div style={{ backfaceVisibility: "hidden" }}>
              <GarmentArt product={product} className="w-full" />
            </div>

            {/* back: the plain reverse, with the woven label at the neck */}
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="relative w-full">
                <GarmentArt
                  product={{ ...product, style: product.type === "shirt" ? "poplin" : product.style }}
                  className="w-full opacity-95"
                />
                {/* the back-neck label */}
                <div
                  className="absolute left-1/2 top-[7%] flex -translate-x-1/2 items-center gap-1 px-1.5 py-1"
                  style={{ background: "#efe9dd", border: "1px solid rgba(0,0,0,.18)" }}
                >
                  <LogoMark size={11} ring={false} shimmer={false} title={null} />
                  <span
                    className="text-[0.4rem] uppercase tracking-[0.2em]"
                    style={{ color: "#9c7a1e" }}
                  >
                    Nero Noren
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setTurned((t) => !t)}
            className="nn-btn nn-btn--sm nn-btn--quiet"
            aria-pressed={turned}
          >
            <span>{turned ? "Show the front" : "Turn it around"}</span>
          </button>
          <p className="text-[0.72rem] text-[var(--ink-faint)]">
            {turned
              ? "The woven NN label, stitched across the inside of the back neck."
              : "Turn it to see the back-neck label."}
          </p>
        </div>
      </div>

      {/* ── the details ── */}
      <div>
        <p className="nn-eyebrow">{product.colour}</p>
        <h1 className="mt-3 text-[var(--text-step-2)]">{product.name}</h1>
        <p className="nn-tabular mt-5 text-[var(--text-step-1)]">
          {formatMinor(variant?.priceMinor ?? product.priceMinor, product.currency)}
        </p>
        <p className="mt-5 max-w-[46ch] text-[var(--ink-soft)]">{product.description}</p>

        <div className="mt-9">
          <SizePicker product={product} value={size} onChange={setSize} />
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:max-w-sm">
          <button
            type="button"
            className="nn-btn nn-btn--solid w-full"
            disabled={soldOut || !size}
            onClick={() => {
              if (!size) return;
              add(
                { handle: product.handle, size, quantity: 1, variantId: variant?.id },
                `${product.name}, ${product.colour}, size ${size},`,
              );
              track("add_to_bag", { handle: product.handle, size });
              openBag();
            }}
          >
            <span>{soldOut ? "Sold out" : size ? "Add to bag" : "Choose a size"}</span>
          </button>
          <Link
            href={`/trial-room?product=${product.handle}`}
            className="nn-btn nn-btn--quiet w-full"
          >
            <span>Try it on</span>
          </Link>
        </div>

        <dl className="mt-11 flex flex-col divide-y border-t text-[var(--text-step--1)]">
          {[
            { term: "Fabric", detail: product.fabric },
            { term: "How it fits", detail: product.fitNotes },
            { term: "Best for", detail: product.bestFor },
            { term: "Care", detail: product.care },
          ]
            .filter((row) => row.detail)
            .map((row) => (
              <div key={row.term} className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="nn-eyebrow">{row.term}</dt>
                <dd className="m-0 text-[var(--ink-soft)]">{row.detail}</dd>
              </div>
            ))}
          <div className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <dt className="nn-eyebrow">Details</dt>
            <dd className="m-0 text-[var(--ink-soft)]">
              Woven NN label at the back neck. NN engraved buttons.{" "}
              {product.type === "shirt"
                ? "Single-needle side seams and a split yoke."
                : "A pressed crease that holds, and a clean 17 cm hem."}
            </dd>
          </div>
          <div className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <dt className="nn-eyebrow">Delivery</dt>
            <dd className="m-0 text-[var(--ink-soft)]">
              Delivered across India. Free size exchanges within 7 days.
            </dd>
          </div>
        </dl>

        {source === "seed" ? (
          <p className="mt-8 text-[0.72rem] text-[var(--ink-faint)]">
            This price comes from the Collection 001 reference catalogue. Connect Shopify to
            serve live prices and stock.
          </p>
        ) : null}
      </div>
    </div>
  );
}
