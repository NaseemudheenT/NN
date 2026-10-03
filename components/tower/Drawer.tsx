"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { GarmentImage } from "@/components/shop/GarmentImage";
import { Close, Minus, Plus } from "@/components/ui/icons";
import { formatMinor } from "@/lib/money";
import { useBag } from "@/lib/bag/BagProvider";
import { useEscape, useFocusTrap, useLockScroll } from "@/lib/ui/overlay";
import type { Product } from "@/lib/catalog/types";

/**
 * A drawer off a floor.
 *
 * Every functional task in NN Tower happens in one of these rather than in
 * the building: choosing a size, reading a fabric, paying. That split is
 * the whole architecture — the building is for atmosphere and orientation,
 * and crisp 2D type on glass is for anything a customer has to READ or
 * DECIDE. Asking someone to pick a size off a wall in a perspective
 * drawing would be beautiful and unusable.
 */
export function Drawer({
  product,
  products,
  title,
  onClose,
}: {
  /** One piece, opened from a hotspot. */
  product?: Product | null;
  /** Or a set of them, for a whole floor. */
  products?: Product[];
  title?: string;
  onClose: () => void;
}) {
  const open = !!product || !!products?.length;
  const ref = useFocusTrap<HTMLDivElement>(open);
  useEscape(open, onClose);
  useLockScroll(open);

  if (!open) return null;

  return (
    <div className="dwr" role="presentation">
      <motion.button
        type="button"
        className="dwr__scrim"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        ref={ref}
        className="dwr__panel glass glass--refract"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? product?.name ?? "Collection"}
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
      >
        <header className="dwr__head">
          <p className="label">{title ?? (product ? product.colour : "The collection")}</p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Close size={18} />
          </button>
        </header>

        <div className="dwr__body">
          {product ? <One product={product} onDone={onClose} /> : null}
          {products?.length ? (
            <ul className="dwr__list">
              {products.map((p) => (
                <li key={p.handle}>
                  <Link href={`/product/${p.handle}`} className="dwr__row" onClick={onClose}>
                    <span className="dwr__thumb"><GarmentImage product={p} sizes="72px" /></span>
                    <span className="dwr__meta">
                      <span className="dwr__name">{p.name}</span>
                      <span className="small muted">{p.colour}</span>
                    </span>
                    <span className="tnum dwr__price">{formatMinor(p.priceMinor, p.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

/** One piece: the real thing, with a real size and a real price. */
function One({ product, onDone }: { product: Product; onDone: () => void }) {
  const { add } = useBag();
  const [size, setSize] = useState(() => product.variants.find((v) => v.available)?.size ?? "");
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((v) => v.size === size);

  return (
    <div className="dwr__one">
      <span className="dwr__hero"><GarmentImage product={product} priority sizes="(max-width: 700px) 100vw, 24rem" /></span>

      <h2 className="d-h2 dwr__title">{product.name}</h2>
      <p className="dwr__cost tnum">
        {formatMinor(variant?.priceMinor ?? product.priceMinor, product.currency)}
      </p>
      <p className="lead dwr__desc">{product.description}</p>

      <dl className="dwr__spec">
        <div><dt className="label label--soft">Cloth</dt><dd>{product.fabric}</dd></div>
        {product.fitNotes ? <div><dt className="label label--soft">Cut</dt><dd>{product.fitNotes}</dd></div> : null}
      </dl>

      <p className="label label--soft dwr__sizelabel">Size</p>
      <ul className="dwr__sizes">
        {product.variants.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              className="dwr__size"
              data-on={v.size === size || undefined}
              disabled={!v.available}
              aria-pressed={v.size === size}
              onClick={() => setSize(v.size)}
            >
              {v.size}
            </button>
          </li>
        ))}
      </ul>

      <div className="dwr__buy">
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
          className="btn btn--solid dwr__add"
          disabled={!variant}
          onClick={() => {
            if (!variant) return;
            add({ handle: product.handle, size, quantity: qty, variantId: variant.id }, product.name);
            onDone();
          }}
        >
          {variant ? "Add to bag" : "Choose a size"}
        </button>
      </div>

      <Link href={`/product/${product.handle}`} className="ul-grow label dwr__more" onClick={onDone}>
        Everything about this piece
      </Link>
    </div>
  );
}
