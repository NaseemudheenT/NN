"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";
import type { Product } from "@/lib/types";

/**
 * A display, not a tile. The garment lifts very slightly toward the light
 * on approach, and its metadata arrives underneath.
 */
export function ProductCard({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const image = product.images[0];

  return (
    <motion.article
      className="group relative bg-bg"
      whileHover={reduced ? undefined : { y: -5 }}
      transition={MOTION.springSoft}
    >
      <Link
        ref={ref}
        href={`/product/${product.handle}`}
        className="flex h-full flex-col p-5 sm:p-6"
        onPointerMove={(e) => {
          const el = ref.current;
          if (!el || reduced) return;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <div
          className={`relative w-full overflow-hidden ${large ? "aspect-4/5" : "aspect-3/4"}`}
          style={{
            background: image
              ? `center/cover no-repeat url(${image.url})`
              : `linear-gradient(168deg, ${product.swatch} 0%, color-mix(in srgb, ${product.swatch} 58%, #000) 100%)`,
          }}
        >
          {/* the light that follows the pointer across the cloth */}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(14rem 14rem at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.22), transparent 62%)",
            }}
          />
          {!image && (
            <span className="nn-meta absolute bottom-3 left-3 rounded-sm bg-nnblack/35 px-2 py-1 text-[0.5rem] text-ivory backdrop-blur-sm">
              Photography to come
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className={`font-display font-light leading-tight text-ink ${
                large ? "text-[1.8rem]" : "text-2xl"
              }`}
            >
              {product.title}
            </h3>
            <span className="nn-label shrink-0 text-ink-soft">
              {formatMoney(product.price) ?? <span className="text-ink-faint">In store</span>}
            </span>
          </div>

          <p className="nn-meta mt-2 text-ink-faint">
            {product.colour}
            {product.fabric ? ` · ${product.fabric}` : ""}
          </p>

          {/* metadata arrives on approach, and stays available to keyboards */}
          <p className="nn-body mt-3 max-h-0 overflow-hidden text-[0.8rem] text-ink-soft opacity-0 transition-all duration-500 [transition-timing-function:var(--ease-out)] group-focus-within:max-h-24 group-focus-within:opacity-100 group-hover:max-h-24 group-hover:opacity-100">
            {product.fit}
          </p>

          <span className="nn-label mt-4 inline-flex items-center gap-2 text-ink">
            View
            <span className="inline-block h-px w-5 bg-accent transition-[width] duration-500 [transition-timing-function:var(--ease-out)] group-hover:w-9" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
