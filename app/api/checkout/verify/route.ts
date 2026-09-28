import { NextResponse } from "next/server";
import { verifyPayment, razorpayReady } from "@/lib/razorpay";

export const runtime = "nodejs";

interface Body {
  orderId: string;
  paymentId: string;
  signature: string;
}

export async function POST(request: Request) {
  if (!razorpayReady()) {
    return NextResponse.json({ message: "Payments are not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Malformed request" }, { status: 400 });
  }

  if (!body.orderId || !body.paymentId || !body.signature) {
    return NextResponse.json({ message: "Missing payment details" }, { status: 400 });
  }

  const ok = verifyPayment(body);
  if (!ok) {
    // Never treat an unverified payment as paid.
    return NextResponse.json({ verified: false, message: "Signature did not verify" }, { status: 400 });
  }

  return NextResponse.json({ verified: true, orderId: body.orderId });
}
