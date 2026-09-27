import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";
import { ConsentControls } from "@/components/layout/ConsentControls";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Nero Noren collects, what it does not, and how to change your mind. Written under India's Digital Personal Data Protection Act.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="What we know about you"
        lede="Short version: your measurements never leave your device, we count nothing until you agree, and we do not sell anything about you to anybody."
      />
      <Prose>
        <h2>Your choice, now</h2>
        <p>
          You can change your mind about being counted at any time, here:
        </p>
        <ConsentControls />

        <h2>What we never collect</h2>
        <ul>
          <li>
            <strong>Your measurements.</strong> Height, weight and waist are used in your browser
            to work out a size. They are not sent to us. If you tick &ldquo;keep my measurements on
            this device&rdquo;, they are stored in that browser and nowhere else.
          </li>
          <li>
            <strong>Your card details.</strong> These are entered in Razorpay&rsquo;s own payment
            window. We never see them, and they never pass through our servers.
          </li>
          <li>
            <strong>Your IP address, in analytics.</strong> The events we count carry no address,
            no device identifier and no user agent. There is no field for them.
          </li>
        </ul>

        <h2>What we collect when you order</h2>
        <p>
          To send you a parcel we need your name, delivery address, email and mobile number. Your
          email is used for the order confirmation, your mobile for delivery updates. That
          information goes to Shopify, which holds our order records, and to the courier who
          delivers to you. It is not used for anything else and we do not add you to a mailing list
          from a purchase.
        </p>

        <h2>What we count, with your agreement</h2>
        <p>
          Only if you say yes on the banner. We record which parts of the showroom are used, which
          products are looked at, when the trial room is used, and that a question was asked of the
          stylist. Each event carries the hour it happened, rounded to the hour — not the minute —
          which is enough to see a pattern and not enough to follow a person.
        </p>
        <p>
          If you say no, nothing is recorded, and the site works exactly the same. There is no
          degraded version for people who decline.
        </p>

        <h2>The stylist</h2>
        <p>
          What you ask the stylist is sent to Anthropic&rsquo;s Claude API to be answered, and then
          it is gone. We do not store your conversation, and it is not used to train anything.
        </p>

        <h2>Who processes data for us</h2>
        <dl>
          <dt>Shopify</dt>
          <dd>Products, stock and order records</dd>
          <dt>Razorpay</dt>
          <dd>Payments. They see your card details; we do not</dd>
          <dt>Anthropic</dt>
          <dd>The stylist&rsquo;s replies</dd>
          <dt>Supabase</dt>
          <dd>Consented analytics and the owner&rsquo;s own login</dd>
          <dt>Vercel</dt>
          <dd>Hosting</dd>
        </dl>

        <h2>Your rights under the DPDP Act</h2>
        <p>
          Under India&rsquo;s Digital Personal Data Protection Act, 2023 you may ask us what we
          hold about you, ask us to correct it, ask us to erase it, and withdraw a consent you have
          given. Write to us and we will do it. We will not ask you why.
        </p>
        <p>
          We keep order records for as long as the law requires us to, and consented analytics for
          twelve months.
        </p>

        <h2>Changes</h2>
        <p>
          If this page changes in a way that affects what we collect, we will ask for your consent
          again rather than quietly relying on the old one.
        </p>
      </Prose>
    </>
  );
}
