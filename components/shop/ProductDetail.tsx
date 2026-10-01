"use client";

/**
 * A single piece, presented.
 *
 * The garment stands on a lit plinth on the left; its identity, price and
 * actions sit on the right. That is the layout of a showroom display, and it
 * is also the layout a customer needs: the thing, then the decision.
 *
 * The piece turns. That is not decoration — turning it is how the woven NN
 * label at the back neck becomes visible, and that label is one of the details
 * the brand board is built on. A real back view, on a real transform, not a
 * crossfade between two pictures.
 *
 * The product wins over the environment on this page. Whatever the showroom is
 * doing, the garment is the brightest thing on screen.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "./GarmentArt";
import { SizePicker } from "./SizePicker";
import { useBag } from "./BagProvider";
import { LogoMark } from "@/components/brand/LogoMark";
import { track } from "@/components/layout/ConsentBanner";
import { GlassButton, GlassPill } from "@/components/ui/glass/GlassButton";
import { SPRING } from "@/lib/motion";

export function ProductDetail({
  product,
  source,
}: {
  product: Product;
  source: "shopify" | "seed";
}) {
  const [size, setSize] = useState<string | null>(null);
  const [turned, setTurned] = useState(false);
  const { add, openBag } = useBag();

  const variant = product.variants.find((v) => v.size === size);
  const inStock = product.variants.filter((v) => v.available);
  const soldOut = inStock.length === 0;

  return (
    <div className="nn-product">
      {/* ═══ the display ═══ */}
      <div className="nn-product__display">
        <div className="nn-product__plinth">
          <span className="nn-product__light" aria-hidden="true" />

          <motion.div
            className="nn-product__turn"
            animate={{ rotateY: turned ? 180 : 0 }}
            transition={SPRING.heavy}
          >
            {/* front */}
            <div className="nn-product__face">
              <GarmentArt product={product} className="w-full" />
            </div>

            {/* back, with the woven label at the neck */}
            <div className="nn-product__face nn-product__face--back">
              <div className="relative w-full">
                <GarmentArt
                  product={{
                    ...product,
                    style: product.type === "shirt" ? "poplin" : product.style,
                  }}
                  className="w-full"
                />
                <span className="nn-product__tag">
                  <LogoMark size={11} ring={false} sheen="none" title={null} />
                  <span>Nero Noren</span>
                </span>
              </div>
            </div>
          </motion.div>

          <span className="nn-product__shadow" aria-hidden="true" />
        </div>

        <div className="nn-product__turnbar">
          <GlassButton
            tone="quiet"
            size="sm"
            onClick={() => setTurned((t) => !t)}
            aria-pressed={turned}
            magnetism={3}
          >
            {turned ? "Show the front" : "Turn it around"}
          </GlassButton>
          <p className="nn-product__hint">
            {turned
              ? "The woven NN label, stitched across the inside of the back neck."
              : "Turn it to see the back-neck label."}
          </p>
        </div>
      </div>

      {/* ═══ the identity ═══ */}
      <div className="nn-product__identity">
        <p className="nn-label nn-label--metal">{product.colour}</p>
        <h1 className="nn-product__name">{product.name}</h1>

        <div className="nn-product__price">
          <span className="nn-tabular">
            {formatMinor(variant?.priceMinor ?? product.priceMinor, product.currency)}
          </span>
          {soldOut ? (
            <GlassPill>Sold out</GlassPill>
          ) : (
            <GlassPill>{inStock.length} sizes in stock</GlassPill>
          )}
        </div>

        <p className="nn-product__description">{product.description}</p>

        <div className="nn-product__sizes">
          <SizePicker product={product} value={size} onChange={setSize} />
        </div>

        <div className="nn-product__actions">
          <GlassButton
            tone="metal"
            size="lg"
            block
            disabled={soldOut || !size}
            onClick={() => {
              if (!size) return;
              add(
                { handle: product.handle, size, quantity: 1, variantId: variant?.id },
                `${product.name}, ${product.colour}, size ${size},`,
              );
              track("add_to_bag", { handle: product.handle, size });
              openBag();
            }}
          >
            {soldOut ? "Sold out" : size ? "Add to bag" : "Choose a size"}
          </GlassButton>

          <Link href={`/trial-room?product=${product.handle}`} className="block">
            <GlassButton tone="quiet" size="lg" block>
              Try it on
            </GlassButton>
          </Link>
        </div>

        {/* ═══ the specification ═══ */}
        <dl className="nn-product__spec">
          {[
            { term: "Fabric", detail: product.fabric },
            { term: "How it fits", detail: product.fitNotes },
            { term: "Best for", detail: product.bestFor },
            { term: "Care", detail: product.care },
          ]
            .filter((row) => row.detail)
            .map((row) => (
              <div key={row.term} className="nn-product__specrow">
                <dt className="nn-label">{row.term}</dt>
                <dd>{row.detail}</dd>
              </div>
            ))}

          <div className="nn-product__specrow">
            <dt className="nn-label">Details</dt>
            <dd>
              Woven NN label at the back neck. NN engraved buttons.{" "}
              {product.type === "shirt"
                ? "Single-needle side seams and a split yoke."
                : "A pressed crease that holds, and a clean 17 cm hem."}
            </dd>
          </div>

          <div className="nn-product__specrow">
            <dt className="nn-label">Delivery</dt>
            <dd>Delivered across India. Free size exchanges within 7 days.</dd>
          </div>
        </dl>

        {source === "seed" ? (
          <p className="nn-product__note">
            This price comes from the Collection 001 reference catalogue. Connect Shopify to serve
            live prices and stock.
          </p>
        ) : null}
      </div>
    </div>
  );
}
