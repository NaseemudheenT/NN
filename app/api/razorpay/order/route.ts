/**
 * Creates a Razorpay order for the bag.
 *
 * The total is computed here from the catalogue, never taken from the request.
 * A client that sends its own total is a client that can send a smaller one, so
 * the browser is asked only what the customer chose — handles, sizes and
 * quantities — and the money is worked out on the server.
 */

import { createOrder } from "@/lib/razorpay";
import { razorpayReady, env } from "@/lib/env";
import { loadCatalogue } from "@/lib/catalog";
import { validatePin } from "@/lib/india";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LINES = 20;
const MAX_QTY_PER_LINE = 10;

interface RequestLine {
  handle: string;
  size: string;
  quantity: number;
}

function parseLines(value: unknown): RequestLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_LINES).flatMap((l) => {
    if (typeof l !== "object" || l === null) return [];
    const { handle, size, quantity } = l as Record<string, unknown>;
    if (typeof handle !== "string" || typeof size !== "string") return [];
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q) || q < 1 || q > MAX_QTY_PER_LINE) return [];
    return [{ handle, size, quantity: q }];
  });
}

export async function POST(req: Request) {
  if (!razorpayReady()) {
    return Response.json(
      {
        error: "not_configured",
        message: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local to take payments.",
      },
      { status: 503 },
    );
  }

  let body: { lines?: unknown; pin?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const lines = parseLines(body.lines);
  if (!lines.length) {
    return Response.json({ error: "empty_bag", message: "There is nothing to pay for." }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const pinCheck = validatePin(pin);
  if (!pinCheck.ok) {
    return Response.json({ error: "bad_pin", message: pinCheck.message }, { status: 400 });
  }

  /* price the bag from the catalogue — the only source of truth for money */
  const { products } = await loadCatalogue();
  let amountMinor = 0;
  const priced: { handle: string; size: string; quantity: number; unitMinor: number }[] = [];
  const rejected: string[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.handle === line.handle);
    const variant = product?.variants.find((v) => v.size === line.size);
    if (!product || !variant) {
      rejected.push(`${line.handle} in ${line.size}`);
      continue;
    }
    if (!variant.available) {
      rejected.push(`${product.title} in ${line.size} (out of stock)`);
      continue;
    }
    amountMinor += variant.priceMinor * line.quantity;
    priced.push({ ...line, unitMinor: variant.priceMinor });
  }

  if (!priced.length) {
    return Response.json(
      {
        error: "nothing_available",
        message: "Nothing in the bag is available to buy just now.",
        rejected,
      },
      { status: 409 },
    );
  }

  try {
    const order = await createOrder({
      amountMinor,
      currency: priced.length ? (products[0]?.currency ?? "INR") : "INR",
      receipt: `nn-${Date.now().toString(36)}`,
      notes: {
        items: String(priced.reduce((a, l) => a + l.quantity, 0)),
        pin,
        circle: pinCheck.circle ?? "",
      },
    });

    return Response.json({
      orderId: order.id,
      amountMinor: order.amount,
      currency: order.currency,
      // The publishable key. This is the only Razorpay value the browser gets.
      keyId: env.razorpayKeyId,
      priced,
      rejected,
    });
  } catch (err) {
    console.error("[razorpay] order creation failed:", err);
    return Response.json(
      { error: "razorpay_error", message: "We could not start the payment. Your bag is untouched." },
      { status: 502 },
    );
  }
}
