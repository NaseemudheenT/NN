"use client";

import { Suspense, lazy, useState } from "react";
import { Close, Minus, Plus } from "@/components/ui/icons";
import { formatMinor } from "@/lib/money";
import { useBag } from "@/lib/bag/BagProvider";
import { useEscape, useFocusTrap } from "@/lib/ui/overlay";
import type { Product } from "@/lib/catalog/types";

const Hologram = lazy(() => import("./Hologram"));

export const BAG_LIMIT = 10;

/**
 * Taking a piece off the rail.
 *
 * It lifts, it turns, and everything true about it is on one card. The
 * garment keeps rotating on its own and can be grabbed and turned by hand,
 * because the first thing anyone does with a coat they have taken off a
 * rail is turn it round.
 *
 * ── what is on the card ─────────────────────────────────────────────
 * Name, colour, price, cloth, cut, sizes. No rating and no review count:
 * Nero Noren has not sold to those customers yet, and a number there would
 * be a fabricated record of people who do not exist. When there are real
 * reviews this is where they go.
 */
export function Inspector({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add, count } = useBag();
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  const ref = useFocusTrap<HTMLDivElement>(!!product);
  useEscape(!!product, onClose);

  if (!product) return null;

  const chosen = size || product.variants.find((v) => v.available)?.size || "";
  const variant = product.variants.find((v) => v.size === chosen);
  const full = count >= BAG_LIMIT;

  return (
    <div className="insp" role="dialog" aria-modal="true" aria-label={product.name}>
      <button type="button" className="insp__scrim" aria-label="Put it back" onClick={onClose} />

      <div className="insp__stage">
        <Suspense fallback={null}>
          <Hologram product={product} />
        </Suspense>
      </div>

      <div ref={ref} className="insp__card glass glass--refract" tabIndex={-1}>
        <button type="button" className="icon-btn insp__close" onClick={onClose} aria-label="Put it back">
          <Close size={18} />
        </button>

        <p className="label label--soft">{product.colour}</p>
        <h2 className="d-h2 insp__name">{product.name}</h2>
        <p className="insp__price tnum">{formatMinor(variant?.priceMinor ?? product.priceMinor, product.currency)}</p>

        <dl className="insp__spec">
          <div><dt className="label label--soft">Cloth</dt><dd>{product.fabric}</dd></div>
          <div><dt className="label label--soft">Cut</dt><dd>{product.fitNotes ?? product.bestFor}</dd></div>
        </dl>

        <p className="label label--soft insp__sizelabel">Size</p>
        <ul className="insp__sizes">
          {product.variants.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="insp__size"
                data-on={v.size === chosen || undefined}
                disabled={!v.available}
                aria-pressed={v.size === chosen}
                onClick={() => setSize(v.size)}
              >
                {v.size}
              </button>
            </li>
          ))}
        </ul>

        <div className="insp__buy">
          <div className="stepper">
            <button type="button" className="icon-btn" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={14} />
            </button>
            <span className="tnum">{qty}</span>
            <button type="button" className="icon-btn" aria-label="One more" onClick={() => setQty((q) => Math.min(9, q + 1))}>
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            className="btn btn--solid insp__add"
            disabled={!variant || full}
            onClick={() => {
              if (!variant) return;
              add({ handle: product.handle, size: chosen, quantity: qty, variantId: variant.id }, product.name);
              onClose();
            }}
          >
            {full ? "Your hands are full" : "Take it with you"}
          </button>
        </div>

        {/* A customer in a real shop can carry about ten things before they
            put something back. Saying so is friendlier than silently
            refusing the eleventh. */}
        <p className="small muted insp__carry">
          Carrying {count} of {BAG_LIMIT}
        </p>
      </div>
    </div>
  );
}
