"use client";

/**
 * Sizes, as a radio group.
 *
 * A row of buttons is the wrong control for "choose exactly one of these" —
 * a radio group is, and it gets arrow-key navigation from the browser for free.
 * Sold-out sizes stay visible but disabled, because knowing a size exists and
 * is gone is useful information.
 */

import type { Product } from "@/lib/catalog/types";

export function SizePicker({
  product,
  value,
  onChange,
  recommended,
}: {
  product: Product;
  value: string | null;
  onChange: (size: string) => void;
  /** Highlighted as the trial room's recommendation. */
  recommended?: string | null;
}) {
  const label = product.type === "shirt" ? "Size" : "Waist, inches";

  return (
    <fieldset className="border-0 p-0">
      <legend className="nn-label">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {product.variants.map((v) => {
          const selected = value === v.size;
          const isRecommended = recommended === v.size;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!v.available}
              onClick={() => onChange(v.size)}
              className="relative min-w-[3rem] border px-3 py-2.5 text-fine transition-[background-color,color,border-color] duration-500 disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through"
              style={{
                borderColor: selected
                  ? "var(--btn-bg)"
                  : isRecommended
                    ? "var(--accent)"
                    : "var(--line)",
                background: selected ? "var(--btn-bg)" : "transparent",
                color: selected ? "var(--btn-ink)" : "var(--ink)",
              }}
            >
              {v.size}
              {isRecommended && !selected ? (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1 text-[0.58rem] uppercase tracking-[0.12em]"
                  style={{ background: "var(--bg)", color: "var(--accent)" }}
                >
                  Yours
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {recommended ? (
        <p className="mt-3 text-fine text-[var(--ink-faint)]">
          The trial room put you in a {recommended}.
        </p>
      ) : null}
    </fieldset>
  );
}
