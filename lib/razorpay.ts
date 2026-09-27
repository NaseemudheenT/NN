/**
 * Razorpay.
 *
 * Two things matter here and nothing else does.
 *
 * First, the secret never leaves the server. Only RAZORPAY_KEY_ID is given to
 * the browser, because Razorpay's Checkout needs it to open. The secret is used
 * only to create orders and to verify signatures, both server-side.
 *
 * Second, a payment is not real until its signature verifies. The browser tells
 * us "it worked", and the browser can be lied to — by a broken network, by a
 * bored developer with the console open, or by someone dishonest. So the order
 * is only marked paid after HMAC-SHA256(order_id|payment_id, secret) matches
 * the signature Razorpay sent, compared in constant time.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env, razorpayReady } from "./env";

const API = "https://api.razorpay.com/v1";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
}

function authHeader(): string {
  const token = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Create an order for an amount in the minor unit. Razorpay works in paise,
 * which is the same unit the rest of this codebase uses, so nothing is converted.
 */
export async function createOrder({
  amountMinor,
  currency = "INR",
  receipt,
  notes,
}: {
  amountMinor: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!razorpayReady()) throw new Error("Razorpay is not configured");
  if (!Number.isInteger(amountMinor) || amountMinor < 100) {
    throw new Error("Amount must be a whole number of paise, at least 100");
  }

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: amountMinor,
      currency,
      receipt: receipt?.slice(0, 40),
      notes,
      payment_capture: 1,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay refused the order (${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify a payment signature.
 *
 * Razorpay signs `${order_id}|${payment_id}` with the key secret. Comparison is
 * constant-time: a short-circuiting string compare leaks, one byte at a time,
 * how much of a guessed signature was right.
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayReady() || !orderId || !paymentId || !signature) return false;

  const expected = createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on a length mismatch, which is itself information we
  // can return safely: a wrong-length signature is simply invalid.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Verify a webhook, which is signed over the whole raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Fetch a payment, to confirm its state with Razorpay rather than the browser. */
export async function fetchPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  currency: string;
  order_id: string;
  method?: string;
} | null> {
  if (!razorpayReady()) return null;
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    status: string;
    amount: number;
    currency: string;
    order_id: string;
    method?: string;
  };
}
