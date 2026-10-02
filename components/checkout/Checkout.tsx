"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GarmentImage } from "@/components/shop/GarmentImage";
import { Shield, Truck } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { formatMinor } from "@/lib/money";
import { estimateDelivery, validateMobile, validatePin } from "@/lib/india";
import { runCheckout, type CheckoutContact, type CheckoutStatus } from "@/lib/checkout-flow";
import type { Product } from "@/lib/catalog/types";

const STEPS = ["Shipping", "Payment", "Confirmation"] as const;

const EMPTY: CheckoutContact = {
  name: "", email: "", phone: "", address1: "", address2: "", city: "", state: "", pin: "",
};

/**
 * Checkout.
 *
 * Three steps, and the money rules are all in lib/checkout-flow.ts where
 * they belong — this component collects an address, shows a total, and calls
 * it. Two things it deliberately does NOT do:
 *
 *   · it never sends an amount. The server prices the bag from handles and
 *     sizes, every time. The figure on this screen is a quotation.
 *   · it never clears the bag on Razorpay's callback. A browser can be made
 *     to say a payment succeeded; only the server's signature check settles
 *     it, and the bag is cleared after that or not at all.
 *
 * The showroom does not follow the customer in here. Paying is the one
 * moment on this site where atmosphere is a liability and clarity is the
 * entire design.
 */
export function Checkout({ catalogue, razorpayLive }: { catalogue: Product[]; razorpayLive: boolean }) {
  const { lines, clear } = useBag();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<CheckoutContact>(EMPTY);
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      lines
        .map((l) => {
          const product = catalogue.find((p) => p.handle === l.handle);
          if (!product) return null;
          const variant = product.variants.find((v) => v.size === l.size);
          const unit = variant?.priceMinor ?? product.priceMinor;
          return { line: l, product, variantId: variant?.id ?? "", total: unit * l.quantity };
        })
        .filter(Boolean) as { line: (typeof lines)[number]; product: Product; variantId: string; total: number }[],
    [lines, catalogue],
  );

  const subtotal = rows.reduce((a, r) => a + r.total, 0);
  const currency = rows[0]?.product.currency ?? "INR";
  const pieces = rows.reduce((a, r) => a + r.line.quantity, 0);

  const pinCheck = contact.pin ? validatePin(contact.pin) : { ok: false };
  const phoneCheck = contact.phone ? validateMobile(contact.phone) : { ok: false };
  const eta = pinCheck.ok ? estimateDelivery(contact.pin) : null;

  const addressReady =
    contact.name.trim().length > 1 &&
    /.+@.+\..+/.test(contact.email) &&
    phoneCheck.ok &&
    contact.address1.trim().length > 3 &&
    contact.city.trim().length > 1 &&
    contact.state.trim().length > 1 &&
    pinCheck.ok;

  const pay = async () => {
    setError("");
    const result = await runCheckout({
      lines: rows.map((r) => ({
        handle: r.line.handle,
        variantId: r.variantId,
        size: r.line.size,
        quantity: r.line.quantity,
      })),
      contact,
      pieces,
      onStatus: setStatus,
    });

    if (result.ok && result.redirect) {
      clear(); /* only now — the server has verified the signature */
      window.location.href = result.redirect;
      return;
    }
    if (result.cancelled) {
      setStatus("idle");
      return;
    }
    setError(result.message ?? "The payment did not go through. Your bag is untouched.");
  };

  if (!rows.length) {
    return (
      <div className="wrap band ckt__empty">
        <h1 className="d-h2">Nothing to pay for yet</h1>
        <p className="lead">Your bag is empty.</p>
        <Link href="/collection" className="btn btn--solid btn--lg">See the collection</Link>
      </div>
    );
  }

  return (
    <div className="wrap band ckt">
      <div className="ckt__main">
        <h1 className="label ckt__h">Checkout</h1>

        <ol className="ckt__steps">
          {STEPS.map((s, i) => (
            <li key={s} data-on={i === step || undefined} data-done={i < step || undefined}>
              <span className="ckt__num tnum">{i + 1}</span>
              <span className="label">{s}</span>
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <section className="ckt__card glass glass--light" aria-label="Shipping address">
            <h2 className="label label--soft">Shipping address</h2>
            <div className="ckt__fields">
              <Field label="Full name" value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} autoComplete="name" wide />
              <Field label="Email" type="email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} autoComplete="email" />
              <Field
                label="Mobile" type="tel" value={contact.phone}
                onChange={(v) => setContact({ ...contact, phone: v })} autoComplete="tel"
                hint={contact.phone && !phoneCheck.ok ? phoneCheck.message : undefined}
              />
              <Field label="Address" value={contact.address1} onChange={(v) => setContact({ ...contact, address1: v })} autoComplete="address-line1" wide />
              <Field label="Apartment, landmark (optional)" value={contact.address2} onChange={(v) => setContact({ ...contact, address2: v })} autoComplete="address-line2" wide />
              <Field label="City" value={contact.city} onChange={(v) => setContact({ ...contact, city: v })} autoComplete="address-level2" />
              <Field label="State" value={contact.state} onChange={(v) => setContact({ ...contact, state: v })} autoComplete="address-level1" />
              <Field
                label="PIN code" value={contact.pin} inputMode="numeric"
                onChange={(v) => setContact({ ...contact, pin: v.replace(/\D/g, "").slice(0, 6) })}
                autoComplete="postal-code"
                hint={contact.pin && !pinCheck.ok ? pinCheck.message : pinCheck.circle}
              />
            </div>
            {eta ? (
              <p className="small muted ckt__eta">
                <Truck size={15} /> {eta.text}
              </p>
            ) : null}
            <button type="button" className="btn btn--solid btn--lg btn--block" disabled={!addressReady} onClick={() => setStep(1)}>
              Continue to payment
            </button>
          </section>
        ) : (
          <section className="ckt__card glass glass--light" aria-label="Payment">
            <div className="ckt__addr">
              <h2 className="label label--soft">Shipping to</h2>
              <p className="small">
                {contact.name}<br />
                {contact.address1}{contact.address2 ? `, ${contact.address2}` : ""}<br />
                {contact.city}, {contact.state} {contact.pin}
              </p>
              <button type="button" className="ul-grow label ckt__edit" onClick={() => setStep(0)}>Edit</button>
            </div>

            <h2 className="label label--soft">Payment method</h2>
            <label className="ckt__pay">
              <input type="radio" name="pay" defaultChecked readOnly />
              <span>
                <strong>Razorpay</strong>
                <span className="small muted"> — cards, UPI, netbanking and wallets</span>
              </span>
            </label>
            <p className="small muted ckt__secure">
              <Shield size={15} /> Your card details are entered in Razorpay&rsquo;s own window and never
              reach Nero Noren. Every payment is verified on our server before an order is written.
            </p>

            {!razorpayLive ? (
              <p className="ckt__warn small">
                Payments are not connected yet. Nothing can be charged, and nothing will be.
              </p>
            ) : null}
            {error ? <p className="ckt__warn small" role="alert">{error}</p> : null}

            <button
              type="button"
              className="btn btn--solid btn--lg btn--block"
              disabled={!razorpayLive || status === "opening" || status === "verifying"}
              onClick={() => void pay()}
            >
              {status === "opening" ? "Opening Razorpay…"
                : status === "verifying" ? "Verifying payment…"
                : `Pay ${formatMinor(subtotal, currency)}`}
            </button>
          </section>
        )}
      </div>

      <aside className="ckt__sum">
        <h2 className="label label--soft">Your order</h2>
        <ul className="ckt__lines">
          {rows.map(({ line, product, total }) => (
            <li key={`${line.handle}-${line.size}`}>
              <span className="ckt__img"><GarmentImage product={product} sizes="56px" /></span>
              <span className="ckt__line-body">
                <span className="ckt__line-name">{product.name}</span>
                <span className="small muted">{product.colour} · {line.size} · ×{line.quantity}</span>
              </span>
              <strong className="tnum">{formatMinor(total, product.currency)}</strong>
            </li>
          ))}
        </ul>
        <dl className="ckt__dl">
          <div><dt>Subtotal</dt><dd className="tnum">{formatMinor(subtotal, currency)}</dd></div>
          <div><dt>Delivery</dt><dd>Free</dd></div>
          <div className="ckt__dl-total"><dt>Total</dt><dd className="tnum">{formatMinor(subtotal, currency)}</dd></div>
        </dl>
        <p className="small muted">Inclusive of all taxes.</p>
      </aside>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", hint, wide, autoComplete, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  wide?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
}) {
  return (
    <label className="ckt__field" data-wide={wide || undefined}>
      <span className="label label--soft">{label}</span>
      <input
        className="field"
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="small muted">{hint}</span> : null}
    </label>
  );
}
