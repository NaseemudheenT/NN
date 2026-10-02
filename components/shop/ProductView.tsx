"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GarmentImage } from "./GarmentImage";
import { Minus, Plus, Ruler, Shield, Truck } from "@/components/ui/icons";
import { formatMinor } from "@/lib/money";
import { useBag } from "@/lib/bag/BagProvider";
import type { Product } from "@/lib/catalog/types";

/**
 * A piece, up close.
 *
 * ── on what is NOT here ─────────────────────────────────────────────
 * There is no star rating and no review count. The approved layout shows
 * them, and they are the one thing on it I will not build: Nero Noren has
 * not sold to those customers yet, so any number in that row would be a
 * fabricated record of people who do not exist. The space goes to things
 * that are true instead — the cloth, the cut, where the size sits. When
 * there are real reviews this is where they belong, and the row is ready
 * for them.
 *
 * Size is chosen before the piece can be added, deliberately. A bag line
 * without a size is a line that cannot be fulfilled, and the place to find
 * that out is here, not at the warehouse.
 */
export function ProductView({ product, siblings }: { product: Product; siblings: Product[] }) {
  const router = useRouter();
  const { add, openBag } = useBag();
  const [size, setSize] = useState(() => product.variants.find((v) => v.available)?.size ?? "");
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);

  const variant = product.variants.find((v) => v.size === size);
  const price = variant?.priceMinor ?? product.priceMinor;
  const colours = [product, ...siblings];
  const shots = product.images.length ? product.images : [null, null, null, null];

  const addToBag = () => {
    if (!variant) return;
    add({ handle: product.handle, size, quantity: qty, variantId: variant.id }, product.name);
  };

  return (
    <div className="pdp wrap">
      {/* ── the pictures ─────────────────────────────────────── */}
      <div className="pdp__gallery">
        <ul className="pdp__thumbs" aria-label="Views">
          {shots.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                className="pdp__thumb"
                data-on={i === shot || undefined}
                onClick={() => setShot(i)}
                aria-label={`View ${i + 1}`}
                aria-pressed={i === shot}
              >
                <GarmentImage product={product} index={i} sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
        <div className="pdp__main">
          <GarmentImage product={product} index={shot} priority sizes="(max-width: 900px) 100vw, 44vw" />
        </div>
      </div>

      {/* ── what it is ───────────────────────────────────────── */}
      <div className="pdp__detail">
        <h1 className="d-h2 pdp__name">{product.name}</h1>
        <p className="pdp__colour muted">{product.colour}</p>
        <p className="pdp__price tnum">{formatMinor(price, product.currency)}</p>

        <p className="lead pdp__desc">{product.description}</p>

        <dl className="pdp__spec">
          <div><dt className="label label--soft">Fabric</dt><dd>{product.fabric}</dd></div>
          <div><dt className="label label--soft">Best for</dt><dd>{product.bestFor}</dd></div>
          {product.fitNotes ? <div><dt className="label label--soft">Fit</dt><dd>{product.fitNotes}</dd></div> : null}
        </dl>

        {colours.length > 1 ? (
          <div className="pdp__field">
            <p className="label label--soft">Colour · <span className="pdp__field-value">{product.colour}</span></p>
            <ul className="pdp__colours">
              {colours.map((c) => (
                <li key={c.handle}>
                  <Link
                    href={`/product/${c.handle}`}
                    className="pdp__swatch"
                    style={{ background: c.hex }}
                    data-on={c.handle === product.handle || undefined}
                    aria-label={c.colour}
                    title={c.colour}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="pdp__field">
          <div className="pdp__field-head">
            <p className="label label--soft">
              Size{size ? <> · <span className="pdp__field-value">{size}</span></> : null}
            </p>
            <Link href="/sizing" className="ul-grow label pdp__guide"><Ruler size={14} /> Size guide</Link>
          </div>
          <ul className="pdp__sizes">
            {product.variants.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  className="pdp__size"
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
          <p className="small muted pdp__fitline">
            Not sure? The <Link href={`/trial-room?piece=${product.handle}`} className="ul-grow">trial room</Link>{" "}
            works it out from four measurements.
          </p>
        </div>

        <div className="pdp__buy">
          <div className="stepper stepper--lg">
            <button type="button" className="icon-btn" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={15} />
            </button>
            <span className="tnum" aria-label={`Quantity ${qty}`}>{qty}</span>
            <button type="button" className="icon-btn" aria-label="One more" onClick={() => setQty((q) => Math.min(9, q + 1))}>
              <Plus size={15} />
            </button>
          </div>
          <button type="button" className="btn btn--solid btn--lg pdp__add" onClick={addToBag} disabled={!variant}>
            {variant ? "Add to bag" : "Choose a size"}
          </button>
        </div>

        <button
          type="button"
          className="btn btn--line btn--lg btn--block"
          disabled={!variant}
          onClick={() => { addToBag(); router.push("/checkout"); }}
        >
          Buy now
        </button>

        <ul className="pdp__assure">
          <li><Truck size={16} /> Delivery in 2–4 days</li>
          <li><Shield size={16} /> {product.care.split(".")[0]}</li>
          <li><Ruler size={16} /> Free size exchange</li>
        </ul>

        <button type="button" className="pdp__openbag ul-grow label" onClick={openBag}>
          View your bag
        </button>
      </div>
    </div>
  );
}
