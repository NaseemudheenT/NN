"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { Chevron } from "@/components/ui/icons";
import { groupByCut } from "@/lib/catalog/group";
import type { Product } from "@/lib/catalog/types";

type Audience = "all" | "men" | "boys";
type Sort = "featured" | "low" | "high" | "name";

const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price, low to high" },
  { id: "high", label: "Price, high to low" },
  { id: "name", label: "Alphabetical" },
];

/**
 * The collection.
 *
 * Filtering is a `useMemo` over an array that is already on the client,
 * because the catalogue is eight pieces. No request, no spinner, no empty
 * frame between one filter and the next — the grid simply is what it is on
 * the next frame.
 *
 * Categories the collection does not yet carry are SHOWN AND DISABLED rather
 * than hidden. A customer who is told the shop has outerwear and finds no
 * link to it assumes the site is broken; one who sees "Outerwear — soon"
 * knows exactly where they stand.
 */
export function CollectionView({
  products,
  initialCategory,
  title = "The collection",
  blurb = "Modern European menswear for men and boys",
}: {
  products: Product[];
  initialCategory?: string;
  title?: string;
  blurb?: string;
}) {
  const [audience, setAudience] = useState<Audience>("all");
  const [category, setCategory] = useState<string>(initialCategory ?? "all");
  const [sort, setSort] = useState<Sort>("featured");

  /* Built from what is actually in the catalogue, plus the categories the
     label has announced but not yet shipped. */
  const categories = useMemo(() => {
    const live = [
      { id: "all", label: "Everything", count: products.length },
      { id: "shirts", label: "Shirts", count: products.filter((p) => p.type === "shirt").length },
      { id: "trousers", label: "Trousers", count: products.filter((p) => p.type === "trouser").length },
    ];
    const soon = [
      { id: "outerwear", label: "Outerwear", count: 0 },
      { id: "loafers", label: "Loafers", count: 0 },
      { id: "accessories", label: "Accessories", count: 0 },
    ];
    return [...live.filter((c) => c.count > 0 || c.id === "all"), ...soon];
  }, [products]);

  const shown = useMemo(() => {
    let list = products;
    if (category === "shirts") list = list.filter((p) => p.type === "shirt");
    if (category === "trousers") list = list.filter((p) => p.type === "trouser");
    if (category === "outerwear" || category === "loafers" || category === "accessories") list = [];
    /* Boys is a cut, not a separate catalogue; until the boys' sizes are
       live the honest answer is the full collection with a note. */
    if (audience === "boys") list = list.filter((p) => p.sizeChart.rows.some((r) => r.label === "S"));

    const cuts = groupByCut(list);
    const sorted = [...cuts];
    if (sort === "low") sorted.sort((a, b) => a.lead.priceMinor - b.lead.priceMinor);
    if (sort === "high") sorted.sort((a, b) => b.lead.priceMinor - a.lead.priceMinor);
    if (sort === "name") sorted.sort((a, b) => a.lead.name.localeCompare(b.lead.name));
    return sorted;
  }, [products, category, audience, sort]);

  return (
    <div className="coll">
      <div className="wrap">
        <header className="coll__head">
          <h1 className="d-h1">{title}</h1>
          <p className="lead">{blurb}</p>
        </header>

        <div className="coll__bar">
          <div className="coll__tabs" role="tablist" aria-label="Audience">
            {(["all", "men", "boys"] as Audience[]).map((a) => (
              <button
                key={a}
                role="tab"
                type="button"
                aria-selected={audience === a}
                className="coll__tab ul-grow label"
                data-on={audience === a || undefined}
                onClick={() => setAudience(a)}
              >
                {a === "all" ? "All" : a === "men" ? "Men" : "Boys"}
              </button>
            ))}
          </div>

          <label className="coll__sort">
            <span className="label label--soft">Sort by</span>
            <span className="coll__select">
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <Chevron size={15} />
            </span>
          </label>
        </div>

        <div className="coll__body">
          <nav className="coll__side" aria-label="Categories">
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="coll__cat"
                    data-on={category === c.id || undefined}
                    disabled={c.count === 0 && c.id !== "all"}
                    onClick={() => setCategory(c.id)}
                  >
                    <span>{c.label}</span>
                    <span className="coll__cat-n tnum small muted">
                      {c.count === 0 && c.id !== "all" ? "soon" : c.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="coll__grid-wrap">
            {shown.length ? (
              <ul className="grid grid--4">
                {shown.map(({ lead, siblings }, i) => (
                  <li key={lead.handle}>
                    <ProductCard product={lead} siblings={siblings} priority={i < 4} sizes="(max-width: 760px) 50vw, 22vw" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="coll__none">
                <h2 className="d-h3">Not in the collection yet</h2>
                <p className="lead">
                  Collection 001 is The Foundations — shirts and trousers, cut to go with
                  each other. Outerwear, loafers and accessories follow.
                </p>
                <button type="button" className="btn btn--solid" onClick={() => setCategory("all")}>
                  See what is here
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
