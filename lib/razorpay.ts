import "server-only";
import crypto from "node:crypto";
import { env, integrations } from "./env";

/**
 * Razorpay, called only from the server.
 * The key secret never leaves this module, and a payment is treated as paid
 * only after its signature has been verified here.
 */

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

function auth() {
  const id = env.razorpayKeyId();
  const secret = env.razorpayKeySecret();
  if (!id || !secret) throw new Error("Razorpay is not configured");
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function createOrder(input: {
  /** in the smallest currency unit — paise for INR */
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: 1,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay order failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify the signature Razorpay returns to the browser.
 * A mismatch means the payment is not ours and must not be honoured.
 */
export function verifyPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = env.razorpayKeySecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const razorpayReady = integrations.razorpay;

/** Only the public key id ever reaches the browser. */
export function publicKeyId() {
  return env.razorpayKeyId();
}
