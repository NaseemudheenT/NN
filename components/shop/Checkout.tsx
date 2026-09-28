"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/glass/Glass";
import { Monogram } from "@/components/brand/Monogram";
import { useBag, bagSubtotal, formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Stage = "details" | "paying" | "done" | "failed";

interface Address {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

const EMPTY: Address = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pin: "",
};

function Input({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  error,
  className = "",
}: {
  id: keyof Address;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="nn-meta text-ink-faint">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full border bg-transparent px-4 py-3.5 text-[0.95rem] text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint focus-visible:border-accent ${
          error ? "border-[var(--nn-burgundy)]" : "border-line"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="nn-meta mt-1.5 text-[var(--nn-burgundy)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkout() {
  const { lines, clear } = useBag();
  const [address, setAddress] = useState<Address>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [stage, setStage] = useState<Stage>("details");
  const [problem, setProblem] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const subtotal = bagSubtotal(lines);
  const unpriced = lines.some((l) => !l.price);
  const set = (k: keyof Address) => (v: string) => setAddress((a) => ({ ...a, [k]: v }));

  function validate() {
    const e: Partial<Record<keyof Address, string>> = {};
    if (!address.name.trim()) e.name = "We need a name for the parcel.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address.email)) e.email = "Check this email address.";
    if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, "")))
      e.phone = "A ten-digit Indian mobile number.";
    if (!address.line1.trim()) e.line1 = "Street address is required.";
    if (!address.city.trim()) e.city = "City is required.";
    if (!address.state.trim()) e.state = "State is required.";
    if (!/^\d{6}$/.test(address.pin)) e.pin = "A six-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function loadRazorpay(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function pay() {
    setProblem(null);
    if (!validate()) return;
    if (!subtotal) {
      setProblem(
        "These pieces have no price yet, so an order cannot be taken. The store connection publishes prices.",
      );
      return;
    }

    setStage("paying");
    const ref = `NN-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(subtotal.amount * 100),
          currency: subtotal.currency,
          reference: ref,
        }),
      });

      const data = (await res.json()) as {
        message?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
      };

      if (!res.ok || !data.orderId || !data.keyId) {
        setProblem(data.message ?? "The order could not be started. Your bag is untouched.");
        setStage("failed");
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setProblem("The payment window could not load. Check your connection and try again.");
        setStage("failed");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "Nero Noren",
        description: `Order ${ref}`,
        prefill: { name: address.name, email: address.email, contact: address.phone },
        notes: { reference: ref },
        theme: { color: "#c9a43a" },
        modal: {
          ondismiss: () => {
            setStage("details");
            setProblem("Payment was cancelled. Nothing was charged and your bag is as you left it.");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          if (verify.ok) {
            setReference(ref);
            setStage("done");
            clear();
          } else {
            setProblem(
              "The payment could not be verified. Nothing has been dispatched — please contact us with reference " +
                ref +
                " before paying again.",
            );
            setStage("failed");
          }
        },
      });

      rzp.open();
    } catch {
      setProblem("Something went wrong reaching the payment provider. Your bag is untouched.");
      setStage("failed");
    }
  }

  /* ---------------- confirmed ---------------- */
  if (stage === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.slow, ease: MOTION.ease }}
        className="mx-auto flex max-w-xl flex-col items-center gap-6 border border-line px-6 py-24 text-center"
      >
        <Monogram className="h-10 w-auto text-accent" />
        <h2 className="nn-display text-[clamp(1.9rem,4vw,2.8rem)] text-ink">Order placed</h2>
        <p className="nn-body text-ink-soft">
          Thank you. A confirmation is on its way to {address.email}. Your reference is{" "}
          <span className="text-ink">{reference}</span>.
        </p>
        <GlassButton href="/collection" variant="solid">
          Back to the collection
        </GlassButton>
      </motion.div>
    );
  }

  /* ---------------- empty ---------------- */
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 border border-line px-6 py-24 text-center">
        <Monogram className="h-9 w-auto text-line" />
        <p className="nn-body text-ink-faint">There is nothing to check out.</p>
        <GlassButton href="/collection" variant="quiet">
          See the collection
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          void pay();
        }}
        noValidate
      >
        <fieldset className="space-y-5">
          <legend className="nn-label mb-3 text-ink">Contact</legend>
          <Input id="name" label="Full name" value={address.name} onChange={set("name")} autoComplete="name" error={errors.name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input id="email" label="Email" type="email" inputMode="email" value={address.email} onChange={set("email")} autoComplete="email" error={errors.email} />
            <Input id="phone" label="Mobile" type="tel" inputMode="tel" value={address.phone} onChange={set("phone")} autoComplete="tel" error={errors.phone} />
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="nn-label mb-3 text-ink">Delivery address</legend>
          <Input id="line1" label="Flat, house, building" value={address.line1} onChange={set("line1")} autoComplete="address-line1" error={errors.line1} />
          <Input id="line2" label="Area, street (optional)" value={address.line2} onChange={set("line2")} autoComplete="address-line2" />
          <div className="grid gap-5 sm:grid-cols-3">
            <Input id="city" label="City" value={address.city} onChange={set("city")} autoComplete="address-level2" error={errors.city} />
            <Input id="state" label="State" value={address.state} onChange={set("state")} autoComplete="address-level1" error={errors.state} />
            <Input id="pin" label="PIN code" inputMode="numeric" value={address.pin} onChange={set("pin")} autoComplete="postal-code" error={errors.pin} />
          </div>
        </fieldset>

        <AnimatePresence>
          {problem && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border-l-2 border-l-[var(--nn-burgundy)] bg-bg-elev px-5 py-4"
              role="alert"
            >
              <p className="nn-body text-[0.875rem] text-ink">{problem}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassButton
          type="submit"
          variant="solid"
          size="lg"
          magnetic={false}
          className="w-full sm:w-auto"
          disabled={stage === "paying"}
        >
          {stage === "paying" ? "Opening payment…" : "Pay securely"}
        </GlassButton>

        <p className="nn-meta leading-relaxed text-ink-faint">
          Payment is handled by Razorpay. Card details are entered in their window and never reach
          Nero Noren. Every payment is verified on our server before an order is confirmed.
        </p>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="nn-glass rounded-md p-6">
          <h2 className="nn-label text-ink">Your order</h2>
          <ul className="mt-5 space-y-4 border-t border-line pt-5">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight text-ink">{l.title}</p>
                  <p className="nn-meta mt-1 text-ink-faint">
                    {l.colour} · {l.size} · ×{l.quantity}
                  </p>
                </div>
                <span className="nn-label shrink-0 text-ink">
                  {l.price ? formatMoney({ amount: l.price.amount * l.quantity, currency: l.price.currency }) : "—"}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2.5 border-t border-line pt-5">
            <div className="flex justify-between">
              <dt className="nn-body text-sm text-ink-soft">Subtotal</dt>
              <dd className="font-display text-xl text-ink">{formatMoney(subtotal) ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="nn-body text-sm text-ink-soft">Delivery</dt>
              <dd className="nn-body text-sm text-ink-soft">Shown before payment</dd>
            </div>
          </dl>
          {unpriced && (
            <p className="nn-meta mt-5 leading-relaxed text-ink-faint">
              Some pieces have no published price, so this order cannot be completed yet.
            </p>
          )}
          <Link
            href="/bag"
            className="nn-label mt-6 block text-center text-ink-faint transition-colors hover:text-ink"
          >
            Edit the bag
          </Link>
        </div>
      </aside>
    </div>
  );
}
