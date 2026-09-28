import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Delivery & returns",
  description: "How Nero Noren orders are processed, delivered, tracked and returned.",
};

export default function DeliveryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Delivery & returns"
        title={["Getting it", "to you"]}
        lede="Plainly stated, with no promises we cannot keep. Exact charges and delivery estimates are shown at checkout before you pay."
      />
      <Prose>
        <h2>Processing</h2>
        <p>
          Orders placed before midday on a working day are packed the same day. Orders placed after
          that, or at a weekend or public holiday, are packed on the next working day. You receive
          an email when the parcel leaves us.
        </p>

        <h2>Delivery</h2>
        <p>
          We ship across India through a tracked courier. The delivery window and the charge for
          your PIN code are calculated and shown at checkout before payment — we do not quote a
          single national figure here, because it would be wrong for most addresses.
        </p>

        <h2>Tracking</h2>
        <p>
          The dispatch email carries the courier and the tracking number. Tracking usually begins to
          update within a day of dispatch.
        </p>

        <h2>Returns</h2>
        <ul>
          <li>Pieces may be returned within fourteen days of delivery.</li>
          <li>They must be unworn and unwashed, with the hangtag still attached.</li>
          <li>Tell us before sending anything back, so the return can be logged against your order.</li>
          <li>Refunds are issued to the original payment method once the piece has been received and checked.</li>
        </ul>

        <h2>Exchanges</h2>
        <p>
          If the size is wrong, say so when you start the return and we will hold the replacement
          size for you while the first piece travels back, subject to stock.
        </p>

        <h2>If something is wrong</h2>
        <p>
          If a piece arrives damaged or is not what you ordered, tell us within seven days with a
          photograph. We arrange the collection and the replacement, and the return costs you
          nothing.
        </p>

        <h2>Before you order</h2>
        <p>
          The <a href="/trial-room">trial room</a> and the <a href="/sizing">size guide</a> exist to
          make returns unnecessary. Using them takes less time than sending a parcel back.
        </p>
      </Prose>
    </>
  );
}
