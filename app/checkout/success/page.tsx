import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

/**
 * Confirmation.
 *
 * Shows the payment id, because that is the thing a customer needs if anything
 * ever goes wrong, and says honestly whether the order record was written — a
 * verified payment with a pending order is a real state, and pretending
 * otherwise is how trust is lost.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; order?: string; note?: string }>;
}) {
  const { payment, order, note } = await searchParams;

  return (
    <section className="miss band">
      <div className="wrap miss__in">
        <Monogram size={48} className="miss__mark" />
        <p className="label label--soft">Payment verified</p>
        <h1 className="d-h1">Thank you.</h1>
        <p className="lead">
          Your payment has been checked against Razorpay&rsquo;s signature on our server, so this
          is confirmed rather than assumed. Your confirmation email is on its way.
        </p>

        {order || payment ? (
          <dl className="miss__refs">
            {order ? (
              <div><dt className="label label--soft">Order</dt><dd className="tnum">{order}</dd></div>
            ) : null}
            {payment ? (
              <div><dt className="label label--soft">Payment reference</dt><dd className="tnum">{payment}</dd></div>
            ) : null}
          </dl>
        ) : null}

        {note ? <p className="miss__note small">{note}</p> : null}

        <p className="small muted">
          Keep the payment reference. Free size exchanges within 7 days of delivery.
        </p>

        <div className="miss__acts">
          <Link href="/" className="btn btn--solid btn--lg">Return to the showroom</Link>
          <Link href="/collection" className="btn btn--line btn--lg">Back to the collection</Link>
        </div>
      </div>
    </section>
  );
}
