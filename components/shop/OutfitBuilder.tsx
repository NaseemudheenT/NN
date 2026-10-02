"use client";

/**
 * One shirt, four ways.
 *
 * Pick a shirt; every trouser in the collection is shown under it. The
 * combinations are not curated by hand — they are every trouser the catalogue
 * returned, which is the honest version of "these all work together".
 */

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt, OutfitArt } from "./GarmentArt";
import { useBag } from "./BagProvider";

export function OutfitBuilder({
  shirts,
  trousers,
}: {
  shirts: Product[];
  trousers: Product[];
}) {
  const [handle, setHandle] = useState(shirts[0]?.handle ?? "");
  const shirt = shirts.find((s) => s.handle === handle) ?? shirts[0];
  const { openBag } = useBag();

  if (!shirt || !trousers.length) {
    return (
      <p className="text-[var(--ink-soft)]">
        The outfit builder needs at least one shirt and one trouser in the catalogue.
      </p>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_1fr]">
      {/* choose the shirt */}
      <div>
        <fieldset className="border-0 p-0">
          <legend className="nn-label">Start with a shirt</legend>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Start with a shirt">
            {shirts.map((s) => {
              const on = s.handle === shirt.handle;
              return (
                <button
                  key={s.handle}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setHandle(s.handle)}
                  className="flex items-center gap-3 border p-2 text-left transition-colors duration-500"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--line)",
                    background: on ? "var(--surface)" : "transparent",
                  }}
                >
                  <span
                    className="grid h-12 w-10 shrink-0 place-items-center"
                    style={{ background: "var(--paper)" }}
                  >
                    {/* Forty pixels wide — the drawing reads better small
                        than a photograph does. See the same call in
                        TrialRoom for the reasoning. */}
                    <GarmentArt product={s} className="w-full" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-fine">{s.name}</span>
                    <span className="block text-[0.72rem] text-[var(--ink-faint)]">{s.colour}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* the outfits */}
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(190px,100%),1fr))]">
        {trousers.map((t) => (
          <article key={t.handle} className="group">
            <div
              className="nn-plate grid place-items-end p-[8%] pt-[14%] group-hover:border-[var(--accent)]"
              style={{ background: "var(--paper)", aspectRatio: "3 / 4.6" }}
            >
              <OutfitArt
                shirt={shirt}
                trouser={t}
                className="w-[88%] transition-transform duration-700 ease-[var(--ease-showroom)] group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-4 text-fine">
              With {t.name.replace("The ", "").toLowerCase()} in {t.colour}
            </p>
            {t.bestFor ? (
              <p className="mt-1 text-[0.72rem] text-[var(--ink-faint)]">{t.bestFor}</p>
            ) : null}
            <p className="nn-tabular mt-2 text-fine text-[var(--ink-soft)]">
              {formatMinor(shirt.priceMinor + t.priceMinor, t.currency)} together
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={`/product/${t.handle}`} className="nn-link text-[0.72rem] uppercase tracking-[0.14em]">
                The trouser
              </Link>
              <Link href={`/product/${shirt.handle}`} className="nn-link text-[0.72rem] uppercase tracking-[0.14em]">
                The shirt
              </Link>
              <button
                type="button"
                onClick={openBag}
                className="nn-link ml-auto text-[0.72rem] uppercase tracking-[0.14em]"
              >
                Your bag
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
