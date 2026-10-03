"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Bag as BagIcon, Close, Minus, Plus, Trash, Truck } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";
import { useEscape, useFocusTrap, useLockScroll } from "@/lib/ui/overlay";

/**
 * The bag.
 *
 * Prices are READ FROM THE CATALOGUE every time this opens — never stored on
 * the line. A bag kept on a device for three weeks must not quote a price
 * from three weeks ago, and more to the point, the number the customer sees
 * here is only a display: the server prices the order again at checkout from
 * the handles and sizes, and that figure is the one that is charged.
 */
export function BagDrawer({ catalogue }: { catalogue: Product[] }) {
  const { lines, isOpen, closeBag, setQuantity, remove, count } = useBag();

  const ref = useFocusTrap<HTMLDivElement>(isOpen);
  useEscape(isOpen, closeBag);
  useLockScroll(isOpen);

  const rows = useMemo(
    () =>
      lines
        .map((l) => {
          const product = catalogue.find((p) => p.handle === l.handle);
          if (!product) return null;
          const variant = product.variants.find((v) => v.size === l.size);
          const unit = variant?.priceMinor ?? product.priceMinor;
          return { line: l, product, unit, total: unit * l.quantity };
        })
        .filter(Boolean) as { line: (typeof lines)[number]; product: Product; unit: number; total: number }[],
    [lines, catalogue],
  );

  const subtotal = rows.reduce((a, r) => a + r.total, 0);
  const currency = rows[0]?.product.currency ?? "INR";

  if (!isOpen) return null;

  return (
    <div className="sheet" role="presentation">
      <button type="button" className="sheet__scrim" aria-label="Close bag" onClick={closeBag} />
      <div
        ref={ref}
        className="sheet__panel sheet__panel--right glass glass--light"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        tabIndex={-1}
      >
        <header className="sheet__head">
          <span className="label">Your bag {count > 0 ? `(${count})` : ""}</span>
          <span className="bagd__sub">
            <span className="label label--soft">Subtotal</span>{" "}
            <strong className="tnum">{formatMinor(subtotal, currency)}</strong>
          </span>
          <button type="button" className="icon-btn" onClick={closeBag} aria-label="Close"><Close /></button>
        </header>

        {rows.length === 0 ? (
          <div className="bagd__empty">
            <BagIcon size={34} />
            <h2 className="d-h3">Nothing in the bag yet</h2>
            <p className="lead">Collection 001 is eight pieces, cut to go with each other.</p>
            <Link href="/collection" className="btn btn--solid" onClick={closeBag}>See the collection</Link>
          </div>
        ) : (
          <>
            <ul className="bagd__list">
              {rows.map(({ line, product, total }) => (
                <li key={`${line.handle}-${line.size}`} className="bagd__row">
                  <Link href={`/product/${product.handle}`} className="bagd__img" onClick={closeBag}>
                    {product.images[0] ? (
                      <Image src={product.images[0].url} alt={product.images[0].alt} width={88} height={116} />
                    ) : (
                      <span className="bagd__swatch" style={{ background: product.hex }} />
                    )}
                  </Link>
                  <div className="bagd__body">
                    <Link href={`/product/${product.handle}`} className="bagd__name" onClick={closeBag}>
                      {product.name}
                    </Link>
                    <span className="small muted">{product.colour} · {line.size}</span>
                    <strong className="tnum bagd__price">{formatMinor(total, product.currency)}</strong>
                  </div>
                  <div className="bagd__acts">
                    <div className="stepper">
                      <button
                        type="button" className="icon-btn" aria-label="One fewer"
                        onClick={() => setQuantity(line.handle, line.size, line.quantity - 1)}
                      ><Minus size={14} /></button>
                      <span className="tnum" aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span>
                      <button
                        type="button" className="icon-btn" aria-label="One more"
                        onClick={() => setQuantity(line.handle, line.size, line.quantity + 1)}
                      ><Plus size={14} /></button>
                    </div>
                    <button
                      type="button" className="icon-btn" aria-label={`Remove ${product.name}`}
                      onClick={() => remove(line.handle, line.size)}
                    ><Trash size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="bagd__foot">
              <p className="small muted bagd__eta"><Truck size={15} /> Estimated delivery 2–4 days</p>
              <Link href="/checkout" className="btn btn--solid btn--block btn--lg" onClick={closeBag}>
                Checkout · {formatMinor(subtotal, currency)}
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
