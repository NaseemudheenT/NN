"use client";

import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "@/components/shop/GarmentArt";

export interface PricedLine {
  handle: string;
  size: string;
  quantity: number;
  product: Product;
  unitMinor: number;
  totalMinor: number;
}

/** Free delivery over ₹3,500; ₹120 below it. A real rule, stated plainly. */
export const FREE_DELIVERY_OVER_MINOR = 350000;
export const DELIVERY_MINOR = 12000;

export function deliveryFor(subtotalMinor: number): number {
  if (subtotalMinor === 0) return 0;
  return subtotalMinor >= FREE_DELIVERY_OVER_MINOR ? 0 : DELIVERY_MINOR;
}

export function OrderSummary({
  lines,
  editable = false,
}: {
  lines: PricedLine[];
  editable?: boolean;
}) {
  const subtotalMinor = lines.reduce((a, l) => a + l.totalMinor, 0);
  const currency = lines[0]?.product.currency ?? "INR";
  const deliveryMinor = deliveryFor(subtotalMinor);
  const totalMinor = subtotalMinor + deliveryMinor;

  return (
    <div className="border p-6" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      <h2 className="text-[var(--text-step-1)]">Your order</h2>

      <ul className="m-0 mt-6 flex list-none flex-col gap-5 p-0">
        {lines.map((l) => (
          <li key={`${l.handle}-${l.size}`} className="flex gap-4">
            <span
              className="grid h-20 w-16 shrink-0 place-items-center"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              <GarmentArt product={l.product} className="w-full" />
            </span>
            <span className="min-w-0 flex-1">
              {editable ? (
                <Link
                  href={`/product/${l.handle}`}
                  className="block text-[var(--text-step--1)] text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                >
                  {l.product.name}
                </Link>
              ) : (
                <span className="block text-[var(--text-step--1)]">{l.product.name}</span>
              )}
              <span className="block text-[0.72rem] text-[var(--ink-faint)]">
                {l.product.colour} · {l.product.type === "shirt" ? "Size" : "Waist"} {l.size} ·{" "}
                {l.quantity} {l.quantity === 1 ? "piece" : "pieces"}
              </span>
            </span>
            <span className="nn-tabular shrink-0 text-[var(--text-step--1)]">
              {formatMinor(l.totalMinor, l.product.currency)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-7 flex flex-col gap-2 border-t pt-5 text-[var(--text-step--1)]">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ink-faint)]">Subtotal</dt>
          <dd className="nn-tabular m-0">{formatMinor(subtotalMinor, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ink-faint)]">Delivery</dt>
          <dd className="nn-tabular m-0">
            {deliveryMinor === 0 ? "Free" : formatMinor(deliveryMinor, currency)}
          </dd>
        </div>
        {deliveryMinor > 0 ? (
          <p className="m-0 text-[0.68rem] text-[var(--ink-faint)]">
            Delivery is free over {formatMinor(FREE_DELIVERY_OVER_MINOR, currency)}.
          </p>
        ) : null}
        <div className="mt-2 flex justify-between gap-4 border-t pt-3">
          <dt className="nn-eyebrow">Total</dt>
          <dd className="nn-tabular m-0 text-[var(--text-step-1)]">
            {formatMinor(totalMinor, currency)}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-[0.68rem] text-[var(--ink-faint)]">
        Includes GST. Free size exchanges within 7 days of delivery. Nothing is charged until you
        complete the payment, and a cancelled payment leaves your bag as it is.
      </p>
    </div>
  );
}
