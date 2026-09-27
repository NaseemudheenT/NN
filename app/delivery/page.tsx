import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";

export const metadata: Metadata = {
  title: "Delivery and returns",
  description:
    "How and when Nero Noren delivers across India, and how size exchanges and returns work.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Delivery and returns"
        lede="Delivered across India. Free size exchanges within seven days. Estimates, never promises we cannot keep."
      />
      <Prose>
        <h2>Delivery</h2>
        <p>
          Orders are dispatched from Kerala. Delivery is free on orders over ₹3,500 and ₹120
          below that.
        </p>
        <dl>
          <dt>Kerala</dt>
          <dd>Two to three working days</dd>
          <dt>Metro circles — Delhi, Maharashtra, Karnataka, Tamil Nadu, Telangana and Andhra Pradesh, West Bengal</dt>
          <dd>Three to five working days</dd>
          <dt>Elsewhere in India</dt>
          <dd>Four to seven working days</dd>
          <dt>The North East, Jammu and Kashmir</dt>
          <dd>Six to nine working days</dd>
        </dl>
        <p>
          Orders placed after 2pm, or at the weekend, go out on the next working day. The estimate
          shown at checkout accounts for that, and for the PIN code you give us. It is a window,
          not a date. We would rather be honest than early.
        </p>

        <h2>Size exchanges</h2>
        <p>
          <strong>Free, within seven days of delivery.</strong> Tell us what was wrong and where —
          tight across the chest, long in the sleeve, loose at the waist — and we will send the
          right size and collect the first one. You do not pay for either leg.
        </p>
        <p>
          The detail matters to us as much as the exchange does. If several people tell us the
          same thing about the same piece, that is a pattern correction, and we would rather know.
        </p>

        <h2>Returns</h2>
        <p>
          If a piece is not for you, return it within seven days of delivery, unworn and unwashed,
          with the hangtag attached. We refund to the original payment method once it reaches us,
          usually within five working days of arrival.
        </p>
        <p>
          A piece that has been worn or washed cannot be returned, because we cannot honestly sell
          it to somebody else. If something has gone wrong with a garment in normal wear, that is
          a different conversation and not a return — write to us.
        </p>

        <h2>If a parcel goes missing</h2>
        <p>
          Send us the order number and we will trace it. If it cannot be found we will replace it
          or refund you in full, whichever you prefer. You are not responsible for a courier&rsquo;s
          mistake.
        </p>

        <h2>Payments</h2>
        <p>
          UPI, cards and netbanking, through Razorpay. Your card details are entered in
          Razorpay&rsquo;s own window and never reach us. Every payment is verified against
          Razorpay&rsquo;s signature on our server before an order is created, which is why a
          confirmation from us means the payment genuinely went through.
        </p>
        <p>
          If a payment fails or you close the payment window, nothing is charged and your bag is
          left exactly as it was.
        </p>
      </Prose>
    </>
  );
}
