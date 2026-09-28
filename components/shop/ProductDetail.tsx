"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass/Glass";
import { ProductCard } from "./ProductCard";
import { Reveal, RevealLines } from "@/components/motion/Reveal";
import { useBag, formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Inspection: the garment, up close                                   */
/* ------------------------------------------------------------------ */

function Inspector({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const images = product.images;
  const current = images[index];

  return (
    <div className="lg:sticky lg:top-28">
      <div
        className="group relative aspect-4/5 w-full overflow-hidden border border-line"
        style={{
          background: current
            ? undefined
            : `linear-gradient(168deg, ${product.swatch} 0%, color-mix(in srgb, ${product.swatch} 55%, #000) 100%)`,
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(
            `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
          );
        }}
        onPointerLeave={() => setZoom(false)}
      >
        {current ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={current.url}
              src={current.url}
              alt={current.alt}
              className="h-full w-full object-cover"
              style={{ transformOrigin: origin }}
              initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)", scale: zoom ? 1.9 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: MOTION.ease }}
              onClick={() => setZoom((z) => !z)}
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
            <span className="nn-meta text-ivory/70">Photography to come</span>
            <p className="nn-body max-w-xs text-[0.8rem] text-ivory/60">
              This piece is shown in its colourway. The studio images live in the store and appear
              here once it is connected.
            </p>
          </div>
        )}

        {current && (
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            className="nn-glass nn-label absolute bottom-4 right-4 rounded-full px-4 py-2.5 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
          >
            {zoom ? "Step back" : "Look closer"}
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`h-20 w-16 border transition-colors duration-300 ${
                i === index ? "border-accent" : "border-line hover:border-ink/40"
              }`}
              style={{ background: `center/cover no-repeat url(${img.url})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const add = useBag((s) => s.add);

  const variantFor = (s: string) => product.variants.find((v) => v.size === s);
  const soldOut = (s: string) => {
    const v = variantFor(s);
    return v ? !v.available : false;
  };

  function addToBag() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    const variant = variantFor(size);
    add({
      variantId: variant?.id ?? `${product.handle}:${size}`,
      handle: product.handle,
      title: product.title,
      colour: product.colour,
      size,
      quantity: 1,
      price: variant?.price ?? product.price,
      image: product.images[0]?.url ?? null,
    });
  }

  return (
    <>
      <article className="relative z-10 px-5 pt-28 sm:px-8 md:pt-40">
        <div className="mx-auto max-w-[84rem]">
          <nav aria-label="Breadcrumb" className="nn-meta mb-8 text-ink-faint">
            <Link href="/collection" className="transition-colors hover:text-ink">
              Collection 001
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{product.title}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
            <Inspector product={product} />

            <div>
              <p className="nn-meta text-ink-faint">{product.colour}</p>
              <h1 className="nn-display mt-4 text-[clamp(2.2rem,5.5vw,3.6rem)] text-ink">
                <RevealLines lines={[product.title]} />
              </h1>

              <p className="mt-5 font-display text-2xl font-light text-ink">
                {formatMoney(product.price) ?? (
                  <span className="text-ink-faint">Price held in the store</span>
                )}
              </p>

              <p className="nn-body mt-7 text-[0.95rem] text-ink-soft">{product.description}</p>

              {/* sizes */}
              <div className="mt-10">
                <div className="flex items-baseline justify-between">
                  <h2 className="nn-label text-ink">Size</h2>
                  <Link href="/sizing" className="nn-meta text-ink-faint underline-offset-4 hover:text-ink hover:underline">
                    Size guide
                  </Link>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const out = soldOut(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={out}
                        onClick={() => {
                          setSize(s);
                          setError(null);
                        }}
                        aria-pressed={size === s}
                        className={`nn-label min-w-14 border px-4 py-3 transition-all duration-300 [transition-timing-function:var(--ease-out)] ${
                          size === s
                            ? "border-ink bg-ink text-bg"
                            : out
                              ? "cursor-not-allowed border-line text-ink-faint line-through"
                              : "border-line text-ink-soft hover:border-ink hover:text-ink"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="nn-meta mt-3 text-accent"
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <GlassButton variant="solid" size="lg" onClick={addToBag}>
                  Add to bag
                </GlassButton>
                <GlassButton
                  href={`/trial-room?piece=${product.handle}`}
                  variant="glass"
                  size="lg"
                >
                  Try it in the fitting room
                </GlassButton>
              </div>

              {/* the garment's facts */}
              <dl className="mt-12 border-t border-line">
                {[
                  ["Cloth", product.fabric],
                  ["Fit", product.fit],
                  ["Colourway", product.colour],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4">
                      <dt className="nn-meta text-ink-faint">{k}</dt>
                      <dd className="nn-body text-[0.875rem] text-ink">{v}</dd>
                    </div>
                  ))}
                {product.care.length > 0 && (
                  <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4">
                    <dt className="nn-meta text-ink-faint">Care</dt>
                    <dd>
                      <ul className="space-y-1.5">
                        {product.care.map((c) => (
                          <li key={c} className="nn-body text-[0.875rem] text-ink">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4">
                  <dt className="nn-meta text-ink-faint">Delivery</dt>
                  <dd className="nn-body text-[0.875rem] text-ink">
                    <Link href="/delivery" className="underline-offset-4 hover:underline">
                      Delivery and returns
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="relative z-10 mt-28 border-t border-line px-5 py-20 sm:px-8 md:mt-40">
          <div className="mx-auto max-w-[84rem]">
            <Reveal>
              <p className="nn-meta text-ink-faint">Worn with</p>
              <h2 className="nn-display mt-3 text-[clamp(1.8rem,4vw,2.6rem)] text-ink">
                The rest of the floor
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.id} as="li" delay={i * 0.05} className="bg-bg">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
