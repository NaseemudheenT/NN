"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { MOTION } from "@/lib/tokens";
import type { Category, Product } from "@/lib/types";

const ZONES: { id: Category | "all"; label: string; caption: string }[] = [
  { id: "all", label: "Everything", caption: "The whole floor." },
  { id: "shirts", label: "Shirting", caption: "Hung on brass along the west wall." },
  { id: "trousers", label: "Trousers", caption: "Folded on oak beneath the windows." },
  { id: "knitwear", label: "Knitwear", caption: "Folded on the lower shelf." },
  { id: "outerwear", label: "Outerwear", caption: "On the far rail by the door." },
];

type Sort = "house" | "name" | "price-low" | "price-high";

const SORTS: { id: Sort; label: string }[] = [
  { id: "house", label: "House order" },
  { id: "name", label: "Name" },
  { id: "price-low", label: "Price, low first" },
  { id: "price-high", label: "Price, high first" },
];

export function CollectionView({ products }: { products: Product[] }) {
  const [zone, setZone] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("house");

  const available = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return ZONES.filter((z) => z.id === "all" || present.has(z.id as Category));
  }, [products]);

  const shown = useMemo(() => {
    const list = zone === "all" ? [...products] : products.filter((p) => p.category === zone);
    switch (sort) {
      case "name":
        return list.sort((a, b) => a.title.localeCompare(b.title) || a.colour.localeCompare(b.colour));
      case "price-low":
        return list.sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity));
      case "price-high":
        return list.sort((a, b) => (b.price?.amount ?? -Infinity) - (a.price?.amount ?? -Infinity));
      default:
        return list;
    }
  }, [products, zone, sort]);

  const caption = available.find((z) => z.id === zone)?.caption;
  const [hero, ...rest] = shown;

  return (
    <>
      {/* zone navigation — moving to another part of the floor */}
      <div className="sticky top-[4.5rem] z-40 -mx-5 mb-10 px-5 sm:-mx-8 sm:px-8 md:top-24">
        <div className="nn-glass mx-auto flex max-w-[84rem] flex-col gap-3 rounded-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 sm:pb-0">
            {available.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZone(z.id)}
                aria-pressed={zone === z.id}
                className={`nn-label relative shrink-0 rounded-full px-3.5 py-2 transition-colors duration-300 ${
                  zone === z.id ? "text-accent-ink" : "text-ink-faint hover:text-ink"
                }`}
              >
                {zone === z.id && (
                  <motion.span
                    layoutId="nn-zone"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={MOTION.spring}
                  />
                )}
                <span className="relative">{z.label}</span>
              </button>
            ))}
          </div>

          <label className="nn-label flex items-center gap-2 text-ink-faint">
            <span className="sr-only sm:not-sr-only">Order</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="nn-label cursor-pointer rounded-sm border border-line bg-transparent px-2.5 py-2 text-ink outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id} className="bg-bg-elev text-ink">
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mx-auto max-w-[84rem]">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <p className="nn-body text-sm text-ink-soft">{caption}</p>
          <p className="nn-meta shrink-0 text-ink-faint">
            {shown.length} {shown.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="nn-body py-24 text-center text-ink-faint">
            Nothing is displayed in this part of the showroom yet.
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div key={`${zone}-${sort}`} className="grid gap-px border border-line bg-line">
              {/* the hero display: one garment given the room it deserves */}
              {hero && (
                <div className="grid bg-bg lg:grid-cols-[1.15fr_1fr]">
                  <ProductCard product={hero} large />
                  <div className="flex flex-col justify-center border-t border-line p-8 lg:border-l lg:border-t-0 lg:p-12">
                    <p className="nn-meta text-ink-faint">On the stand</p>
                    <h2 className="nn-display mt-4 text-[clamp(1.9rem,4vw,3rem)] text-ink">
                      {hero.title}
                    </h2>
                    <p className="nn-body mt-5 text-[0.95rem] text-ink-soft">{hero.description}</p>
                    <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                      {[
                        ["Colour", hero.colour],
                        ["Cloth", hero.fabric],
                        ["Fit", hero.fit],
                        ["Sizes", hero.sizes.join(" · ")],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k} className="border-t border-line-soft pt-3">
                            <dt className="nn-meta text-ink-faint">{k}</dt>
                            <dd className="nn-body mt-1.5 text-[0.85rem] text-ink">{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p, i) => (
                    <Reveal key={p.id} as="li" delay={Math.min(i, 6) * 0.04} className="bg-bg">
                      <ProductCard product={p} />
                    </Reveal>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
