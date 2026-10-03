"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GarmentImage } from "./GarmentImage";
import { Bag as BagIcon, Minus, Plus, Trash, Truck } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

/** The bag with room to think — the same lines as the drawer, laid out wide. */
export function BagPage({ catalogue }: { catalogue: Product[] }) {
  const { lines, setQuantity, remove, count } = useBag();

  const rows = useMemo(
    () =>
      lines
        .map((l) => {
          const product = catalogue.find((p) => p.handle === l.handle);
          if (!product) return null;
          const unit = product.variants.find((v) => v.size === l.size)?.priceMinor ?? product.priceMinor;
          return { line: l, product, unit, total: unit * l.quantity };
        })
        .filter(Boolean) as { line: (typeof lines)[number]; product: Product; unit: number; total: number }[],
    [lines, catalogue],
  );

  const subtotal = rows.reduce((a, r) => a + r.total, 0);
  const currency = rows[0]?.product.currency ?? "INR";

  if (!rows.length) {
    return (
      <div className="wrap band bagp__empty">
        <BagIcon size={40} />
        <h1 className="d-h2">Your bag is empty</h1>
        <p className="lead">Collection 001 is The Foundations — eight pieces, cut to go with each other.</p>
        <Link href="/collection" className="btn btn--solid btn--lg">See the collection</Link>
      </div>
    );
  }

  return (
    <div className="wrap band bagp">
      <div className="bagp__list">
        <h1 className="d-h2 bagp__h">Your bag <span className="muted tnum">({count})</span></h1>
        <ul>
          {rows.map(({ line, product, unit, total }) => (
            <li key={`${line.handle}-${line.size}`} className="bagp__row">
              <Link href={`/product/${product.handle}`} className="bagp__img">
                <GarmentImage product={product} sizes="120px" />
              </Link>
              <div className="bagp__body">
                <Link href={`/product/${product.handle}`} className="bagp__name d-h3">{product.name}</Link>
                <p className="small muted">{product.colour} · size {line.size}</p>
                <p className="small muted">{formatMinor(unit, product.currency)} each</p>
                <div className="bagp__ctl">
                  <div className="stepper">
                    <button type="button" className="icon-btn" aria-label="One fewer"
                      onClick={() => setQuantity(line.handle, line.size, line.quantity - 1)}><Minus size={14} /></button>
                    <span className="tnum">{line.quantity}</span>
                    <button type="button" className="icon-btn" aria-label="One more"
                      onClick={() => setQuantity(line.handle, line.size, line.quantity + 1)}><Plus size={14} /></button>
                  </div>
                  <button type="button" className="icon-btn" aria-label={`Remove ${product.name}`}
                    onClick={() => remove(line.handle, line.size)}><Trash size={16} /></button>
                </div>
              </div>
              <strong className="tnum bagp__total">{formatMinor(total, product.currency)}</strong>
            </li>
          ))}
        </ul>
      </div>

      <aside className="bagp__sum glass glass--light">
        <h2 className="label label--soft">Summary</h2>
        <dl className="bagp__dl">
          <div><dt>Subtotal</dt><dd className="tnum">{formatMinor(subtotal, currency)}</dd></div>
          <div><dt>Delivery</dt><dd>Free</dd></div>
        </dl>
        <p className="bagp__grand">
          <span className="label label--soft">Total</span>
          <strong className="tnum d-h3">{formatMinor(subtotal, currency)}</strong>
        </p>
        <p className="small muted bagp__note">
          Inclusive of all taxes. The final amount is priced again on our server at checkout.
        </p>
        <Link href="/checkout" className="btn btn--solid btn--block btn--lg">Checkout</Link>
        <p className="small muted bagp__eta"><Truck size={15} /> Estimated delivery 2–4 days</p>
      </aside>
    </div>
  );
}
