import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Nero Noren collects, why, and what stays on your own device.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title={["What we", "hold"]}
        lede="Written to be read. This describes what this site actually does, not what a template says it might do."
      />
      <Prose>
        <h2>What stays on your device</h2>
        <ul>
          <li>Your bag, so it survives a reload.</li>
          <li>Your showroom preference — the hour of the room, and whether you have chosen the flat shop.</li>
          <li>Your trial-room measurements, only if you choose to keep them. They are never sent to us.</li>
        </ul>
        <p>
          All of these live in your browser&apos;s own storage. Clearing your site data removes them.
        </p>

        <h2>What we receive</h2>
        <ul>
          <li>
            When you place an order: your name, email, mobile number and delivery address. We need
            these to send the parcel and to tell you where it is.
          </li>
          <li>
            When you ask the stylist: your question and the recent turns of that conversation, sent
            to our server and on to the model provider to produce an answer.
          </li>
        </ul>

        <h2>Payments</h2>
        <p>
          Card and UPI details are entered in Razorpay&apos;s own window and are never seen by, sent
          to, or stored by Nero Noren. We receive only the result of the payment, which our server
          verifies cryptographically before confirming an order.
        </p>

        <h2>Tracking</h2>
        <p>
          We do not run advertising trackers or third-party analytics on this site. If that ever
          changes, it will be behind a consent banner that asks first, as the Digital Personal Data
          Protection Act requires, and refusing will not restrict anything on this site.
        </p>

        <h2>Keeping and removing</h2>
        <p>
          Order records are kept as long as tax and consumer law requires. Write to us and we will
          tell you what is held about you, correct it, or delete what we are not obliged to keep.
        </p>

        <h2>Asking</h2>
        <p>
          Any question about this page can go to the address on the order confirmation. A real
          person answers.
        </p>
      </Prose>
    </>
  );
}
