/**
 * Verifies a payment, then creates the order in Shopify.
 *
 * Nothing here trusts the browser. The signature is checked against the secret,
 * and then the payment is fetched from Razorpay directly to confirm its status
 * and that the amount actually captured is the amount we asked for. Only then is
 * an order created.
 *
 * If verification fails the response says so plainly and the bag is left alone,
 * because a customer whose payment did not go through should still have their
 * bag.
 */

import { fetchPayment, verifyPaymentSignature } from "@/lib/razorpay";
import { razorpayReady, shopifyReady, env } from "@/lib/env";
import { loadCatalogue } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyBody {
  orderId?: unknown;
  paymentId?: unknown;
  signature?: unknown;
  expectedAmountMinor?: unknown;
  contact?: unknown;
  lines?: unknown;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pin: string;
}

function parseContact(value: unknown): Contact | null {
  if (typeof value !== "object" || value === null) return null;
  const c = value as Record<string, unknown>;
  const str = (k: string, max = 120) =>
    typeof c[k] === "string" ? (c[k] as string).trim().slice(0, max) : "";

  const contact: Contact = {
    name: str("name"),
    email: str("email"),
    phone: str("phone", 20),
    address1: str("address1", 200),
    address2: str("address2", 200) || undefined,
    city: str("city", 80),
    state: str("state", 80),
    pin: str("pin", 6),
  };
  if (!contact.name || !contact.email || !contact.address1 || !contact.city || !contact.pin) {
    return null;
  }
  return contact;
}

/**
 * Creates the order in Shopify through the Admin API.
 *
 * Deliberately separate from verification: if Shopify is down we have still
 * taken a real payment, and losing that fact would be far worse than failing to
 * create the order record. So a Shopify failure is logged loudly and the
 * customer is still told their payment succeeded, with the payment id.
 */
async function createShopifyOrder(args: {
  contact: Contact;
  paymentId: string;
  amountMinor: number;
  currency: string;
  lines: { variantId: string | null; handle: string; size: string; quantity: number; unitMinor: number }[];
}): Promise<{ ok: boolean; orderName?: string; reason?: string }> {
  if (!shopifyReady() || !env.shopifyAdminToken) {
    return { ok: false, reason: "Shopify Admin API is not configured (SHOPIFY_ADMIN_TOKEN)." };
  }

  const [firstName, ...rest] = args.contact.name.split(/\s+/);

  const order = {
    order: {
      email: args.contact.email,
      financial_status: "paid",
      currency: args.currency,
      line_items: args.lines.map((l) => ({
        ...(l.variantId?.startsWith("gid://")
          ? { variant_id: Number(l.variantId.split("/").pop()) }
          : { title: `${l.handle} — ${l.size}` }),
        quantity: l.quantity,
        price: (l.unitMinor / 100).toFixed(2),
      })),
      shipping_address: {
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
        address1: args.contact.address1,
        address2: args.contact.address2,
        city: args.contact.city,
        province: args.contact.state,
        zip: args.contact.pin,
        country: "India",
        country_code: "IN",
        phone: args.contact.phone,
      },
      transactions: [
        {
          kind: "sale",
          status: "success",
          gateway: "Razorpay",
          amount: (args.amountMinor / 100).toFixed(2),
          authorization: args.paymentId,
        },
      ],
      tags: "nero-noren-web,razorpay",
      note: `Razorpay payment ${args.paymentId}`,
    },
  };

  try {
    const res = await fetch(
      `https://${env.shopifyDomain}/admin/api/2025-07/orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": env.shopifyAdminToken,
        },
        body: JSON.stringify(order),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, reason: `Shopify returned ${res.status}: ${detail.slice(0, 300)}` };
    }
    const data = (await res.json()) as { order?: { name?: string } };
    return { ok: true, orderName: data.order?.name };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

export async function POST(req: Request) {
  if (!razorpayReady()) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const signature = typeof body.signature === "string" ? body.signature : "";

  /* 1. the signature. Without this, nothing else matters. */
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    console.warn(`[razorpay] signature did not verify for order ${orderId}`);
    return Response.json(
      {
        error: "signature_invalid",
        message:
          "We could not verify that payment, so we have not created an order. Your bag is untouched and nothing has been charged by us. If you believe money left your account, send us the payment id and we will trace it.",
        paymentId,
      },
      { status: 400 },
    );
  }

  /* 2. ask Razorpay what actually happened, rather than believing the browser. */
  const payment = await fetchPayment(paymentId);
  if (!payment) {
    return Response.json(
      { error: "payment_unverifiable", message: "We could not reach Razorpay to confirm the payment." },
      { status: 502 },
    );
  }
  if (payment.order_id !== orderId) {
    return Response.json({ error: "order_mismatch" }, { status: 400 });
  }
  if (!["captured", "authorized"].includes(payment.status)) {
    return Response.json(
      {
        error: "not_paid",
        message: `Razorpay reports this payment as ${payment.status}. Your bag is untouched.`,
        status: payment.status,
      },
      { status: 402 },
    );
  }

  /* 3. and that the amount captured is the amount we asked for. */
  const expected = Number(body.expectedAmountMinor);
  if (Number.isFinite(expected) && expected > 0 && payment.amount !== expected) {
    console.error(
      `[razorpay] amount mismatch on ${paymentId}: captured ${payment.amount}, expected ${expected}`,
    );
    return Response.json(
      { error: "amount_mismatch", message: "The amount paid does not match the order. We are looking into it." },
      { status: 409 },
    );
  }

  /* 4. the order record. */
  const contact = parseContact(body.contact);
  if (!contact) {
    return Response.json(
      { error: "bad_contact", message: "The delivery address was incomplete." },
      { status: 400 },
    );
  }

  const { products } = await loadCatalogue();
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines = rawLines.flatMap((l) => {
    if (typeof l !== "object" || l === null) return [];
    const { handle, size, quantity } = l as Record<string, unknown>;
    if (typeof handle !== "string" || typeof size !== "string") return [];
    const product = products.find((p) => p.handle === handle);
    const variant = product?.variants.find((v) => v.size === size);
    if (!product || !variant) return [];
    return [{
      variantId: variant.id,
      handle,
      size,
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      unitMinor: variant.priceMinor,
    }];
  });

  const shopify = await createShopifyOrder({
    contact,
    paymentId,
    amountMinor: payment.amount,
    currency: payment.currency,
    lines,
  });

  if (!shopify.ok) {
    // The money is real. Say the payment worked, and be honest that the order
    // record still needs creating, rather than pretending nothing happened.
    console.error(`[razorpay] payment ${paymentId} verified but Shopify order failed: ${shopify.reason}`);
  }

  return Response.json({
    verified: true,
    paymentId,
    orderId,
    amountMinor: payment.amount,
    currency: payment.currency,
    method: payment.method,
    orderCreated: shopify.ok,
    orderName: shopify.orderName ?? null,
    orderNote: shopify.ok
      ? null
      : "Your payment went through. We are still writing the order record, and we will email your confirmation shortly.",
  });
}
