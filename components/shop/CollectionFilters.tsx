"use client";

/**
 * Filtering the collection.
 *
 * Eight pieces do not need a search engine, so this is three honest filters and
 * a sort. The counts are computed from the catalogue, so a filter never offers
 * a choice that would return nothing.
 */

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { ProductCard } from "./ProductCard";

type Filter = "all" | "shirt" | "trouser";
type Sort = "curated" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "curated", label: "As curated" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function CollectionFilters({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("curated");

  const counts = useMemo(
    () => ({
      all: products.length,
      shirt: products.filter((p) => p.type === "shirt").length,
      trouser: products.filter((p) => p.type === "trouser").length,
    }),
    [products],
  );

  const shown = useMemo(() => {
    const list = filter === "all" ? [...products] : products.filter((p) => p.type === filter);
    if (sort === "price-asc") list.sort((a, b) => a.priceMinor - b.priceMinor);
    if (sort === "price-desc") list.sort((a, b) => b.priceMinor - a.priceMinor);
    return list;
  }, [products, filter, sort]);

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: `Everything (${counts.all})` },
    { value: "shirt", label: `Shirts (${counts.shirt})` },
    { value: "trouser", label: `Trousers (${counts.trouser})` },
  ];

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b pb-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the collection">
          {FILTERS.filter((f) => f.value === "all" || counts[f.value] > 0).map((f) => {
            const on = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.value)}
                className="border px-4 py-2 text-eyebrow uppercase tracking-[0.14em] transition-colors duration-500"
                style={{
                  borderColor: on ? "var(--btn-bg)" : "var(--line)",
                  background: on ? "var(--btn-bg)" : "transparent",
                  color: on ? "var(--btn-ink)" : "var(--ink-soft)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label className="nn-eyebrow" htmlFor="nn-sort">
            Sort
          </label>
          <select
            id="nn-sort"
            className="nn-field w-auto py-2"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {shown.length} of {products.length} pieces.
      </p>

      {shown.length === 0 ? (
        <p className="text-[var(--ink-soft)]">Nothing in the collection matches that just now.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-12 [grid-template-columns:repeat(auto-fill,minmax(min(248px,100%),1fr))]">
          {shown.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
