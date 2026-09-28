"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/glass/Glass";
import { Monogram } from "@/components/brand/Monogram";
import { useBag, bagSubtotal, formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";

export function BagPage() {
  const { lines, setQuantity, remove } = useBag();
  const subtotal = bagSubtotal(lines);
  const unpriced = lines.some((l) => !l.price);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 border border-line px-6 py-28 text-center">
        <Monogram className="h-10 w-auto text-line" />
        <p className="nn-body max-w-sm text-ink-faint">
          The bag is on the counter, empty. Collection 001 is through the hall.
        </p>
        <GlassButton href="/collection" variant="solid">
          See the collection
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
      <ul className="border-t border-line">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li
              key={l.variantId}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={MOTION.spring}
              className="flex gap-5 border-b border-line py-6"
            >
              <div
                className="h-36 w-28 shrink-0 border border-line"
                style={{
                  background: l.image ? `center/cover no-repeat url(${l.image})` : "var(--bg-elev)",
                }}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/product/${l.handle}`}
                    className="font-display text-2xl font-light leading-tight text-ink transition-colors hover:text-accent"
                  >
                    {l.title}
                  </Link>
                  <p className="nn-meta mt-2 text-ink-faint">
                    {l.colour} · Size {l.size}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      aria-label={`Fewer ${l.title}`}
                      onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                      className="h-9 w-9 text-ink-soft transition-colors hover:text-ink"
                    >
                      –
                    </button>
                    <span className="nn-label w-9 text-center text-ink">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label={`More ${l.title}`}
                      onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                      className="h-9 w-9 text-ink-soft transition-colors hover:text-ink"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="nn-label text-ink">{formatMoney(l.price) ?? "—"}</span>
                    <button
                      type="button"
                      onClick={() => remove(l.variantId)}
                      className="nn-meta text-ink-faint transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="nn-glass rounded-md p-6">
          <h2 className="nn-label text-ink">Summary</h2>
          <dl className="mt-5 space-y-3 border-t border-line pt-5">
            <div className="flex justify-between">
              <dt className="nn-body text-sm text-ink-soft">Subtotal</dt>
              <dd className="font-display text-xl text-ink">{formatMoney(subtotal) ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="nn-body text-sm text-ink-soft">Delivery</dt>
              <dd className="nn-body text-sm text-ink-soft">Calculated at checkout</dd>
            </div>
          </dl>
          {unpriced && (
            <p className="nn-meta mt-5 leading-relaxed text-ink-faint">
              Some pieces have no price yet — prices live in the store and appear once it is
              connected.
            </p>
          )}
          <GlassButton href="/checkout" variant="solid" size="lg" className="mt-7 w-full">
            Checkout
          </GlassButton>
          <Link
            href="/collection"
            className="nn-label mt-4 block text-center text-ink-faint transition-colors hover:text-ink"
          >
            Keep looking
          </Link>
        </div>
      </aside>
    </div>
  );
}
