import type { Product } from "@/lib/catalog/types";
import { StylistChat } from "./StylistChat";

/** The stylist as it appears on the home page, beside a short introduction. */
export function StylistTeaser({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div>
        <p className="nn-eyebrow">The stylist</p>
        <h2 className="mt-3 text-[var(--text-step-2)]">Your NN stylist</h2>
        <p className="mt-5 text-[var(--ink-soft)]">
          Ask about an occasion, a pairing, a fabric or a size. The stylist only knows
          Collection 001, which means it will never send you after something we do not make.
        </p>
        <p className="mt-4 text-[var(--text-step--1)] text-[var(--ink-faint)]">
          It will not invent a discount, promise a delivery date, or guess your size with
          confidence it has not earned. For size, it will send you to the trial room.
        </p>
      </div>
      <StylistChat products={products} compact />
    </div>
  );
}
