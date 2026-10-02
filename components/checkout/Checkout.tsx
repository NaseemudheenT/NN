"use client";

/**
 * Checkout.
 *
 * Validation reads the way a person would: a PIN code is checked against the
 * real Indian postal ranges and names the state back to you, and a mobile number
 * is checked against the ranges India actually issues. The delivery estimate is
 * a window, never a promise.
 *
 * The total here is for display. The total charged is computed again on the
 * server from the same catalogue, so what this browser believes can never decide
 * what is taken. Three steps, in order: the server opens an order, the customer
 * pays in Razorpay's own window, the server verifies the signature. The bag is
 * cleared only after the third.
 *
 * A failed or cancelled payment leaves the bag exactly as it was.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { estimateDelivery, validateMobile, validatePin } from "@/lib/india";
import { useBag } from "@/components/shop/BagProvider";
import { track } from "@/components/layout/ConsentBanner";
import { Field } from "./Field";
import { OrderSummary, deliveryFor, type PricedLine } from "./OrderSummary";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

interface Fields {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
}

const EMPTY: Fields = {
  name: "", email: "", phone: "", address1: "", address2: "", city: "", state: "", pin: "",
};

type Status = "idle" | "paying" | "verifying" | "failed";

export function Checkout({
  products,
  razorpayLive,
}: {
  products: Product[];
  razorpayLive: boolean;
}) {
  const { lines, clear } = useBag();
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  const priced: PricedLine[] = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byHandle.get(line.handle);
        if (!product) return [];
        const variant = product.variants.find((v) => v.size === line.size);
        const unitMinor = variant?.priceMinor ?? product.priceMinor;
        return [
          {
            handle: line.handle,
            size: line.size,
            quantity: line.quantity,
            product,
            unitMinor,
            totalMinor: unitMinor * line.quantity,
          },
        ];
      }),
    [lines, byHandle],
  );

  const subtotalMinor = priced.reduce((a, l) => a + l.totalMinor, 0);
  const currency = priced[0]?.product.currency ?? "INR";
  const totalMinor = subtotalMinor + deliveryFor(subtotalMinor);

  /* ── validation ── */
  const pinCheck = validatePin(fields.pin);
  const mobileCheck = validateMobile(fields.phone);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim());

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) e.name = "Tell us who the order is for.";
    if (!emailOk) e.email = "Enter an email address we can send the confirmation to.";
    if (!mobileCheck.ok) e.phone = mobileCheck.message;
    if (!fields.address1.trim()) e.address1 = "Enter the street address.";
    if (!fields.city.trim()) e.city = "Enter the town or city.";
    if (!pinCheck.ok) e.pin = pinCheck.message;
    return e;
  }, [fields.name, fields.address1, fields.city, emailOk, mobileCheck.ok, mobileCheck.message, pinCheck.ok, pinCheck.message]);

  const delivery = pinCheck.ok ? estimateDelivery(fields.pin) : null;

  /* Naming the state from the PIN is a real check, not a convenience: it catches
     a mistyped PIN that would otherwise send the parcel across the country. */
  useEffect(() => {
    if (pinCheck.ok && pinCheck.circle && !fields.state.trim()) {
      setFields((f) => ({ ...f, state: pinCheck.circle! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinCheck.ok, pinCheck.circle]);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));
  const blur = (key: keyof Fields) => () => setTouched((t) => ({ ...t, [key]: true }));
  const errorFor = (key: keyof Fields) => (touched[key] ? errors[key] : undefined);

  const loadRazorpay = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      }),
    [],
  );

  const pay = useCallback(async () => {
    setMessage(null);
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));

    if (Object.keys(errors).length) {
      setMessage("Please correct the details above.");
      return;
    }
    if (!priced.length) {
      setMessage("Your bag is empty.");
      return;
    }

    setStatus("paying");
    track("checkout_started", { items: priced.length });

    const bagLines = lines.map((l) => ({
      handle: l.handle,
      size: l.size,
      quantity: l.quantity,
    }));

    try {
      /* 1. the server prices the bag and opens a Razorpay order */
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: bagLines, pin: fields.pin }),
      });
      const order = (await orderRes.json()) as {
        orderId?: string;
        amountMinor?: number;
        currency?: string;
        keyId?: string;
        message?: string;
      };

      if (!orderRes.ok || !order.orderId || !order.keyId) {
        setStatus("failed");
        setMessage(order.message ?? "We could not start the payment. Your bag is untouched.");
        return;
      }

      if (!(await loadRazorpay()) || !window.Razorpay) {
        setStatus("failed");
        setMessage(
          "The payment window could not load. Check your connection and try again — your bag is untouched.",
        );
        return;
      }

      /* 2. the customer pays, in Razorpay's own window */
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountMinor,
        currency: order.currency,
        name: "Nero Noren",
        description: `Collection 001 — ${priced.reduce((a, l) => a + l.quantity, 0)} piece(s)`,
        prefill: {
          name: fields.name,
          email: fields.email,
          contact: mobileCheck.normalised ?? fields.phone,
        },
        // The payment sheet's accent. Deep Black, the board's own primary —
        // this is the one piece of NN chrome rendered by someone else's code,
        // so it is the one place a wrong colour would be most obvious.
        theme: { color: "#0a0a0a" },
        modal: {
          ondismiss: () => {
            // Cancelled, not failed. Say so, and leave everything alone.
            setStatus("idle");
            setMessage("Payment cancelled. Your bag is exactly as you left it.");
          },
        },
        handler: async (response: Record<string, string>) => {
          setStatus("verifying");
          try {
            /* 3. the server verifies the signature and writes the order */
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                expectedAmountMinor: order.amountMinor,
                contact: {
                  name: fields.name,
                  email: fields.email,
                  phone: mobileCheck.normalised ?? fields.phone,
                  address1: fields.address1,
                  address2: fields.address2,
                  city: fields.city,
                  state: fields.state,
                  pin: fields.pin,
                },
                lines: bagLines,
              }),
            });
            const verified = (await verifyRes.json()) as {
              verified?: boolean;
              paymentId?: string;
              orderName?: string | null;
              orderNote?: string | null;
              message?: string;
            };

            if (!verifyRes.ok || !verified.verified) {
              setStatus("failed");
              setMessage(verified.message ?? "We could not verify that payment.");
              return;
            }

            // Only now: after a verified payment, never before.
            track("checkout_paid", { items: priced.length });
            clear();

            const params = new URLSearchParams({ payment: verified.paymentId ?? "" });
            if (verified.orderName) params.set("order", verified.orderName);
            if (verified.orderNote) params.set("note", verified.orderNote);
            router.push(`/checkout/success?${params.toString()}`);
          } catch {
            setStatus("failed");
            setMessage(
              "Your payment may have gone through, but we could not confirm it. Please do not pay again — send us the payment id and we will check.",
            );
          }
        },
      });

      checkout.open();
    } catch {
      setStatus("failed");
      setMessage("Something went wrong before any payment was taken. Your bag is untouched.");
    }
  }, [errors, priced, lines, fields, loadRazorpay, mobileCheck, clear, router]);

  if (!priced.length && status === "idle") {
    return (
      <div className="nn-wrap py-24 text-center">
        <h2 className="text-title">Your bag is empty</h2>
        <p className="mt-4 text-[var(--ink-soft)]">There is nothing to check out just now.</p>
        <Link href="/collection" className="nn-btn mt-8">
          <span>See Collection 001</span>
        </Link>
      </div>
    );
  }

  const busy = status === "paying" || status === "verifying";

  return (
    <div className="nn-wrap grid gap-14 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void pay();
        }}
        noValidate
      >
        <fieldset className="border-0 p-0" disabled={busy}>
          <h2 className="text-lead">Where it is going</h2>

          <div className="mt-6 grid gap-5">
            <Field
              id="name"
              label="Full name"
              value={fields.name}
              onChange={set("name")}
              onBlur={blur("name")}
              error={errorFor("name")}
              autoComplete="name"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="email"
                label="Email"
                type="email"
                value={fields.email}
                onChange={set("email")}
                onBlur={blur("email")}
                error={errorFor("email")}
                autoComplete="email"
                hint="For your order confirmation."
              />
              <Field
                id="phone"
                label="Mobile"
                type="tel"
                inputMode="numeric"
                value={fields.phone}
                onChange={set("phone")}
                onBlur={blur("phone")}
                error={errorFor("phone")}
                autoComplete="tel"
                hint="For delivery updates only."
              />
            </div>
            <Field
              id="address1"
              label="Flat, house, building, street"
              value={fields.address1}
              onChange={set("address1")}
              onBlur={blur("address1")}
              error={errorFor("address1")}
              autoComplete="address-line1"
            />
            <Field
              id="address2"
              label="Area, landmark — optional"
              value={fields.address2}
              onChange={set("address2")}
              onBlur={blur("address2")}
              autoComplete="address-line2"
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                id="pin"
                label="PIN code"
                inputMode="numeric"
                maxLength={6}
                value={fields.pin}
                onChange={set("pin")}
                onBlur={blur("pin")}
                error={errorFor("pin")}
                autoComplete="postal-code"
              />
              <Field
                id="city"
                label="Town or city"
                value={fields.city}
                onChange={set("city")}
                onBlur={blur("city")}
                error={errorFor("city")}
                autoComplete="address-level2"
              />
              <Field
                id="state"
                label="State"
                value={fields.state}
                onChange={set("state")}
                onBlur={blur("state")}
                autoComplete="address-level1"
                hint={pinCheck.circle ? "From your PIN code." : undefined}
              />
            </div>
          </div>

          {delivery ? (
            <p
              className="mt-6 border-l-2 pl-4 text-fine text-[var(--ink-soft)]"
              style={{ borderColor: "var(--accent)" }}
            >
              {delivery.text} An estimate, not a promise — we would rather be honest than early.
            </p>
          ) : null}

          <div className="mt-10">
            <h2 className="text-lead">Payment</h2>
            <p className="mt-3 text-fine text-[var(--ink-soft)]">
              UPI, cards and netbanking, through Razorpay. Your card details are entered in
              Razorpay&rsquo;s own window and never reach us.
            </p>

            {!razorpayLive ? (
              <p
                className="mt-5 border p-4 text-fine text-[var(--ink-soft)]"
                style={{ borderColor: "var(--accent)" }}
              >
                Payments are not connected yet. Set{" "}
                <code className="text-[var(--ink)]">RAZORPAY_KEY_ID</code> and{" "}
                <code className="text-[var(--ink)]">RAZORPAY_KEY_SECRET</code> in{" "}
                <code className="text-[var(--ink)]">.env.local</code> — test-mode keys are fine —
                and this will take a real test payment.
              </p>
            ) : null}

            <button
              type="submit"
              className="nn-btn nn-btn--solid mt-7 w-full sm:w-auto"
              disabled={!razorpayLive || busy}
            >
              <span>
                {status === "paying"
                  ? "Opening payment…"
                  : status === "verifying"
                    ? "Verifying your payment…"
                    : `Pay ${formatMinor(totalMinor, currency)}`}
              </span>
            </button>

            {message ? (
              <p
                className="mt-5 text-fine"
                role="alert"
                style={{
                  color: status === "failed" ? "var(--color-nn-burgundy)" : "var(--ink-soft)",
                }}
              >
                {message}
              </p>
            ) : null}
          </div>
        </fieldset>
      </form>

      <aside>
        <OrderSummary lines={priced} editable />
      </aside>
    </div>
  );
}
