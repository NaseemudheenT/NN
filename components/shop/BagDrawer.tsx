"use client";

/**
 * The bag drawer.
 *
 * Prices are looked up from the catalogue the page was rendered with, never
 * read from storage, so a price change on Shopify is reflected the moment the
 * bag is next opened rather than being frozen at the moment of adding.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { useBag } from "./BagProvider";
import { GarmentArt } from "./GarmentArt";

export function BagDrawer({ products }: { products: Product[] }) {
  const { isOpen, closeBag, lines, setQuantity, remove, count } = useBag();
  const drawer = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const byHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  const priced = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byHandle.get(line.handle);
        if (!product) return [];
        const variant = product.variants.find((v) => v.size === line.size);
        const unitMinor = variant?.priceMinor ?? product.priceMinor;
        return [{ line, product, unitMinor, totalMinor: unitMinor * line.quantity }];
      }),
    [lines, byHandle],
  );

  const subtotalMinor = priced.reduce((a, p) => a + p.totalMinor, 0);
  const currency = priced[0]?.product.currency ?? "INR";

  /* focus management, the same contract as the product panel */
  useEffect(() => {
    if (isOpen) {
      opener.current = document.activeElement as HTMLElement | null;
      drawer.current
        ?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
        ?.focus();
    } else {
      opener.current?.focus?.();
    }
  }, [isOpen]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBag();
        return;
      }
      if (e.key !== "Tab" || !drawer.current) return;
      const focusable = Array.from(
        drawer.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [closeBag],
  );

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close the bag"
        onClick={closeBag}
        tabIndex={-1}
        className="fixed inset-0 z-40 cursor-default border-0 p-0"
        style={{ background: "color-mix(in srgb, #000 42%, transparent)" }}
      />

      <div
        ref={drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nn-bag-title"
        onKeyDown={onKeyDown}
        className="nn-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-[28rem] flex-col"
        style={{ animation: "nn-slide-in 480ms var(--ease-showroom) both" }}
      >
        <div className="flex items-baseline justify-between gap-4 border-b p-6">
          <h2 id="nn-bag-title" className="text-lead">
            Your bag
            <span className="nn-tabular ml-2 text-fine text-[var(--ink-faint)]">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </h2>
          <button
            type="button"
            onClick={closeBag}
            className="nn-link text-eyebrow uppercase tracking-[0.16em]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {priced.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[var(--ink-soft)]">Your bag is empty.</p>
              <Link href="/collection" onClick={closeBag} className="nn-btn nn-btn--sm mt-6">
                <span>See Collection 001</span>
              </Link>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-6 p-0">
              {priced.map(({ line, product, unitMinor, totalMinor }) => (
                <li key={`${line.handle}-${line.size}`} className="flex gap-4 border-b pb-6">
                  <div
                    className="grid w-20 shrink-0 place-items-center p-2"
                    style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
                  >
                    <GarmentArt product={product} className="w-full" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${product.handle}`}
                          onClick={closeBag}
                          className="block truncate text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-fine text-[var(--ink-soft)]">
                          {product.colour} · {product.type === "shirt" ? "Size" : "Waist"} {line.size}
                        </p>
                      </div>
                      <p className="nn-tabular shrink-0 text-fine">
                        {formatMinor(totalMinor, product.currency)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="inline-flex items-center"
                        style={{ border: "1px solid var(--line)" }}
                      >
                        <button
                          type="button"
                          className="px-3 py-1.5 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                          onClick={() => setQuantity(line.handle, line.size, line.quantity - 1)}
                          aria-label={`Reduce the quantity of ${product.name}, size ${line.size}`}
                        >
                          −
                        </button>
                        <span className="nn-tabular min-w-[2rem] text-center text-fine">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                          onClick={() => setQuantity(line.handle, line.size, line.quantity + 1)}
                          aria-label={`Increase the quantity of ${product.name}, size ${line.size}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="nn-tabular text-[0.72rem] text-[var(--ink-faint)]">
                        {formatMinor(unitMinor, product.currency)} each
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(line.handle, line.size)}
                        className="nn-link ml-auto text-[0.72rem] uppercase tracking-[0.14em]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {priced.length > 0 ? (
          <div className="border-t p-6">
            <div className="flex items-baseline justify-between">
              <span className="nn-eyebrow">Subtotal</span>
              <span className="nn-tabular text-lead">
                {formatMinor(subtotalMinor, currency)}
              </span>
            </div>
            <p className="mt-2 text-[0.72rem] text-[var(--ink-faint)]">
              Includes GST. Delivery is calculated at checkout.
            </p>
            <Link href="/checkout" onClick={closeBag} className="nn-btn nn-btn--solid mt-5 w-full">
              <span>Checkout</span>
            </Link>
            <Link href="/bag" onClick={closeBag} className="nn-link mt-4 block text-center text-fine">
              See the full bag
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
