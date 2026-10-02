"use client";

/**
 * The bag as a full page, for anyone who would rather not work in a drawer —
 * and for the times a drawer is the wrong shape, like reviewing six items on a
 * phone.
 */

import { useMemo } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { useBag } from "./BagProvider";
import { GarmentImage } from "./GarmentImage";
import { OrderSummary, type PricedLine } from "@/components/checkout/OrderSummary";

export function BagPage({ products }: { products: Product[] }) {
  const { lines, setQuantity, remove } = useBag();
  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  const priced: PricedLine[] = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byHandle.get(line.handle);
        if (!product) return [];
        const variant = product.variants.find((v) => v.size === line.size);
        const unitMinor = variant?.priceMinor ?? product.priceMinor;
        return [
          {
            handle: line.handle,
            size: line.size,
            quantity: line.quantity,
            product,
            unitMinor,
            totalMinor: unitMinor * line.quantity,
          },
        ];
      }),
    [lines, byHandle],
  );

  if (!priced.length) {
    return (
      <div className="nn-wrap py-24 text-center">
        <h2 className="text-title">Nothing here yet</h2>
        <p className="mt-4 text-[var(--ink-soft)]">
          Your bag is empty. The collection is eight pieces; start with a shirt.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/collection" className="nn-btn nn-btn--gold">
            <span>See Collection 001</span>
          </Link>
          <Link href="/" className="nn-btn nn-btn--quiet">
            <span>Walk the showroom</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="nn-wrap grid gap-14 py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
      <ul className="m-0 flex list-none flex-col gap-8 p-0">
        {priced.map((l) => (
          <li key={`${l.handle}-${l.size}`} className="flex gap-6 border-b pb-8">
            <Link
              href={`/product/${l.handle}`}
              className="grid h-36 w-28 shrink-0 place-items-center p-3"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              <GarmentImage product={l.product} className="w-full" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/product/${l.handle}`}
                    className="text-lead text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                  >
                    {l.product.name}
                  </Link>
                  <p className="mt-1 text-fine text-[var(--ink-soft)]">
                    {l.product.colour} · {l.product.type === "shirt" ? "Size" : "Waist"} {l.size}
                  </p>
                </div>
                <p className="nn-tabular text-lead">
                  {formatMinor(l.totalMinor, l.product.currency)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center" style={{ border: "1px solid var(--line)" }}>
                  <button
                    type="button"
                    className="px-4 py-2 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                    onClick={() => setQuantity(l.handle, l.size, l.quantity - 1)}
                    aria-label={`Reduce the quantity of ${l.product.name}, size ${l.size}`}
                  >
                    −
                  </button>
                  <span className="nn-tabular min-w-[2.5rem] text-center">{l.quantity}</span>
                  <button
                    type="button"
                    className="px-4 py-2 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                    onClick={() => setQuantity(l.handle, l.size, l.quantity + 1)}
                    aria-label={`Increase the quantity of ${l.product.name}, size ${l.size}`}
                  >
                    +
                  </button>
                </div>
                <span className="nn-tabular text-fine text-[var(--ink-faint)]">
                  {formatMinor(l.unitMinor, l.product.currency)} each
                </span>
                <Link
                  href={`/trial-room?product=${l.handle}`}
                  className="nn-link text-[0.72rem] uppercase tracking-[0.14em]"
                >
                  Check the size
                </Link>
                <button
                  type="button"
                  onClick={() => remove(l.handle, l.size)}
                  className="nn-link ml-auto text-[0.72rem] uppercase tracking-[0.14em]"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside>
        <OrderSummary lines={priced} />
        <Link href="/checkout" className="nn-btn nn-btn--solid mt-6 w-full">
          <span>Checkout</span>
        </Link>
        <Link href="/collection" className="nn-link mt-5 block text-center text-fine">
          Keep looking
        </Link>
      </aside>
    </div>
  );
}
