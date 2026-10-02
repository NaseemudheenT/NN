/**
 * The payment flow, lifted out of the UI that used to hold it.
 *
 * This is the one piece of client code in NN that touches money, and it was
 * living inside a 454-line checkout component — which meant that deleting the
 * design would have deleted the Razorpay integration with it. It belongs here
 * regardless of what the checkout looks like.
 *
 * ── the shape of it, which is not negotiable ─────────────────────────
 * Three steps, in this order, and the order is the security model:
 *
 *   1. THE SERVER PRICES THE BAG. The browser sends handles, sizes and
 *      quantities — never an amount. A client that can name its own price is
 *      a client that will. The server looks each line up in the catalogue,
 *      totals it, and opens a Razorpay order for that figure.
 *   2. THE CUSTOMER PAYS IN RAZORPAY'S OWN WINDOW. Card details never touch
 *      NN's code, which is the entire reason the hosted window exists.
 *   3. THE SERVER VERIFIES THE SIGNATURE. Razorpay's handler fires in the
 *      browser and a browser can be made to say anything, so a successful
 *      callback proves nothing on its own. The order is only written after
 *      the server has checked the HMAC and re-checked the amount.
 *
 * The bag is cleared after step 3 and never before. Clearing it on the
 * callback would empty a customer's bag on a payment that was never verified.
 */

export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export interface CheckoutLine {
  handle: string;
  variantId: string;
  size: string;
  quantity: number;
}

export interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
}

export type CheckoutStatus = "idle" | "opening" | "verifying" | "failed";

export interface CheckoutResult {
  ok: boolean;
  /** Where to send the customer, when ok. */
  redirect?: string;
  /** What to tell them, when not. */
  message?: string;
  /** True when they closed the window themselves — not a failure. */
  cancelled?: boolean;
}

/** Load Razorpay's script once. Resolves false if it cannot be reached. */
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Run the whole payment.
 *
 * Returns once the outcome is known. `onStatus` reports progress so a UI can
 * show it; the flow does not care what that UI looks like, which is the point
 * of it living here.
 */
export async function runCheckout({
  lines,
  contact,
  pieces,
  onStatus,
}: {
  lines: CheckoutLine[];
  contact: CheckoutContact;
  /** How many garments, for the description in Razorpay's window. */
  pieces: number;
  onStatus?: (status: CheckoutStatus) => void;
}): Promise<CheckoutResult> {
  const say = (s: CheckoutStatus) => onStatus?.(s);

  try {
    say("opening");

    /* 1. The server prices the bag. Note what is NOT sent: an amount. */
    const orderRes = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, pin: contact.pin }),
    });
    const order = (await orderRes.json()) as {
      orderId?: string;
      amountMinor?: number;
      currency?: string;
      keyId?: string;
      message?: string;
    };

    if (!orderRes.ok || !order.orderId || !order.keyId) {
      say("failed");
      return { ok: false, message: order.message ?? "We could not start the payment. Your bag is untouched." };
    }

    if (!(await loadRazorpay()) || !window.Razorpay) {
      say("failed");
      return {
        ok: false,
        message:
          "The payment window could not load. Check your connection and try again — your bag is untouched.",
      };
    }

    /* 2. The customer pays, in Razorpay's own window. The promise below
          settles from inside its callbacks, which is why this is wrapped
          rather than awaited directly. */
    return await new Promise<CheckoutResult>((resolve) => {
      const checkout = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountMinor,
        currency: order.currency,
        name: "Nero Noren",
        description: `Collection 001 — ${pieces} piece(s)`,
        prefill: { name: contact.name, email: contact.email, contact: contact.phone },
        /* The payment sheet's accent. Deep Black, the board's own primary —
           the one piece of NN chrome rendered by somebody else's code, and
           therefore the one place a wrong colour is most obvious. */
        theme: { color: "#0a0a0a" },
        modal: {
          ondismiss: () => {
            say("idle");
            resolve({ ok: false, cancelled: true, message: "Payment cancelled. Your bag is exactly as you left it." });
          },
        },
        handler: async (response: Record<string, string>) => {
          say("verifying");
          try {
            /* 3. The server verifies the signature and writes the order.
                  This callback runs in a browser, and a browser can be made
                  to say anything — so reaching here proves nothing by
                  itself. */
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                expectedAmountMinor: order.amountMinor,
                contact,
                lines,
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
              say("failed");
              resolve({ ok: false, message: verified.message ?? "We could not verify that payment." });
              return;
            }

            const params = new URLSearchParams({ payment: verified.paymentId ?? "" });
            if (verified.orderName) params.set("order", verified.orderName);
            if (verified.orderNote) params.set("note", verified.orderNote);
            resolve({ ok: true, redirect: `/checkout/success?${params.toString()}` });
          } catch {
            say("failed");
            /* The worst case, and it needs its own words: the money may well
               have left. Telling someone to try again here would take it
               twice. */
            resolve({
              ok: false,
              message:
                "Your payment may have gone through, but we could not confirm it. Please do not pay again — send us the payment id and we will check.",
            });
          }
        },
      });

      checkout.open();
    });
  } catch {
    say("failed");
    return { ok: false, message: "Something went wrong before any payment was taken. Your bag is untouched." };
  }
}
