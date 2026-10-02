"use client";

/**
 * The panel that slides in when a garment is tapped in the showroom.
 *
 * It is a modal dialogue in the real sense: focus moves into it, Tab is trapped
 * inside it, Escape closes it, and focus returns to whatever opened it. A
 * drawer that traps a keyboard user is worse than no drawer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentImage } from "@/components/shop/GarmentImage";
import { SizePicker } from "@/components/shop/SizePicker";
import { useBag } from "@/components/shop/BagProvider";

export function ProductPanel({
  product,
  onClose,
  source,
}: {
  product: Product | null;
  onClose: () => void;
  source: "shopify" | "seed";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const { add } = useBag();

  /* remember what opened us, and reset the size for each new garment */
  useEffect(() => {
    if (product) {
      opener.current = document.activeElement as HTMLElement | null;
      setSize(null);
    }
  }, [product]);

  /* focus in, focus back out */
  useEffect(() => {
    if (!product) {
      opener.current?.focus?.();
      return;
    }
    const first = panel.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, [product]);

  /* Escape closes, Tab is trapped */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
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
    [onClose],
  );

  if (!product) return null;

  const variant = product.variants.find((v) => v.size === size);
  const price = formatMinor(variant?.priceMinor ?? product.priceMinor, product.currency);

  return (
    <>
      {/* scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default border-0 p-0"
        style={{ background: "color-mix(in srgb, #000 42%, transparent)", backdropFilter: "blur(2px)" }}
        tabIndex={-1}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nn-panel-title"
        onKeyDown={onKeyDown}
        className="nn-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-[26rem] flex-col overflow-y-auto"
        style={{ animation: "nn-slide-in 520ms var(--ease-showroom) both" }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-6">
          <div>
            <p className="nn-eyebrow">{product.colour}</p>
            <h2 id="nn-panel-title" className="mt-1 text-lead">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="nn-link text-eyebrow uppercase tracking-[0.16em]"
          >
            Close
          </button>
        </div>

        <div className="p-6">
          {/* the piece itself */}
          <div
            className="nn-plate mx-auto grid max-w-[15rem] place-items-center p-6"
            style={{ background: "var(--paper)" }}
          >
            <GarmentImage product={product} className="w-full drop-shadow-sm" />
          </div>

          <p className="nn-tabular mt-6 text-lead">{price}</p>
          <p className="mt-3 text-fine text-[var(--ink-soft)]">
            {product.description}
          </p>

          <dl className="mt-6 flex flex-col gap-3 border-t pt-5 text-fine">
            {product.fabric ? (
              <div>
                <dt className="nn-eyebrow">Fabric</dt>
                <dd className="mt-1 text-[var(--ink-soft)]">{product.fabric}</dd>
              </div>
            ) : null}
            {product.fitNotes ? (
              <div>
                <dt className="nn-eyebrow">How it fits</dt>
                <dd className="mt-1 text-[var(--ink-soft)]">{product.fitNotes}</dd>
              </div>
            ) : null}
            {product.bestFor ? (
              <div>
                <dt className="nn-eyebrow">Best for</dt>
                <dd className="mt-1 text-[var(--ink-soft)]">{product.bestFor}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-7">
            <SizePicker product={product} value={size} onChange={setSize} />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="nn-btn nn-btn--solid w-full"
              disabled={!size}
              onClick={() => {
                if (!size) return;
                add(
                  { handle: product.handle, size, quantity: 1, variantId: variant?.id },
                  `${product.name}, ${product.colour}, size ${size},`,
                );
                onClose();
              }}
            >
              <span>{size ? "Add to bag" : "Choose a size"}</span>
            </button>
            <Link
              href={`/trial-room?product=${encodeURIComponent(product.handle)}`}
              className="nn-btn nn-btn--quiet w-full"
            >
              <span>Try it on</span>
            </Link>
            <Link href={`/product/${product.handle}`} className="nn-link text-center">
              See the full details
            </Link>
          </div>

          {source === "seed" ? (
            <p className="mt-6 border-t pt-4 text-[0.72rem] text-[var(--ink-faint)]">
              Showing the Collection 001 reference catalogue. Connect Shopify to serve live
              prices and stock.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
