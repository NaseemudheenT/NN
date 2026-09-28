"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useBag, bagCount, bagSubtotal, formatMoney } from "@/lib/bag";
import { GlassButton } from "@/components/ui/glass/Glass";
import { Monogram } from "@/components/brand/Monogram";
import { MOTION } from "@/lib/tokens";

export function BagSheet() {
  const { lines, open, setOpen, setQuantity, remove } = useBag();
  const count = bagCount(lines);
  const subtotal = bagSubtotal(lines);
  const unpriced = lines.some((l) => !l.price);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Your bag">
          <motion.button
            type="button"
            aria-label="Close bag"
            className="absolute inset-0 bg-nnblack/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.base }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="nn-glass absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col rounded-none border-y-0 border-r-0"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={MOTION.spring}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="nn-meta text-ink-faint">Your bag</p>
                <p className="font-display text-2xl font-light text-ink">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="nn-label text-ink-faint transition-colors hover:text-ink"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                  <Monogram className="h-9 w-auto text-line" />
                  <p className="nn-body text-sm text-ink-faint">
                    Nothing here yet. The bag sits on the counter, waiting.
                  </p>
                  <GlassButton href="/collection" variant="quiet" size="sm" onClick={() => setOpen(false)}>
                    See Collection 001
                  </GlassButton>
                </div>
              ) : (
                <ul className="space-y-5">
                  {lines.map((l) => (
                    <motion.li
                      key={l.variantId}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={MOTION.spring}
                      className="flex gap-4 border-b border-line-soft pb-5"
                    >
                      <div
                        className="h-24 w-[4.5rem] shrink-0 border border-line"
                        style={{
                          background: l.image
                            ? `center/cover no-repeat url(${l.image})`
                            : "var(--bg-elev)",
                        }}
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/product/${l.handle}`}
                            onClick={() => setOpen(false)}
                            className="font-display text-lg leading-tight text-ink hover:text-accent"
                          >
                            {l.title}
                          </Link>
                          <p className="nn-meta mt-1 text-ink-faint">
                            {l.colour} · Size {l.size}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-line">
                            <button
                              type="button"
                              aria-label="Fewer"
                              onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                              className="h-7 w-7 text-ink-soft transition-colors hover:text-ink"
                            >
                              –
                            </button>
                            <span className="nn-label w-7 text-center text-ink">{l.quantity}</span>
                            <button
                              type="button"
                              aria-label="More"
                              onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                              className="h-7 w-7 text-ink-soft transition-colors hover:text-ink"
                            >
                              +
                            </button>
                          </div>
                          <span className="nn-label text-ink">
                            {formatMoney(l.price) ?? "—"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.variantId)}
                        aria-label={`Remove ${l.title}`}
                        className="nn-meta self-start text-ink-faint transition-colors hover:text-ink"
                      >
                        Remove
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-line px-6 py-5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="nn-label text-ink-soft">Subtotal</span>
                  <span className="font-display text-2xl text-ink">
                    {formatMoney(subtotal) ?? "—"}
                  </span>
                </div>
                {unpriced && (
                  <p className="nn-meta mb-3 leading-relaxed text-ink-faint">
                    Prices are held in the store and appear once the catalogue is connected.
                  </p>
                )}
                <p className="nn-meta mb-4 text-ink-faint">
                  Delivery and any taxes are calculated at checkout.
                </p>
                <GlassButton
                  href="/checkout"
                  variant="solid"
                  size="lg"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Checkout
                </GlassButton>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Quiet confirmation after an add — no flying cart. */
export function AddConfirmation() {
  const justAdded = useBag((s) => s.justAdded);
  const lines = useBag((s) => s.lines);
  const setOpen = useBag((s) => s.setOpen);
  const line = lines.find((l) => l.variantId === justAdded);

  return (
    <AnimatePresence>
      {line && (
        <motion.div
          className="nn-glass fixed bottom-24 left-1/2 z-[65] flex -translate-x-1/2 items-center gap-4 rounded-full px-5 py-3 md:bottom-8 md:left-auto md:right-6 md:translate-x-0"
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, filter: "blur(8px)" }}
          transition={MOTION.spring}
          role="status"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="nn-label text-ink">
            {line.title} · {line.size} added
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="nn-label text-accent underline-offset-4 hover:underline"
          >
            Open bag
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
