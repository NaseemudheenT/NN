import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms on which Nero Noren sells, in plain language.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title="The terms we sell on"
        lede="In plain language, because terms nobody can read protect nobody."
      />
      <Prose>
        <h2>Who you are buying from</h2>
        <p>
          Nero Noren Private Limited, a company registered in India. When you place an order you
          are entering an agreement with us.
        </p>

        <h2>Prices</h2>
        <p>
          Prices are in Indian rupees and include GST. The price you see at checkout is the price
          you pay; there is nothing added afterwards. We hold one price per piece and do not run
          continuous sales.
        </p>
        <p>
          If a price is displayed wrongly through a mistake on our side, we will tell you before
          taking payment and you may cancel. We will not charge you a higher price than the one you
          agreed.
        </p>

        <h2>Your order</h2>
        <p>
          An order is accepted when we confirm it after a verified payment. Occasionally we may not
          be able to fulfil an order — a piece sells out between your adding it and paying, for
          instance. If that happens we refund you in full and tell you why.
        </p>

        <h2>Payment</h2>
        <p>
          Through Razorpay, by UPI, card or netbanking. We verify every payment against
          Razorpay&rsquo;s signature on our own server before creating an order. If a payment
          cannot be verified we do not create an order, and we will help you trace the money if you
          believe it left your account.
        </p>

        <h2>Delivery, exchanges and returns</h2>
        <p>
          Set out on the delivery page, and those terms form part of these. In short: free size
          exchanges within seven days, returns within seven days unworn and unwashed with the
          hangtag on, and we carry the cost of a courier&rsquo;s mistake.
        </p>

        <h2>The clothes</h2>
        <p>
          We describe our garments as accurately as we can, including the fabric, the finished
          measurements and how each piece is cut. Colours can look slightly different between
          screens, which is a limit of screens rather than a change to the cloth.
        </p>
        <p>
          Cotton relaxes and moves with wear and washing. That is the material behaving normally,
          not a fault. A seam that fails, a button that was not properly attached, or a fabric
          flaw is a fault, and we will replace the piece.
        </p>

        <h2>The trial room and the stylist</h2>
        <p>
          Both give considered estimates, not guarantees. The trial room says plainly which numbers
          it estimated. The stylist recommends only from our own range and will not invent an
          offer. If either gets it wrong, the free exchange is there for exactly that reason.
        </p>

        <h2>Using this site</h2>
        <p>
          Please do not attempt to break the site, scrape it wholesale, or use it to send anything
          unlawful. The photographs, text, designs and the NN monogram belong to us.
        </p>

        <h2>Law</h2>
        <p>
          These terms are governed by Indian law, and the courts of Kerala have jurisdiction.
          Nothing here removes a right you have under Indian consumer law — where the two conflict,
          the law wins.
        </p>

        <h2>Talking to us</h2>
        <p>
          If something has gone wrong, write to us before anything else. Most things are settled in
          one message.
        </p>
      </Prose>
    </>
  );
}
