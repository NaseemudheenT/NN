import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

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
    <div className="nn-wrap grid min-h-[70svh] place-items-center py-28 text-center">
      <div className="max-w-[46ch]">
        <div className="flex justify-center">
          <LogoMark size={56} />
        </div>

        <p className="nn-eyebrow mt-10">Payment verified</p>
        <h1 className="mt-4 text-title">Thank you.</h1>
        <p className="mt-5 text-[var(--ink-soft)]">
          Your payment has been verified against Razorpay&rsquo;s signature, so this is
          confirmed rather than assumed. We will email your confirmation shortly.
        </p>

        <dl className="mt-10 flex flex-col gap-3 border-t pt-7 text-left text-fine">
          {order ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Order</dt>
              <dd className="nn-tabular m-0">{order}</dd>
            </div>
          ) : null}
          {payment ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Payment reference</dt>
              <dd className="nn-tabular m-0 break-all">{payment}</dd>
            </div>
          ) : null}
        </dl>

        {note ? (
          <p
            className="mt-7 border-l-2 pl-4 text-left text-fine text-[var(--ink-soft)]"
            style={{ borderColor: "var(--accent)" }}
          >
            {note}
          </p>
        ) : null}

        <p className="mt-8 text-[0.72rem] text-[var(--ink-faint)]">
          Keep the payment reference. Free size exchanges within 7 days of delivery.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/collection" className="nn-btn nn-btn--quiet">
            <span>Back to the collection</span>
          </Link>
          <Link href="/" className="nn-btn nn-btn--gold">
            <span>Return to the showroom</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
