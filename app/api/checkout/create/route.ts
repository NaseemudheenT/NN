import { NextResponse } from "next/server";
import { createOrder, razorpayReady } from "@/lib/razorpay";
import { publicKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

interface Body {
  amount: number;
  currency: string;
  reference: string;
}

export async function POST(request: Request) {
  if (!razorpayReady()) {
    return NextResponse.json(
      {
        message:
          "Payments are not connected yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to take orders.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Malformed request" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      amount,
      currency: body.currency || "INR",
      receipt: body.reference.slice(0, 40),
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
    });
  } catch (e) {
    console.error("[checkout] order creation failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { message: "The payment provider could not start this order. Your bag is untouched." },
      { status: 502 },
    );
  }
}
